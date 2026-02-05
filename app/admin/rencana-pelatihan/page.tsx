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

  // State Form Peserta (Pendaftaran)
  const [formPeserta, setFormPeserta] = useState({ id_pelatihan: '', nama: '', email: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const resPelatihan = await supabase.from('kegiatan_2026').select('*').order('created_at', { ascending: false });
    const resPeserta = await supabase.from('list_tunggu_peserta').select('*').order('created_at', { ascending: false });
    
    if (resPelatihan.data) setDaftarPelatihan(resPelatihan.data);
    if (resPeserta.data) setDaftarPeserta(resPeserta.data);
  };

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

  // --- Logika Peserta: Submit Pendaftaran ---
  const handleDaftarPeserta = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('list_tunggu_peserta').insert([{
      id_pelatihan: formPeserta.id_pelatihan,
      nama_peserta: formPeserta.nama,
      email_peserta: formPeserta.email,
      status: 'menunggu'
    }]);

    if (!error) {
      alert("Pendaftaran Anda Berhasil! Status: Menunggu Konfirmasi.");
      setFormPeserta({ id_pelatihan: '', nama: '', email: '' });
      fetchData(); // Refresh list admin agar pendaftar baru muncul
    } else {
      alert("Gagal: " + error.message);
    }
    setLoading(false);
  };

  // --- Logika Admin: Update Status & Hapus ---
  const handleUpdateStatus = async (id: string, status: string) => {
    await supabase.from('list_tunggu_peserta').update({ status }).eq('id', id);
    fetchData();
  };

  const handleHapusKegiatan = async (id: string) => {
    if (confirm("Hapus kegiatan?")) {
      await supabase.from('kegiatan_2026').delete().eq('id', id);
      fetchData();
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen space-y-12">
      
      {/* SECTION 1: FORM PENDAFTARAN (Sisi Publik/Peserta) */}
      <section className="max-w-2xl mx-auto bg-gradient-to-br from-orange-500 to-orange-600 p-1 rounded-3xl shadow-2xl">
        <div className="bg-white p-8 rounded-[1.4rem]">
          <h2 className="text-2xl font-black text-gray-800 mb-2">Form Pendaftaran Peserta</h2>
          <p className="text-gray-500 mb-6 text-sm">Pilih pelatihan yang ingin Anda ikuti di bawah ini.</p>
          
          <form onSubmit={handleDaftarPeserta} className="space-y-4">
            <select 
              required className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-orange-400 outline-none"
              value={formPeserta.id_pelatihan}
              onChange={e => setFormPeserta({...formPeserta, id_pelatihan: e.target.value})}
            >
              <option value="">-- Pilih Jadwal Pelatihan --</option>
              {daftarPelatihan.map(p => (
                <option key={p.id} value={p.id}>{p.nama} ({p.jadwal})</option>
              ))}
            </select>
            <input 
              type="text" placeholder="Nama Lengkap Anda" required
              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-orange-400 outline-none"
              value={formPeserta.nama} onChange={e => setFormPeserta({...formPeserta, nama: e.target.value})}
            />
            <input 
              type="email" placeholder="Email Aktif" required
              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-orange-400 outline-none"
              value={formPeserta.email} onChange={e => setFormPeserta({...formPeserta, email: e.target.value})}
            />
            <button disabled={loading} className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl shadow-lg shadow-orange-200 transition-all">
              {loading ? 'Mengirim...' : 'Kirim Pendaftaran'}
            </button>
          </form>
        </div>
      </section>

      <hr className="border-gray-200 max-w-7xl mx-auto" />

      {/* SECTION 2: PANEL ADMIN (Manajemen) */}
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <span className="bg-orange-100 text-orange-600 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Admin Panel</span>
          <h1 className="text-4xl font-black text-gray-900 mt-2">Dashboard Kontrol 2026</h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Input Kegiatan */}
          <div className="lg:col-span-4">
            <form onSubmit={handleSimpanKegiatan} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold mb-6 text-gray-800">{editId ? '📝 Edit Data' : '➕ Buat Kegiatan'}</h3>
              <div className="space-y-4">
                <input type="text" placeholder="Nama Pelatihan" required className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:border-orange-400"
                  value={formData.nama} onChange={(e) => setFormData({...formData, nama: e.target.value})} />
                <div className="flex gap-2">
                  <input type="text" placeholder="Jadwal" required className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:border-orange-400"
                    value={formData.jadwal} onChange={(e) => setFormData({...formData, jadwal: e.target.value})} />
                  <input type="number" placeholder="Kuota" required className="w-24 p-3 bg-gray-50 border rounded-xl outline-none focus:border-orange-400"
                    value={formData.kuota} onChange={(e) => setFormData({...formData, kuota: e.target.value})} />
                </div>
                <textarea placeholder="Deskripsi..." required rows={3} className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:border-orange-400"
                  value={formData.deskripsi} onChange={(e) => setFormData({...formData, deskripsi: e.target.value})}></textarea>
                <button className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all">
                  {editId ? 'Update Data' : 'Posting Kegiatan'}
                </button>
                {editId && <button onClick={() => {setEditId(null); setFormData({nama:'', jadwal:'', kuota:'', deskripsi:''})}} className="w-full text-sm text-gray-400">Batal Edit</button>}
              </div>
            </form>
          </div>

          {/* List Monitoring */}
          <div className="lg:col-span-8 space-y-8">
            {/* Tabel Kegiatan & Sisa Kuota */}
            <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-xs font-bold text-gray-400 uppercase">
                  <tr>
                    <th className="p-4 border-b">Nama Pelatihan</th>
                    <th className="p-4 border-b text-center">Sisa Kuota</th>
                    <th className="p-4 border-b text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {daftarPelatihan.map((item) => {
                    const disetujui = daftarPeserta.filter(p => p.id_pelatihan === item.id && p.status === 'disetujui').length;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-bold text-gray-800">{item.nama}</td>
                        <td className="p-4 text-center">
                          <span className={`px-3 py-1 rounded-full font-bold ${item.kuota - disetujui <= 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            {item.kuota - disetujui} / {item.kuota}
                          </span>
                        </td>
                        <td className="p-4 text-center space-x-4">
                          <button onClick={() => {
                            setEditId(item.id);
                            setFormData({nama: item.nama, jadwal: item.jadwal, kuota: item.kuota.toString(), deskripsi: item.deskripsi});
                          }} className="text-blue-500 hover:text-blue-700 font-medium">Edit</button>
                          <button onClick={() => handleHapusKegiatan(item.id)} className="text-red-400 hover:text-red-600">Hapus</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Tabel List Pendaftar (Status Approval) */}
            <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
              <div className="p-5 bg-gray-900 text-white flex justify-between items-center font-bold">
                <span>Konfirmasi Pendaftar</span>
                <span className="text-xs bg-orange-500 px-3 py-1 rounded-full">{daftarPeserta.length} Masuk</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase border-b">
                    <tr>
                      <th className="p-4">Peserta & Program</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-center">Tindakan Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {daftarPeserta.map((p) => (
                      <tr key={p.id} className="text-sm">
                        <td className="p-4">
                          <div className="font-bold text-gray-800">{p.nama_peserta}</div>
                          <div className="text-xs text-orange-500">
                            {daftarPelatihan.find(pel => pel.id === p.id_pelatihan)?.nama}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                            p.status === 'disetujui' ? 'bg-green-100 text-green-700' : 
                            p.status === 'ditolak' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-4 text-center space-x-2">
                          <button onClick={() => handleUpdateStatus(p.id, 'disetujui')} className="text-[10px] bg-white border border-green-500 text-green-600 px-3 py-1 rounded-lg hover:bg-green-500 hover:text-white transition-all font-bold">Terima</button>
                          <button onClick={() => handleUpdateStatus(p.id, 'ditolak')} className="text-[10px] bg-white border border-red-500 text-red-600 px-3 py-1 rounded-lg hover:bg-red-500 hover:text-white transition-all font-bold">Tolak</button>
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