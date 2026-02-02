"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"

// Komponen Kartu Statistik
function StatCard({ title, count, icon, color, link }: { title: string, count: number | string, icon: string, color: string, link: string }) {
  return (
    <Link href={link}>
      <div className={`p-6 rounded-[30px] bg-white border-2 border-slate-50 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer group`}>
        <div className="flex justify-between items-start mb-4">
          <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center text-2xl shadow-inner`}>
            {icon}
          </div>
          <span className="text-slate-300 group-hover:text-indigo-500 transition-colors text-xl">↗</span>
        </div>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-1">{title}</h3>
        <div className="text-3xl font-black text-indigo-950">
          {typeof count === 'number' ? count.toLocaleString() : count} <span className="text-xs font-bold text-slate-400">{typeof count === 'number' ? 'Data' : ''}</span>
        </div>
      </div>
    </Link>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    ikm: 0,
    dataLayanan: 0,
    layananAktif: 0,
    pelatihan: 0,
    peserta: 0, // State baru untuk peserta
    deleted: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      
      // Ambil jumlah data dengan filter yang sudah dikoreksi
      const [ikm, dataLayanan, layananAktif, pelatihan, peserta, deleted] = await Promise.all([
        // 1. IKM Binaan (Hanya yang tidak dihapus)
        supabase.from("ikm_binaan").select("*", { count: 'exact', head: true }).is('deleted_at', null),
        
        // 2. Master Data Layanan (Total semua jenis layanan aktif)
        supabase.from("data_layanan").select("*", { count: 'exact', head: true }).is('deleted_at', null),
        
        // 3. Layanan IKM Juara (Contoh: Menghitung kategori spesifik atau status tertentu)
        supabase.from("data_layanan").select("*", { count: 'exact', head: true }).is('deleted_at', null),
        
        // 4. Kegiatan Pelatihan (Hanya yang tidak dihapus)
        supabase.from("kegiatan_pelatihan").select("*", { count: 'exact', head: true }).is('deleted_at', null),

        // 5. Peserta Pelatihan (Total peserta terinput di tabel peserta)
        supabase.from("peserta_pelatihan").select("*", { count: 'exact', head: true }),
        
        // 6. Recycle Bin (Total data dari tabel utama yang memiliki deleted_at)
        supabase.from("ikm_binaan").select("*", { count: 'exact', head: true }).not('deleted_at', 'is', null)
      ])

      setStats({
        ikm: ikm.count || 0,
        dataLayanan: dataLayanan.count || 0,
        layananAktif: layananAktif.count || 0,
        pelatihan: pelatihan.count || 0,
        peserta: peserta.count || 0,
        deleted: deleted.count || 0
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 md:p-10 bg-[#F8FAFC] min-h-screen font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-10">
          <h1 className="text-4xl font-black text-indigo-950 italic uppercase tracking-tighter mb-2">
            ADMIN DASHBOARD <span className="text-indigo-500">IKM JUARA</span>
          </h1>
          <p className="text-slate-500 font-medium">Selamat datang kembali! Berikut adalah ringkasan data sistem saat ini.</p>
        </div>

        {/* Info Utama - Grid 3 kolom */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <StatCard 
            title="IKM Binaan (Aktif)" 
            count={stats.ikm} 
            icon="👥" 
            color="bg-blue-100" 
            link="/admin/ikm-binaan" 
          />
          <StatCard 
            title="Master Data Layanan" 
            count={stats.dataLayanan} 
            icon="📂" 
            color="bg-purple-100" 
            link="/admin/data-layanan" 
          />
          <StatCard 
            title="Layanan IKM Juara" 
            count={stats.layananAktif} 
            icon="🏆" 
            color="bg-amber-100" 
            link="/admin/layanan" 
          />
          <StatCard 
            title="Pelatihan Industri" 
            count={stats.pelatihan} 
            icon="🎓" 
            color="bg-emerald-100" 
            link="/admin/kegiatan-pelatihan" 
          />
          <StatCard 
            title="Total Peserta Terinput" 
            count={stats.peserta} 
            icon="📝" 
            color="bg-orange-100" 
            link="/admin/kegiatan-pelatihan" 
          />
          <StatCard 
            title="Recycle Bin" 
            count={stats.deleted} 
            icon="🗑️" 
            color="bg-rose-100" 
            link="/admin/recycle-bin" 
          />
        </div>

        {/* Banner Penelusuran */}
        <div className="bg-indigo-950 rounded-[40px] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl border-b-[10px] border-indigo-600 mb-10">
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-black mb-4 uppercase italic">Cari Data IKM?</h2>
            <p className="text-indigo-200 mb-8 max-w-xl font-medium">Gunakan fitur Penelusuran untuk mencari profil lengkap IKM berdasarkan nama, produk, atau wilayah.</p>
            <Link href="/admin/penelusuran">
              <button className="bg-white text-indigo-950 px-8 py-4 rounded-2xl font-black uppercase text-sm hover:bg-indigo-100 transition-all shadow-lg active:scale-95">
                Mulai Penelusuran 🔎
              </button>
            </Link>
          </div>
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-slate-400 text-[10px] font-black uppercase tracking-[3px]">
          IKM Juara Management System &copy; 2026
        </div>
      </div>
    </div>
  )
}