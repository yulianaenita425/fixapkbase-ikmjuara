"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase, saveLog } from "@/lib/supabaseClient"
import * as XLSX from "xlsx"

export default function IKMPage() {
  const [data, setData] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<"main" | "recycle">("main")
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 5

  // State untuk Modal Import Custom
  const [importSummary, setImportSummary] = useState<{
    show: boolean;
    dataBaru: any[];
    dataDuplikat: any[];
    isLoading: boolean;
  }>({
    show: false,
    dataBaru: [],
    dataDuplikat: [],
    isLoading: false
  });

  const [form, setForm] = useState({
    no_nib: "",
    nik: "",
    nama_lengkap: "",
    nama_usaha: "",
    alamat: "",
    no_hp: ""
  })

  const [editData, setEditData] = useState<any | null>(null)
  const [errors, setErrors] = useState({ no_nib: "", nik: "" })

  // ================= FETCH DATA =================
  const fetchData = useCallback(async () => {
    const isDeletedStatus = activeTab === "recycle";
    const { data: res, error } = await supabase
      .from("ikm_binaan")
      .select("*")
      .eq("is_deleted", isDeletedStatus)
      .order("created_at", { ascending: false });

    if (!error) {
      setData(res || []);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
    setCurrentPage(1);
  }, [fetchData]);

  // ================= VALIDASI & DUPLICATE =================
  const checkDuplicate = async (column: string, value: string) => {
    if (!value) return;
    const { data: existing } = await supabase
      .from("ikm_binaan")
      .select(column)
      .eq(column, value)
      .eq("is_deleted", false)
      .limit(1);
    
    if (existing && existing.length > 0) {
      setErrors(prev => ({ ...prev, [column]: `${column.toUpperCase()} sudah terdaftar!` }));
    } else {
      setErrors(prev => ({ ...prev, [column]: "" }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // ================= CRUD FUNCTIONS =================
  const handleSubmit = async () => {
    if (form.no_nib.length !== 13) return alert("NIB harus 13 digit");
    if (form.nik.length !== 16) return alert("NIK harus 16 digit");

    const { error } = await supabase.from("ikm_binaan").insert([{
        ...form,
        is_deleted: false,
        created_at: new Date().toISOString()
    }]);

    if (!error) {
      alert("Data berhasil disimpan ✅");
      await saveLog(`Menambah data IKM: ${form.nama_usaha}`, "input");
      setForm({ no_nib: "", nik: "", nama_lengkap: "", nama_usaha: "", alamat: "", no_hp: "" });
      fetchData();
    }
  };

  const handleSoftDelete = async (id: string, nama: string) => {
    if (!confirm(`Pindahkan ${nama} ke Recycle Bin?`)) return;
    const { error } = await supabase.from("ikm_binaan").update({ is_deleted: true, deleted_at: new Date().toISOString() }).eq("id", id);
    if (!error) { fetchData(); await saveLog(`Memindahkan ${nama} ke sampah`, "hapus"); }
  };

  const handleRestore = async (id: string, nama: string) => {
    const { error } = await supabase.from("ikm_binaan").update({ is_deleted: false, deleted_at: null }).eq("id", id);
    if (!error) { fetchData(); await saveLog(`Memulihkan data IKM: ${nama}`, "edit"); }
  };

  const handlePermanentDelete = async (id: string, nama: string) => {
    if (!confirm("Hapus permanen?")) return
    const { error } = await supabase.from("ikm_binaan").delete().eq("id", id)
    if (!error) { fetchData(); await saveLog(`Menghapus permanen IKM: ${nama}`, "hapus"); }
  };

  const handleUpdate = async () => {
    if (!editData) return
    const payload = { no_nib: editData.no_nib, nik: editData.nik, nama_lengkap: editData.nama_lengkap, nama_usaha: editData.nama_usaha, alamat: editData.alamat, no_hp: editData.no_hp }
    const { error } = await supabase.from("ikm_binaan").update(payload).eq("id", editData.id)
    if (!error) { setEditData(null); fetchData(); await saveLog(`Update data IKM: ${editData.nama_usaha}`, "edit"); }
  };

  // ================= EXCEL LOGIC (MODERNIZED) =================
  const downloadTemplate = () => {
    const template = [{ no_nib: "", nik: "", nama_lengkap: "", nama_usaha: "", alamat: "", no_hp: "" }];
    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "template_import_ikm.xlsx");
  };

  const processImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const dataBinary = event.target?.result;
        const workbook = XLSX.read(dataBinary, { type: "binary" })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet)
        
        const allDataFromExcel = jsonData.map(item => ({
            no_nib: String(item.no_nib || "").replace(/[^0-9]/g, ""),
            nik: String(item.nik || "").replace(/[^0-9]/g, ""),
            nama_lengkap: item.nama_lengkap || "",
            nama_usaha: item.nama_usaha || "",
            alamat: item.alamat || "",
            no_hp: String(item.no_hp || ""),
            is_deleted: false,
            created_at: new Date().toISOString()
        }));

        const { data: existingRecords } = await supabase.from("ikm_binaan").select("no_nib").eq("is_deleted", false);
        const existingNibs = new Set(existingRecords?.map(r => r.no_nib) || []);

        const dataBaru = allDataFromExcel.filter(item => !existingNibs.has(item.no_nib));
        const dataDuplikat = allDataFromExcel.filter(item => existingNibs.has(item.no_nib));

        // Tampilkan Modal Custom alih-alih window.confirm
        setImportSummary({
          show: true,
          dataBaru,
          dataDuplikat,
          isLoading: false
        });

      } catch (err) { alert("Format file tidak didukung."); }
    }
    reader.readAsBinaryString(file)
    e.target.value = "";
  }

  const executeImport = async () => {
    setImportSummary(prev => ({ ...prev, isLoading: true }));
    const { error } = await supabase.from("ikm_binaan").insert(importSummary.dataBaru);
    
    if (!error) {
      await saveLog(`Import ${importSummary.dataBaru.length} data via Excel`, "input");
      setImportSummary({ show: false, dataBaru: [], dataDuplikat: [], isLoading: false });
      fetchData();
      alert("Import Berhasil! 🚀");
    } else {
      alert("Gagal menyimpan: " + error.message);
      setImportSummary(prev => ({ ...prev, isLoading: false }));
    }
  }

  const exportExcel = () => {
    const dataToExport = filteredData.map((item, index) => ({ No: index + 1, NIB: item.no_nib, NIK: item.nik, Nama: item.nama_lengkap, Usaha: item.nama_usaha, Alamat: item.alamat, WhatsApp: item.no_hp }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data IKM");
    XLSX.writeFile(workbook, `Data_IKM_${new Date().toLocaleDateString()}.xlsx`);
  };

  // ================= SEARCH & PAGINATION =================
  const filteredData = data.filter((item) =>
    [item.nama_lengkap, item.nama_usaha, item.no_nib, item.alamat].some(val => String(val || "").toLowerCase().includes(search.toLowerCase()))
  )
  const totalPages = Math.ceil(filteredData.length / rowsPerPage)
  const paginatedData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  return (
    <div className="p-8 bg-gray-50 min-h-screen text-black font-sans">
      
      {/* MODAL IMPORT ATRAKTIF */}
      {importSummary.show && (
        <div className="fixed inset-0 bg-blue-950/60 backdrop-blur-md flex justify-center items-center z-[60] p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 animate-in fade-in zoom-in duration-300">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <span className="text-4xl">📥</span>
              </div>
              <h2 className="text-2xl font-black">Konfirmasi Import Data</h2>
              <p className="text-blue-100 text-sm mt-1">Sistem mendeteksi ringkasan data sebagai berikut:</p>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-3xl text-center">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-1">Data Baru</p>
                  <p className="text-3xl font-black text-emerald-700">{importSummary.dataBaru.length}</p>
                  <p className="text-[10px] text-emerald-500 mt-1">Akan Ditambahkan</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-3xl text-center">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider mb-1">Data Ganda</p>
                  <p className="text-3xl font-black text-amber-700">{importSummary.dataDuplikat.length}</p>
                  <p className="text-[10px] text-amber-500 mt-1">Akan Diabaikan</p>
                </div>
              </div>

              {importSummary.dataBaru.length === 0 ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium text-center border border-red-100">
                  ⚠️ Tidak ada data baru yang bisa diimport.
                </div>
              ) : (
                <p className="text-center text-gray-500 text-sm mb-6 leading-relaxed">
                  Apakah Anda yakin ingin memasukkan <b>{importSummary.dataBaru.length} data</b> ini ke dalam database utama?
                </p>
              )}

              <div className="flex gap-3 mt-4">
                <button 
                  onClick={() => setImportSummary({ ...importSummary, show: false })}
                  className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                  Batal
                </button>
                {importSummary.dataBaru.length > 0 && (
                  <button 
                    onClick={executeImport}
                    disabled={importSummary.isLoading}
                    className="flex-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {importSummary.isLoading ? "Memproses..." : "Ya, Simpan Data"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-blue-800 flex items-center gap-2">
          {activeTab === "main" ? "📊 Database IKM Binaan" : "🗑️ Recycle Bin"}
        </h1>
        
        <div className="flex bg-gray-200 rounded-xl p-1 shadow-inner border border-gray-300">
          <button onClick={() => setActiveTab("main")} className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === "main" ? "bg-blue-600 text-white shadow-md" : "text-gray-500 hover:text-blue-600"}`}>Utama</button>
          <button onClick={() => setActiveTab("recycle")} className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === "recycle" ? "bg-red-600 text-white shadow-md" : "text-gray-500 hover:text-red-600"}`}>Sampah</button>
        </div>
      </div>

      {/* Form Input */}
      {activeTab === "main" && (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            <div className="flex flex-col">
              <label className="text-sm font-bold text-gray-600 mb-1">Nomor NIB (13 Digit)</label>
              <input name="no_nib" type="text" value={form.no_nib} onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 13);
                  setForm({ ...form, no_nib: val });
                  if (val.length === 13) checkDuplicate("no_nib", val);
              }} placeholder="Contoh: 1234567890123" className={`border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 ${errors.no_nib ? 'border-red-500' : 'border-gray-200'}`} />
              {errors.no_nib && <span className="text-red-500 text-xs mt-1 font-semibold">{errors.no_nib}</span>}
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-bold text-gray-600 mb-1">NIK Pemilik (16 Digit)</label>
              <input name="nik" type="text" value={form.nik} onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 16);
                  setForm({ ...form, nik: val });
                  if (val.length === 16) checkDuplicate("nik", val);
              }} placeholder="16 Digit NIK" className={`border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 ${errors.nik ? 'border-red-500' : 'border-gray-200'}`} />
              {errors.nik && <span className="text-red-500 text-xs mt-1 font-semibold">{errors.nik}</span>}
            </div>
            <input name="nama_lengkap" value={form.nama_lengkap} onChange={handleChange} placeholder="Nama Lengkap Pemilik" className="border p-3 rounded-xl border-gray-200 outline-none focus:ring-2 focus:ring-blue-400" />
            <input name="nama_usaha" value={form.nama_usaha} onChange={handleChange} placeholder="Nama Usaha" className="border p-3 rounded-xl border-gray-200 outline-none focus:ring-2 focus:ring-blue-400" />
            <input name="alamat" value={form.alamat} onChange={handleChange} placeholder="Alamat Lengkap" className="border p-3 rounded-xl border-gray-200 md:col-span-2 outline-none focus:ring-2 focus:ring-blue-400" />
            <input name="no_hp" value={form.no_hp} onChange={handleChange} placeholder="Nomor WhatsApp" className="border p-3 rounded-xl border-gray-200 outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <button onClick={handleSubmit} disabled={!!errors.no_nib || !!errors.nik || !form.no_nib} className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg active:scale-95 disabled:opacity-50 transition-all">
              ➕ Simpan Data Baru
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative">
          <input type="text" placeholder="🔍 Cari data..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-80 pl-4 pr-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 transition" />
        </div>
        
        <div className="flex gap-2">
          {activeTab === "main" && (
            <>
              <button onClick={downloadTemplate} className="bg-blue-100 text-blue-700 px-4 py-2.5 rounded-xl font-bold border border-blue-200 hover:bg-blue-200 text-sm transition-all">📄 Template</button>
              <label className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl cursor-pointer font-bold flex items-center gap-2 shadow-md transition-all text-sm">
                ⬆ Import <input type="file" accept=".xlsx, .xls" onChange={processImportFile} className="hidden" />
              </label>
              <button onClick={exportExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-all text-sm">⬇ Export Excel</button>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className={`${activeTab === "main" ? "bg-gray-100 text-gray-700" : "bg-red-50 text-red-700"} border-b font-bold`}>
              <th className="p-4 text-center">No</th>
              <th className="p-4 text-left">Identitas</th>
              <th className="p-4 text-left">Nama Pemilik / Usaha</th>
              <th className="p-4 text-left">Alamat</th>
              <th className="p-4 text-center">No HP</th>
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedData.length > 0 ? paginatedData.map((item, index) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 text-center text-gray-400">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                <td className="p-4">
                   <div className="text-xs text-blue-600 font-bold">NIB: {item.no_nib}</div>
                   <div className="text-[10px] text-gray-400">NIK: {item.nik}</div>
                </td>
                <td className="p-4">
                  <div className="font-semibold">{item.nama_lengkap}</div>
                  <div className="text-xs font-bold text-indigo-700">{item.nama_usaha}</div>
                </td>
                <td className="p-4 text-gray-600 max-w-[200px] truncate">{item.alamat}</td>
                <td className="p-4 text-center font-medium">{item.no_hp}</td>
                <td className="p-4 text-center">
                  <div className="flex justify-center gap-2">
                    {activeTab === "main" ? (
                      <>
                        <button onClick={() => setEditData(item)} className="p-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition">✏️ Edit</button>
                        <button onClick={() => handleSoftDelete(item.id, item.nama_usaha)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition">🗑️ Hapus</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleRestore(item.id, item.nama_usaha)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition">🔄 Pulihkan</button>
                        <button onClick={() => handlePermanentDelete(item.id, item.nama_usaha)} className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">💀 Hapus Permanen</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="p-10 text-center text-gray-400 italic">Tidak ada data ditemukan</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-8 gap-2 pb-10">
        {Array.from({ length: totalPages }, (_, i) => (
          <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-10 h-10 rounded-xl font-bold transition-all ${currentPage === i + 1 ? "bg-blue-600 text-white shadow-lg" : "bg-white text-gray-400 border border-gray-200"}`}>
            {i + 1}
          </button>
        ))}
      </div>

      {/* Modal Edit */}
      {editData && (
        <div className="fixed inset-0 bg-blue-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-8 relative border border-white/20">
            <h2 className="text-2xl font-black text-blue-800 mb-6 flex items-center gap-2">✏️ Edit Data IKM</h2>
            <div className="grid grid-cols-2 gap-4">
              {[{k:"no_nib", l:"NIB"}, {k:"nik", l:"NIK"}, {k:"nama_lengkap", l:"Nama Pemilik"}, {k:"nama_usaha", l:"Nama Usaha"}, {k:"no_hp", l:"No. WhatsApp"}].map((f) => (
                <div key={f.k} className="flex flex-col">
                  <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1">{f.l}</label>
                  <input value={editData[f.k] || ""} onChange={(e) => setEditData({...editData, [f.k]: e.target.value})} className="border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-400 outline-none" />
                </div>
              ))}
              <div className="col-span-2 flex flex-col">
                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1">Alamat Usaha</label>
                <textarea value={editData.alamat || ""} onChange={(e) => setEditData({...editData, alamat: e.target.value})} className="border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-400 outline-none" rows={3} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setEditData(null)} className="px-6 py-3 bg-gray-100 rounded-xl font-bold text-gray-500">Batal</button>
              <button onClick={handleUpdate} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all">💾 Simpan Perubahan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}