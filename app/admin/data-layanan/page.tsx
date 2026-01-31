"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"

// Jenis Layanan sesuai Kategori
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
  const [selectedData, setSelectedData] = useState<{type: 'view' | 'edit', data: any} | null>(null)

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
    
    if (!error) setDataLayanan(data || [])
    setLoading(false)
  }

  const handleSoftDelete = async (id: string) => {
    if (confirm("Pindahkan data ke Recycle Bin?")) {
      const { error } = await supabase
        .from("layanan_ikm_juara")
        .update({ is_deleted: true })
        .eq("id", id)
      if (!error) fetchData()
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
      alert("Data berhasil diperbarui!")
      setSelectedData(null)
      fetchData()
    }
  }

  return (
    <div className="p-8 bg-slate-100 min-h-screen text-slate-900 font-sans">
      <h1 className="text-3xl font-black text-blue-900 mb-6 uppercase tracking-tighter italic">
        📊 Data Layanan IKM Juara
      </h1>

      {/* SUB MENU TABS */}
      <div className="flex flex-wrap gap-2 mb-6">
        {LAYANAN_LIST.map((layanan) => (
          <button
            key={layanan}
            onClick={() => setActiveTab(layanan)}
            className={`px-4 py-2 rounded-full font-bold text-xs transition-all shadow-sm ${
              activeTab === layanan 
              ? "bg-blue-600 text-white shadow-blue-200" 
              : "bg-white text-slate-500 hover:bg-slate-200"
            }`}
          >
            {layanan.replace("Pendaftaran ", "")}
          </button>
        ))}
      </div>

      {/* TABEL DATA */}
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-black text-slate-600">
              <tr>
                <th className="p-5 text-center w-16">No</th>
                <th className="p-5">Data Dasar IKM</th>
                <th className="p-5">Detail Layanan ({activeTab})</th>
                <th className="p-5">Tahun</th>
                <th className="p-5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="p-10 text-center font-bold animate-pulse text-slate-400">Memuat Data...</td></tr>
              ) : dataLayanan.length === 0 ? (
                <tr><td colSpan={5} className="p-10 text-center font-bold text-slate-400 text-sm">Belum ada data untuk layanan ini.</td></tr>
              ) : (
                dataLayanan.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-5 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-5">
                      <div className="font-black text-blue-900 text-sm">{row.ikm_binaan?.nama_lengkap || row.ikm_binaan?.nama}</div>
                      <div className="text-[10px] font-bold text-slate-500 mt-1 uppercase">
                        NIB: {row.ikm_binaan?.no_nib || row.ikm_binaan?.nib} <br/>
                        HP: {row.ikm_binaan?.no_hp || row.ikm_binaan?.hp}
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="text-sm font-bold text-slate-700">{row.nomor_dokumen || "—"}</div>
                      {row.link_dokumen && (
                        <a href={row.link_dokumen} target="_blank" className="text-blue-600 hover:underline text-[10px] font-bold flex items-center gap-1 mt-1">
                          📁 Bukti Dokumen (Drive)
                        </a>
                      )}
                      {row.status_sertifikat && (
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black mt-2 inline-block uppercase ${
                          row.status_sertifikat === 'Telah Didaftar' ? 'bg-green-100 text-green-700' :
                          row.status_sertifikat === 'Proses' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {row.status_sertifikat}
                        </span>
                      )}
                    </td>
                    <td className="p-5 font-black text-slate-600 text-sm">{row.tahun_fasilitasi}</td>
                    <td className="p-5">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => setSelectedData({type: 'view', data: row})} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all" title="Lihat Detail">👁️</button>
                        <button onClick={() => setSelectedData({type: 'edit', data: row})} className="p-2 bg-amber-50 hover:bg-amber-100 rounded-xl text-amber-600 transition-all" title="Edit Data">✏️</button>
                        <button onClick={() => handleSoftDelete(row.id)} className="p-2 bg-red-50 hover:bg-red-100 rounded-xl text-red-600 transition-all" title="Hapus">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP MODAL (VIEW & EDIT) */}
      {selectedData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleUpdate} className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-black text-blue-900 uppercase tracking-tighter">
                    {selectedData.type === 'view' ? '🔍 Detail Data Full' : '✏️ Update Data Layanan'}
                  </h2>
                  <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{activeTab}</p>
                </div>
                <button type="button" onClick={() => setSelectedData(null)} className="bg-slate-100 p-2 rounded-full hover:bg-red-50 hover:text-red-500 transition-all font-bold">✕</button>
              </div>

              <div className="space-y-6">
                {/* Data Dasar (Read Only) */}
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 grid grid-cols-2 gap-4">
                  <div className="col-span-2 text-[10px] font-black text-blue-600 uppercase mb-1 tracking-widest">Data Dasar IKM (Fixed)</div>
                  <DetailItem label="Nama Lengkap" value={selectedData.data.ikm_binaan.nama_lengkap || selectedData.data.ikm_binaan.nama} />
                  <DetailItem label="NIB" value={selectedData.data.ikm_binaan.no_nib || selectedData.data.ikm_binaan.nib} />
                  <DetailItem label="No HP" value={selectedData.data.ikm_binaan.no_hp || selectedData.data.ikm_binaan.hp} />
                  <DetailItem label="Alamat" value={selectedData.data.ikm_binaan.alamat} />
                </div>

                {/* Data Inputan Layanan */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-2 text-[10px] font-black text-green-600 uppercase mb-1 tracking-widest">Data Inputan {activeTab}</div>
                  
                  <InputPopup 
                    label="Nomor Dokumen/Pendaftaran" 
                    name="nomor_dokumen" 
                    val={selectedData.data.nomor_dokumen} 
                    isEdit={selectedData.type === 'edit'} 
                  />
                  
                  <InputPopup 
                    label="Tahun Fasilitasi" 
                    name="tahun_fasilitasi" 
                    type="number"
                    val={selectedData.data.tahun_fasilitasi} 
                    isEdit={selectedData.type === 'edit'} 
                  />

                  {activeTab === "Pendaftaran HKI Merek" && (
                    <div className="md:col-span-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Sertifikat Merek</label>
                      <select 
                        name="status_sertifikat"
                        disabled={selectedData.type === 'view'}
                        className="w-full border-2 border-slate-100 rounded-2xl p-3 bg-white font-bold outline-none focus:border-blue-500 disabled:opacity-70"
                        defaultValue={selectedData.data.status_sertifikat}
                      >
                        <option>Telah Didaftar</option><option>Proses</option><option>Ditolak</option>
                      </select>
                    </div>
                  )}

                  <InputPopup 
                    label="Link Bukti Dokumen (Drive)" 
                    name="link_dokumen" 
                    val={selectedData.data.link_dokumen} 
                    isEdit={selectedData.type === 'edit'} 
                    className="md:col-span-2"
                  />
                </div>
              </div>

              {selectedData.type === 'edit' && (
                <button type="submit" className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-200 active:scale-95 transition-all">
                  💾 SIMPAN PERUBAHAN DATA
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function DetailItem({ label, value }: { label: string, value: string }) {
  return (
    <div>
      <label className="text-[9px] font-bold text-slate-400 uppercase block">{label}</label>
      <p className="font-bold text-slate-700 text-sm">{value || "—"}</p>
    </div>
  )
}

function InputPopup({ label, name, val, isEdit, type="text", className="" }: any) {
  return (
    <div className={className}>
      <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">{label}</label>
      {isEdit ? (
        <input 
          name={name}
          type={type}
          defaultValue={val}
          className="w-full border-2 border-slate-100 rounded-2xl p-3 bg-white font-bold outline-none focus:border-blue-500"
        />
      ) : (
        <div className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-3 font-bold text-slate-700 break-all text-sm">
          {val && type === "text" && val.startsWith('http') ? (
            <a href={val} target="_blank" className="text-blue-600 underline">Klik Buka Link</a>
          ) : (val || "—")}
        </div>
      )}
    </div>
  )
}