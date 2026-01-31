"use client"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"

export default function DataLayananIKM() {
  const [dataLayanan, setDataLayanan] = useState<any[]>([])
  const [selectedData, setSelectedData] = useState<any>(null) // Untuk Popup Detail/Edit

  useEffect(() => {
    fetchLayanan()
  }, [])

  const fetchLayanan = async () => {
    const { data, error } = await supabase
      .from("layanan_ikm_juara")
      .select(`
        *,
        ikm_binaan (*)
      `)
    if (!error) setDataLayanan(data)
  }

  const handleSoftDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return
    
    const { error } = await supabase
      .from("layanan_ikm_juara")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
    
    if (!error) {
      setDataLayanan(dataLayanan.filter(item => item.id !== id))
    }
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <h1 className="text-2xl font-black mb-6">REKAPITULASI LAYANAN IKM JUARA</h1>
      
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead className="bg-blue-900 text-white text-xs uppercase">
            <tr>
              <th className="p-4">Data Dasar IKM</th>
              <th className="p-4">Jenis Layanan</th>
              <th className="p-4">Detail Dokumen</th>
              <th className="p-4">Tahun</th>
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y">
            {dataLayanan.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                <td className="p-4">
                  <div className="font-bold">{row.ikm_binaan?.nama || row.ikm_binaan?.nama_lengkap}</div>
                  <div className="text-[10px] text-slate-500">NIB: {row.ikm_binaan?.no_nib} | HP: {row.ikm_binaan?.no_hp || row.ikm_binaan?.hp}</div>
                </td>
                <td className="p-4"><span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-bold text-[10px]">{row.jenis_layanan}</span></td>
                <td className="p-4">
                  <div className="text-xs font-mono">{row.nomor_dokumen || "-"}</div>
                  {row.link_dokumen && <a href={row.link_dokumen} target="_blank" className="text-blue-500 underline text-[10px]">Buka Link Drive</a>}
                </td>
                <td className="p-4 font-bold">{row.tahun_fasilitasi}</td>
                <td className="p-4">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => setSelectedData({type: 'view', data: row})} className="p-2 bg-slate-100 rounded-lg">👁️</button>
                    <button onClick={() => setSelectedData({type: 'edit', data: row})} className="p-2 bg-amber-100 rounded-lg text-amber-600">✏️</button>
                    <button onClick={() => handleSoftDelete(row.id)} className="p-2 bg-red-100 rounded-lg text-red-600">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL POPUP (Detail / Edit) */}
      {selectedData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-black uppercase tracking-tighter">
                {selectedData.type === 'view' ? 'Detail Data Full' : 'Edit Data Layanan'}
              </h2>
              <button onClick={() => setSelectedData(null)} className="text-slate-400 text-2xl">×</button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Seksi Data Dasar */}
              <div className="col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-blue-600 uppercase mb-2">Data Dasar IKM Binaan</p>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <p><strong>NIB:</strong> {selectedData.data.ikm_binaan.no_nib}</p>
                  <p><strong>NIK:</strong> {selectedData.data.ikm_binaan.no_nik || selectedData.data.ikm_binaan.nik}</p>
                  <p><strong>Nama:</strong> {selectedData.data.ikm_binaan.nama_lengkap}</p>
                  <p><strong>HP:</strong> {selectedData.data.ikm_binaan.no_hp || selectedData.data.ikm_binaan.hp}</p>
                </div>
              </div>

              {/* Seksi Data Layanan - Inputan jika Edit, Text jika View */}
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-green-600 uppercase mb-4 tracking-widest">Detail Layanan: {selectedData.data.jenis_layanan}</p>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400">NOMOR DOKUMEN / PENDAFTARAN</label>
                    <input 
                      disabled={selectedData.type === 'view'}
                      className="w-full border-b p-2 outline-none focus:border-blue-500 disabled:bg-transparent"
                      defaultValue={selectedData.data.nomor_dokumen}
                    />
                  </div>
                  {/* ... Tambahkan field lain sesuai jenis layanan seperti Link Drive, Tahun, dll ... */}
                </div>
              </div>
            </div>

            {selectedData.type === 'edit' && (
              <button className="w-full mt-8 bg-blue-600 text-white p-4 rounded-2xl font-bold shadow-lg shadow-blue-200">
                UPDATE DATA SEKARANG
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}