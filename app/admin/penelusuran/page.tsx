"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export default function PenelusuranIKM() {
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [layanan, setLayanan] = useState<any[]>([])
  const [pelatihan, setPelatihan] = useState<any[]>([])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.length < 3) return alert("Masukkan minimal 3 karakter pencarian.")
    
    setLoading(true)
    setProfile(null)

    // 1. Cari Data Dasar IKM
    const { data: dataIKM, error: errIKM } = await supabase
      .from("ikm_binaan")
      .select("*")
      .or(`nama_lengkap.ilike.%${searchQuery}%,no_nib.eq.${searchQuery},nik.eq.${searchQuery}`)
      .single()

    if (errIKM || !dataIKM) {
      alert("Data IKM tidak ditemukan.")
      setLoading(false)
      return
    }

    setProfile(dataIKM)

    // 2. Cari Layanan IKM Juara (Halal, Merek, dll)
    const { data: dataLayanan } = await supabase
      .from("data_layanan")
      .select("*")
      .eq("ikm_id", dataIKM.id)
    
    setLayanan(dataLayanan || [])

    // 3. Cari Riwayat Pelatihan
    const { data: dataPeserta } = await supabase
      .from("peserta_pelatihan")
      .select(`
        id,
        kegiatan_pelatihan (
          nama_kegiatan,
          waktu_pelaksanaan,
          deskripsi_kegiatan,
          tahun_pelaksanaan
        )
      `)
      .eq("ikm_id", dataIKM.id)

    setPelatihan(dataPeserta || [])
    setLoading(false)
  }

  const handleReset = () => {
    setSearchQuery("")
    setProfile(null)
    setLayanan([])
    setPelatihan([])
  }

  const exportExcel = () => {
    const wb = XLSX.utils.book_new()
    
    // Sheet 1: Profil & Layanan
    const dataGabungan = [
      ["PROFIL IKM BINAAN"],
      ["Nama", profile.nama_lengkap],
      ["NIB", profile.no_nib],
      ["NIK", profile.nik],
      ["No HP", profile.no_hp],
      ["Alamat", profile.alamat],
      [""],
      ["DAFTAR LAYANAN DITERIMA"],
      ["No", "Jenis Layanan", "No Sertifikat", "Tahun", "Status"]
    ]

    layanan.forEach((l, i) => {
      dataGabungan.push([i + 1, l.jenis_layanan, l.no_sertifikat, l.tahun_fasilitasi, l.status])
    })

    const ws1 = XLSX.utils.aoa_to_sheet(dataGabungan)
    XLSX.utils.book_append_sheet(wb, ws1, "Profil & Layanan")

    // Sheet 2: Riwayat Pelatihan
    const dataPelatihan = [
      ["RIWAYAT PELATIHAN"],
      ["No", "Nama Kegiatan", "Waktu", "Tahun", "Deskripsi"]
    ]
    pelatihan.forEach((p, i) => {
      const k = p.kegiatan_pelatihan
      dataPelatihan.push([i + 1, k.nama_kegiatan, k.waktu_pelaksanaan, k.tahun_pelaksanaan, k.deskripsi_kegiatan])
    })
    const ws2 = XLSX.utils.aoa_to_sheet(dataPelatihan)
    XLSX.utils.book_append_sheet(wb, ws2, "Riwayat Pelatihan")

    XLSX.writeFile(wb, `Profil_IKM_${profile.no_nib}.xlsx`)
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text("PROFIL DATA IKM BINAAN", 14, 20)
    
    doc.setFontSize(11)
    doc.text(`Nama: ${profile.nama_lengkap}`, 14, 30)
    doc.text(`NIB: ${profile.no_nib}`, 14, 35)
    doc.text(`NIK: ${profile.nik}`, 14, 40)
    doc.text(`Alamat: ${profile.alamat}`, 14, 45)

    doc.text("1. LAYANAN IKM JUARA", 14, 55)
    autoTable(doc, {
      startY: 60,
      head: [['No', 'Layanan', 'No. Dokumen', 'Tahun', 'Status']],
      body: layanan.map((l, i) => [i + 1, l.jenis_layanan, l.no_sertifikat, l.tahun_fasilitasi, l.status]),
    })

    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.text("2. RIWAYAT PELATIHAN & PEMBERDAYAAN", 14, finalY)
    autoTable(doc, {
      startY: finalY + 5,
      head: [['No', 'Nama Kegiatan', 'Waktu', 'Tahun']],
      body: pelatihan.map((p, i) => [
        i + 1, 
        p.kegiatan_pelatihan.nama_kegiatan, 
        p.kegiatan_pelatihan.waktu_pelaksanaan,
        p.kegiatan_pelatihan.tahun_pelaksanaan
      ]),
    })

    doc.save(`Profil_IKM_${profile.no_nib}.pdf`)
  }

  return (
    <div className="p-8 bg-slate-100 min-h-screen font-sans text-slate-900">
      {/* HEADER SEARCH */}
      <div className="max-w-6xl mx-auto bg-indigo-950 p-10 rounded-[40px] shadow-2xl mb-8 border-b-[10px] border-indigo-600">
        <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-6 flex items-center gap-3">
          🔍 PENELUSURAN DATA IKM
        </h1>
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Masukkan Nama Lengkap / NIB (13 Digit) / NIK (16 Digit)..."
            className="flex-1 p-5 rounded-2xl font-bold text-lg outline-none border-4 border-transparent focus:border-indigo-400 shadow-inner"
          />
          <div className="flex gap-2">
            <button type="submit" className="bg-indigo-500 text-white px-10 py-5 rounded-2xl font-black uppercase hover:bg-indigo-400 transition-all shadow-lg active:scale-95">TELUSURI</button>
            <button type="button" onClick={handleReset} className="bg-rose-600 text-white px-8 py-5 rounded-2xl font-black uppercase hover:bg-rose-500 transition-all shadow-lg active:scale-95">RESET</button>
          </div>
        </form>
      </div>

      {loading && <div className="text-center p-20 font-black text-indigo-950 text-3xl animate-pulse italic">MENCARI DATA... 🚀</div>}

      {profile && (
        <div className="max-w-6xl mx-auto animate-in fade-in zoom-in duration-300">
          <div className="flex justify-end gap-3 mb-4">
            <button onClick={exportExcel} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase shadow-md hover:bg-emerald-700">📊 EXCEL (.XLSX)</button>
            <button onClick={exportPDF} className="bg-rose-700 text-white px-6 py-3 rounded-xl font-black text-xs uppercase shadow-md hover:bg-rose-800">📕 PDF ASLI</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* KARTU PROFIL DASAR */}
            <div className="md:col-span-1 bg-white p-8 rounded-[40px] shadow-xl border-2 border-slate-200">
              <div className="w-24 h-24 bg-indigo-100 rounded-3xl flex items-center justify-center text-4xl mb-6 shadow-inner">👤</div>
              <h2 className="text-2xl font-black text-indigo-950 uppercase leading-tight mb-2">{profile.nama_lengkap}</h2>
              <p className="text-xs font-bold text-indigo-600 bg-indigo-50 inline-block px-3 py-1 rounded-full mb-6 italic">Terverifikasi Binaan</p>
              
              <div className="space-y-4">
                <InfoItem label="NIB" value={profile.no_nib} />
                <InfoItem label="NIK" value={profile.nik} />
                <InfoItem label="WhatsApp" value={profile.no_hp} />
                <InfoItem label="Alamat" value={profile.alamat} />
              </div>
            </div>

            <div className="md:col-span-2 space-y-6">
              {/* TABEL LAYANAN IKM JUARA */}
              <div className="bg-white rounded-[40px] shadow-xl overflow-hidden border-2 border-slate-200">
                <div className="bg-indigo-900 p-6">
                  <h3 className="text-white font-black italic uppercase tracking-widest text-sm">🏆 Layanan IKM Juara</h3>
                </div>
                <div className="p-6">
                  {layanan.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="border-b-2">
                          <tr className="text-[10px] font-black text-slate-400 uppercase">
                            <th className="pb-3">Jenis Layanan</th>
                            <th className="pb-3">No. Dokumen</th>
                            <th className="pb-3">Tahun</th>
                            <th className="pb-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {layanan.map((l: any, i: number) => (
                            <tr key={i} className="text-sm">
                              <td className="py-4 font-black text-indigo-900 uppercase">{l.jenis_layanan}</td>
                              <td className="py-4 font-mono text-xs">{l.no_sertifikat || "-"}</td>
                              <td className="py-4 font-bold text-slate-500">{l.tahun_fasilitasi}</td>
                              <td className="py-4 text-right">
                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full font-black text-[9px] uppercase border border-emerald-100">{l.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center py-10 italic text-slate-400 font-bold">Belum ada riwayat layanan terinput.</p>
                  )}
                </div>
              </div>

              {/* TABEL PELATIHAN */}
              <div className="bg-white rounded-[40px] shadow-xl overflow-hidden border-2 border-slate-200">
                <div className="bg-emerald-700 p-6">
                  <h3 className="text-white font-black italic uppercase tracking-widest text-sm">🎓 Riwayat Pelatihan & Pemberdayaan</h3>
                </div>
                <div className="p-6">
                  {pelatihan.length > 0 ? (
                    <div className="space-y-4">
                      {pelatihan.map((p: any, i: number) => (
                        <div key={i} className="p-5 bg-slate-50 rounded-3xl border-l-[6px] border-emerald-500">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-black text-slate-800 uppercase text-sm">{p.kegiatan_pelatihan.nama_kegiatan}</h4>
                            <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">{p.kegiatan_pelatihan.waktu_pelaksanaan} ({p.kegiatan_pelatihan.tahun_pelaksanaan})</span>
                          </div>
                          <p className="text-xs text-slate-500 italic leading-relaxed">{p.kegiatan_pelatihan.deskripsi_kegiatan || "Tidak ada deskripsi kegiatan."}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-10 italic text-slate-400 font-bold">Belum pernah mengikuti pelatihan.</p>
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

function InfoItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="border-b border-slate-100 pb-2">
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      <div className="text-sm font-bold text-slate-700 break-words">{value || "-"}</div>
    </div>
  )
}