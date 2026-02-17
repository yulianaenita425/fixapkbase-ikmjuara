"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { 
  Briefcase, Search, RefreshCcw, CheckCircle, 
  XCircle, Phone, MapPin, Package, Calendar, 
  Eye, User, FileText, Clock, Trash2, Filter
} from 'lucide-react';

export default function PengajuanBinaan() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLayanan, setFilterLayanan] = useState("SEMUA");
  const [selectedIKM, setSelectedIKM] = useState<any>(null);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('table-db-changes')
      .on('postgres_changes' as any, { event: '*', table: 'ikm_register' }, () => {
        fetchData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: registers, error } = await supabase
      .from('ikm_register')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && registers) {
      setData(registers);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('ikm_register')
      .update({ status_verifikasi: newStatus })
      .eq('id', id);

    if (!error) {
      fetchData();
      if (selectedIKM) setSelectedIKM(null);
    }
  };

const deleteData = async (id: string) => {
  if (confirm("Apakah Anda yakin ingin menghapus data ini secara permanen?")) {
    const { error } = await supabase
      .from('ikm_register')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Gagal menghapus:", error.message);
      alert("Gagal menghapus data: " + error.message);
    } else {
      fetchData();
    }
  }
};

  // Filter Logic
  const filteredData = data.filter(item => {
    const matchesSearch = (item.nama_lengkap?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                          (item.nama_usaha?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                          (item.no_nib || "").includes(searchTerm);
    const matchesFilter = filterLayanan === "SEMUA" || item.layanan_prioritas === filterLayanan;
    return matchesSearch && matchesFilter;
  });

  // Get Unique Layanan for Filter Dropdown
  const uniqueLayanan = Array.from(new Set(data.map(item => item.layanan_prioritas)));

  // Statistik
  const stats = {
    total: data.length,
    pending: data.filter(d => d.status_verifikasi === 'PENDING').length,
    verif: data.filter(d => d.status_verifikasi === 'TERVERIFIKASI').length,
    tolak: data.filter(d => d.status_verifikasi === 'DITOLAK').length,
  };

  return (
    <div className="space-y-6 p-4">
      
      {/* 1. HEADER & SEARCH */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#1A1A40] uppercase tracking-tighter flex items-center gap-3">
            <Briefcase className="text-indigo-600" /> Pengajuan Binaan
          </h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Manajemen Data Pendaftar IKM</p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari NIB / Nama..."
              className="pl-11 pr-4 py-3 bg-slate-50 rounded-xl outline-none border-2 border-transparent focus:border-indigo-600 font-bold text-sm w-full transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select 
              className="pl-11 pr-8 py-3 bg-slate-50 rounded-xl outline-none border-2 border-transparent focus:border-indigo-600 font-bold text-sm appearance-none cursor-pointer"
              value={filterLayanan}
              onChange={(e) => setFilterLayanan(e.target.value)}
            >
              <option value="SEMUA">Semua Layanan</option>
              {uniqueLayanan.map((l, i) => <option key={i} value={l}>{l}</option>)}
            </select>
          </div>
          <button onClick={fetchData} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all">
            <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Pengajuan" value={stats.total} color="bg-indigo-600" icon={<FileText size={20}/>} />
        <StatCard label="Menunggu" value={stats.pending} color="bg-amber-500" icon={<Clock size={20}/>} />
        <StatCard label="Diverifikasi" value={stats.verif} color="bg-emerald-500" icon={<CheckCircle size={20}/>} />
        <StatCard label="Ditolak" value={stats.tolak} color="bg-rose-500" icon={<XCircle size={20}/>} />
      </div>

      {/* 3. TABLE SECTION */}
      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-800 text-[11px] font-black uppercase tracking-widest text-white">
                <th className="p-5 text-center w-16">#</th>
                <th className="p-5">Profil IKM</th>
                <th className="p-5">Layanan & Pelatihan</th>
                <th className="p-5">Status</th>
                <th className="p-5 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center font-black text-slate-300 animate-pulse uppercase">Sinkronisasi Data...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center font-bold text-slate-400 uppercase tracking-widest">Data Tidak Ditemukan</td></tr>
              ) : (
                filteredData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-all group">
                    <td className="p-5 text-center font-bold text-slate-400 text-sm">{index + 1}</td>
                    <td className="p-5">
                      <div className="flex flex-col">
                        <span className="font-black text-[#1A1A40] uppercase text-sm tracking-tight">{item.nama_lengkap}</span>
                        <span className="text-[11px] font-bold text-indigo-600 uppercase italic mb-1">{item.nama_usaha}</span>
                        <span className="text-[9px] font-black bg-slate-100 w-fit px-2 py-0.5 rounded text-slate-500 uppercase">NIB: {item.no_nib}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="text-[11px] font-black text-slate-600 uppercase leading-tight bg-slate-50 p-2 rounded-lg border-l-4 border-indigo-500">
                        {item.layanan_prioritas}
                        {item.sub_pelatihan && <p className="text-orange-600 italic lowercase text-[10px]">↳ {item.sub_pelatihan}</p>}
                      </div>
                    </td>
                    <td className="p-5">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        item.status_verifikasi === 'PENDING' ? 'bg-amber-100 text-amber-600' : 
                        item.status_verifikasi === 'TERVERIFIKASI' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                      }`}>
                        {item.status_verifikasi}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => setSelectedIKM(item)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => updateStatus(item.id, 'TERVERIFIKASI')} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all">
                          <CheckCircle size={16} />
                        </button>
                        <button onClick={() => deleteData(item.id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODAL DETAIL VIEW */}
      {selectedIKM && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end">
          <div className="absolute inset-0 bg-indigo-950/40 backdrop-blur-sm" onClick={() => setSelectedIKM(null)} />
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl p-8 overflow-y-auto">
            <div className="flex justify-between items-start mb-8 border-b pb-4">
              <div>
                <h3 className="text-2xl font-black text-[#1A1A40] uppercase tracking-tighter">Detail Pendaftar</h3>
                <p className="text-indigo-600 font-bold text-xs uppercase italic">{selectedIKM.nama_usaha}</p>
              </div>
              <button onClick={() => setSelectedIKM(null)} className="text-slate-400 hover:text-rose-500 text-2xl font-bold">✕</button>
            </div>

            <div className="space-y-4">
              <DetailBox icon={<User />} label="Nama Pemilik" value={selectedIKM.nama_lengkap} />
              <DetailBox icon={<FileText />} label="NIK / NIB" value={`${selectedIKM.nik} / ${selectedIKM.no_nib}`} />
              <DetailBox icon={<MapPin />} label="Alamat Usaha" value={selectedIKM.alamat_usaha} />
              <DetailBox icon={<Phone />} label="No. HP" value={selectedIKM.no_hp} />
              <DetailBox icon={<Package />} label="Produk Utama" value={selectedIKM.produk_utama} />
              <DetailBox icon={<Calendar />} label="Tanggal Daftar" value={new Date(selectedIKM.created_at).toLocaleDateString('id-ID', { dateStyle: 'full' })} />
              
              <div className="pt-8 flex flex-col gap-3">
                <a href={`https://wa.me/${selectedIKM.no_hp}`} target="_blank" rel="noopener noreferrer" className="w-full bg-emerald-500 text-white p-4 rounded-xl font-black text-center text-xs uppercase flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100">
                  <Phone size={18} /> Hubungi WhatsApp
                </a>
                <div className="flex gap-2">
                   <button onClick={() => updateStatus(selectedIKM.id, 'TERVERIFIKASI')} className="flex-1 p-4 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs hover:bg-indigo-700">Verifikasi</button>
                   <button onClick={() => updateStatus(selectedIKM.id, 'DITOLAK')} className="flex-1 p-4 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all font-black uppercase text-xs">Tolak</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Komponen Helper
function StatCard({ label, value, color, icon }: any) {
  return (
    <div className={`${color} p-5 rounded-[1.5rem] text-white shadow-lg flex justify-between items-center`}>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest opacity-80 mb-1">{label}</p>
        <p className="text-3xl font-black">{value}</p>
      </div>
      <div className="bg-white/20 p-3 rounded-xl">{icon}</div>
    </div>
  );
}

function DetailBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 group hover:border-indigo-200 transition-all">
      <div className="text-indigo-600">{icon}</div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className="text-sm font-bold text-[#1A1A40]">{value || '-'}</p>
      </div>
    </div>
  );
}