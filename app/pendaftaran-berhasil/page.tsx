"use client";

import Link from "next/link";
import { CheckCircle, Home, MessageCircle } from "lucide-react";

export default function SuksesPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 text-center border-[12px] border-indigo-50/50">
        
        {/* Ikon Sukses */}
        <div className="flex justify-center mb-8">
          <div className="bg-green-100 p-6 rounded-full animate-bounce-slow">
            <CheckCircle size={64} className="text-green-600" />
          </div>
        </div>

        {/* Teks Konfirmasi */}
        <h1 className="text-3xl font-black text-[#1A1A40] mb-4 tracking-tighter uppercase">
          PENDAFTARAN BERHASIL!
        </h1>
        <p className="text-slate-500 font-medium leading-relaxed mb-10">
          Data Anda telah aman tersimpan dalam sistem <span className="font-bold text-indigo-600">IKM JUARA</span>. 
          Tim kami akan segera melakukan verifikasi berkas Anda.
        </p>

        {/* Tombol Aksi */}
        <div className="space-y-4">
          <Link 
            href="/"
            className="flex items-center justify-center gap-3 w-full py-5 bg-[#1A1A40] text-white rounded-2xl font-black tracking-widest hover:bg-indigo-600 transition-all shadow-xl"
          >
            <Home size={20} /> KEMBALI KE BERANDA
          </Link>
          
          <a 
            href="https://wa.me/628123456789" // Ganti dengan nomor Admin
            target="_blank"
            className="flex items-center justify-center gap-3 w-full py-5 bg-white text-[#1A1A40] border-2 border-slate-100 rounded-2xl font-bold hover:bg-slate-50 transition-all"
          >
            <MessageCircle size={20} className="text-green-500" /> HUBUNGI ADMIN
          </a>
        </div>

        {/* Footer Kecil */}
        <p className="mt-10 text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
          E-Government Kota Madiun • 2026
        </p>
      </div>

      <style jsx global>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
}