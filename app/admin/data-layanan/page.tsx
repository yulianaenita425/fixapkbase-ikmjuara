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
  const [isSaving, setIsSaving] = useState(false)

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

  // --- FUNGSI UPDATE DATA (DIPERBAIKI) ---
  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedData) return
    
    setIsSaving(true)
    const formData = new FormData(e.currentTarget)
    
    // Mengambil data dari form sesuai dengan kolom di database
    const payload = {
      nomor_dokumen: formData.get("nomor_dokumen"),
      tahun_fasilitasi: formData.get("tahun_fasilitasi"),
      link_dokumen: formData.get("link_dokumen"),
      link_tambahan: formData.get("link_tambahan"), // Untuk Logo Halal
      tanggal_uji: formData.get("tanggal_uji"), // Khusus Nilai Gizi
      status_sertifikat: formData.get("status_sertifikat"),
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from("layanan_ikm_juara")
      .update(payload)
      .eq("id", selectedData.data.id)

    if (error) {
      alert("Gagal menyimpan: " + error.message)
    } else {
      alert("Data berhasil diperbarui! ✅")
      setSelectedData(null)
      fetchData()
    }
    setIsSaving(false)
  }

  const handleSoftDelete = async (id: string) => {
    if (confirm("Kirim data ini ke Recycle Bin?")) {
      const { error } = await supabase.from("layanan_ikm_juara").update({ is_deleted: true }).eq("id", id)
      if (!error) fetchData()
    }
  }

  // --- EXPORT LOGIC ---
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(dataLayanan.map((d, i) => ({
      No: i + 1, Nama: d.ikm_binaan?.nama_lengkap, NIB: d.ikm_binaan?.no_nib, Dokumen: d.nomor_dokumen, Tahun: d.tahun_fasilitasi
    })))
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Data"); XLSX.writeFile(wb, `Data_${activeTab}.xlsx`)
  }

  return (
    <div className="p-8 bg-slate-200 min-h-screen font-sans text-slate-900">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-6 rounded-3xl shadow-md border-b-4 border-indigo-600">
        <div>
          <h1 className="text-4xl font-black text-indigo-900 uppercase italic tracking-tighter">
            📊 DATA LAYANAN IKM JUARA
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="flex h-3 w-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span>
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Database Sinkron: IKM Binaan</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={exportToExcel} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-black text-xs hover:scale-105 transition-all shadow-lg shadow-emerald-200 uppercase">Excel</button>
          <button onClick={() => window.print()} className="bg-rose-600 text-white px-6 py-2 rounded-xl font-black text-xs hover:scale-105 transition-all shadow-lg shadow-rose-200 uppercase">PDF</button>
        </div>
      </div>

      {/* TABS MENU - DIPERTEGAS */}
      <div className="flex flex-wrap gap-2 mb-6">
        {LAYANAN_LIST.map((l) => (
          <button
            key={l}
            onClick={() => setActiveTab(l)}
            className={`px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all border-2 ${
              activeTab === l ? "bg-indigo-600 border-indigo-700 text-white shadow-xl" : "bg-white border-slate-300 text-slate-500 hover:border-indigo-400"
            }`}
          >
            {l.replace("Pendaftaran ", "")}
          </button>
        ))}
      </div>

      {/* TABEL - HIGH CONTRAST */}
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-slate-300 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-indigo-900 text-white border-b-4 border-indigo-700">
            <tr className="text-[11px] font-black uppercase tracking-widest">
              <th className="p-5 text-center w-16">No</th>
              <th className="p-5">Profil IKM Binaan (Terkunci)</th>
              <th className="p-5">Detail Khusus: {activeTab}</th>
              <th className="p-5 text-center">Tahun</th>
              <th className="p-5 text-center">Aksi Interaktif</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-slate-200">
            {loading ? (
              <tr><td colSpan={5} className="p-20 text-center font-black text-slate-400 animate-pulse">MEMUAT DATA...</td></tr>
            ) : dataLayanan.map((row, idx) => (
              <tr key={row.id} className="hover:bg-indigo-50 transition-colors">
                <td className="p-5 text-center font-black text-slate-400 border-r border-slate-100">{idx + 1}</td>
                <td className="p-5">
                  <div className="font-black text-indigo-900 text-base">{row.ikm_binaan?.nama_lengkap}</div>
                  <div className="text-[10px] font-bold text-slate-600 uppercase mt-1">
                    NIB: {row.ikm_binaan?.no_nib} | HP: {row.ikm_binaan?.no_hp}
                  </div>
                </td>
                <td className="p-5 border-l border-slate-100">
                  {/* LOGIKA TAMPILAN KHUSUS */}
                  {activeTab === "Pendaftaran Sertifikat Halal" ? (
                    <div className="space-y-1">
                      <p className="font-black text-slate-800 text-xs">📜 No: {row.nomor_dokumen || "-"}</p>
                      <div className="flex gap-2">
                         <a href={row.link_dokumen} target="_blank" className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-600 hover:text-white">SERTIFIKAT</a>
                         <a href={row.link_tambahan} target="_blank" className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 hover:bg-emerald-600 hover:text-white">LOGO HALAL</a>
                      </div>
                    </div>
                  ) : activeTab === "Pendaftaran Uji Nilai Gizi" ? (
                    <div className="space-y-1">
                      <p className="font-black text-slate-800 text-xs">🧪 No LHU: {row.nomor_dokumen || "-"}</p>
                      <p className="text-[10px] font-bold text-indigo-600 uppercase">📅 Tgl Uji: {row.tanggal_uji || "-"}</p>
                      <a href={row.link_dokumen} target="_blank" className="text-[9px] font-black text-rose-600 hover:underline italic">Klik Link LHU Gizi</a>
                    </div>
                  ) : (
                    <div>
                       <p className="font-black text-slate-800 text-xs italic">{row.nomor_dokumen || "—"}</p>
                       {row.link_dokumen && <a href={row.link_dokumen} target="_blank" className="text-[9px] font-black text-blue-500 underline uppercase">Buka Dokumen</a>}
                    </div>
                  )}
                </td>
                <td className="p-5 text-center">
                  <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-lg font-black text-xs border border-indigo-200">{row.tahun_fasilitasi}</span>
                </td>
                <td className="p-5">
                  <div className="flex justify-center gap-3">
                    <button onClick={() => setSelectedData({ type: 'view', data: row })} className="w-10 h-10 flex items-center justify-center bg-white border-2 border-slate-200 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm">👁️</button>
                    <button onClick={() => setSelectedData({ type: 'edit', data: row })} className="w-10 h-10 flex items-center justify-center bg-white border-2 border-amber-300 rounded-xl hover:bg-amber-500 hover:text-white transition-all shadow-sm text-amber-500">✏️</button>
                    <button onClick={() => handleSoftDelete(row.id)} className="w-10 h-10 flex items-center justify-center bg-white border-2 border-rose-200 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm text-rose-500">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* POPUP VIEW / EDIT - LEBIH TEGAS */}
      {selectedData && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleUpdate} className="bg-white w-full max-w-3xl rounded-[30px] border-4 border-indigo-600 shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-indigo-900 p-6 flex justify-between items-center">
              <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">
                {selectedData.type === 'view' ? '🔍 Detail Informasi' : '✏️ Edit Data Layanan'}
              </h2>
              <button type="button" onClick={() => setSelectedData(null)} className="text-white hover:text-rose-400 font-black text-2xl">✕</button>
            </div>

            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto bg-slate-50">
              {/* DATA DASAR (DISABLED) */}
              <div className="grid grid-cols-2 gap-4 bg-white p-6 rounded-2xl border-2 border-slate-200">
                <div className="col-span-2 text-[10px] font-black text-indigo-600 uppercase border-b pb-2 mb-2">Profil IKM (Permanen)</div>
                <DataField label="Nama Lengkap" value={selectedData.data.ikm_binaan?.nama_lengkap} />
                <DataField label="NIB" value={selectedData.data.ikm_binaan?.no_nib} />
                <DataField label="Nomor HP" value={selectedData.data.ikm_binaan?.no_hp} />
                <DataField label="Alamat" value={selectedData.data.ikm_binaan?.alamat} />
              </div>

              {/* INPUT EDITABLE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white rounded-2xl border-2 border-slate-200 shadow-inner">
                <div className="col-span-2 text-[10px] font-black text-amber-600 uppercase border-b pb-2 mb-2">Input Data Khusus ({activeTab})</div>
                
                <InputField label="Nomor Dokumen / Sertifikat" name="nomor_dokumen" val={selectedData.data.nomor_dokumen} isEdit={selectedData.type === 'edit'} />
                
                <InputField label="Tahun Fasilitasi" name="tahun_fasilitasi" val={selectedData.data.tahun_fasilitasi} isEdit={selectedData.type === 'edit'} />

                {activeTab === "Pendaftaran Sertifikat Halal" && (
                  <InputField label="Link Google Drive (Logo Halal)" name="link_tambahan" val={selectedData.data.link_tambahan} isEdit={selectedData.type === 'edit'} />
                )}

                {activeTab === "Pendaftaran Uji Nilai Gizi" && (
                  <InputField label="Tanggal Hasil Uji (LHU)" name="tanggal_uji" type="date" val={selectedData.data.tanggal_uji} isEdit={selectedData.type === 'edit'} />
                )}

                <div className="md:col-span-2">
                  <InputField label="Link Google Drive (Sertifikat/LHU)" name="link_dokumen" val={selectedData.data.link_dokumen} isEdit={selectedData.type === 'edit'} />
                </div>
              </div>
            </div>

            {selectedData.type === 'edit' && (
              <div className="p-6 bg-slate-100 border-t-4 border-indigo-600">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className={`w-full p-5 rounded-2xl font-black text-lg uppercase tracking-widest transition-all shadow-xl ${
                    isSaving ? "bg-slate-400" : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 active:scale-95"
                  }`}
                >
                  {isSaving ? "SEDANG MENYIMPAN..." : "💾 SIMPAN PERUBAHAN"}
                </button>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  )
}

// Sub-Komponen UI
function DataField({ label, value }: any) {
  return (
    <div>
      <label className="text-[9px] font-black text-slate-400 uppercase block leading-none mb-1">{label}</label>
      <p className="text-sm font-black text-slate-700">{value || "—"}</p>
    </div>
  )
}

function InputField({ label, name, val, isEdit, type = "text" }: any) {
  return (
    <div>
      <label className="text-[10px] font-black text-slate-500 uppercase block mb-2 ml-1">{label}</label>
      {isEdit ? (
        <input 
          name={name}
          type={type}
          defaultValue={val}
          className="w-full bg-white border-2 border-slate-300 focus:border-indigo-600 rounded-xl p-3 font-bold text-slate-800 outline-none transition-all shadow-sm"
        />
      ) : (
        <div className="bg-slate-100 p-3 rounded-xl font-bold text-slate-700 border border-slate-200 text-sm">
          {val || "—"}
        </div>
      )}
    </div>
  )
}