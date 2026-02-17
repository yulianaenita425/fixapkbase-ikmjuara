"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { 
  Users, 
  FileCheck, 
  ExternalLink, 
  Search, 
  RefreshCcw, 
  Trash2,
  CheckCircle2,
  Clock,
  ChevronRight,
  Loader2,
  FileText,
  Filter
} from "lucide-react";

export default function BerkasMasukPage() {
  const [pendaftar, setPendaftar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPelatihan, setFilterPelatihan] = useState("");
  const [listPelatihan, setListPelatihan] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('list_tunggu_peserta')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setPendaftar(data || []);
      
      if (data) {
        const unik = Array.from(new Set(data.map((item: any) => item.nama_pelatihan)))
          .filter(name => name) as string[];
        setListPelatihan(unik);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data pendaftar: ${name}?`)) {
      const { error } = await supabase
        .from('list_tunggu_peserta')
        .delete()
        .eq('id', id);

      if (error) {
        alert("Gagal menghapus data.");
      } else {
        setPendaftar(pendaftar.filter(item => item.id !== id));
      }
    }
  };

  const filteredData = pendaftar.filter(item => {
    const matchSearch = 
      (item.nama_peserta?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (item.nama_usaha?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    
    const matchPelatihan = filterPelatihan === "" || item.nama_pelatihan === filterPelatihan;

    return matchSearch && matchPelatihan;
  });

  return (
    <div className="min-h-screen bg-[#F1F5F9] p-6 lg:p-12">
      <div className="max-w-7xl mx-auto">
        
        {/* BREADCRUMB & TITLE */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
            <span>Admin</span>
            <ChevronRight size={12} />
            <span className="text-indigo-600">Berkas Masuk</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black text-[#1A1A40] tracking-tighter uppercase">
                Inbox Pendaftar <span className="text-indigo-600">.</span>
              </h1>
              <p className="text-slate-500 font-medium mt-1">Kelola data pelaku usaha yang baru masuk.</p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select 
                  className="pl-11 pr-8 py-4 bg-white border-none shadow-sm rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-xs uppercase tracking-tight appearance-none cursor-pointer text-slate-600"
                  value={filterPelatihan}
                  onChange={(e) => setFilterPelatihan(e.target.value)}
                >
                  <option value="">Semua Pelatihan</option>
                  {listPelatihan.map((p, idx) => (
                    <option key={idx} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="Cari Nama / Usaha..."
                  className="pl-12 pr-6 py-4 bg-white border-none shadow-sm rounded-2xl focus:ring-2 focus:ring-indigo-500 w-full md:w-64 transition-all font-medium"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <button 
                onClick={fetchData}
                className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
              >
                <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
        </div>

        {/* STATS MINI */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Data Ditampilkan</p>
                <p className="text-2xl font-black text-[#1A1A40]">{filteredData.length} <span className="text-sm font-medium text-slate-400">Pendaftar</span></p>
            </div>
        </div>

        {/* MAIN TABLE */}
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 overflow-hidden border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                {/* OPTIMASI: Latar belakang header digelapkan sedikit dan warna text diubah ke slate-600 agar terlihat */}
                <tr className="bg-slate-100/80 border-b border-slate-200">
                  <th className="p-6 text-[11px] font-black text-slate-600 uppercase tracking-[0.2em]">Profil Pendaftar</th>
                  <th className="p-6 text-[11px] font-black text-slate-600 uppercase tracking-[0.2em]">Informasi Bisnis</th>
                  <th className="p-6 text-[11px] font-black text-slate-600 uppercase tracking-[0.2em]">Pelatihan</th>
                  <th className="p-6 text-[11px] font-black text-slate-600 uppercase tracking-[0.2em]">Status</th>
                  <th className="p-6 text-[11px] font-black text-slate-600 uppercase tracking-[0.2em] text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-24 text-center">
                      <Loader2 className="animate-spin inline text-indigo-600 mb-4" size={40} />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Sinkronisasi Database...</p>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-24 text-center">
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Tidak ada data pendaftar ditemukan.</p>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-indigo-50/30 transition-all group">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-lg shadow-inner group-hover:scale-110 transition-transform">
                            {item.nama_peserta?.charAt(0) || "?"}
                          </div>
                          <div>
                            <p className="font-black text-[#1A1A40] uppercase text-sm leading-none mb-1">{item.nama_peserta}</p>
                            <p className="text-xs text-slate-400 font-bold tracking-tighter">{item.no_hp}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <p className="text-sm font-black text-slate-700 uppercase tracking-tight mb-1">{item.nama_usaha}</p>
                        <span className="px-3 py-1 bg-amber-100 text-[9px] font-black text-amber-700 rounded-lg uppercase">
                          {item.produk_utama}
                        </span>
                      </td>
                      <td className="p-6">
                        <p className="text-sm font-medium text-slate-500">{item.nama_pelatihan}</p>
                        <div className="flex items-center gap-2 text-slate-300 mt-1">
                          <Clock size={12} />
                          <p className="text-[10px] font-bold uppercase">
                            {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-'}
                          </p>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          item.status === 'Terverifikasi' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                          {item.status || 'Menunggu'}
                        </span>
                      </td>
                      <td className="p-6">
                        <div className="flex justify-center gap-2">
                          {/* TOMBOL WHATSAPP */}
                          <a 
                            href={`https://wa.me/${item.no_hp?.replace(/^0/, '62')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 bg-white border border-slate-100 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all shadow-sm"
                            title="Hubungi WhatsApp"
                          >
                            <ExternalLink size={18} />
                          </a>
                          
                          {/* OPTIMASI TOMBOL BERKAS: Sekarang memberikan feedback jika diklik saat data kosong */}
                          {item.foto ? (
                            <a 
                              href={item.foto} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-3 bg-white border border-slate-100 text-indigo-500 rounded-xl hover:bg-indigo-500 hover:text-white transition-all shadow-sm"
                              title="Lihat Berkas"
                            >
                              <FileText size={18} />
                            </a>
                          ) : (
                            <button 
                              onClick={() => alert("Peserta ini belum mengunggah file berkas/foto.")}
                              className="p-3 bg-slate-50 text-slate-300 border border-slate-100 rounded-xl cursor-help"
                              title="Berkas Tidak Tersedia"
                            >
                              <FileText size={18} />
                            </button>
                          )}

                          {/* TOMBOL HAPUS */}
                          <button 
                            onClick={() => handleDelete(item.id, item.nama_peserta)}
                            className="p-3 bg-white border border-slate-100 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                            title="Hapus Data"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 flex justify-between items-center px-6">
            <p className="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase">E-Government System v1.0</p>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Database Terhubung</p>
            </div>
        </div>
      </div>
    </div>
  );
}