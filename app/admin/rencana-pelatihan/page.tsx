"use client"; // Wajib untuk Next.js App Router yang menggunakan state

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient'; // Sesuaikan path alias dengan setup kamu

// Definisi tipe data untuk TypeScript
interface Pelatihan {
  id: string;
  nama: string;
  jadwal: string;
  kuota: number;
  deskripsi: string;
}

export default function AdminPelatihanPage() {
  const [loading, setLoading] = useState(false);
  const [daftarPelatihan, setDaftarPelatihan] = useState<Pelatihan[]>([]);
  const [formData, setFormData] = useState({
    nama: '',
    jadwal: '',
    kuota: '',
    deskripsi: ''
  });

  // 1. Ambil Data
  const fetchPelatihan = async () => {
    const { data, error } = await supabase
      .from('kegiatan_2026')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) setDaftarPelatihan(data);
  };

  useEffect(() => {
    fetchPelatihan();
  }, []);

  // 2. Simpan Data
  const handleSimpan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('kegiatan_2026')
      .insert([
        { 
          nama: formData.nama, 
          jadwal: formData.jadwal, 
          kuota: parseInt(formData.kuota), 
          deskripsi: formData.deskripsi 
        }
      ]);

    if (error) {
      alert("Gagal menyimpan: " + error.message);
    } else {
      alert("Berhasil menambah kegiatan baru!");
      setFormData({ nama: '', jadwal: '', kuota: '', deskripsi: '' });
      fetchPelatihan();
    }
    setLoading(false);
  };

  // 3. Hapus Data
  const handleHapus = async (id: string) => {
    if (confirm("Hapus kegiatan ini?")) {
      const { error } = await supabase.from('kegiatan_2026').delete().eq('id', id);
      if (!error) fetchPelatihan();
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-black text-gray-800">Manajemen Pelatihan 2026</h1>
          <p className="text-gray-500">Input rencana kegiatan IKM yang akan tampil di form pendaftaran.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Input */}
          <div className="lg:col-span-1">
            <form onSubmit={handleSimpan} className="bg-white p-6 rounded-3xl shadow-sm border border-orange-100">
              <h2 className="text-xl font-bold mb-6 text-orange-600">Tambah Kegiatan</h2>
              
              <div className="space-y-4">
                <input 
                  type="text" placeholder="Nama Pelatihan" required
                  className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:border-orange-400"
                  value={formData.nama}
                  onChange={(e) => setFormData({...formData, nama: e.target.value})}
                />
                <div className="flex gap-2">
                  <input 
                    type="text" placeholder="Jadwal" required
                    className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:border-orange-400"
                    value={formData.jadwal}
                    onChange={(e) => setFormData({...formData, jadwal: e.target.value})}
                  />
                  <input 
                    type="number" placeholder="Kuota" required
                    className="w-24 p-3 bg-gray-50 border rounded-xl outline-none focus:border-orange-400"
                    value={formData.kuota}
                    onChange={(e) => setFormData({...formData, kuota: e.target.value})}
                  />
                </div>
                <textarea 
                  placeholder="Deskripsi kegiatan..." required rows={4}
                  className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:border-orange-400"
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({...formData, deskripsi: e.target.value})}
                ></textarea>

                <button 
                  disabled={loading}
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-100 disabled:bg-gray-300"
                >
                  {loading ? 'Proses...' : 'Simpan Kegiatan'}
                </button>
              </div>
            </form>
          </div>

          {/* List Data */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr className="text-xs uppercase text-gray-500 font-bold">
                    <th className="p-4">Kegiatan</th>
                    <th className="p-4">Jadwal</th>
                    <th className="p-4 text-center">Kuota</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {daftarPelatihan.map((item) => (
                    <tr key={item.id} className="text-sm">
                      <td className="p-4">
                        <div className="font-bold text-gray-800">{item.nama}</div>
                        <div className="text-xs text-gray-400 line-clamp-1">{item.deskripsi}</div>
                      </td>
                      <td className="p-4 text-gray-600">{item.jadwal}</td>
                      <td className="p-4 text-center font-semibold text-orange-600">{item.kuota}</td>
                      <td className="p-4 text-center">
                        <button onClick={() => handleHapus(item.id)} className="text-red-500 hover:underline">Hapus</button>
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
  );
}