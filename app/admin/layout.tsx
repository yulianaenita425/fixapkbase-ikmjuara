"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const menuItems = [
  { name: "Dashboard", path: "/admin", icon: "📊" },
  { name: "IKM Binaan", path: "/admin/ikm-binaan", icon: "👥" },
  { name: "Layanan IKM Juara", path: "/admin/layanan", icon: "🏆" },
  { name: "Master Data IKM Juara", path: "/admin/data-layanan", icon: "📂" },
  { name: "Pelatihan Industri", path: "/admin/kegiatan-pelatihan", icon: "🎓" },
  { name: "Penelusuran", path: "/admin/penelusuran", icon: "🔎" },
  { name: "Recycle Bin", path: "/admin/recycle-bin", icon: "🗑️" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isSidebarOpen, setSidebarOpen] = useState(false) // Fitur Toggle Mobile
  
  const activeMenu = menuItems.find(item => item.path === pathname) || { name: "Admin Panel", icon: "⚙️" };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      
      {/* 1. TOMBOL HAMBURGER (Hanya muncul di Mobile) */}
      <button 
        onClick={() => setSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-[100] p-3 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-colors"
      >
        {isSidebarOpen ? '✕' : '☰'}
      </button>

      {/* 2. BACKDROP OVERLAY (Menutup menu saat layar gelap diklik) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-indigo-950/40 z-[80] lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 3. SIDEBAR (Sekarang Responsif) */}
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
            return (
              <Link key={item.path} href={item.path} onClick={() => setSidebarOpen(false)}>
                <div className={`
                  flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all duration-200 group
                  ${isActive 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50" 
                    : "text-indigo-200/50 hover:bg-indigo-900 hover:text-white"}
                `}>
                  <span className={`text-xl ${isActive ? "scale-110" : "group-hover:scale-110"} transition-transform`}>
                    {item.icon}
                  </span>
                  <span className="text-xs uppercase tracking-widest">{item.name}</span>
                  {isActive && <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>}
                </div>
              </Link>
            )
          })}
        </nav>

        <div className="p-6 border-t border-indigo-900/50">
          <Link href="/">
            <button className="w-full bg-rose-500/10 hover:bg-rose-600 text-rose-500 hover:text-white py-4 rounded-2xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2">
              <span>🚪</span> KELUAR SISTEM
            </button>
          </Link>
        </div>
      </aside>

      {/* 4. MAIN CONTENT AREA */}
      {/* ml-0 di mobile, ml-72 di desktop (karena sidebar fixed/static) */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* TOP NAVBAR */}
        <header className="h-20 bg-white border-b border-slate-200 sticky top-0 z-40 px-6 md:px-10 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4 ml-12 lg:ml-0"> 
            {/* ml-12 memberi ruang agar teks tidak tertutup tombol hamburger di mobile */}
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

        {/* CONTENT PAGE */}
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}