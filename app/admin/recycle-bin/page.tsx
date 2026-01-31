"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"

export default function RecycleBinLayanan() {
  const [deletedData, setDeletedData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDeletedData()
  }, [])

  const fetchDeletedData = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("layanan_ikm_juara")
      .select(`*, ikm_binaan(*)`)
      .eq("is_deleted", true) // Mengambil hanya data yang sudah dihapus sementara
      .order('updated_at', { ascending: false })

    if (error) {
      console.error("Gagal memuat data sampah:", error.message)
    } else {
      setDeletedData(data || [])
    }
    setLoading(false)
  }

  const handleRestore = async (id: string) => {
    if (confirm("Pulihkan data ini ke tabel utama?")) {
      const { error } = await supabase
        .from("layanan_ikm_juara")
        .update({ is_deleted: false })
        .eq("id", id)

      if (!error) {
        alert("Data berhasil dipulihkan! ✅")
        fetchDeletedData()
      }
    }
  }

  const handlePermanentDelete = async (id: string) => {
    if (confirm("PERINGATAN: Data akan dihapus permanen dari database. Lanjutkan?")) {
      const { error } = await supabase
        .from("layanan_ikm_juara")
        .delete()
        .eq("id", id)

      if (!error) {
        alert("Data dihapus selamanya! 🗑️")
        fetchDeletedData()
      }
    }
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-red-600 uppercase italic tracking-tighter">
            🗑️ Recycle Bin
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Tempat Pemulihan Data Layanan IKM Juara
          </p>
        </div>
        <button 
          onClick={() => window.history.back()}
          className="bg-white border border-slate-200 px-6 py-2 rounded-2xl font-black text-xs hover:bg-slate-100 transition-all"
        >
          ← KEMBALI
        </button>
      </div>

      <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-200">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
              <th className="p-6 text-center">No</th>
              <th className="p-6">Data IKM</th>
              <th className="p-6">Jenis Layanan</th>
              <th className="p-6">Tahun</th>
              <th className="p-6 text-center">Aksi Pemulihan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="p-20 text-center font-black text-slate-300 animate-pulse">MENGECEK TEMPAT SAMPAH...</td></tr>
            ) : deletedData.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-20 text-center font-bold text-slate-400 italic">
                  Tempat sampah kosong. Tidak ada data yang dihapus.
                </td>
              </tr>
            ) : (
              deletedData.map((row, idx) => (
                <tr key={row.id} className="hover:bg-red-50/30 transition-colors">
                  <td className="p-6 text-center font-bold text-slate-300">{idx + 1}</td>
                  <td className="p-6">
                    <div className="font-black text-slate-800 text-sm">{row.ikm_binaan?.nama_lengkap || "Data Tidak Ditemukan"}</div>
                    <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
                      NIB: {row.ikm_binaan?.no_nib}
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="bg-slate-100 text-[10px] px-3 py-1 rounded-full font-black text-slate-600 uppercase">
                      {row.jenis_layanan}
                    </span>
                  </td>
                  <td className="p-6 font-black text-slate-500">{row.tahun_fasilitasi}</td>
                  <td className="p-6">
                    <div className="flex justify-center gap-3">
                      <button 
                        onClick={() => handleRestore(row.id)}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl font-black text-[10px] hover:bg-green-700 shadow-lg shadow-green-100 transition-all uppercase"
                      >
                        🔄 Pulihkan
                      </button>
                      <button 
                        onClick={() => handlePermanentDelete(row.id)}
                        className="flex items-center gap-2 bg-white border border-red-200 text-red-500 px-4 py-2 rounded-xl font-black text-[10px] hover:bg-red-50 transition-all uppercase"
                      >
                        ❌ Hapus Permanen
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}