"use client"

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
  
  // Mencari nama menu aktif berdasarkan path URL
  const activeMenu = menuItems.find(item => item.path === pathname) || { name: "Admin Panel", icon: "⚙️" };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* --- SIDEBAR FIXED --- */}
      <aside className="w-72 bg-indigo-950 text-white flex flex-col fixed h-full shadow-2xl z-50">
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
              <Link key={item.path} href={item.path}>
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

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 ml-72 flex flex-col">
        {/* TOP NAVBAR / HEADER */}
        <header className="h-20 bg-white border-b border-slate-200 sticky top-0 z-40 px-10 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <span className="text-2xl">{activeMenu.icon}</span>
            <div>
              <h2 className="text-sm font-black text-indigo-950 uppercase tracking-widest">{activeMenu.name}</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Halaman Admin / {activeMenu.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="text-right hidden md:block">
                <p className="text-[10px] font-black text-indigo-600 uppercase">Administrator</p>
                <p className="text-[9px] font-bold text-slate-400">Online</p>
             </div>
             <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm font-bold text-indigo-600">
                A
             </div>
          </div>
        </header>

        {/* CONTENT PAGE */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}