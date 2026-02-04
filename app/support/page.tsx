"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, 
  Loader2, 
  CheckCircle2, 
  X
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
      // Menggunakan (supabase as any) untuk membungkam TS2344
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
      ticket_number: ticketNo,
      full_name: String(formData.get('fullName') || ''),
      ikm_name: String(formData.get('ikmName') || ''),
      subject: String(formData.get('subject') || ''),
      description: String(formData.get('description') || ''),
      status: 'Open',
      admin_update: 'Tiket berhasil dibuat.'
    };

    try {
      // Menggunakan (supabase as any) di sini juga
      const { error } = await (supabase as any)
        .from('support_tickets')
        .insert([payload])
        .select(); 

      if (error) throw error;
      
      setResultTicket(ticketNo);
      form.reset();
    } catch (err: any) {
      console.error("Critical Error:", err);
      alert(`Gagal mengirim: ${err.message || 'Terjadi kesalahan internal'}`);
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
              <h2 className="text-xl font-bold">Buat Tiket Bantuan</h2>
              <button onClick={() => {setIsFormOpen(false); setResultTicket(null);}} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="p-8">
              {!resultTicket ? (
                <form onSubmit={handleSubmitTicket} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input required name="fullName" type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Nama Lengkap" />
                    <input required name="ikmName" type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Nama IKM" />
                  </div>
                  <input required name="subject" type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Subjek" />
                  <textarea required name="description" rows={4} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Detail Masalah"></textarea>
                  <button disabled={isSubmitting} type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2">
                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Kirim Aduan"}
                  </button>
                </form>
              ) : (
                <div className="py-10 text-center">
                  <CheckCircle2 size={40} className="text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold">Terkirim!</h3>
                  <p className="text-sm">Nomor Tiket: <span className="font-mono font-bold text-indigo-600">{resultTicket}</span></p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-indigo-900 py-20 text-center text-white">
        <h1 className="text-4xl font-extrabold mb-4">Pusat Bantuan IKM</h1>
        <button onClick={() => setIsFormOpen(true)} className="bg-orange-500 px-8 py-3 rounded-full font-bold">Buat Tiket Baru</button>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <TrackingTicket />
      </main>
    </div>
  );
};

export default SupportPage;