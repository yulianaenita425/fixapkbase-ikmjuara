import React from 'react';
import { ShieldCheck, Lock, Eye, Database, Scale, UserCheck } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 py-16 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block p-3 bg-white/10 rounded-full mb-4 backdrop-blur-sm">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Kebijakan Privasi & Keamanan
          </h1>
          <p className="text-blue-100 text-lg md:text-xl font-medium uppercase tracking-wider">
            IKM JUARA – Dari Lokal Berkarya, ke Global Berdaya!
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-12 -mt-10">
        {/* Intro Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-10 border-t-4 border-orange-500">
          <p className="text-lg leading-relaxed text-slate-600">
            <span className="font-bold text-indigo-700 underline decoration-orange-300">IKM JUARA</span> (Integrasi Konsultasi Mandiri untuk Jaminan Usaha, Akselerasi, dan Produktivitas Industri Anda) berkomitmen penuh melindungi privasi data Anda. Kebijakan ini adalah janji kami dalam mengelola data yang dikelola oleh Pemerintah Kota Madiun secara transparan dan aman.
          </p>
        </div>

        {/* Grid Content */}
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Section 1: Pengumpulan Data */}
          <section className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-slate-100">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <Database className="text-blue-600" size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">1. Pengumpulan Data</h2>
            </div>
            <p className="text-slate-600 text-sm mb-3">Kami mengumpulkan data pelaku IKM, pendamping, dan mitra melalui cara yang sah:</p>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1 ml-2">
              <li>Identitas pelaku usaha & info produk.</li>
              <li>Dokumen legalitas & perizinan.</li>
              <li>Data konsultasi & pembinaan.</li>
              <li>Metadata aktivitas sistem.</li>
            </ul>
          </section>

          {/* Section 2: Penggunaan Data */}
          <section className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-slate-100">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <Eye className="text-green-600" size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">2. Penggunaan Data</h2>
            </div>
            <p className="text-slate-600 text-sm mb-3">Data Anda digunakan eksklusif untuk kemajuan Anda:</p>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1 ml-2">
              <li>Pelayanan konsultasi & pendampingan.</li>
              <li>Analisis produktivitas & perumusan kebijakan.</li>
              <li>Monitoring & evaluasi program IKM JUARA.</li>
            </ul>
          </section>

          {/* Section 3: Keamanan & Penyimpanan */}
          <section className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 md:col-span-2">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-red-100 rounded-lg mr-3">
                <Lock className="text-red-600" size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">3. Keamanan & Penyimpanan</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-slate-600">
              <div>
                <p className="font-semibold mb-2">Langkah Pengamanan:</p>
                <p>Kami menerapkan enkripsi data, autentikasi akun, dan kontrol akses ketat berdasarkan peran pengguna.</p>
              </div>
              <div>
                <p className="font-semibold mb-2">Lokasi Penyimpanan:</p>
                <p>Data disimpan digital pada server Pemda Kota Madiun dengan standar keamanan fisik dan digital pemerintah.</p>
              </div>
            </div>
          </section>

          {/* Section 4: Hak & Tanggung Jawab */}
          <section className="bg-indigo-900 p-8 rounded-xl shadow-lg md:col-span-2 text-white">
            <div className="grid md:grid-cols-2 gap-10">
              <div>
                <div className="flex items-center mb-4">
                  <UserCheck className="text-indigo-300 mr-2" size={24} />
                  <h2 className="text-xl font-bold">Hak Pengguna</h2>
                </div>
                <ul className="space-y-2 text-indigo-100 text-sm">
                  <li>• Mengakses & memperbarui data usaha.</li>
                  <li>• Mendapat info pengelolaan & kebijakan privasi.</li>
                  <li>• Mendapat perlindungan data pribadi & usaha.</li>
                </ul>
              </div>
              <div>
                <div className="flex items-center mb-4">
                  <Scale className="text-indigo-300 mr-2" size={24} />
                  <h2 className="text-xl font-bold">Kepatuhan Regulasi</h2>
                </div>
                <p className="text-sm text-indigo-100">
                  IKM JUARA patuh pada UU Kearsipan No. 43/2009, UU Perlindungan Data Pribadi No. 27/2022, dan Perpres SPBE No. 95/2018.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center bg-white p-8 rounded-2xl border-2 border-dashed border-slate-200">
          <h3 className="text-2xl font-bold text-indigo-800 mb-2">Siap Naik Kelas?</h3>
          <p className="text-slate-500 mb-6 max-w-2xl mx-auto">
            Seluruh aktivitas dicatat dalam sistem audit untuk transparansi. Pastikan Anda menggunakan sistem secara bertanggung jawab.
          </p>
          <div className="text-xs text-slate-400 uppercase tracking-widest">
            Terakhir Diperbarui: 2024 • Pemerintah Kota Madiun
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-indigo-600 font-bold italic text-lg">
            ✨ IKM JUARA: Menjaga kepercayaan, keamanan, dan masa depan usaha Anda.
          </p>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;