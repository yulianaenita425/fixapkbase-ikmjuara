"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';

// --- Interface Data ---
interface Pelatihan {
  id: string;
  nama: string;
  jadwal: string;
  kuota: number;
  deskripsi: string;
}

interface Peserta {
  id: string;
  id_pelatihan: string;
  nama_peserta: string;
  email_peserta: string;
  status: 'menunggu' | 'disetujui' | 'ditolak';
}

export default function AdminPelatihanPage() {
  const [loading, setLoading] = useState(false);
  const [daftarPelatihan, setDaftarPelatihan] = useState<Pelatihan[]>([]);
  const [daftarPeserta, setDaftarPeserta] = useState<Peserta[]>([]);
  
  // State Form Admin (Buat Kegiatan)
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nama: '', jadwal: '', kuota: '', deskripsi: '' });

  // --- Ambil Data ---
  const fetchData = async () => {
    const resPelatihan = await supabase.from('kegiatan_2026').select('*').order('created_at', { ascending: false });
    const resPeserta = await supabase.from('list_tunggu_peserta').select('*').order('created_at', { ascending: false });
    
    if (resPelatihan.data) setDaftarPelatihan(resPelatihan.data);
    if (resPeserta.data) setDaftarPeserta(resPeserta.data);
  };

  // --- Realtime Subscription ---
  useEffect(() => {
    fetchData();

    // Berlangganan perubahan di tabel list_tunggu_peserta secara realtime
    const channel = supabase
      .channel('db-realtime-admin')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'list_tunggu_peserta' },
        (payload) => {
          console.log('Perubahan terdeteksi:', payload);
          fetchData(); // Trigger refresh data otomatis
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- Logika Admin: Simpan/Edit Kegiatan ---
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

  // --- Logika Admin: Update Status & Hapus ---
  const handleUpdateStatus = async (id: string, status: string) => {
    await supabase.from('list_tunggu_peserta').update({ status }).eq('id', id);
    // fetchData() akan terpanggil otomatis oleh Realtime Subscription
  };

  const handleHapusKegiatan = async (id: string) => {
    if (confirm("Hapus kegiatan?")) {
      await supabase.from('kegiatan_2026').delete().eq('id', id);
      fetchData();
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      
      {/* PANEL ADMIN HEADER */}
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <span className="bg-orange-100 text-orange-600 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Sistem Manajemen</span>
          <h1 className="text-4xl font-black text-gray-900 mt-2">Dashboard Kontrol Pelatihan</h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* KOLOM KIRI: Form Input Kegiatan */}
          <div className="lg:col-span-4">
            <div className="sticky top-8">
              <form onSubmit={handleSimpanKegiatan} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold mb-6 text-gray-800">{editId ? '📝 Edit Data' : '➕ Tambah Kegiatan'}</h3>
                <div className="space-y-4">
                  <input type="text" placeholder="Nama Pelatihan" required className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:border-orange-400"
                    value={formData.nama} onChange={(e) => setFormData({...formData, nama: e.target.value})} />
                  <div className="flex gap-2">
                    <input type="text" placeholder="Jadwal" required className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:border-orange-400"
                      value={formData.jadwal} onChange={(e) => setFormData({...formData, jadwal: e.target.value})} />
                    <input type="number" placeholder="Kuota" required className="w-24 p-3 bg-gray-50 border rounded-xl outline-none focus:border-orange-400"
                      value={formData.kuota} onChange={(e) => setFormData({...formData, kuota: e.target.value})} />
                  </div>
                  <textarea placeholder="Deskripsi Singkat..." required rows={3} className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:border-orange-400"
                    value={formData.deskripsi} onChange={(e) => setFormData({...formData, deskripsi: e.target.value})}></textarea>
                  <button disabled={loading} className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-lg active:scale-95 disabled:bg-gray-400">
                    {editId ? 'Perbarui Data' : 'Publikasikan Kegiatan'}
                  </button>
                  {editId && <button type="button" onClick={() => {setEditId(null); setFormData({nama:'', jadwal:'', kuota:'', deskripsi:''})}} className="w-full text-sm text-gray-400 hover:text-red-500 transition-colors">Batal Edit</button>}
                </div>
              </form>
            </div>
          </div>

          {/* KOLOM KANAN: Monitoring & Validasi */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Tabel 1: Monitoring Kuota Pelatihan */}
            <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
              <div className="p-4 bg-gray-50 border-b font-bold text-gray-700 flex justify-between items-center">
                <span>Data Program Pelatihan</span>
                <span className="text-xs font-normal text-gray-400">{daftarPelatihan.length} Program aktif</span>
              </div>
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase">
                  <tr>
                    <th className="p-4">Pelatihan</th>
                    <th className="p-4 text-center">Sisa Slot</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {daftarPelatihan.map((item) => {
                    const disetujui = daftarPeserta.filter(p => p.id_pelatihan === item.id && p.status === 'disetujui').length;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-gray-800">{item.nama}</div>
                          <div className="text-xs text-gray-400">{item.jadwal}</div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="text-sm font-black text-orange-600">{item.kuota - disetujui}</div>
                          <div className="text-[10px] text-gray-300 uppercase">dari {item.kuota}</div>
                        </td>
                        <td className="p-4 text-center space-x-4">
                          <button onClick={() => {
                            setEditId(item.id);
                            setFormData({nama: item.nama, jadwal: item.jadwal, kuota: item.kuota.toString(), deskripsi: item.deskripsi});
                          }} className="text-blue-500 hover:underline text-sm font-bold">Edit</button>
                          <button onClick={() => handleHapusKegiatan(item.id)} className="text-red-400 hover:underline text-sm">Hapus</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Tabel 2: Konfirmasi Pendaftar (Realtime) */}
            <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
              <div className="p-5 bg-gray-900 text-white flex justify-between items-center">
                <h4 className="font-bold text-sm">Validasi Konfirmasi Pendaftar</h4>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                   <span className="text-[10px] uppercase tracking-tighter text-gray-400">Realtime Active</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase border-b">
                    <tr>
                      <th className="p-4">Nama & Email</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-center">Tindakan Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {daftarPeserta.map((p) => (
                      <tr key={p.id} className="text-sm">
                        <td className="p-4">
                          <div className="font-bold text-gray-800">{p.nama_peserta}</div>
                          <div className="text-[10px] text-gray-400">{p.email_peserta}</div>
                          <div className="text-[10px] font-bold text-orange-500 mt-1 uppercase">
                            👉 {daftarPelatihan.find(pel => pel.id === p.id_pelatihan)?.nama || 'Program Dihapus'}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tight ${
                            p.status === 'disetujui' ? 'bg-green-100 text-green-700' : 
                            p.status === 'ditolak' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-4 text-center space-x-2">
                          <button onClick={() => handleUpdateStatus(p.id, 'disetujui')} className="text-[10px] bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-all font-bold shadow-sm active:scale-90">Terima</button>
                          <button onClick={() => handleUpdateStatus(p.id, 'ditolak')} className="text-[10px] bg-white border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all font-bold active:scale-90">Tolak</button>
                        </td>
                      </tr>
                    ))}
                    {daftarPeserta.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-10 text-center text-gray-400 text-sm italic">Belum ada data pendaftar yang masuk.</td>
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