"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import * as XLSX from "xlsx"

export default function PelatihanPemberdayaan() {
  const [kegiatan, setKegiatan] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"aktif" | "trash">("aktif") // State Tab Manajemen
  const [showModalKegiatan, setShowModalKegiatan] = useState(false)
  const [showModalPeserta, setShowModalPeserta] = useState<{show: boolean, data: any}>({show: false, data: null})
  const [editData, setEditData] = useState<any>(null)
  
  // State Peserta
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

  // --- LOGIKA RECYCLE BIN ---
  const handleSoftDelete = async (id: string) => {
    if(confirm("Pindahkan kegiatan ke Recycle Bin? Data akan tersimpan selama 7 hari sebelum dihapus otomatis.")) {
      await supabase.from("kegiatan_pelatihan")
        .update({ is_deleted: true, updated_at: new Date() })
        .eq('id', id)
      fetchKegiatan()
    }
  }

  const handleRestore = async (id: string) => {
    await supabase.from("kegiatan_pelatihan")
      .update({ is_deleted: false, updated_at: new Date() })
      .eq('id', id)
    fetchKegiatan()
  }

  const handlePermanentDelete = async (id: string) => {
    if(confirm("HAPUS PERMANEN? Data dan daftar peserta kegiatan ini akan hilang selamanya!")) {
      await supabase.from("kegiatan_pelatihan").delete().eq('id', id)
      fetchKegiatan()
    }
  }

  const handleSaveKegiatan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const payload = Object.fromEntries(fd.entries())
    
    if (editData) {
      await supabase.from("kegiatan_pelatihan").update(payload).eq("id", editData.id)
    } else {
      await supabase.from("kegiatan_pelatihan").insert([payload])
    }
    
    setEditData(null)
    setShowModalKegiatan(false)
    fetchKegiatan()
  }

  // --- LOGIKA PESERTA ---
  const fetchPeserta = async (kegiatanId: string) => {
    const { data } = await supabase.from("peserta_pelatihan").select(`*, ikm_binaan(*)`).eq("kegiatan_id", kegiatanId)
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

  const exportExcelPeserta = (namaKegiatan: string) => {
    if(pesertaKegiatan.length === 0) return alert("Belum ada data peserta")
    const dataExport = pesertaKegiatan.map((p, i) => ({
      "No": i + 1,
      "Nama IKM": p.ikm_binaan?.nama_lengkap || "-",
      "NIB": p.ikm_binaan?.no_nib || "-",
      "NIK": p.ikm_binaan?.nik || "-",
      "Nama Kegiatan": namaKegiatan
    }))
    const ws = XLSX.utils.json_to_sheet(dataExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Daftar Peserta")
    XLSX.writeFile(wb, `PESERTA_${namaKegiatan.replace(/ /g, "_")}.xlsx`)
  }

  return (
    <div className="p-8 bg-slate-200 min-h-screen font-sans text-slate-900">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 bg-white p-8 rounded-[40px] shadow-xl border-b-[8px] border-indigo-800 gap-4">
        <div>
          <h1 className="text-4xl font-black text-indigo-950 italic uppercase tracking-tighter">🛠️ PELATIHAN IKM</h1>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setTab("aktif")} className={`text-[10px] font-black uppercase px-6 py-2.5 rounded-full transition-all border-2 ${tab === 'aktif' ? 'bg-indigo-700 text-white border-indigo-800 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200'}`}>Daftar Aktif</button>
            <button onClick={() => setTab("trash")} className={`text-[10px] font-black uppercase px-6 py-2.5 rounded-full transition-all border-2 ${tab === 'trash' ? 'bg-rose-600 text-white border-rose-700 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-rose-200'}`}>Recycle Bin 🗑️</button>
          </div>
        </div>
        {tab === "aktif" && (
          <button onClick={() => {setEditData(null); setShowModalKegiatan(true)}} className="bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black text-xs hover:bg-indigo-800 transition-all shadow-lg active:scale-95">➕ TAMBAH KEGIATAN</button>
        )}
      </div>

      {/* --- TABLE --- */}
      <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border-2 border-slate-300">
        <table className="w-full text-left">
          <thead className={tab === "trash" ? "bg-rose-950 text-white" : "bg-indigo-950 text-white"}>
            <tr className="text-[11px] font-black uppercase tracking-widest">
              <th className="p-6 text-center w-16">NO</th>
              <th className="p-6">DETAIL KEGIATAN</th>
              <th className="p-6 text-center">KUOTA</th>
              <th className="p-6 text-center">{tab === "trash" ? "DIHAPUS PADA" : "STATUS"}</th>
              <th className="p-6 text-center">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="p-20 text-center font-black text-slate-300 text-4xl animate-pulse italic uppercase">Loading...</td></tr>
            ) : kegiatan.map((item, idx) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-all">
                <td className="p-6 text-center font-black text-slate-400 border-r">{idx + 1}</td>
                <td className="p-6">
                  <div className="font-black text-indigo-950 uppercase text-lg leading-tight">{item.nama_kegiatan}</div>
                  <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase italic">{item.sub_kegiatan_pelaksana} | {item.tahun_pelaksanaan}</div>
                </td>
                <td className="p-6 text-center">
                  <div className="text-xl font-black text-indigo-800 leading-none">{item.peserta_pelatihan?.[0]?.count || 0} / {item.kuota_peserta}</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-tighter">Peserta</div>
                </td>
                <td className="p-6 text-center">
                  {tab === "trash" ? (
                    <div className="text-[10px] font-black text-rose-500 uppercase leading-tight bg-rose-50 p-2 rounded-xl border border-rose-100">
                      {new Date(item.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      <br/><span className="text-[8px] opacity-70 italic">Hapus Otomatis dlm 7 Hari</span>
                    </div>
                  ) : (
                    <span className={`px-4 py-1.5 rounded-full font-black text-[9px] uppercase border-2 ${
                      item.status_kegiatan === 'Pendaftaran Dibuka' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      item.status_kegiatan === 'Selesai' ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>{item.status_kegiatan}</span>
                  )}
                </td>
                <td className="p-6">
                  <div className="flex justify-center gap-2">
                    {tab === "trash" ? (
                      <>
                        <button onClick={() => handleRestore(item.id)} className="bg-emerald-500 text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase shadow-md hover:bg-emerald-600 active:scale-95 transition-all">♻️ Pulihkan</button>
                        <button onClick={() => handlePermanentDelete(item.id)} className="bg-white text-rose-600 border-2 border-rose-100 px-5 py-2 rounded-xl font-black text-[10px] uppercase hover:bg-rose-600 hover:text-white active:scale-95 transition-all">Hapus Permanen</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => {setShowModalPeserta({show: true, data: item}); fetchPeserta(item.id)}} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-black text-[10px] hover:bg-indigo-800 transition-all uppercase shadow-md">👥 Peserta</button>
                        <button onClick={() => {setEditData(item); setShowModalKegiatan(true)}} className="w-10 h-10 border-2 border-amber-300 rounded-xl flex items-center justify-center text-amber-500 hover:bg-amber-500 hover:text-white transition-all">✏️</button>
                        <button onClick={() => handleSoftDelete(item.id)} className="w-10 h-10 border-2 border-rose-200 rounded-xl flex items-center justify-center text-rose-500 hover:bg-rose-600 hover:text-white transition-all text-lg">🗑</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- MODAL KEGIATAN --- */}
      {showModalKegiatan && (
        <div className="fixed inset-0 bg-indigo-950/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSaveKegiatan} className="bg-white w-full max-w-2xl rounded-[40px] border-4 border-indigo-600 shadow-2xl overflow-hidden">
            <div className="p-8 bg-indigo-900 text-white flex justify-between items-center">
              <h2 className="font-black uppercase italic text-xl">{editData ? 'Edit Data Kegiatan' : 'Tambah Kegiatan Baru'}</h2>
              <button type="button" onClick={() => setShowModalKegiatan(false)} className="font-black text-2xl hover:text-rose-400">✕</button>
            </div>
            <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto bg-slate-50">
              <InputForm label="Nama Kegiatan" name="nama_kegiatan" def={editData?.nama_kegiatan} placeholder="Judul Pelatihan..." required />
              <InputForm label="Sub Kegiatan Pelaksana" name="sub_kegiatan_pelaksana" def={editData?.sub_kegiatan_pelaksana} placeholder="Seksi/Bidang..." />
              <div className="grid grid-cols-2 gap-4">
                <InputForm label="Waktu" name="waktu_pelaksanaan" def={editData?.waktu_pelaksanaan} placeholder="Contoh: 12-15 Jan" />
                <InputForm label="Tahun" name="tahun_pelaksanaan" def={editData?.tahun_pelaksanaan || "2026"} type="number" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputForm label="Kuota Peserta" name="kuota_peserta" def={editData?.kuota_peserta} type="number" required />
                <div className="flex flex-col">
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-1 ml-1">Status</label>
                  <select name="status_kegiatan" defaultValue={editData?.status_kegiatan || "Pendaftaran Dibuka"} className="p-3 border-2 border-slate-200 rounded-xl font-bold bg-white outline-none focus:border-indigo-500">
                    <option>Pendaftaran Dibuka</option>
                    <option>Pendaftaran Ditutup</option>
                    <option>Sedang Terlaksana</option>
                    <option>Selesai</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-black text-slate-500 uppercase mb-1 ml-1">Deskripsi</label>
                <textarea name="deskripsi_kegiatan" defaultValue={editData?.deskripsi_kegiatan} className="p-3 border-2 border-slate-200 rounded-xl font-bold min-h-[80px] outline-none" />
              </div>
            </div>
            <div className="p-6 bg-white border-t-2">
              <button type="submit" className="w-full p-4 rounded-2xl bg-indigo-600 text-white font-black uppercase shadow-lg hover:bg-indigo-700 transition-all">SIMPAN DATA</button>
            </div>
          </form>
        </div>
      )}

      {/* --- MODAL PESERTA --- */}
      {showModalPeserta.show && (
        <div className="fixed inset-0 bg-indigo-950/95 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-4xl rounded-[40px] border-4 border-emerald-500 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 bg-emerald-600 text-white flex justify-between items-center">
              <div>
                <h2 className="font-black uppercase italic text-xl">Daftar Peserta Pelatihan</h2>
                <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">{showModalPeserta.data?.nama_kegiatan}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => exportExcelPeserta(showModalPeserta.data?.nama_kegiatan)} className="bg-white text-emerald-700 px-6 py-2 rounded-xl font-black text-[10px] uppercase shadow-md hover:bg-emerald-50 transition-all">📊 EXPORT .XLSX</button>
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
                      <th className="p-4">IDENTITAS PESERTA</th>
                      <th className="p-4 text-center">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pesertaKegiatan.map((p, i) => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="p-4 text-center font-bold text-slate-300 text-xs">{i + 1}</td>
                        <td className="p-4">
                          <div className="font-black text-slate-700 text-sm uppercase">{p.ikm_binaan?.nama_lengkap}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase italic">NIB: {p.ikm_binaan?.no_nib} | NIK: {p.ikm_binaan?.nik}</div>
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
      <input name={name} type={type} defaultValue={def} placeholder={placeholder} required={required} className="p-3 border-2 border-slate-200 rounded-xl font-bold outline-none focus:border-indigo-500 bg-white shadow-sm" />
    </div>
  )
}