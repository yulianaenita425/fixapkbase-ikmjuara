"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import * as XLSX from "xlsx"

export default function IKMPage() {
  const [data, setData] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<"main" | "recycle">("main")
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 5

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
  const fetchData = async () => {
    const isDeletedStatus = activeTab === "recycle";
    const { data: res, error } = await supabase
      .from("ikm_binaan")
      .select("*")
      .eq("is_deleted", isDeletedStatus)
      .order("created_at", { ascending: false });

    if (!error) setData(res || []);
  };

  useEffect(() => {
    fetchData();
    setCurrentPage(1);
  }, [activeTab]);

  // ================= VALIDASI & DUPLICATE =================
  const checkDuplicate = async (column: string, value: string) => {
    if (!value) return;
    const { data } = await supabase
      .from("ikm_binaan")
      .select(column)
      .eq(column, value)
      .eq("is_deleted", false);
    
    if (data && data.length > 0) {
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
        is_deleted: false
    }]);

    if (!error) {
      alert("Data berhasil disimpan ✅");
      setForm({ no_nib: "", nik: "", nama_lengkap: "", nama_usaha: "", alamat: "", no_hp: "" });
      fetchData();
    } else {
      alert("Gagal: " + error.message);
    }
  };

  // Gunakan tipe 'any' untuk ID karena di DB anda itu UUID (String)
  const handleSoftDelete = async (id: any) => {
    if (!confirm("Pindahkan ke Recycle Bin?")) return;
    
    const { error } = await supabase
      .from("ikm_binaan")
      .update({ 
        is_deleted: true, 
        deleted_at: new Date().toISOString() 
      })
      .eq("id", id);

    if (!error) {
      alert("Data dipindah ke Sampah 🗑️");
      fetchData();
    } else {
      alert("Error: " + error.message);
    }
  };

  const handleRestore = async (id: any) => {
    const { error } = await supabase
      .from("ikm_binaan")
      .update({ is_deleted: false, deleted_at: null })
      .eq("id", id)

    if (!error) {
      alert("Data dipulihkan ✅");
      fetchData();
    }
  };

  const handlePermanentDelete = async (id: any) => {
    if (!confirm("Hapus permanen? Data ini tidak bisa dikembalikan!")) return
    const { error } = await supabase.from("ikm_binaan").delete().eq("id", id)
    if (!error) {
      alert("Data dihapus selamanya 💀");
      fetchData();
    }
  };

  const handleUpdate = async () => {
    if (!editData) return
    
    // Proteksi: Hanya kirim kolom yang ada di database
    const payload = {
      no_nib: editData.no_nib,
      nik: editData.nik,
      nama_lengkap: editData.nama_lengkap,
      nama_usaha: editData.nama_usaha,
      alamat: editData.alamat,
      no_hp: editData.no_hp
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
      alert("Gagal update: " + error.message)
    }
  }

  // ================= EXCEL LOGIC =================
  const downloadTemplate = () => {
    const template = [{ no_nib: "", nik: "", nama_lengkap: "", nama_usaha: "", alamat: "", no_hp: "" }];
    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "template_import_ikm.xlsx");
  };

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
        
        // Membersihkan data agar sesuai struktur DB (mencegah error 400)
        const cleanData = jsonData.map(item => ({
            no_nib: String(item.no_nib || ""),
            nik: String(item.nik || ""),
            nama_lengkap: item.nama_lengkap || "",
            nama_usaha: item.nama_usaha || "",
            alamat: item.alamat || "",
            no_hp: String(item.no_hp || ""),
            is_deleted: false
        }));

        const { error } = await supabase.from("ikm_binaan").insert(cleanData)
        if (!error) { 
            alert("Import Berhasil! 🚀"); 
            fetchData(); 
        } else {
            alert("Database menolak data: " + error.message);
        }
      } catch (err) { alert("Format file tidak didukung."); }
    }
    reader.readAsBinaryString(file)
  }

  const exportExcel = () => {
    // Hanya export data yang aktif dan filter kolom agar rapi
    const dataToExport = filteredData.map((item, index) => ({
      No: index + 1,
      NIB: item.no_nib,
      NIK: item.nik,
      Nama: item.nama_lengkap,
      Usaha: item.nama_usaha,
      Alamat: item.alamat,
      WhatsApp: item.no_hp
    }));

    if (dataToExport.length === 0) return alert("Tidak ada data");

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data IKM");
    XLSX.writeFile(workbook, "data-ikm-binaan.xlsx");
  };

  // ================= SEARCH & PAGINATION =================
  const filteredData = data.filter((item) =>
    Object.values(item).join(" ").toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.ceil(filteredData.length / rowsPerPage)
  const paginatedData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  return (
    <div className="p-8 bg-gray-50 min-h-screen text-black">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-blue-800 flex items-center gap-2">
          {activeTab === "main" ? "📊 Database IKM Binaan" : "🗑️ Recycle Bin"}
        </h1>
        
        <div className="flex bg-gray-200 rounded-xl p-1 shadow-inner border border-gray-300">
          <button onClick={() => setActiveTab("main")} className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === "main" ? "bg-blue-600 text-white shadow-md" : "text-gray-500 hover:text-blue-600"}`}>Utama</button>
          <button onClick={() => setActiveTab("recycle")} className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === "recycle" ? "bg-red-600 text-white shadow-md" : "text-gray-500 hover:text-red-600"}`}>Sampah</button>
        </div>
      </div>

      {/* Form Input (Hanya tampil di Tab Utama) */}
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
            <input name="no_hp" value={form.no_hp} onChange={handleChange} placeholder="Nomor WhatsApp (Aktif)" className="border p-3 rounded-xl border-gray-200 outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <button onClick={handleSubmit} disabled={!!errors.no_nib || !!errors.nik || !form.no_nib} className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg active:scale-95 disabled:opacity-50 transition-all">
              ➕ Simpan Data Baru
          </button>
        </div>
      )}

      {/* Search & Export Section */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative">
          <input type="text" placeholder="🔍 Cari nama, NIB, atau alamat..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-80 pl-10 pr-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 transition" />
        </div>
        
        <div className="flex gap-2">
          {activeTab === "main" && (
            <>
              <button onClick={downloadTemplate} className="bg-blue-100 text-blue-700 px-4 py-2.5 rounded-xl font-bold border border-blue-200 hover:bg-blue-200 flex items-center gap-2 text-sm transition-all">📄 Template</button>
              <label className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl cursor-pointer font-bold flex items-center gap-2 shadow-md transition-all text-sm">
                ⬆ Import <input type="file" accept=".xlsx, .xls" onChange={importExcel} className="hidden" />
              </label>
              <button onClick={exportExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-all flex items-center gap-2 text-sm">⬇ Export Excel</button>
            </>
          )}
        </div>
      </div>

      {/* Table Section */}
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
                        <button onClick={() => handleSoftDelete(item.id)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition">🗑️ Hapus</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleRestore(item.id)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition">🔄 Pulihkan</button>
                        <button onClick={() => handlePermanentDelete(item.id)} className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">💀 Hapus Permanen</button>
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
          <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-10 h-10 rounded-xl font-bold transition-all ${currentPage === i + 1 ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-white text-gray-400 border border-gray-200 hover:bg-gray-50"}`}>
            {i + 1}
          </button>
        ))}
      </div>

      {/* Edit Modal */}
      {editData && (
        <div className="fixed inset-0 bg-blue-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-8 relative border border-white/20">
            <h2 className="text-2xl font-black text-blue-800 mb-6 flex items-center gap-2">✏️ Edit Data IKM</h2>
            <div className="grid grid-cols-2 gap-4">
              {[{k:"no_nib", l:"NIB"}, {k:"nik", l:"NIK"}, {k:"nama_lengkap", l:"Nama Pemilik"}, {k:"nama_usaha", l:"Nama Usaha"}, {k:"no_hp", l:"No. WhatsApp"}].map((f) => (
                <div key={f.k} className="flex flex-col">
                  <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1">{f.l}</label>
                  <input value={editData[f.k] || ""} onChange={(e) => setEditData({...editData, [f.k]: e.target.value})} className="border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-400 outline-none transition-all" />
                </div>
              ))}
              <div className="col-span-2 flex flex-col">
                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1">Alamat Usaha</label>
                <textarea value={editData.alamat || ""} onChange={(e) => setEditData({...editData, alamat: e.target.value})} className="border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-400 outline-none transition-all" rows={3} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setEditData(null)} className="px-6 py-3 bg-gray-100 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition-all">Batal</button>
              <button onClick={handleUpdate} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 active:scale-95 transition-all">💾 Simpan Perubahan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}