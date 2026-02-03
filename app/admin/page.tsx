"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import Image from "next/image";

// Komponen Kartu Statistik dengan Desain Ultra Modern
function StatCard({ title, count, icon, color, link, delay }: { title: string, count: number | string, icon: string, color: string, link: string, delay: string }) {
  return (
    <Link href={link}>
      <div className={`relative p-7 rounded-[2.5rem] bg-white border border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] hover:shadow-[0_40px_80px_-15px_rgba(79,70,229,0.15)] hover:-translate-y-3 transition-all duration-500 cursor-pointer group overflow-hidden`}>
        {/* Glow Decor */}
        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity ${color.replace('bg-', 'bg-')}`}></div>
        
        <div className="relative z-10 flex justify-between items-start mb-6">
          <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center text-3xl shadow-xl shadow-inner group-hover:rotate-12 transition-transform duration-500`}>
            {icon}
          </div>
          <div className="flex flex-col items-end">
             <span className="text-slate-300 group-hover:text-indigo-600 transition-colors font-black text-xl">→</span>
          </div>
        </div>

        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[2.5px] mb-2 group-hover:text-indigo-600 transition-colors">{title}</h3>
        <div className="text-3xl md:text-4xl font-black text-[#1A1A40] flex items-baseline gap-2">
          {typeof count === 'number' ? count.toLocaleString() : count}
          <span className="text-xs font-bold text-slate-400 lowercase tracking-normal">entri</span>
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
    peserta: 0,
    deleted: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const [ikm, layanan, pelatihan, peserta] = await Promise.all([
        supabase.from("ikm_binaan").select("*", { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from("layanan_ikm_juara").select("*", { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from("kegiatan_pelatihan").select("*", { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from("peserta_pelatihan").select("*", { count: 'exact', head: true }),
      ])

      const { count: countDeleted } = await supabase
        .from("ikm_binaan")
        .select("*", { count: 'exact', head: true })
        .not('deleted_at', 'is', null)

      setStats({
        ikm: ikm.count || 0,
        dataLayanan: layanan.count || 0, 
        layananAktif: layanan.count || 0, 
        pelatihan: pelatihan.count || 0,
        peserta: peserta.count || 0,
        deleted: countDeleted || 0
      })
    } catch (error) {
      console.error("Gagal memuat statistik:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 md:p-10 bg-[#F8FAFC] min-h-screen font-sans overflow-hidden">
      {/* Background Decorative Blobs */}
      <div className="fixed top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[120px] -z-10 animate-pulse"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Modern Header Area */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="animate-fadeIn">
            <div className="flex items-center gap-3 mb-4">
               <Image src="/ikmjuarav2.png" alt="Logo" width={40} height={40} className="shadow-lg rounded-xl" />
               <div className="h-8 w-[2px] bg-slate-200"></div>
               <span className="text-xs font-black text-indigo-600 uppercase tracking-[4px]">Portal Admin</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-[#1A1A40] italic uppercase tracking-tighter leading-none">
              DASHBOARD <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 underline decoration-yellow-400 decoration-8 underline-offset-[10px]">IKM JUARA</span>
            </h1>
          </div>
          
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
             <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase">Status Sistem</p>
                <p className="text-xs font-bold text-green-500 flex items-center gap-1 justify-end">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span> Online
                </p>
             </div>
             <div className="w-12 h-12 bg-[#1A1A40] rounded-xl flex items-center justify-center text-white font-black">A</div>
          </div>
        </div>

        {/* Info Utama - Grid Statistik */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
          <StatCard title="IKM Binaan (Aktif)" count={stats.ikm} icon="👥" color="bg-indigo-50" link="/admin/ikm-binaan" delay="0" />
          <StatCard title="Master Layanan" count={stats.dataLayanan} icon="📂" color="bg-violet-50" link="/admin/data-layanan" delay="100" />
          <StatCard title="Layanan IKM Juara" count={stats.layananAktif} icon="🏆" color="bg-amber-50" link="/admin/layanan" delay="200" />
          <StatCard title="Pelatihan Industri" count={stats.pelatihan} icon="🎓" color="bg-emerald-50" link="/admin/kegiatan-pelatihan" delay="300" />
          <StatCard title="Peserta Terinput" count={stats.peserta} icon="📝" color="bg-orange-50" link="/admin/kegiatan-pelatihan" delay="400" />
          <StatCard title="Recycle Bin" count={stats.deleted} icon="🗑️" color="bg-rose-50" link="/admin/recycle-bin" delay="500" />
        </div>

        {/* Hero Banner Penelusuran - Selaras dengan Landing Page */}
        <div className="group relative bg-[#1A1A40] rounded-[3rem] p-10 md:p-16 text-white overflow-hidden shadow-[0_50px_100px_-20px_rgba(26,26,64,0.4)] border-b-[12px] border-indigo-600 transition-transform duration-500">
          {/* Animated Background Decoration */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full blur-[100px] opacity-20 group-hover:scale-125 transition-transform duration-1000"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="text-center md:text-left flex-1">
              <div className="inline-block px-4 py-1 rounded-full bg-white/10 border border-white/20 text-indigo-300 text-[10px] font-black uppercase tracking-[3px] mb-6">
                IKM JUARA Integrasi Konsultasi Mandiri untuk Jaminan Usaha, Akselerasi, dan Produktivitas Industri Anda!
              </div>
              <h2 className="text-3xl md:text-5xl font-black mb-6 uppercase italic leading-none tracking-tighter">
                Butuh Data <br/>Spesifik <span className="text-yellow-400">IKM?</span>
              </h2>
              <p className="text-sm md:text-lg text-indigo-100/70 mb-10 max-w-lg font-medium leading-relaxed">
                Akses penelusuran cerdas dengan NIB, NIK dan Nama Lengkap IKM untuk melihat database IKM secara real-time.
              </p>
              <Link href="/admin/penelusuran">
                <button className="group relative bg-white text-[#1A1A40] px-10 py-5 rounded-2xl font-black uppercase text-xs hover:bg-yellow-400 transition-all active:scale-95 shadow-2xl flex items-center gap-3">
                  Buka Penelusuran 
                  <span className="group-hover:translate-x-4 transition-transform">🕵️‍♀️</span>
                </button>
              </Link>
            </div>
            
            {/* Visual Icon for Banner */}
            <div className="w-48 h-48 md:w-64 md:h-64 bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 flex items-center justify-center text-8xl shadow-inner animate-float">
               🔎
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-20 py-10 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-[10px] font-black uppercase tracking-[4px] text-slate-400 text-center md:text-left">
            Copyright &copy; 2026 • IKM JUARA (Bidang Perindustrian DISNAKERKUKM KOTA MADIUN)
          </div>
          <div className="flex gap-6 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
             <span className="cursor-pointer hover:text-indigo-400 transition">Privacy</span>
             <span className="cursor-pointer hover:text-indigo-400 transition">Support</span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-fadeIn { animation: fadeIn 0.8s ease-out forwards; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}