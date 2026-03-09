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

  // ================= LOGIKA FILTER & TAHUN =================
  const availableYears = ["Semua", ...Array.from(new Set(data.map(item => 
    item.tgl_terbit_proyek ? item.tgl_terbit_proyek.split("-")[0] : null
  ).filter(Boolean))).sort((a, b) => Number(b) - Number(a))];

  const filteredData = data.filter(item => {
    const matchesSearch = (item.nama_perusahaan || "").toLowerCase().includes(search.toLowerCase()) || 
                          (item.nib || "").includes(search);
    const matchesYear = selectedYear === "Semua" || (item.tgl_terbit_proyek && item.tgl_terbit_proyek.startsWith(selectedYear));
    return matchesSearch && matchesYear;
  });

  const stats = {
    totalProyek: filteredData.length,
    totalInvestasi: filteredData.reduce((acc, curr) => acc + (Number(curr.jumlah_investasi) || 0), 0),
    pelakuUsaha: new Set(filteredData.map(item => String(item.nib).replace(/'/g, "").trim())).size,
  }

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

  const downloadTemplate = () => {
    const header = [["nib", "skala_usaha", "jenis_perusahaan", "nama_perusahaan", "nama_pemilik", "alamat_usaha", "kecamatan", "kelurahan", "kbli", "uraian_kbli", "tingkat_risiko", "jumlah_investasi", "jumlah_tenaga_kerja", "no_telp", "email", "tgl_terbit_proyek"]];
    const ws = XLSX.utils.aoa_to_sheet(header);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Template_Madiun.xlsx");
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
      
      {/* HEADER & TOP ACTIONS */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-blue-900 uppercase tracking-tighter">Database Industri Madiun</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tahun Anggaran: {selectedYear}</p>
        </div>
        <div className="flex flex-wrap gap-2">
            <select className="bg-white border-2 border-blue-100 px-4 py-2 rounded-xl font-bold text-blue-600 outline-none" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
                {availableYears.map(y => <option key={y} value={y ?? "Unknown"}>{y === "Semua" ? "📅 Semua Tahun" : `📅 Tahun ${y}`}</option>)}
            </select>
            <button onClick={downloadTemplate} className="bg-white border p-2 rounded-xl hover:bg-slate-100 transition">📝 Template</button>
            <input type="file" ref={fileInputRef} onChange={handleImportExcel} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl font-black text-xs uppercase hover:bg-emerald-600 hover:text-white transition">📥 Import</button>
            <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm(initialState); }} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-black shadow-lg hover:bg-slate-900 transition">➕ Tambah</button>
        </div>
      </div>

      {/* DASHBOARD ANALYTICS (Filtered) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border-l-4 border-blue-600">
          <p className="text-[10px] font-black text-slate-400 uppercase">Proyek Terdaftar ({selectedYear})</p>
          <p className="text-3xl font-black">{stats.totalProyek}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border-l-4 border-indigo-600">
          <p className="text-[10px] font-black text-slate-400 uppercase">Pelaku Usaha Unik ({selectedYear})</p>
          <p className="text-3xl font-black text-indigo-600">{stats.pelakuUsaha}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border-l-4 border-emerald-500">
          <p className="text-[10px] font-black text-slate-400 uppercase">Nilai Investasi ({selectedYear})</p>
          <p className="text-2xl font-black text-emerald-600">Rp {stats.totalInvestasi.toLocaleString('id-ID')}</p>
        </div>
      </div>

      {/* MULTI DELETE ACTION BAR */}
      {selectedIds.length > 0 && (
        <div className="mb-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex justify-between items-center animate-bounce">
            <p className="text-rose-700 font-bold text-sm">⚠️ {selectedIds.length} data dipilih untuk dihapus.</p>
            <button onClick={handleBulkDelete} className="bg-rose-600 text-white px-6 py-2 rounded-xl font-black text-xs uppercase shadow-lg">Hapus Massal Sekarang</button>
        </div>
      )}

      {/* FORM AREA (Tetap 17 Kolom) */}
      {showForm && (
        <div className="mb-8 bg-white p-8 rounded-[2rem] shadow-xl border border-blue-50">
            <h2 className="font-black text-blue-900 uppercase mb-6 italic underline">Input Data Industri Baru</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-[10px] font-bold">
                <div className="flex flex-col gap-1">
                    <label className="text-slate-400 uppercase">NIB</label>
                    <input className="p-2 bg-slate-50 border rounded-lg" value={form.nib} onChange={e => setForm({...form, nib: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-slate-400 uppercase">Skala Usaha</label>
                    <select className="p-2 bg-slate-50 border rounded-lg" value={form.skala_usaha} onChange={e => setForm({...form, skala_usaha: e.target.value})}>
                        <option value="">Pilih</option><option value="Mikro">Mikro</option><option value="Kecil">Kecil</option><option value="Menengah">Menengah</option><option value="Besar">Besar</option>
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-slate-400 uppercase">Jenis Perusahaan</label>
                    <input className="p-2 bg-slate-50 border rounded-lg" value={form.jenis_perusahaan} onChange={e => setForm({...form, jenis_perusahaan: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-slate-400 uppercase">Nama Pemilik</label>
                    <input className="p-2 bg-slate-50 border rounded-lg" value={form.nama_pemilik} onChange={e => setForm({...form, nama_pemilik: e.target.value})} />
                </div>
                <div className="md:col-span-2 flex flex-col gap-1">
                    <label className="text-slate-400 uppercase">Nama Perusahaan / Proyek</label>
                    <input className="p-2 bg-slate-50 border rounded-lg font-black uppercase" value={form.nama_perusahaan} onChange={e => setForm({...form, nama_perusahaan: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-slate-400 uppercase">Kecamatan</label>
                    <select className="p-2 bg-blue-50 border rounded-lg" value={form.kecamatan} onChange={e => setForm({...form, kecamatan: e.target.value, kelurahan: ""})}>
                        <option value="">Pilih</option>{Object.keys(wilayahMadiun).map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-slate-400 uppercase">Kelurahan</label>
                    <select className="p-2 bg-blue-50 border rounded-lg" disabled={!form.kecamatan} value={form.kelurahan} onChange={e => setForm({...form, kelurahan: e.target.value})}>
                        <option value="">Pilih</option>{form.kecamatan && wilayahMadiun[form.kecamatan].map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                </div>
                <div className="md:col-span-4 flex flex-col gap-1">
                    <label className="text-slate-400 uppercase">Alamat Usaha</label>
                    <input className="p-2 bg-slate-50 border rounded-lg" value={form.alamat_usaha} onChange={e => setForm({...form, alamat_usaha: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-slate-400 uppercase">KBLI</label>
                    <input className="p-2 bg-slate-50 border rounded-lg" value={form.kbli} onChange={e => setForm({...form, kbli: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-slate-400 uppercase">No Telp</label>
                    <input className="p-2 bg-slate-50 border rounded-lg" value={form.no_telp} onChange={e => setForm({...form, no_telp: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-slate-400 uppercase">Investasi (Rp)</label>
                    <input type="number" className="p-2 bg-emerald-50 border rounded-lg" value={form.jumlah_investasi} onChange={e => setForm({...form, jumlah_investasi: Number(e.target.value)})} />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-slate-400 uppercase">Tgl Terbit</label>
                    <input type="date" className="p-2 bg-amber-50 border rounded-lg" value={form.tgl_terbit_proyek} onChange={e => setForm({...form, tgl_terbit_proyek: e.target.value})} />
                </div>
            </div>
            <div className="mt-6 flex gap-2">
                <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-black">SIMPAN DATA</button>
                <button onClick={() => setShowForm(false)} className="px-6 bg-slate-200 rounded-xl font-black uppercase text-[10px]">Batal</button>
            </div>
        </div>
      )}

      {/* TABLE DATA DENGAN SISTEM SELEKSI */}
      <div className="bg-white rounded-[2rem] shadow-sm border overflow-hidden">
        <div className="p-6 border-b flex items-center bg-slate-50/50">
            <input type="text" placeholder="🔍 Cari berdasarkan NIB atau Nama Perusahaan..." className="w-full p-3 rounded-xl border-none ring-1 ring-slate-200 font-bold focus:ring-2 ring-blue-500 outline-none transition-all" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-tighter border-b">
              <tr>
                <th className="px-6 py-4"><input type="checkbox" onChange={e => setSelectedIds(e.target.checked ? filteredData.map(i => i.id) : [])} /></th>
                <th className="px-4 py-4">No</th>
                <th className="px-4 py-4">NIB / Perusahaan</th>
                <th className="px-4 py-4">Skala / Jenis</th>
                <th className="px-4 py-4">Alamat & Wilayah</th>
                <th className="px-4 py-4">Investasi / KBLI</th>
                <th className="px-4 py-4">Kontak</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold uppercase text-[10px]">
              {filteredData.map((item, idx) => (
                <tr key={item.id} className={`hover:bg-blue-50/30 transition ${selectedIds.includes(item.id) ? 'bg-blue-50' : ''}`}>
                  <td className="px-6 py-4"><input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} /></td>
                  <td className="px-4 py-4 text-slate-300">{idx + 1}</td>
                  <td className="px-4 py-4">
                    <div className="text-blue-900 font-black">{item.nama_perusahaan}</div>
                    <div className="text-[9px] text-slate-400 font-mono italic">NIB: {item.nib}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-slate-600">{item.skala_usaha}</div>
                    <div className="text-[8px] px-2 bg-slate-100 rounded inline-block">{item.jenis_perusahaan}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="truncate w-40 text-slate-500 font-normal">{item.alamat_usaha}</div>
                    <div className="text-[9px] text-blue-600">KEC. {item.kecamatan} - {item.kelurahan}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-emerald-600">Rp {Number(item.jumlah_investasi).toLocaleString('id-ID')}</div>
                    <div className="text-[8px] font-normal text-slate-400 italic">KBLI: {item.kbli}</div>
                  </td>
                  <td className="px-4 py-4 font-normal text-slate-500 lowercase">{item.no_telp || '-'}</td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                     <button onClick={() => { setForm(item); setEditId(item.id); setShowForm(true); }} className="text-blue-600 hover:scale-110 transition">✏️</button>
                     <button onClick={() => handleDelete(item.id)} className="text-rose-400 hover:text-rose-600 hover:scale-110 transition">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredData.length === 0 && <div className="p-20 text-center font-black text-slate-200 uppercase tracking-widest">Data Tidak Ditemukan</div>}
        </div>
      </div>
    </div>
  )
}