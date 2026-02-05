"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Lottie from "lottie-react";
import { 
  ShieldCheck, TrendingUp, Globe, Award, 
  MessageCircle, ArrowRight, User, Hash, 
  ShoppingBag, MapPin, Briefcase, CheckCircle2, Volume2,
  Check, Star, Rocket, Zap
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient'; 
import { useNotification } from './hooks/useNotification';

// Definisi Tipe untuk Pelatihan
interface Pelatihan {
  nama: string;
  jadwal: string;
  kuota: number;
  deskripsi: string;
}

export default function IKMJuaraFullPage() {
  const { toast, showNotification } = useNotification();
  const [showModal, setShowModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [animationData, setAnimationData] = useState(null);
  const [layanan, setLayanan] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // --- STATE DATA ---
  const [daftarPelatihan, setDaftarPelatihan] = useState<Pelatihan[]>([]);
  const [layananDetail, setLayananDetail] = useState<Pelatihan | null>(null);
  const [isLoadingPelatihan, setIsLoadingPelatihan] = useState(false);
  const [showPelatihanList, setShowPelatihanList] = useState(false);
  const [loadingTamu, setLoadingTamu] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- FETCH DATA PELATIHAN ---
  useEffect(() => {
    const fetchPelatihan = async () => {
      setIsLoadingPelatihan(true);
      try {
        const { data, error } = await supabase
          .from('kegiatan_2026') 
          .select('nama, jadwal, kuota, deskripsi'); 

        if (error) throw error;
        if (data) setDaftarPelatihan(data);
      } catch (error: any) {
        console.error("Error fetching pelatihan:", error.message);
      } finally {
        setIsLoadingPelatihan(false);
      }
    };
    fetchPelatihan();
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    fetch("https://lottie.host/7604f378-62a2-463f-9e6b-73010b991823/K0S9Vv3u9y.json")
      .then((res) => res.json())
      .then((data) => setAnimationData(data));
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePendaftaran = async (formData: FormData) => {
    setIsSubmitting(true);
    const subPelatihanSelected = formData.get("sub_pelatihan") as string;

    const rawData = {
      nama_lengkap: formData.get("nama"),
      no_hp: formData.get("hp"),
      no_nib: formData.get("nib"),
      nik: formData.get("nik"),
      nama_usaha: formData.get("nama_usaha"),
      produk_utama: formData.get("produk"),
      alamat_usaha: formData.get("alamat"),
      layanan_prioritas: formData.get("layanan"),
      sub_pelatihan: subPelatihanSelected || null,
    };

    try {
      // 1. Simpan Data Pendaftaran
      const { error: insertError } = await supabase.from("ikm_register").insert([rawData]);
      if (insertError) throw insertError;

      showNotification("PENDAFTARAN BERHASIL DISIMPAN!"); 
      setTimeout(() => { window.location.reload(); }, 2000);
    } catch (error: any) {
      console.error(error);
      alert("Gagal menyimpan: " + (error.message || "Terjadi kesalahan koneksi"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateInput = (name: string, value: string) => {
    if (name === 'nib' && value.length !== 13) return "NIB harus 13 digit.";
    if (name === 'nik' && value.length !== 16) return "NIK harus 16 digit.";
    if (['nib', 'nik', 'hp', 'whatsapp'].includes(name) && !/^\d+$/.test(value)) return "Wajib angka.";
    return "";
  };

  const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numericValue = value.replace(/\D/g, '');
    e.target.value = numericValue;
    const errorMsg = validateInput(name, numericValue);
    setErrors(prev => ({ ...prev, [name]: errorMsg }));
  };

  const handleLayananChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setLayanan(val);
    setShowPelatihanList(val === "Pelatihan Pemberdayaan IKM");
    if (val !== "Pelatihan Pemberdayaan IKM") setLayananDetail(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] overflow-x-hidden text-[#1A1A40]">
      {toast?.show && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[300] animate-scaleIn">
          <div className="bg-[#1A1A40] text-white px-8 py-4 rounded-2xl shadow-2xl border-2 border-indigo-500 flex items-center gap-4">
            <div className="bg-green-500 p-1 rounded-full animate-pulse">
              <CheckCircle2 size={20} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-black uppercase tracking-widest text-[10px] text-indigo-300">System Notification</span>
              <span className="font-bold text-sm">{toast.msg}</span>
            </div>
            <Volume2 size={16} className="text-slate-500 ml-2 animate-bounce" />
          </div>
        </div>
      )}

      <nav className={`fixed w-full z-[100] transition-all duration-500 ${scrolled ? "py-3 bg-[#1A1A40]/90 backdrop-blur-xl shadow-2xl" : "py-6 bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="bg-white p-1.5 rounded-xl shadow-lg group-hover:rotate-12 transition-transform">
              <Image src="/Laura joss.png" alt="Logo" width={32} height={32} />
            </div>
            <span className={`font-black text-2xl tracking-tighter transition-colors ${scrolled ? "text-white" : "text-[#1A1A40]"}`}>
              IKM <span className="text-yellow-400">JUARA</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#profil" className={`font-bold text-sm tracking-widest hover:text-yellow-400 transition ${scrolled ? "text-slate-300" : "text-[#1A1A40]/70"}`}>PROFIL</a>
            <a href="#form-pendaftaran" className={`font-bold text-sm tracking-widest hover:text-yellow-400 transition ${scrolled ? "text-slate-300" : "text-[#1A1A40]/70"}`}>PENDAFTARAN</a>
            <button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2.5 rounded-full text-white font-bold text-sm shadow-lg hover:scale-105 active:scale-95 transition-all">AKSES DATA IKM</button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center pt-20">
        <div className="absolute top-0 right-0 w-[50%] h-[80%] bg-gradient-to-bl from-indigo-100/50 to-transparent rounded-bl-[200px] -z-10" />
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-slate-100 mb-6 animate-bounce-slow">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 font-mono">System Active: IKM JUARA v2.0</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black leading-[1.1] mb-8 text-[#1A1A40]">Akselerasi Industri <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-red-500">Lokal ke Global.</span></h1>
            <div className="flex items-center gap-4 mb-10 p-4 bg-white/50 backdrop-blur rounded-2xl border border-white max-w-sm">
                <div className="w-16 h-16">{animationData && <Lottie animationData={animationData} loop={true} />}</div>
                <p className="text-sm font-semibold text-slate-600 italic">"Mendorong efisiensi dan jaminan usaha industri Kota Madiun."</p>
            </div>
            <a href="#form-pendaftaran" className="inline-flex px-10 py-5 bg-[#1A1A40] text-white rounded-2xl font-bold shadow-xl hover:-translate-y-1 transition-all items-center gap-3">MULAI DAFTAR SEKARANG <ArrowRight size={20}/></a>
          </div>
          <div className="relative flex justify-center items-center">
            <div className="absolute w-[120%] h-[120%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="relative z-10 p-6 bg-white rounded-[4rem] shadow-2xl border-4 border-white transform transition-transform hover:scale-[1.02]">
              <Image src="/Laura joss.png" alt="Logo IKM JUARA" width={450} height={450} className="rounded-[3rem]" />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION PROFIL (BARU DITAMBAHKAN) */}
      <section id="profil" className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-sm font-black text-indigo-600 tracking-[0.3em] uppercase mb-4">Profil Program</h2>
            <h3 className="text-4xl lg:text-5xl font-black text-[#1A1A40] leading-tight">
              IKM <span className="text-indigo-600">JUARA</span>
            </h3>
            <div className="w-24 h-2 bg-yellow-400 mx-auto mt-6 rounded-full"></div>
            <p className="mt-8 text-xl font-bold italic text-slate-500 max-w-3xl mx-auto">
              "IKM JUARA – Dari Lokal Berkarya, ke Global Berdaya!"
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <p className="text-lg leading-relaxed text-slate-600 font-medium">
                Kota Madiun terus meneguhkan posisinya sebagai kota yang ramah terhadap pertumbuhan industri kecil dan menengah. Melalui program <span className="font-bold text-[#1A1A40]">IKM JUARA</span>, pemerintah menghadirkan layanan klinik konsultasi industri terintegrasi yang menjadi mitra strategis para pelaku IKM untuk naik kelas dan bersaing di pasar global.
              </p>
              <p className="text-lg leading-relaxed text-slate-600 font-medium italic border-l-4 border-indigo-600 pl-6 bg-slate-50 py-4 rounded-r-2xl">
                Integrasi Konsultasi Mandiri untuk Jaminan Usaha, Akselerasi, dan Produktivitas Industri Anda!
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
                {[
                  { icon: <ShieldCheck className="text-green-500" />, text: "Legalitas Terjamin" },
                  { icon: <TrendingUp className="text-blue-500" />, text: "Akselerasi Bisnis" },
                  { icon: <Globe className="text-purple-500" />, text: "Orientasi Global" },
                  { icon: <Award className="text-yellow-500" />, text: "Kualitas Juara" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:shadow-md transition-all">
                    {item.icon}
                    <span className="font-black text-xs uppercase tracking-wider">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#1A1A40] p-10 rounded-[3rem] text-white shadow-3xl relative">
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-yellow-400 rounded-2xl rotate-12 flex items-center justify-center shadow-xl">
                <Star size={40} className="text-[#1A1A40] animate-pulse" />
              </div>
              <h4 className="text-2xl font-black mb-8 border-b border-white/10 pb-4">Layanan Terpadu Kami:</h4>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="mt-1"><Rocket size={20} className="text-indigo-400" /></div>
                  <p className="text-sm leading-relaxed"><span className="font-bold text-indigo-300">Pendampingan Legalitas:</span> Perlindungan usaha secara menyeluruh dan bantuan sertifikasi produk.</p>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1"><Zap size={20} className="text-yellow-400" /></div>
                  <p className="text-sm leading-relaxed"><span className="font-bold text-yellow-300">Produktivitas & Efisiensi:</span> Optimalisasi proses produksi melalui inovasi teknologi dan manajemen modern.</p>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1"><Award size={20} className="text-green-400" /></div>
                  <p className="text-sm leading-relaxed"><span className="font-bold text-green-300">Penguatan Daya Saing:</span> Branding, desain kreatif, serta akses pasar digital hingga kancah internasional.</p>
                </li>
              </ul>
              <div className="mt-10 p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-xs italic text-slate-300 leading-relaxed">
                  Didukung oleh tenaga ahli dan fasilitator berpengalaman untuk mendorong pelaku usaha menjadi lebih mandiri dan kompetitif.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FORM PENDAFTARAN */}
      <section id="form-pendaftaran" className="py-24 px-6 bg-[#1A1A40]">
        <div className="max-w-4xl mx-auto bg-white rounded-[3rem] shadow-3xl overflow-hidden border-[12px] border-white/10">
          <div className="p-10 bg-slate-50 border-b text-center">
            <div className="inline-block p-4 bg-indigo-600 text-white rounded-2xl mb-4 shadow-xl shadow-indigo-200"><Briefcase size={32} /></div>
            <h2 className="text-3xl font-black text-[#1A1A40] uppercase tracking-tighter">Formulir Pendaftaran Binaan</h2>
            <p className="text-slate-500 font-bold mt-2 italic">Lengkapi data untuk mengakselerasi bisnis Anda</p>
          </div>

          <form action={handlePendaftaran} className="p-10 space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><User size={14}/> Nama Lengkap</label>
                <input name="nama" type="text" required className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none font-bold transition-all shadow-inner" placeholder="Sesuai KTP" />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Hash size={14}/> No. WhatsApp</label>
                <input name="hp" type="text" onChange={handleNumericInput} required className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none font-bold transition-all shadow-inner" placeholder="08..." />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">No. NIB (13 Digit)</label>
                <input name="nib" type="text" maxLength={13} onChange={handleNumericInput} required className={`w-full p-4 bg-slate-50 border-2 ${errors.nib ? 'border-red-500' : 'border-transparent focus:border-indigo-600'} rounded-2xl outline-none font-bold transition-all shadow-inner`} placeholder="Input 13 Angka" />
                {errors.nib && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest">{errors.nib}</p>}
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">No. NIK (16 Digit)</label>
                <input name="nik" type="text" maxLength={16} onChange={handleNumericInput} required className={`w-full p-4 bg-slate-50 border-2 ${errors.nik ? 'border-red-500' : 'border-transparent focus:border-indigo-600'} rounded-2xl outline-none font-bold transition-all shadow-inner`} placeholder="Input 16 Angka" />
                {errors.nik && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest">{errors.nik}</p>}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Nama Usaha</label>
                <input name="nama_usaha" type="text" required className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none font-bold transition-all shadow-inner" />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 italic">Produk Utama</label>
                <input name="produk" type="text" required className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none font-bold transition-all shadow-inner" placeholder="Contoh: Sambal Pecel" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><MapPin size={14}/> Alamat Usaha Lengkap</label>
              <textarea name="alamat" rows={2} required className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none font-bold transition-all shadow-inner"></textarea>
            </div>

            <div className="space-y-3 pt-6 border-t border-slate-100">
              <label className="text-xs font-black uppercase tracking-widest text-indigo-600">Layanan yang Diperlukan</label>
              <select name="layanan" onChange={handleLayananChange} required className="w-full p-5 bg-indigo-50 border-2 border-indigo-100 rounded-2xl outline-none font-black text-indigo-900 appearance-none cursor-pointer">
                <option value="">-- Pilih Layanan Utama --</option>
                <option value="Pendaftaran HKI Merek">Pendaftaran HKI Merek</option>
                <option value="Pendaftaran Sertifikat Halal">Pendaftaran Sertifikat Halal</option>
                <option value="Pendaftaran TKDN IK">Pendaftaran TKDN IK</option>
                <option value="Pendaftaran dan Pendampingan SIINas">Pendaftaran dan Pendampingan SIINas</option>
                <option value="Pendaftaran Uji Nilai Gizi">Pendaftaran Uji Nilai Gizi</option>
                <option value="Kurasi Produk">Kurasi Produk</option>
                <option value="Pelatihan Pemberdayaan IKM">Pelatihan Pemberdayaan IKM</option>
              </select>
            </div>

            {showPelatihanList && (
              <div className="p-6 bg-orange-50 border-2 border-orange-100 rounded-[2rem] animate-scaleIn space-y-4">
                <label className="text-xs font-black uppercase tracking-widest text-orange-700 mb-1 block italic text-center">
                  {isLoadingPelatihan ? "Memuat Daftar Pelatihan..." : "Detail Pelatihan Tersedia (Tahun 2026)"}
                </label>
                
                <select 
                  name="sub_pelatihan" 
                  required 
                  className="w-full p-4 bg-white border-2 border-orange-200 rounded-2xl outline-none font-bold text-orange-900 shadow-sm"
                  disabled={isLoadingPelatihan}
                  onChange={(e) => {
                    const selected = daftarPelatihan.find(p => p.nama === e.target.value);
                    setLayananDetail(selected || null);
                  }}
                >
                  <option value="">
                    {isLoadingPelatihan ? "-- Mohon Tunggu --" : "-- Pilih Jenis Pelatihan --"}
                  </option>
                  
                  {daftarPelatihan.map((p, i) => (
                    <option key={i} value={p.nama} disabled={p.kuota <= 0}>
                      {p.nama} — (Jadwal: {p.jadwal}) — [{p.kuota > 0 ? `Sisa Kuota: ${p.kuota}` : 'KUOTA PENUH'}]
                    </option>
                  ))}
                </select>

                {layananDetail && (
                  <div className="mt-4 p-4 bg-white/50 rounded-xl border border-orange-200 animate-scaleIn">
                    <h4 className="text-[10px] font-black text-orange-800 uppercase tracking-widest mb-1">Deskripsi Kegiatan:</h4>
                    <p className="text-xs text-orange-700 leading-relaxed italic mb-3">
                      {layananDetail.deskripsi || "Tidak ada deskripsi tersedia."}
                    </p>
                    <div className="flex gap-3">
                      <span className="text-[9px] bg-orange-200 px-2 py-1 rounded font-bold text-orange-800 uppercase">Jadwal: {layananDetail.jadwal}</span>
                      <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase ${layananDetail.kuota > 0 ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                        Kuota: {layananDetail.kuota}
                      </span>
                    </div>
                  </div>
                )}

                {!isLoadingPelatihan && daftarPelatihan.length === 0 && (
                  <p className="text-[10px] text-orange-600 mt-2 text-center uppercase font-bold">
                    Belum ada jadwal pelatihan tersedia di database.
                  </p>
                )}
              </div>
            )}

            <button type="submit" disabled={Object.values(errors).some(e => e !== "") || !layanan || isSubmitting} className="w-full py-6 bg-[#1A1A40] text-white rounded-[2rem] font-black tracking-[0.2em] shadow-2xl hover:bg-indigo-600 hover:-translate-y-1 disabled:bg-slate-300 transition-all uppercase">
              {isSubmitting ? "Sedang Mengirim..." : "Kirim Data Binaan & Daftar JUARA"}
            </button>
          </form>
        </div>
      </section>

      {/* MODAL BUKU TAMU */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#1A1A40]/40 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-3xl p-10 relative animate-scaleIn">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-8 text-slate-400 hover:text-[#1A1A40] font-black text-2xl">×</button>
            <div className="text-center mb-8">
              <h3 className="text-3xl font-black italic uppercase tracking-tighter">Buku Tamu</h3>
              <p className="text-slate-500 text-sm font-bold mt-2">Identitas Pengakses Sistem IKM JUARA</p>
            </div>
            <form onSubmit={async (e) => {
                e.preventDefault();
                setLoadingTamu(true);
                const target = e.target as any;
                const dataTamu = {
                  nama: target.nama.value,
                  whatsapp: target.whatsapp.value,
                  alamat: target.alamat.value,
                  waktu_kunjungan: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
                };
                try {
                  const { error } = await supabase.from("buku_tamu").insert([dataTamu]);
                  if (error) throw error;
                  showNotification("AKSES DATA DIBERIKAN!");
                  setTimeout(() => { window.location.href = '/pencarian'; }, 1500);
                } catch (err) {
                  window.location.href = '/pencarian';
                } finally {
                  setLoadingTamu(false);
                }
              }} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nama Pengunjung</label>
                <input name="nama" required type="text" placeholder="Nama Lengkap" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold shadow-inner focus:border-indigo-500 border-2 border-transparent transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nomor WhatsApp</label>
                <input name="whatsapp" required type="text" onChange={handleNumericInput} placeholder="0812xxxx" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold shadow-inner focus:border-indigo-500 border-2 border-transparent transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Alamat / Instansi</label>
                <textarea name="alamat" required placeholder="Contoh: Jl. Pahlawan No. 1, Kota Madiun" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold shadow-inner h-24 focus:border-indigo-500 border-2 border-transparent transition-all" />
              </div>
              <button type="submit" disabled={loadingTamu} className="w-full py-5 bg-[#1A1A40] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all disabled:bg-slate-400 flex justify-center items-center gap-2 mt-4">
                {loadingTamu ? "MENCATAT..." : "MASUK KE DATABASE IKM"}
              </button>
            </form>
          </div>
        </div>
      )}

      <footer className="py-16 text-center bg-white border-t border-slate-100">
        <blockquote className="text-slate-400 italic text-xl font-serif max-w-2xl mx-auto px-6 mb-8">
          "Dengan semangat Juara, setiap IKM di Madiun akan menjadi pelaku industri yang tak hanya tumbuh, tapi juga menginspirasi."
        </blockquote>
        <div className="flex justify-center gap-6 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
          <a href="/privacy" className="hover:text-indigo-600 transition-colors">Privacy</a>
          <span className="text-slate-200">•</span>
          <a href="/support" className="hover:text-indigo-600 transition-colors">Support</a>
        </div>
        <p className="mt-4 text-[10px] text-slate-300 font-bold uppercase tracking-widest">© 2026 E-Government Kota Madiun</p>
      </footer>

      <style jsx global>{`
        html { scroll-behavior: smooth; }
        #profil, #form-pendaftaran {
          scroll-margin-top: 100px;
        }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-bounce-slow { animation: bounce 3s infinite; }
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}