"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "../../../lib/supabaseClient"
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

  // Konfigurasi Label Dinamis berdasarkan jenis layanan (Sinkron dengan inputan)
  const getFieldLabels = (layanan: string) => {
    switch (layanan) {
      case "Pendaftaran HKI Merek":
        return { doc: "No. Pendaftaran HKI", link1: "Link Sertifikat (Drive)", link2: "Link Bukti Daftar (Drive)", year: "Tahun Fasilitasi" };
      case "Pendaftaran Sertifikat Halal":
        return { doc: "No. Sertifikat Halal", link1: "Link Sertifikat (Drive)", link2: "Logo Halal (Drive)", year: "Tahun Fasilitasi" };
      case "Pendaftaran TKDN IK":
        return { doc: "No. Sertifikat TKDN IK", link1: "Link Sertifikat (Drive)", link2: "-", year: "Tahun Terbit" };
      case "Pendaftaran dan Pendampingan SIINas":
        return { doc: "No. Akun SIINas", link1: "Link Bukti Akun (Drive)", link2: "-", year: "Tahun Registrasi" };
      case "Pendaftaran Uji Nilai Gizi":
        return { doc: "No. LHU Nilai Gizi", link1: "Link LHU (Drive)", link2: "Tanggal Hasil Uji", year: "Tahun Fasilitasi" };
      case "Pendaftaran Kurasi Produk":
        return { doc: "No. Sertifikat Kurasi", link1: "Link Sertifikat (Drive)", link2: "-", year: "Tahun Kurasi" };
      default:
        return { doc: "Nomor Dokumen", link1: "Link Utama", link2: "Link Tambahan", year: "Tahun" };
    }
  }

  const labels = getFieldLabels(activeTab);

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
        (ikm.no_nib || "").includes(searchTerm)
      const matchYear = filterTahun === "" || item.tahun_fasilitasi?.toString() === filterTahun
      return matchText && matchYear
    })
  }, [dataLayanan, searchTerm, filterTahun])

  const exportToExcel = () => {
    if (filteredData.length === 0) return alert("Tidak ada data untuk diekspor")
    const data = filteredData.map((d, i) => ({
        "No": i + 1,
        "Nama IKM": d.ikm_binaan?.nama_lengkap || "-",
        "NIB": d.ikm_binaan?.no_nib || "-",
        [labels.year]: d.tahun_fasilitasi || "-",
        [labels.doc]: d.nomor_dokumen || "-",
        "Status": d.status_sertifikat || "-",
        [labels.link1]: d.link_dokumen || "-",
        [labels.link2]: d.link_tambahan || "-"
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Data")
    XLSX.writeFile(wb, `REKAP_${activeTab.replace(/ /g, "_")}.xlsx`)
  }

  const handleReset = () => {
    setSearchTerm("");
    setFilterTahun("");
  }

  return (
    <div className="p-8 bg-slate-200 min-h-screen font-sans text-slate-900">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-white p-8 rounded-[40px] shadow-xl border-b-[8px] border-indigo-800">
        <div>
          <h1 className="text-4xl font-black text-indigo-950 italic">🚀 LAYANAN IKM JUARA</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic tracking-tighter">SINKRONISASI DATABASE AKTIF</p>
          </div>
        </div>
        <button onClick={exportToExcel} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black text-sm hover:bg-emerald-700 transition-all shadow-lg active:scale-95">📊 EXPORT EXCEL</button>
      </div>

      {/* Filter Section */}
      <div className="bg-indigo-900 p-6 rounded-[30px] mb-6 flex flex-wrap gap-4 items-end shadow-2xl">
        <div className="flex-1 min-w-[300px]">
          <label className="text-[10px] font-black text-indigo-300 uppercase block mb-2 ml-2">PENCARIAN DATA</label>
          <input 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            placeholder="Cari Nama IKM atau NIB..." 
            className="w-full p-4 rounded-2xl outline-none font-bold bg-indigo-800/50 border-2 border-indigo-700 text-white placeholder:text-indigo-400/50 focus:border-indigo-400 transition-all" 
          />
        </div>
        <div className="w-32">
          <label className="text-[10px] font-black text-indigo-300 uppercase block mb-2 ml-2">TAHUN</label>
          <input 
            type="number" 
            value={filterTahun} 
            onChange={(e) => setFilterTahun(e.target.value)} 
            placeholder="2026" 
            className="w-full p-4 rounded-2xl outline-none font-bold bg-indigo-800/50 border-2 border-indigo-700 text-white focus:border-indigo-400 transition-all" 
          />
        </div>
        <button onClick={handleReset} className="bg-slate-700 text-white px-8 py-4 rounded-2xl font-black text-xs hover:bg-slate-600 transition-all active:scale-95 shadow-lg">RESET</button>
      </div>

      {/* Tabs Menu */}
      <div className="flex flex-wrap gap-2 mb-6">
        {LAYANAN_LIST.map((l) => (
          <button 
            key={l} 
            onClick={() => { setActiveTab(l); handleReset(); }} 
            className={`px-5 py-3 rounded-2xl font-black text-[10px] uppercase transition-all border-2 ${activeTab === l ? "bg-indigo-700 border-indigo-900 text-white shadow-lg translate-y-[-2px]" : "bg-white text-slate-500 border-transparent"}`}
          >
            {l.replace("Pendaftaran ", "")}
          </button>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border-2 border-slate-300">
        <table className="w-full text-left">
          <thead className="bg-indigo-950 text-white">
            <tr className="text-[11px] font-black uppercase tracking-widest">
              <th className="p-6 text-center w-20">NO</th>
              <th className="p-6">PROFIL IKM</th>
              <th className="p-6">DETAIL {activeTab.toUpperCase()}</th>
              <th className="p-6 text-center">{labels.year.toUpperCase()}</th>
              <th className="p-6 text-center">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="p-20 text-center font-black text-slate-300 text-4xl animate-pulse italic">MEMUAT...</td></tr>
            ) : filteredData.length === 0 ? (
              <tr><td colSpan={5} className="p-20 text-center font-black text-slate-400 uppercase">Data Tidak Ditemukan</td></tr>
            ) : (
              filteredData.map((row, idx) => (
                <tr key={row.id} className="hover:bg-indigo-50/50 transition-all group">
                  <td className="p-6 text-center font-black text-slate-400 border-r">{idx + 1}</td>
                  <td className="p-6">
                    <div className="font-black text-indigo-950 uppercase">{row.ikm_binaan?.nama_lengkap}</div>
                    <div className="text-[10px] font-bold text-slate-500 mt-1 italic uppercase">NIB: {row.ikm_binaan?.no_nib}</div>
                  </td>
                  <td className="p-6">
                    <div className="font-black text-slate-800 text-xs italic mb-2">{row.nomor_dokumen || "NOMOR BELUM ADA"}</div>
                    <div className="flex flex-wrap gap-2">
                        {row.link_dokumen && (
                            <a href={row.link_dokumen} target="_blank" className="text-[9px] font-black bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-800 transition-colors uppercase">🔗 {labels.link1}</a>
                        )}
                        {row.link_tambahan && (
                            <a href={row.link_tambahan} target="_blank" className="text-[9px] font-black bg-slate-600 text-white px-2 py-1 rounded hover:bg-slate-800 transition-colors uppercase">🔗 {labels.link2}</a>
                        )}
                        {activeTab === "Pendaftaran HKI Merek" && (
                            <div className={`text-[9px] font-black px-2 py-1 rounded uppercase ${row.status_sertifikat === 'Ditolak' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                STATUS: {row.status_sertifikat || "Proses"}
                            </div>
                        )}
                        {activeTab === "Pendaftaran Uji Nilai Gizi" && row.tanggal_uji && (
                             <div className="text-[9px] font-black bg-amber-100 text-amber-700 px-2 py-1 rounded uppercase">
                                Tgl Uji: {row.tanggal_uji}
                             </div>
                        )}
                    </div>
                  </td>
                  <td className="p-6 text-center"><span className="bg-indigo-100 text-indigo-900 px-3 py-1 rounded-lg font-black text-xs">{row.tahun_fasilitasi}</span></td>
                  <td className="p-6">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => setSelectedData({ type: 'view', data: row })} className="w-10 h-10 bg-white border-2 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm">👁️</button>
                      <button onClick={() => setSelectedData({ type: 'edit', data: row })} className="w-10 h-10 bg-white border-2 border-amber-300 rounded-xl hover:bg-amber-500 hover:text-white text-amber-500 transition-all shadow-sm">✏️</button>
                      <button onClick={async () => { if(confirm("Hapus data ini?")) { await supabase.from("layanan_ikm_juara").update({is_deleted: true}).eq('id', row.id); fetchData(); } }} className="w-10 h-10 bg-white border-2 border-rose-200 rounded-xl hover:bg-rose-600 hover:text-white text-rose-500 transition-all shadow-sm">🗑️</button>
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
          <form className="bg-white w-full max-w-2xl rounded-[40px] border-4 border-indigo-600 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200" 
            onSubmit={async (e) => {
              e.preventDefault(); 
              if(selectedData.type === 'view') return setSelectedData(null);
              setIsSaving(true);
              const fd = new FormData(e.currentTarget);
              const payload: any = {
                nomor_dokumen: fd.get("nomor_dokumen"),
                tahun_fasilitasi: fd.get("tahun_fasilitasi"),
                link_dokumen: fd.get("link_dokumen"),
                link_tambahan: fd.get("link_tambahan"),
                tanggal_uji: fd.get("tanggal_uji") || null
              };
              if(activeTab === "Pendaftaran HKI Merek") payload.status_sertifikat = fd.get("status_sertifikat");
              
              const { error } = await supabase.from("layanan_ikm_juara").update(payload).eq("id", selectedData.data.id);
              setIsSaving(false); 
              if(!error) { setSelectedData(null); fetchData(); alert("Data Berhasil Diperbarui!"); }
          }}>
            <div className="p-8 bg-indigo-900 text-white flex justify-between items-center">
              <h2 className="font-black uppercase italic text-xl">{selectedData.type === 'view' ? 'Detail Layanan' : 'Edit Layanan'}</h2>
              <button type="button" onClick={() => setSelectedData(null)} className="font-black text-2xl hover:text-rose-400">✕</button>
            </div>
            <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto bg-slate-50">
               <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
                 <p className="text-[9px] font-black text-indigo-400 uppercase mb-1">Nama IKM Binaan</p>
                 <p className="font-black uppercase text-slate-800">{selectedData.data.ikm_binaan?.nama_lengkap}</p>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <InputPopup label={labels.doc} name="nomor_dokumen" val={selectedData.data.nomor_dokumen} isEdit={selectedData.type === 'edit'} />
                 <InputPopup label={labels.year} name="tahun_fasilitasi" val={selectedData.data.tahun_fasilitasi} isEdit={selectedData.type === 'edit'} type="number" />
               </div>

               {activeTab === "Pendaftaran HKI Merek" && (
                 <div className="flex flex-col">
                   <label className="text-[10px] font-black text-slate-500 uppercase mb-1 ml-1">Sertifikat Merek (Status)</label>
                   {selectedData.type === 'edit' ? (
                     <select name="status_sertifikat" defaultValue={selectedData.data.status_sertifikat} className="p-3 border-2 border-slate-200 rounded-xl font-bold bg-white">
                        <option value="Telah Didaftar">Telah Didaftar</option>
                        <option value="Proses">Proses</option>
                        <option value="Ditolak">Ditolak</option>
                     </select>
                   ) : (
                     <div className="p-3 bg-slate-100 rounded-xl font-bold text-slate-500 border border-slate-200">{selectedData.data.status_sertifikat || "Proses"}</div>
                   )}
                 </div>
               )}

               {activeTab === "Pendaftaran Uji Nilai Gizi" && (
                 <InputPopup label="Tanggal Hasil Uji" name="tanggal_uji" val={selectedData.data.tanggal_uji} isEdit={selectedData.type === 'edit'} type="date" />
               )}

               <InputPopup label={labels.link1} name="link_dokumen" val={selectedData.data.link_dokumen} isEdit={selectedData.type === 'edit'} />
               <InputPopup label={labels.link2} name="link_tambahan" val={selectedData.data.link_tambahan} isEdit={selectedData.type === 'edit'} />
            </div>
            <div className="p-6 bg-white border-t-2">
              <button type={selectedData.type === 'edit' ? 'submit' : 'button'} onClick={() => selectedData.type === 'view' && setSelectedData(null)} className={`w-full p-4 rounded-2xl font-black uppercase tracking-widest shadow-lg transition-all ${selectedData.type === 'edit' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-800 text-white hover:bg-slate-900'}`}>
                {selectedData.type === 'edit' ? (isSaving ? "SEDANG MENYIMPAN..." : "UPDATE DATA") : "TUTUP"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function InputPopup({ label, name, val, isEdit, type = "text" }: any) {
  return (
    <div className="flex flex-col">
      <label className="text-[10px] font-black text-slate-500 uppercase mb-1 ml-1">{label}</label>
      {isEdit ? (
        <input type={type} name={name} defaultValue={val} className="p-3 border-2 border-slate-200 rounded-xl font-bold outline-none focus:border-indigo-500 bg-white text-slate-800" />
      ) : (
        <div className="p-3 bg-slate-100 rounded-xl font-bold text-slate-500 text-sm border border-slate-200 break-all">{val || "-"}</div>
      )}
    </div>
  )
}