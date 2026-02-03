"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  FileText, Clock, ChevronRight, 
  Download, Send, Search, 
  Loader2, CheckCircle2, AlertCircle, X,
  User, Building2
} from 'lucide-react';

// --- Sub-Komponen: Tracking Ticket ---
const TrackingTicket = () => {
  const [ticketId, setTicketId] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusData, setStatusData] = useState<any>(null);
  const [error, setError] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId) return;
    
    setLoading(true);
    setError('');
    setStatusData(null);

    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('ticket_number', ticketId.trim())
        .single();

      if (error) throw new Error('Tiket tidak ditemukan. Periksa kembali nomor tiket Anda.');
      setStatusData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-bold text-lg flex items-center gap-2 text-indigo-900">
          <Search size={20} className="text-blue-600" />
          Lacak Tiket Bantuan
        </h3>
      </div>
      <div className="p-6">
        {!statusData ? (
          <form onSubmit={handleTrack} className="space-y-4">
            <input
              type="text"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value.toUpperCase())}
              placeholder="CONTOH: TKT-12345"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm"
            />
            {error && <p className="text-red-500 text-[10px] font-medium px-1 italic">{error}</p>}
            <button disabled={loading || !ticketId} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={18} /> : "Cek Status"}
            </button>
          </form>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-start">
              <p className="text-lg font-mono font-bold text-blue-600">{statusData.ticket_number}</p>
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                statusData.status === 'Closed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
              }`}>
                {statusData.status}
              </div>
            </div>
            
            <div className="relative flex justify-between px-2">
              <div className="absolute top-3 left-0 w-full h-0.5 bg-slate-100"></div>
              <div 
                className={`absolute top-3 left-0 h-0.5 bg-blue-500 transition-all duration-1000 ${
                  statusData.status === 'Open' ? 'w-0' : statusData.status === 'On Process' ? 'w-1/2' : 'w-full'
                }`}
              ></div>
              <StepIcon active={true} done={statusData.status !== 'Open'} label="Open" />
              <StepIcon active={statusData.status !== 'Open'} done={statusData.status === 'Closed'} label="Process" />
              <StepIcon active={statusData.status === 'Closed'} done={statusData.status === 'Closed'} label="Done" />
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-700 mb-1">{statusData.subject}</p>
              <p className="text-[11px] text-slate-500 italic">"{statusData.admin_update || 'Belum ada update dari admin.'}"</p>
              <p className="text-[9px] text-slate-400 mt-3">Update: {new Date(statusData.updated_at).toLocaleDateString('id-ID')}</p>
            </div>
            <button onClick={() => {setStatusData(null); setTicketId('');}} className="w-full text-xs text-blue-600 font-medium hover:underline">Cari Tiket Lain</button>
          </div>
        )}
      </div>
    </div>
  );
};

const StepIcon = ({ active, done, label }: { active: boolean, done: boolean, label: string }) => (
  <div className="relative flex flex-col items-center gap-2">
    <div className={`z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
      done ? 'bg-blue-600 text-white' : active ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-slate-200 text-slate-400'
    }`}>
      {done ? <CheckCircle2 size={12} /> : active ? <Clock size={12} /> : <AlertCircle size={12} />}
    </div>
    <span className={`text-[9px] font-bold uppercase ${active ? 'text-blue-600' : 'text-slate-400'}`}>{label}</span>
  </div>
);

// --- Halaman Utama & Form Pengaduan ---
const SupportPage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultTicket, setResultTicket] = useState<string | null>(null);

  /**
   * Fungsi handleSubmitTicket (VERSI TERBARU)
   * Menggunakan objek JSON murni (payload) untuk menghindari error Content-Type
   */
  const handleSubmitTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Mengambil data dari elemen form
    const formData = new FormData(e.currentTarget);
    const ticketNo = `TKT-${Math.floor(10000 + Math.random() * 90000)}`;

    // Menyiapkan data dalam bentuk objek JavaScript murni
    const payload = {
      ticket_number: ticketNo,
      full_name: formData.get('fullName')?.toString() || '',
      ikm_name: formData.get('ikmName')?.toString() || '',
      subject: formData.get('subject')?.toString() || '',
      description: formData.get('description')?.toString() || '',
      status: 'Open',
      admin_update: 'Tiket berhasil dibuat. Menunggu respon admin.'
    };

    try {
      // Mengirim objek 'payload' ke Supabase
      const { error } = await supabase
        .from('support_tickets')
        .insert([payload]); 

      if (error) throw error;
      setResultTicket(ticketNo);
    } catch (err: any) {
      console.error("Detail Error:", err);
      // Menampilkan pesan error spesifik jika gagal
      alert(`Gagal mengirim aduan: ${err.message || 'Terjadi kesalahan sistem'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans relative">
      
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-indigo-900 p-6 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Buat Tiket Bantuan</h2>
                <p className="text-indigo-200 text-xs">Admin akan segera merespon kendala Anda.</p>
              </div>
              <button onClick={() => {setIsFormOpen(false); setResultTicket(null);}} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-8">
              {!resultTicket ? (
                <form onSubmit={handleSubmitTicket} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 ml-1">Nama Lengkap</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input required name="fullName" type="text" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm" placeholder="Andi Pratama" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 ml-1">Nama IKM</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input required name="ikmName" type="text" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm" placeholder="IKM Madiun Jaya" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 ml-1">Subjek Kendala</label>
                    <input required name="subject" type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm" placeholder="Contoh: Masalah Login Akun" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 ml-1">Detail Masalah</label>
                    <textarea required name="description" rows={4} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm resize-none" placeholder="Ceritakan detail kendala Anda..."></textarea>
                  </div>
                  <button disabled={isSubmitting} type="submit" className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2">
                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} /> Kirim Aduan</>}
                  </button>
                </form>
              ) : (
                <div className="py-10 text-center animate-in zoom-in-95 duration-500">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Aduan Terkirim!</h3>
                  <p className="text-slate-500 text-sm mt-2">Nomor Tiket: <span className="font-mono font-bold text-indigo-600">{resultTicket}</span></p>
                  <p className="text-[10px] text-slate-400 mt-4 italic">Harap simpan nomor tiket untuk pengecekan status berkala.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hero & Content */}
      <div className="bg-gradient-to-br from-indigo-900 via-blue-800 to-blue-700 py-24 px-4 text-center text-white">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-4">Kami Siap Mendampingi Anda</h1>
        <p className="text-blue-100 text-lg md:text-xl mb-8">IKM JUARA – Dari Lokal Berkarya, ke Global Berdaya!</p>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><FileText className="text-blue-600" /> Pusat Panduan</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {["Daftar Akun", "Profil Usaha", "Layanan Konsultasi", "Keamanan Akun"].map((t, i) => (
                <div key={i} className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:bg-blue-50 transition-all">
                  <span className="text-sm font-bold text-slate-700">{t}</span>
                  <Download size={18} className="text-slate-300" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <TrackingTicket />
            <div className="bg-indigo-900 text-white p-8 rounded-3xl shadow-xl">
              <h3 className="text-xl font-bold mb-6">Butuh Bantuan?</h3>
              <button onClick={() => setIsFormOpen(true)} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2">
                <Send size={18} /> Buat Tiket Bantuan
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SupportPage;