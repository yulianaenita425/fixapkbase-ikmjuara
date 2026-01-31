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

  // LOGIKA DELETE & RESTORE
  const handleAction = async (id: string, action: "soft-delete" | "permanent-delete" | "restore") => {
    let confirmMsg = "Hapus kegiatan ini?"
    if (action === "permanent-delete") confirmMsg = "Hapus permanen? Data tidak bisa dikembalikan!"
    if (action === "restore") confirmMsg = "Pulihkan kegiatan ini?"

    if (!confirm(confirmMsg)) return

    if (action === "soft-delete") {
      await supabase.from("kegiatan_pelatihan").update({ is_deleted: true }).eq("id", id)
    } else if (action === "permanent-delete") {
      await supabase.from("kegiatan_pelatihan").delete().eq("id", id)
    } else if (action === "restore") {
      await supabase.from("kegiatan_pelatihan").update({ is_deleted: false }).eq("id", id)
    }
    fetchKegiatan()
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

  const handleSaveKegiatan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const payload = Object.fromEntries(fd.entries())
    
    if (editData) {
      const { error } = await supabase.from("kegiatan_pelatihan").update(payload).eq("id", editData.id)
      if (error) alert("Gagal update data")
    } else {
      const { error } = await supabase.from("kegiatan_pelatihan").insert([payload])
      if (error) alert("Gagal tambah data")
    }
    setEditData(null); setShowModalKegiatan(false); fetchKegiatan()
  }

  return (
    <div className="p-8 bg-slate-200 min-h-screen font-sans text-slate-900">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 bg-white p-8 rounded-[40px] shadow-xl border-b-[8px] border-indigo-800 gap-4">
        <div>
          <h1 className="text-4xl font-black text-indigo-950 italic uppercase tracking-tighter">🛠️ PELATIHAN IKM</h1>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setTab("aktif")} className={`text-[10px] font-black uppercase px-6 py-2.5 rounded-full border-2 transition-all ${tab === 'aktif' ? 'bg-indigo-700 text-white border-indigo-800' : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-300'}`}>Daftar Aktif</button>
            <button onClick={() => setTab("trash")} className={`text-[10px] font-black uppercase px-6 py-2.5 rounded-full border-2 transition-all ${tab === 'trash' ? 'bg-rose-600 text-white border-rose-700' : 'bg-white text-slate-400 border-slate-100 hover:border-rose-300'}`}>Recycle Bin 🗑️</button>
          </div>
        </div>
        {tab === "aktif" && (
          <button onClick={() => {setEditData(null); setShowModalKegiatan(true)}} className="bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black text-xs hover:bg-indigo-800 shadow-lg active:scale-95">➕ TAMBAH KEGIATAN</button>
        )}
      </div>

      {/* --- TABEL UTAMA --- */}
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
                <td className="p-6 text-center border-x bg-slate-50/50">
                  <div className="text-2xl font-black text-indigo-800 leading-none">{item.peserta_pelatihan?.[0]?.count || 0}</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase mt-1">Terdaftar</div>
                </td>
                <td className="p-6 text-center border-r">
                  <div className="text-2xl font-black text-slate-400 leading-none">{item.kuota_peserta}</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase mt-1">Kapasitas</div>
                </td>
                <td className="p-6 text-center">
                   <span className={`px-4 py-1.5 rounded-full font-black text-[9px] uppercase border-2 ${
                      tab === "trash" ? "bg-rose-50 text-rose-600 border-rose-100" :
                      item.status_kegiatan === 'Pendaftaran Dibuka' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>{tab === "trash" ? "Dihapus" : item.status_kegiatan}</span>
                </td>
                <td className="p-6">
                  <div className="flex justify-center gap-2">
                    {tab === "aktif" ? (
                      <>
                        <button onClick={() => {setShowModalPeserta({show: true, data: item}); fetchPeserta(item.id)}} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase shadow-md hover:bg-indigo-700">👥 Peserta</button>
                        <button onClick={() => {setEditData(item); setShowModalKegiatan(true)}} className="w-10 h-10 border-2 border-amber-300 rounded-xl flex items-center justify-center text-amber-500 hover:bg-amber-500 hover:text-white transition-all">✏️</button>
                        <button onClick={() => handleAction(item.id, "soft-delete")} className="w-10 h-10 border-2 border-rose-200 rounded-xl flex items-center justify-center text-rose-500 hover:bg-rose-600 hover:text-white transition-all text-lg">🗑</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleAction(item.id, "restore")} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase">♻️ Pulihkan</button>
                        <button onClick={() => handleAction(item.id, "permanent-delete")} className="w-10 h-10 border-2 border-rose-600 rounded-xl flex items-center justify-center text-rose-600 hover:bg-rose-600 hover:text-white transition-all">🔥</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- MODAL INPUT KEGIATAN --- */}
      {showModalKegiatan && (
        <div className="fixed inset-0 bg-indigo-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-2xl rounded-[40px] overflow-hidden shadow-2xl border-t-[10px] border-indigo-600">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50">
              <h2 className="font-black uppercase italic text-xl">{editData ? "✏️ Edit Kegiatan" : "➕ Tambah Kegiatan Baru"}</h2>
              <button onClick={() => setShowModalKegiatan(false)} className="text-slate-400 hover:text-rose-500 text-2xl">✕</button>
            </div>
            <form onSubmit={handleSaveKegiatan} className="p-8 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <InputForm label="Nama Kegiatan" name="nama_kegiatan" def={editData?.nama_kegiatan} required />
              </div>
              <div className="col-span-2">
                <InputForm label="Sub Kegiatan Pelaksana" name="sub_kegiatan_pelaksana" def={editData?.sub_kegiatan_pelaksana} />
              </div>
              <InputForm label="Waktu Pelaksanaan" name="waktu_pelaksanaan" placeholder="Contoh: 12 - 15 Mei" def={editData?.waktu_pelaksanaan} />
              <InputForm label="Tahun Pelaksanaan" name="tahun_pelaksanaan" type="number" def={editData?.tahun_pelaksanaan || 2026} />
              <InputForm label="Kuota Peserta" name="kuota_peserta" type="number" def={editData?.kuota_peserta || 20} />
              <div className="flex flex-col">
                <label className="text-[10px] font-black text-slate-500 uppercase mb-1 ml-1">Status</label>
                <select name="status_kegiatan" defaultValue={editData?.status_kegiatan || "Pendaftaran Dibuka"} className="p-3 border-2 border-slate-200 rounded-xl font-bold bg-white outline-none focus:border-indigo-500">
                  <option>Pendaftaran Dibuka</option>
                  <option>Sedang Terlaksana</option>
                  <option>Selesai</option>
                </select>
              </div>
              <div className="col-span-2 flex flex-col">
                <label className="text-[10px] font-black text-slate-500 uppercase mb-1 ml-1">Deskripsi Kegiatan</label>
                <textarea name="deskripsi_kegiatan" defaultValue={editData?.deskripsi_kegiatan} rows={3} className="p-3 border-2 border-slate-200 rounded-xl font-bold outline-none focus:border-indigo-500" placeholder="Jelaskan detail singkat kegiatan..." />
              </div>
              <div className="col-span-2 mt-4">
                <button type="submit" className="w-full bg-indigo-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-800 shadow-lg active:scale-95 transition-all">SIMPAN DATA KEGIATAN</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL PESERTA (Tetap Sama) --- */}
      {showModalPeserta.show && (
        <div className="fixed inset-0 bg-indigo-950/95 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-5xl rounded-[40px] border-4 border-emerald-500 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 bg-emerald-600 text-white flex justify-between items-center">
              <div>
                <h2 className="font-black uppercase italic text-xl">Daftar Peserta Pelatihan</h2>
                <p className="text-[11px] font-bold opacity-90 uppercase tracking-widest">{showModalPeserta.data?.nama_kegiatan}</p>
              </div>
              <button onClick={() => setShowModalPeserta({show: false, data: null})} className="font-black text-2xl hover:text-rose-200 transition-colors">✕</button>
            </div>
            {/* ... (Konten modal peserta sama seperti sebelumnya) ... */}
            <div className="p-8 overflow-y-auto">
                <p className="text-center italic text-slate-400">Gunakan kolom pencarian di bawah untuk menambah peserta dari data IKM Binaan.</p>
                <div className="mt-4 relative">
                    <input value={searchIKM} onChange={(e) => cariIKM(e.target.value)} placeholder="Cari Nama/NIB/NIK..." className="w-full p-4 border-2 rounded-2xl font-bold border-emerald-100 focus:border-emerald-500 outline-none" />
                    {listIKM.length > 0 && (
                        <div className="absolute left-0 right-0 bg-white border shadow-xl z-20 rounded-xl mt-1 overflow-hidden">
                            {listIKM.map(i => (
                                <div key={i.id} onClick={() => tambahPeserta(i.id)} className="p-4 hover:bg-emerald-50 cursor-pointer flex justify-between items-center border-b">
                                    <span className="font-bold uppercase text-xs">{i.nama_lengkap} ({i.no_nib})</span>
                                    <span className="text-[10px] bg-emerald-600 text-white px-2 py-1 rounded-lg">TAMBAH</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <table className="w-full mt-6 border-collapse">
                    <thead><tr className="bg-slate-100 text-[10px] uppercase font-black tracking-widest"><th className="p-4 text-left">Nama Peserta</th><th className="p-4 text-center w-20">Aksi</th></tr></thead>
                    <tbody>
                        {pesertaKegiatan.map(p => (
                            <tr key={p.id} className="border-b"><td className="p-4 font-bold text-sm uppercase">{p.ikm_binaan?.nama_lengkap}</td><td className="p-4"><button onClick={async () => {if(confirm("Hapus?")) {await supabase.from("peserta_pelatihan").delete().eq("id", p.id); fetchPeserta(showModalPeserta.data.id); fetchKegiatan();}}} className="text-rose-500 font-bold text-xs uppercase underline">Hapus</button></td></tr>
                        ))}
                    </tbody>
                </table>
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