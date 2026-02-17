"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle, Home, MessageCircle, Upload, FileText, Loader2, AlertCircle, UserCheck } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function SuksesPage() {
  const [uploading, setUploading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [userName, setUserName] = useState("Sobat IKM");

  // Integrasi: Ambil nama pendaftar dari halaman sebelumnya
  useEffect(() => {
    const savedName = localStorage.getItem("user_name_ikm");
    if (savedName) setUserName(savedName);
    console.log("Halaman Sukses Termuat untuk:", savedName);
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi Ukuran: 2MB
    if (file.size > 2 * 1024 * 1024) {
      alert("⚠️ File terlalu besar! Maksimal 2MB agar sistem tetap cepat.");
      return;
    }

    setUploading(true);
    setStatus("idle");

    try {
      const fileExt = file.name.split('.').pop();
      // Integrasi: Penamaan file menyertakan nama user agar mudah dicari admin
      const cleanName = userName.replace(/\s+/g, '-').toLowerCase();
      const fileName = `${cleanName}-${Date.now()}.${fileExt}`;
      const filePath = `dokumen_pendaftar/${fileName}`;

      // UPLOAD PROSES ke Bucket 'berkas-ikm'
      const { data, error: uploadError } = await supabase.storage
        .from('berkas-ikm') 
        .upload(filePath, file);

      if (uploadError) {
        console.error("Detail Error dari Supabase:", uploadError);
        alert(`Gagal unggah: ${uploadError.message}. Pastikan folder 'dokumen_pendaftar' tersedia.`);
        throw uploadError;
      }

      console.log("Upload Berhasil:", data);
      setStatus("success");
      setIsCompleted(true); 

      // Efek Suara Sukses (Opsional)
      const speech = new SpeechSynthesisUtterance("Berkas berhasil diunggah. Pendaftaran Anda selesai.");
      window.speechSynthesis.speak(speech);

    } catch (error) {
      console.error("Terjadi kesalahan:", error);
      setStatus("error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dekorasi Latar Belakang agar senada dengan Hero Section */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-red-500/5 rounded-full blur-3xl"></div>

      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 text-center border-[12px] border-indigo-50/50 relative z-10 animate-scaleIn">
        
        {/* Ikon Dinamis dengan Badge User */}
        <div className="flex justify-center mb-6 relative">
          <div className={`p-6 rounded-full transition-all duration-700 ${isCompleted ? 'bg-green-100 scale-110' : 'bg-amber-100 rotate-12'}`}>
            {isCompleted ? (
              <CheckCircle size={64} className="text-green-600 animate-pulse" />
            ) : (
              <AlertCircle size={64} className="text-amber-600" />
            )}
          </div>
          <div className="absolute bottom-0 right-1/4 bg-[#1A1A40] text-white p-2 rounded-xl shadow-lg border-2 border-white">
            <UserCheck size={16} />
          </div>
        </div>

        <h2 className="text-xs font-black text-indigo-500 tracking-[0.3em] uppercase mb-2">Halo, {userName}!</h2>
        <h1 className="text-2xl font-black text-[#1A1A40] mb-2 tracking-tighter uppercase">
          {isCompleted ? "PENDAFTARAN SELESAI!" : "TAHAP VERIFIKASI"}
        </h1>
        
        <p className="text-slate-500 font-medium leading-relaxed mb-8 text-sm">
          {isCompleted 
            ? "Luar biasa! Seluruh berkas telah kami terima. Anda kini resmi masuk dalam antrean pembinaan IKM JUARA." 
            : "Data pendaftaran Anda sudah masuk, namun pendaftaran BELUM VALID. Mohon unggah bukti NIB atau Foto Produk Anda sekarang."}
        </p>

        {/* BOX UNGGAH */}
        <div className={`rounded-3xl p-6 mb-8 border-2 border-dashed transition-all duration-500 ${isCompleted ? 'bg-emerald-50 border-emerald-200' : 'bg-indigo-50 border-indigo-200 shadow-inner'}`}>
          {!isCompleted ? (
            <div className="flex flex-col items-center">
                <label htmlFor="file-upload" className="w-full cursor-pointer group">
                  <div className="flex flex-col items-center justify-center bg-white border-2 border-indigo-100 rounded-2xl p-6 transition-all group-hover:border-indigo-400 group-hover:shadow-md">
                    {uploading ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="text-indigo-600 animate-spin mb-2" size={32} />
                        <span className="text-[10px] font-bold text-slate-400 animate-pulse">MEMPROSES FILE...</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="text-indigo-500 mb-2 group-hover:-translate-y-1 transition-transform" size={32} />
                        <span className="text-sm font-black text-indigo-900 uppercase">KLIK UNTUK UNGGAH</span>
                        <p className="text-[9px] text-slate-400 mt-1 font-bold">PDF / JPG / PNG (Maks 2MB)</p>
                      </>
                    )}
                  </div>
                  <input 
                    id="file-upload"
                    type="file" 
                    className="hidden" 
                    accept="image/*,.pdf" 
                    onChange={handleUpload} 
                    disabled={uploading} 
                  />
                </label>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4 py-2">
              <div className="bg-emerald-500 text-white p-3 rounded-2xl shadow-lg rotate-3">
                <FileText size={24} />
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-emerald-800 uppercase tracking-tighter">BERKAS MASUK!</p>
                <p className="text-[10px] text-emerald-600 font-bold italic">Terverifikasi oleh Sistem Juara.</p>
              </div>
            </div>
          )}
        </div>

        {/* Tombol Aksi */}
        <div className="space-y-4">
          {isCompleted ? (
            <Link 
              href="/"
              className="flex items-center justify-center gap-3 w-full py-5 bg-[#1A1A40] text-white rounded-2xl font-black tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-xl hover:-translate-y-1 active:scale-95"
            >
              <Home size={20} /> SELESAI & KELUAR
            </Link>
          ) : (
            <div className="flex flex-col gap-2">
               <button 
                 disabled
                 className="flex items-center justify-center gap-3 w-full py-5 bg-slate-100 text-slate-400 rounded-2xl font-black tracking-widest cursor-not-allowed uppercase text-xs"
               >
                Tombol Keluar Terkunci
              </button>
              <div className="flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>
                <p className="text-[9px] text-rose-500 font-black uppercase italic">Wajib unggah berkas untuk aktivasi tombol</p>
              </div>
            </div>
          )}
          
          <a 
            href="https://wa.me/628123456789?text=Halo%20Admin%20IKM%20Juara,%20saya%20mengalami%20kendala%20saat%20unggah%20berkas"
            target="_blank"
            className="flex items-center justify-center gap-3 w-full py-4 bg-white text-[#1A1A40] border-2 border-slate-100 rounded-2xl font-bold hover:bg-slate-50 transition-all text-sm group"
          >
            <MessageCircle size={18} className="text-green-500 group-hover:rotate-12 transition-transform" /> HUBUNGI BANTUAN
          </a>
        </div>

        <p className="mt-10 text-[9px] text-slate-300 font-bold uppercase tracking-[0.3em]">
          Dinas Tenaga Kerja & Perindustrian Kota Madiun
        </p>
      </div>

      <style jsx global>{`
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scaleIn { animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
}