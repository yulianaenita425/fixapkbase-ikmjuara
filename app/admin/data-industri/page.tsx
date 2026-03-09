"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabaseClient"
import * as XLSX from "xlsx"

export default function SistemInformasiIndustriMadiunFinal() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Konfigurasi Wilayah
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

  // ================= LOGIKA DASHBOARD =================
  const stats = {
    totalProyek: data.length,
    totalInvestasi: data.reduce((acc, curr) => acc + (Number(curr.jumlah_investasi) || 0), 0),
    // Logika Pembersihan NIB: Menghapus tanda petik (') dan spasi agar NIB unik terhitung akurat
    pelakuUsaha: new Set(data.map(item => String(item.nib).replace(/'/g, "").trim())).size,
    krt: data.filter(i => i.kecamatan === "Kartoharjo").length,
    mng: data.filter(i => i.kecamatan === "Manguharjo").length,
    tmn: data.filter(i => i.kecamatan === "Taman").length
  }

  // ================= DOWNLOAD TEMPLATE EXCEL =================
  const downloadTemplate = () => {
    const header = [
      ["nib", "skala_usaha", "jenis_perusahaan", "nama_perusahaan", "nama_pemilik", "alamat_usaha", "kecamatan", "kelurahan", "kbli", "uraian_kbli", "tingkat_risiko", "jumlah_investasi", "jumlah_tenaga_kerja", "no_telp", "email", "tgl_terbit_proyek"],
      ["'0123456789012", "Mikro", "PT", "Contoh Usaha Madiun", "Budi Santoso", "Jl. Pahlawan No. 1", "Taman", "Pandean", "10711", "Industri Roti", "Rendah", 50000000, 5, "08123456789", "email@contoh.com", "2024-01-01"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(header);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Import");
    XLSX.writeFile(wb, "Template_Data_Industri_Madiun.xlsx");
  }

  // ================= IMPORT EXCEL MASSAL =================
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawData: any[] = XLSX.utils.sheet_to_json(ws);

      // Membersihkan data: Menghapus tanda petik pada NIB hasil copy-paste Excel
      const cleanedData = rawData.map(item => ({
        ...item,
        nib: String(item.nib).replace(/'/g, "").trim()
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
    
    const payload = { ...form, nib: cleanedNIB, jumlah_investasi: Number(form.jumlah_investasi) };
    if (editId) await supabase.from("data_industri_madiun").update(payload).eq("id", editId);
    else await supabase.from("data_industri_madiun").insert([payload]);
    
    setForm(initialState); setEditId(null); setShowForm(false); fetchData();
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-900">
      
      {/* HEADER */}
      <div className="mb-10 flex flex-col lg:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-blue-900 uppercase">Sistem Informasi Industri</h1>
          <p className="text-slate-500 font-bold text-xs tracking-widest uppercase">Data Mandiri Kota Madiun v2.5</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={downloadTemplate} className="bg-white border-2 border-slate-200 px-5 py-3 rounded-2xl font-black text-[11px] uppercase hover:bg-slate-100 transition">📝 Template</button>
          <input type="file" ref={fileInputRef} onChange={handleImportExcel} className="hidden" accept=".xlsx,.xls" />
          <button onClick={() => fileInputRef.current?.click()} className="bg-emerald-50 text-emerald-700 border-2 border-emerald-100 px-5 py-3 rounded-2xl font-black text-[11px] uppercase hover:bg-emerald-600 hover:text-white transition">📥 Import</button>
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg hover:bg-slate-900 transition active:scale-95">➕ Tambah</button>
        </div>
      </div>

      {/* DASHBOARD ANALYTICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border-t-8 border-slate-900">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Proyek</p>
          <p className="text-4xl font-black text-slate-900">{stats.totalProyek}</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border-t-8 border-blue-600">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Pelaku Usaha (NIB Unik)</p>
          <p className="text-4xl font-black text-blue-600">{stats.pelakuUsaha}</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border-t-8 border-emerald-500">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Realisasi Investasi</p>
          <p className="text-xl font-black text-emerald-600 truncate">Rp {stats.totalInvestasi.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border-t-8 border-amber-500">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Sebaran Kec.</p>
          <div className="flex gap-2 mt-2 font-black text-[9px] text-white">
            <span className="bg-amber-500 px-2 py-1 rounded">KRT: {stats.krt}</span>
            <span className="bg-indigo-500 px-2 py-1 rounded">MNG: {stats.mng}</span>
            <span className="bg-rose-500 px-2 py-1 rounded">TMN: {stats.tmn}</span>
          </div>
        </div>
      </div>

      {/* FORM INPUT DENGAN VALIDASI NIB */}
      {showForm && (
        <div className="mb-10 bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 animate-in slide-in-from-top-4 duration-500">
          <h2 className="text-xl font-black mb-8 text-blue-900">Entry Data Industri</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm font-bold">
            <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase text-slate-400 tracking-widest">NIB (13 Digit)</label>
                <input className="p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 ring-blue-500" maxLength={13} value={form.nib} onChange={e => setForm({...form, nib: e.target.value.replace(/[^0-9]/g, "")})} placeholder="0000000000000" />
            </div>
            <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase text-slate-400 tracking-widest">Kecamatan</label>
                <select className="p-4 bg-blue-50 border border-blue-100 rounded-2xl font-bold" value={form.kecamatan} onChange={e => setForm({...form, kecamatan: e.target.value, kelurahan: ""})}>
                    <option value="">Pilih Kecamatan</option>
                    {Object.keys(wilayahMadiun).map(k => <option key={k} value={k}>{k}</option>)}
                </select>
            </div>
            <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase text-slate-400 tracking-widest">Kelurahan</label>
                <select className="p-4 bg-blue-50 border border-blue-100 rounded-2xl font-bold disabled:opacity-30" disabled={!form.kecamatan} value={form.kelurahan} onChange={e => setForm({...form, kelurahan: e.target.value})}>
                    <option value="">Pilih Kelurahan</option>
                    {form.kecamatan && wilayahMadiun[form.kecamatan].map(l => <option key={l} value={l}>{l}</option>)}
                </select>
            </div>
            <div className="flex flex-col gap-2 md:col-span-1">
                <label className="text-[10px] uppercase text-slate-400 tracking-widest">Investasi (Rp)</label>
                <input type="number" className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700" value={form.jumlah_investasi} onChange={e => setForm({...form, jumlah_investasi: Number(e.target.value)})} />
            </div>
            <div className="md:col-span-2 flex flex-col gap-2">
                <label className="text-[10px] uppercase text-slate-400 tracking-widest">Nama Perusahaan</label>
                <input className="p-4 bg-slate-50 border border-slate-200 rounded-2xl uppercase" value={form.nama_perusahaan} onChange={e => setForm({...form, nama_perusahaan: e.target.value})} />
            </div>
            <div className="md:col-span-2 flex flex-col gap-2">
                <label className="text-[10px] uppercase text-slate-400 tracking-widest">Alamat Usaha</label>
                <input className="p-4 bg-slate-50 border border-slate-200 rounded-2xl uppercase" value={form.alamat_usaha} onChange={e => setForm({...form, alamat_usaha: e.target.value})} />
            </div>
          </div>
          <div className="mt-8 flex gap-3">
             <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-5 rounded-[2rem] font-black text-lg hover:bg-slate-900 transition shadow-xl">SIMPAN DATA</button>
             <button onClick={() => setShowForm(false)} className="px-10 bg-slate-200 text-slate-600 py-5 rounded-[2rem] font-black uppercase text-xs">Batal</button>
          </div>
        </div>
      )}

      {/* SEARCH & TABLE */}
      <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
        <div className="p-8 bg-white border-b flex items-center">
            <input type="text" placeholder="🔍 Masukkan NIB atau Nama Perusahaan untuk mencari..." className="w-full p-5 rounded-3xl border-none ring-1 ring-slate-100 bg-slate-50 font-bold focus:ring-2 ring-blue-500 outline-none transition-all" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
              <tr>
                <th className="px-10 py-6">Perusahaan / Pemilik</th>
                <th className="px-6 py-6">NIB</th>
                <th className="px-6 py-6">Wilayah</th>
                <th className="px-6 py-6">Realisasi</th>
                <th className="px-10 py-6 text-right">Opsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold uppercase text-[11px]">
              {data.filter(i => (i.nama_perusahaan || "").toLowerCase().includes(search.toLowerCase()) || (i.nib || "").includes(search)).map((item, idx) => (
                <tr key={idx} className="hover:bg-blue-50/50 transition duration-300">
                  <td className="px-10 py-6">
                    <div className="text-slate-900">{item.nama_perusahaan}</div>
                    <div className="text-[9px] text-slate-400 italic font-normal">Pemilik: {item.nama_pemilik}</div>
                  </td>
                  <td className="px-6 py-6 font-mono text-blue-600 font-black tracking-widest">{item.nib}</td>
                  <td className="px-6 py-6">
                    <div className="text-slate-700">Kec. {item.kecamatan}</div>
                    <div className="text-[9px] font-normal text-slate-400 tracking-tighter">Kel. {item.kelurahan}</div>
                  </td>
                  <td className="px-6 py-6 text-emerald-600">Rp {Number(item.jumlah_investasi).toLocaleString('id-ID')}</td>
                  <td className="px-10 py-6 text-right">
                     <button onClick={() => { setForm(item); setEditId(item.id); setShowForm(true); }} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition">✏️</button>
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