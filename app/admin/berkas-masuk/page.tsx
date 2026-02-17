"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { 
  ExternalLink, 
  Search, 
  RefreshCcw, 
  Trash2,
  Clock,
  ChevronRight,
  Loader2,
  FileText,
  Filter,
  EyeOff
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
    <div className="min-h-screen bg-[#F1F5F9] p-6 lg:p-12 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* BREADCRUMB & TITLE SECTION */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">
            <span>Admin Dashboard</span>
            <ChevronRight size={12} />
            <span className="text-indigo-600">Verifikasi Berkas</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black text-[#1A1A40] tracking-tighter uppercase">
                Inbox Pendaftar <span className="text-indigo-600">.</span>
              </h1>
              <p className="text-slate-500 font-medium mt-1">Total {pendaftar.length} permohonan masuk ke sistem.</p>
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
                className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg"
              >
                <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
        </div>

        {/* MAIN TABLE */}
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 overflow-hidden border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-6 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Profil Pendaftar</th>
                  <th className="p-6 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Bisnis & Produk</th>
                  <th className="p-6 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Pelatihan Diminati</th>
                  <th className="p-6 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                  <th className="p-6 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-24 text-center">
                      <Loader2 className="animate-spin inline text-indigo-600 mb-4" size={40} />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Mengambil Data...</p>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-24 text-center">
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Data tidak ditemukan.</p>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-indigo-50/30 transition-all group">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-lg">
                            {item.nama_peserta?.charAt(0) || "?"}
                          </div>
                          <div>
                            <p className="font-black text-[#1A1A40] uppercase text-sm mb-1">{item.nama_peserta}</p>
                            <p className="text-xs text-slate-400 font-bold">{item.no_hp}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <p className="text-sm font-black text-slate-700 uppercase mb-1">{item.nama_usaha}</p>
                        <span className="px-3 py-1 bg-amber-50 text-[9px] font-black text-amber-600 rounded-lg uppercase border border-amber-100">
                          {item.produk_ut || item.produk_utama || "N/A"}
                        </span>
                      </td>
                      <td className="p-6">
                        <p className="text-sm font-medium text-slate-600 leading-tight mb-1">{item.nama_pelatihan}</p>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Clock size={12} />
                          <p className="text-[10px] font-bold">
                            {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-'}
                          </p>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          item.status?.toLowerCase() === 'terverifikasi' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {item.status || 'Baru'}
                        </span>
                      </td>
                      <td className="p-6">
                        <div className="flex justify-center gap-2">
                          {/* TOMBOL WA */}
                          <a 
                            href={`https://wa.me/${item.no_hp?.replace(/^0/, '62')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 bg-white border border-slate-100 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all shadow-sm"
                            title="Hubungi WhatsApp"
                          >
                            <ExternalLink size={18} />
                          </a>
                          
                          {/* PERBAIKAN LOGIKA TOMBOL BERKAS */}
                          {item.foto ? (
                            <a 
                              href={item.foto} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-3 bg-white border border-slate-100 text-indigo-500 rounded-xl hover:bg-indigo-500 hover:text-white transition-all shadow-sm"
                              title="Buka Foto KTP"
                            >
                              <FileText size={18} />
                            </a>
                          ) : (
                            <button 
                              disabled
                              className="p-3 bg-slate-50 text-slate-300 border border-slate-100 rounded-xl cursor-not-allowed"
                              title="Berkas Belum Diunggah"
                            >
                              <EyeOff size={18} />
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

        {/* FOOTER */}
        <div className="mt-8 flex justify-between items-center px-6 opacity-50">
            <p className="text-[9px] font-black text-slate-400 tracking-[0.3em] uppercase">IKM JUARA MADIUN SYSTEM</p>
            <div className="flex items-center gap-2 text-green-600 font-bold text-[9px] uppercase tracking-tighter">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                Terhubung Cloud Database
            </div>
        </div>
      </div>
    </div>
  );
}