"use client"

import { useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import * as XLSX from "xlsx"
import Link from "next/link"
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
  const [showNotFound, setShowNotFound] = useState(false)

  // Masukkan string Base64 Logo Anda di sini (Contoh logo default/placeholder)
  const LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAADAklEQVR4nO3cwU0DMRAGYS8V0AAdUAF0QAV0QAIdUAF0QAdUQAIdUAF0mOfAsiYbe71e7/mSJSf7Y896idmZpAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIBf69p6AnAt9Xp9G30IsAnVdX0ZfQiwC9V1fR19CLAL1XV9G30IcAnVdX0ffQhwCdV1fR99CHAJ1XV9H30IcAnVdX0ffQhwCdV1fR99CHAJ1XV9H30IcAnVdX0ffQhwCdV1fR99CHAJ1XV9H30IcAnVdX0ffQhwCdV1fR99CHAJ1XV9H30IcAnVdX0ffQhwCdV1fR99CHAJ1XV9H30IcAnVdX0ffQhwCdV1fR99CHAJ1XV9H30IcAnVdX0ffQhwCdV1fR99CHAJ1XV9H30IcAnVdX0ffQhwCdV1fR99CHAJ1XV9H30IcAnVdX0ffQhwCdV1fR99CHAJ1XV9H30IcAnVdX0ffQhwCdV1fR99CHAJ1XV9H30IcAnVdX0ffQhwCdV1fR99CHAJ1XV9H30IcAnVdX0ffQhwCdV1fR99CHAJ1XV9H30IcAnVdX0ffQhwCdV1fR99CHAJ1XV9H30IcAnVdX0ffQhwCdV1fR99CHAJ1XV9H30IcAnVdX0ffQhwCdV1fR99CHAJ1XV9H30IcAnVdX0ffQhwCdV1fR99CHAJ1XV9H30IcAnVdX0ffQhwCdV1fR99CHAJ1XV9H30IcAnVdX0ffQhwCdV1fR99CHAJ1XV9H30IcAnVdX0ffQhwCdV1fR99CHAJ1XV9H30IcAnVdX0ffQhwCdV1fR99CHAJ1XV9H30IcAnVdX0ffQhwCdV1fR99CHAJ1XV9H30IcAnVdX0ffQhwCdV1fR99CHAJ1XV9H30IcAnVdX0ffQhwCdV1fR99CHAJ1XV9H30IcAnVdX0ffQhwCdV1fR99CHAJ1XV9H30IcAnVdX0ffQhwCdV1fR99CHAJ1XV9H30IcAnVdX0ffQhwCdV1fR99CHAJ1XV9H30IcAnVdX0ffQhwCdV1fR99CHAJ1XV9H30IcAmdB6yPz/0N/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8Ad+AVS9X96pSm7fAAAAAElFTkSuQmCC";

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery) return
    
    setLoading(true)
    setProfile(null)
    setLayanan([])
    setPelatihan([])
    setShowNotFound(false)

    const savedName = typeof window !== 'undefined' ? localStorage.getItem("user_name_ikm") : null;
    const currentUsername = savedName || 'ANONIM';

    try {
      const cleanQuery = searchQuery.trim();
      const { data: dataIKM, error: errIKM } = await supabase
        .from("ikm_binaan")
        .select("*")
        .or(`nama_lengkap.ilike.%${cleanQuery}%,no_nib.ilike.%${cleanQuery}%,nik.ilike.%${cleanQuery}%`)
        .maybeSingle()

      if (errIKM) throw errIKM

      if (!dataIKM) {
        await supabase.from("activity_logs").insert([{
          role: 'user/public',
          username: currentUsername,
          action_type: 'pencarian',
          description: `Pencarian GAGAL untuk NIB/NIK/Nama: ${cleanQuery}`,
        }]);
        setShowNotFound(true)
        setLoading(false)
        return
      }

      await supabase.from("activity_logs").insert([{
        role: 'user/public',
        username: currentUsername,
        action_type: 'pencarian',
        description: `Pencarian BERHASIL untuk: ${dataIKM.nama_lengkap} (NIB: ${dataIKM.no_nib})`,
      }]);

      setProfile(dataIKM)

      const { data: resLayanan, error: errLayanan } = await supabase
        .from("layanan_ikm_juara") 
        .select("jenis_layanan, nomor_dokumen, tahun_fasilitasi, status_sertifikat, link_dokumen, link_tambahan, tanggal_uji") 
        .eq("ikm_id", dataIKM.id)
        .eq("is_deleted", false)
        .order("tahun_fasilitasi", { ascending: false });

      if (!errLayanan) setLayanan(resLayanan || []);

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
      console.error("Error:", error)
      alert("Terjadi kesalahan saat mengambil data.")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSearchQuery(""); setProfile(null); setLayanan([]); setPelatihan([]); setShowNotFound(false);
  }

  const exportExcel = () => {
    if (!profile) return
    const wb = XLSX.utils.book_new()
    const dataProfil = [
      ["PROFIL PERSONAL IKM"],
      ["Nama Lengkap", profile.nama_lengkap],
      ["NIB", profile.no_nib],
      ["NIK", profile.nik],
      ["Nama Usaha", profile.nama_usaha],
      ["WhatsApp", profile.no_hp],
      ["Alamat", profile.alamat],
      [""],
    ]
    const dataLayanan = [
      ["RINCIAN LAYANAN IKM JUARA"],
      ["No", "Jenis Layanan", "No. Dokumen", "Tahun", "Keterangan Waktu", "Status", "Link Sertifikat"]
    ]
    layanan.forEach((l, i) => {
      dataLayanan.push([
        i + 1, l.jenis_layanan, l.nomor_dokumen || "-", l.tahun_fasilitasi || "-", 
        l.tanggal_uji || l.tahun_fasilitasi || "-",
        l.status_sertifikat || (l.jenis_layanan.toLowerCase().includes('merek') ? "PROSES" : "-"),
        l.link_dokumen || "-"
      ])
    })
    const dataPelatihan = [
      [""], ["RIWAYAT PELATIHAN & PEMBERDAYAAN"],
      ["No", "Nama Kegiatan", "Tahun", "Waktu", "Deskripsi Kegiatan"]
    ]
    if (pelatihan.length > 0) {
      pelatihan.forEach((p, i) => {
        dataPelatihan.push([i + 1, p.nama_kegiatan, p.tahun_pelaksanaan, p.waktu_pelaksanaan || "-", p.deskripsi_kegiatan || "-"])
      })
    } else {
      dataPelatihan.push(["-", "Belum ada riwayat pelatihan", "-", "-", "-"])
    }
    const dataGabungan = [...dataProfil, ...dataLayanan, ...dataPelatihan]
    const ws = XLSX.utils.aoa_to_sheet(dataGabungan)
    ws['!cols'] = [{ wch: 5 }, { wch: 35 }, { wch: 25 }, { wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 45 }];
    XLSX.utils.book_append_sheet(wb, ws, "Data Lengkap IKM")
    XLSX.writeFile(wb, `DATA_IKM_LENGKAP_${profile.no_nib}.xlsx`)
  }

  // --- FITUR EKSPOR PDF DENGAN LOGO ---
  const exportPDF = () => {
    if (!profile) return
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    // A. HEADER DENGAN LOGO
    try {
      // addImage(data, format, x, y, width, height)
      doc.addImage(LOGO_BASE64, 'PNG', 14, 10, 20, 20)
    } catch (e) {
      console.error("Logo gagal dimuat:", e)
    }

    // Judul (Geser ke kanan sedikit karena ada logo)
    doc.setFontSize(16); doc.setTextColor(30, 27, 75); doc.setFont("helvetica", "bold")
    doc.text("KARTU DATA IKM BINAAN", 40, 18)
    
    doc.setFontSize(9); doc.setTextColor(100); doc.setFont("helvetica", "normal")
    doc.text("Sistem Layanan IKM Juara - Data Terverifikasi", 40, 24)
    doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, pageWidth - 14, 24, { align: 'right' })

    // Garis Pemisah Header
    doc.setDrawColor(200); doc.line(14, 32, pageWidth - 14, 32)
    
    // B. SECTION: PROFIL PERSONAL
    autoTable(doc, {
      startY: 38,
      head: [['INFORMASI PROFIL PERSONAL', '']],
      body: [
        ['Nama Lengkap', `: ${profile.nama_lengkap || "-"}`],
        ['NIB', `: ${profile.no_nib || "-"}`],
        ['NIK', `: ${profile.nik || "-"}`],
        ['Nama Usaha', `: ${profile.nama_usaha || "-"}`],
        ['WhatsApp', `: ${profile.no_hp || "-"}`],
        ['Alamat', `: ${profile.alamat || "-"}`]
      ],
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: 'bold', width: 40 } },
      headStyles: { fillColor: [30, 27, 75], textColor: [255, 255, 255], fontStyle: 'bold' }
    })

    // C. SECTION: LAYANAN
    const lastY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(12); doc.setTextColor(30, 27, 75); doc.setFont("helvetica", "bold")
    doc.text("RINCIAN LAYANAN FASILITASI", 14, lastY + 15)
    
    autoTable(doc, {
      startY: lastY + 20,
      head: [['No', 'Jenis Layanan', 'Nomor Dokumen', 'Tahun', 'Status']],
      body: layanan.map((l, i) => [
        i + 1, l.jenis_layanan, l.nomor_dokumen || "-", l.tahun_fasilitasi || "-", 
        l.status_sertifikat || (l.jenis_layanan.toLowerCase().includes('merek') ? "PROSES" : "-")
      ]),
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 8 }
    })

    // D. SECTION: PELATIHAN
    const trainingY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(12); doc.setFont("helvetica", "bold")
    doc.text("RIWAYAT PELATIHAN & PEMBERDAYAAN", 14, trainingY + 15)
    
    autoTable(doc, {
      startY: trainingY + 20,
      head: [['No', 'Nama Kegiatan', 'Tahun', 'Waktu']],
      body: pelatihan.length > 0 
        ? pelatihan.map((p, i) => [i + 1, p.nama_kegiatan, p.tahun_pelaksanaan, p.waktu_pelaksanaan || "-"])
        : [['-', 'Belum ada riwayat pelatihan', '-', '-']],
      headStyles: { fillColor: [5, 150, 105] },
      styles: { fontSize: 8 }
    })

    // E. FOOTER KARTU
    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(8); doc.setTextColor(150); doc.setFont("helvetica", "italic")
    doc.text("*Dokumen ini dihasilkan secara otomatis oleh Sistem IKM Juara.", 14, finalY + 20)

    doc.save(`KARTU_DATA_IKM_${profile.no_nib}.pdf`)
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F1F5F9] font-sans text-slate-900">
      <main className="flex-grow p-4 md:p-8">
        {/* Header Search Box */}
        <div className="max-w-6xl mx-auto bg-indigo-950 p-8 md:p-12 rounded-[40px] shadow-2xl mb-8 border-b-[10px] border-indigo-600">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
              <span className="text-4xl">🔎</span> PENELUSURAN DATA IKM
            </h1>
            <Link href="/" className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-white/20 flex items-center gap-2 w-fit">
              🏠 Beranda Utama
            </Link>
          </div>
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Input Nama / NIB / NIK..."
              className="flex-1 p-5 rounded-2xl font-bold text-lg outline-none border-4 border-transparent focus:border-indigo-400 shadow-2xl bg-indigo-900/50 text-white placeholder:text-indigo-300/50"
            />
            <div className="flex gap-3">
              <button type="submit" className="bg-indigo-500 text-white px-10 py-5 rounded-2xl font-black hover:bg-indigo-400 transition-all shadow-lg active:scale-95 uppercase">TELUSURI</button>
              <button type="button" onClick={handleReset} className="bg-rose-600 text-white px-8 py-5 rounded-2xl font-black hover:bg-rose-500 transition-all shadow-lg active:scale-95 uppercase">RESET</button>
            </div>
          </form>
        </div>

        {loading && <div className="text-center py-20 animate-pulse text-indigo-950 font-black italic uppercase text-xl">🚀 Menghubungkan Database...</div>}

        {profile && (
          <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-end gap-3">
              <button onClick={exportPDF} className="bg-rose-500 text-white px-6 py-3 rounded-xl font-black text-xs uppercase shadow-md hover:bg-rose-600 transition-all flex items-center gap-2">📑 CETAK PDF</button>
              <button onClick={exportExcel} className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-black text-xs uppercase shadow-md hover:bg-emerald-600 transition-all flex items-center gap-2">📊 EXCEL</button>
            </div>

            {/* Konten Detail Profil Sama Seperti Sebelumnya */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 bg-white p-8 rounded-[40px] shadow-xl border-2 border-slate-100 h-fit sticky top-8">
                <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center text-3xl mb-6 shadow-inner">👤</div>
                <h2 className="text-2xl font-black text-indigo-950 uppercase leading-tight">{profile.nama_lengkap}</h2>
                <p className="text-[10px] font-black text-indigo-500 bg-indigo-50 inline-block px-3 py-1 rounded-lg mt-2 uppercase tracking-widest">Terverifikasi Binaan</p>
                <div className="mt-8 space-y-5">
                  <DataDetail label="NIB" value={profile.no_nib} />
                  <DataDetail label="NIK" value={profile.nik} />
                  <DataDetail label="NAMA USAHA" value={profile.nama_usaha} color="text-emerald-600" />
                  <DataDetail label="WHATSAPP" value={profile.no_hp} />
                  <DataDetail label="ALAMAT" value={profile.alamat} />
                </div>
              </div>

              <div className="lg:col-span-2 space-y-8">
                {/* Rincian Layanan */}
                <div className="bg-white rounded-[40px] shadow-xl overflow-hidden border-2 border-slate-100">
                  <div className="bg-indigo-900 p-6 flex items-center gap-3">
                    <span className="text-xl">🏆</span>
                    <h3 className="text-white font-black italic uppercase tracking-widest text-sm">Rincian Layanan IKM Juara</h3>
                  </div>
                  <div className="p-6 space-y-6">
                    {layanan.map((l, i) => (
                      <div key={i} className="p-6 bg-slate-50 rounded-[30px] border-l-[8px] border-indigo-500">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                          <div>
                            <h4 className="font-black text-indigo-900 uppercase text-lg tracking-tight">{l.jenis_layanan}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tahun Fasilitasi: {l.tahun_fasilitasi}</p>
                          </div>
                          {l.jenis_layanan.toLowerCase().includes('merek') && (
                            <span className="px-4 py-1.5 rounded-full font-black text-[10px] uppercase bg-amber-100 text-amber-700 border border-amber-200">
                              {l.status_sertifikat || 'PROSES'}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">No. Dokumen / Pendaftaran</p>
                            <p className="text-sm font-bold text-slate-700 font-mono">{l.nomor_dokumen || "-"}</p>
                          </div>
                          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Keterangan Waktu</p>
                            <p className="text-sm font-bold text-slate-700">{l.tanggal_uji || l.tahun_fasilitasi || "-"}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Riwayat Pelatihan */}
                <div className="bg-white rounded-[40px] shadow-xl overflow-hidden border-2 border-slate-100">
                  <div className="bg-emerald-600 p-6 flex items-center gap-3">
                    <span className="text-xl">🎓</span>
                    <h3 className="text-white font-black italic uppercase tracking-widest text-sm">Riwayat Pelatihan & Pemberdayaan</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    {pelatihan.length > 0 ? pelatihan.map((p, i) => (
                      <div key={i} className="p-6 bg-slate-50 rounded-[30px] border-l-[8px] border-emerald-500 shadow-sm">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
                          <h4 className="font-black text-indigo-950 uppercase text-base leading-tight">{p.nama_kegiatan}</h4>
                          <div className="flex gap-2">
                            <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-lg uppercase tracking-wider whitespace-nowrap">📅 {p.tahun_pelaksanaan}</span>
                            <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-3 py-1 rounded-lg uppercase tracking-wider whitespace-nowrap">⏰ {p.waktu_pelaksanaan || "-"}</span>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100">
                          <p className="text-xs text-slate-600 italic leading-relaxed font-medium">"{p.deskripsi_kegiatan || 'Tidak ada uraian kegiatan.'}"</p>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-10 italic text-slate-400 font-bold uppercase text-xs tracking-widest">Belum ada riwayat pelatihan.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Not Found Sama Seperti Sebelumnya */}
        {showNotFound && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-indigo-950/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[40px] overflow-hidden shadow-2xl border-b-[10px] border-rose-500 animate-in zoom-in-95 duration-300">
              <div className="p-10 text-center">
                <div className="text-6xl mb-6 animate-bounce">🙏</div>
                <h3 className="text-2xl font-black text-indigo-950 uppercase leading-tight mb-4">Mohon Maaf</h3>
                <p className="text-slate-600 font-medium leading-relaxed mb-8">
                  Data IKM yang ditelusuri <span className="text-rose-600 font-bold">belum tercatat</span> pada Sistem IKM Juara.
                </p>
                <div className="flex flex-col gap-3">
                  <Link href="/#form-pendaftaran" className="bg-emerald-500 hover:bg-emerald-600 text-white p-5 rounded-2xl font-black uppercase tracking-wide transition-all shadow-lg active:scale-95 text-sm text-center">📝 Ajukan Menjadi IKM Binaan</Link>
                  <button onClick={() => setShowNotFound(false)} className="text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-rose-500 transition-colors">Coba NIK/NIB Lain</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="py-10 text-center border-t border-slate-100 bg-slate-50/50">
        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">IKM JUARA SYSTEM V2.0</p>
      </footer>
    </div>
  )
}