"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"
import * as XLSX from "xlsx"
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title 
} from "chart.js"
import { Pie, Bar } from "react-chartjs-2"

// Registrasi komponen ChartJS
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

export default function DataIndustriMadiunLengkap() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterKecamatan, setFilterKecamatan] = useState<string | null>(null)

  // State untuk Statistik Ringkas & Grafik
  const [stats, setStats] = useState({
    total: 0,
    kecamatan: {
      kartoharjo: 0,
      manguharjo: 0,
      taman: 0
    }
  })

  // ================= FETCH DATA =================
  const fetchSeluruhData = useCallback(async () => {
    setLoading(true)
    const { data: res, error } = await supabase
      .from("ikm_binaan")
      .select("*")
      .eq("is_deleted", false)
      .order("nama_usaha", { ascending: true });

    if (!error && res) {
      setData(res)
      
      // Hitung Statistik Berdasarkan Alamat
      const krt = res.filter(i => (i.alamat || "").toLowerCase().includes("kartoharjo")).length
      const mng = res.filter(i => (i.alamat || "").toLowerCase().includes("manguharjo")).length
      const tmn = res.filter(i => (i.alamat || "").toLowerCase().includes("taman")).length
      
      setStats({ 
        total: res.length, 
        kecamatan: { kartoharjo: krt, manguharjo: mng, taman: tmn } 
      })
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchSeluruhData()
  }, [fetchSeluruhData])

  // ================= LOGIKA FILTER =================
  const filteredData = data.filter((item) => {
    const matchesSearch = [item.nama_usaha, item.nama_lengkap, item.alamat, item.no_nib].some(val => 
      String(val || "").toLowerCase().includes(search.toLowerCase())
    )
    const matchesKecamatan = filterKecamatan 
      ? (item.alamat || "").toLowerCase().includes(filterKecamatan.toLowerCase())
      : true
    return matchesSearch && matchesKecamatan
  })

  // ================= KONFIGURASI GRAFIK =================
  const pieData = {
    labels: ["Kartoharjo", "Manguharjo", "Taman"],
    datasets: [{
      data: [stats.kecamatan.kartoharjo, stats.kecamatan.manguharjo, stats.kecamatan.taman],
      backgroundColor: ["#f59e0b", "#4f46e5", "#e11d48"],
      hoverOffset: 20,
      borderWidth: 5,
      borderColor: "#ffffff"
    }]
  }

  const barData = {
    labels: ["Kartoharjo", "Manguharjo", "Taman"],
    datasets: [{
      label: "Unit IKM",
      data: [stats.kecamatan.kartoharjo, stats.kecamatan.manguharjo, stats.kecamatan.taman],
      backgroundColor: "rgba(59, 130, 246, 0.8)",
      borderRadius: 10,
    }]
  }

  // ================= EXPORT EXCEL =================
  const exportFullData = () => {
    const dataToExport = filteredData.map((item, index) => ({
      No: index + 1,
      "Nama Usaha": item.nama_usaha,
      "Nama Pemilik": item.nama_lengkap,
      NIB: item.no_nib,
      NIK: item.nik,
      Alamat: item.alamat,
      WhatsApp: item.no_hp
    }))
    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Data Industri")
    XLSX.writeFile(wb, `Laporan_Industri_Madiun_${filterKecamatan || 'Semua'}.xlsx`)
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-900">
      
      {/* HEADER */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-blue-900 tracking-tight flex items-center gap-3">
            🏢 DATA TERPADU INDUSTRI MADIUN
          </h1>
          <p className="text-slate-500 font-medium italic">Sinkronisasi data real-time binaan dinas terkait.</p>
        </div>
        <button onClick={exportFullData} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-emerald-100 transition-all flex items-center gap-2 active:scale-95">
          📥 Export Laporan ({filteredData.length})
        </button>
      </div>

      {/* SECTION 1: ANALYTICS GRAPHICS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Card Pie Chart */}
        <div className="bg-white p-8 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100">
          <h3 className="text-center font-black text-slate-400 text-xs uppercase tracking-[0.2em] mb-6">Persentase Sebaran Wilayah</h3>
          <div className="w-full max-w-[280px] mx-auto">
            <Pie data={pieData} options={{ plugins: { legend: { display: false } } }} />
          </div>
          <div className="mt-8 flex justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-xs font-bold text-slate-600">Kartoharjo ({Math.round((stats.kecamatan.kartoharjo/stats.total)*100) || 0}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
              <span className="text-xs font-bold text-slate-600">Manguharjo ({Math.round((stats.kecamatan.manguharjo/stats.total)*100) || 0}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-600"></div>
              <span className="text-xs font-bold text-slate-600">Taman ({Math.round((stats.kecamatan.taman/stats.total)*100) || 0}%)</span>
            </div>
          </div>
        </div>

        {/* Card Bar Chart */}
        <div className="bg-white p-8 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100">
          <h3 className="text-center font-black text-slate-400 text-xs uppercase tracking-[0.2em] mb-6">Komparasi Unit Per Kecamatan</h3>
          <div className="h-[250px]">
            <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
          <div className="mt-6 p-5 bg-slate-900 rounded-3xl text-white flex justify-between items-center">
             <span className="text-xs font-bold opacity-70">TOTAL SELURUH INDUSTRI:</span>
             <span className="text-3xl font-black">{stats.total} <small className="text-xs font-normal">UNIT</small></span>
          </div>
        </div>
      </div>

      {/* SECTION 2: STATS INTERACTIVE BUTTONS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <button onClick={() => setFilterKecamatan(null)} className={`p-6 rounded-3xl border transition-all text-left ${!filterKecamatan ? 'bg-blue-600 text-white shadow-xl' : 'bg-white text-slate-600'}`}>
          <p className="text-[10px] font-black uppercase opacity-60">Semua Wilayah</p>
          <p className="text-3xl font-black">{stats.total}</p>
        </button>
        {["Kartoharjo", "Manguharjo", "Taman"].map((kec) => (
          <button 
            key={kec} 
            onClick={() => setFilterKecamatan(kec)}
            className={`p-6 rounded-3xl border transition-all text-left ${filterKecamatan === kec ? 'bg-indigo-600 text-white shadow-xl' : 'bg-white text-slate-600'}`}
          >
            <p className="text-[10px] font-black uppercase opacity-60">Kec. {kec}</p>
            <p className="text-3xl font-black">{stats.kecamatan[kec.toLowerCase() as keyof typeof stats.kecamatan]}</p>
          </button>
        ))}
      </div>

      {/* SECTION 3: DATA TABLE */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-6 border-b bg-slate-50/50 flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full text-sm">
            <span className="absolute left-4 top-1/2 -translate-y-1/2">🔍</span>
            <input 
              type="text" 
              placeholder="Cari Nama Usaha, Pemilik, NIB, atau Alamat..."
              className="w-full pl-12 pr-6 py-4 rounded-2xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {filterKecamatan && (
            <button onClick={() => setFilterKecamatan(null)} className="text-[10px] font-black text-white bg-red-500 px-4 py-2 rounded-full hover:bg-red-600 transition uppercase">
              Reset Filter Wilayah ✕
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase font-black text-slate-400 bg-slate-50/50 border-b">
                <th className="px-8 py-4">No</th>
                <th className="px-4 py-4">Usaha & Pemilik</th>
                <th className="px-4 py-4">Legalitas (NIB)</th>
                <th className="px-4 py-4">Lokasi / Alamat</th>
                <th className="px-8 py-4 text-right">Hubungi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-black text-xl animate-pulse">MEMUAT DATABASE...</td></tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <tr key={item.id} className="group hover:bg-slate-50 transition-all">
                    <td className="px-8 py-5 text-slate-300 font-mono text-xs">{index + 1}</td>
                    <td className="px-4 py-5">
                      <div className="font-black text-slate-800 uppercase text-sm">{item.nama_usaha}</div>
                      <div className="text-[10px] font-bold text-slate-400 italic">{item.nama_lengkap}</div>
                    </td>
                    <td className="px-4 py-5 font-mono text-xs font-bold text-blue-600">{item.no_nib}</td>
                    <td className="px-4 py-5 text-[10px] text-slate-500 max-w-[250px] leading-relaxed uppercase">{item.alamat}</td>
                    <td className="px-8 py-5 text-right">
                      <a 
                        href={`https://wa.me/${String(item.no_hp).replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        className="inline-block px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all border border-emerald-200"
                      >
                        WhatsApp 💬
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="p-20 text-center text-slate-400 italic text-sm">Data tidak ditemukan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.3em]">Madiun Industry Data Center © 2026</p>
      </div>
    </div>
  )
}