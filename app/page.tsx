"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Lottie from "lottie-react";
import { 
  ShieldCheck, TrendingUp, Globe, Award, 
  MessageCircle, ArrowRight, User, Hash, 
  ShoppingBag, MapPin, Briefcase 
} from 'lucide-react';
// @ts-ignore
import { handlePendaftaran } from './actions';

export default function IKMJuaraFullPage() {
  const [showModal, setShowModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [animationData, setAnimationData] = useState(null);
  const [layanan, setLayanan] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showPelatihanList, setShowPelatihanList] = useState(false);

  // Daftar Pelatihan Aktif 2026
  const daftarPelatihan = [
    "Pelatihan Digital Marketing IKM 2026",
    "Pelatihan Desain Kemasan Inovatif",
    "Workshop Manajemen Keuangan Industri",
    "Bimtek Standarisasi Mutu Produk"
  ];

  // Efek Navbar saat scroll & Fetch Lottie Data
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    fetch("https://lottie.host/7604f378-62a2-463f-9e6b-73010b991823/K0S9Vv3u9y.json")
      .then((res) => res.json())
      .then((data) => setAnimationData(data));

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handler Validasi Form
  const validateInput = (name: string, value: string) => {
    if (name === 'nib' && value.length !== 13) return "NIB harus 13 digit.";
    if (name === 'nik' && value.length !== 16) return "NIK harus 16 digit.";
    if ((name === 'nib' || name === 'nik' || name === 'hp') && !/^\d+$/.test(value)) return "Wajib angka.";
    return "";
  };

  const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] overflow-x-hidden text-[#1A1A40]">
      
      {/* 1. NAVIGATION */}
      <nav className={`fixed w-full z-[100] transition-all duration-500 ${
        scrolled ? "py-3 bg-[#1A1A40]/90 backdrop-blur-xl shadow-2xl" : "py-6 bg-transparent"
      }`}>
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
            <button 
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2.5 rounded-full text-white font-bold text-sm shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              AKSES DATA IKM
            </button>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative min-h-screen flex items-center pt-20">
        <div className="absolute top-0 right-0 w-[50%] h-[80%] bg-gradient-to-bl from-indigo-100/50 to-transparent rounded-bl-[200px] -z-10" />
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-slate-100 mb-6 animate-bounce-slow">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 font-mono">System Active: IKM JUARA v2.0</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black leading-[1.1] mb-8 text-[#1A1A40]">
              Akselerasi Industri <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-red-500">
                Lokal ke Global.
              </span>
            </h1>
            <div className="flex items-center gap-4 mb-10 p-4 bg-white/50 backdrop-blur rounded-2xl border border-white max-w-sm">
               <div className="w-16 h-16">
                  {animationData && <Lottie animationData={animationData} loop={true} />}
               </div>
               <p className="text-sm font-semibold text-slate-600 italic">
                 "Mendorong efisiensi dan jaminan usaha industri Kota Madiun."
               </p>
            </div>
            <div className="flex flex-wrap gap-5">
              <a href="#form-pendaftaran" className="px-10 py-5 bg-[#1A1A40] text-white rounded-2xl font-bold shadow-xl hover:-translate-y-1 transition-all flex items-center gap-3">
                 MULAI DAFTAR SEKARANG <ArrowRight size={20}/>
              </a>
            </div>
          </div>
          <div className="relative flex justify-center items-center">
            <div className="absolute w-[120%] h-[120%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="relative z-10 p-6 bg-white rounded-[4rem] shadow-2xl border-4 border-white transform transition-transform hover:scale-[1.02]">
              <Image src="/Laura joss.png" alt="Logo IKM JUARA" width={450} height={450} className="rounded-[3rem]" />
            </div>
          </div>
        </div>
      </section>

      {/* 3. PROFIL SECTION */}
      <section id="profil" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-3xl p-10 mb-16 shadow-2xl text-center transform hover:scale-[1.01] transition-all">
            <h2 className="text-white text-3xl md:text-5xl font-black leading-tight uppercase tracking-tighter">
              "IKM JUARA – Dari Lokal Berkarya, ke Global Berdaya!"
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Award className="text-indigo-600 w-10 h-10" />
                <h2 className="text-4xl font-black text-[#1A1A40]">Apa itu <span className="text-indigo-600">IKM JUARA?</span></h2>
              </div>
              <p className="text-xl font-medium text-slate-600 leading-relaxed border-l-8 border-indigo-600 pl-6 italic">
                Integrasi Konsultasi Mandiri untuk Jaminan Usaha, Akselerasi, dan Produktivitas Industri Anda!
              </p>
              <p className="text-slate-500 text-lg leading-relaxed">
                Melalui program ini, pemerintah Kota Madiun menghadirkan layanan klinik konsultasi industri terintegrasi 
                yang menjadi mitra strategis para pelaku IKM untuk naik kelas.
              </p>
            </div>

            <div className="grid gap-4">
              {[
                { icon: <ShieldCheck className="text-green-600" />, title: "Legalitas", desc: "Pendampingan perlindungan usaha." },
                { icon: <TrendingUp className="text-blue-600" />, title: "Produktivitas", desc: "Efisiensi proses industri." },
                { icon: <Globe className="text-purple-600" />, title: "Pasar Global", desc: "Branding & Akses Ekspor." }
              ].map((item, i) => (
                <div key={i} className="flex gap-5 items-center bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:shadow-lg transition-all">
                  <div className="bg-white p-3 rounded-xl shadow-sm">{item.icon}</div>
                  <div>
                    <h4 className="font-black uppercase tracking-widest text-sm">{item.title}</h4>
                    <p className="text-slate-500 text-sm font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. FORM PENDAFTARAN SECTION */}
      <section id="form-pendaftaran" className="py-24 px-6 bg-[#1A1A40]">
        <div className="max-w-4xl mx-auto bg-white rounded-[3rem] shadow-3xl overflow-hidden border-[12px] border-white/10">
          <div className="p-10 bg-slate-50 border-b text-center">
            <div className="inline-block p-4 bg-indigo-600 text-white rounded-2xl mb-4 shadow-xl shadow-indigo-200">
              <Briefcase size={32} />
            </div>
            <h2 className="text-3xl font-black text-[#1A1A40] uppercase tracking-tighter">Formulir Pendaftaran Binaan</h2>
            <p className="text-slate-500 font-bold mt-2 italic">Lengkapi data untuk mengakselerasi bisnis Anda</p>
          </div>

          <form 
            action={async (formData) => {
              await handlePendaftaran(formData);
            }} 
            className="p-10 space-y-8"
          >
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
              <div className="p-6 bg-orange-50 border-2 border-orange-100 rounded-[2rem] animate-scaleIn">
                <label className="text-xs font-black uppercase tracking-widest text-orange-700 mb-3 block italic text-center">Tersedia Pelatihan Tahun 2026</label>
                <select name="sub_pelatihan" required className="w-full p-4 bg-white border-2 border-orange-200 rounded-2xl outline-none font-bold text-orange-900">
                  <option value="">-- Pilih Jenis Pelatihan --</option>
                  {daftarPelatihan.map((p, i) => <option key={i} value={p}>{p}</option>)}
                </select>
              </div>
            )}

            <button type="submit" disabled={Object.values(errors).some(e => e !== "") || !layanan} className="w-full py-6 bg-[#1A1A40] text-white rounded-[2rem] font-black tracking-[0.2em] shadow-2xl hover:bg-indigo-600 hover:-translate-y-1 disabled:bg-slate-300 transition-all uppercase">
              Kirim Data Binaan & Daftar JUARA
            </button>
          </form>
        </div>
      </section>

      {/* 5. MODAL BUKU TAMU */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#1A1A40]/40 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-3xl p-10 relative animate-scaleIn">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-8 text-slate-400 hover:text-[#1A1A40] font-black text-2xl">×</button>
            <div className="text-center mb-8">
              <h3 className="text-3xl font-black italic uppercase tracking-tighter">Buku Tamu</h3>
              <p className="text-slate-500 text-sm font-bold mt-2">Akses cepat ke Dashboard IKM Binaan</p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); window.location.href = '/pencarian'; }} className="space-y-4">
              <input required type="text" placeholder="Nama Lengkap" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold shadow-inner" />
              <textarea required placeholder="Alamat" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold shadow-inner h-24" />
              <button type="submit" className="w-full py-5 bg-[#1A1A40] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all">MASUK SISTEM</button>
            </form>
          </div>
        </div>
      )}

      {/* 6. FOOTER SECTION */}
      <footer className="py-16 text-center bg-white border-t border-slate-100">
        <blockquote className="text-slate-400 italic text-xl font-serif max-w-2xl mx-auto px-6 mb-8">
          "Dengan semangat Juara, setiap IKM di Madiun akan menjadi pelaku industri yang tak hanya tumbuh, tapi juga menginspirasi."
        </blockquote>
        
        {/* LINK PRIVACY & SUPPORT */}
        <div className="flex justify-center gap-6 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
          <a href="/privacy" className="hover:text-indigo-600 transition-colors">Privacy</a>
          <span className="text-slate-200">•</span>
          <a href="/support" className="hover:text-indigo-600 transition-colors">Support</a>
        </div>
        <p className="mt-4 text-[10px] text-slate-300 font-bold uppercase tracking-widest">
          © 2026 E-Government Kota Madiun
        </p>
      </footer>

      {/* STYLES */}
      <style jsx global>{`
        html { scroll-behavior: smooth; }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-bounce-slow { animation: bounce 3s infinite; }
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}