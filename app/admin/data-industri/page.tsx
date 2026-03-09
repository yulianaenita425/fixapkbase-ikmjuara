"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabaseClient"
import * as XLSX from "xlsx"

// 1. Fungsi Pembantu Konversi Tanggal (Indo ke Sistem)
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
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
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
      .order("created_at", { ascending: false });
    setData(res || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const stats = {
    totalProyek: data.length,
    totalInvestasi: data.reduce((acc, curr) => acc + (Number(curr.jumlah_investasi) || 0), 0),
    pelakuUsaha: new Set(data.map(item => String(item.nib).replace(/'/g, "").trim())).size,
    krt: data.filter(i => i.kecamatan === "Kartoharjo").length,
    mng: data.filter(i => i.kecamatan === "Manguharjo").length,
    tmn: data.filter(i => i.kecamatan === "Taman").length
  }

  const downloadTemplate = () => {
    const header = [
      ["nib", "skala_usaha", "jenis_perusahaan", "nama_perusahaan", "nama_pemilik", "alamat_usaha", "kecamatan", "kelurahan", "kbli", "uraian_kbli", "tingkat_risiko", "jumlah_investasi", "jumlah_tenaga_kerja", "no_telp", "email", "tgl_terbit_proyek"],
      ["'0123456789012", "Mikro", "PT", "Contoh Usaha Madiun", "Budi Santoso", "Jl. Pahlawan No. 1", "Taman", "Pandean", "10711", "Industri Roti", "Rendah", 50000000, 5, "08123456789", "email@contoh.com", "31 Januari 2026"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(header);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Import");
    XLSX.writeFile(wb, "Template_Data_Industri_Madiun.xlsx");
  }

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawData: any[] = XLSX.utils.sheet_to_json(ws);

      const cleanedData = rawData.map(item => ({
        ...item,
        nib: String(item.nib || "").replace(/'/g, "").trim(),
        tgl_terbit_proyek: formatTanggalIndoKeSistem(item.tgl_terbit_proyek),
        jumlah_investasi: Number(item.jumlah_investasi || 0),
        jumlah_tenaga_kerja: Number(item.jumlah_tenaga_kerja || 0)
      }));

      if (confirm(`Impor ${cleanedData.length} data sekarang?`)) {
        const { error } = await supabase.from("data_industri_madiun").insert(cleanedData);
        if (error) alert("Gagal: " + error.message);
        else { alert("Berhasil diimpor!"); fetchData(); }
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSave = async () => {
    const cleanedNIB = form.nib.replace(/'/g, "").trim();
    if (cleanedNIB.length < 13) return alert("NIB harus 13 digit!");
    
    const payload = { ...form, nib: cleanedNIB };
    if (editId) await supabase.from("data_industri_madiun").update(payload).eq("id", editId);
    else await supabase.from("data_industri_madiun").insert([payload]);
    
    setForm(initialState); setEditId(null); setShowForm(false); fetchData();
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-900">
      
      {/* HEADER */}
      <div className="mb-10 flex flex-col lg:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-blue-900 uppercase">Pusat Data Industri & Proyek</h1>
          <p className="text-slate-500 font-bold text-xs tracking-widest uppercase">Database Mandiri Kota Madiun</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={downloadTemplate} className="bg-white border-2 border-slate-200 px-5 py-3 rounded-2xl font-black text-[11px] hover:bg-slate-100 transition">📝 Template</button>
          <input type="file" ref={fileInputRef} onChange={handleImportExcel} className="hidden" accept=".xlsx,.xls" />
          <button onClick={() => fileInputRef.current?.click()} className="bg-emerald-50 text-emerald-700 border-2 border-emerald-100 px-5 py-3 rounded-2xl font-black text-[11px] hover:bg-emerald-600 hover:text-white transition">📥 Import Excel</button>
          <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm(initialState); }} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg hover:bg-slate-900 transition active:scale-95">➕ Tambah Data</button>
        </div>
      </div>

      {/* DASHBOARD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border-t-8 border-slate-900">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Keseluruhan Data</p>
          <p className="text-4xl font-black text-slate-900">{stats.totalProyek}</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border-t-8 border-blue-600">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Pelaku Usaha (NIB Unik)</p>
          <p className="text-4xl font-black text-blue-600">{stats.pelakuUsaha}</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border-t-8 border-emerald-500">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Investasi</p>
          <p className="text-xl font-black text-emerald-600">Rp {stats.totalInvestasi.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border-t-8 border-amber-500">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Unit Per Kecamatan</p>
          <div className="flex gap-2 mt-2 font-black text-[9px] text-white uppercase">
            <span className="bg-amber-500 px-2 py-1 rounded">KRT: {stats.krt}</span>
            <span className="bg-indigo-500 px-2 py-1 rounded">MNG: {stats.mng}</span>
            <span className="bg-rose-500 px-2 py-1 rounded">TMN: {stats.tmn}</span>
          </div>
        </div>
      </div>

      {/* FORM LENGKAP (17 KOLOM) */}
      {showForm && (
        <div className="mb-10 bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 animate-in slide-in-from-top-4 duration-500">
          <h2 className="text-xl font-black mb-8 text-blue-900 uppercase italic border-b pb-4">📝 Form Isian Data Industri Lengkap</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-[11px] font-bold">
            
            {/* Bagian 1: Identitas Utama */}
            <div className="flex flex-col gap-1">
                <label className="uppercase text-slate-400">NIB (13 Digit)</label>
                <input className="p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 ring-blue-500" maxLength={13} value={form.nib} onChange={e => setForm({...form, nib: e.target.value.replace(/[^0-9]/g, "")})} placeholder="Wajib 13 Digit" />
            </div>
            <div className="flex flex-col gap-1">
                <label className="uppercase text-slate-400">Skala Usaha</label>
                <select className="p-3 bg-slate-50 border rounded-xl" value={form.skala_usaha} onChange={e => setForm({...form, skala_usaha: e.target.value})}>
                    <option value="">Pilih Skala</option><option value="Mikro">Mikro</option><option value="Kecil">Kecil</option><option value="Menengah">Menengah</option><option value="Besar">Besar</option>
                </select>
            </div>
            <div className="flex flex-col gap-1">
                <label className="uppercase text-slate-400">Jenis Perusahaan</label>
                <input className="p-3 bg-slate-50 border rounded-xl" value={form.jenis_perusahaan} onChange={e => setForm({...form, jenis_perusahaan: e.target.value})} placeholder="Contoh: PT, CV, Perorangan" />
            </div>
            <div className="flex flex-col gap-1">
                <label className="uppercase text-slate-400">Nama Pemilik</label>
                <input className="p-3 bg-slate-50 border rounded-xl" value={form.nama_pemilik} onChange={e => setForm({...form, nama_pemilik: e.target.value})} />
            </div>

            {/* Bagian 2: Nama & Lokasi */}
            <div className="md:col-span-2 flex flex-col gap-1">
                <label className="uppercase text-slate-400">Nama Perusahaan / Proyek</label>
                <input className="p-3 bg-slate-50 border rounded-xl uppercase font-black" value={form.nama_perusahaan} onChange={e => setForm({...form, nama_perusahaan: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1">
                <label className="uppercase text-slate-400">Kecamatan</label>
                <select className="p-3 bg-blue-50 border border-blue-100 rounded-xl" value={form.kecamatan} onChange={e => setForm({...form, kecamatan: e.target.value, kelurahan: ""})}>
                    <option value="">Pilih Kecamatan</option>
                    {Object.keys(wilayahMadiun).map(k => <option key={k} value={k}>{k}</option>)}
                </select>
            </div>
            <div className="flex flex-col gap-1">
                <label className="uppercase text-slate-400">Kelurahan</label>
                <select className="p-3 bg-blue-50 border border-blue-100 rounded-xl disabled:opacity-30" disabled={!form.kecamatan} value={form.kelurahan} onChange={e => setForm({...form, kelurahan: e.target.value})}>
                    <option value="">Pilih Kelurahan</option>
                    {form.kecamatan && wilayahMadiun[form.kecamatan].map(l => <option key={l} value={l}>{l}</option>)}
                </select>
            </div>
            <div className="md:col-span-4 flex flex-col gap-1">
                <label className="uppercase text-slate-400">Alamat Lengkap Usaha</label>
                <input className="p-3 bg-slate-50 border rounded-xl" value={form.alamat_usaha} onChange={e => setForm({...form, alamat_usaha: e.target.value})} />
            </div>

            {/* Bagian 3: Teknis & KBLI */}
            <div className="flex flex-col gap-1">
                <label className="uppercase text-slate-400">KBLI</label>
                <input className="p-3 bg-slate-50 border rounded-xl" value={form.kbli} onChange={e => setForm({...form, kbli: e.target.value})} />
            </div>
            <div className="md:col-span-2 flex flex-col gap-1">
                <label className="uppercase text-slate-400">Uraian KBLI</label>
                <input className="p-3 bg-slate-50 border rounded-xl" value={form.uraian_kbli} onChange={e => setForm({...form, uraian_kbli: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1">
                <label className="uppercase text-slate-400">Tingkat Risiko</label>
                <select className="p-3 bg-slate-50 border rounded-xl" value={form.tingkat_risiko} onChange={e => setForm({...form, tingkat_risiko: e.target.value})}>
                    <option value="">Pilih Risiko</option><option value="Rendah">Rendah</option><option value="Menengah Rendah">Menengah Rendah</option><option value="Menengah Tinggi">Menengah Tinggi</option><option value="Tinggi">Tinggi</option>
                </select>
            </div>

            {/* Bagian 4: Angka & Kontak */}
            <div className="flex flex-col gap-1">
                <label className="uppercase text-slate-400">Jumlah Investasi (Rp)</label>
                <input type="number" className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl font-bold text-emerald-700" value={form.jumlah_investasi} onChange={e => setForm({...form, jumlah_investasi: Number(e.target.value)})} />
            </div>
            <div className="flex flex-col gap-1">
                <label className="uppercase text-slate-400">Jumlah Tenaga Kerja</label>
                <input type="number" className="p-3 bg-slate-50 border rounded-xl" value={form.jumlah_tenaga_kerja} onChange={e => setForm({...form, jumlah_tenaga_kerja: Number(e.target.value)})} />
            </div>
            <div className="flex flex-col gap-1">
                <label className="uppercase text-slate-400">Nomor Telp</label>
                <input className="p-3 bg-slate-50 border rounded-xl" value={form.no_telp} onChange={e => setForm({...form, no_telp: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1">
                <label className="uppercase text-slate-400">Email</label>
                <input type="email" className="p-3 bg-slate-50 border rounded-xl" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1">
                <label className="uppercase text-slate-400">Tgl Terbit Proyek</label>
                <input type="date" className="p-3 bg-amber-50 border border-amber-100 rounded-xl" value={form.tgl_terbit_proyek} onChange={e => setForm({...form, tgl_terbit_proyek: e.target.value})} />
            </div>
          </div>

          <div className="mt-10 flex gap-4">
             <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-slate-900 transition shadow-xl">SIMPAN DATA INDUSTRI</button>
             <button onClick={() => setShowForm(false)} className="px-10 bg-slate-200 text-slate-600 py-4 rounded-2xl font-black uppercase">Batal</button>
          </div>
        </div>
      )}

      {/* TABLE DATA */}
      <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
        <div className="p-8 bg-white border-b flex items-center">
            <input type="text" placeholder="🔍 Cari NIB, Nama Perusahaan, atau Nama Pemilik..." className="w-full p-4 rounded-3xl border-none ring-1 ring-slate-100 bg-slate-50 font-bold focus:ring-2 ring-blue-500 outline-none" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b">
              <tr>
                <th className="px-8 py-4">No</th>
                <th className="px-4 py-4">Perusahaan / NIB</th>
                <th className="px-4 py-4">Skala / Risiko</th>
                <th className="px-4 py-4">Wilayah</th>
                <th className="px-4 py-4">Investasi & TK</th>
                <th className="px-8 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold uppercase text-[10px]">
              {data.filter(i => 
                (i.nama_perusahaan || "").toLowerCase().includes(search.toLowerCase()) || 
                (i.nib || "").includes(search) ||
                (i.nama_pemilik || "").toLowerCase().includes(search.toLowerCase())
              ).map((item, idx) => (
                <tr key={idx} className="hover:bg-blue-50/50 transition duration-300">
                  <td className="px-8 py-5 text-slate-300">{idx + 1}</td>
                  <td className="px-4 py-5">
                    <div className="text-blue-900 font-black">{item.nama_perusahaan}</div>
                    <div className="text-[9px] text-slate-400 tracking-tighter font-mono italic">NIB: {item.nib}</div>
                  </td>
                  <td className="px-4 py-5">
                    <div className="text-slate-600">{item.skala_usaha}</div>
                    <div className="text-[8px] opacity-50">Risiko: {item.tingkat_risiko}</div>
                  </td>
                  <td className="px-4 py-5">
                    <div className="text-slate-700">{item.kecamatan}</div>
                    <div className="text-[8px] font-normal text-slate-400">Kel. {item.kelurahan}</div>
                  </td>
                  <td className="px-4 py-5">
                    <div className="text-emerald-600">Rp {Number(item.jumlah_investasi).toLocaleString('id-ID')}</div>
                    <div className="text-[8px] font-normal text-slate-400">TK: {item.jumlah_tenaga_kerja} Orang</div>
                  </td>
                  <td className="px-8 py-5 text-right flex justify-end gap-1">
                     <button onClick={() => { setForm(item); setEditId(item.id); setShowForm(true); }} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition">✏️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}