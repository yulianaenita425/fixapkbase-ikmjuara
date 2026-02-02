"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Lottie from "lottie-react";

export default function LandingPage() {
  const [showModal, setShowModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [animationData, setAnimationData] = useState(null);

  // Efek Navbar saat scroll & Fetch Lottie Data
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    // Mengambil animasi Grafik Pertumbuhan/Rocket dari LottieFiles
    fetch("https://lottie.host/7604f378-62a2-463f-9e6b-73010b991823/K0S9Vv3u9y.json")
      .then((res) => res.json())
      .then((data) => setAnimationData(data));

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] overflow-x-hidden text-[#1A1A40]">
      
      {/* Dynamic Navigation */}
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
            <button 
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2.5 rounded-full text-white font-bold text-sm shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all"
            >
              AKSES DATA IKM
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section: Powerful & Memukau */}
      <section className="relative min-h-screen flex items-center pt-20">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-[50%] h-[80%] bg-gradient-to-bl from-indigo-100/50 to-transparent rounded-bl-[200px] -z-10" />
        <div className="absolute bottom-20 left-10 w-64 h-64 bg-yellow-200/30 blur-[100px] rounded-full -z-10" />

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative z-10">
            {/* System Status Tag */}
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
            
            {/* Lottie Growth Info Box */}
            <div className="flex items-center gap-4 mb-10 p-4 bg-white/50 backdrop-blur rounded-2xl border border-white max-w-sm shadow-sm hover:shadow-md transition-all">
               <div className="w-16 h-16">
                  {animationData && <Lottie animationData={animationData} loop={true} />}
               </div>
               <p className="text-sm font-semibold text-slate-600 italic">
                 "Mendorong efisiensi dan jaminan usaha industri Kota Madiun."
               </p>
            </div>

            <div className="flex flex-wrap gap-5">
              <button 
                onClick={() => setShowModal(true)}
                className="group relative px-10 py-5 bg-[#1A1A40] text-white rounded-2xl font-bold shadow-[0_20px_40px_rgba(26,26,64,0.3)] overflow-hidden transition-all hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10 flex items-center gap-3">
                  MULAI KONSULTASI <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                </span>
              </button>
            </div>
          </div>

          <div className="relative group flex justify-center items-center">
            {/* Glow Effect */}
            <div className="absolute w-[120%] h-[120%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse"></div>
            
            {/* Main Logo Container */}
            <div className="relative z-10 p-6 bg-white rounded-[4rem] shadow-[0_40px_80px_-15px_rgba(26,26,64,0.2)] transition-transform duration-700 group-hover:scale-[1.02] border-4 border-white">
              <Image 
                src="/Laura joss.png" 
                alt="Logo IKM JUARA" 
                width={450} 
                height={450} 
                className="rounded-[3rem]"
              />
              
              {/* Floating Badge with Lottie */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/90 backdrop-blur-md p-4 rounded-3xl shadow-2xl z-20 animate-float border border-white/50 hidden md:block text-center">
                <div className="w-full h-16 mb-1">
                    {animationData && <Lottie animationData={animationData} loop={true} />}
                </div>
                <p className="text-[10px] font-black uppercase text-indigo-600">Global Scale</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="layanan" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8 text-center">
          {[
            { title: "Legalitas", icon: "🛡️", desc: "Pendampingan perlindungan usaha & sertifikasi resmi.", color: "bg-blue-500" },
            { title: "Produktivitas", icon: "⚙️", desc: "Optimasi efisiensi proses industri modern.", color: "bg-red-500" },
            { title: "Pasar Global", icon: "🌍", desc: "Akses pasar ekspor & penguatan digital branding.", color: "bg-green-500" },
          ].map((item, i) => (
            <div key={i} className="group p-10 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl hover:shadow-2xl hover:-translate-y-4 transition-all duration-500">
              <div className={`w-16 h-16 ${item.color} rounded-2xl flex items-center justify-center text-3xl mb-8 shadow-lg mx-auto group-hover:rotate-12 transition-transform text-white`}>
                {item.icon}
              </div>
              <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter">{item.title}</h3>
              <p className="text-slate-500 font-medium leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Modal Buku Tamu - Glassmorphism */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#1A1A40]/40 backdrop-blur-md">
          <div className="bg-white/95 rounded-[2.5rem] w-full max-w-lg shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white p-8 md:p-12 relative animate-scaleIn">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-8 text-slate-400 hover:text-[#1A1A40] font-bold text-2xl transition-colors">×</button>
            
            <div className="text-center mb-10">
              <div className="inline-block p-4 bg-indigo-50 rounded-2xl mb-4">🚀</div>
              <h3 className="text-3xl font-black tracking-tighter uppercase italic">Buku Tamu</h3>
              <p className="text-slate-500 text-sm font-medium mt-2">Data ini diperlukan untuk mengakses Dashboard IKM Binaan</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); window.location.href = '/pencarian'; }} className="space-y-5">
              <div className="group">
                <input required type="text" placeholder="Nama Lengkap" className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl transition-all outline-none font-bold placeholder:text-slate-300 shadow-inner" />
              </div>
              <div className="group">
                <textarea required placeholder="Alamat Lengkap" className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl transition-all outline-none font-bold placeholder:text-slate-300 shadow-inner h-24" />
              </div>
              <div className="group">
                <input required type="tel" placeholder="Nomor WhatsApp" className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl transition-all outline-none font-bold placeholder:text-slate-300 shadow-inner" />
              </div>
              <button 
                type="submit"
                className="w-full py-5 bg-[#1A1A40] text-white rounded-2xl font-black tracking-[0.2em] shadow-xl shadow-indigo-900/20 hover:bg-indigo-600 hover:-translate-y-1 active:translate-y-0 transition-all uppercase"
              >
                SUBMIT & AKSES DATA
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Global Style Animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-bounce-slow { animation: bounce 3s infinite; }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}