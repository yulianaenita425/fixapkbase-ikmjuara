import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/90 backdrop-blur-md z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tighter text-red-600">IKM <span className="text-yellow-600">JUARA</span></span>
            </div>
            <div className="hidden md:flex space-x-8 font-medium text-sm">
              <a href="#profil" className="hover:text-red-600 transition">Profil</a>
              <a href="#layanan" className="hover:text-red-600 transition">Layanan</a>
              <a href="#kontak" className="hover:text-red-600 transition">Kontak</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="mb-8 flex justify-center">
            {/* Pastikan file Laura joss.png ada di folder /public */}
            <Image 
              src="/Laura joss.png" 
              alt="Logo IKM JUARA" 
              width={250} 
              height={250} 
              className="drop-shadow-xl hover:scale-105 transition-transform duration-300"
              priority
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            IKM JUARA – Dari Lokal Berkarya, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-yellow-500 to-green-600">
              ke Global Berdaya!
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            Integrasi Konsultasi Mandiri untuk Jaminan Usaha, Akselerasi, dan Produktivitas Industri Anda!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#profil" className="px-8 py-4 bg-red-600 text-white rounded-full font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200">
              Pelajari Program
            </a>
            <a href="https://wa.me/085655480223" className="px-8 py-4 border-2 border-green-600 text-green-700 rounded-full font-bold hover:bg-green-50 transition-all">
              Konsultasi Gratis
            </a>
          </div>
        </div>
      </section>

      {/* Profil Program Section */}
      <section id="profil" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-gray-900">Profil Program</h2>
              <div className="prose prose-lg text-gray-600 leading-relaxed">
                <p className="mb-4 text-justify">
                  Kota Madiun terus meneguhkan posisinya sebagai kota yang ramah terhadap pertumbuhan industri kecil dan menengah. 
                  Melalui program <strong>IKM JUARA</strong>, pemerintah menghadirkan layanan klinik konsultasi industri terintegrasi 
                  yang menjadi mitra strategis para pelaku IKM untuk naik kelas dan bersaing di pasar global.
                </p>
                <p className="text-justify">
                  IKM JUARA hadir sebagai bukti nyata komitmen Kota Madiun untuk mendorong pelaku usaha menjadi lebih mandiri, 
                  kompetitif, dan berorientasi global. Dengan semangat Juara, setiap IKM akan menjadi inspirasi bagi pelaku industri lainnya.
                </p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="w-2 h-8 bg-yellow-500 rounded-full"></span>
                Layanan Terpadu Kami
              </h3>
              <ul className="space-y-4">
                {[
                  "Pendampingan legalitas & perlindungan usaha",
                  "Peningkatan produktivitas & efisiensi produksi",
                  "Branding, Inovasi Desain, & Akses Pasar Digital",
                  "Fasilitasi Ekspor & Daya Saing Global"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-700">
                    <svg className="w-6 h-6 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Layanan Section (Features) */}
      <section id="layanan" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Mengapa IKM JUARA?</h2>
            <p className="text-gray-500">Kami memberikan solusi dari hulu ke hilir untuk pertumbuhan bisnis Anda.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-8 rounded-2xl hover:bg-white hover:shadow-2xl transition duration-300 border border-transparent hover:border-gray-100 group">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-6 transition">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h4 className="text-xl font-bold mb-3">Legalitas Usaha</h4>
              <p className="text-gray-600">Jaminan keamanan usaha melalui pendampingan izin dan regulasi yang lengkap.</p>
            </div>
            <div className="p-8 rounded-2xl hover:bg-white hover:shadow-2xl transition duration-300 border border-transparent hover:border-gray-100 group">
              <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-6 transition">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h4 className="text-xl font-bold mb-3">Akselerasi</h4>
              <p className="text-gray-600">Percepat pertumbuhan produksi dengan metodologi industri yang efisien.</p>
            </div>
            <div className="p-8 rounded-2xl hover:bg-white hover:shadow-2xl transition duration-300 border border-transparent hover:border-gray-100 group">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-6 transition">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.5a2.5 2.5 0 002.5-2.5V11m-12.8 5c.892 1.752 2.326 3.186 4.078 4.078M15 7a2 2 0 114 0 2 2 0 01-4 0z" /></svg>
              </div>
              <h4 className="text-xl font-bold mb-3">Akses Global</h4>
              <p className="text-gray-600">Bawa produk lokal Anda mendunia melalui penguatan branding dan pasar ekspor.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="kontak" className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center md:text-left">
          <div className="grid md:grid-cols-2 gap-8 items-center border-b border-gray-800 pb-12 mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-2 text-red-500">IKM JUARA</h2>
              <p className="text-gray-400">Pusat Layanan Konsultasi Industri Kota Madiun.</p>
            </div>
            <div className="md:text-right">
              <p className="text-sm text-gray-500 leading-relaxed uppercase tracking-widest">
                Dari Lokal Berkarya, ke Global Berdaya
              </p>
            </div>
          </div>
          <p className="text-center text-gray-500 text-sm italic">
            &copy; 2026 Pemerintah Kota Madiun. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}