"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"
import * as XLSX from "xlsx"
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from "chart.js"
import { Pie, Bar } from "react-chartjs-2"

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

export default function PusatDataIndustriMadiun() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  // State Form Lengkap Sesuai Permintaan
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

  const handleSave = async () => {
    if (!form.nib || !form.nama_perusahaan) return alert("NIB dan Nama Perusahaan wajib diisi!")
    const payload = { ...form, jumlah_investasi: Number(form.jumlah_investasi), jumlah_tenaga_kerja: Number(form.jumlah_tenaga_kerja) }
    
    if (editId) {
      await supabase.from("data_industri_madiun").update(payload).eq("id", editId)
    } else {
      await supabase.from("data_industri_madiun").insert([payload])
    }
    setForm(initialState); setEditId(null); setShowForm(false); fetchData();
  }

  const handleDelete = async (id: string) => {
    if (confirm("Hapus data industri ini?")) {
      await supabase.from("data_industri_madiun").update({ is_deleted: true }).eq("id", id)
      fetchData()
    }
  }

  const stats = {
    total: data.length,
    investasi: data.reduce((acc, curr) => acc + (curr.jumlah_investasi || 0), 0),
    krt: data.filter(i => (i.kecamatan || "").toLowerCase().includes("kartoharjo")).length,
    mng: data.filter(i => (i.kecamatan || "").toLowerCase().includes("manguharjo")).length,
    tmn: data.filter(i => (i.kecamatan || "").toLowerCase().includes("taman")).length
  }

  const filteredData = data.filter(item => 
    [item.nama_perusahaan, item.nib, item.nama_pemilik].some(v => String(v||"").toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans text-slate-900">
      
      {/* HEADER */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">MANAJEMEN DATA INDUSTRI MADIUN</h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Sistem Mandiri Perizinan & Investasi</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm(initialState); }} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition flex items-center gap-2">
            {showForm ? "✕ Tutup" : "➕ Tambah Proyek/Perusahaan"}
          </button>
        </div>
      </div>

      {/* FORM INPUT (GRID SYSTEM) */}
      {showForm && (
        <div className="mb-10 bg-white p-8 rounded-[2.5rem] shadow-2xl border-b-8 border-blue-600 animate-in zoom-in-95 duration-300">
          <h2 className="text-xl font-black mb-6 flex items-center gap-2">📝 Form Data Industri</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black ml-2">NIB</label>
              <input className="p-3 bg-slate-100 rounded-xl outline-none focus:ring-2 ring-blue-500 font-bold" value={form.nib} onChange={e => setForm({...form, nib: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black ml-2">SKALA USAHA</label>
              <select className="p-3 bg-slate-100 rounded-xl outline-none font-bold" value={form.skala_usaha} onChange={e => setForm({...form, skala_usaha: e.target.value})}>
                <option value="">Pilih Skala</option><option value="Mikro">Mikro</option><option value="Kecil">Kecil</option><option value="Menengah">Menengah</option><option value="Besar">Besar</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-[10px] font-black ml-2">NAMA PERUSAHAAN / PROYEK</label>
              <input className="p-3 bg-slate-100 rounded-xl outline-none focus:ring-2 ring-blue-500 font-bold" value={form.nama_perusahaan} onChange={e => setForm({...form, nama_perusahaan: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1"><label className="text-[10px] font-black ml-2">PEMILIK</label><input className="p-3 bg-slate-100 rounded-xl font-bold" value={form.nama_pemilik} onChange={e => setForm({...form, nama_pemilik: e.target.value})} /></div>
            <div className="flex flex-col gap-1"><label className="text-[10px] font-black ml-2">KECAMATAN</label><input className="p-3 bg-slate-100 rounded-xl font-bold" value={form.kecamatan} onChange={e => setForm({...form, kecamatan: e.target.value})} /></div>
            <div className="flex flex-col gap-1"><label className="text-[10px] font-black ml-2">KELURAHAN</label><input className="p-3 bg-slate-100 rounded-xl font-bold" value={form.kelurahan} onChange={e => setForm({...form, kelurahan: e.target.value})} /></div>
            <div className="flex flex-col gap-1"><label className="text-[10px] font-black ml-2">KBLI</label><input className="p-3 bg-slate-100 rounded-xl font-bold" value={form.kbli} onChange={e => setForm({...form, kbli: e.target.value})} /></div>
            <div className="flex flex-col gap-1 md:col-span-2"><label className="text-[10px] font-black ml-2">URAIAN KBLI</label><input className="p-3 bg-slate-100 rounded-xl font-bold" value={form.uraian_kbli} onChange={e => setForm({...form, uraian_kbli: e.target.value})} /></div>
            <div className="flex flex-col gap-1"><label className="text-[10px] font-black ml-2">INVESTASI (Rp)</label><input type="number" className="p-3 bg-slate-100 rounded-xl font-bold text-green-600" value={form.jumlah_investasi} onChange={e => setForm({...form, jumlah_investasi: Number(e.target.value)})} /></div>
            <div className="flex flex-col gap-1"><label className="text-[10px] font-black ml-2">TENAGA KERJA</label><input type="number" className="p-3 bg-slate-100 rounded-xl font-bold" value={form.jumlah_tenaga_kerja} onChange={e => setForm({...form, jumlah_tenaga_kerja: Number(e.target.value)})} /></div>
            <div className="flex flex-col gap-1 md:col-span-2"><label className="text-[10px] font-black ml-2">ALAMAT USAHA</label><input className="p-3 bg-slate-100 rounded-xl font-bold" value={form.alamat_usaha} onChange={e => setForm({...form, alamat_usaha: e.target.value})} /></div>
            <div className="flex flex-col gap-1"><label className="text-[10px] font-black ml-2">TELP</label><input className="p-3 bg-slate-100 rounded-xl font-bold" value={form.no_telp} onChange={e => setForm({...form, no_telp: e.target.value})} /></div>
            <div className="flex flex-col gap-1"><label className="text-[10px] font-black ml-2">EMAIL</label><input className="p-3 bg-slate-100 rounded-xl font-bold" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
            <div className="flex flex-col gap-1"><label className="text-[10px] font-black ml-2">TGL TERBIT PROYEK</label><input type="date" className="p-3 bg-slate-100 rounded-xl font-bold" value={form.tgl_terbit_proyek} onChange={e => setForm({...form, tgl_terbit_proyek: e.target.value})} /></div>
          </div>
          <div className="mt-8 flex gap-3">
             <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:shadow-xl transition">SIMPAN DATA</button>
             <button onClick={() => setShowForm(false)} className="px-8 bg-slate-200 text-slate-600 py-4 rounded-2xl font-black">BATAL</button>
          </div>
        </div>
      )}

      {/* DASHBOARD RINGKAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 text-white">
        <div className="bg-slate-900 p-6 rounded-[2rem] shadow-lg">
          <p className="text-[10px] font-black opacity-50 uppercase tracking-widest">Total Investasi</p>
          <p className="text-2xl font-black text-emerald-400">Rp {stats.investasi.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-blue-600 p-6 rounded-[2rem] shadow-lg">
          <p className="text-[10px] font-black opacity-50 uppercase tracking-widest">Kec. Kartoharjo</p>
          <p className="text-3xl font-black">{stats.krt} Unit</p>
        </div>
        <div className="bg-indigo-600 p-6 rounded-[2rem] shadow-lg">
          <p className="text-[10px] font-black opacity-50 uppercase tracking-widest">Kec. Manguharjo</p>
          <p className="text-3xl font-black">{stats.mng} Unit</p>
        </div>
        <div className="bg-rose-600 p-6 rounded-[2rem] shadow-lg">
          <p className="text-[10px] font-black opacity-50 uppercase tracking-widest">Kec. Taman</p>
          <p className="text-3xl font-black">{stats.tmn} Unit</p>
        </div>
      </div>

      {/* SEARCH & TABLE */}
      <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-100">
        <div className="p-6 bg-slate-50 border-b flex items-center">
          <input type="text" placeholder="🔍 Cari berdasarkan NIB, Perusahaan, atau Pemilik..." className="w-full p-4 rounded-2xl border-none ring-1 ring-slate-200 focus:ring-2 ring-blue-500 font-medium bg-white" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] text-left">
            <thead className="bg-slate-900 text-white uppercase font-black tracking-tighter">
              <tr>
                <th className="px-6 py-4">No</th>
                <th className="px-4 py-4">NIB / Perusahaan</th>
                <th className="px-4 py-4">Skala / Risiko</th>
                <th className="px-4 py-4">Wilayah (Kec/Kel)</th>
                <th className="px-4 py-4">KBLI / Investasi</th>
                <th className="px-4 py-4">Kontak</th>
                <th className="px-6 py-4 text-right">Opsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((item, idx) => (
                <tr key={item.id} className="hover:bg-blue-50/50 transition font-medium">
                  <td className="px-6 py-5 text-slate-300 font-mono italic">{idx + 1}</td>
                  <td className="px-4 py-5 uppercase">
                    <div className="font-black text-blue-900">{item.nama_perusahaan}</div>
                    <div className="text-[9px] text-slate-400">NIB: {item.nib}</div>
                  </td>
                  <td className="px-4 py-5 uppercase">
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[9px] font-black mr-1">{item.skala_usaha}</span>
                    <div className="mt-1 text-slate-400">Risiko: {item.tingkat_risiko}</div>
                  </td>
                  <td className="px-4 py-5 uppercase">
                    <div className="font-bold text-slate-700">{item.kecamatan}</div>
                    <div className="text-slate-400">{item.kelurahan}</div>
                  </td>
                  <td className="px-4 py-5">
                    <div className="font-bold text-emerald-600">Rp {Number(item.jumlah_investasi).toLocaleString('id-ID')}</div>
                    <div className="text-[9px] text-slate-400 font-mono">KBLI: {item.kbli}</div>
                  </td>
                  <td className="px-4 py-5">
                    <div className="font-bold">{item.no_telp}</div>
                    <div className="text-slate-400">{item.email}</div>
                  </td>
                  <td className="px-6 py-5 text-right flex justify-end gap-1">
                    <button onClick={() => { setForm(item); setEditId(item.id); setShowForm(true); }} className="p-2 bg-amber-100 text-amber-600 rounded-lg">✏️</button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-100 text-red-600 rounded-lg">🗑️</button>
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