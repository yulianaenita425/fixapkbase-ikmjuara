"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"

interface IKMData {
  id: string
  no_nib: string
  no_nik: string
  nama: string
  nama_lengkap: string
  usaha: string
  nama_usaha: string
  alamat: string
  hp: string
  no_hp: string
}

export default function LayananIKMJuara() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<IKMData[]>([])
  const [selectedIKM, setSelectedIKM] = useState<IKMData | null>(null)
  const [jenisLayanan, setJenisLayanan] = useState("")
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    nomor_dokumen: "",
    link_dokumen: "",
    link_tambahan: "",
    status_sertifikat: "Proses",
    tahun_fasilitasi: new Date().getFullYear().toString(),
    tanggal_uji: ""
  })

  const handleSearchIKM = async () => {
    if (searchQuery.length < 3) {
      alert("Masukkan minimal 3 karakter untuk mencari")
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from("ikm_binaan")
      .select("*")
      .or(`nama.ilike.%${searchQuery}%,nama_lengkap.ilike.%${searchQuery}%,no_nib.ilike.%${searchQuery}%,nib.ilike.%${searchQuery}%`)
      .eq("is_deleted", false)
      .limit(10)

    if (error) {
      alert("Gagal mencari data: " + error.message)
    } else {
      setSearchResults((data as IKMData[]) || [])
    }
    setLoading(false)
  }

  const handleResetSearch = () => {
    setSearchQuery("")
    setSearchResults([])
    setSelectedIKM(null)
    setJenisLayanan("")
  }

  const handleSaveLayanan = async () => {
    if (!selectedIKM || !jenisLayanan) return
    
    const { error } = await supabase.from("layanan_ikm_juara").insert([{
      ikm_id: selectedIKM.id,
      jenis_layanan: jenisLayanan,
      nomor_dokumen: formData.nomor_dokumen,
      link_dokumen: formData.link_dokumen,
      link_tambahan: formData.link_tambahan,
      status_sertifikat: jenisLayanan === "Pendaftaran HKI Merek" ? formData.status_sertifikat : null,
      tahun_fasilitasi: parseInt(formData.tahun_fasilitasi) || 0,
      tanggal_uji: formData.tanggal_uji || null
    }])

    if (!error) {
      alert("Data Layanan Berhasil Disimpan! ✅")
      handleResetSearch()
    } else {
      alert("Error: " + error.message)
    }
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen text-slate-800 font-sans">
      <h1 className="text-3xl font-black text-blue-900 mb-8 uppercase italic tracking-tighter">
        🚀 Layanan IKM Juara
      </h1>

      {/* STEP 1: PENCARIAN */}
      <div className="bg-white p-6 rounded-3xl shadow-xl mb-6 border-t-4 border-blue-600">
        <label className="block text-sm font-bold mb-2">Langkah 1: Cari Data IKM Binaan</label>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Ketik NIB / NIK / Nama..." 
            className="flex-1 border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button onClick={handleSearchIKM} disabled={loading} className="bg-blue-600 text-white px-8 rounded-2xl font-bold shadow-lg disabled:bg-slate-300">
            {loading ? "..." : "Cari"}
          </button>
          <button onClick={handleResetSearch} className="bg-slate-200 text-slate-600 px-6 rounded-2xl font-bold hover:bg-slate-300">
            Reset
          </button>
        </div>

        {searchResults.length > 0 && !selectedIKM && (
          <div className="mt-6 space-y-3">
            {searchResults.map((item) => (
              <div key={item.id} className="p-5 border rounded-2xl bg-slate-50 flex justify-between items-center hover:border-blue-400 transition-all shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-sm">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase block">Pemilik / Usaha</span>
                    <p className="font-black">{item.nama || item.nama_lengkap || "-"} <span className="font-normal text-slate-500">({item.usaha || item.nama_usaha || "-"})</span></p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">NIB: {item.no_nib || "-"}</p>
                    <p className="text-xs text-slate-500">NIK: {item.no_nik || "-"}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedIKM(item)} className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold text-xs">Gunakan Data</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* STEP 2: FORM DINAMIS */}
      {selectedIKM && (
        <div className="bg-white p-8 rounded-3xl shadow-xl border-t-4 border-green-500">
          <div className="mb-6 p-5 bg-green-50 rounded-2xl flex justify-between items-center border border-green-100">
            <div>
              <p className="text-[10px] font-black text-green-600 uppercase tracking-widest text-xs">IKM Terpilih</p>
              <h2 className="font-black text-xl text-slate-800">{selectedIKM.nama || selectedIKM.nama_lengkap}</h2>
            </div>
            <button onClick={() => setSelectedIKM(null)} className="text-red-500 font-bold text-sm bg-white px-4 py-2 rounded-lg border border-red-100">Ganti IKM</button>
          </div>

          <label className="block text-sm font-bold mb-2">Langkah 2: Pilih Jenis Layanan</label>
          <select 
            className="w-full border p-4 rounded-2xl mb-8 bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-blue-500 border-slate-200"
            value={jenisLayanan}
            onChange={(e) => setJenisLayanan(e.target.value)}
          >
            <option value="">-- Pilih Layanan --</option>
            <option>Pendaftaran HKI Merek</option>
            <option>Pendaftaran Sertifikat Halal</option>
            <option>Pendaftaran TKDN IK</option>
            <option>Pendaftaran dan Pendampingan SIINas</option>
            <option>Pendaftaran Uji Nilai Gizi</option>
            <option>Pendaftaran Kurasi Produk</option>
          </select>

          {jenisLayanan && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/30">
              
              {/* a. Pendaftaran HKI Merek */}
              {jenisLayanan === "Pendaftaran HKI Merek" && (
                <>
                  <InputCol label="Nomor Pendaftaran HKI Merek" value={formData.nomor_dokumen} onChange={(v) => setFormData({...formData, nomor_dokumen: v})} />
                  <InputCol label="Link Bukti Daftar HKI (Drive)" value={formData.link_tambahan} onChange={(v) => setFormData({...formData, link_tambahan: v})} />
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 ml-2 block">Sertifikat Merek</label>
                    <select className="w-full border p-3 rounded-xl bg-white border-slate-200" value={formData.status_sertifikat} onChange={(e) => setFormData({...formData, status_sertifikat: e.target.value})}>
                      <option>Telah Didaftar</option><option>Proses</option><option>Ditolak</option>
                    </select>
                  </div>
                  <InputCol label="Tahun Fasilitasi" type="number" value={formData.tahun_fasilitasi} onChange={(v) => setFormData({...formData, tahun_fasilitasi: v})} />
                  <InputCol label="Link Sertifikat HKI Merek (Drive)" className="md:col-span-2" value={formData.link_dokumen} onChange={(v) => setFormData({...formData, link_dokumen: v})} />
                </>
              )}

              {/* b. Pendaftaran Sertifikat Halal */}
              {jenisLayanan === "Pendaftaran Sertifikat Halal" && (
                <>
                  <InputCol label="Nomor Sertifikat Halal" value={formData.nomor_dokumen} onChange={(v) => setFormData({...formData, nomor_dokumen: v})} />
                  <InputCol label="Link Sertifikat Halal (Drive)" value={formData.link_dokumen} onChange={(v) => setFormData({...formData, link_dokumen: v})} />
                  <InputCol label="Logo Halal (Drive)" value={formData.link_tambahan} onChange={(v) => setFormData({...formData, link_tambahan: v})} />
                  <InputCol label="Tahun Fasilitasi" type="number" value={formData.tahun_fasilitasi} onChange={(v) => setFormData({...formData, tahun_fasilitasi: v})} />
                </>
              )}

              {/* c. Pendaftaran TKDN IK */}
              {jenisLayanan === "Pendaftaran TKDN IK" && (
                <>
                  <InputCol label="Nomor Sertifikat TKDN IK" value={formData.nomor_dokumen} onChange={(v) => setFormData({...formData, nomor_dokumen: v})} />
                  <InputCol label="Link Sertifikat TKDN IK (Drive)" value={formData.link_dokumen} onChange={(v) => setFormData({...formData, link_dokumen: v})} />
                  <InputCol label="Tahun Terbit Sertifikat" type="number" value={formData.tahun_fasilitasi} onChange={(v) => setFormData({...formData, tahun_fasilitasi: v})} />
                </>
              )}

              {/* d. Pendaftaran SIINas */}
              {jenisLayanan === "Pendaftaran dan Pendampingan SIINas" && (
                <>
                  <InputCol label="Nomor Bukti Kepemilikan Akun SIINas" value={formData.nomor_dokumen} onChange={(v) => setFormData({...formData, nomor_dokumen: v})} />
                  <InputCol label="Tahun Registrasi SIINas" type="number" value={formData.tahun_fasilitasi} onChange={(v) => setFormData({...formData, tahun_fasilitasi: v})} />
                  <InputCol label="Link Bukti Kepemilikan Akun (Drive)" className="md:col-span-2" value={formData.link_dokumen} onChange={(v) => setFormData({...formData, link_dokumen: v})} />
                </>
              )}

              {/* e. Uji Nilai Gizi */}
              {jenisLayanan === "Pendaftaran Uji Nilai Gizi" && (
                <>
                  <InputCol label="Nomor LHU Nilai Gizi" value={formData.nomor_dokumen} onChange={(v) => setFormData({...formData, nomor_dokumen: v})} />
                  <InputCol label="Tanggal Hasil Uji" type="date" value={formData.tanggal_uji} onChange={(v) => setFormData({...formData, tanggal_uji: v})} />
                  <InputCol label="Tahun Fasilitasi" type="number" value={formData.tahun_fasilitasi} onChange={(v) => setFormData({...formData, tahun_fasilitasi: v})} />
                  <InputCol label="Link LHU Nilai Gizi (Drive)" value={formData.link_dokumen} onChange={(v) => setFormData({...formData, link_dokumen: v})} />
                </>
              )}

              {/* f. Kurasi Produk */}
              {jenisLayanan === "Pendaftaran Kurasi Produk" && (
                <>
                  <InputCol label="Nomor Sertifikat Kurasi" value={formData.nomor_dokumen} onChange={(v) => setFormData({...formData, nomor_dokumen: v})} />
                  <InputCol label="Link Sertifikat Kurasi (Drive)" value={formData.link_dokumen} onChange={(v) => setFormData({...formData, link_dokumen: v})} />
                  <InputCol label="Tahun Kurasi" type="number" value={formData.tahun_fasilitasi} onChange={(v) => setFormData({...formData, tahun_fasilitasi: v})} />
                </>
              )}

              <button onClick={handleSaveLayanan} className="md:col-span-2 bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all">
                💾 SIMPAN DATA LAYANAN
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function InputCol({ label, value, onChange, type = "text", className = "" }: {
  label: string, value: string, onChange: (v: string) => void, type?: string, className?: string
}) {
  return (
    <div className={className}>
      <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
    </div>
  )
}