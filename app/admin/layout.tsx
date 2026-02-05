"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { supabase } from '../../lib/supabaseClient'
import Cookies from 'js-cookie'

const menuItems = [
  { name: "Dashboard", path: "/admin", icon: "📊" },
  { name: "Pengajuan Binaan", path: "/admin/pengajuanbinaan", icon: "📝" },
  { name: "IKM Binaan", path: "/admin/ikm-binaan", icon: "👥" },
  { name: "Layanan IKM Juara", path: "/admin/layanan", icon: "🏆" },
  { name: "Master Data IKM Juara", path: "/admin/data-layanan", icon: "📂" },
  { name: "Pelatihan Industri", path: "/admin/kegiatan-pelatihan", icon: "🎓" },
  { name: "Penelusuran", path: "/admin/penelusuran", icon: "🔎" },
  { name: "Inputan Rencana Pelatihan", path: "/admin/rencana-pelatihan", icon: (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c1.097 0 2.148.155 3.127.442m9.75-15.958a8.967 8.967 0 01-6 2.292m0 14.25a8.967 8.967 0 01-6-2.292m6 2.292c1.097 0 2.148.155 3.127.442" /></svg>) },
  { name: "Recycle Bin", path: "/admin/recycle-bin", icon: "🗑️" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const fetchPendingCount = async () => {
      const { count, error } = await supabase
        .from('ikm_register')
        .select('*', { count: 'exact', head: true })
        .eq('status_verifikasi', 'PENDING');

      if (!error) {
        setPendingCount(count || 0);
      }
    };

    fetchPendingCount();

    // Perbaikan Error TS: Menggunakan any pada channel untuk menghindari strict overload check
    const subscription = supabase
      .channel('pending-badge-realtime')
      .on(
        'postgres_changes' as any, 
        { event: '*', table: 'ikm_register', schema: 'public' }, 
        () => {
          fetchPendingCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const activeMenu = menuItems.find(item => item.path === pathname) || { name: "Admin Panel", icon: "⚙️" };

  const handleLogout = async () => {
    const confirmLogout = confirm("Apakah Anda yakin ingin keluar dari sistem?");
    if (!confirmLogout) return;
    try {
      await supabase.auth.signOut();
      Cookies.remove('sb-access-token');
      router.push('/login');
    } catch (error) {
      console.error("Error saat logout:", error);
      alert("Gagal keluar sistem, silakan coba lagi.");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      
      {/* 1. TOMBOL HAMBURGER (Mobile) */}
      <button 
        onClick={() => setSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-[100] p-3 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-colors"
      >
        {isSidebarOpen ? '✕' : '☰'}
      </button>

      {/* 2. BACKDROP OVERLAY */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-indigo-950/40 z-[80] lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 3. SIDEBAR */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-[90]
        w-72 bg-indigo-950 text-white flex flex-col h-full shadow-2xl transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0
      `}>
        <div className="p-8">
          <h1 className="text-2xl font-black italic tracking-tighter text-white">
            IKM<span className="text-indigo-400">JUARA</span>
          </h1>
          <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-[3px] mt-1 italic">Control Center</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.path
            const isPengajuan = item.name === "Pengajuan Binaan"
            
            return (
              <Link key={item.path} href={item.path} onClick={() => setSidebarOpen(false)}>
                <div className={`
                  flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all duration-200 group relative
                  ${isActive 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50" 
                    : "text-indigo-200/50 hover:bg-indigo-900 hover:text-white"}
                `}>
                  <span className={`text-xl transition-transform ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
                    {isPengajuan && !isActive && pendingCount > 0 ? (
                      <span className="relative flex">
                         <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                         <span className="relative">🔔</span>
                      </span>
                    ) : item.icon}
                  </span>
                  
                  <span className="text-xs uppercase tracking-widest">{item.name}</span>

                  {isPengajuan && pendingCount > 0 && (
                    <span className="ml-auto bg-rose-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg animate-bounce">
                      {pendingCount}
                    </span>
                  )}

                  {isActive && !isPengajuan && <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>}
                </div>
              </Link>
            )
          })}
        </nav>

        <div className="p-6 border-t border-indigo-900/50">
          <button 
            onClick={handleLogout}
            className="w-full bg-rose-500/10 hover:bg-rose-600 text-rose-500 hover:text-white py-4 rounded-2xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 group"
          >
            <span className="group-hover:rotate-12 transition-transform">🚪</span> KELUAR SISTEM
          </button>
        </div>
      </aside>

      {/* 4. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-slate-200 sticky top-0 z-40 px-6 md:px-10 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4 ml-12 lg:ml-0"> 
            <span className="text-xl md:text-2xl">{activeMenu.icon}</span>
            <div>
              <h2 className="text-xs md:text-sm font-black text-indigo-950 uppercase tracking-widest truncate max-w-[150px] md:max-w-none">
                {activeMenu.name}
              </h2>
              <p className="hidden md:block text-[10px] text-slate-400 font-bold uppercase">
                Halaman Admin / {activeMenu.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-indigo-600 uppercase">Administrator</p>
                <p className="text-[9px] font-bold text-slate-400">Online</p>
             </div>
             <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm font-bold text-indigo-600">
                A
             </div>
          </div>
        </header>

        <div className="p-4 md:p-8 overflow-y-auto flex-1">
          {children}
        </div>
      </main>
    </div>
  )
}