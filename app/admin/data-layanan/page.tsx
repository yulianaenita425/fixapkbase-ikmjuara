"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import jsPDF from "jspdf"
import "jspdf-autotable"
import * as XLSX from "xlsx"

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

    if (!error) setDataLayanan(data || [])
    setLoading(false)
  }

  // --- FITUR EXCEL ---
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(dataLayanan.map((d, i) => ({
      No: i + 1,
      Nama: d.ikm_binaan?.nama_lengkap,
      NIB: d.ikm_binaan?.no_nib,
      Layanan: d.jenis_layanan,
      Dokumen: d.nomor_dokumen,
      Tahun: d.tahun_fasilitasi
    })))
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data")
    XLSX.writeFile(workbook, `Data_${activeTab}.xlsx`)
  }

  // --- FITUR PDF ---
  const exportToPDF = () => {
    const doc = new jsPDF()
    doc.text(`Rekapitulasi ${activeTab}`, 14, 15)
    const tableData = dataLayanan.map((d, i) => [
      i + 1,
      d.ikm_binaan?.nama_lengkap,
      d.ikm_binaan?.no_nib,
      d.nomor_dokumen,
      d.tahun_fasilitasi
    ])
    ;(doc as any).autoTable({
      head: [['No', 'Nama IKM', 'NIB', 'No. Dokumen', 'Tahun']],
      body: tableData,
      startY: 20
    })
    doc.save(`Data_${activeTab}.pdf`)
  }

  const handleSoftDelete = async (id: string) => {
    if (confirm("Pindahkan ke Recycle Bin?")) {
      const { error } = await supabase.from("layanan_ikm_juara").update({ is_deleted: true }).eq("id", id)
      if (!error) fetchData()
    }
  }

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen font-sans text-slate-900">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black text-indigo-950 uppercase tracking-tighter italic flex items-center gap-3">
            <span className="bg-indigo-600 text-white p-2 rounded-2xl rotate-3">IKM</span> Juara Registry
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">
              Live Connection: Tersinkronisasi dengan IKM Binaan
            </p>
          </div>
        </div>

        {/* TOMBOL EXPORT */}
        <div className="flex gap-2">
          <button onClick={exportToExcel} className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-emerald-200 transition-all border border-emerald-200 shadow-sm">
            📊 Excel
          </button>
          <button onClick={exportToPDF} className="bg-rose-100 text-rose-700 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-rose-200 transition-all border border-rose-200 shadow-sm">
            📕 PDF
          </button>
        </div>
      </div>

      {/* TABS MENU */}
      <div className="flex flex-wrap gap-2 mb-8 p-2 bg-white rounded-[25px] shadow-sm border border-slate-100">
        {LAYANAN_LIST.map((layanan) => (
          <button
            key={layanan}
            onClick={() => setActiveTab(layanan)}
            className={`px-6 py-3 rounded-[20px] font-black text-[11px] uppercase tracking-wider transition-all ${
              activeTab === layanan ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-slate-400 hover:text-indigo-600"
            }`}
          >
            {layanan.replace("Pendaftaran ", "")}
          </button>
        ))}
      </div>

      {/* TABEL */}
      <div className="bg-white rounded-[45px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="p-8 text-center">No</th>
                <th className="p-8">Profil IKM Binaan</th>
                <th className="p-8">Detail Khusus Layanan</th>
                <th className="p-8">Tahun</th>
                <th className="p-8 text-center">Interaksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center font-black text-indigo-100 text-4xl">LOADING...</td></tr>
              ) : (
                dataLayanan.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-indigo-50/30 transition-all group">
                    <td className="p-8 text-center font-bold text-slate-300">#{(idx + 1).toString().padStart(2, '0')}</td>
                    <td className="p-8">
                      <div className="font-black text-indigo-950 text-base mb-1">{row.ikm_binaan?.nama_lengkap}</div>
                      <div className="grid grid-cols-2 gap-x-4 text-[10px] font-bold text-slate-400 uppercase">
                        <span>🆔 {row.ikm_binaan?.no_nib}</span>
                        <span>📞 {row.ikm_binaan?.no_hp}</span>
                      </div>
                    </td>
                    <td className="p-8">
                      {/* LOGIKA DETAIL KHUSUS SESUAI PERMINTAAN */}
                      {activeTab === "Pendaftaran Sertifikat Halal" ? (
                        <div className="space-y-1">
                          <p className="text-xs font-black text-slate-700">📜 {row.nomor_dokumen || "—"}</p>
                          <div className="flex gap-2">
                            <a href={row.link_dokumen} target="_blank" className="text-[9px] font-black text-emerald-600 hover:underline">🔗 SERTIFIKAT HALAL</a>
                            <a href={row.link_tambahan} target="_blank" className="text-[9px] font-black text-indigo-600 hover:underline">🖼️ LOGO HALAL</a>
                          </div>
                        </div>
                      ) : activeTab === "Pendaftaran Uji Nilai Gizi" ? (
                        <div className="space-y-1">
                          <p className="text-xs font-black text-slate-700">🧪 {row.nomor_dokumen || "—"}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">📅 UJI: {row.tanggal_uji || "—"}</p>
                          <a href={row.link_dokumen} target="_blank" className="text-[9px] font-black text-blue-600 hover:underline">📂 LHU NILAI GIZI</a>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-black text-slate-700">{row.nomor_dokumen || "—"}</p>
                          <div className="flex gap-2 mt-1">
                             {row.link_dokumen && <a href={row.link_dokumen} target="_blank" className="text-[9px] font-black text-indigo-500 uppercase">View Doc</a>}
                             {row.status_sertifikat && <span className="text-[9px] font-black text-amber-600 uppercase italic">Status: {row.status_sertifikat}</span>}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="p-8">
                      <span className="bg-slate-100 px-3 py-1 rounded-full font-black text-slate-500 text-[10px]">{row.tahun_fasilitasi}</span>
                    </td>
                    <td className="p-8">
                      <div className="flex justify-center gap-3">
                        <button onClick={() => setSelectedData({ type: 'view', data: row })} className="w-10 h-10 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm">👁️</button>
                        <button onClick={() => setSelectedData({ type: 'edit', data: row })} className="w-10 h-10 flex items-center justify-center bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-500 hover:text-white transition-all shadow-sm">🎨</button>
                        <button onClick={() => handleSoftDelete(row.id)} className="w-10 h-10 flex items-center justify-center bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL VIEW / EDIT (STYLING BARU) */}
      {selectedData && (
        <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-xl flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-2xl rounded-[50px] shadow-2xl overflow-hidden border border-white/20">
            <div className="p-10">
              <div className="flex justify-between items-center mb-8 border-b pb-6">
                <h2 className="text-2xl font-black text-indigo-950 uppercase italic">{selectedData.type === 'view' ? '🔍 Informasi' : '🎨 Kustomisasi'}</h2>
                <button onClick={() => setSelectedData(null)} className="text-slate-300 hover:text-rose-500 font-bold text-2xl transition-colors">✕</button>
              </div>

              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                {/* DATA DASAR TERKUNCI */}
                <div className="bg-indigo-50/50 p-6 rounded-[30px] border border-indigo-100">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Profil Permanen</p>
                  <div className="grid grid-cols-2 gap-4">
                    <DataBox label="Pemilik" value={selectedData.data.ikm_binaan?.nama_lengkap} />
                    <DataBox label="NIB" value={selectedData.data.ikm_binaan?.no_nib} />
                    <DataBox label="Kontak" value={selectedData.data.ikm_binaan?.no_hp} />
                    <DataBox label="Wilayah" value={selectedData.data.ikm_binaan?.alamat} />
                  </div>
                </div>

                {/* FORM INPUT SESUAI TAB */}
                <div className="space-y-4 pt-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detail {activeTab}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputInteraktif label="No. Dokumen" val={selectedData.data.nomor_dokumen} />
                    <InputInteraktif label="Tahun" val={selectedData.data.tahun_fasilitasi} />
                    {activeTab === "Pendaftaran Uji Nilai Gizi" && <InputInteraktif label="Tgl Uji" val={selectedData.data.tanggal_uji} />}
                    <div className="md:col-span-2">
                       <InputInteraktif label="Link Drive" val={selectedData.data.link_dokumen} />
                    </div>
                  </div>
                </div>
              </div>

              {selectedData.type === 'edit' && (
                <button className="w-full mt-8 bg-indigo-600 text-white p-5 rounded-[25px] font-black uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all">
                  Simpan Perubahan
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DataBox({ label, value }: any) {
  return (
    <div>
      <span className="text-[9px] font-black text-indigo-300 uppercase block leading-none mb-1">{label}</span>
      <p className="text-xs font-bold text-indigo-900">{value || "—"}</p>
    </div>
  )
}

function InputInteraktif({ label, val }: any) {
  return (
    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
      <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">{label}</label>
      <input defaultValue={val} className="bg-transparent w-full text-xs font-black text-slate-700 outline-none" />
    </div>
  )
}