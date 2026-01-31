"use client"

import { useState, useEffect, useMemo } from "react"
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

  // State untuk Pencarian
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTahun, setFilterTahun] = useState("")
  const [searchQuery, setSearchQuery] = useState({ text: "", year: "" })

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

  // --- LOGIKA FILTER DATA ---
  const filteredData = useMemo(() => {
    return dataLayanan.filter((item) => {
      const ikm = item.ikm_binaan || {}
      const matchText = 
        (ikm.nama_lengkap || "").toLowerCase().includes(searchQuery.text.toLowerCase()) ||
        (ikm.no_nib || "").includes(searchQuery.text) ||
        (ikm.nik || "").includes(searchQuery.text)
      
      const matchYear = searchQuery.year === "" || item.tahun_fasilitasi?.toString() === searchQuery.year
      
      return matchText && matchYear
    })
  }, [dataLayanan, searchQuery])

  const handleSearch = () => {
    setSearchQuery({ text: searchTerm, year: filterTahun })
  }

  const handleReset = () => {
    setSearchTerm("")
    setFilterTahun("")
    setSearchQuery({ text: "", year: "" })
  }

  // --- LOGIKA EXPORT ---
  const prepareExportData = (target: 'excel' | 'pdf') => {
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
        return { ...base, "No Halal": d.nomor_dokumen, "Link Sertif": d.link_dokumen, "Link Logo": d.link_tambahan }
      } else if (activeTab === "Pendaftaran Uji Nilai Gizi") {
        return { ...base, "No LHU": d.nomor_dokumen, "Tgl Uji": d.tanggal_uji, "Link LHU": d.link_dokumen }
      }
      return { ...base, "Dokumen": d.nomor_dokumen, "Link": d.link_dokumen }
    })
  }

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(prepareExportData('excel'))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Data")
    XLSX.writeFile(wb, `REKAP_${activeTab}.xlsx`)
  }

  const exportToPDF = () => {
    try {
      const doc = new jsPDF("l", "mm", "a4")
      const exportData = prepareExportData('pdf')
      const headers = [Object.keys(exportData[0])]
      const body = exportData.map(item => Object.values(item))

      doc.setFontSize(14)
      doc.text(`REKAPITULASI: ${activeTab.toUpperCase()}`, 14, 15)
      
      ;(doc as any).autoTable({
        head: headers,
        body: body,
        startY: 22,
        theme: 'grid',
        styles: { fontSize: 7, halign: 'center' },
        headStyles: { fillColor: [30, 27, 75], textColor: [255, 255, 255], fontStyle: 'bold' }
      })
      doc.save(`REKAP_${activeTab}.pdf`)
    } catch (err) {
      alert("Gagal membuat PDF. Pastikan data tersedia.")
      console.error(err)
    }
  }

  return (
    <div className="p-8 bg-slate-200 min-h-screen font-sans text-slate-900">
      {/* HEADER & EXPORT */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 bg-white p-8 rounded-[40px] shadow-xl border-b-[8px] border-indigo-800">
        <div>
          <h1 className="text-4xl font-black text-indigo-950 uppercase italic tracking-tighter">
            🚀 LAYANAN IKM <span className="text-indigo-500">JUARA</span>
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_green]"></span>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sinkronisasi Data IKM Binaan Aktif</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={exportToExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-2xl font-black text-xs transition-all shadow-lg active:scale-95">EXCEL</button>
          <button onClick={exportToPDF} className="bg-rose-600 hover:bg-rose-700 text-white px-8 py-3 rounded-2xl font-black text-xs transition-all shadow-lg active:scale-95">PDF</button>
        </div>
      </div>

      {/* FILTER SEARCH BAR */}
      <div className="bg-indigo-900 p-6 rounded-[30px] mb-6 shadow-2xl flex flex-wrap gap-4 items-end border-b-4 border-indigo-700">
        <div className="flex-1 min-w-[250px]">
          <label className="text-[10px] font-black text-indigo-300 uppercase mb-2 block ml-2">Cari Nama / NIB / NIK</label>
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Ketik identitas data..." 
            className="w-full p-4 rounded-2xl bg-white border-none font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500 transition-all"
          />
        </div>
        <div className="w-32">
          <label className="text-[10px] font-black text-indigo-300 uppercase mb-2 block ml-2">Tahun</label>
          <input 
            type="number"
            value={filterTahun}
            onChange={(e) => setFilterTahun(e.target.value)}
            placeholder="2026" 
            className="w-full p-4 rounded-2xl bg-white border-none font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500 transition-all"
          />
        </div>
        <button onClick={handleSearch} className="bg-indigo-500 hover:bg-indigo-400 text-white px-8 py-4 rounded-2xl font-black text-xs shadow-lg transition-all active:scale-95 uppercase">Cari Data</button>
        <button onClick={handleReset} className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-4 rounded-2xl font-black text-xs shadow-lg transition-all active:scale-95 uppercase">Reset</button>
      </div>

      {/* TABS MENU */}
      <div className="flex flex-wrap gap-2 mb-6">
        {LAYANAN_LIST.map((l) => (
          <button
            key={l}
            onClick={() => { setActiveTab(l); handleReset(); }}
            className={`px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border-2 ${
              activeTab === l ? "bg-indigo-700 border-indigo-950 text-white shadow-xl translate-y-[-2px]" : "bg-white border-slate-300 text-slate-500 hover:border-indigo-400"
            }`}
          >
            {l.replace("Pendaftaran ", "")}
          </button>
        ))}
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-[40px] shadow-2xl border-2 border-slate-300 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-indigo-950 text-white border-b-4 border-indigo-800">
            <tr className="text-[11px] font-black uppercase tracking-widest">
              <th className="p-6 text-center w-20">NO</th>
              <th className="p-6">PROFIL IKM BINAAN</th>
              <th className="p-6">DETAIL KHUSUS {activeTab.toUpperCase()}</th>
              <th className="p-6 text-center">TAHUN</th>
              <th className="p-6 text-center">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-slate-200">
            {loading ? (
              <tr><td colSpan={5} className="p-20 text-center font-black text-slate-300 animate-pulse text-4xl italic">MEMUAT...</td></tr>
            ) : filteredData.length === 0 ? (
              <tr><td colSpan={5} className="p-20 text-center font-black text-slate-400 uppercase italic">Data tidak ditemukan dalam pencarian ini.</td></tr>
            ) : filteredData.map((row, idx) => (
              <tr key={row.id} className="hover:bg-indigo-50/50 transition-all">
                <td className="p-6 text-center font-black text-slate-400 border-r border-slate-100">{idx + 1}</td>
                <td className="p-6">
                  <div className="font-black text-indigo-950 text-base uppercase leading-tight">{row.ikm_binaan?.nama_lengkap}</div>
                  <div className="text-[10px] font-black text-slate-500 mt-1 flex flex-col">
                    <span>NIB: {row.ikm_binaan?.no_nib}</span>
                    <span>NIK: {row.ikm_binaan?.nik || "-"}</span>
                  </div>
                </td>
                <td className="p-6">
                   {/* Tampilan Kolom Spesifik */}
                   <div className="space-y-1">
                      <p className="font-black text-slate-800 text-xs italic">{row.nomor_dokumen || "Belum Input Nomor"}</p>
                      <div className="flex gap-2">
                        {row.link_dokumen && <a href={row.link_dokumen} target="_blank" className="text-[9px] font-black text-blue-600 underline">DOC UTAMA</a>}
                        {row.link_tambahan && <a href={row.link_tambahan} target="_blank" className="text-[9px] font-black text-emerald-600 underline uppercase">Tambahan/Logo</a>}
                      </div>
                   </div>
                </td>
                <td className="p-6 text-center">
                  <span className="bg-indigo-100 text-indigo-900 border border-indigo-200 px-3 py-1 rounded-lg font-black text-xs">{row.tahun_fasilitasi}</span>
                </td>
                <td className="p-6">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => setSelectedData({ type: 'view', data: row })} className="w-10 h-10 flex items-center justify-center bg-white border-2 border-slate-200 rounded-xl hover:bg-indigo-600 hover:text-white shadow-sm transition-all">👁️</button>
                    <button onClick={() => setSelectedData({ type: 'edit', data: row })} className="w-10 h-10 flex items-center justify-center bg-white border-2 border-amber-300 rounded-xl hover:bg-amber-500 hover:text-white shadow-sm transition-all text-amber-500">✏️</button>
                    <button onClick={() => {if(confirm("Hapus?")) supabase.from("layanan_ikm_juara").update({is_deleted: true}).eq('id', row.id).then(() => fetchData())}} className="w-10 h-10 flex items-center justify-center bg-white border-2 border-rose-200 rounded-xl hover:bg-rose-600 hover:text-white shadow-sm transition-all text-rose-500">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL SIMPAN (LOGIKA FORM) */}
      {selectedData && (
        <div className="fixed inset-0 bg-indigo-950/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form className="bg-white w-full max-w-2xl rounded-[40px] border-4 border-indigo-600 shadow-2xl overflow-hidden" onSubmit={async (e) => {
             e.preventDefault(); setIsSaving(true);
             const fd = new FormData(e.currentTarget);
             const res = await supabase.from("layanan_ikm_juara").update({
               nomor_dokumen: fd.get("nomor_dokumen"),
               tahun_fasilitasi: fd.get("tahun_fasilitasi"),
               link_dokumen: fd.get("link_dokumen"),
               link_tambahan: fd.get("link_tambahan"),
               tanggal_uji: fd.get("tanggal_uji"),
               status_sertifikat: fd.get("status_sertifikat")
             }).eq("id", selectedData.data.id);
             if(!res.error) { alert("Data Tersimpan!"); setSelectedData(null); fetchData(); }
             setIsSaving(false);
          }}>
            <div className="p-8 bg-indigo-900 text-white flex justify-between items-center">
              <h2 className="font-black uppercase tracking-tighter italic text-xl">{selectedData.type === 'view' ? 'Detail Data' : 'Edit Data'}</h2>
              <button type="button" onClick={() => setSelectedData(null)} className="font-black text-2xl">✕</button>
            </div>
            <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto bg-slate-50">
               <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 mb-4">
                 <p className="text-[9px] font-black text-indigo-400 uppercase">Pemilik IKM</p>
                 <p className="font-black text-slate-800 uppercase">{selectedData.data.ikm_binaan?.nama_lengkap}</p>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <InputPopup label="No. Dokumen" name="nomor_dokumen" val={selectedData.data.nomor_dokumen} isEdit={selectedData.type === 'edit'} />
                 <InputPopup label="Tahun" name="tahun_fasilitasi" val={selectedData.data.tahun_fasilitasi} isEdit={selectedData.type === 'edit'} />
               </div>
               <InputPopup label="Link Utama (Google Drive)" name="link_dokumen" val={selectedData.data.link_dokumen} isEdit={selectedData.type === 'edit'} />
               <InputPopup label="Link Tambahan / Logo" name="link_tambahan" val={selectedData.data.link_tambahan} isEdit={selectedData.type === 'edit'} />
            </div>
            {selectedData.type === 'edit' && (
              <div className="p-6 bg-white border-t-2 border-slate-100">
                <button type="submit" className="w-full p-4 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest hover:bg-indigo-800 shadow-xl transition-all">
                  {isSaving ? "MENYIMPAN..." : "SIMPAN PERUBAHAN"}
                </button>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  )
}

function InputPopup({ label, name, val, isEdit }: any) {
  return (
    <div className="flex flex-col">
      <label className="text-[10px] font-black text-slate-500 uppercase mb-1 ml-1">{label}</label>
      {isEdit ? (
        <input name={name} defaultValue={val} className="p-3 border-2 border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all" />
      ) : (
        <div className="p-3 bg-slate-100 rounded-xl font-bold text-slate-500 text-sm border border-slate-200 break-all">{val || "-"}</div>
      )}
    </div>
  )
}