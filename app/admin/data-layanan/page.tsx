"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabaseClient"
import jsPDF from "jspdf" // Perbaikan: Gunakan huruf kecil semua 'jspdf'
import autoTable from "jspdf-autotable"
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

  const filteredData = useMemo(() => {
    return dataLayanan.filter((item) => {
      const ikm = item.ikm_binaan || {}
      const matchText = (ikm.nama_lengkap || "").toLowerCase().includes(appliedQuery.text.toLowerCase()) ||
                        (ikm.no_nib || "").includes(appliedQuery.text) ||
                        (ikm.nik || "").includes(appliedQuery.text)
      const matchYear = appliedQuery.year === "" || item.tahun_fasilitasi?.toString() === appliedQuery.year
      return matchText && matchYear
    })
  }, [dataLayanan, appliedQuery])

  const prepareExportData = () => {
    if (filteredData.length === 0) return []
    return filteredData.map((d, i) => ({
      "No": i + 1,
      "Nama Lengkap": d.ikm_binaan?.nama_lengkap || "-",
      "NIB": d.ikm_binaan?.no_nib || "-",
      "No HP": d.ikm_binaan?.no_hp || "-",
      "Tahun": d.tahun_fasilitasi || "-",
      "Dokumen": d.nomor_dokumen || "-",
      "Status": d.status_sertifikat || "-"
    }))
  }

  const exportToExcel = () => {
    const data = prepareExportData()
    if (data.length === 0) return alert("Tidak ada data untuk diexport")
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Rekap")
    XLSX.writeFile(wb, `REKAP_${activeTab.replace(/ /g, "_")}.xlsx`)
  }

  const exportToPDF = () => {
    const data = prepareExportData()
    if (data.length === 0) return alert("Data kosong")
    
    const doc = new jsPDF("l", "mm", "a4")
    doc.setFontSize(14)
    doc.text(`REKAP DATA: ${activeTab.toUpperCase()}`, 14, 15)
    
    autoTable(doc, {
      head: [Object.keys(data[0])],
      body: data.map(obj => Object.values(obj)),
      startY: 22,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 27, 75] }
    })
    doc.save(`REKAP_${activeTab.replace(/ /g, "_")}.pdf`)
  }

  return (
    <div className="p-8 bg-slate-200 min-h-screen font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-white p-8 rounded-[35px] shadow-xl border-b-[6px] border-indigo-700">
        <div>
          <h1 className="text-3xl font-black text-indigo-950 italic">🚀 LAYANAN IKM JUARA</h1>
          <p className="text-[10px] font-bold text-green-600 animate-pulse uppercase">● Database Monitoring Aktif</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportToExcel} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-xs hover:bg-emerald-700 transition-all">EXCEL</button>
          <button onClick={exportToPDF} className="bg-rose-600 text-white px-6 py-3 rounded-2xl font-black text-xs hover:bg-rose-700 transition-all">PDF</button>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-indigo-900 p-6 rounded-[30px] mb-8 flex flex-wrap gap-4 items-end shadow-2xl border-b-4 border-indigo-700">
        <div className="flex-1 min-w-[300px]">
          <label className="text-[10px] font-black text-indigo-300 uppercase block mb-2 ml-2">Pencarian Data (Nama/NIB/NIK)</label>
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Masukkan kata kunci..." className="w-full p-4 rounded-2xl outline-none font-bold text-slate-800" />
        </div>
        <div className="w-32">
          <label className="text-[10px] font-black text-indigo-300 uppercase block mb-2 ml-2">Tahun</label>
          <input type="number" value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)} placeholder="2026" className="w-full p-4 rounded-2xl outline-none font-bold text-slate-800" />
        </div>
        <button onClick={() => setAppliedQuery({ text: searchTerm, year: filterTahun })} className="bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black text-xs hover:bg-indigo-400 active:scale-95 transition-all">CARI DATA</button>
        <button onClick={() => {setSearchTerm(""); setFilterTahun(""); setAppliedQuery({text: "", year: ""})}} className="bg-slate-700 text-white px-8 py-4 rounded-2xl font-black text-xs hover:bg-slate-600">RESET</button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {LAYANAN_LIST.map((l) => (
          <button key={l} onClick={() => setActiveTab(l)} className={`px-5 py-3 rounded-2xl font-black text-[10px] uppercase border-2 transition-all ${activeTab === l ? "bg-indigo-700 border-indigo-900 text-white shadow-lg translate-y-[-2px]" : "bg-white text-slate-500 hover:border-indigo-400"}`}>{l.replace("Pendaftaran ", "")}</button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border-2 border-slate-300">
        <table className="w-full text-left">
          <thead className="bg-indigo-950 text-white text-[11px] font-black uppercase tracking-wider">
            <tr>
              <th className="p-6 text-center w-16">NO</th>
              <th className="p-6">PROFIL IKM</th>
              <th className="p-6">DETAIL DOKUMEN</th>
              <th className="p-6 text-center">TAHUN</th>
              <th className="p-6 text-center">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-slate-100">
            {loading ? <tr><td colSpan={5} className="p-20 text-center font-black text-slate-300 text-4xl animate-pulse italic">MEMUAT...</td></tr> :
              filteredData.length === 0 ? <tr><td colSpan={5} className="p-20 text-center font-black text-slate-400 uppercase">Data Tidak Ditemukan</td></tr> :
              filteredData.map((row, idx) => (
              <tr key={row.id} className="hover:bg-indigo-50/50 transition-all">
                <td className="p-6 text-center font-black text-slate-400 border-r">{idx + 1}</td>
                <td className="p-6">
                  <div className="font-black text-indigo-950 uppercase">{row.ikm_binaan?.nama_lengkap}</div>
                  <div className="text-[10px] font-bold text-slate-500 mt-1">NIB: {row.ikm_binaan?.no_nib} | NIK: {row.ikm_binaan?.nik || "-"}</div>
                </td>
                <td className="p-6 border-l">
                  <p className="font-black text-slate-800 text-xs italic">{row.nomor_dokumen || "—"}</p>
                  <div className="flex gap-2 mt-1">
                    {row.link_dokumen && <a href={row.link_dokumen} target="_blank" className="text-[9px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded">DOKUMEN</a>}
                    {row.link_tambahan && <a href={row.link_tambahan} target="_blank" className="text-[9px] font-black bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded">TAMBAHAN</a>}
                  </div>
                </td>
                <td className="p-6 text-center"><span className="bg-indigo-100 text-indigo-900 px-4 py-2 rounded-xl font-black text-sm">{row.tahun_fasilitasi}</span></td>
                <td className="p-6">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => setSelectedData({ type: 'view', data: row })} className="w-10 h-10 bg-white border-2 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">👁️</button>
                    <button onClick={() => setSelectedData({ type: 'edit', data: row })} className="w-10 h-10 bg-white border-2 border-amber-300 rounded-xl hover:bg-amber-500 hover:text-white text-amber-500 transition-all">✏️</button>
                    <button onClick={async () => { if(confirm("Hapus data ini?")) { await supabase.from("layanan_ikm_juara").update({is_deleted: true}).eq('id', row.id); fetchData(); } }} className="w-10 h-10 bg-white border-2 border-rose-200 rounded-xl hover:bg-rose-600 hover:text-white text-rose-500 transition-all">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal View / Edit */}
      {selectedData && (
        <div className="fixed inset-0 bg-indigo-950/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form className="bg-white w-full max-w-2xl rounded-[40px] border-4 border-indigo-600 shadow-2xl overflow-hidden" 
            onSubmit={async (e) => {
              e.preventDefault(); 
              if(selectedData.type === 'view') return setSelectedData(null);
              setIsSaving(true);
              const fd = new FormData(e.currentTarget);
              const { error } = await supabase.from("layanan_ikm_juara").update({
                nomor_dokumen: fd.get("nomor_dokumen"),
                tahun_fasilitasi: fd.get("tahun_fasilitasi"),
                link_dokumen: fd.get("link_dokumen"),
                link_tambahan: fd.get("link_tambahan"),
                status_sertifikat: fd.get("status_sertifikat")
              }).eq("id", selectedData.data.id);
              setIsSaving(false); 
              if(!error) { setSelectedData(null); fetchData(); alert("Data Berhasil Diperbarui!"); }
          }}>
            <div className="p-8 bg-indigo-900 text-white flex justify-between items-center">
              <h2 className="font-black uppercase italic text-xl">{selectedData.type === 'view' ? 'Pratinjau Data' : 'Ubah Data'}</h2>
              <button type="button" onClick={() => setSelectedData(null)} className="font-black text-2xl hover:text-rose-400 transition-all">✕</button>
            </div>
            <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto bg-slate-50">
               <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
                 <p className="text-[9px] font-black text-indigo-400 uppercase mb-1">Nama IKM Binaan</p>
                 <p className="font-black uppercase text-slate-800">{selectedData.data.ikm_binaan?.nama_lengkap}</p>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="flex flex-col">
                   <label className="text-[10px] font-black text-slate-500 uppercase mb-1 ml-1">No. Dokumen / Sertifikat</label>
                   {selectedData.type === 'edit' ? 
                     <input name="nomor_dokumen" defaultValue={selectedData.data.nomor_dokumen} className="p-3 border-2 rounded-xl font-bold outline-none focus:border-indigo-500" /> :
                     <div className="p-3 bg-white border rounded-xl font-bold text-slate-600">{selectedData.data.nomor_dokumen || "-"}</div>
                   }
                 </div>
                 <div className="flex flex-col">
                   <label className="text-[10px] font-black text-slate-500 uppercase mb-1 ml-1">Tahun Fasilitasi</label>
                   {selectedData.type === 'edit' ? 
                     <input name="tahun_fasilitasi" type="number" defaultValue={selectedData.data.tahun_fasilitasi} className="p-3 border-2 rounded-xl font-bold outline-none focus:border-indigo-500" /> :
                     <div className="p-3 bg-white border rounded-xl font-bold text-slate-600 text-center">{selectedData.data.tahun_fasilitasi || "-"}</div>
                   }
                 </div>
               </div>
               <div className="flex flex-col">
                 <label className="text-[10px] font-black text-slate-500 uppercase mb-1 ml-1">Link Dokumen Utama (URL)</label>
                 {selectedData.type === 'edit' ? 
                   <input name="link_dokumen" defaultValue={selectedData.data.link_dokumen} className="p-3 border-2 rounded-xl font-bold outline-none focus:border-indigo-500" /> :
                   <div className="p-3 bg-white border rounded-xl font-bold text-blue-600 break-all underline cursor-pointer" onClick={() => window.open(selectedData.data.link_dokumen)}>{selectedData.data.link_dokumen || "-"}</div>
                 }
               </div>
               <div className="flex flex-col">
                 <label className="text-[10px] font-black text-slate-500 uppercase mb-1 ml-1">Link Tambahan / File Pendukung</label>
                 {selectedData.type === 'edit' ? 
                   <input name="link_tambahan" defaultValue={selectedData.data.link_tambahan} className="p-3 border-2 rounded-xl font-bold outline-none focus:border-indigo-500" /> :
                   <div className="p-3 bg-white border rounded-xl font-bold text-emerald-600 break-all underline cursor-pointer" onClick={() => window.open(selectedData.data.link_tambahan)}>{selectedData.data.link_tambahan || "-"}</div>
                 }
               </div>
            </div>
            <div className="p-6 bg-white border-t-2">
              {selectedData.type === 'edit' ? 
                <button type="submit" disabled={isSaving} className="w-full p-4 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest hover:bg-indigo-800 transition-all shadow-lg shadow-indigo-200">
                  {isSaving ? "PROSES MENYIMPAN..." : "SIMPAN PERUBAHAN DATA"}
                </button> :
                <button type="button" onClick={() => setSelectedData(null)} className="w-full p-4 rounded-2xl bg-slate-800 text-white font-black uppercase tracking-widest">TUTUP MODAL</button>
              }
            </div>
          </form>
        </div>
      )}
    </div>
  )
}