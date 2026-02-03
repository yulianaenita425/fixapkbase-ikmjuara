"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Search, Ticket, Clock, CheckCircle2, 
  ExternalLink, MessageSquare, Filter, RefreshCcw 
} from "lucide-react";

export default function AdminSupportManagement() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setTickets(data);
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string, message: string) => {
    setUpdating(id);
    const { error } = await supabase
      .from("support_tickets")
      .update({ 
        status: newStatus, 
        admin_update: message,
        updated_at: new Date().toISOString() 
      })
      .eq("id", id);

    if (!error) fetchTickets();
    setUpdating(null);
  };

  return (
    <div className="p-6 md:p-10 bg-[#F8FAFC] min-h-screen font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-black text-[#1A1A40] uppercase tracking-tighter">
              Support <span className="text-indigo-600">Tickets</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium">Kelola dan respon aduan IKM secara real-time.</p>
          </div>
          <button 
            onClick={fetchTickets}
            className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
          >
            <RefreshCcw size={14} className={loading ? "animate-spin" : ""} /> Refresh Data
          </button>
        </div>

        {/* List Tiket */}
        <div className="grid gap-4">
          {loading ? (
            <div className="py-20 text-center text-slate-400 font-bold animate-pulse">Memuat database tiket...</div>
          ) : tickets.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-3xl py-20 text-center">
              <Ticket className="mx-auto text-slate-200 mb-4" size={48} />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Belum ada aduan masuk</p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <div key={ticket.id} className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row gap-6 items-start">
                
                {/* Info Utama */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg text-sm">
                      {ticket.ticket_number}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                      ticket.status === 'Open' ? 'bg-red-50 text-red-600' : 
                      ticket.status === 'On Process' ? 'bg-orange-50 text-orange-600' : 
                      'bg-green-50 text-green-600'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                  <h3 className="font-black text-slate-800 text-lg">{ticket.subject}</h3>
                  <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5"><Clock size={14} /> {new Date(ticket.created_at).toLocaleDateString('id-ID')}</span>
                    <span className="flex items-center gap-1.5"><MessageSquare size={14} /> {ticket.full_name} ({ticket.ikm_name})</span>
                  </div>
                  <p className="text-slate-600 text-sm bg-slate-50 p-4 rounded-2xl italic leading-relaxed border-l-4 border-indigo-200">
                    "{ticket.description}"
                  </p>
                </div>

                {/* Aksi Admin */}
                <div className="w-full lg:w-72 space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Respon Admin</p>
                  <select 
                    disabled={updating === ticket.id}
                    onChange={(e) => {
                      const msg = e.target.value === 'On Process' ? 'Sedang diverifikasi oleh tim teknis.' : 'Masalah telah diselesaikan.';
                      updateStatus(ticket.id, e.target.value, msg);
                    }}
                    value={ticket.status}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Open">Set Open</option>
                    <option value="On Process">Set On Process</option>
                    <option value="Closed">Set Closed (Selesai)</option>
                  </select>
                  
                  <div className="p-3 bg-indigo-900 rounded-xl">
                    <p className="text-[9px] text-indigo-300 font-bold uppercase mb-1">Status Terkini ke User:</p>
                    <p className="text-[10px] text-white italic">"{ticket.admin_update}"</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}