"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"
import * as XLSX from "xlsx"

export default function IKMPage() {
  const [data, setData] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<"main" | "recycle">("main")
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10 // Ditingkatkan agar lebih optimal

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

  // ================= FETCH DATA (Memoized) =================
  const fetchData = useCallback(async () => {
    const isDeletedStatus = activeTab === "recycle";
    const { data: res, error } = await supabase
      .from("ikm_binaan")
      .select("*")
      .eq("is_deleted", isDeletedStatus)
      .order("created_at", { ascending: false });

    if (!error) {
      setData(res || []);
    } else {
      console.error("Fetch Error:", error.message);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
    setCurrentPage(1);
  }, [fetchData]);

  // ================= VALIDASI DUPLIKAT =================
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
      setForm({ no_nib: "", nik: "", nama_lengkap: "", nama_usaha: "", alamat: "", no_hp: "" });
      fetchData();
    } else {
      alert("Gagal Simpan: " + error.message);
    }
  };

  const handleSoftDelete = async (id: string) => {
    if (!confirm("Pindahkan ke Recycle Bin?")) return;
    
    // Gunakan payload eksplisit untuk menghindari error 400
    const { error } = await supabase
      .from("ikm_binaan")
      .update({ 
        is_deleted: true, 
        deleted_at: new Date().toISOString() 
      })
      .eq("id", id); // ID di sini adalah UUID string

    if (!error) {
      alert("Data dipindah ke Sampah 🗑️");
      fetchData();
    } else {
      alert("Gagal Hapus: " + error.message);
    }
  };

  const handleRestore = async (id: string) => {
    const { error } = await supabase
      .from("ikm_binaan")
      .update({ is_deleted: false, deleted_at: null })
      .eq("id", id)

    if (!error) {
      alert("Data dipulihkan ✅");
      fetchData();
    } else {
      alert("Gagal Restore: " + error.message);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm("Hapus permanen? Data tidak bisa dikembalikan!")) return
    const { error } = await supabase.from("ikm_binaan").delete().eq("id", id)
    if (!error) {
      alert("Data dihapus selamanya 💀");
      fetchData();
    } else {
      alert("Gagal Hapus Permanen: " + error.message);
    }
  };

  const handleUpdate = async () => {
    if (!editData) return
    
    // SANGAT PENTING: Hanya kirim kolom data, JANGAN kirim ID atau created_at dalam body update
    const payload = {
      no_nib: editData.no_nib,
      nik: editData.nik,
      nama_lengkap: editData.nama_lengkap,
      nama_usaha: editData.nama_usaha,
      alamat: editData.alamat,
      no_hp: editData.no_hp,
      is_deleted: editData.is_deleted || false
    }

    const { error } = await supabase
      .from("ikm_binaan")
      .update(payload)
      .eq("id", editData.id)

    if (!error) {
      alert("Data diperbarui! ✅")
      setEditData(null)
      fetchData() 
    } else {
      alert("Gagal Update: " + error.message)
    }
  }

  // ================= EXCEL LOGIC =================
  const importExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const dataBinary = event.target?.result;
        const workbook = XLSX.read(dataBinary, { type: "binary" })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet)
        
        // Membersihkan data agar sesuai skema DB strict
        const cleanData = jsonData.map(item => ({
            no_nib: String(item.no_nib || "").replace(/[^0-9]/g, "").slice(0, 13),
            nik: String(item.nik || "").replace(/[^0-9]/g, "").slice(0, 16),
            nama_lengkap: String(item.nama_lengkap || ""),
            nama_usaha: String(item.nama_usaha || ""),
            alamat: String(item.alamat || ""),
            no_hp: String(item.no_hp || ""),
            is_deleted: false,
            created_at: new Date().toISOString()
        }));

        const { error } = await supabase.from("ikm_binaan").insert(cleanData)
        if (!error) { 
            alert("Import Berhasil! 🚀"); 
            fetchData(); 
        } else {
            alert("Database menolak data: " + error.message);
        }
      } catch (err) { 
        alert("Gagal membaca file Excel."); 
      }
    }
    reader.readAsBinaryString(file)
  }

  const exportExcel = () => {
    const dataToExport = filteredData.map((item, index) => ({
      No: index + 1,
      NIB: item.no_nib,
      NIK: item.nik,
      Nama_Lengkap: item.nama_lengkap,
      Nama_Usaha: item.nama_usaha,
      Alamat: item.alamat,
      No_HP: item.no_hp
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data IKM");
    XLSX.writeFile(workbook, `Data_IKM_${activeTab}.xlsx`);
  };

  // ================= SEARCH & PAGINATION =================
  const filteredData = data.filter((item) =>
    [item.nama_lengkap, item.nama_usaha, item.no_nib, item.alamat]
      .some(val => String(val || "").toLowerCase().includes(search.toLowerCase()))
  )
  const totalPages = Math.ceil(filteredData.length / rowsPerPage)
  const paginatedData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  return (
    <div className="p-8 bg-gray-50 min-h-screen text-black">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-extrabold text-blue-900">
          {activeTab === "main" ? "📊 Database IKM Binaan" : "🗑️ Recycle Bin"}
        </h1>
        
        <div className="flex bg-white shadow-sm border rounded-xl p-1">
          <button onClick={() => setActiveTab("main")} className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === "main" ? "bg-blue-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-100"}`}>Utama</button>
          <button onClick={() => setActiveTab("recycle")} className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === "recycle" ? "bg-red-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-100"}`}>Sampah</button>
        </div>
      </div>

      {/* Form Input */}
      {activeTab === "main" && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-bold mb-4 text-gray-700">Tambah Data Baru</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <input name="no_nib" type="text" value={form.no_nib} 
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 13);
                  setForm({ ...form, no_nib: val });
                  if (val.length === 13) checkDuplicate("no_nib", val);
                }} placeholder="13 Digit NIB" className={`border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 ${errors.no_nib ? 'border-red-500' : 'border-gray-200'}`} />
              {errors.no_nib && <span className="text-red-500 text-[10px] mt-1 font-bold">{errors.no_nib}</span>}
            </div>
            <div className="flex flex-col">
              <input name="nik" type="text" value={form.nik} 
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 16);
                  setForm({ ...form, nik: val });
                  if (val.length === 16) checkDuplicate("nik", val);
                }} placeholder="16 Digit NIK" className={`border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 ${errors.nik ? 'border-red-500' : 'border-gray-200'}`} />
              {errors.nik && <span className="text-red-500 text-[10px] mt-1 font-bold">{errors.nik}</span>}
            </div>
            <input name="nama_lengkap" value={form.nama_lengkap} onChange={(e) => setForm({...form, nama_lengkap: e.target.value})} placeholder="Nama Lengkap" className="border p-3 rounded-xl border-gray-200" />
            <input name="nama_usaha" value={form.nama_usaha} onChange={(e) => setForm({...form, nama_usaha: e.target.value})} placeholder="Nama Usaha" className="border p-3 rounded-xl border-gray-200" />
            <input name="no_hp" value={form.no_hp} onChange={(e) => setForm({...form, no_hp: e.target.value})} placeholder="No. WhatsApp" className="border p-3 rounded-xl border-gray-200" />
            <input name="alamat" value={form.alamat} onChange={(e) => setForm({...form, alamat: e.target.value})} placeholder="Alamat" className="border p-3 rounded-xl border-gray-200" />
          </div>
          <button onClick={handleSubmit} disabled={!!errors.no_nib || !!errors.nik || !form.no_nib} className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all">
            Simpan Data IKM
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <input type="text" placeholder="🔍 Cari data..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full md:w-80 p-3 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-400" />
        
        <div className="flex gap-2">
          {activeTab === "main" && (
            <>
              <label className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-2xl cursor-pointer font-bold flex items-center gap-2 text-sm transition-all">
                Import <input type="file" accept=".xlsx, .xls" onChange={importExcel} className="hidden" />
              </label>
              <button onClick={exportExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl font-bold text-sm">Export</button>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={`${activeTab === "main" ? "bg-gray-50 text-gray-600" : "bg-red-50 text-red-600"} border-b`}>
              <th className="p-4 font-bold">Identitas</th>
              <th className="p-4 font-bold">Pemilik / Usaha</th>
              <th className="p-4 font-bold">Alamat</th>
              <th className="p-4 font-bold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {paginatedData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-all">
                <td className="p-4">
                  <div className="text-blue-700 font-bold text-xs">NIB: {item.no_nib}</div>
                  <div className="text-gray-400 text-[10px]">NIK: {item.nik}</div>
                </td>
                <td className="p-4">
                  <div className="font-bold text-gray-800">{item.nama_lengkap}</div>
                  <div className="text-xs text-indigo-600 font-medium">{item.nama_usaha}</div>
                </td>
                <td className="p-4 text-sm text-gray-500 max-w-xs truncate">{item.alamat}</td>
                <td className="p-4">
                  <div className="flex justify-center gap-2">
                    {activeTab === "main" ? (
                      <>
                        <button onClick={() => setEditData(item)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg">✏️</button>
                        <button onClick={() => handleSoftDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">🗑️</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleRestore(item.id)} className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold">Pulihkan</button>
                        <button onClick={() => handlePermanentDelete(item.id)} className="p-2 text-red-800 hover:bg-red-100 rounded-lg">💀</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Edit */}
      {editData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Edit Data IKM</h2>
            <div className="space-y-4">
              <input value={editData.nama_lengkap} onChange={(e) => setEditData({...editData, nama_lengkap: e.target.value})} placeholder="Nama Lengkap" className="w-full border p-3 rounded-xl" />
              <input value={editData.nama_usaha} onChange={(e) => setEditData({...editData, nama_usaha: e.target.value})} placeholder="Nama Usaha" className="w-full border p-3 rounded-xl" />
              <textarea value={editData.alamat} onChange={(e) => setEditData({...editData, alamat: e.target.value})} placeholder="Alamat" className="w-full border p-3 rounded-xl" rows={3} />
              <input value={editData.no_hp} onChange={(e) => setEditData({...editData, no_hp: e.target.value})} placeholder="No HP" className="w-full border p-3 rounded-xl" />
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setEditData(null)} className="px-5 py-2 text-gray-500 font-bold">Batal</button>
              <button onClick={handleUpdate} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg">Simpan Perubahan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}