"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';

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
  status: 'menunggu' | 'disetujui' | 'ditolak';
}

export default function AdminPelatihanPage() {
  const [loading, setLoading] = useState(false);
  const [daftarPelatihan, setDaftarPelatihan] = useState<Pelatihan[]>([]);
  const [daftarPeserta, setDaftarPeserta] = useState<Peserta[]>([]);
  
  // State untuk mode Edit
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nama: '', jadwal: '', kuota: '', deskripsi: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const resPelatihan = await supabase.from('kegiatan_2026').select('*').order('created_at', { ascending: false });
    const resPeserta = await supabase.from('list_tunggu_peserta').select('*').order('created_at', { ascending: false });
    
    if (resPelatihan.data) setDaftarPelatihan(resPelatihan.data);
    if (resPeserta.data) setDaftarPeserta(resPeserta.data);
  };

  const handleSimpan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const dataPayload = { 
      nama: formData.nama, 
      jadwal: formData.jadwal, 
      kuota: parseInt(formData.kuota), 
      deskripsi: formData.deskripsi 
    };

    if (editId) {
      // LOGIKA EDIT
      const { error } = await supabase.from('kegiatan_2026').update(dataPayload).eq('id', editId);
      if (!error) {
        alert("Kegiatan berhasil diperbarui!");
        setEditId(null);
      }
    } else {
      // LOGIKA TAMBAH BARU
      const { error } = await supabase.from('kegiatan_2026').insert([dataPayload]);
      if (!error) alert("Kegiatan baru berhasil ditambah!");
    }

    setFormData({ nama: '', jadwal: '', kuota: '', deskripsi: '' });
    fetchData();
    setLoading(false);
  };

  const handleUpdateStatus = async (id: string, statusBaru: string) => {
    const { error } = await supabase.from('list_tunggu_peserta').update({ status: statusBaru }).eq('id', id);
    if (!error) fetchData();
  };

  const handleHapusKegiatan = async (id: string) => {
    if (confirm("Hapus kegiatan ini? Semua data pendaftar terkait juga akan terhapus.")) {
      const { error } = await supabase.from('kegiatan_2026').delete().eq('id', id);
      if (!error) fetchData();
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-black text-gray-800">Manajemen Pelatihan 2026</h1>
          <p className="text-gray-500">Kelola kegiatan dan persetujuan peserta secara real-time.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* FORM INPUT / EDIT */}
          <div className="lg:col-span-4">
            <form onSubmit={handleSimpan} className="bg-white p-6 rounded-3xl shadow-sm border border-orange-100">
              <h2 className="text-xl font-bold mb-6 text-orange-600">
                {editId ? '📝 Edit Kegiatan' : '➕ Tambah Kegiatan'}
              </h2>
              <div className="space-y-4">
                <input type="text" placeholder="Nama Pelatihan" required className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:border-orange-400"
                  value={formData.nama} onChange={(e) => setFormData({...formData, nama: e.target.value})} />
                <div className="flex gap-2">
                  <input type="text" placeholder="Jadwal" required className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:border-orange-400"
                    value={formData.jadwal} onChange={(e) => setFormData({...formData, jadwal: e.target.value})} />
                  <input type="number" placeholder="Kuota" required className="w-24 p-3 bg-gray-50 border rounded-xl outline-none focus:border-orange-400"
                    value={formData.kuota} onChange={(e) => setFormData({...formData, kuota: e.target.value})} />
                </div>
                <textarea placeholder="Deskripsi kegiatan..." required rows={3} className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:border-orange-400"
                  value={formData.deskripsi} onChange={(e) => setFormData({...formData, deskripsi: e.target.value})}></textarea>
                
                <button disabled={loading} className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all">
                  {loading ? 'Proses...' : editId ? 'Perbarui Kegiatan' : 'Simpan Kegiatan'}
                </button>
                {editId && (
                  <button type="button" onClick={() => {setEditId(null); setFormData({nama:'', jadwal:'', kuota:'', deskripsi:''})}} className="w-full text-gray-400 text-sm">Batal Edit</button>
                )}
              </div>
            </form>
          </div>

          {/* TABEL KEGIATAN & TABEL PESERTA */}
          <div className="lg:col-span-8 space-y-8">
            {/* Tabel Utama Kegiatan */}
            <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b text-xs uppercase text-gray-500 font-bold">
                  <tr>
                    <th className="p-4">Kegiatan</th>
                    <th className="p-4 text-center">Sisa Kuota</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {daftarPelatihan.map((item) => {
                    const disetujui = daftarPeserta.filter(p => p.id_pelatihan === item.id && p.status === 'disetujui').length;
                    return (
                      <tr key={item.id} className="text-sm">
                        <td className="p-4">
                          <div className="font-bold text-gray-800">{item.nama}</div>
                          <div className="text-xs text-gray-400">{item.jadwal}</div>
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-bold text-orange-600">{item.kuota - disetujui}</span>
                          <span className="text-gray-400 text-xs ml-1">/ {item.kuota}</span>
                        </td>
                        <td className="p-4 text-center space-x-3">
                          <button onClick={() => {
                            setEditId(item.id);
                            setFormData({nama: item.nama, jadwal: item.jadwal, kuota: item.kuota.toString(), deskripsi: item.deskripsi});
                          }} className="text-blue-500 hover:underline">Edit</button>
                          <button onClick={() => handleHapusKegiatan(item.id)} className="text-red-500 hover:underline">Hapus</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Tabel List Tunggu Peserta */}
            <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
              <div className="p-4 bg-gray-800 text-white font-bold flex justify-between items-center">
                <span>List Tunggu & Persetujuan</span>
                <span className="text-xs bg-orange-500 px-2 py-1 rounded">{daftarPeserta.length} Total</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-xs font-bold text-gray-500 border-b">
                    <tr>
                      <th className="p-4">Nama Peserta</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-center">Tools Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {daftarPeserta.map((p) => (
                      <tr key={p.id} className="text-sm">
                        <td className="p-4">
                          <div className="font-medium">{p.nama_peserta}</div>
                          <div className="text-xs text-gray-400">
                            {daftarPelatihan.find(pel => pel.id === p.id_pelatihan)?.nama || 'Kegiatan dihapus'}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                            p.status === 'disetujui' ? 'bg-green-100 text-green-700' : 
                            p.status === 'ditolak' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-4 text-center space-x-2">
                          <button onClick={() => handleUpdateStatus(p.id, 'disetujui')} className="bg-green-50 text-green-600 border border-green-200 px-3 py-1 rounded-md text-xs hover:bg-green-600 hover:text-white transition-colors">Setuju</button>
                          <button onClick={() => handleUpdateStatus(p.id, 'ditolak')} className="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-md text-xs hover:bg-red-600 hover:text-white transition-colors">Tolak</button>
                        </td>
                      </tr>
                    ))}
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