"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabaseClient"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable" // Import langsung plugin-nya
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

  // State Pencarian Real-time
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTahun, setFilterTahun] = useState("")

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
      const matchText = 
        (ikm.nama_lengkap || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ikm.no_nib || "").includes(searchTerm) ||
        (ikm.nik || "").includes(searchTerm)
      const matchYear = filterTahun === "" || item.tahun_fasilitasi?.toString() === filterTahun
      return matchText && matchYear
    })
  }, [dataLayanan, searchTerm, filterTahun])

  const prepareExportData = () => {
    return filteredData.map((d, i) => {
      const base: any = {
        "No": i + 1,
        "Nama Lengkap": d.ikm_binaan?.nama_lengkap || "-",
        "NIB": d.ikm_binaan?.no_nib || "-",
        "No HP": d.ikm_binaan?.no_hp || "-",
        "Tahun": d.tahun_fasilitasi || "-",
      }
      if (activeTab === "Pendaftaran HKI Merek") {
        base["Status"] = d.status_sertifikat || "Proses";
        base["No HKI"] = d.nomor_dokumen || "-";
      } else {
        base["No Dokumen"] = d.nomor_dokumen || "-";
      }
      return base;
    })
  }

  const exportToExcel = () => {
    const data = prepareExportData()
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Data")
    XLSX.writeFile(wb, `REKAP_${activeTab.replace(/ /g, "_")}.xlsx`)
  }

  // --- FIX EXPORT PDF ---
  const exportToPDF = () => {
    try {
      const doc = new jsPDF("l", "mm", "a4")
      const data = prepareExportData()
      
      if (data.length === 0) return alert("Data kosong")

      const headers = [Object.keys(data[0])]
      const body = data.map(item => Object.values(item)) as any[][]

      doc.setFontSize(16)
      doc.text(`REKAP DATA: ${activeTab.toUpperCase()}`, 14, 15)
      doc.setFontSize(10)
      doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 20)

      // Memanggil autoTable sebagai fungsi mandiri (Cara paling aman)
      autoTable(doc, {
        head: headers,
        body: body,
        startY: 25,
        theme: 'grid',
        headStyles: { fillColor: [30, 27, 75], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3 },
        margin: { top: 25 }
      })

      doc.save(`REKAP_${activeTab.replace(/ /g, "_")}.pdf`)
    } catch (err) {
      console.error("PDF Error:", err)
      alert("Terjadi kesalahan teknis saat membuat PDF.")
    }
  }

  return (
    <div className="p-8 bg-slate-200 min-h-screen font-sans text-slate-900">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-white p-8 rounded-[40px] shadow-xl border-b-[8px] border-indigo-800">
        <div>
          <h1 className="text-4xl font-black text-indigo-950 italic">🚀 LAYANAN IKM JUARA</h1>
          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest italic">Live Connection: Database Monitoring</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportToExcel} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-xs hover:bg-emerald-700 transition-all shadow-lg active:scale-95">EXCEL</button>
          <button onClick={exportToPDF} className="bg-rose-600 text-white px-8 py-3 rounded-2xl font-black text-xs hover:bg-rose-700 transition-all shadow-lg active:scale-95">PDF</button>
        </div>
      </div>

      {/* Real-time Filter */}
      <div className="bg-indigo-900 p-6 rounded-[30px] mb-6 flex flex-wrap gap-4 items-end shadow-2xl">
        <div className="flex-1 min-w-[300px]">
          <label className="text-[10px] font-black text-indigo-300 uppercase block mb-2 ml-2">Pencarian Real-time (Nama/NIB/NIK)</label>
          <input 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            placeholder="Ketik untuk mencari..." 
            className="w-full p-4 rounded-2xl outline-none font-bold text-slate-800" 
          />
        </div>
        <div className="w-32">
          <label className="text-[10px] font-black text-indigo-300 uppercase block mb-2 ml-2">Tahun</label>
          <input 
            type="number" 
            value={filterTahun} 
            onChange={(e) => setFilterTahun(e.target.value)} 
            placeholder="2026" 
            className="w-full p-4 rounded-2xl outline-none font-bold text-slate-800" 
          />
        </div>
        <button onClick={handleReset} className="bg-slate-700 text-white px-8 py-4 rounded-2xl font-black text-xs hover:bg-slate-600 transition-all active:scale-95">RESET</button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {LAYANAN_LIST.map((l) => (
          <button 
            key={l} 
            onClick={() => { setActiveTab(l); handleReset(); }} 
            className={`px-5 py-3 rounded-2xl font-black text-[10px] uppercase transition-all border-2 ${activeTab === l ? "bg-indigo-700 border-indigo-900 text-white shadow-lg translate-y-[-2px]" : "bg-white text-slate-500"}`}
          >
            {l.replace("Pendaftaran ", "")}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border-2 border-slate-300">
        <table className="w-full text-left">
          <thead className="bg-indigo-950 text-white">
            <tr className="text-[11px] font-black uppercase tracking-widest">
              <th className="p-6 text-center w-20">NO</th>
              <th className="p-6">PROFIL IKM</th>
              <th className="p-6">DETAIL {activeTab.toUpperCase()}</th>
              <th className="p-6 text-center">TAHUN</th>
              <th className="p-6 text-center">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="p-20 text-center font-black text-slate-300 text-4xl animate-pulse italic">MEMUAT...</td></tr>
            ) : filteredData.length === 0 ? (
              <tr><td colSpan={5} className="p-20 text-center font-black text-slate-400">DATA TIDAK DITEMUKAN</td></tr>
            ) : (
              filteredData.map((row, idx) => (
                <tr key={row.id} className="hover:bg-indigo-50/50 transition-all">
                  <td className="p-6 text-center font-black text-slate-400 border-r">{idx + 1}</td>
                  <td className="p-6">
                    <div className="font-black text-indigo-950 uppercase">{row.ikm_binaan?.nama_lengkap}</div>
                    <div className="text-[10px] font-bold text-slate-500 mt-1">NIB: {row.ikm_binaan?.no_nib} | HP: {row.ikm_binaan?.no_hp}</div>
                  </td>
                  <td className="p-6">
                    <div className="font-black text-slate-800 text-xs italic">{row.nomor_dokumen || "—"}</div>
                    {activeTab === "Pendaftaran HKI Merek" && (
                      <div className={`text-[9px] font-black mt-1 inline-block px-2 py-0.5 rounded uppercase ${row.status_sertifikat === 'Ditolak' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        {row.status_sertifikat || "Proses"}
                      </div>
                    )}
                  </td>
                  <td className="p-6 text-center"><span className="bg-indigo-100 text-indigo-900 px-3 py-1 rounded-lg font-black text-xs">{row.tahun_fasilitasi}</span></td>
                  <td className="p-6">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => setSelectedData({ type: 'view', data: row })} className="w-10 h-10 bg-white border-2 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">👁️</button>
                      <button onClick={() => setSelectedData({ type: 'edit', data: row })} className="w-10 h-10 bg-white border-2 border-amber-300 rounded-xl hover:bg-amber-500 hover:text-white text-amber-500 transition-all">✏️</button>
                      <button onClick={async () => { if(confirm("Hapus?")) { await supabase.from("layanan_ikm_juara").update({is_deleted: true}).eq('id', row.id); fetchData(); } }} className="w-10 h-10 bg-white border-2 border-rose-200 rounded-xl hover:bg-rose-600 hover:text-white text-rose-500 transition-all">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal View/Edit */}
      {selectedData && (
        <div className="fixed inset-0 bg-indigo-950/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form className="bg-white w-full max-w-2xl rounded-[40px] border-4 border-indigo-600 shadow-2xl overflow-hidden" 
            onSubmit={async (e) => {
              e.preventDefault(); 
              if(selectedData.type === 'view') return setSelectedData(null);
              setIsSaving(true);
              const fd = new FormData(e.currentTarget);
              const payload: any = {
                nomor_dokumen: fd.get("nomor_dokumen"),
                tahun_fasilitasi: fd.get("tahun_fasilitasi"),
                link_dokumen: fd.get("link_dokumen"),
                link_tambahan: fd.get("link_tambahan")
              };
              if(activeTab === "Pendaftaran HKI Merek") payload.status_sertifikat = fd.get("status_sertifikat");

              const { error } = await supabase.from("layanan_ikm_juara").update(payload).eq("id", selectedData.data.id);
              setIsSaving(false); 
              if(!error) { setSelectedData(null); fetchData(); alert("Tersimpan!"); }
          }}>
            <div className="p-8 bg-indigo-900 text-white flex justify-between items-center">
              <h2 className="font-black uppercase italic text-xl">{selectedData.type === 'view' ? 'Pratinjau' : 'Edit Data'}</h2>
              <button type="button" onClick={() => setSelectedData(null)} className="font-black text-2xl">✕</button>
            </div>
            <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto bg-slate-50">
               <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
                 <p className="text-[9px] font-black text-indigo-400 uppercase mb-1">Nama IKM Binaan</p>
                 <p className="font-black uppercase text-slate-800">{selectedData.data.ikm_binaan?.nama_lengkap}</p>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <InputPopup label="No. Dokumen" name="nomor_dokumen" val={selectedData.data.nomor_dokumen} isEdit={selectedData.type === 'edit'} />
                 <InputPopup label="Tahun" name="tahun_fasilitasi" val={selectedData.data.tahun_fasilitasi} isEdit={selectedData.type === 'edit'} />
               </div>

               {activeTab === "Pendaftaran HKI Merek" && (
                 <div className="flex flex-col">
                   <label className="text-[10px] font-black text-slate-500 uppercase mb-1 ml-1">Status Sertifikat</label>
                   {selectedData.type === 'edit' ? (
                     <select name="status_sertifikat" defaultValue={selectedData.data.status_sertifikat} className="p-3 border-2 border-slate-200 rounded-xl font-bold bg-white">
                        <option value="Telah Didaftar">Telah Didaftar</option>
                        <option value="Proses">Proses</option>
                        <option value="Ditolak">Ditolak</option>
                     </select>
                   ) : (
                     <div className="p-3 bg-slate-100 rounded-xl font-bold text-slate-500">{selectedData.data.status_sertifikat || "Proses"}</div>
                   )}
                 </div>
               )}

               <InputPopup label="Link Utama (Drive)" name="link_dokumen" val={selectedData.data.link_dokumen} isEdit={selectedData.type === 'edit'} />
               <InputPopup label="Link Tambahan / Bukti" name="link_tambahan" val={selectedData.data.link_tambahan} isEdit={selectedData.type === 'edit'} />
            </div>
            <div className="p-6 bg-white border-t-2">
              {selectedData.type === 'edit' ? 
                <button type="submit" disabled={isSaving} className="w-full p-4 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest shadow-lg">
                  {isSaving ? "MENYIMPAN..." : "SIMPAN PERUBAHAN"}
                </button> :
                <button type="button" onClick={() => setSelectedData(null)} className="w-full p-4 rounded-2xl bg-slate-800 text-white font-black uppercase tracking-widest">TUTUP</button>
              }
            </div>
          </form>
        </div>
      )}
    </div>
  )

  function handleReset() {
    setSearchTerm("");
    setFilterTahun("");
  }
}

function InputPopup({ label, name, val, isEdit }: any) {
  return (
    <div className="flex flex-col">
      <label className="text-[10px] font-black text-slate-500 uppercase mb-1 ml-1">{label}</label>
      {isEdit ? (
        <input name={name} defaultValue={val} className="p-3 border-2 border-slate-200 rounded-xl font-bold outline-none focus:border-indigo-500" />
      ) : (
        <div className="p-3 bg-slate-100 rounded-xl font-bold text-slate-500 text-sm border border-slate-200 break-all">{val || "-"}</div>
      )}
    </div>
  )
}