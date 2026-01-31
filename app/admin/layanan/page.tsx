"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"

// Definisi Tipe agar TypeScript tidak komplain
interface IKMData {
  id: string
  no_nib: string
  no_nik: string
  nama: string
  usaha: string
}

export default function LayananIKMJuara() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<IKMData[]>([])
  const [selectedIKM, setSelectedIKM] = useState<IKMData | null>(null)
  const [jenisLayanan, setJenisLayanan] = useState("")
  const [loading, setLoading] = useState(false)
  
  // State form dengan tipe data yang jelas
  const [formData, setFormData] = useState({
    nomor_dokumen: "",
    link_dokumen: "",
    link_tambahan: "",
    status_sertifikat: "Proses",
    tahun_fasilitasi: new Date().getFullYear().toString(),
    tanggal_uji: ""
  })

  // 1. Fungsi Cari IKM Binaan
  const handleSearchIKM = async () => {
    if (searchQuery.length < 3) {
      alert("Masukkan minimal 3 karakter (Nama/NIB/NIK)")
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from("ikm_binaan")
      .select("id, no_nib, no_nik, nama, usaha")
      .or(`nama.ilike.%${searchQuery}%,no_nib.ilike.%${searchQuery}%,no_nik.ilike.%${searchQuery}%`)
      .eq("is_deleted", false)
      .limit(5)

    if (error) {
      console.error(error)
      alert("Gagal mencari data")
    } else {
      setSearchResults((data as IKMData[]) || [])
    }
    setLoading(false)
  }

  // 2. Simpan Data Layanan
  const handleSaveLayanan = async () => {
    if (!selectedIKM || !jenisLayanan) {
      alert("Pilih IKM dan Jenis Layanan terlebih dahulu!")
      return
    }

    const { error } = await supabase.from("layanan_ikm_juara").insert([{
      ikm_id: selectedIKM.id,
      jenis_layanan: jenisLayanan,
      nomor_dokumen: formData.nomor_dokumen,
      link_dokumen: formData.link_dokumen,
      link_tambahan: formData.link_tambahan,
      status_sertifikat: jenisLayanan === "Pendaftaran HKI Merek" ? formData.status_sertifikat : null,
      tahun_fasilitasi: parseInt(formData.tahun_fasilitasi),
      tanggal_uji: formData.tanggal_uji || null
    }])

    if (error) {
      alert("Gagal menyimpan: " + error.message)
    } else {
      alert("Data Layanan Berhasil Disimpan! ✅")
      setSelectedIKM(null)
      setJenisLayanan("")
      setSearchQuery("")
      setFormData({
        nomor_dokumen: "", link_dokumen: "", link_tambahan: "",
        status_sertifikat: "Proses", tahun_fasilitasi: "2024", tanggal_uji: ""
      })
    }
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen text-slate-800 font-sans">
      <h1 className="text-3xl font-black text-blue-900 mb-8 uppercase italic tracking-tighter">
        🚀 Layanan IKM Juara
      </h1>

      {/* STEP 1: CARI IKM */}
      <div className="bg-white p-6 rounded-3xl shadow-xl mb-6 border-t-4 border-blue-600">
        <label className="block text-sm font-bold mb-2">Langkah 1: Cari Data IKM Binaan</label>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Cari NIB / NIK / Nama..." 
            className="flex-1 border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button 
            onClick={handleSearchIKM} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-xl font-bold disabled:bg-slate-300"
          >
            {loading ? "Mencari..." : "Cari"}
          </button>
        </div>

        {searchResults.length > 0 && !selectedIKM && (
          <div className="mt-4 border rounded-xl divide-y bg-slate-50 overflow-hidden shadow-inner">
            {searchResults.map((item) => (
              <div key={item.id} className="p-3 flex justify-between items-center hover:bg-blue-50">
                <div>
                  <div className="font-bold">{item.nama} <span className="text-blue-600 text-xs">({item.usaha})</span></div>
                  <div className="text-xs text-slate-500 font-mono">NIB: {item.no_nib} | NIK: {item.no_nik}</div>
                </div>
                <button 
                  onClick={() => setSelectedIKM(item)}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs px-4 py-2 rounded-lg font-bold transition-colors"
                >Gunakan Data</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* STEP 2: PILIH LAYANAN & INPUT DATA */}
      {selectedIKM && (
        <div className="bg-white p-8 rounded-3xl shadow-xl border-t-4 border-green-500 transition-all">
          <div className="mb-6 p-4 bg-green-50 rounded-2xl flex justify-between items-center border border-green-100">
            <div>
              <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">IKM Terpilih</p>
              <p className="font-black text-lg text-slate-800">{selectedIKM.nama} <span className="text-slate-400 font-normal">| {selectedIKM.usaha}</span></p>
            </div>
            <button onClick={() => setSelectedIKM(null)} className="text-red-500 font-bold text-sm hover:underline">Ganti IKM</button>
          </div>

          <label className="block text-sm font-bold mb-2 text-slate-600">Langkah 2: Pilih Jenis Layanan</label>
          <select 
            className="w-full border p-4 rounded-2xl mb-6 bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-blue-500 border-slate-200"
            value={jenisLayanan}
            onChange={(e) => setJenisLayanan(e.target.value)}
          >
            <option value="">-- Klik untuk memilih layanan --</option>
            <option>Pendaftaran HKI Merek</option>
            <option>Pendaftaran Sertifikat Halal</option>
            <option>Pendaftaran TKDN IK</option>
            <option>Pendaftaran dan Pendampingan SIINas</option>
            <option>Pendaftaran Uji Nilai Gizi</option>
            <option>Pendaftaran Kurasi Produk</option>
          </select>

          {jenisLayanan && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
              
              {jenisLayanan === "Pendaftaran HKI Merek" && (
                <>
                  <InputCol label="Nomor Pendaftaran HKI Merek" value={formData.nomor_dokumen} onChange={(v) => setFormData({...formData, nomor_dokumen: v})} />
                  <InputCol label="Link Bukti Daftar HKI (Drive)" value={formData.link_tambahan} onChange={(v) => setFormData({...formData, link_tambahan: v})} />
                  <div className="flex flex-col">
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 ml-2">Sertifikat Merek</label>
                    <select className="w-full border p-3 rounded-xl bg-white border-slate-200" value={formData.status_sertifikat} onChange={(e) => setFormData({...formData, status_sertifikat: e.target.value})}>
                      <option>Telah Didaftar</option><option>Proses</option><option>Ditolak</option>
                    </select>
                  </div>
                  <InputCol label="Tahun Fasilitasi" type="number" value={formData.tahun_fasilitasi} onChange={(v) => setFormData({...formData, tahun_fasilitasi: v})} />
                  <InputCol label="Link Sertifikat HKI Merek (Drive)" className="md:col-span-2" value={formData.link_dokumen} onChange={(v) => setFormData({...formData, link_dokumen: v})} />
                </>
              )}

              {jenisLayanan === "Pendaftaran Sertifikat Halal" && (
                <>
                  <InputCol label="Nomor Sertifikat Halal" value={formData.nomor_dokumen} onChange={(v) => setFormData({...formData, nomor_dokumen: v})} />
                  <InputCol label="Tahun Fasilitasi" type="number" value={formData.tahun_fasilitasi} onChange={(v) => setFormData({...formData, tahun_fasilitasi: v})} />
                  <InputCol label="Link Sertifikat Halal (Drive)" value={formData.link_dokumen} onChange={(v) => setFormData({...formData, link_dokumen: v})} />
                  <InputCol label="Link Logo Halal (Drive)" value={formData.link_tambahan} onChange={(v) => setFormData({...formData, link_tambahan: v})} />
                </>
              )}

              {jenisLayanan === "Pendaftaran TKDN IK" && (
                <>
                  <InputCol label="Nomor Sertifikat TKDN IK" value={formData.nomor_dokumen} onChange={(v) => setFormData({...formData, nomor_dokumen: v})} />
                  <InputCol label="Tahun Terbit Sertifikat" type="number" value={formData.tahun_fasilitasi} onChange={(v) => setFormData({...formData, tahun_fasilitasi: v})} />
                  <InputCol label="Link Sertifikat TKDN IK (Drive)" className="md:col-span-2" value={formData.link_dokumen} onChange={(v) => setFormData({...formData, link_dokumen: v})} />
                </>
              )}

              {jenisLayanan === "Pendaftaran dan Pendampingan SIINas" && (
                <>
                  <InputCol label="Nomor Bukti Kepemilikan Akun SIINas" value={formData.nomor_dokumen} onChange={(v) => setFormData({...formData, nomor_dokumen: v})} />
                  <InputCol label="Tahun Registrasi SIINas" type="number" value={formData.tahun_fasilitasi} onChange={(v) => setFormData({...formData, tahun_fasilitasi: v})} />
                  <InputCol label="Link Bukti Kepemilikan Akun (Drive)" className="md:col-span-2" value={formData.link_dokumen} onChange={(v) => setFormData({...formData, link_dokumen: v})} />
                </>
              )}

              {jenisLayanan === "Pendaftaran Uji Nilai Gizi" && (
                <>
                  <InputCol label="Nomor LHU Nilai Gizi" value={formData.nomor_dokumen} onChange={(v) => setFormData({...formData, nomor_dokumen: v})} />
                  <InputCol label="Tanggal Hasil Uji" type="date" value={formData.tanggal_uji} onChange={(v) => setFormData({...formData, tanggal_uji: v})} />
                  <InputCol label="Tahun Fasilitasi" type="number" value={formData.tahun_fasilitasi} onChange={(v) => setFormData({...formData, tahun_fasilitasi: v})} />
                  <InputCol label="Link LHU Nilai Gizi (Drive)" value={formData.link_dokumen} onChange={(v) => setFormData({...formData, link_dokumen: v})} />
                </>
              )}

              {jenisLayanan === "Pendaftaran Kurasi Produk" && (
                <>
                  <InputCol label="Nomor Sertifikat Kurasi" value={formData.nomor_dokumen} onChange={(v) => setFormData({...formData, nomor_dokumen: v})} />
                  <InputCol label="Tahun Kurasi" type="number" value={formData.tahun_fasilitasi} onChange={(v) => setFormData({...formData, tahun_fasilitasi: v})} />
                  <InputCol label="Link Sertifikat Kurasi (Drive)" className="md:col-span-2" value={formData.link_dokumen} onChange={(v) => setFormData({...formData, link_dokumen: v})} />
                </>
              )}

              <button 
                onClick={handleSaveLayanan}
                className="md:col-span-2 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl font-black text-lg shadow-xl transition-all active:scale-95"
              >
                💾 SIMPAN DATA LAYANAN
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Sub-komponen Input untuk membuang error TypeScript
function InputCol({ label, value, onChange, type = "text", className = "" }: {
  label: string, value: string, onChange: (v: string) => void, type?: string, className?: string
}) {
  return (
    <div className={className}>
      <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">{label}</label>
      <input 
        type={type}
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-400 bg-white"
      />
    </div>
  )
}