"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, 
  Loader2, 
  CheckCircle2, 
  X,
  Phone // Tambahkan icon phone untuk mempercantik
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
      const { data, error } = await (supabase as any)
        .from('support_tickets')
        .select('*')
        .eq('ticket_number', ticketId.trim())
        .single();

      if (error) throw new Error('Tiket tidak ditemukan.');
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
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-700 mb-1">{statusData.subject}</p>
              <p className="text-[11px] text-slate-500 italic">"{statusData.admin_update || 'Menunggu respon admin.'}"</p>
            </div>
            <button onClick={() => {setStatusData(null); setTicketId('');}} className="w-full text-xs text-blue-600 font-medium hover:underline">Cari Tiket Lain</button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Halaman Utama ---
const SupportPage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultTicket, setResultTicket] = useState<string | null>(null);

  const handleSubmitTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const ticketNo = `TKT-${Math.floor(10000 + Math.random() * 90000)}`;

    const payload = {
      ticket_number: String(ticketNo),
      full_name: String(formData.get('fullName') || ''),
      phone_number: String(formData.get('phoneNumber') || ''), // Pastikan ini terkirim
      ikm_name: String(formData.get('ikmName') || ''),
      subject: String(formData.get('subject') || ''),
      description: String(formData.get('description') || ''),
      status: 'Open',
      admin_update: 'Tiket berhasil dibuat. Menunggu respon admin.'
    };

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/rest/v1/support_tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey!,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal mengirim ke database');
      }

      setResultTicket(ticketNo);
      form.reset();
    } catch (err: any) {
      console.error("Final Debug Error:", err);
      alert(`Gagal: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans relative">
      {/* Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-indigo-900 p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">Buat Tiket Bantuan</h2>
              <button onClick={() => {setIsFormOpen(false); setResultTicket(null);}} className="p-2 rounded-full hover:bg-white/10 transition-colors"><X size={20} /></button>
            </div>
            <div className="p-8">
              {!resultTicket ? (
                <form onSubmit={handleSubmitTicket} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 ml-1">NAMA LENGKAP</label>
                        <input required name="fullName" type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Budi Santoso" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 ml-1">NAMA IKM</label>
                        <input required name="ikmName" type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="IKM Maju Jaya" />
                    </div>
                  </div>

                  {/* INPUT NOMOR WHATSAPP BARU */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 ml-1">NOMOR WHATSAPP</label>
                    <div className="relative">
                        <input 
                          required 
                          name="phoneNumber" 
                          type="tel" 
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                          placeholder="08123456789" 
                        />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 ml-1">SUBJEK</label>
                    <input required name="subject" type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Masalah Login / Akun" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 ml-1">DETAIL MASALAH</label>
                    <textarea required name="description" rows={4} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" placeholder="Jelaskan detail kendala Anda..."></textarea>
                  </div>
                  <button disabled={isSubmitting} type="submit" className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20">
                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Kirim Aduan"}
                  </button>
                </form>
              ) : (
                <div className="py-10 text-center animate-in zoom-in-90 duration-300">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} className="text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Tiket Berhasil Dibuat!</h3>
                  <p className="text-sm text-slate-500 mb-6 px-4">Simpan nomor tiket Anda untuk memantau status bantuan.</p>
                  <div className="bg-indigo-50 p-4 rounded-2xl mb-6">
                    <p className="text-[10px] font-bold text-indigo-400 mb-1 uppercase tracking-wider">Nomor Tiket</p>
                    <p className="text-2xl font-mono font-black text-indigo-600">{resultTicket}</p>
                  </div>
                  <button onClick={() => {setResultTicket(null); setIsFormOpen(false);}} className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">Tutup Jendela</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hero & Main Content (Tetap sama) */}
      <div className="bg-indigo-900 py-24 text-center text-white relative overflow-hidden">
        <div className="relative z-10">
            <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Pusat Bantuan IKM</h1>
            <p className="text-indigo-100 mb-10 max-w-lg mx-auto text-sm md:text-base px-6">Punya kendala dengan sistem? Tim admin kami siap membantu Anda menyelesaikan masalah secepat mungkin.</p>
            <button onClick={() => setIsFormOpen(true)} className="bg-orange-500 hover:bg-orange-600 transition-all px-10 py-4 rounded-full font-bold shadow-xl shadow-orange-900/40 hover:scale-105 active:scale-95">Buat Tiket Baru</button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-16 -mt-10 relative z-20">
        <TrackingTicket />
        {/* Step-step panduan tetap sama */}
      </main>
    </div>
  );
};

export default SupportPage;