"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabaseClient"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable" // Import langsung fungsi autotable
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
  
  // State Pencarian
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTahun, setFilterTahun] = useState("")
  const [appliedQuery, setAppliedQuery] = useState({ text: "", year: "" })

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

  // Filter Data Client-Side
  const filteredData = useMemo(() => {
    return dataLayanan.filter((item) => {
      const ikm = item.ikm_binaan || {}
      const matchText = 
        (ikm.nama_lengkap || "").toLowerCase().includes(appliedQuery.text.toLowerCase()) ||
        (ikm.no_nib || "").includes(appliedQuery.text) ||
        (ikm.nik || "").includes(appliedQuery.text)
      
      const matchYear = appliedQuery.year === "" || item.tahun_fasilitasi?.toString() === appliedQuery.year
      return matchText && matchYear
    })
  }, [dataLayanan, appliedQuery])

  // --- LOGIKA EXPORT (DIPERBAIKI) ---
  const prepareExportData = () => {
    return filteredData.map((d, i) => {
      const base = {
        "No": i + 1,
        "Nama Lengkap": d.ikm_binaan?.nama_lengkap,
        "NIB": d.ikm_binaan?.no_nib,
        "No HP": d.ikm_binaan?.no_hp,
        "Alamat": d.ikm_binaan?.alamat,
        "Tahun": d.tahun_fasilitasi,
      }

      if (activeTab === "Pendaftaran HKI Merek") {
        return { ...base, "No HKI": d.nomor_dokumen, "Status": d.status_sertifikat, "Link Bukti": d.link_tambahan, "Link Sertif": d.link_dokumen }
      } else if (activeTab === "Pendaftaran Sertifikat Halal") {
        return { ...base, "No Halal": d.nomor_dokumen, "Link Sertifikat": d.link_dokumen, "Link Logo": d.link_tambahan }
      } else if (activeTab === "Pendaftaran Uji Nilai Gizi") {
        return { ...base, "No LHU": d.nomor_dokumen, "Tgl Uji": d.tanggal_uji, "Link LHU": d.link_dokumen }
      }
      return { ...base, "Dokumen": d.nomor_dokumen, "Link": d.link_dokumen }
    })
  }

  const exportToExcel = () => {
    const data = prepareExportData()
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Rekap")
    XLSX.writeFile(wb, `REKAP_${activeTab.replace(/ /g, "_")}.xlsx`)
  }

  const exportToPDF = () => {
    const doc = new jsPDF("l", "mm", "a4")
    const data = prepareExportData()
    if (data.length === 0) return alert("Data kosong")

    const headers = [Object.keys(data[0])]
    const body = data.map(obj => Object.values(obj))

    doc.setFontSize(14)
    doc.text(`REKAP DATA: ${activeTab.toUpperCase()}`, 14, 15)
    
    // Perbaikan Pemanggilan autoTable agar tidak error di Vercel
    autoTable(doc, {
      head: headers,
      body: body,
      startY: 22,
      theme: 'grid',
      styles: { fontSize: 7, halign: 'center' },
      headStyles: { fillColor: [30, 27, 75] }
    })

    doc.save(`REKAP_${activeTab.replace(/ /g, "_")}.pdf`)
  }

  return (
    <div className="p-8 bg-slate-200 min-h-screen font-sans">
      {/* Header & Export Buttons */}
      <div className="flex justify-between items-center mb-6 bg-white p-8 rounded-[35px] shadow-xl border-b-[6px] border-indigo-700">
        <div>
          <h1 className="text-3xl font-black text-indigo-950 uppercase italic tracking-tighter">🚀 LAYANAN IKM JUARA</h1>
          <p className="text-[10px] font-bold text-green-600 animate-pulse">● SINKRONISASI DATA IKM BINAAN AKTIF</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportToExcel} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-xs hover:bg-emerald-700">EXCEL</button>
          <button onClick={exportToPDF} className="bg-rose-600 text-white px-8 py-3 rounded-2xl font-black text-xs hover:bg-rose-700">PDF</button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-indigo-900 p-6 rounded-[30px] mb-8 flex flex-wrap gap-4 items-end shadow-2xl border-b-4 border-indigo-700">
        <div className="flex-1 min-w-[300px]">
          <label className="text-[10px] font-black text-indigo-300 uppercase block mb-2 ml-2">Cari Nama / NIB / NIK</label>
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Ketik kata kunci..." 
            className="w-full p-4 rounded-2xl border-none font-bold outline-none focus:ring-4 focus:ring-indigo-500"
          />
        </div>
        <div className="w-32">
          <label className="text-[10px] font-black text-indigo-300 uppercase block mb-2 ml-2">Tahun</label>
          <input 
            type="number"
            value={filterTahun}
            onChange={(e) => setFilterTahun(e.target.value)}
            placeholder="2026" 
            className="w-full p-4 rounded-2xl border-none font-bold outline-none focus:ring-4 focus:ring-indigo-500"
          />
        </div>
        <button onClick={() => setAppliedQuery({ text: searchTerm, year: filterTahun })} className="bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black text-xs hover:bg-indigo-400">CARI DATA</button>
        <button onClick={() => {setSearchTerm(""); setFilterTahun(""); setAppliedQuery({text: "", year: ""})}} className="bg-slate-700 text-white px-8 py-4 rounded-2xl font-black text-xs hover:bg-slate-600">RESET</button>
      </div>

      {/* Tabs Menu */}
      <div className="flex flex-wrap gap-2 mb-6">
        {LAYANAN_LIST.map((l) => (
          <button
            key={l}
            onClick={() => setActiveTab(l)}
            className={`px-5 py-3 rounded-2xl font-black text-[10px] uppercase transition-all border-2 ${
              activeTab === l ? "bg-indigo-700 border-indigo-900 text-white shadow-lg shadow-indigo-200" : "bg-white border-slate-300 text-slate-500 hover:border-indigo-400"
            }`}
          >
            {l.replace("Pendaftaran ", "")}
          </button>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[40px] shadow-2xl border-2 border-slate-300 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-indigo-950 text-white">
            <tr className="text-[11px] font-black uppercase tracking-widest">
              <th className="p-6 text-center w-16">NO</th>
              <th className="p-6">PROFIL IKM</th>
              <th className="p-6">DETAIL KHUSUS {activeTab.toUpperCase()}</th>
              <th className="p-6 text-center">TAHUN</th>
              <th className="p-6 text-center">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="p-20 text-center font-black text-slate-300 text-4xl italic">MEMUAT...</td></tr>
            ) : filteredData.map((row, idx) => (
              <tr key={row.id} className="hover:bg-indigo-50/50 transition-all">
                <td className="p-6 text-center font-black text-slate-400 border-r">{idx + 1}</td>
                <td className="p-6">
                  <div className="font-black text-indigo-950 text-base uppercase leading-tight">{row.ikm_binaan?.nama_lengkap}</div>
                  <div className="text-[10px] font-bold text-slate-500 mt-1">NIB: {row.ikm_binaan?.no_nib} | NIK: {row.ikm_binaan?.nik || "-"}</div>
                </td>
                <td className="p-6 border-l">
                  <div className="space-y-1">
                    <p className="font-black text-slate-800 text-xs italic">{row.nomor_dokumen || "—"}</p>
                    <div className="flex gap-2">
                       {row.link_dokumen && <a href={row.link_dokumen} target="_blank" className="text-[9px] font-black bg-blue-100 text-blue-600 px-2 py-1 rounded">DOKUMEN</a>}
                       {row.link_tambahan && <a href={row.link_tambahan} target="_blank" className="text-[9px] font-black bg-emerald-100 text-emerald-600 px-2 py-1 rounded">TAMBAHAN/LOGO</a>}
                    </div>
                  </div>
                </td>
                <td className="p-6 text-center">
                  <span className="bg-indigo-100 text-indigo-900 px-4 py-2 rounded-xl font-black text-sm border border-indigo-200">{row.tahun_fasilitasi}</span>
                </td>
                <td className="p-6">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => setSelectedData({ type: 'view', data: row })} className="w-10 h-10 flex items-center justify-center bg-white border-2 border-slate-200 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">👁️</button>
                    <button onClick={() => setSelectedData({ type: 'edit', data: row })} className="w-10 h-10 flex items-center justify-center bg-white border-2 border-amber-300 rounded-xl hover:bg-amber-500 hover:text-white transition-all text-amber-500">✏️</button>
                    <button onClick={() => {if(confirm("Hapus?")) supabase.from("layanan_ikm_juara").update({is_deleted: true}).eq('id', row.id).then(() => fetchData())}} className="w-10 h-10 flex items-center justify-center bg-white border-2 border-rose-200 rounded-xl hover:bg-rose-600 hover:text-white transition-all text-rose-500">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}