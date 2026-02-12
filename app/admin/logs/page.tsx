"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "../../../lib/supabaseClient"
import * as XLSX from "xlsx"
import { 
  History, Search, User, ShieldCheck, 
  PlusCircle, Edit3, Trash2, Eye, Filter,
  ArrowRightLeft, FileSpreadsheet, Calendar,
  TrendingUp
} from "lucide-react"
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts'

// Komponen StatCard
function StatCard({ title, count, icon: Icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-[30px] shadow-sm border border-slate-100 flex items-center gap-5">
      <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-black text-slate-900">{count}</p>
      </div>
    </div>
  )
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // --- TAMBAHAN: REALTIME SUBSCRIPTION ---
  useEffect(() => {
    fetchLogs();

    // Subscribe ke perubahan tabel activity_logs secara realtime
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_logs' },
        (payload) => {
          setLogs((prevLogs) => [payload.new, ...prevLogs]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  // ---------------------------------------

  const fetchLogs = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
    if (!error) setLogs(data || [])
    setLoading(false)
  }

  // LOGIKA DATA GRAFIK (7 Hari Terakhir)
  const chartData = useMemo(() => {
    const days = [...Array(7)].map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - i)
      return d.toISOString().split('T')[0]
    }).reverse()

    return days.map(day => {
      const dayLogs = logs.filter(l => l.created_at.startsWith(day))
      return {
        tanggal: new Date(day).toLocaleDateString('id-ID', { weekday: 'short' }),
        // Normalisasi role ke lowercase dan menggunakan includes agar user/public terhitung
        Admin: dayLogs.filter(l => l.role?.toLowerCase().includes('admin')).length,
        User: dayLogs.filter(l => l.role?.toLowerCase().includes('user')).length,
      }
    })
  }, [logs])

  const filteredLogs = logs.filter(log => {
    const logDate = new Date(log.created_at).toISOString().split('T')[0]
    
    // --- PENAMBAHAN LOGIKA FILTER ROLE ---
    const roleLower = log.role?.toLowerCase() || '';
    const isUser = roleLower.includes('user');
    const isAdmin = roleLower.includes('admin');

    let matchRole = roleFilter === "all" || log.role?.toLowerCase() === roleFilter.toLowerCase()
    
    // Penyesuaian agar filter tombol 'user' mencakup 'user/public'
    if (roleFilter === "user") matchRole = isUser;
    if (roleFilter === "admin") matchRole = isAdmin;
    // -------------------------------------

    const matchStart = startDate === "" || logDate >= startDate
    const matchEnd = endDate === "" || logDate <= endDate
    return matchRole && matchStart && matchEnd
  })

  const exportToExcel = () => {
    const dataToExport = filteredLogs.map((log, index) => ({
      No: index + 1,
      Pelaku: log.username || 'Anonymous',
      Role: log.role?.toUpperCase(),
      Aktivitas: log.description,
      Waktu: new Date(log.created_at).toLocaleString('id-ID')
    }))
    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Log Terfilter")
    XLSX.writeFile(workbook, `LOG_EXPORT_${new Date().getTime()}.xlsx`)
  }

  const getActivityIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'input': return <PlusCircle className="text-emerald-500" size={18} />
      case 'edit': return <Edit3 className="text-amber-500" size={18} />
      case 'hapus': return <Trash2 className="text-rose-500" size={18} />
      case 'pencarian': return <Search className="text-indigo-500" size={18} />
      default: return <Eye className="text-slate-400" size={18} />
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
              <History size={36} className="text-indigo-600" /> LOG AKTIVITAS
            </h1>
            <p className="text-slate-500 font-medium mt-1">Audit sistem dan analisis tren mingguan.</p>
          </div>
          <button 
            onClick={exportToExcel}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <FileSpreadsheet size={18} /> Export Hasil Filter
          </button>
        </div>

        {/* STATS & CHART ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-1 space-y-6">
            <StatCard title="Total Aktivitas" count={logs.length} icon={ArrowRightLeft} color="bg-indigo-500" />
            <StatCard title="Aksi Admin" count={logs.filter(l => l.role?.toLowerCase().includes('admin')).length} icon={ShieldCheck} color="bg-rose-500" />
            <StatCard title="Aksi User" count={logs.filter(l => l.role?.toLowerCase().includes('user')).length} icon={User} color="bg-emerald-500" />
          </div>
          
          <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs flex items-center gap-2">
                <TrendingUp size={16} className="text-indigo-600" /> Tren Aktivitas 7 Hari Terakhir
              </h3>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorAdmin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorUser" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="tanggal" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '15px'}}
                    itemStyle={{fontSize: '12px', fontWeight: '900', textTransform: 'uppercase'}}
                  />
                  <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase'}} />
                  <Area type="monotone" dataKey="Admin" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorAdmin)" />
                  <Area type="monotone" dataKey="User" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorUser)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* TOOLBAR FILTER */}
        <div className="bg-white p-6 rounded-[30px] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 mb-8 items-end">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Mulai Tanggal</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Sampai Tanggal</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              </div>
            </div>
          </div>
          <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-fit">
            {['all', 'admin', 'user'].map((f) => (
              <button key={f} onClick={() => setRoleFilter(f)} className={`flex-1 md:px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${roleFilter === f ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-indigo-600'}`}>
                {f}
              </button>
            ))}
          </div>
          <button onClick={() => {setStartDate(""); setEndDate(""); setRoleFilter("all")}} className="p-4 text-rose-500 hover:bg-rose-50 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest">Reset</button>
        </div>

        {/* TABLE SECTION */}
        <div className="bg-white rounded-[40px] shadow-xl overflow-hidden border border-slate-100">
          <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
            <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs flex items-center gap-2">
              <Filter size={14} className="text-indigo-600" /> Menampilkan {filteredLogs.length} Data
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white">
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">No.</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Pelaku</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Aktivitas Terrekam</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Waktu Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={4} className="p-20 text-center animate-pulse font-black text-slate-300 uppercase tracking-widest">Sinkronisasi Log...</td></tr>
                ) : filteredLogs.map((log, index) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-6 text-sm font-bold text-slate-300">{(index + 1).toString().padStart(2, '0')}</td>
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[9px] ${log.role?.toLowerCase().includes('admin') ? 'bg-rose-100 text-rose-600 border border-rose-200' : 'bg-emerald-100 text-emerald-600 border border-emerald-200'}`}>
                          {log.role?.toLowerCase().includes('admin') ? 'ADM' : 'USR'}
                        </div>
                        <span className="text-sm font-black text-slate-700 uppercase">{log.username || 'Anonim'}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">{getActivityIcon(log.action_type)}</div>
                        <span className="text-sm font-bold text-slate-600">{log.description}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col text-xs">
                        <span className="font-black text-indigo-900 uppercase">
                          {new Date(log.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                        <span className="font-bold text-slate-400 uppercase mt-0.5">
                          {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}