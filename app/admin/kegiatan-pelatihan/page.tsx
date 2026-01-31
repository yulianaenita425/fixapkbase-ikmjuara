"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import * as XLSX from "xlsx"

export default function PelatihanPemberdayaan() {
  const [kegiatan, setKegiatan] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"aktif" | "trash">("aktif")
  const [showModalKegiatan, setShowModalKegiatan] = useState(false)
  const [showModalPeserta, setShowModalPeserta] = useState<{show: boolean, data: any}>({show: false, data: null})
  const [editData, setEditData] = useState<any>(null)
  
  const [searchIKM, setSearchIKM] = useState("")
  const [listIKM, setListIKM] = useState<any[]>([])
  const [pesertaKegiatan, setPesertaKegiatan] = useState<any[]>([])

  useEffect(() => {
    fetchKegiatan()
  }, [tab])

  const fetchKegiatan = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("kegiatan_pelatihan")
      .select(`*, peserta_pelatihan(count)`)
      .eq("is_deleted", tab === "trash")
      .order('updated_at', { ascending: false })
    
    if (!error) setKegiatan(data || [])
    setLoading(false)
  }

  const fetchPeserta = async (kegiatanId: string) => {
    const { data } = await supabase
      .from("peserta_pelatihan")
      .select(`*, ikm_binaan(*)`)
      .eq("kegiatan_id", kegiatanId)
    setPesertaKegiatan(data || [])
  }

  const cariIKM = async (val: string) => {
    setSearchIKM(val)
    if(val.length < 2) return setListIKM([])
    const { data } = await supabase.from("ikm_binaan").select("*").or(`nama_lengkap.ilike.%${val}%,no_nib.ilike.%${val}%,nik.ilike.%${val}%`).limit(5)
    setListIKM(data || [])
  }

  const tambahPeserta = async (ikmId: string) => {
    const jumlahSekarang = pesertaKegiatan.length
    if (jumlahSekarang >= (showModalPeserta.data?.kuota_peserta || 0)) return alert("Gagal: Kuota penuh!")
    const isExist = pesertaKegiatan.some(p => p.ikm_id === ikmId)
    if (isExist) return alert("IKM sudah terdaftar.")

    const { error } = await supabase.from("peserta_pelatihan").insert([{ kegiatan_id: showModalPeserta.data.id, ikm_id: ikmId }])
    if(!error) {
      fetchPeserta(showModalPeserta.data.id); fetchKegiatan(); setSearchIKM(""); setListIKM([])
    }
  }

  const exportExcelPeserta = (itemKegiatan: any) => {
    if(pesertaKegiatan.length === 0) return alert("Belum ada data peserta")
    
    const dataExport = pesertaKegiatan.map((p, i) => ({
      "No": i + 1,
      "Nama Kegiatan": itemKegiatan.nama_kegiatan,
      "Sub Pelaksana": itemKegiatan.sub_kegiatan_pelaksana || "-",
      "Waktu Pelaksanaan": itemKegiatan.waktu_pelaksanaan || "-",
      "Tahun": itemKegiatan.tahun_pelaksanaan,
      "Nama Peserta": p.ikm_binaan?.nama_lengkap || "-",
      "NIB": p.ikm_binaan?.no_nib || "-",
      "NIK": p.ikm_binaan?.nik || "-",
      "Nama Usaha": p.ikm_binaan?.nama_usaha || "-",
      "Alamat": p.ikm_binaan?.alamat || "-",
      "Nomor HP": p.ikm_binaan?.no_hp || "-"
    }))

    const ws = XLSX.utils.json_to_sheet(dataExport)
    const wscols = [{wch: 5}, {wch: 30}, {wch: 25}, {wch: 20}, {wch: 10}, {wch: 25}, {wch: 20}, {wch: 20}, {wch: 25}, {wch: 40}, {wch: 15}]
    ws['!cols'] = wscols

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Daftar Peserta")
    XLSX.writeFile(wb, `DATA_PESERTA_${itemKegiatan.nama_kegiatan.replace(/ /g, "_")}.xlsx`)
  }

  const handleSaveKegiatan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const payload = Object.fromEntries(fd.entries())
    if (editData) await supabase.from("kegiatan_pelatihan").update(payload).eq("id", editData.id)
    else await supabase.from("kegiatan_pelatihan").insert([payload])
    setEditData(null); setShowModalKegiatan(false); fetchKegiatan()
  }

  return (
    <div className="p-8 bg-slate-200 min-h-screen font-sans text-slate-900">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 bg-white p-8 rounded-[40px] shadow-xl border-b-[8px] border-indigo-800 gap-4">
        <div>
          <h1 className="text-4xl font-black text-indigo-950 italic uppercase tracking-tighter">🛠️ PELATIHAN IKM</h1>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setTab("aktif")} className={`text-[10px] font-black uppercase px-6 py-2.5 rounded-full border-2 ${tab === 'aktif' ? 'bg-indigo-700 text-white border-indigo-800' : 'bg-white text-slate-400 border-slate-100'}`}>Daftar Aktif</button>
            <button onClick={() => setTab("trash")} className={`text-[10px] font-black uppercase px-6 py-2.5 rounded-full border-2 ${tab === 'trash' ? 'bg-rose-600 text-white border-rose-700' : 'bg-white text-slate-400 border-slate-100'}`}>Recycle Bin 🗑️</button>
          </div>
        </div>
        {tab === "aktif" && (
          <button onClick={() => {setEditData(null); setShowModalKegiatan(true)}} className="bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black text-xs hover:bg-indigo-800 shadow-lg active:scale-95">➕ TAMBAH KEGIATAN</button>
        )}
      </div>

      {/* --- TABEL UTAMA REVISI --- */}
      <div className="bg-white rounded-[40px] shadow-2xl overflow-x-auto border-2 border-slate-300">
        <table className="w-full text-left min-w-[1000px]">
          <thead className={tab === "trash" ? "bg-rose-950 text-white" : "bg-indigo-950 text-white"}>
            <tr className="text-[10px] font-black uppercase tracking-widest">
              <th className="p-6 text-center w-16">NO</th>
              <th className="p-6">INFORMASI DETAIL KEGIATAN</th>
              <th className="p-6 text-center">PESERTA</th>
              <th className="p-6 text-center">KUOTA</th>
              <th className="p-6 text-center">STATUS / TGL</th>
              <th className="p-6 text-center">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="p-20 text-center font-black text-slate-300 text-4xl animate-pulse italic uppercase">Loading...</td></tr>
            ) : kegiatan.map((item, idx) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-all">
                <td className="p-6 text-center font-black text-slate-400 border-r">{idx + 1}</td>
                <td className="p-6">
                  <div className="font-black text-indigo-950 uppercase text-lg leading-tight">{item.nama_kegiatan}</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                    <div className="text-[10px] font-bold text-indigo-600 uppercase">🏢 {item.sub_kegiatan_pelaksana || "-"}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase">📅 {item.waktu_pelaksanaan || "-"} ({item.tahun_pelaksanaan})</div>
                  </div>
                  <div className="mt-2 p-3 bg-slate-100 rounded-xl text-[11px] font-medium text-slate-600 italic border-l-4 border-indigo-400">
                    {item.deskripsi_kegiatan || "Tidak ada deskripsi kegiatan."}
                  </div>
                </td>
                {/* KOLOM JUMLAH PESERTA DIPISAH */}
                <td className="p-6 text-center border-x bg-slate-50/50">
                  <div className="text-2xl font-black text-indigo-800 leading-none">{item.peserta_pelatihan?.[0]?.count || 0}</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase mt-1">Terdaftar</div>
                </td>
                {/* KOLOM KUOTA DIPISAH */}
                <td className="p-6 text-center border-r">
                  <div className="text-2xl font-black text-slate-400 leading-none">{item.kuota_peserta}</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase mt-1">Kapasitas</div>
                </td>
                <td className="p-6 text-center">
                  {tab === "trash" ? (
                    <div className="text-[10px] font-black text-rose-500 uppercase bg-rose-50 p-2 rounded-xl">
                      {new Date(item.updated_at).toLocaleDateString('id-ID')}
                    </div>
                  ) : (
                    <span className={`px-4 py-1.5 rounded-full font-black text-[9px] uppercase border-2 ${
                      item.status_kegiatan === 'Pendaftaran Dibuka' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>{item.status_kegiatan}</span>
                  )}
                </td>
                <td className="p-6">
                  <div className="flex justify-center gap-2">
                    {tab === "aktif" && (
                      <>
                        <button onClick={() => {setShowModalPeserta({show: true, data: item}); fetchPeserta(item.id)}} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase shadow-md">👥 Peserta</button>
                        <button onClick={() => {setEditData(item); setShowModalKegiatan(true)}} className="w-10 h-10 border-2 border-amber-300 rounded-xl flex items-center justify-center text-amber-500 hover:bg-amber-500 hover:text-white transition-all">✏️</button>
                      </>
                    )}
                    <button onClick={tab === "aktif" ? () => {} : () => {}} className="w-10 h-10 border-2 border-rose-200 rounded-xl flex items-center justify-center text-rose-500 hover:bg-rose-600 hover:text-white transition-all text-lg">🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- MODAL PESERTA REVISI --- */}
      {showModalPeserta.show && (
        <div className="fixed inset-0 bg-indigo-950/95 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-5xl rounded-[40px] border-4 border-emerald-500 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 bg-emerald-600 text-white flex justify-between items-center">
              <div>
                <h2 className="font-black uppercase italic text-xl">Daftar Peserta Pelatihan</h2>
                <p className="text-[11px] font-bold opacity-90 uppercase tracking-widest">{showModalPeserta.data?.nama_kegiatan} | {showModalPeserta.data?.waktu_pelaksanaan}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => exportExcelPeserta(showModalPeserta.data)} className="bg-white text-emerald-700 px-6 py-2 rounded-xl font-black text-[10px] uppercase shadow-md hover:bg-emerald-50 transition-all">📊 EXPORT .XLSX</button>
                <button onClick={() => setShowModalPeserta({show: false, data: null})} className="font-black text-2xl hover:text-rose-200 transition-colors">✕</button>
              </div>
            </div>
            <div className="p-8 flex-1 overflow-y-auto bg-slate-50">
              <div className="mb-8 relative">
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-2 ml-1">Cari Nama IKM / NIB / NIK Peserta (Dari Data IKM Binaan)</label>
                <input value={searchIKM} onChange={(e) => cariIKM(e.target.value)} placeholder="Ketik minimal 2 karakter..." className="w-full p-4 rounded-2xl border-2 border-slate-200 outline-none focus:border-emerald-500 font-bold bg-white" />
                {listIKM.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white shadow-2xl rounded-2xl mt-2 border-2 border-emerald-100 z-10 overflow-hidden">
                    {listIKM.map(ikm => (
                      <div key={ikm.id} className="p-4 border-b last:border-0 flex justify-between items-center hover:bg-emerald-50">
                        <div>
                          <div className="font-black text-slate-800 uppercase text-sm">{ikm.nama_lengkap}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">NIB: {ikm.no_nib} | NIK: {ikm.nik}</div>
                        </div>
                        <button onClick={() => tambahPeserta(ikm.id)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase shadow-sm active:scale-95">TAMBAHKAN ➕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="rounded-3xl border-2 border-slate-200 overflow-hidden bg-white">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-500">
                    <tr className="text-[9px] font-black uppercase tracking-widest">
                      <th className="p-4 w-12 text-center">NO</th>
                      <th className="p-4">IDENTITAS PESERTA LENGKAP</th>
                      <th className="p-4 text-center">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pesertaKegiatan.map((p, i) => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="p-4 text-center font-bold text-slate-300 text-xs">{i + 1}</td>
                        <td className="p-4">
                          <div className="font-black text-slate-700 text-sm uppercase leading-tight">{p.ikm_binaan?.nama_lengkap}</div>
                          <div className="text-[11px] font-bold text-indigo-600 uppercase mt-1">🏪 {p.ikm_binaan?.nama_usaha || "Nama Usaha Kosong"}</div>
                          <div className="text-[10px] font-medium text-slate-500 italic mt-0.5">📍 {p.ikm_binaan?.alamat || "-"} | 📞 {p.ikm_binaan?.no_hp || "-"}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">NIB: {p.ikm_binaan?.no_nib} | NIK: {p.ikm_binaan?.nik}</div>
                        </td>
                        <td className="p-4 text-center">
                          <button onClick={async () => { if(confirm("Hapus peserta ini?")) { await supabase.from("peserta_pelatihan").delete().eq("id", p.id); fetchPeserta(showModalPeserta.data.id); fetchKegiatan(); } }} className="text-rose-500 px-4 py-1.5 rounded-lg font-black text-[9px] uppercase border border-rose-100 hover:bg-rose-600 hover:text-white transition-all">🗑️ Hapus</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InputForm({ label, name, type = "text", placeholder, def, required = false }: any) {
  return (
    <div className="flex flex-col">
      <label className="text-[10px] font-black text-slate-500 uppercase mb-1 ml-1">{label} {required && "*"}</label>
      <input name={name} type={type} defaultValue={def} placeholder={placeholder} required={required} className="p-3 border-2 border-slate-200 rounded-xl font-bold outline-none focus:border-indigo-500 bg-white" />
    </div>
  )
}