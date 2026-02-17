"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import Link from 'next/link'; // Import Link untuk navigasi
import { FileText, ChevronRight, LayoutDashboard, Database } from 'lucide-react'; // Ikon tambahan

// --- Interface Data ---
interface Pelatihan {
  id: string;
  nama: string;
  jadwal: string;
  kuota: number;
  deskripsi: string;
  is_published: boolean; 
  created_at?: string;
}

interface Peserta {
  id: string;
  nama_peserta: string;
  nama_usaha: string;
  no_hp: string;
  nama_pelatihan: string;
  status: 'pending' | 'disetujui' | 'ditolak';
  created_at?: string;
}

export default function AdminPelatihanPage() {
  const [loading, setLoading] = useState(false);
  const [daftarPelatihan, setDaftarPelatihan] = useState<Pelatihan[]>([]);
  const [daftarPeserta, setDaftarPeserta] = useState<Peserta[]>([]);
  
  const [filterPelatihan, setFilterPelatihan] = useState<string>('Semua');
  
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nama: '', jadwal: '', kuota: '', deskripsi: '' });

  const fetchData = async () => {
    const resPelatihan = await supabase.from('kegiatan_2026').select('*').order('created_at', { ascending: false });
    const resPeserta = await supabase.from('list_tunggu_peserta').select('*').order('created_at', { ascending: false });
    
    if (resPelatihan.data) setDaftarPelatihan(resPelatihan.data);
    if (resPeserta.data) setDaftarPeserta(resPeserta.data);
  };

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('db-realtime-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'list_tunggu_peserta' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kegiatan_2026' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const statsPerPelatihan = useMemo(() => {
    const stats: Record<string, { total: number; diterima: number; ditolak: number; pending: number }> = {};
    
    daftarPelatihan.forEach(p => {
      const pesertaTerfilter = daftarPeserta.filter(ps => ps.nama_pelatihan === p.nama);
      stats[p.nama] = {
        total: pesertaTerfilter.length,
        diterima: pesertaTerfilter.filter(ps => ps.status === 'disetujui').length,
        ditolak: pesertaTerfilter.filter(ps => ps.status === 'ditolak').length,
        pending: pesertaTerfilter.filter(ps => ps.status === 'pending').length,
      };
    });
    return stats;
  }, [daftarPelatihan, daftarPeserta]);

  const filteredPeserta = useMemo(() => {
    if (filterPelatihan === 'Semua') return daftarPeserta;
    return daftarPeserta.filter(p => p.nama_pelatihan === filterPelatihan);
  }, [daftarPeserta, filterPelatihan]);

  const handleSimpanKegiatan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const dataPayload = { 
      nama: formData.nama, 
      jadwal: formData.jadwal, 
      kuota: parseInt(formData.kuota), 
      deskripsi: formData.deskripsi 
    };

    if (editId) {
      const { error } = await supabase.from('kegiatan_2026').update(dataPayload).eq('id', editId);
      if (!error) { alert("Update Berhasil!"); setEditId(null); }
    } else {
      const { error } = await supabase.from('kegiatan_2026').insert([{ ...dataPayload, is_published: true }]);
      if (!error) alert("Kegiatan Ditambahkan!");
    }
    setFormData({ nama: '', jadwal: '', kuota: '', deskripsi: '' });
    fetchData();
    setLoading(false);
  };

  const handleTogglePublikasi = async (id: string, currentStatus: boolean) => {
    const actionText = currentStatus ? "Akhiri publikasi?" : "Buka kembali publikasi?";
    if (confirm(`${actionText} (Hal ini akan menentukan apakah pelatihan muncul di form pendaftaran user)`)) {
      setLoading(true);
      const { error } = await supabase
        .from('kegiatan_2026')
        .update({ is_published: !currentStatus })
        .eq('id', id);
      
      if (error) alert("Gagal memperbarui status: " + error.message);
      fetchData();
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string, namaPelatihan: string) => {
    setLoading(true);
    const rpcName = status === 'disetujui' ? 'approve_peserta' : 'reject_peserta';
    const { error } = await supabase.rpc(rpcName, { row_id: id, p_nama_pelatihan: namaPelatihan });
    
    if (error) alert("Gagal memproses: " + error.message);
    setLoading(false);
    fetchData(); 
  };

const handleHapusPendaftar = async (id: string) => {
    if (confirm("Hapus data pendaftaran ini?")) {
      setLoading(true); 
      try {
        const { error } = await supabase
          .from('list_tunggu_peserta')
          .delete()
          .eq('id', id);

        if (error) throw new Error(error.message);
        await fetchData();
        alert("Data pendaftaran berhasil dihapus.");
        
      } catch (error: any) {
        console.error("Gagal menghapus:", error);
        alert("Gagal menghapus: " + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleHapusKegiatan = async (id: string, namaPelatihan: string) => {
    if (confirm(`Hapus kegiatan "${namaPelatihan}"? Seluruh data peserta pada kegiatan ini juga akan ikut terhapus secara permanen.`)) {
      setLoading(true);
      try {
        const { error: errorPeserta } = await supabase
          .from('list_tunggu_peserta')
          .delete()
          .eq('nama_pelatihan', namaPelatihan);

        if (errorPeserta) throw new Error(`Gagal membersihkan data peserta: ${errorPeserta.message}`);

        const { error: errorKegiatan } = await supabase
          .from('kegiatan_2026')
          .delete()
          .eq('id', id);

        if (errorKegiatan) throw new Error(`Gagal menghapus kegiatan: ${errorKegiatan.message}`);

        alert("Kegiatan dan data pendaftar terkait berhasil dihapus.");
        fetchData();
      } catch (error: any) {
        console.error("Delete Error:", error);
        alert(error.message || "Terjadi kesalahan saat menghapus data.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER DENGAN TOMBOL NAVIGASI BARU */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-600 rounded-3xl text-white shadow-lg shadow-indigo-100">
              <LayoutDashboard size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-indigo-100 text-indigo-600 px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-200">Admin Panel</span>
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-[#1A1A40] tracking-tighter uppercase italic">Control Center</h1>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* TOMBOL BERKAS MASUK (BARU) */}
            <Link 
              href="/admin/berkas-masuk" 
              className="flex items-center gap-3 bg-white border-2 border-indigo-600 text-indigo-600 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all group shadow-sm"
            >
              <FileText size={18} className="group-hover:rotate-12 transition-transform" />
              Lihat Berkas Masuk
              <ChevronRight size={14} className="opacity-50" />
            </Link>

            <div className="h-10 w-[1px] bg-slate-200 hidden md:block mx-2"></div>

            <div className="flex gap-2">
              <div className="bg-slate-50 p-2 px-4 rounded-xl border border-slate-100">
                <p className="text-[8px] font-bold text-slate-400 uppercase leading-none mb-1">Total Pendaftar</p>
                <p className="text-lg font-black text-indigo-600 leading-none">{daftarPeserta.length}</p>
              </div>
              <div className="bg-slate-50 p-2 px-4 rounded-xl border border-slate-100">
                <p className="text-[8px] font-bold text-slate-400 uppercase leading-none mb-1">Diterima</p>
                <p className="text-lg font-black text-green-600 leading-none">{daftarPeserta.filter(x => x.status === 'disetujui').length}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* SISI KIRI: FORM INPUT */}
          <div className="lg:col-span-4">
            <div className="sticky top-8">
              <form onSubmit={handleSimpanKegiatan} className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-gray-100">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                    <Database size={18} />
                  </div>
                  <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">{editId ? 'Edit Kegiatan' : 'Tambah Kegiatan'}</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Nama Pelatihan</label>
                    <input type="text" placeholder="Contoh: Pelatihan Barista" required className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:border-indigo-400 focus:bg-white transition-all text-sm font-bold"
                      value={formData.nama} onChange={(e) => setFormData({...formData, nama: e.target.value})} />
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Jadwal</label>
                      <input type="text" placeholder="Mei 2026" required className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:border-indigo-400 focus:bg-white transition-all text-sm font-bold"
                        value={formData.jadwal} onChange={(e) => setFormData({...formData, jadwal: e.target.value})} />
                    </div>
                    <div className="w-24">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Kuota</label>
                      <input type="number" placeholder="0" required className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:border-indigo-400 focus:bg-white transition-all text-center font-black text-sm"
                        value={formData.kuota} onChange={(e) => setFormData({...formData, kuota: e.target.value})} />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Deskripsi Singkat</label>
                    <textarea placeholder="Jelaskan detail singkat pelatihan..." required rows={3} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:border-indigo-400 focus:bg-white transition-all text-sm font-medium"
                      value={formData.deskripsi} onChange={(e) => setFormData({...formData, deskripsi: e.target.value})}></textarea>
                  </div>

                  <button disabled={loading} className="w-full py-5 bg-[#1A1A40] text-white font-black rounded-2xl hover:bg-indigo-600 transition-all shadow-lg active:scale-95 disabled:bg-gray-400 uppercase text-[10px] tracking-[0.2em]">
                    {editId ? 'Simpan Perubahan' : 'Publish Kegiatan Sekarang'}
                  </button>
                  
                  {editId && (
                    <button type="button" onClick={() => {setEditId(null); setFormData({nama:'', jadwal:'', kuota:'', deskripsi:''})}} className="w-full py-2 text-[10px] font-black text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest">Batal Edit</button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* SISI KANAN: TABEL DATA */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-5 bg-slate-50/80 border-b font-bold text-gray-700 flex justify-between items-center">
                <span className="text-xs uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span> Daftar Program Aktif
                </span>
                <span className="text-[10px] font-black bg-white px-4 py-1.5 rounded-full border border-slate-200 text-indigo-600 shadow-sm">{daftarPelatihan.length} TOTAL PROGRAM</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50/50 text-[10px] font-black text-slate-400 uppercase tracking-tighter border-b">
                    <tr>
                      <th className="p-5 w-12 text-center">No</th>
                      <th className="p-5">Nama Pelatihan</th>
                      <th className="p-5 text-center">Status</th>
                      <th className="p-5 text-center">Kuota</th>
                      <th className="p-5 text-center">Peserta</th>
                      <th className="p-5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {daftarPelatihan.map((item, index) => (
                      <tr key={item.id} className={`hover:bg-indigo-50/30 transition-colors group ${!item.is_published ? 'opacity-60 bg-gray-50/50' : ''}`}>
                        <td className="p-5 text-center font-bold text-slate-300 group-hover:text-indigo-500 transition-colors italic">{index + 1}</td>
                        <td className="p-5">
                          <div className="font-black text-slate-800 text-sm uppercase leading-tight mb-0.5">{item.nama}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.jadwal}</div>
                        </td>
                        <td className="p-5 text-center">
                           <span className={`text-[8px] font-black px-3 py-1 rounded-lg uppercase tracking-widest border ${item.is_published ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                             {item.is_published ? 'Online' : 'Offline'}
                           </span>
                        </td>
                        <td className="p-5 text-center font-black text-slate-600">{item.kuota}</td>
                        <td className="p-5 text-center">
                          <div className="text-xl font-black text-indigo-600 leading-none">{statsPerPelatihan[item.nama]?.diterima || 0}</div>
                          <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">Confirmed</div>
                        </td>
                        <td className="p-5 text-center">
                          <div className="flex flex-col gap-2 items-center">
                            <div className="flex gap-4">
                              <button onClick={() => {
                                setEditId(item.id);
                                setFormData({nama: item.nama, jadwal: item.jadwal, kuota: item.kuota.toString(), deskripsi: item.deskripsi});
                              }} className="text-indigo-400 hover:text-indigo-600 text-[9px] font-black uppercase tracking-widest transition-all">Edit</button>
                              
                              <button onClick={() => handleHapusKegiatan(item.id, item.nama)} className="text-rose-300 hover:text-rose-600 text-[9px] font-black uppercase tracking-widest transition-colors">Hapus</button>
                            </div>
                            
                            <button 
                              onClick={() => handleTogglePublikasi(item.id, item.is_published)}
                              className={`text-[8px] font-black uppercase px-3 py-1.5 rounded-xl border transition-all shadow-sm ${
                                item.is_published 
                                ? 'bg-white text-orange-600 border-orange-200 hover:bg-orange-600 hover:text-white' 
                                : 'bg-white text-green-600 border-green-200 hover:bg-green-600 hover:text-white'
                              }`}
                            >
                              {item.is_published ? 'Tutup Pendaftaran' : 'Buka Pendaftaran'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* KONFIRMASI PENDAFTAR */}
            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
              <div className="p-6 bg-[#1A1A40] text-white flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                    <FileText size={20} className="text-indigo-300" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm uppercase tracking-[0.1em]">Verifikasi Peserta</h4>
                    <p className="text-[9px] text-indigo-300 font-bold uppercase mt-0.5 tracking-widest">{filteredPeserta.length} Data Pendaftar Ditemukan</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                   <select 
                    value={filterPelatihan}
                    onChange={(e) => setFilterPelatihan(e.target.value)}
                    className="w-full md:w-64 bg-white/5 border-2 border-white/10 text-white text-[10px] font-black px-5 py-3 rounded-2xl outline-none focus:border-yellow-400 uppercase tracking-widest appearance-none cursor-pointer hover:bg-white/10 transition-all"
                   >
                     <option className="text-black font-bold" value="Semua">Semua Program Pelatihan</option>
                     {daftarPelatihan.map(p => (
                       <option className="text-black font-bold" key={p.id} value={p.nama}>{p.nama}</option>
                     ))}
                   </select>
                </div>
              </div>

              {/* STATS BAR */}
              {filterPelatihan !== 'Semua' && (
                <div className="flex divide-x border-b bg-indigo-50/30 divide-indigo-100">
                  <div className="flex-1 py-4 text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Pendaftar</p>
                    <p className="text-base font-black text-[#1A1A40]">{statsPerPelatihan[filterPelatihan]?.total || 0}</p>
                  </div>
                  <div className="flex-1 py-4 text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Diterima</p>
                    <p className="text-base font-black text-green-600">{statsPerPelatihan[filterPelatihan]?.diterima || 0}</p>
                  </div>
                  <div className="flex-1 py-4 text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Ditolak</p>
                    <p className="text-base font-black text-rose-600">{statsPerPelatihan[filterPelatihan]?.ditolak || 0}</p>
                  </div>
                  <div className="flex-1 py-4 text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Antrean</p>
                    <p className="text-base font-black text-amber-500">{statsPerPelatihan[filterPelatihan]?.pending || 0}</p>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase border-b">
                    <tr>
                      <th className="p-5 w-12 text-center">No</th>
                      <th className="p-5">Profil Pendaftar</th>
                      <th className="p-5 text-center">Status</th>
                      <th className="p-5 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredPeserta.map((p, index) => (
                      <tr key={p.id} className="text-sm hover:bg-slate-50 transition-all group">
                        <td className="p-5 text-center font-bold text-slate-300 group-hover:text-indigo-600 transition-colors italic">{index + 1}</td>
                        <td className="p-5">
                          <div className="font-black text-slate-800 uppercase tracking-tight leading-none mb-1.5">{p.nama_peserta}</div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                            <span className="text-indigo-500">🏭 {p.nama_usaha}</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span>📱 {p.no_hp}</span>
                          </div>
                          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-500 text-[9px] font-black rounded-lg uppercase tracking-tight">
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                            {p.nama_pelatihan}
                          </div>
                        </td>
                        <td className="p-5 text-center">
                          <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                            p.status === 'disetujui' ? 'bg-green-50 text-green-700 border-green-100 shadow-sm shadow-green-50' : 
                            p.status === 'ditolak' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-5">
                          <div className="flex justify-center gap-2">
                            <button 
                              onClick={() => handleUpdateStatus(p.id, 'disetujui', p.nama_pelatihan)} 
                              disabled={p.status === 'disetujui' || loading}
                              className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-black uppercase text-[9px] tracking-widest shadow-lg shadow-green-200 disabled:opacity-20 active:scale-90">
                              Approve
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(p.id, 'ditolak', p.nama_pelatihan)} 
                              disabled={p.status === 'ditolak' || loading}
                              className="px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-black font-black uppercase text-[9px] tracking-widest shadow-lg shadow-slate-200 disabled:opacity-20 active:scale-90">
                              Reject
                            </button>
                            <button 
                              onClick={() => handleHapusPendaftar(p.id)} 
                              className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredPeserta.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-20 text-center">
                          <div className="flex flex-col items-center">
                            <Database size={48} className="text-slate-200 mb-4" />
                            <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">No Data in this filter</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        
        <footer className="mt-12 text-center py-8 border-t border-slate-200">
           <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Digitalization of Madiun IKM • 2026</p>
        </footer>
      </div>
    </div>
  );
}