"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"

const LAYANAN_LIST = [
  "Pendaftaran HKI Merek",
  "Pendaftaran Sertifikat Halal",
  "Pendaftaran TKDN IK",
  "Pendaftaran dan Pendampingan SIINas",
  "Pendaftaran Uji Nilai Gizi",
  "Pendaftaran Kurasi Produk"
]

export default function DataLayananIKM() {
  const [activeTab, setActiveTab] = useState(LAYANAN_LIST[0])
  const [dataLayanan, setDataLayanan] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedData, setSelectedData] = useState<{ type: 'view' | 'edit', data: any } | null>(null)

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("layanan_ikm_juara")
      .select(`*, ikm_binaan(*)`)
      .eq("jenis_layanan", activeTab)
      .eq("is_deleted", false)
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Gagal mengambil data:", error.message)
    } else {
      setDataLayanan(data || [])
    }
    setLoading(false)
  }

  const handleSoftDelete = async (id: string) => {
    if (confirm("Yakin ingin memindahkan data ini ke Recycle Bin?")) {
      const { error } = await supabase
        .from("layanan_ikm_juara")
        .update({ is_deleted: true })
        .eq("id", id)
      
      if (!error) {
        alert("Data berhasil dihapus!")
        fetchData()
      }
    }
  }

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedData) return

    const formData = new FormData(e.currentTarget)
    const updates = Object.fromEntries(formData.entries())

    const { error } = await supabase
      .from("layanan_ikm_juara")
      .update(updates)
      .eq("id", selectedData.data.id)

    if (!error) {
      alert("Update berhasil! ✅")
      setSelectedData(null)
      fetchData()
    } else {
      alert("Gagal update: " + error.message)
    }
  }

  return (
    <div className="p-8 bg-slate-100 min-h-screen font-sans text-slate-900">
      <h1 className="text-3xl font-black text-blue-900 mb-8 uppercase italic tracking-tighter">
        🚀 Data Layanan IKM Juara
      </h1>

      {/* SUB MENU LAYANAN */}
      <div className="flex flex-wrap gap-2 mb-8">
        {LAYANAN_LIST.map((layanan) => (
          <button
            key={layanan}
            onClick={() => setActiveTab(layanan)}
            className={`px-5 py-2.5 rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all shadow-sm ${activeTab === layanan
                ? "bg-blue-600 text-white shadow-blue-200"
                : "bg-white text-slate-400 hover:bg-slate-200"
              }`}
          >
            {layanan.replace("Pendaftaran ", "")}
          </button>
        ))}
      </div>

      {/* TABEL REKAPITULASI */}
      <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="p-6 text-center">No</th>
                <th className="p-6">Data Dasar IKM Binaan</th>
                <th className="p-6">Detail Khusus {activeTab}</th>
                <th className="p-6">Tahun</th>
                <th className="p-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center font-black text-slate-300 animate-pulse">MEMUAT DATA...</td></tr>
              ) : dataLayanan.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center font-bold text-slate-400">Belum ada data di kategori ini.</td></tr>
              ) : (
                dataLayanan.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="p-6 text-center font-bold text-slate-300">{idx + 1}</td>
                    <td className="p-6">
                      <div className="font-black text-slate-800 text-sm leading-tight">{row.ikm_binaan?.nama_lengkap || row.ikm_binaan?.nama}</div>
                      <div className="text-[10px] font-bold text-slate-400 mt-1 space-y-0.5 uppercase">
                        <p>NIB: {row.ikm_binaan?.no_nib || row.ikm_binaan?.nib}</p>
                        <p>HP: {row.ikm_binaan?.no_hp || row.ikm_binaan?.hp}</p>
                        <p className="normal-case">Alamat: {row.ikm_binaan?.alamat}</p>
                      </div>
                    </td>
                    <td className="p-6">
                      <p className="text-xs font-black text-slate-700">{row.nomor_dokumen || "—"}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {row.link_tambahan && (
                          <a href={row.link_tambahan} target="_blank" className="bg-slate-100 text-[9px] px-2 py-1 rounded-md font-black text-blue-600 hover:bg-blue-100 uppercase">📁 Bukti Daftar</a>
                        )}
                        {row.link_dokumen && (
                          <a href={row.link_dokumen} target="_blank" className="bg-slate-100 text-[9px] px-2 py-1 rounded-md font-black text-green-600 hover:bg-green-100 uppercase">📜 Sertifikat</a>
                        )}
                      </div>
                      {row.status_sertifikat && (
                        <div className={`mt-2 text-[9px] font-black uppercase inline-block px-2 py-0.5 rounded ${row.status_sertifikat === 'Telah Didaftar' ? 'bg-green-100 text-green-700' :
                            row.status_sertifikat === 'Proses' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                          }`}>
                          {row.status_sertifikat}
                        </div>
                      )}
                    </td>
                    <td className="p-6 font-black text-slate-500">{row.tahun_fasilitasi}</td>
                    <td className="p-6">
                      <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setSelectedData({ type: 'view', data: row })} className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:bg-blue-600 hover:text-white transition-all">👁️</button>
                        <button onClick={() => setSelectedData({ type: 'edit', data: row })} className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:bg-amber-500 hover:text-white transition-all text-amber-500">✏️</button>
                        <button onClick={() => handleSoftDelete(row.id)} className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:bg-red-500 hover:text-white transition-all text-red-500">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL POPUP (DETAIL & EDIT) */}
      {selectedData && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <form onSubmit={handleUpdate} className="bg-white w-full max-w-3xl rounded-[50px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-10">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-3xl font-black text-blue-900 uppercase tracking-tighter italic">
                    {selectedData.type === 'view' ? '📋 Detail Data' : '🛠️ Edit Layanan'}
                  </h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{activeTab}</p>
                </div>
                <button type="button" onClick={() => setSelectedData(null)} className="w-12 h-12 flex items-center justify-center bg-slate-50 rounded-full hover:bg-red-50 hover:text-red-500 transition-all font-bold">✕</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Bagian Data Dasar (SELALU READ ONLY) */}
                <div className="bg-slate-50 p-8 rounded-[35px] border border-slate-100 space-y-4">
                  <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">Data Dasar IKM (Terkunci)</h3>
                  <DetailBox label="Nama Lengkap" value={selectedData.data.ikm_binaan?.nama_lengkap} />
                  <DetailBox label="NIB" value={selectedData.data.ikm_binaan?.no_nib} />
                  <DetailBox label="No HP" value={selectedData.data.ikm_binaan?.no_hp} />
                  <DetailBox label="Alamat" value={selectedData.data.ikm_binaan?.alamat} />
                </div>

                {/* Bagian Data Layanan (BISA DIEDIT JIKA TYPE 'EDIT') */}
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-4">Inputan Spesifik Layanan</h3>
                  
                  <InputPopup 
                    label="Nomor Pendaftaran / Dokumen" 
                    name="nomor_dokumen" 
                    val={selectedData.data.nomor_dokumen} 
                    isEdit={selectedData.type === 'edit'} 
                  />

                  {activeTab === "Pendaftaran HKI Merek" && (
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-2 block">Sertifikat Merek</label>
                      <select 
                        name="status_sertifikat"
                        disabled={selectedData.type === 'view'}
                        defaultValue={selectedData.data.status_sertifikat}
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl p-4 font-black text-slate-700 outline-none appearance-none disabled:opacity-100"
                      >
                        <option>Telah Didaftar</option>
                        <option>Proses</option>
                        <option>Ditolak</option>
                      </select>
                    </div>
                  )}

                  <InputPopup 
                    label="Tahun Fasilitasi" 
                    name="tahun_fasilitasi" 
                    type="number"
                    val={selectedData.data.tahun_fasilitasi} 
                    isEdit={selectedData.type === 'edit'} 
                  />

                  <InputPopup 
                    label="Link Google Drive (Bukti/Sertifikat)" 
                    name="link_dokumen" 
                    val={selectedData.data.link_dokumen} 
                    isEdit={selectedData.type === 'edit'} 
                  />
                </div>
              </div>

              {selectedData.type === 'edit' && (
                <button type="submit" className="w-full mt-10 bg-blue-600 text-white p-6 rounded-[25px] font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all uppercase tracking-widest">
                  Update Data Sekarang
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

// Komponen Pendukung
function DetailBox({ label, value }: { label: string, value: string }) {
  return (
    <div>
      <label className="text-[9px] font-black text-slate-300 uppercase block ml-1">{label}</label>
      <p className="font-bold text-slate-700 text-sm leading-tight">{value || "—"}</p>
    </div>
  )
}

function InputPopup({ label, name, val, isEdit, type = "text" }: any) {
  return (
    <div>
      <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-2 block">{label}</label>
      {isEdit ? (
        <input
          name={name}
          type={type}
          defaultValue={val}
          className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl p-4 font-bold text-slate-700 outline-none transition-all"
        />
      ) : (
        <div className="w-full bg-slate-50 p-4 rounded-2xl font-bold text-slate-700 break-all text-sm">
          {val && val.toString().startsWith('http') ? (
            <a href={val} target="_blank" className="text-blue-600 underline">Klik Buka Link Drive</a>
          ) : (val || "—")}
        </div>
      )}
    </div>
  )
}