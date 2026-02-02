"use client";
import { useState } from 'react';
import Image from 'next/image';

export default function LandingPage() {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ nama: '', alamat: '', hp: '' });

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulasi penyimpanan data buku tamu
    console.log("Buku Tamu:", formData);
    // Arahkan ke halaman pencarian (Pastikan Anda membuat folder app/pencarian/page.tsx)
    window.location.href = '/pencarian';
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] font-sans text-slate-800">
      {/* Navigation - Dark Theme */}
      <nav className="fixed w-full bg-[#1A1A40] z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-white p-1 rounded">
                <Image src="/Laura joss.png" alt="Logo" width={30} height={30} />
              </div>
              <span className="font-bold text-xl tracking-tighter text-white">IKM <span className="text-yellow-400">JUARA</span></span>
            </div>
            <div className="hidden md:flex space-x-6 text-sm font-medium text-slate-300">
              <a href="#profil" className="hover:text-white transition">PROFIL</a>
              <a href="#layanan" className="hover:text-white transition">LAYANAN</a>
              <button 
                onClick={() => setShowModal(true)}
                className="bg-indigo-600 px-4 py-2 rounded-lg text-white hover:bg-indigo-500 transition shadow-md"
              >
                PENCARIAN DATA
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Gradient Theme Matching Dashboard */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-[#1A1A40] via-[#2D2D65] to-[#1A1A40] text-white overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-block px-4 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold mb-6 tracking-widest uppercase">
              🚀 Integrasi Konsultasi Mandiri
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
              IKM JUARA – Dari Lokal Berkarya, <br/>
              <span className="text-yellow-400">ke Global Berdaya!</span>
            </h1>
            <p className="text-indigo-100/80 text-lg mb-10 max-w-xl leading-relaxed">
              Mitra strategis IKM Kota Madiun untuk peningkatan produktivitas, legalitas, dan daya saing pasar global melalui ekosistem digital terpadu.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <button 
                onClick={() => setShowModal(true)}
                className="px-8 py-4 bg-indigo-600 rounded-xl font-bold hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-900/40 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                Cari Data IKM Binaan
              </button>
            </div>
          </div>
          <div className="flex-1 flex justify-center relative">
            <div className="absolute inset-0 bg-indigo-500 rounded-full blur-[100px] opacity-20 animate-pulse"></div>
            <Image 
              src="/Laura joss.png" 
              alt="Logo IKM JUARA" 
              width={400} 
              height={400} 
              className="relative z-10 drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] scale-110"
            />
          </div>
        </div>
      </section>

      {/* Modal Buku Tamu */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="bg-[#1A1A40] p-6 text-white text-center relative">
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                ✕
              </button>
              <h3 className="text-xl font-bold italic uppercase tracking-tighter">Buku Tamu Digital</h3>
              <p className="text-xs text-indigo-300 mt-1">Silakan isi data diri untuk mengakses pencarian IKM Binaan</p>
            </div>
            <form onSubmit={handleGuestSubmit} className="p-8 space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nama Lengkap</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition"
                  placeholder="Contoh: Bambang Oktavianisa"
                  onChange={(e) => setFormData({...formData, nama: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Alamat Lengkap</label>
                <textarea 
                  required
                  className="w-full px-4 py-3 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition"
                  placeholder="Jl. Pahlawan No. 1, Madiun"
                  onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                ></textarea>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nomor HP (WhatsApp)</label>
                <input 
                  required
                  type="tel" 
                  className="w-full px-4 py-3 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition"
                  placeholder="08123456789"
                  onChange={(e) => setFormData({...formData, hp: e.target.value})}
                />
              </div>
              <button 
                type="submit"
                className="w-full py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200 mt-4 uppercase tracking-wider"
              >
                Masuk Ke Pencarian Data
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer Sesuai Control Center Theme */}
      <footer className="bg-[#1A1A40] text-slate-400 py-10 border-t border-indigo-900/50 text-center">
        <p className="text-xs uppercase tracking-[0.3em]">Master Data IKM Juara &copy; 2026</p>
      </footer>
    </div>
  );
}