"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  FileText, Clock, ChevronRight, 
  Download, Send, Search, 
  Loader2, CheckCircle2, AlertCircle, X,
  User, Building2, LayoutDashboard, Settings2, MessageSquare,
  Phone // Icon baru ditambahkan
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
    try {
      const { data, error } = await supabase
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
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
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
              <p className="text-[11px] text-slate-500 italic">"{statusData.admin_update || 'Belum ada update dari admin.'}"</p>
            </div>
            <button onClick={() => {setStatusData(null); setTicketId('');}} className="w-full text-xs text-blue-600 font-medium hover:underline">Cari Tiket Lain</button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Komponen: Admin Dashboard View ---
const AdminDashboard = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setTickets(data);
    setLoading(false);
  };

  const handleUpdateStatus = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUpdating(true);
    const formData = new FormData(e.currentTarget);
    
    const { error } = await supabase
      .from('support_tickets')
      .update({
        status: formData.get('status'),
        admin_update: formData.get('admin_update'),
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedTicket.id);

    if (!error) {
      await fetchTickets();
      setSelectedTicket(null);
      alert("Tiket berhasil diperbarui!");
    }
    setUpdating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <LayoutDashboard className="text-indigo-600" /> Kelola Aduan ({tickets.length})
        </h2>
        <button onClick={fetchTickets} className="p-2 hover:bg-slate-200 rounded-lg transition-colors"><Settings2 size={20} /></button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
      ) : (
        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-blue-300 transition-all">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-blue-600">{ticket.ticket_number}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    ticket.status === 'Closed' ? 'bg-green-100 text-green-600' : ticket.status === 'On Process' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'
                  }`}>{ticket.status}</span>
                </div>
                <h4 className="font-bold text-slate-800">{ticket.subject}</h4>
                <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1"><User size={12} /> {ticket.full_name}</span>
                    <span className="flex items-center gap-1"><Building2 size={12} /> {ticket.ikm_name}</span>
                    <span className="flex items-center gap-1 text-green-600 font-medium"><Phone size={12} /> {ticket.phone_number}</span>
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <a 
                    href={`https://wa.me/${ticket.phone_number?.replace(/[^0-9]/g, '').replace(/^0/, '62')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                >
                    <Send size={14} /> Hubungi WA
                </a>

                <button 
                    onClick={() => setSelectedTicket(ticket)}
                    className="bg-slate-100 hover:bg-indigo-600 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                >
                    <MessageSquare size={14} /> Kelola Tiket
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Edit Tiket */}
      {selectedTicket && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Update Tiket: {selectedTicket.ticket_number}</h3>
              <button onClick={() => setSelectedTicket(null)}><X size={20}/></button>
            </div>
            <form onSubmit={handleUpdateStatus} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Status Aduan</label>
                <select name="status" defaultValue={selectedTicket.status} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm">
                  <option value="Open">Open</option>
                  <option value="On Process">On Process</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Pesan Balasan Admin</label>
                <textarea 
                  name="admin_update" 
                  defaultValue={selectedTicket.admin_update}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm h-32 resize-none"
                  placeholder="Tulis instruksi atau jawaban untuk pelapor..."
                />
              </div>
              <button disabled={updating} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:bg-slate-300">
                {updating ? "Menyimpan..." : "Update & Kirim Notifikasi"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Halaman Utama & Form Pengaduan ---
const SupportPage = () => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultTicket, setResultTicket] = useState<string | null>(null);

  const handleSubmitTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const ticketNo = `TKT-${Math.floor(10000 + Math.random() * 90000)}`;
    const payload = {
      ticket_number: ticketNo,
      full_name: formData.get('fullName')?.toString() || '',
      phone_number: formData.get('phoneNumber')?.toString() || '', // Data WA User
      ikm_name: formData.get('ikmName')?.toString() || '',
      subject: formData.get('subject')?.toString() || '',
      description: formData.get('description')?.toString() || '',
      status: 'Open',
      admin_update: 'Tiket berhasil dibuat. Menunggu respon admin.'
    };

    try {
      const { error } = await supabase.from('support_tickets').insert([payload]); 
      if (error) throw error;
      setResultTicket(ticketNo);
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans relative">
      
      {/* Tab Switcher */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 bg-white/80 backdrop-blur-md p-1.5 rounded-2xl shadow-lg border border-white/20 flex gap-1">
        <button onClick={() => setIsAdminMode(false)} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${!isAdminMode ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}>Tampilan User</button>
        <button onClick={() => setIsAdminMode(true)} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${isAdminMode ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}>Tampilan Admin</button>
      </div>

      {/* Hero Section */}
      {!isAdminMode && (
        <div className="bg-gradient-to-br from-indigo-900 via-blue-800 to-blue-700 py-24 px-4 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Pusat Bantuan IKM</h1>
          <p className="text-blue-100 text-lg">Kelola dan pantau pengaduan Anda dengan mudah.</p>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-20">
        {isAdminMode ? (
          <AdminDashboard />
        ) : (
          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-8">
               <h2 className="text-2xl font-bold flex items-center gap-3"><FileText className="text-blue-600" /> Layanan Bantuan</h2>
               <div className="grid sm:grid-cols-2 gap-4">
                  {["Panduan Akun", "Pendaftaran IKM", "Konsultasi Bisnis", "Masalah Teknis"].map((t, i) => (
                    <div key={i} className="p-6 bg-white border border-slate-200 rounded-3xl hover:border-blue-500 transition-all cursor-pointer group">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all"><Download size={20}/></div>
                      <h4 className="font-bold text-slate-800">{t}</h4>
                      <p className="text-[11px] text-slate-500 mt-1">Unduh dokumen PDF panduan lengkap.</p>
                    </div>
                  ))}
               </div>
            </div>
            <div className="space-y-6">
              <TrackingTicket />
              <div className="bg-indigo-900 text-white p-8 rounded-3xl shadow-xl">
                <h3 className="text-xl font-bold mb-6">Butuh Bantuan?</h3>
                <button onClick={() => setIsFormOpen(true)} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2">
                  <Send size={18} /> Buat Tiket
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
           <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
             <div className="bg-indigo-900 p-6 text-white flex justify-between items-center">
               <h2 className="text-xl font-bold">Buat Tiket</h2>
               <button onClick={() => {setIsFormOpen(false); setResultTicket(null);}}><X /></button>
             </div>
             <div className="p-8">
               {!resultTicket ? (
                 <form onSubmit={handleSubmitTicket} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <input required name="fullName" placeholder="Nama Lengkap" className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                      <input required name="ikmName" placeholder="Nama IKM" className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    {/* INPUT WA BARU */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 ml-1">NOMOR WHATSAPP</label>
                      <input required name="phoneNumber" type="tel" placeholder="08123456789" className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <input required name="subject" placeholder="Subjek Masalah" className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    <textarea required name="description" rows={4} placeholder="Jelaskan detail kendala Anda..." className="w-full p-3 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                    <button disabled={isSubmitting} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-orange-500/30">
                      {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={20}/> : "Kirim Sekarang"}
                    </button>
                 </form>
               ) : (
                 <div className="text-center py-10 animate-in zoom-in-90">
                   <CheckCircle2 size={60} className="text-green-500 mx-auto mb-4" />
                   <h3 className="font-bold text-xl text-slate-800">Tiket Terkirim!</h3>
                   <p className="text-slate-500 text-sm mb-6 px-10">Gunakan nomor ini untuk memantau status aduan Anda.</p>
                   <div className="bg-blue-50 p-4 rounded-2xl inline-block mb-6 border border-blue-100">
                      <p className="text-blue-600 font-mono text-2xl font-black">{resultTicket}</p>
                   </div>
                   <br/>
                   <button onClick={() => {setIsFormOpen(false); setResultTicket(null);}} className="text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors">Tutup Jendela</button>
                 </div>
               )}
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default SupportPage;