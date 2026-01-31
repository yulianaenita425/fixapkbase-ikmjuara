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

  // --- LOGIKA DINAMIS UNTUK EXPORT DATA ---
  const prepareExportData = () => {
    return dataLayanan.map((d, i) => {
      // Data Dasar yang selalu ada
      const baseData = {
        "No": i + 1,
        "NIB": d.ikm_binaan?.no_nib,
        "Nama Lengkap": d.ikm_binaan?.nama_lengkap,
        "No HP": d.ikm_binaan?.no_hp,
        "Alamat": d.ikm_binaan?.alamat,
        "Tahun Fasilitasi": d.tahun_fasilitasi,
      }

      // Kolom Tambahan Berdasarkan Tab
      if (activeTab === "Pendaftaran HKI Merek") {
        return {
          ...baseData,
          "Nomor Pendaftaran HKI": d.nomor_dokumen,
          "Link Bukti Daftar": d.link_tambahan,
          "Status Sertifikat": d.status_sertifikat,
          "Link Sertifikat HKI": d.link_dokumen
        }
      } else if (activeTab === "Pendaftaran Sertifikat Halal") {
        return {
          ...baseData,
          "Nomor Sertifikat Halal": d.nomor_dokumen,
          "Link Sertifikat Halal": d.link_dokumen,
          "Link Logo Halal": d.link_tambahan
        }
      } else if (activeTab === "Pendaftaran Uji Nilai Gizi") {
        return {
          ...baseData,
          "Nomor LHU Nilai Gizi": d.nomor_dokumen,
          "Tanggal Hasil Uji": d.tanggal_uji,
          "Link LHU Nilai Gizi": d.link_dokumen
        }
      }
      
      return { ...baseData, "Nomor Dokumen": d.nomor_dokumen, "Link Dokumen": d.link_dokumen }
    })
  }

  const exportToExcel = () => {
    const data = prepareExportData()
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Layanan")
    XLSX.writeFile(wb, `REKAP_${activeTab.toUpperCase()}.xlsx`)
  }

  const exportToPDF = () => {
    const data = prepareExportData()
    const doc = new jsPDF("l", "mm", "a4") // Landscape agar muat banyak kolom
    const headers = [Object.keys(data[0])]
    const body = data.map(item => Object.values(item))

    doc.text(`REKAPITULASI DATA: ${activeTab.toUpperCase()}`, 14, 15)
    ;(doc as any).autoTable({
      head: headers,
      body: body,
      startY: 20,
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [30, 27, 75] } // Indigo 900
    })
    doc.save(`REKAP_${activeTab.toUpperCase()}.pdf`)
  }

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedData) return
    setIsSaving(true)
    const formData = new FormData(e.currentTarget)
    
    const payload = {
      nomor_dokumen: formData.get("nomor_dokumen"),
      tahun_fasilitasi: formData.get("tahun_fasilitasi"),
      link_dokumen: formData.get("link_dokumen"),
      link_tambahan: formData.get("link_tambahan"),
      tanggal_uji: formData.get("tanggal_uji"),
      status_sertifikat: formData.get("status_sertifikat"),
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase.from("layanan_ikm_juara").update(payload).eq("id", selectedData.data.id)

    if (error) {
      alert("Gagal: " + error.message)
    } else {
      alert("Data diperbarui! ✅")
      setSelectedData(null)
      fetchData()
    }
    setIsSaving(false)
  }

  return (
    <div className="p-8 bg-slate-200 min-h-screen font-sans text-slate-900">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-8 rounded-[35px] shadow-xl border-b-[6px] border-indigo-700">
        <div>
          <h1 className="text-4xl font-black text-indigo-950 uppercase italic tracking-tighter">
            🚀 JUARA REGISTRY <span className="text-slate-400 not-italic font-light">| DATA LAYANAN</span>
          </h1>
          <div className="flex items-center gap-2 mt-2 bg-indigo-50 w-fit px-4 py-1 rounded-full border border-indigo-100">
            <span className="flex h-3 w-3 bg-green-500 rounded-full animate-ping"></span>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Live Data: Terhubung IKM Binaan</p>
          </div>
        </div>

        <div className="flex gap-4">
          <button onClick={exportToExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-2xl font-black text-xs shadow-lg transition-all active:scale-95 uppercase">Excel</button>
          <button onClick={exportToPDF} className="bg-rose-600 hover:bg-rose-700 text-white px-8 py-3 rounded-2xl font-black text-xs shadow-lg transition-all active:scale-95 uppercase">PDF</button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex flex-wrap gap-2 mb-8">
        {LAYANAN_LIST.map((l) => (
          <button
            key={l}
            onClick={() => setActiveTab(l)}
            className={`px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border-2 shadow-sm ${
              activeTab === l ? "bg-indigo-700 border-indigo-900 text-white translate-y-[-2px]" : "bg-white border-slate-300 text-slate-500 hover:border-indigo-400"
            }`}
          >
            {l.replace("Pendaftaran ", "")}
          </button>
        ))}
      </div>

      {/* TABLE - HIGH CONTRAST */}
      <div className="bg-white rounded-[40px] shadow-2xl border-2 border-slate-300 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-indigo-950 text-white border-b-4 border-indigo-800">
            <tr className="text-[11px] font-black uppercase tracking-widest">
              <th className="p-6 text-center w-20">NO</th>
              <th className="p-6">PROFIL IKM (DASAR)</th>
              <th className="p-6">DETAIL KHUSUS {activeTab.toUpperCase()}</th>
              <th className="p-6 text-center">TAHUN</th>
              <th className="p-6 text-center">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-slate-200">
            {loading ? (
              <tr><td colSpan={5} className="p-32 text-center font-black text-slate-300 text-5xl italic animate-pulse">LOADING DATA...</td></tr>
            ) : dataLayanan.map((row, idx) => (
              <tr key={row.id} className="hover:bg-slate-50 transition-all">
                <td className="p-6 text-center font-black text-slate-400 text-lg border-r border-slate-100 bg-slate-50/50">{(idx + 1).toString().padStart(2, '0')}</td>
                <td className="p-6">
                  <div className="font-black text-indigo-950 text-lg leading-tight uppercase underline decoration-indigo-200 decoration-4 underline-offset-4">{row.ikm_binaan?.nama_lengkap}</div>
                  <div className="text-[10px] font-black text-slate-500 mt-2 flex flex-col gap-1">
                    <span className="bg-slate-100 w-fit px-2 py-0.5 rounded">🆔 NIB: {row.ikm_binaan?.no_nib}</span>
                    <span className="bg-slate-100 w-fit px-2 py-0.5 rounded">📞 HP: {row.ikm_binaan?.no_hp}</span>
                  </div>
                </td>
                <td className="p-6 border-l border-slate-50">
                  {activeTab === "Pendaftaran Sertifikat Halal" ? (
                    <div className="space-y-2">
                      <p className="font-black text-slate-800 text-sm">📜 NO: {row.nomor_dokumen || "-"}</p>
                      <div className="flex gap-2">
                         <a href={row.link_dokumen} target="_blank" className="text-[9px] font-black bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-800 transition-all">Sertifikat</a>
                         <a href={row.link_tambahan} target="_blank" className="text-[9px] font-black bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-800 transition-all">Logo Halal</a>
                      </div>
                    </div>
                  ) : activeTab === "Pendaftaran Uji Nilai Gizi" ? (
                    <div className="space-y-2">
                      <p className="font-black text-slate-800 text-sm">🧪 LHU: {row.nomor_dokumen || "-"}</p>
                      <p className="text-[10px] font-black text-rose-600 uppercase underline decoration-2 underline-offset-4">Tanggal: {row.tanggal_uji || "-"}</p>
                      <a href={row.link_dokumen} target="_blank" className="text-[9px] font-black bg-slate-800 text-white px-3 py-1.5 rounded-lg inline-block">Buka LHU Gizi</a>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-black text-indigo-900 text-sm italic">{row.nomor_dokumen || "—"}</p>
                      {row.status_sertifikat && <span className="text-[9px] font-black bg-amber-100 text-amber-700 border border-amber-300 px-2 py-0.5 rounded uppercase">Status: {row.status_sertifikat}</span>}
                      {row.link_dokumen && <a href={row.link_dokumen} target="_blank" className="block text-[9px] font-black text-blue-600 underline">Buka Tautan Google Drive</a>}
                    </div>
                  )}
                </td>
                <td className="p-6 text-center">
                  <span className="bg-indigo-50 text-indigo-900 border-2 border-indigo-200 px-4 py-2 rounded-2xl font-black text-base shadow-sm">{row.tahun_fasilitasi}</span>
                </td>
                <td className="p-6">
                  <div className="flex justify-center gap-3">
                    <button onClick={() => setSelectedData({ type: 'view', data: row })} className="w-12 h-12 flex items-center justify-center bg-white border-2 border-slate-200 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-md">👁️</button>
                    <button onClick={() => setSelectedData({ type: 'edit', data: row })} className="w-12 h-12 flex items-center justify-center bg-white border-2 border-amber-400 rounded-2xl hover:bg-amber-500 hover:text-white transition-all shadow-md text-amber-600">✏️</button>
                    <button onClick={() => { if(confirm("Hapus?")) supabase.from("layanan_ikm_juara").update({is_deleted: true}).eq('id', row.id).then(() => fetchData()) }} className="w-12 h-12 flex items-center justify-center bg-white border-2 border-rose-200 rounded-2xl hover:bg-rose-600 hover:text-white transition-all shadow-md text-rose-600">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL VIEW / EDIT */}
      {selectedData && (
        <div className="fixed inset-0 bg-indigo-950/95 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <form onSubmit={handleUpdate} className="bg-white w-full max-w-3xl rounded-[40px] border-[10px] border-indigo-700 shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-indigo-700 p-8 flex justify-between items-center text-white">
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">
                {selectedData.type === 'view' ? '📋 Informasi Detil' : '🛠️ Penyesuaian Data'}
              </h2>
              <button type="button" onClick={() => setSelectedData(null)} className="text-3xl font-black hover:text-rose-400">✕</button>
            </div>

            <div className="p-10 space-y-8 max-h-[65vh] overflow-y-auto bg-slate-50">
              <div className="grid grid-cols-2 gap-6 bg-white p-8 rounded-3xl border-2 border-slate-200 shadow-sm">
                <div className="col-span-2 text-[11px] font-black text-indigo-600 uppercase border-b-2 border-indigo-50 pb-2">Data Dasar IKM (Permanen)</div>
                <DataField label="NAMA LENGKAP" value={selectedData.data.ikm_binaan?.nama_lengkap} />
                <DataField label="NIB" value={selectedData.data.ikm_binaan?.no_nib} />
                <DataField label="NOMOR HP" value={selectedData.data.ikm_binaan?.no_hp} />
                <DataField label="ALAMAT" value={selectedData.data.ikm_binaan?.alamat} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-indigo-50/30 rounded-3xl border-2 border-indigo-100 shadow-inner">
                <div className="col-span-2 text-[11px] font-black text-amber-600 uppercase border-b-2 border-amber-50 pb-2">Informasi Layanan: {activeTab}</div>
                <InputField label="No. Dokumen/Sertifikat" name="nomor_dokumen" val={selectedData.data.nomor_dokumen} isEdit={selectedData.type === 'edit'} />
                <InputField label="Tahun Fasilitasi" name="tahun_fasilitasi" val={selectedData.data.tahun_fasilitasi} isEdit={selectedData.type === 'edit'} />
                
                {activeTab === "Pendaftaran Sertifikat Halal" && (
                  <InputField label="Link Logo Halal (Drive)" name="link_tambahan" val={selectedData.data.link_tambahan} isEdit={selectedData.type === 'edit'} />
                )}

                {activeTab === "Pendaftaran Uji Nilai Gizi" && (
                  <InputField label="Tanggal Hasil Uji" name="tanggal_uji" type="date" val={selectedData.data.tanggal_uji} isEdit={selectedData.type === 'edit'} />
                )}

                {activeTab === "Pendaftaran HKI Merek" && (
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">Status Sertifikat</label>
                    <select name="status_sertifikat" defaultValue={selectedData.data.status_sertifikat} disabled={selectedData.type === 'view'} className="w-full p-4 border-2 border-slate-300 rounded-2xl font-black text-slate-700 bg-white">
                      <option>Telah Didaftar</option><option>Proses</option><option>Ditolak</option>
                    </select>
                  </div>
                )}

                <div className="md:col-span-2">
                  <InputField label="Link Google Drive Utama" name="link_dokumen" val={selectedData.data.link_dokumen} isEdit={selectedData.type === 'edit'} />
                </div>
              </div>
            </div>

            {selectedData.type === 'edit' && (
              <div className="p-8 bg-white border-t-2 border-slate-100">
                <button type="submit" disabled={isSaving} className="w-full p-6 rounded-3xl font-black text-xl uppercase tracking-widest bg-indigo-700 text-white shadow-2xl hover:bg-indigo-900 transition-all">
                  {isSaving ? "PROSES MENYIMPAN..." : "KONFIRMASI PERUBAHAN"}
                </button>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  )
}

function DataField({ label, value }: any) {
  return (
    <div>
      <label className="text-[9px] font-black text-slate-400 uppercase block leading-none mb-1">{label}</label>
      <p className="text-sm font-black text-indigo-950 uppercase">{value || "—"}</p>
    </div>
  )
}

function InputField({ label, name, val, isEdit, type = "text" }: any) {
  return (
    <div>
      <label className="text-[10px] font-black text-slate-500 uppercase block mb-2 ml-1">{label}</label>
      {isEdit ? (
        <input name={name} type={type} defaultValue={val} className="w-full bg-white border-2 border-slate-300 focus:border-indigo-600 rounded-2xl p-4 font-black text-slate-800 outline-none shadow-sm transition-all" />
      ) : (
        <div className="bg-slate-100 p-4 rounded-2xl font-black text-slate-600 border border-slate-200 text-xs overflow-hidden break-all">
          {val || "—"}
        </div>
      )}
    </div>
  )
}