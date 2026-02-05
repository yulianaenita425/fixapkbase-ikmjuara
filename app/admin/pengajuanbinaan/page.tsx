"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  Briefcase, Search, RefreshCcw, CheckCircle, 
  XCircle, Phone, MapPin, Package, Calendar, 
  Download, Eye, User, FileText, Clock // Tambahkan Clock di sini
} from 'lucide-react';

export default function PengajuanBinaan() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIKM, setSelectedIKM] = useState<any>(null);

  useEffect(() => {
    fetchData();

    // SINKRONISASI REAL-TIME
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

  const filteredData = data.filter(item => 
    (item.nama_lengkap?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (item.nama_usaha?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (item.no_nib || "").includes(searchTerm)
  );

  // Statistik Sederhana
  const stats = {
    pending: data.filter(d => d.status_verifikasi === 'PENDING').length,
    total: data.length
  };

  return (
    <div className="space-y-6">
      
      {/* 1. STATS & HEADER ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 gap-4">
          <div>
            <h2 className="text-2xl font-black text-[#1A1A40] uppercase tracking-tighter flex items-center gap-3">
              <Briefcase className="text-indigo-600" /> Pengajuan Binaan
            </h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Total Masuk: {stats.total} IKM</p>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:flex-initial">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari NIB / Nama..."
                className="pl-12 pr-4 py-3 bg-slate-50 rounded-2xl outline-none border-2 border-transparent focus:border-indigo-600 font-bold text-sm transition-all w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={fetchData} className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all">
              <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Pending Card */}
        <div className="bg-amber-500 p-6 rounded-[2.5rem] text-white flex justify-between items-center shadow-lg shadow-amber-200">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Menunggu Verifikasi</p>
            <p className="text-4xl font-black">{stats.pending}</p>
          </div>
          <Clock size={40} className="opacity-30" />
        </div>
      </div>

      {/* 2. TABLE SECTION */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">
                <th className="p-6">Profil IKM</th>
                <th className="p-6">Layanan & Pelatihan</th>
                <th className="p-6">Status</th>
                <th className="p-6 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center font-black text-slate-300 animate-pulse uppercase">Sinkronisasi Data...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center font-bold text-slate-400 uppercase tracking-widest">Data Tidak Ditemukan</td></tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-indigo-50/30 transition-all group">
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="font-black text-[#1A1A40] uppercase text-sm tracking-tight">{item.nama_lengkap}</span>
                        <span className="text-[11px] font-bold text-indigo-600 uppercase italic mb-2">{item.nama_usaha}</span>
                        <div className="flex gap-2">
                          <span className="text-[9px] font-black bg-slate-100 px-2 py-0.5 rounded text-slate-500 uppercase">NIB: {item.no_nib}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="text-[11px] font-black text-slate-600 uppercase leading-tight bg-slate-50 p-2 rounded-lg border-l-4 border-indigo-500">
                        {item.layanan_prioritas}
                        {item.sub_pelatihan && <p className="text-orange-600 italic lowercase text-[10px]">↳ {item.sub_pelatihan}</p>}
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        item.status_verifikasi === 'PENDING' ? 'bg-amber-100 text-amber-600' : 
                        item.status_verifikasi === 'TERVERIFIKASI' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {item.status_verifikasi}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => setSelectedIKM(item)} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-[#1A1A40] hover:text-white transition-all shadow-sm">
                          <Eye size={18} />
                        </button>
                        <button onClick={() => updateStatus(item.id, 'TERVERIFIKASI')} className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm">
                          <CheckCircle size={18} />
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

      {/* 3. MODAL DETAIL VIEW (Slide Over) */}
      {selectedIKM && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end">
          <div className="absolute inset-0 bg-indigo-950/40 backdrop-blur-sm" onClick={() => setSelectedIKM(null)} />
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl p-8 overflow-y-auto">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-black text-[#1A1A40] uppercase tracking-tighter">Detail Pendaftar</h3>
                <p className="text-indigo-600 font-bold text-xs uppercase italic">{selectedIKM.nama_usaha}</p>
              </div>
              <button onClick={() => setSelectedIKM(null)} className="text-slate-400 hover:text-rose-500 transition-colors text-2xl font-bold">✕</button>
            </div>

            <div className="space-y-6">
              <DetailBox icon={<User />} label="Nama Pemilik" value={selectedIKM.nama_lengkap} />
              <DetailBox icon={<FileText />} label="NIK / NIB" value={`${selectedIKM.nik} / ${selectedIKM.no_nib}`} />
              <DetailBox icon={<MapPin />} label="Alamat Usaha" value={selectedIKM.alamat_usaha} />
              <DetailBox icon={<Package />} label="Produk Utama" value={selectedIKM.produk_utama} />
              <DetailBox icon={<Calendar />} label="Tanggal Daftar" value={new Date(selectedIKM.created_at).toLocaleDateString('id-ID', { dateStyle: 'full' })} />
              
              <div className="pt-6 border-t flex gap-3">
                <a href={`https://wa.me/${selectedIKM.no_hp}`} target="_blank" rel="noopener noreferrer" className="flex-1 bg-green-500 text-white p-4 rounded-2xl font-black text-center text-xs uppercase flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-lg shadow-green-100">
                  <Phone size={18} /> Hubungi WhatsApp
                </a>
                <button onClick={() => updateStatus(selectedIKM.id, 'DITOLAK')} className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all font-black uppercase text-[10px]">Tolak</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-200 transition-all">
      <div className="text-indigo-600">{icon}</div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className="text-sm font-bold text-[#1A1A40]">{value || '-'}</p>
      </div>
    </div>
  );
}