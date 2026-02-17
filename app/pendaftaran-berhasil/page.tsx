"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Import useRouter untuk navigasi
import { CheckCircle, Home, MessageCircle, Upload, FileText, Loader2, AlertCircle, UserCheck, X } from "lucide-react"; // Perbaikan nama package icons
import { supabase } from "../../lib/supabaseClient";
import imageCompression from "browser-image-compression";

export default function SuksesPage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showModal, setShowModal] = useState(false); // State untuk Pop-up
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [userName, setUserName] = useState("Sobat IKM");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const savedName = localStorage.getItem("user_name_ikm");
    const savedId = localStorage.getItem("user_id_ikm");
    
    if (savedName) setUserName(savedName);
    if (savedId) setUserId(savedId);
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setStatus("idle");

    try {
      if (file.type.startsWith("image/")) {
        const options = {
          maxSizeMB: 0.24,
          maxWidthOrHeight: 1280,
          useWebWorker: true,
        };
        
        try {
          const compressedFile = await imageCompression(file, options);
          file = compressedFile; 
        } catch (compressionError) {
          console.error("Gagal kompresi:", compressionError);
        }
      }

      if (file.size > 250 * 1024) {
        alert("⚠️ File masih terlalu besar (Maks 250 KB).");
        setUploading(false);
        return;
      }

      const fileExt = file.name.split('.').pop();
      const cleanName = userName.replace(/\s+/g, '-').toLowerCase();
      const fileName = `${cleanName}-${Date.now()}.${fileExt}`;
      const filePath = `dokumen_pendaftar/${fileName}`;

      // 1. Upload ke Storage
      const { error: uploadError } = await supabase.storage
        .from('berkas-ikm') 
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Ambil Public URL
      const { data: publicUrlData } = supabase.storage
        .from('berkas-ikm')
        .getPublicUrl(filePath);
      
      const publicUrl = publicUrlData.publicUrl;

      // 3. Update Database (BAGIAN PERBAIKAN SINKRONISASI)
      const { data: updateResult, error: dbError } = await supabase
        .from('list_tunggu_peserta')
        .update({ 
          foto: publicUrl 
        })
        .match(userId ? { id: userId } : {}) // Prioritas pakai ID jika ada
        .ilike('nama_peserta', userName)     // Gunakan ilike agar tidak sensitif huruf besar/kecil
        .order('created_at', { ascending: false })
        .limit(1)
        .select();

      // Log untuk pengecekan di Console
      if (updateResult && updateResult.length > 0) {
        console.log("Update Berhasil:", updateResult);
      } else {
        console.warn("Peringatan: Tidak ada baris data yang cocok untuk diupdate.");
      }

      if (dbError) throw dbError;

      // SUKSES: Set Status & Tampilkan Modal
      setIsCompleted(true);
      setStatus("success");
      setShowModal(true); 

    } catch (error) {
      console.error("Error Detail:", error);
      setStatus("error");
      alert("Terjadi kesalahan teknis saat mengunggah berkas.");
    } finally {
      setUploading(false);
    }
  };

  const handleFinalize = () => {
    setShowModal(false);
    router.push("/"); 
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Decorative */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-red-500/5 rounded-full blur-3xl"></div>

      {/* MODAL POP-UP (OVERLAY) */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] max-w-sm w-full p-8 shadow-2xl relative animate-scaleIn border-[8px] border-indigo-50">
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 p-4 rounded-full">
                <CheckCircle size={48} className="text-green-600" />
              </div>
            </div>
            <h3 className="text-xl font-black text-[#1A1A40] mb-3 text-center uppercase tracking-tighter">Data Berhasil Dikirim!</h3>
            <p className="text-slate-500 text-sm text-center leading-relaxed mb-8 font-medium">
              Terima kasih, berkas Anda telah tersimpan. Mohon menunggu proses <span className="text-indigo-600 font-bold">verifikasi admin</span>.
            </p>
            <button 
              onClick={handleFinalize}
              className="w-full py-4 bg-[#1A1A40] text-white rounded-2xl font-black tracking-widest hover:bg-indigo-600 transition-all shadow-lg active:scale-95 uppercase text-xs"
            >
              Saya Mengerti & Setuju
            </button>
          </div>
        </div>
      )}

      {/* MAIN CARD */}
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 text-center border-[12px] border-indigo-50/50 relative z-10 animate-scaleIn">
        
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
            : "Data pendaftaran Anda sudah masuk, namun WAJIB mengunggah Foto KTP Kota Madiun (Otomatis Kompres)."}
        </p>

        {/* Upload Box Area */}
        <div className={`rounded-3xl p-6 mb-8 border-2 border-dashed transition-all duration-500 ${isCompleted ? 'bg-emerald-50 border-emerald-200' : 'bg-indigo-50 border-indigo-200 shadow-inner'}`}>
          {!isCompleted ? (
            <div className="flex flex-col items-center">
                <label htmlFor="file-upload" className="w-full cursor-pointer group">
                  <div className="flex flex-col items-center justify-center bg-white border-2 border-indigo-100 rounded-2xl p-6 transition-all group-hover:border-indigo-400 group-hover:shadow-md">
                    {uploading ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="text-indigo-600 animate-spin mb-2" size={32} />
                        <span className="text-[10px] font-bold text-slate-400 animate-pulse uppercase">Memproses Berkas...</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="text-indigo-500 mb-2 group-hover:-translate-y-1 transition-transform" size={32} />
                        <span className="text-sm font-black text-indigo-900 uppercase">KLIK UNTUK UNGGAH</span>
                        <p className="text-[9px] text-slate-400 mt-1 font-bold">PDF / JPG / PNG (Auto-Resize)</p>
                      </>
                    )}
                  </div>
                  <input id="file-upload" type="file" className="hidden" accept="image/*,.pdf" onChange={handleUpload} disabled={uploading} />
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

        {/* Action Buttons */}
        <div className="space-y-4">
          {isCompleted ? (
            <button 
              onClick={handleFinalize}
              className="flex items-center justify-center gap-3 w-full py-5 bg-[#1A1A40] text-white rounded-2xl font-black tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-xl hover:-translate-y-1 active:scale-95 uppercase text-xs"
            >
              <Home size={20} /> SELESAI & KELUAR
            </button>
          ) : (
            <div className="flex flex-col gap-2">
               <button disabled className="flex items-center justify-center gap-3 w-full py-5 bg-slate-100 text-slate-400 rounded-2xl font-black tracking-widest cursor-not-allowed uppercase text-[10px]">
                Tombol Keluar Terkunci
              </button>
              <div className="flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>
                <p className="text-[9px] text-rose-500 font-black uppercase italic tracking-tighter">Wajib unggah berkas untuk aktivasi tombol</p>
              </div>
            </div>
          )}
          
          <a href="https://wa.me/628123456789?text=Halo%20Admin%20IKM%20Juara" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full py-4 bg-white text-[#1A1A40] border-2 border-slate-100 rounded-2xl font-bold hover:bg-slate-50 transition-all text-sm group">
            <MessageCircle size={18} className="text-green-500 group-hover:rotate-12 transition-transform" /> HUBUNGI BANTUAN
          </a>
        </div>

        <p className="mt-10 text-[9px] text-slate-300 font-bold uppercase tracking-[0.3em]">
          Dinas Tenaga Kerja & Perindustrian Kota Madiun
        </p>
      </div>

      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        .animate-scaleIn { animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
}