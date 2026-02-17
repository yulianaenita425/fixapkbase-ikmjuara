"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, Home, MessageCircle, Upload, FileText, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function SuksesPage() {
  const [uploading, setUploading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Batasi ukuran file (Max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("File terlalu besar! Maksimal 2MB.");
      return;
    }

    setUploading(true);
    setStatus("idle");

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `dokumen_pendaftar/${fileName}`;

      // 1. Upload ke Supabase Storage (Bucket: berkas-ikm)
      const { error: uploadError } = await supabase.storage
        .from('berkas-ikm')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Berhasil Upload
      setStatus("success");
      setIsCompleted(true); // Membuka akses tombol selesai

    } catch (error) {
      console.error("Upload gagal:", error);
      setStatus("error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 text-center border-[12px] border-indigo-50/50">
        
        {/* Ikon Dinamis */}
        <div className="flex justify-center mb-6">
          <div className={`p-6 rounded-full ${isCompleted ? 'bg-green-100 animate-bounce-slow' : 'bg-amber-100'}`}>
            {isCompleted ? (
              <CheckCircle size={64} className="text-green-600" />
            ) : (
              <AlertCircle size={64} className="text-amber-600" />
            )}
          </div>
        </div>

        <h1 className="text-2xl font-black text-[#1A1A40] mb-2 tracking-tighter uppercase">
          {isCompleted ? "PENDAFTARAN SELESAI!" : "TAHAP TERAKHIR"}
        </h1>
        
        <p className="text-slate-500 font-medium leading-relaxed mb-8">
          {isCompleted 
            ? "Terima kasih! Seluruh berkas telah kami terima. Tim IKM JUARA akan segera melakukan verifikasi." 
            : "Silakan unggah berkas pendukung (Foto Usaha/KTP/NIB) untuk menyelesaikan pendaftaran Anda."}
        </p>

        {/* BOX UNGGAH WAJIB */}
        <div className={`rounded-3xl p-6 mb-8 border-2 border-dashed transition-all ${isCompleted ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
          {!isCompleted ? (
            <label className="group cursor-pointer block">
              <div className="flex flex-col items-center justify-center bg-white border-2 border-indigo-100 rounded-2xl p-6 transition-all group-hover:border-indigo-400 group-hover:bg-indigo-50 shadow-sm">
                {uploading ? (
                  <Loader2 className="text-indigo-600 animate-spin mb-2" size={32} />
                ) : (
                  <Upload className="text-indigo-500 group-hover:scale-110 transition-transform mb-2" size={32} />
                )}
                <span className="text-sm font-black text-indigo-900">
                  {uploading ? "MENGUNGGAH..." : "UNGGAH BERKAS DISINI"}
                </span>
                <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase">Format: JPG, PNG, atau PDF (Max 2MB)</p>
                <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleUpload} disabled={uploading} />
              </div>
            </label>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <div className="bg-emerald-500 text-white p-2 rounded-lg">
                <CheckCircle size={20} />
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-emerald-800 uppercase">BERKAS DITERIMA</p>
                <p className="text-[10px] text-emerald-600 font-bold">Pendaftaran sudah divalidasi sistem.</p>
              </div>
            </div>
          )}
        </div>

        {/* Tombol Aksi - Hanya Aktif Jika isCompleted true */}
        <div className="space-y-4">
          {isCompleted ? (
            <Link 
              href="/"
              className="flex items-center justify-center gap-3 w-full py-5 bg-[#1A1A40] text-white rounded-2xl font-black tracking-widest hover:bg-indigo-600 transition-all shadow-xl animate-in zoom-in-95"
            >
              <Home size={20} /> KEMBALI KE BERANDA
            </Link>
          ) : (
            <button 
              disabled
              className="flex items-center justify-center gap-3 w-full py-5 bg-slate-100 text-slate-400 rounded-2xl font-black tracking-widest cursor-not-allowed uppercase"
            >
              Tunggu Unggah Berkas...
            </button>
          )}
          
          <a 
            href="https://wa.me/628123456789"
            target="_blank"
            className="flex items-center justify-center gap-3 w-full py-5 bg-white text-[#1A1A40] border-2 border-slate-100 rounded-2xl font-bold hover:bg-slate-50 transition-all"
          >
            <MessageCircle size={20} className="text-green-500" /> BANTUAN ADMIN
          </a>
        </div>

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