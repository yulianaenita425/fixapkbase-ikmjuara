"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export default function IKMPage() {
  const [data, setData] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<"main" | "recycle">("main")
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 5

  // Form disesuaikan dengan nama kolom di database Anda
  const [form, setForm] = useState({
    no_nib: "",
    no_nik: "",
    nama: "",
    usaha: "",
    alamat: "",
    hp: ""
  })

  const [editData, setEditData] = useState<any | null>(null)

  // ================= FETCH DATA =================
  const fetchData = async () => {
    const isDeletedStatus = activeTab === "recycle";

    const { data: res, error } = await supabase
      .from("ikm_binaan")
      .select("*")
      .eq("is_deleted", isDeletedStatus)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching:", error.message);
    } else {
      setData(res || []);
    }
  };

  useEffect(() => { 
    fetchData() 
  }, [activeTab])

  // ================= CRUD FUNCTIONS =================
  
  const handleUpdate = async () => {
    if (!editData) return
    
    // Payload hanya berisi kolom yang ada di database Anda
    const { id, created_at, is_deleted, deleted_at, ...payload } = editData

    const { error } = await supabase
      .from("ikm_binaan")
      .update(payload)
      .eq("id", id)

    if (!error) {
      alert("Perubahan berhasil disimpan! ✅")
      setEditData(null)
      await fetchData() 
    } else {
      alert("Gagal update: " + error.message)
    }
  }

  // UPDATED: Fungsi Soft Delete dengan pengecekan error yang benar
  const handleSoftDelete = async (id: number) => {
    if (!confirm("Pindahkan data ini ke Recycle Bin?")) return;

    // Menjalankan perintah update ke database
    const { error } = await supabase
      .from("ikm_binaan")
      .update({ 
        is_deleted: true, 
        deleted_at: new Date().toISOString() 
      })
      .eq("id", id);

    if (error) {
      // Menampilkan error asli jika gagal (misal: Error 401 Unauthorized)
      console.error("Gagal memindahkan:", error.message);
      alert("Gagal memindahkan data: " + error.message);
    } else {
      // Jika benar-benar berhasil tanpa error
      alert("Data berhasil dipindahkan ke Sampah! 🗑️");
      // Memaksa tabel refresh agar baris data langsung hilang
      await fetchData(); 
    }
  };

  const handleRestore = async (id: number) => {
    const { error } = await supabase
      .from("ikm_binaan")
      .update({ is_deleted: false, deleted_at: null })
      .eq("id", id)
    
    if (!error) { 
      alert("Data dipulihkan! ✅"); 
      await fetchData(); 
    } else {
      alert("Gagal memulihkan: " + error.message);
    }
  }

  const handlePermanentDelete = async (id: number) => {
    if (!confirm("Hapus permanen? Tindakan ini tidak bisa dibatalkan.")) return
    const { error } = await supabase.from("ikm_binaan").delete().eq("id", id)
    if (!error) { 
      alert("Terhapus permanen! 💀"); 
      await fetchData(); 
    } else {
      alert("Gagal menghapus: " + error.message);
    }
  }

  const handleSubmit = async () => {
    const { error } = await supabase.from("ikm_binaan").insert([form]);
    if (!error) {
      alert("Data disimpan!");
      setForm({ no_nib: "", no_nik: "", nama: "", usaha: "", alamat: "", hp: "" });
      fetchData();
    } else {
      alert("Error: " + error.message);
    }
  };

  // ================= RENDER LOGIC =================
  const filteredData = data.filter((item) =>
    Object.values(item).join(" ").toLowerCase().includes(search.toLowerCase())
  )
  const paginatedData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  return (
    <div className="p-8 bg-gray-50 min-h-screen text-black">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-blue-900">
          {activeTab === "main" ? "📊 Database IKM" : "🗑️ Recycle Bin"}
        </h1>
        <div className="flex bg-gray-200 p-1 rounded-2xl">
          <button onClick={() => setActiveTab("main")} className={`px-6 py-2 rounded-xl font-bold ${activeTab === "main" ? "bg-white text-blue-600 shadow" : "text-gray-500"}`}>Aktif</button>
          <button onClick={() => setActiveTab("recycle")} className={`px-6 py-2 rounded-xl font-bold ${activeTab === "recycle" ? "bg-white text-red-600 shadow" : "text-gray-500"}`}>Sampah</button>
        </div>
      </div>

      {activeTab === "main" && (
        <div className="bg-white p-6 rounded-3xl shadow-xl mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
             <input placeholder="NIB" value={form.no_nib} onChange={(e) => setForm({...form, no_nib: e.target.value})} className="border p-3 rounded-xl" />
             <input placeholder="NIK" value={form.no_nik} onChange={(e) => setForm({...form, no_nik: e.target.value})} className="border p-3 rounded-xl" />
             <input placeholder="Nama" value={form.nama} onChange={(e) => setForm({...form, nama: e.target.value})} className="border p-3 rounded-xl" />
             <input placeholder="Usaha" value={form.usaha} onChange={(e) => setForm({...form, usaha: e.target.value})} className="border p-3 rounded-xl" />
             <input placeholder="HP" value={form.hp} onChange={(e) => setForm({...form, hp: e.target.value})} className="border p-3 rounded-xl" />
             <input placeholder="Alamat" value={form.alamat} onChange={(e) => setForm({...form, alamat: e.target.value})} className="border p-3 rounded-xl" />
             <button onClick={handleSubmit} className="bg-blue-600 text-white p-3 rounded-xl font-bold md:col-span-3">Tambah Data</button>
        </div>
      )}

      {/* SEARCH BAR */}
      <div className="mb-6">
        <input 
          type="text" 
          placeholder="Cari data..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="w-full p-4 rounded-2xl border-none shadow-md outline-none focus:ring-2 focus:ring-blue-400" 
        />
      </div>

      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
        <table className="w-full">
          <thead className={activeTab === "main" ? "bg-blue-600 text-white" : "bg-red-600 text-white"}>
            <tr>
              <th className="p-4">Identitas</th>
              <th className="p-4 text-left">Nama / Usaha</th>
              <th className="p-4">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {paginatedData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4 text-sm">
                   <b>NIB:</b> {item.no_nib}<br/><b>NIK:</b> {item.no_nik}
                </td>
                <td className="p-4">
                   <div className="font-bold">{item.nama}</div>
                   <div className="text-blue-600 text-xs uppercase">{item.usaha}</div>
                </td>
                <td className="p-4 flex gap-2 justify-center">
                  {activeTab === "main" ? (
                    <>
                      <button onClick={() => setEditData(item)} className="p-2 bg-amber-100 text-amber-700 rounded-lg font-bold">Edit</button>
                      <button onClick={() => handleSoftDelete(item.id)} className="p-2 bg-red-100 text-red-600 rounded-lg font-bold">Hapus</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleRestore(item.id)} className="p-2 bg-green-100 text-green-700 rounded-lg font-bold">Pulihkan</button>
                      <button onClick={() => handlePermanentDelete(item.id)} className="p-2 bg-red-600 text-white rounded-lg font-bold">Hapus Permanen</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editData && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl p-8">
            <h2 className="text-2xl font-bold mb-6">Edit Data</h2>
            <div className="grid grid-cols-1 gap-4">
              {["nama", "usaha", "hp", "alamat"].map((key) => (
                <div key={key}>
                  <label className="text-xs font-bold text-gray-400 uppercase">{key}</label>
                  <input value={editData[key] || ""} onChange={(e) => setEditData({...editData, [key]: e.target.value})} className="w-full border rounded-xl p-3" />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setEditData(null)} className="font-bold text-gray-400">Batal</button>
              <button onClick={handleUpdate} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}