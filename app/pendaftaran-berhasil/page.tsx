"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const savedName = localStorage.getItem("user_name_ikm");
    const savedId = localStorage.getItem("user_id_ikm");
    if (savedName) setUserName(savedName);
    if (savedId) setUserId(savedId);
  }, []);

  const handleUpload = async (e) => {
    let file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      // 1. Kompresi Gambar
      if (file.type.startsWith("image/")) {
        const options = { maxSizeMB: 0.2, maxWidthOrHeight: 1280, useWebWorker: true };
        try { file = await imageCompression(file, options); } catch (err) { console.error(err); }
      }

      // 2. Persiapan Path Storage
      const fileExt = file.name.split('.').pop();
      const cleanName = userName.trim().replace(/\s+/g, '-').toLowerCase();
      const fileName = `${cleanName}-${Date.now()}.${fileExt}`;
      const filePath = `dokumen_pendaftar/${fileName}`;

      // 3. Upload ke Storage berkas-ikm
      const { error: uploadError } = await supabase.storage
        .from('berkas-ikm') 
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 4. Ambil Public URL
      const { data: publicUrlData } = supabase.storage.from('berkas-ikm').getPublicUrl(filePath);
      const publicUrl = publicUrlData.publicUrl;

      // 5. Update Database list_tunggu_peserta
      // LOGIKA: Cari nama yang mirip (ilike) dan ambil yang paling baru (created_at)
      const { data: updateResult, error: dbError } = await supabase
        .from('list_tunggu_peserta')
        .update({ foto: publicUrl })
        .ilike('nama_peserta', `%${userName.trim()}%`) // Pencarian lebih fleksibel
        .order('created_at', { ascending: false })
        .limit(1)
        .select();

      if (dbError) throw dbError;

      // VALIDASI: Jika updateResult ada isinya, berarti kolom foto berhasil terisi
      if (updateResult && updateResult.length > 0) {
        console.log("Database Berhasil Terupdate:", updateResult);
        setIsCompleted(true); // MENGAKTIFKAN TOMBOL TENGAH & KELUAR
        setShowModal(true);   // MEMUNCULKAN POP-UP SUKSES
      } else {
        // Jika masih gagal cari nama, gunakan fallback ID jika ada
        alert("⚠️ Nama pendaftar tidak ditemukan di database. Pastikan pendaftaran sebelumnya berhasil.");
      }

    } catch (error) {
      console.error("Critical Error:", error);
      alert("Gagal mengunggah: " + error.message);
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
      {/* Decorative background tetap sama */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
      
      {/* MODAL POP-UP */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] max-w-sm w-full p-8 shadow-2xl relative animate-scaleIn border-[8px] border-indigo-50">
            <div className="flex justify-center mb-6"><div className="bg-green-100 p-4 rounded-full"><CheckCircle size={48} className="text-green-600" /></div></div>
            <h3 className="text-xl font-black text-[#1A1A40] mb-3 text-center uppercase">Data Berhasil Dikirim!</h3>
            <p className="text-slate-500 text-sm text-center mb-8">Berkas tersimpan. Admin akan segera memverifikasi data Anda.</p>
            <button onClick={handleFinalize} className="w-full py-4 bg-[#1A1A40] text-white rounded-2xl font-black hover:bg-indigo-600 transition-all uppercase text-xs">Saya Mengerti</button>
          </div>
        </div>
      )}

      {/* MAIN CARD */}
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 text-center border-[12px] border-indigo-50/50 relative z-10 animate-scaleIn">
        <div className="flex justify-center mb-6 relative">
          <div className={`p-6 rounded-full transition-all duration-700 ${isCompleted ? 'bg-green-100' : 'bg-amber-100'}`}>
            {isCompleted ? <CheckCircle size={64} className="text-green-600" /> : <AlertCircle size={64} className="text-amber-600" />}
          </div>
        </div>

        <h2 className="text-xs font-black text-indigo-500 tracking-[0.3em] uppercase mb-2">Halo, {userName}!</h2>
        <h1 className="text-2xl font-black text-[#1A1A40] mb-2 uppercase">{isCompleted ? "PENDAFTARAN SELESAI!" : "TAHAP VERIFIKASI"}</h1>
        <p className="text-slate-500 mb-8 text-sm">{isCompleted ? "Seluruh berkas telah diterima." : "Data masuk, sekarang unggah foto KTP Anda."}</p>

        {/* Upload Box */}
        <div className={`rounded-3xl p-6 mb-8 border-2 border-dashed ${isCompleted ? 'bg-emerald-50 border-emerald-200' : 'bg-indigo-50 border-indigo-200'}`}>
          {!isCompleted ? (
            <label className="w-full cursor-pointer group">
              <div className="flex flex-col items-center justify-center bg-white border-2 border-indigo-100 rounded-2xl p-6">
                {uploading ? <Loader2 className="text-indigo-600 animate-spin" size={32} /> : <><Upload className="text-indigo-500 mb-2" size={32} /><span className="text-sm font-black text-indigo-900 uppercase">UNGGAH FOTO</span></>}
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
            </label>
          ) : (
            <div className="flex items-center justify-center gap-4 py-2">
              <div className="bg-emerald-500 text-white p-3 rounded-2xl shadow-lg"><FileText size={24} /></div>
              <div className="text-left">
                <p className="text-xs font-black text-emerald-800 uppercase">BERKAS MASUK!</p>
                <p className="text-[10px] text-emerald-600 font-bold">Terverifikasi Sistem.</p>
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="space-y-4">
          {isCompleted ? (
            <button onClick={handleFinalize} className="flex items-center justify-center gap-3 w-full py-5 bg-[#1A1A40] text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-indigo-600">
              <Home size={20} /> SELESAI & KELUAR
            </button>
          ) : (
            <div className="flex flex-col gap-2">
               <button disabled className="w-full py-5 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase text-[10px] cursor-not-allowed">Tombol Terkunci</button>
               <p className="text-[9px] text-rose-500 font-black uppercase italic">Unggah berkas untuk aktivasi</p>
            </div>
          )}
          <a href="#" className="flex items-center justify-center gap-3 w-full py-4 bg-white text-[#1A1A40] border-2 border-slate-100 rounded-2xl font-bold text-sm hover:bg-slate-50">
            <MessageCircle size={18} className="text-green-500" /> HUBUNGI BANTUAN
          </a>
        </div>
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