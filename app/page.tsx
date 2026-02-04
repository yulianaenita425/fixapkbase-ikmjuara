"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Lottie from "lottie-react";
import { 
  ShieldCheck, TrendingUp, Globe, Award, 
  ArrowRight, User, Hash, MapPin, Briefcase, 
  CheckCircle2, Volume2, Info 
} from 'lucide-react';
// @ts-ignore
import { handlePendaftaran } from './actions';

export default function IKMJuaraFullPage() {
  // --- 1. SEMUA STATE UTUH ---
  const [showModal, setShowModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [animationData, setAnimationData] = useState(null);
  const [layanan, setLayanan] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showPelatihanList, setShowPelatihanList] = useState(false);
  const [loadingTamu, setLoadingTamu] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; msg: string } | null>(null);

  const daftarPelatihan = [
    "Pelatihan Digital Marketing IKM 2026",
    "Pelatihan Desain Kemasan Inovatif",
    "Workshop Manajemen Keuangan Industri",
    "Bimtek Standarisasi Mutu Produk"
  ];

  // Efek Navbar & Fetch Lottie
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    fetch("https://lottie.host/7604f378-62a2-463f-9e6b-73010b991823/K0S9Vv3u9y.json")
      .then((res) => res.json()).then((data) => setAnimationData(data));
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- 2. FITUR AUDIO DING (Synthesized) ---
  const playSuccessSound = () => {
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, context.currentTime); // Nada Tinggi
      oscillator.frequency.exponentialRampToValueAtTime(440, context.currentTime + 0.5); 
      
      gainNode.gain.setValueAtTime(0.1, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.start();
      oscillator.stop(context.currentTime + 0.5);
    } catch (e) {
      console.log("Audio feedback not supported");
    }
  };

  // --- 3. HANDLER TOAST ---
  const showToastMsg = (msg: string) => {
    playSuccessSound(); // Bunyikan Ding
    setToast({ show: true, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // --- 4. VALIDASI & INPUT HANDLER ---
  const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numericValue = value.replace(/\D/g, '');
    e.target.value = numericValue;
    
    if (name === 'nib' && numericValue.length !== 13) setErrors(p => ({...p, nib: "NIB harus 13 digit"}));
    else if (name === 'nik' && numericValue.length !== 16) setErrors(p => ({...p, nik: "NIK harus 16 digit"}));
    else setErrors(p => ({...p, [name]: ""}));
  };

  const handleLayananChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setLayanan(val);
    setShowPelatihanList(val === "Pelatihan Pemberdayaan IKM");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] overflow-x-hidden text-[#1A1A40]">
      
      {/* --- TOAST NOTIFICATION COMPONENT --- */}
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
            <Volume2 size={16} className="text-slate-500 ml-2" />
          </div>
        </div>
      )}

      {/* 1. NAVIGATION (UTUH) */}
      <nav className={`fixed w-full z-[100] transition-all duration-500 ${scrolled ? "py-3 bg-[#1A1A40]/90 backdrop-blur-xl shadow-2xl" : "py-6 bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="bg-white p-1.5 rounded-xl shadow-lg group-hover:rotate-12 transition-transform">
              <Image src="/Laura joss.png" alt="Logo" width={32} height={32} />
            </div>
            <span className={`font-black text-2xl tracking-tighter ${scrolled ? "text-white" : "text-[#1A1A40]"}`}>IKM <span className="text-yellow-400">JUARA</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#profil" className={`font-bold text-sm tracking-widest hover:text-yellow-400 transition ${scrolled ? "text-slate-300" : "text-[#1A1A40]/70"}`}>PROFIL</a>
            <button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2.5 rounded-full text-white font-bold text-sm shadow-lg hover:scale-105 active:scale-95 transition-all">AKSES DATA IKM</button>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION (UTUH) */}
      <section className="relative min-h-screen flex items-center pt-20">
        <div className="absolute top-0 right-0 w-[50%] h-[80%] bg-gradient-to-bl from-indigo-100/50 to-transparent rounded-bl-[200px] -z-10" />
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-slate-100 mb-6 animate-bounce-slow">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 font-mono">System Active: IKM JUARA v2.0</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black leading-[1.1] mb-8">Akselerasi Industri <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-red-500">Lokal ke Global.</span></h1>
            <div className="flex items-center gap-4 mb-10 p-4 bg-white/50 backdrop-blur rounded-2xl border border-white max-w-sm">
               <div className="w-16 h-16">{animationData && <Lottie animationData={animationData} loop={true} />}</div>
               <p className="text-sm font-semibold text-slate-600 italic">"Mendorong efisiensi dan jaminan usaha industri Kota Madiun."</p>
            </div>
            <a href="#form-pendaftaran" className="px-10 py-5 bg-[#1A1A40] text-white rounded-2xl font-bold shadow-xl hover:-translate-y-1 transition-all flex items-center gap-3 w-fit">DAFTAR BINAAN <ArrowRight size={20}/></a>
          </div>
          <div className="relative z-10 p-6 bg-white rounded-[4rem] shadow-2xl border-4 border-white transform hover:rotate-2 transition-transform">
            <Image src="/Laura joss.png" alt="Hero Image" width={450} height={450} className="rounded-[3rem]" />
          </div>
        </div>
      </section>

      {/* 3. PROFIL SECTION (UTUH) */}
      <section id="profil" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-3xl p-10 mb-16 shadow-2xl text-center">
            <h2 className="text-white text-3xl md:text-5xl font-black uppercase tracking-tighter italic">"IKM JUARA – Dari Lokal Berkarya, ke Global Berdaya!"</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-indigo-600">
                <Award size={40} />
                <h2 className="text-4xl font-black text-[#1A1A40]">Apa itu <span className="text-indigo-600">IKM JUARA?</span></h2>
              </div>
              <p className="text-xl font-medium text-slate-600 leading-relaxed border-l-8 border-indigo-600 pl-6 italic">Integrasi Konsultasi Mandiri untuk Jaminan Usaha, Akselerasi, dan Produktivitas Industri Anda!</p>
            </div>
            <div className="grid gap-4">
              {[
                { icon: <ShieldCheck className="text-green-600" />, title: "Legalitas", desc: "Pendampingan perlindungan usaha." },
                { icon: <TrendingUp className="text-blue-600" />, title: "Produktivitas", desc: "Efisiensi proses industri." },
                { icon: <Globe className="text-purple-600" />, title: "Pasar Global", desc: "Branding & Akses Ekspor." }
              ].map((item, i) => (
                <div key={i} className="flex gap-5 items-center bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:shadow-lg transition-all">
                  <div className="bg-white p-3 rounded-xl shadow-sm">{item.icon}</div>
                  <div><h4 className="font-black uppercase text-sm">{item.title}</h4><p className="text-slate-500 text-sm font-medium">{item.desc}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. FORM PENDAFTARAN (UTUH + TOAST) */}
      <section id="form-pendaftaran" className="py-24 px-6 bg-[#1A1A40]">
        <div className="max-w-4xl mx-auto bg-white rounded-[3rem] shadow-3xl overflow-hidden border-[12px] border-white/10">
          <div className="p-10 bg-slate-50 border-b text-center">
            <div className="inline-block p-4 bg-indigo-600 text-white rounded-2xl mb-4 shadow-xl"><Briefcase size={32} /></div>
            <h2 className="text-3xl font-black uppercase tracking-tighter">Formulir Pendaftaran Binaan</h2>
          </div>
          <form action={async (fd) => { 
              await handlePendaftaran(fd); 
              showToastMsg("DATA PENDAFTARAN BERHASIL TERKIRIM!"); 
            }} className="p-10 space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nama Lengkap</label>
                <input name="nama" required placeholder="Sesuai KTP" className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none font-bold shadow-inner" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">No. WhatsApp</label>
                <input name="hp" required onChange={handleNumericInput} placeholder="08..." className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none font-bold shadow-inner" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">NIB (13 Digit)</label>
                <input name="nib" maxLength={13} required onChange={handleNumericInput} placeholder="Input Angka" className={`w-full p-4 bg-slate-50 border-2 ${errors.nib ? 'border-red-500' : 'border-transparent focus:border-indigo-600'} rounded-2xl outline-none font-bold shadow-inner`} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">NIK (16 Digit)</label>
                <input name="nik" maxLength={16} required onChange={handleNumericInput} placeholder="Input Angka" className={`w-full p-4 bg-slate-50 border-2 ${errors.nik ? 'border-red-500' : 'border-transparent focus:border-indigo-600'} rounded-2xl outline-none font-bold shadow-inner`} />
              </div>
            </div>
            <select name="layanan" onChange={handleLayananChange} required className="w-full p-5 bg-indigo-50 border-2 border-indigo-100 rounded-2xl outline-none font-black text-indigo-900 appearance-none cursor-pointer">
              <option value="">-- Pilih Layanan Utama --</option>
              <option value="Pendaftaran HKI Merek">Pendaftaran HKI Merek</option>
              <option value="Pendaftaran Sertifikat Halal">Pendaftaran Sertifikat Halal</option>
              <option value="Pendaftaran TKDN IK">Pendaftaran TKDN IK</option>
              <option value="Pelatihan Pemberdayaan IKM">Pelatihan Pemberdayaan IKM</option>
            </select>
            {showPelatihanList && (
              <div className="p-6 bg-orange-50 border-2 border-orange-100 rounded-[2rem] animate-scaleIn">
                <select name="sub_pelatihan" required className="w-full p-4 bg-white border-2 border-orange-200 rounded-2xl outline-none font-bold text-orange-900">
                  <option value="">-- Pilih Jenis Pelatihan --</option>
                  {daftarPelatihan.map((p, i) => <option key={i} value={p}>{p}</option>)}
                </select>
              </div>
            )}
            <button type="submit" className="w-full py-6 bg-[#1A1A40] text-white rounded-[2rem] font-black tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all uppercase">Gabung Jadi IKM Juara</button>
          </form>
        </div>
      </section>

      {/* 5. MODAL BUKU TAMU (UTUH + TOAST + AUDIO) */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#1A1A40]/40 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-3xl p-10 relative animate-scaleIn">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-8 text-slate-400 hover:text-red-500 font-black text-2xl">×</button>
            <div className="text-center mb-8">
              <h3 className="text-3xl font-black italic uppercase tracking-tighter">Buku Tamu</h3>
              <p className="text-slate-500 text-sm font-bold">Identitas Pengakses Sistem</p>
            </div>
            <form onSubmit={async (e) => {
                e.preventDefault();
                setLoadingTamu(true);
                const target = e.target as any;
                try {
                  const { supabase } = await import('@/lib/supabaseClient');
                  const { error } = await supabase.from("buku_tamu").insert([{
                    nama: target.nama.value,
                    whatsapp: target.whatsapp.value,
                    alamat: target.alamat.value,
                    waktu_kunjungan: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
                  }]);
                  if (error) throw error;
                  showToastMsg("AKSES DIBERIKAN. SELAMAT DATANG!");
                  setTimeout(() => window.location.href = '/pencarian', 1500);
                } catch (err) {
                  window.location.href = '/pencarian';
                } finally { setLoadingTamu(false); }
              }} className="space-y-4">
              <input name="nama" required placeholder="Nama Anda" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold shadow-inner border-2 border-transparent focus:border-indigo-500 transition-all" />
              <input name="whatsapp" required onChange={handleNumericInput} placeholder="WhatsApp (08...)" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold shadow-inner border-2 border-transparent focus:border-indigo-500 transition-all" />
              <textarea name="alamat" required placeholder="Alamat / Instansi" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold shadow-inner h-24 border-2 border-transparent focus:border-indigo-500 transition-all" />
              <button type="submit" disabled={loadingTamu} className="w-full py-5 bg-[#1A1A40] text-white rounded-2xl font-black uppercase shadow-xl hover:bg-indigo-600 disabled:bg-slate-400 transition-all">
                {loadingTamu ? "MENGIRIM..." : "MASUK SISTEM"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. FOOTER (UTUH) */}
      <footer className="py-16 text-center bg-white border-t border-slate-100">
        <blockquote className="text-slate-400 italic text-xl max-w-2xl mx-auto px-6 mb-8">"Dengan semangat Juara, setiap IKM di Madiun akan tumbuh dan menginspirasi."</blockquote>
        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">© 2026 E-Government Kota Madiun</p>
      </footer>

      <style jsx global>{`
        html { scroll-behavior: smooth; }
        @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out forwards; }
        @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-bounce-slow { animation: bounce-slow 3s infinite; }
      `}</style>
    </div>
  );
}