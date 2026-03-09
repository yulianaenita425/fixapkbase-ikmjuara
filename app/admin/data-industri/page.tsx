"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabaseClient"
import * as XLSX from "xlsx"

// 1. Fungsi Pembantu Konversi Tanggal
const formatTanggalIndoKeSistem = (tglString: any) => {
  if (!tglString) return null;
  const str = String(tglString).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  const bulanIndo: Record<string, string> = {
    januari: "01", februari: "02", maret: "03", april: "04", mei: "05", juni: "06",
    juli: "07", agustus: "08", september: "09", oktober: "10", november: "11", desember: "12"
  };

  const part = str.toLowerCase().split(" ");
  if (part.length === 3) {
    const tgl = part[0].padStart(2, '0');
    const bln = bulanIndo[part[1]];
    const thn = part[2];
    if (bln) return `${thn}-${bln}-${tgl}`;
  }
  return str;
};

export default function SistemInformasiIndustriMadiunFinal() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedYear, setSelectedYear] = useState<string>("Semua")
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  const fileInputRef = useRef<HTMLInputElement>(null)

  const wilayahMadiun: Record<string, string[]> = {
    "Taman": ["Taman", "Banjarejo", "Demangan", "Josenan", "Kejuron", "Kuncen", "Manisrejo", "Mojorejo", "Pandean"],
    "Manguharjo": ["Manguharjo", "Madiun Lor", "Nambangan Kidul", "Nambangan Lor", "Ngegong", "Pangongangan", "Patihan", "Sogaten", "Winongo"],
    "Kartoharjo": ["Kartoharjo", "Kanigoro", "Kelun", "Klegen", "Oro-Oro Ombo", "Pilangbango", "Rejomulyo", "Sukosari", "Tawangrejo"]
  };

  const initialState = {
    nib: "", skala_usaha: "", jenis_perusahaan: "", nama_perusahaan: "",
    nama_pemilik: "", alamat_usaha: "", kecamatan: "", kelurahan: "",
    kbli: "", uraian_kbli: "", tingkat_risiko: "", jumlah_investasi: 0,
    jumlah_tenaga_kerja: 0, no_telp: "", email: "", tgl_terbit_proyek: ""
  }
  const [form, setForm] = useState(initialState)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: res } = await supabase
      .from("data_industri_madiun")
      .select("*")
      .eq("is_deleted", false)
      .order("tgl_terbit_proyek", { ascending: false });
    setData(res || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ================= LOGIKA FILTER & PAGINATION =================
  const availableYears = ["Semua", ...Array.from(new Set(data.map(item => 
    item.tgl_terbit_proyek ? item.tgl_terbit_proyek.split("-")[0] : null
  ).filter(Boolean))).sort((a, b) => Number(b) - Number(a))];

  const filteredData = data.filter(item => {
    const matchesSearch = (item.nama_perusahaan || "").toLowerCase().includes(search.toLowerCase()) || 
                          (item.nib || "").includes(search) ||
                          (item.nama_pemilik || "").toLowerCase().includes(search.toLowerCase());
    const matchesYear = selectedYear === "Semua" || (item.tgl_terbit_proyek && item.tgl_terbit_proyek.startsWith(selectedYear));
    return matchesSearch && matchesYear;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const stats = {
    totalProyek: filteredData.length,
    totalInvestasi: filteredData.reduce((acc, curr) => acc + (Number(curr.jumlah_investasi) || 0), 0),
    pelakuUsaha: new Set(filteredData.map(item => String(item.nib).replace(/'/g, "").trim())).size,
  }

  const areaStats = filteredData.reduce((acc: any, curr) => {
    const kec = curr.kecamatan || "Tanpa Kecamatan";
    const kel = curr.kelurahan || "Tanpa Kelurahan";
    if (!acc[kec]) acc[kec] = { total: 0, kelurahan: {} };
    acc[kec].total += 1;
    acc[kec].kelurahan[kel] = (acc[kec].kelurahan[kel] || 0) + 1;
    return acc;
  }, {});

  // ================= AKSI DATA =================
  const handleSave = async () => {
    const cleanedNIB = form.nib.replace(/'/g, "").trim();
    if (cleanedNIB.length < 13) return alert("NIB harus 13 digit!");
    const payload = { ...form, nib: cleanedNIB };
    if (editId) await supabase.from("data_industri_madiun").update(payload).eq("id", editId);
    else await supabase.from("data_industri_madiun").insert([payload]);
    setForm(initialState); setEditId(null); setShowForm(false); fetchData();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus data ini?")) {
      await supabase.from("data_industri_madiun").update({ is_deleted: true }).eq("id", id);
      fetchData();
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Hapus ${selectedIds.length} data terpilih?`)) {
      await supabase.from("data_industri_madiun").update({ is_deleted: true }).in("id", selectedIds);
      setSelectedIds([]);
      fetchData();
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // ================= BARU: EXPORT EXCEL BERDASARKAN TAHUN/FILTER =================
  const handleExportExcel = () => {
    if (filteredData.length === 0) return alert("Tidak ada data untuk diekspor!");
    
    // Memetakan data agar header Excel rapi (Bahasa Indonesia)
    const dataToExport = filteredData.map((item, index) => ({
      No: index + 1,
      NIB: item.nib,
      "Nama Perusahaan": item.nama_perusahaan,
      "Nama Pemilik": item.nama_pemilik,
      "Skala Usaha": item.skala_usaha,
      "Jenis Perusahaan": item.jenis_perusahaan,
      Kecamatan: item.kecamatan,
      Kelurahan: item.kelurahan,
      "Alamat Usaha": item.alamat_usaha,
      KBLI: item.kbli,
      "Uraian KBLI": item.uraian_kbli,
      "Nilai Investasi": item.jumlah_investasi,
      "Tenaga Kerja": item.jumlah_tenaga_kerja,
      "No Telp": item.no_telp,
      Email: item.email,
      "Tanggal Terbit": item.tgl_terbit_proyek,
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Industri");
    
    // Penamaan file dinamis berdasarkan tahun
    const fileName = `Data_Industri_Madiun_${selectedYear.replace(/\s/g, "_")}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleImportExcel = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const wb = XLSX.read(evt.target?.result, { type: "binary" });
      const rawData: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      const cleaned = rawData.map(item => ({
        ...item,
        nib: String(item.nib || "").replace(/'/g, "").trim(),
        tgl_terbit_proyek: formatTanggalIndoKeSistem(item.tgl_terbit_proyek),
        jumlah_investasi: Number(item.jumlah_investasi || 0)
      }));
      await supabase.from("data_industri_madiun").insert(cleaned);
      fetchData();
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans text-slate-900">
      
      {/* HEADER */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-blue-900 uppercase tracking-tighter">SIM Industri Madiun</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">Data Terfilter: {stats.totalProyek} Proyek</p>
        </div>
        <div className="flex flex-wrap gap-2">
            <select className="bg-white border-2 border-blue-100 px-4 py-2 rounded-xl font-bold text-blue-600 outline-none text-xs" value={selectedYear} onChange={e => {setSelectedYear(e.target.value); setCurrentPage(1)}}>
                {availableYears.map(y => <option key={y} value={y ?? "Unknown"}>{y === "Semua" ? "📅 Semua Tahun" : `📅 Tahun ${y}`}</option>)}
            </select>
            <button onClick={handleExportExcel} className="bg-white border-2 border-emerald-100 text-emerald-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase hover:bg-emerald-50 transition">📊 Export Excel</button>
            <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm(initialState); }} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-black shadow-lg hover:bg-slate-900 transition text-xs uppercase">➕ Tambah Data</button>
            <input type="file" ref={fileInputRef} onChange={handleImportExcel} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase shadow-md">📥 Import</button>
        </div>
      </div>

      {/* DASHBOARD & AREA STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="bg-blue-600 p-6 rounded-[2rem] text-white shadow-xl">
                <p className="text-[10px] font-black opacity-70 uppercase mb-1">Total Investasi</p>
                <p className="text-xl font-black leading-none">Rp {stats.totalInvestasi.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border-2 border-blue-50 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Pelaku Usaha (NIB Unik)</p>
                <p className="text-3xl font-black text-blue-900">{stats.pelakuUsaha}</p>
            </div>
        </div>

        <div className="lg:col-span-3 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-4">Penyebaran Wilayah (Unit Kerja)</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.keys(wilayahMadiun).map(kec => (
                    <div key={kec} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-black text-blue-800 text-xs uppercase">{kec}</span>
                            <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-[10px] font-black">{areaStats[kec]?.total || 0}</span>
                        </div>
                        <div className="space-y-1 max-h-24 overflow-y-auto pr-2 custom-scrollbar">
                            {wilayahMadiun[kec].map(kel => (
                                <div key={kel} className="flex justify-between text-[9px] text-slate-500 font-bold border-b border-dotted border-slate-200">
                                    <span>{kel}</span>
                                    <span className="text-slate-900">{areaStats[kec]?.kelurahan[kel] || 0}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* ACTION BAR SELECTION */}
      {selectedIds.length > 0 && (
        <div className="mb-4 p-4 bg-rose-600 rounded-2xl flex justify-between items-center shadow-lg animate-pulse">
            <p className="text-white font-black text-xs uppercase tracking-widest">⚠️ {selectedIds.length} Data terpilih untuk dihapus masal</p>
            <button onClick={handleBulkDelete} className="bg-white text-rose-600 px-6 py-2 rounded-xl font-black text-[10px] uppercase hover:bg-slate-100 transition">Eksekusi Hapus</button>
        </div>
      )}

      {/* FORM INPUT */}
      {showForm && (
        <div className="mb-8 bg-white p-8 rounded-[3rem] shadow-2xl border-4 border-blue-50">
            <h2 className="font-black text-blue-900 uppercase mb-6 italic underline">Formulir Data Industri & Proyek</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-[10px] font-bold">
                <div className="flex flex-col gap-1">
                    <label className="text-slate-400 uppercase">Nomor NIB</label>
                    <input className="p-2.5 bg-slate-50 border rounded-xl" value={form.nib} onChange={e => setForm({...form, nib: e.target.value})} placeholder="Wajib 13 Digit" />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-slate-400 uppercase">Skala Usaha</label>
                    <select className="p-2.5 bg-slate-50 border rounded-xl" value={form.skala_usaha} onChange={e => setForm({...form, skala_usaha: e.target.value})}>
                        <option value="">Pilih Skala</option><option value="Mikro">Mikro</option><option value="Kecil">Kecil</option><option value="Menengah">Menengah</option><option value="Besar">Besar</option>
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-slate-400 uppercase">Jenis</label>
                    <input className="p-2.5 bg-slate-50 border rounded-xl" value={form.jenis_perusahaan} onChange={e => setForm({...form, jenis_perusahaan: e.target.value})} placeholder="PT/CV/Perorangan" />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-slate-400 uppercase">Nama Pemilik/Pimpinan</label>
                    <input className="p-2.5 bg-slate-50 border rounded-xl" value={form.nama_pemilik} onChange={e => setForm({...form, nama_pemilik: e.target.value})} />
                </div>
                <div className="md:col-span-2 flex flex-col gap-1">
                    <label className="text-slate-400 uppercase font-black text-blue-600">Nama Perusahaan / Unit Usaha</label>
                    <input className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl font-black uppercase" value={form.nama_perusahaan} onChange={e => setForm({...form, nama_perusahaan: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-slate-400 uppercase">Kecamatan</label>
                    <select className="p-2.5 bg-slate-50 border rounded-xl" value={form.kecamatan} onChange={e => setForm({...form, kecamatan: e.target.value, kelurahan: ""})}>
                        <option value="">Pilih</option>{Object.keys(wilayahMadiun).map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-slate-400 uppercase">Kelurahan</label>
                    <select className="p-2.5 bg-slate-50 border rounded-xl" disabled={!form.kecamatan} value={form.kelurahan} onChange={e => setForm({...form, kelurahan: e.target.value})}>
                        <option value="">Pilih</option>{form.kecamatan && wilayahMadiun[form.kecamatan].map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                </div>
                <div className="md:col-span-4 flex flex-col gap-1">
                    <label className="text-slate-400 uppercase">Alamat Lengkap Unit Usaha</label>
                    <input className="p-2.5 bg-slate-50 border rounded-xl" value={form.alamat_usaha} onChange={e => setForm({...form, alamat_usaha: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-slate-400 uppercase font-black text-emerald-600">Nilai Investasi (Rp)</label>
                    <input type="number" className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl font-bold" value={form.jumlah_investasi} onChange={e => setForm({...form, jumlah_investasi: Number(e.target.value)})} />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-slate-400 uppercase">KBLI (5 Digit)</label>
                    <input className="p-2.5 bg-slate-50 border rounded-xl" value={form.kbli} onChange={e => setForm({...form, kbli: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-slate-400 uppercase">Kontak/No.Telp</label>
                    <input className="p-2.5 bg-slate-50 border rounded-xl" value={form.no_telp} onChange={e => setForm({...form, no_telp: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-slate-400 uppercase">Tgl Terbit</label>
                    <input type="date" className="p-2.5 bg-slate-50 border rounded-xl" value={form.tgl_terbit_proyek} onChange={e => setForm({...form, tgl_terbit_proyek: e.target.value})} />
                </div>
            </div>
            <div className="mt-8 flex gap-3">
                <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-900 transition shadow-xl">Simpan Data Ke Database</button>
                <button onClick={() => setShowForm(false)} className="px-10 bg-slate-200 text-slate-500 py-4 rounded-2xl font-black uppercase text-[10px]">Batalkan</button>
            </div>
        </div>
      )}

      {/* TABLE AREA */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border overflow-hidden">
        <div className="p-6 border-b flex items-center bg-white">
            <input type="text" placeholder="🔍 Cari berdasarkan NIB, Perusahaan, atau Nama Pemilik..." className="w-full p-4 rounded-2xl border-none ring-1 ring-slate-100 bg-slate-50 font-bold focus:ring-2 ring-blue-500 outline-none transition-all text-sm" value={search} onChange={e => {setSearch(e.target.value); setCurrentPage(1)}} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-tighter border-b">
              <tr>
                <th className="px-6 py-4"><input type="checkbox" onChange={e => setSelectedIds(e.target.checked ? currentItems.map(i => i.id) : [])} /></th>
                <th className="px-2 py-4">No</th>
                <th className="px-4 py-4">Informasi Utama (NIB & Nama)</th>
                <th className="px-4 py-4">Pemilik & Legalitas</th>
                <th className="px-4 py-4">Lokasi / Wilayah</th>
                <th className="px-4 py-4">Investasi & KBLI</th>
                <th className="px-4 py-4">Kontak</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold uppercase text-[10px]">
              {currentItems.map((item, idx) => (
                <tr key={item.id} className={`hover:bg-blue-50/30 transition-all ${selectedIds.includes(item.id) ? 'bg-blue-50' : ''}`}>
                  <td className="px-6 py-4"><input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} /></td>
                  <td className="px-2 py-4 text-slate-300">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                  <td className="px-4 py-4">
                    <div className="text-blue-900 font-black text-xs">{item.nama_perusahaan}</div>
                    <div className="text-[9px] text-slate-400 font-mono italic">NIB: {item.nib}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-slate-700">{item.nama_pemilik}</div>
                    <div className="text-[8px] flex gap-1 mt-1">
                        <span className="bg-blue-100 text-blue-600 px-1.5 rounded">{item.skala_usaha}</span>
                        <span className="bg-slate-100 text-slate-500 px-1.5 rounded">{item.jenis_perusahaan}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="truncate w-48 text-slate-500 font-normal leading-tight">{item.alamat_usaha}</div>
                    <div className="text-[9px] text-indigo-600 font-black mt-1">KEC. {item.kecamatan} - {item.kelurahan}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-emerald-600 text-[11px]">Rp {Number(item.jumlah_investasi).toLocaleString('id-ID')}</div>
                    <div className="text-[9px] text-slate-400 font-normal">KBLI: <span className="text-slate-800 font-black">{item.kbli}</span></div>
                  </td>
                  <td className="px-4 py-4 font-normal text-slate-500 lowercase">{item.no_telp || '-'}</td>
                  <td className="px-6 py-4 text-right flex justify-end gap-3">
                     <button onClick={() => { setForm(item); setEditId(item.id); setShowForm(true); }} className="text-blue-600 hover:scale-125 transition-transform p-2 bg-blue-50 rounded-lg">✏️</button>
                     <button onClick={() => handleDelete(item.id)} className="text-rose-400 hover:text-rose-600 hover:scale-125 transition-transform p-2 bg-rose-50 rounded-lg">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredData.length === 0 && <div className="p-20 text-center font-black text-slate-200 uppercase tracking-widest">Data Tidak Ditemukan</div>}
        </div>
        
        {/* PAGINATION CONTROLS */}
        <div className="p-6 bg-slate-50 border-t flex justify-between items-center">
            <p className="text-[10px] font-bold text-slate-400">Menampilkan {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredData.length)} dari {filteredData.length} Data</p>
            <div className="flex gap-1">
                <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="px-4 py-2 bg-white border rounded-xl font-black text-[10px] disabled:opacity-30 hover:bg-slate-100 transition"
                >SEBELUMNYA</button>
                {[...Array(totalPages)].map((_, i) => (
                    <button 
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-8 h-8 rounded-xl font-black text-[10px] transition ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-lg' : 'bg-white border text-slate-400 hover:bg-slate-50'}`}
                    >{i + 1}</button>
                )).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))}
                <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="px-4 py-2 bg-white border rounded-xl font-black text-[10px] disabled:opacity-30 hover:bg-slate-100 transition"
                >BERIKUTNYA</button>
            </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  )
}