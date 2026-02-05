"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient';

// --- Interface Data ---
interface Pelatihan {
  id: string;
  nama: string;
  jadwal: string;
  kuota: number; // Kuota Awal/Maksimal
  deskripsi: string;
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
  
  // Filter & Search State
  const [filterPelatihan, setFilterPelatihan] = useState<string>('Semua');
  
  // State Form Admin
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nama: '', jadwal: '', kuota: '', deskripsi: '' });

  // --- 1. Ambil Data ---
  const fetchData = async () => {
    const resPelatihan = await supabase.from('kegiatan_2026').select('*').order('created_at', { ascending: false });
    const resPeserta = await supabase.from('list_tunggu_peserta').select('*').order('created_at', { ascending: false });
    
    if (resPelatihan.data) setDaftarPelatihan(resPelatihan.data);
    if (resPeserta.data) setDaftarPeserta(resPeserta.data);
  };

  // --- 2. Realtime Subscription ---
  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('db-realtime-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'list_tunggu_peserta' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kegiatan_2026' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // --- 3. Logika Statistik & Filter ---
  // Menghitung statistik pendaftar per pelatihan
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

  // --- 4. Handler CRUD & Status ---
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
      const { error } = await supabase.from('kegiatan_2026').insert([dataPayload]);
      if (!error) alert("Kegiatan Ditambahkan!");
    }
    setFormData({ nama: '', jadwal: '', kuota: '', deskripsi: '' });
    fetchData();
    setLoading(false);
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
      const { error } = await supabase.from('list_tunggu_peserta').delete().eq('id', id);
      if (!error) fetchData();
    }
  };

  const handleHapusKegiatan = async (id: string) => {
    if (confirm("Hapus kegiatan? Menghapus kegiatan tidak menghapus data peserta yang sudah masuk, namun sisa kuota akan hilang.")) {
      await supabase.from('kegiatan_2026').delete().eq('id', id);
      fetchData();
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="bg-indigo-100 text-indigo-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-200">System V2.1</span>
            <h1 className="text-4xl font-black text-[#1A1A40] mt-2 tracking-tighter uppercase italic">Control Panel Pelatihan</h1>
          </div>
          
          {/* Global Stats Brief */}
          <div className="flex gap-4">
            <div className="bg-white p-3 px-5 rounded-2xl shadow-sm border border-slate-100">
              <p className="text-[9px] font-bold text-slate-400 uppercase">Total Pendaftar</p>
              <p className="text-xl font-black text-indigo-600">{daftarPeserta.length}</p>
            </div>
            <div className="bg-white p-3 px-5 rounded-2xl shadow-sm border border-slate-100">
              <p className="text-[9px] font-bold text-slate-400 uppercase">Total Diterima</p>
              <p className="text-xl font-black text-green-600">{daftarPeserta.filter(x => x.status === 'disetujui').length}</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* KOLOM KIRI: Form Input */}
          <div className="lg:col-span-4">
            <div className="sticky top-8">
              <form onSubmit={handleSimpanKegiatan} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold mb-6 text-gray-800">{editId ? '📝 Edit Data' : '➕ Tambah Kegiatan'}</h3>
                <div className="space-y-4">
                  <input type="text" placeholder="Nama Pelatihan" required className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all text-sm"
                    value={formData.nama} onChange={(e) => setFormData({...formData, nama: e.target.value})} />
                  <div className="flex gap-2">
                    <input type="text" placeholder="Jadwal (Bulan/Tahun)" required className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all text-sm"
                      value={formData.jadwal} onChange={(e) => setFormData({...formData, jadwal: e.target.value})} />
                    <input type="number" placeholder="Kuota" required className="w-24 p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all text-center font-bold text-sm"
                      value={formData.kuota} onChange={(e) => setFormData({...formData, kuota: e.target.value})} />
                  </div>
                  <textarea placeholder="Deskripsi Singkat..." required rows={3} className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all text-sm"
                    value={formData.deskripsi} onChange={(e) => setFormData({...formData, deskripsi: e.target.value})}></textarea>
                  <button disabled={loading} className="w-full py-4 bg-[#1A1A40] text-white font-black rounded-xl hover:bg-black transition-all shadow-xl active:scale-95 disabled:bg-gray-400 uppercase text-xs tracking-widest">
                    {editId ? 'Perbarui Data' : 'Publikasikan Kegiatan'}
                  </button>
                  {editId && <button type="button" onClick={() => {setEditId(null); setFormData({nama:'', jadwal:'', kuota:'', deskripsi:''})}} className="w-full text-xs font-bold text-gray-400 hover:text-red-500 transition-colors uppercase">Batal Edit</button>}
                </div>
              </form>
            </div>
          </div>

          {/* KOLOM KANAN: Monitoring & Validasi */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Tabel 1: Data Program Pelatihan & Kuota */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b font-bold text-gray-700 flex justify-between items-center">
                <span className="text-xs uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span> Data Program Pelatihan
                </span>
                <span className="text-[10px] font-black bg-white px-3 py-1 rounded-full border border-slate-200">{daftarPelatihan.length} PROGRAM</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50/50 text-[10px] font-black text-slate-400 uppercase tracking-tighter border-b">
                    <tr>
                      <th className="p-4 w-12 text-center">No</th>
                      <th className="p-4">Nama Pelatihan</th>
                      <th className="p-4 text-center">Maks Kuota</th>
                      <th className="p-4 text-center">Peserta (Diterima)</th>
                      <th className="p-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {daftarPelatihan.map((item, index) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-4 text-center font-bold text-slate-300 group-hover:text-indigo-500 transition-colors">{index + 1}</td>
                        <td className="p-4">
                          <div className="font-bold text-gray-800 text-sm">{item.nama}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{item.jadwal}</div>
                        </td>
                        <td className="p-4 text-center font-black text-slate-600">{item.kuota}</td>
                        <td className="p-4 text-center">
                          <div className="text-lg font-black text-indigo-600">{statsPerPelatihan[item.nama]?.diterima || 0}</div>
                          <div className="text-[9px] font-bold text-gray-300 uppercase tracking-widest italic">Peserta Fix</div>
                        </td>
                        <td className="p-4 text-center space-x-3">
                          <button onClick={() => {
                            setEditId(item.id);
                            setFormData({nama: item.nama, jadwal: item.jadwal, kuota: item.kuota.toString(), deskripsi: item.deskripsi});
                          }} className="text-blue-600 hover:text-blue-800 text-[10px] font-black uppercase underline decoration-2 underline-offset-4 transition-all">Edit</button>
                          <button onClick={() => handleHapusKegiatan(item.id)} className="text-red-400 hover:text-red-600 text-[10px] font-bold uppercase transition-colors">Hapus</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tabel 2: Konfirmasi & Filter Pendaftar */}
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
              <div className="p-5 bg-[#1A1A40] text-white flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <h4 className="font-black text-xs uppercase tracking-widest">Validasi Konfirmasi Pendaftar</h4>
                  <p className="text-[9px] text-indigo-300 font-bold uppercase mt-1">Total {filteredPeserta.length} Peserta terfilter</p>
                </div>
                
                {/* Filter Judul Pelatihan */}
                <div className="flex items-center gap-3">
                   <select 
                    value={filterPelatihan}
                    onChange={(e) => setFilterPelatihan(e.target.value)}
                    className="bg-white/10 border border-white/20 text-white text-[10px] font-black px-4 py-2 rounded-xl outline-none focus:ring-2 focus:ring-yellow-400 uppercase"
                   >
                     <option className="text-black" value="Semua">Semua Pelatihan</option>
                     {daftarPelatihan.map(p => (
                       <option className="text-black" key={p.id} value={p.nama}>{p.nama}</option>
                     ))}
                   </select>
                </div>
              </div>

              {/* Stat Brief for Selected Filter */}
              {filterPelatihan !== 'Semua' && (
                <div className="flex divide-x border-b bg-indigo-50/50 divide-indigo-100">
                  <div className="flex-1 p-3 text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Total Daftar</p>
                    <p className="text-sm font-black text-indigo-600">{statsPerPelatihan[filterPelatihan]?.total || 0}</p>
                  </div>
                  <div className="flex-1 p-3 text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Diterima</p>
                    <p className="text-sm font-black text-green-600">{statsPerPelatihan[filterPelatihan]?.diterima || 0}</p>
                  </div>
                  <div className="flex-1 p-3 text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Ditolak</p>
                    <p className="text-sm font-black text-red-600">{statsPerPelatihan[filterPelatihan]?.ditolak || 0}</p>
                  </div>
                  <div className="flex-1 p-3 text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Pending</p>
                    <p className="text-sm font-black text-orange-600">{statsPerPelatihan[filterPelatihan]?.pending || 0}</p>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase border-b">
                    <tr>
                      <th className="p-4 w-12 text-center">No</th>
                      <th className="p-4">Peserta & Usaha</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-center">Tindakan Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredPeserta.map((p, index) => (
                      <tr key={p.id} className="text-sm hover:bg-slate-50 transition-all group">
                        <td className="p-4 text-center font-bold text-slate-300 group-hover:text-indigo-500 transition-colors">{index + 1}</td>
                        <td className="p-4">
                          <div className="font-black text-slate-800 leading-tight">{p.nama_peserta}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">
                            🏭 {p.nama_usaha} • 📱 {p.no_hp}
                          </div>
                          <div className="inline-block mt-2 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded uppercase">
                            📚 {p.nama_pelatihan}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tight ${
                            p.status === 'disetujui' ? 'bg-green-100 text-green-700 border border-green-200' : 
                            p.status === 'ditolak' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-orange-50 text-orange-600 border border-orange-100'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button 
                              onClick={() => handleUpdateStatus(p.id, 'disetujui', p.nama_pelatihan)} 
                              disabled={p.status === 'disetujui' || loading}
                              className="text-[9px] bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-all font-black uppercase disabled:opacity-30 shadow-lg shadow-green-100">
                              Terima
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(p.id, 'ditolak', p.nama_pelatihan)} 
                              disabled={p.status === 'ditolak' || loading}
                              className="text-[9px] bg-orange-500 text-white px-3 py-2 rounded-lg hover:bg-orange-600 font-black uppercase disabled:opacity-30 shadow-lg shadow-orange-100">
                              Tolak
                            </button>
                            <button 
                              onClick={() => handleHapusPendaftar(p.id)} 
                              className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredPeserta.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-10 text-center text-gray-400 text-xs font-bold uppercase tracking-widest italic bg-slate-50/50">Belum ada data pendaftar pada filter ini.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}