"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

function DataDetail({ label, value, color = "text-slate-700" }: { label: string, value: string, color?: string }) {
  return (
    <div className="border-b border-slate-50 pb-3">
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">{label}</label>
      <div className={`text-sm font-bold break-words leading-tight ${color}`}>{value || "-"}</div>
    </div>
  )
}

export default function PenelusuranIKM() {
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [layanan, setLayanan] = useState<any[]>([])
  const [pelatihan, setPelatihan] = useState<any[]>([])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery) return
    
    setLoading(true)
    setProfile(null)
    setLayanan([])
    setPelatihan([])

    try {
      // 1. Cari Data Personal IKM
    // Ganti bagian query lama dengan ini:
const { data: dataIKM, error: errIKM } = await supabase
  .from("ikm_binaan")
  .select("*")
  .or(`nama_lengkap.ilike.%${searchQuery}%,no_nib.ilike.%${searchQuery}%,nik.ilike.%${searchQuery}%`)
  .maybeSingle()

      if (errIKM) throw errIKM
      if (!dataIKM) {
        alert("Data IKM tidak ditemukan. Pastikan NIB/NIK/Nama sudah benar.")
        setLoading(false)
        return
      }

      setProfile(dataIKM)

      // 2. Ambil Data Layanan Detail (Sinkronisasi Database Terbaru)
      const { data: resLayanan, error: errLayanan } = await supabase
        .from("layanan_ikm_juara") 
        .select("jenis_layanan, nomor_dokumen, tahun_fasilitasi, status_sertifikat, link_dokumen, link_tambahan, tanggal_uji") 
        .eq("ikm_id", dataIKM.id)
        .eq("is_deleted", false)
        .order("tahun_fasilitasi", { ascending: false });

      if (errLayanan) {
        console.error("Gagal sinkronisasi layanan:", errLayanan.message);
      } else {
        setLayanan(resLayanan || []);
      }

      // 3. Ambil Riwayat Pelatihan & Pemberdayaan
      const { data: resPelatihan, error: errPelatihan } = await supabase
        .from("peserta_pelatihan")
        .select(`
          kegiatan_pelatihan (
            nama_kegiatan,
            waktu_pelaksanaan,
            deskripsi_kegiatan,
            tahun_pelaksanaan
          )
        `)
        .eq("ikm_id", dataIKM.id)

      if (!errPelatihan && resPelatihan) {
        const formattedPelatihan = resPelatihan.map((p: any) => p.kegiatan_pelatihan)
        setPelatihan(formattedPelatihan)
      }

    } catch (error) {
      console.error("Error fetching data:", error)
      alert("Terjadi kesalahan saat mengambil data.")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSearchQuery("")
    setProfile(null)
    setLayanan([])
    setPelatihan([])
  }

  const exportExcel = () => {
    if (!profile) return
    const wb = XLSX.utils.book_new()
    
    // Sheet 1: Profil & Layanan
    const dataGabungan = [
      ["PROFIL PERSONAL IKM BINAAN"],
      ["Nama Lengkap", profile.nama_lengkap],
      ["NIB", profile.no_nib],
      ["NIK", profile.nik],
      ["Nama Usaha", profile.nama_usaha || "-"],
      ["No HP", profile.no_hp],
      ["Alamat", profile.alamat],
      [""],
      ["RIWAYAT LAYANAN IKM JUARA"],
      ["No", "Jenis Layanan", "No. Dokumen", "Tahun Fasilitasi", "Status"]
    ]

    layanan.forEach((l, i) => {
      dataGabungan.push([
        i + 1, 
        l.jenis_layanan, 
        l.nomor_dokumen || "-", 
        l.tahun_fasilitasi || "-", 
        l.status_sertifikat || "PROSES"
      ])
    })

    const ws1 = XLSX.utils.aoa_to_sheet(dataGabungan)
    XLSX.utils.book_append_sheet(wb, ws1, "Profil dan Layanan")

    // Sheet 2: Riwayat Pelatihan
    const dataPelatihan = [
      ["RIWAYAT PELATIHAN & PEMBERDAYAAN"],
      ["No", "Nama Kegiatan", "Waktu Pelaksanaan", "Tahun", "Deskripsi"]
    ]
    pelatihan.forEach((p, i) => {
      dataPelatihan.push([i + 1, p.nama_kegiatan, p.waktu_pelaksanaan, p.tahun_pelaksanaan, p.deskripsi_kegiatan])
    })
    const ws2 = XLSX.utils.aoa_to_sheet(dataPelatihan)
    XLSX.utils.book_append_sheet(wb, ws2, "Riwayat Pelatihan")

    XLSX.writeFile(wb, `DATA_IKM_${profile.nama_lengkap.replace(/ /g, "_")}.xlsx`)
  }

  const exportPDF = () => {
    if (!profile) return
    const doc = new jsPDF()
    
    doc.setFont("helvetica", "bold")
    doc.setFontSize(16)
    doc.text("PROFIL LENGKAP IKM BINAAN", 105, 15, { align: "center" })

    // 1. Tabel Data Personal
    autoTable(doc, {
      startY: 25,
      head: [['INFORMASI PERSONAL', 'DETAIL DATA']],
      body: [
        ['Nama Lengkap', profile.nama_lengkap],
        ['NIB', profile.no_nib],
        ['NIK', profile.nik],
        ['Nama Usaha', profile.nama_usaha || "-"],
        ['No. HP / WhatsApp', profile.no_hp],
        ['Alamat Lengkap', profile.alamat],
      ],
      theme: 'striped',
      headStyles: { fillColor: [49, 46, 129] }
    })

    // 2. Tabel Layanan
    const finalY1 = (doc as any).lastAutoTable.finalY + 10
    doc.text("RIWAYAT LAYANAN IKM JUARA", 14, finalY1)
    autoTable(doc, {
      startY: finalY1 + 2,
      head: [['No', 'Jenis Layanan', 'No. Dokumen', 'Tahun', 'Status']],
      body: layanan.map((l, i) => [
        i + 1, 
        l.jenis_layanan, 
        l.nomor_dokumen || "-", 
        l.tahun_fasilitasi || "-",
        l.status_sertifikat || "PROSES"
      ]),
      headStyles: { fillColor: [79, 70, 229] }
    })

    // 3. Tabel Pelatihan
    const finalY2 = (doc as any).lastAutoTable.finalY + 10
    doc.text("RIWAYAT PELATIHAN & PEMBERDAYAAN", 14, finalY2)
    autoTable(doc, {
      startY: finalY2 + 2,
      head: [['No', 'Nama Kegiatan', 'Waktu Pelaksanaan', 'Tahun']],
      body: pelatihan.map((p, i) => [i + 1, p.nama_kegiatan, p.waktu_pelaksanaan, p.tahun_pelaksanaan]),
      headStyles: { fillColor: [5, 150, 105] }
    })

    doc.save(`PROFIL_IKM_${profile.no_nib}.pdf`)
  }

  return (
    <div className="p-4 md:p-8 bg-[#F1F5F9] min-h-screen font-sans text-slate-900">
      {/* SECTION PENCARIAN */}
      <div className="max-w-6xl mx-auto bg-indigo-950 p-8 md:p-12 rounded-[40px] shadow-2xl mb-8 relative overflow-hidden border-b-[10px] border-indigo-600">
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-6 flex items-center gap-3">
            <span className="text-4xl">🔎</span> PENELUSURAN DATA IKM
          </h1>
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Input Nama Lengkap / No. NIB / No. NIK..."
              className="flex-1 p-5 rounded-2xl font-bold text-lg outline-none border-4 border-transparent focus:border-indigo-400 shadow-2xl bg-indigo-900/50 text-white placeholder:text-indigo-300/50"
            />
            <div className="flex gap-3">
              <button type="submit" className="bg-indigo-500 text-white px-10 py-5 rounded-2xl font-black uppercase hover:bg-indigo-400 transition-all shadow-lg active:scale-95">TELUSURI</button>
              <button type="button" onClick={handleReset} className="bg-rose-600 text-white px-8 py-5 rounded-2xl font-black uppercase hover:bg-rose-500 transition-all shadow-lg active:scale-95">RESET</button>
            </div>
          </form>
        </div>
      </div>

      {loading && (
        <div className="text-center py-20">
          <div className="text-4xl animate-bounce mb-4">🚀</div>
          <p className="font-black text-indigo-950 text-xl italic uppercase">Menghubungkan Database...</p>
        </div>
      )}

      {profile && (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* TOMBOL EKSPOR */}
          <div className="flex justify-end gap-3">
            <button onClick={exportExcel} className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-black text-xs uppercase shadow-md hover:bg-emerald-600 transition-all flex items-center gap-2">
              📊 EXCEL (.XLSX)
            </button>
            <button onClick={exportPDF} className="bg-rose-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase shadow-md hover:bg-rose-700 transition-all flex items-center gap-2">
              📕 PDF ASLI
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* KARTU IDENTITAS PERSONAL */}
            <div className="lg:col-span-1 bg-white p-8 rounded-[40px] shadow-xl border-2 border-slate-100 h-fit sticky top-8">
              <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center text-3xl mb-6 shadow-inner">👤</div>
              <h2 className="text-2xl font-black text-indigo-950 uppercase leading-tight">{profile.nama_lengkap}</h2>
              <p className="text-[10px] font-black text-indigo-500 bg-indigo-50 inline-block px-3 py-1 rounded-lg mt-2 uppercase tracking-widest">Terverifikasi Binaan</p>
              
              <div className="mt-8 space-y-5">
                <DataDetail label="NIB (NOMOR INDUK BERUSAHA)" value={profile.no_nib} />
                <DataDetail label="NIK (KTP)" value={profile.nik} />
                <DataDetail label="NAMA USAHA" value={profile.nama_usaha || "Belum Input Nama Usaha"} color="text-emerald-600" />
                <DataDetail label="WHATSAPP / NO. HP" value={profile.no_hp} />
                <DataDetail label="ALAMAT LENGKAP" value={profile.alamat} />
              </div>
            </div>

            {/* DATA LAYANAN & PELATIHAN */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-[40px] shadow-xl overflow-hidden border-2 border-slate-100">
                <div className="bg-indigo-900 p-6 flex items-center gap-3">
                  <span className="text-xl">🏆</span>
                  <h3 className="text-white font-black italic uppercase tracking-widest text-sm">Rincian Layanan IKM Juara</h3>
                </div>
                
                <div className="p-6 space-y-6">
                  {layanan.length > 0 ? (
                    layanan.map((l, i) => (
                      <div key={i} className="p-6 bg-slate-50 rounded-[30px] border-l-[8px] border-indigo-500">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                          <div>
                            <h4 className="font-black text-indigo-900 uppercase text-lg tracking-tight">
                              {l.jenis_layanan}
                            </h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Tahun Fasilitasi: {l.tahun_fasilitasi || '-'}
                            </p>
                          </div>
                          <span className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase border ${
                            l.status_sertifikat?.toLowerCase().includes('didaftar') || l.status_sertifikat?.toLowerCase().includes('selesai')
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                              : 'bg-amber-100 text-amber-700 border-amber-200'
                          }`}>
                            {l.status_sertifikat || 'PROSES'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">No. Dokumen / Pendaftaran</p>
                            <p className="text-sm font-bold text-slate-700 font-mono">
                              {l.nomor_dokumen || "-"}
                            </p>
                          </div>
                          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">
                              {l.jenis_layanan.includes('Gizi') ? 'Tanggal Hasil Uji' : 'Tahun'}
                            </p>
                            <p className="text-sm font-bold text-slate-700">
                              {l.tanggal_uji || l.tahun_fasilitasi || "-"}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          {l.link_dokumen && l.link_dokumen !== "-" && (
                            <a href={l.link_dokumen} target="_blank" rel="noopener noreferrer" className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-indigo-700">
                              📂 LIHAT SERTIFIKAT
                            </a>
                          )}
                          {l.link_tambahan && l.link_tambahan !== "-" && (
                            <a href={l.link_tambahan} target="_blank" rel="noopener noreferrer" className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-emerald-600">
                              📜 LINK TAMBAHAN
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 italic text-slate-400 font-bold uppercase text-xs">
                      Belum ada riwayat layanan yang terdaftar.
                    </div>
                  )}
                </div>
              </div>

              {/* RIWAYAT PELATIHAN */}
              <div className="bg-white rounded-[40px] shadow-xl overflow-hidden border-2 border-slate-100">
                <div className="bg-emerald-600 p-6 flex items-center gap-3">
                  <span className="text-xl">🎓</span>
                  <h3 className="text-white font-black italic uppercase tracking-widest text-sm">Riwayat Pelatihan & Pemberdayaan</h3>
                </div>
                <div className="p-6">
                  {pelatihan.length > 0 ? (
                    <div className="space-y-4">
                      {pelatihan.map((p: any, i: number) => (
                        <div key={i} className="p-6 bg-slate-50 rounded-[30px] border-l-[8px] border-emerald-500 hover:shadow-md transition-all">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-3">
                            <h4 className="font-black text-indigo-950 uppercase text-sm">{p.nama_kegiatan}</h4>
                            <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full uppercase">
                              📅 {p.waktu_pelaksanaan} ({p.tahun_pelaksanaan})
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed font-medium italic bg-white p-3 rounded-xl border border-slate-100">
                            "{p.deskripsi_kegiatan || 'Tidak ada deskripsi detail untuk kegiatan ini.'}"
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 italic text-slate-400 font-bold">Belum ada riwayat pelatihan yang diikuti.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}