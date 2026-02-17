"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Home, MessageCircle, Upload, FileText, Loader2, AlertCircle, UserCheck } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import imageCompression from "browser-image-compression";

export default function SuksesPage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [userName, setUserName] = useState("Sobat IKM");

  useEffect(() => {
    const savedName = localStorage.getItem("user_name_ikm");
    if (savedName) setUserName(savedName);
  }, []);

  const handleUpload = async (e) => {
    let file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      // 1. Ambil data dari localStorage
      const rawId = localStorage.getItem("user_registration_id");
      const savedName = localStorage.getItem("user_name_ikm") || userName;

      // 2. Kompresi Gambar (Optimasi agar upload cepat)
      if (file.type.startsWith("image/")) {
        const options = { maxSizeMB: 0.2, maxWidthOrHeight: 1280, useWebWorker: true };
        try { 
          file = await imageCompression(file, options); 
        } catch (err) { 
          console.error("Gagal kompresi, menggunakan file asli:", err); 
        }
      }

      // 3. Persiapan Path File
      const fileExt = file.name.split('.').pop();
      const cleanFileName = savedName.trim().replace(/\s+/g, '-').toLowerCase();
      const fileName = `${cleanFileName}-${Date.now()}.${fileExt}`;
      const filePath = `dokumen_pendaftar/${fileName}`;

      // 4. Upload ke Storage Supabase
      const { error: uploadError } = await supabase.storage
        .from('berkas-ikm') 
        .upload(filePath, file);

      if (uploadError) throw new Error(`Gagal Simpan File: ${uploadError.message}`);

      // 5. Ambil Public URL
      const { data: publicUrlData } = supabase.storage.from('berkas-ikm').getPublicUrl(filePath);
      const publicUrl = publicUrlData.publicUrl;

      // 6. LOGIKA UPDATE DATABASE - ANTI "UNDEFINED" UUID
      let updateResult = null;
      let dbError = null;
      
      // Validasi ketat format UUID (Harus 36 karakter dan bukan string "undefined")
      const isValidUUID = rawId && rawId.length === 36 && rawId !== "undefined";

      if (isValidUUID) {
        console.log("Mencoba update via ID valid:", rawId);
        const { data, error } = await supabase
          .from('list_tunggu_peserta')
          .update({ foto: publicUrl })
          .eq('id', rawId)
          .select();
        updateResult = data;
        dbError = error;
      } 
      
      // Jika ID tidak valid/gagal, gunakan filter Nama & Batasan Waktu (1 Jam Terakhir)
      if (!updateResult || updateResult.length === 0) {
        console.warn("ID tidak valid/kosong, menggunakan filter cadangan (Nama & Waktu)...");
        const satuJamLalu = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        
        const { data, error } = await supabase
          .from('list_tunggu_peserta')
          .update({ foto: publicUrl })
          .ilike('nama_peserta', `%${savedName}%`)
          .gt('created_at', satuJamLalu) // Klausa WHERE tambahan agar aman
          .order('created_at', { ascending: false })
          .limit(1)
          .select();
        updateResult = data;
        dbError = error;
      }

      if (dbError) throw new Error(`Database Reject: ${dbError.message}`);

      // 7. Finalisasi UI
      if (updateResult && updateResult.length > 0) {
        setIsCompleted(true);
        setShowModal(true);
      } else {
        throw new Error("Sistem tidak dapat menemukan data pendaftaran Anda. Pastikan Anda telah mengisi formulir dengan benar.");
      }

    } catch (error) {
      console.error("Detail Error:", error);
      alert(`⚠️ ${error.message}`);
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
      {/* Background Decor */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-red-500/5 rounded-full blur-3xl"></div>

      {/* Success Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] max-w-sm w-full p-8 shadow-2xl relative animate-scaleIn border-[8px] border-indigo-50">
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 p-4 rounded-full"><CheckCircle size={48} className="text-green-600" /></div>
            </div>
            <h3 className="text-xl font-black text-[#1A1A40] mb-3 text-center uppercase tracking-tighter">Data Berhasil Dikirim!</h3>
            <p className="text-slate-500 text-sm text-center leading-relaxed mb-8 font-medium">
              Terima kasih, berkas Anda telah tersimpan. Mohon menunggu proses <span className="text-indigo-600 font-bold">verifikasi admin</span>.
            </p>
            <button onClick={handleFinalize} className="w-full py-4 bg-[#1A1A40] text-white rounded-2xl font-black tracking-widest hover:bg-indigo-600 transition-all shadow-lg active:scale-95 uppercase text-xs">
              Saya Mengerti & Setuju
            </button>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 text-center border-[12px] border-indigo-50/50 relative z-10 animate-scaleIn">
        <div className="flex justify-center mb-6 relative">
          <div className={`p-6 rounded-full transition-all duration-700 ${isCompleted ? 'bg-green-100 scale-110' : 'bg-amber-100 rotate-12'}`}>
            {isCompleted ? <CheckCircle size={64} className="text-green-600 animate-pulse" /> : <AlertCircle size={64} className="text-amber-600" />}
          </div>
          <div className="absolute bottom-0 right-1/4 bg-[#1A1A40] text-white p-2 rounded-xl shadow-lg border-2 border-white"><UserCheck size={16} /></div>
        </div>

        <h2 className="text-xs font-black text-indigo-500 tracking-[0.3em] uppercase mb-2">Halo, {userName}!</h2>
        <h1 className="text-2xl font-black text-[#1A1A40] mb-2 tracking-tighter uppercase">{isCompleted ? "PENDAFTARAN SELESAI!" : "TAHAP VERIFIKASI"}</h1>
        <p className="text-slate-500 font-medium leading-relaxed mb-8 text-sm">
          {isCompleted ? "Luar biasa! Seluruh berkas telah kami terima." : "Data pendaftaran Anda sudah masuk, namun WAJIB mengunggah Foto KTP."}
        </p>

        <div className={`rounded-3xl p-6 mb-8 border-2 border-dashed transition-all duration-500 ${isCompleted ? 'bg-emerald-50 border-emerald-200' : 'bg-indigo-50 border-indigo-200 shadow-inner'}`}>
          {!isCompleted ? (
            <label htmlFor="file-upload" className="w-full cursor-pointer group">
              <div className="flex flex-col items-center justify-center bg-white border-2 border-indigo-100 rounded-2xl p-6 transition-all group-hover:border-indigo-400">
                {uploading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="text-indigo-600 animate-spin mb-2" size={32} />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Memproses Berkas...</span>
                  </div>
                ) : (
                  <>
                    <Upload className="text-indigo-500 mb-2 group-hover:-translate-y-1 transition-transform" size={32} />
                    <span className="text-sm font-black text-indigo-900 uppercase">KLIK UNTUK UNGGAH</span>
                    <p className="text-[9px] text-slate-400 mt-1 font-bold italic underline">FOTO KTP (JPG / PNG)</p>
                  </>
                )}
              </div>
              <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
            </label>
          ) : (
            <div className="flex items-center justify-center gap-4 py-2">
              <div className="bg-emerald-500 text-white p-3 rounded-2xl shadow-lg rotate-3"><FileText size={24} /></div>
              <div className="text-left">
                <p className="text-xs font-black text-emerald-800 uppercase">BERKAS MASUK!</p>
                <p className="text-[10px] text-emerald-600 font-bold italic">Terverifikasi oleh Sistem Juara.</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {isCompleted ? (
            <button onClick={handleFinalize} className="flex items-center justify-center gap-3 w-full py-5 bg-[#1A1A40] text-white rounded-2xl font-black tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-xl uppercase text-xs">
              <Home size={20} /> SELESAI & KELUAR
            </button>
          ) : (
            <div className="flex flex-col gap-2">
               <button disabled className="flex items-center justify-center gap-3 w-full py-5 bg-slate-100 text-slate-400 rounded-2xl font-black tracking-widest cursor-not-allowed uppercase text-[10px]">Tombol Keluar Terkunci</button>
               <div className="flex items-center justify-center gap-1.5"><span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span><p className="text-[9px] text-rose-500 font-black uppercase italic">Wajib unggah berkas untuk aktivasi tombol</p></div>
            </div>
          )}
          <a href="#" className="flex items-center justify-center gap-3 w-full py-4 bg-white text-[#1A1A40] border-2 border-slate-100 rounded-2xl font-bold hover:bg-slate-50 transition-all text-sm group">
            <MessageCircle size={18} className="text-green-500 group-hover:rotate-12 transition-transform" /> HUBUNGI BANTUAN
          </a>
        </div>
        <p className="mt-10 text-[9px] text-slate-300 font-bold uppercase tracking-[0.3em]">Dinas Tenaga Kerja & Perindustrian Kota Madiun</p>
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