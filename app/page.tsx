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

  // ================= FETCH DATA (DIPERBAIKI) =================
  const fetchData = async () => {
    const isDeletedStatus = activeTab === "recycle";
  }

  useEffect(() => { 
    fetchData() 
  }, [activeTab])

  // ================= CRUD FUNCTIONS (DIPERBAIKI TOTAL) =================
  
  // FIX UPDATE
  const handleUpdate = async () => {
    if (!editData) return
    
    // HAPUS kolom-kolom yang tidak boleh ikut di-update ke database
    const { id, created_at, is_deleted, deleted_at, ...payload } = editData

    const { error } = await supabase
      .from("ikm_binaan")
      .update(payload) // Hanya kirim data yang berubah
      .eq("id", id)

    if (!error) {
      alert("Perubahan berhasil disimpan! ✅")
      setEditData(null)
      await fetchData() // Paksa tarik data terbaru
    } else {
      alert("Gagal update: " + error.message)
    }
  }

  // FIX SOFT DELETE
const handleSoftDelete = async (id: number) => {
  if (!confirm("Pindahkan ke Recycle Bin?")) return;

  const { error } = await supabase
    .from("ikm_binaan")
    .update({ 
      is_deleted: true, 
      deleted_at: new Date().toISOString() 
    })
    .eq("id", id); // Pastikan ID ini sesuai dengan data yang diklik

  if (!error) {
    alert("Berhasil dipindahkan ke Recycle Bin! 🗑️");
    // INI PENTING: Panggil kembali data agar tampilan diperbarui
    await fetchData(); 
  } else {
    alert("Gagal menghapus: " + error.message);
  }
};

  // RESTORE & PERMANENT DELETE
  const handleRestore = async (id: number) => {
    const { error } = await supabase
      .from("ikm_binaan")
      .update({ is_deleted: false, deleted_at: null })
      .eq("id", id)
    if (!error) { alert("Data dipulihkan! ✅"); await fetchData(); }
  }

  const handlePermanentDelete = async (id: number) => {
    if (!confirm("Hapus permanen? Tindakan ini tidak bisa dibatalkan.")) return
    const { error } = await supabase.from("ikm_binaan").delete().eq("id", id)
    if (!error) { alert("Data terhapus selamanya! 💀"); await fetchData(); }
  }

  // ================= LAINNYA =================
  const handleSubmit = async () => {
    const { error } = await supabase.from("ikm_binaan").insert([form]);
    if (!error) {
      alert("Data berhasil disimpan!");
      setForm({ no_nib: "", nik: "", nama_lengkap: "", nama_usaha: "", alamat: "", no_hp: "" });
      fetchData();
    }
  };

  const filteredData = data.filter((item) =>
    Object.values(item).join(" ").toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.ceil(filteredData.length / (rowsPerPage || 1))
  const startIndex = (currentPage - 1) * rowsPerPage
  const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage)

  return (
    <div className="p-8 bg-gray-50 min-h-screen text-black">
      {/* HEADER & TAB */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-blue-900 tracking-tight">
          {activeTab === "main" ? "📊 Database IKM" : "🗑️ Recycle Bin"}
        </h1>
        <div className="flex bg-gray-200 p-1 rounded-2xl border border-gray-300 shadow-inner">
          <button onClick={() => setActiveTab("main")} className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === "main" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"}`}>Aktif</button>
          <button onClick={() => setActiveTab("recycle")} className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === "recycle" ? "bg-white text-red-600 shadow-sm" : "text-gray-500"}`}>Sampah</button>
        </div>
      </div>

      {/* FORM (Hanya Muncul di Tab Utama) */}
      {activeTab === "main" && (
        <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <input name="no_nib" placeholder="NIB" value={form.no_nib} onChange={(e) => setForm({...form, no_nib: e.target.value})} className="border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" />
             <input name="nik" placeholder="NIK" value={form.nik} onChange={(e) => setForm({...form, nik: e.target.value})} className="border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" />
             <input name="nama_lengkap" placeholder="Nama Pemilik" value={form.nama_lengkap} onChange={(e) => setForm({...form, nama_lengkap: e.target.value})} className="border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" />
             <input name="nama_usaha" placeholder="Nama Usaha" value={form.nama_usaha} onChange={(e) => setForm({...form, nama_usaha: e.target.value})} className="border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" />
             <input name="alamat" placeholder="Alamat" value={form.alamat} onChange={(e) => setForm({...form, alamat: e.target.value})} className="border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 md:col-span-2" />
          </div>
          <button onClick={handleSubmit} className="mt-4 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all">➕ Tambahkan Data</button>
        </div>
      )}

      {/* SEARCH */}
      <div className="mb-6">
        <input type="text" placeholder="Cari nama, NIB, atau usaha..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full p-4 rounded-2xl border-none shadow-md outline-none focus:ring-2 focus:ring-blue-400" />
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        <table className="w-full">
          <thead>
            <tr className={`${activeTab === "main" ? "bg-blue-600" : "bg-red-600"} text-white`}>
              <th className="p-4">No</th>
              <th className="p-4 text-left">Identitas</th>
              <th className="p-4 text-left">Nama Pemilik / Usaha</th>
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedData.map((item, index) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-all">
                <td className="p-4 text-center font-bold text-gray-400">{startIndex + index + 1}</td>
                <td className="p-4">
                  <div className="text-sm font-black text-blue-700">NIB: {item.no_nib}</div>
                  <div className="text-xs text-gray-400">NIK: {item.nik}</div>
                </td>
                <td className="p-4">
                  <div className="font-bold text-gray-800">{item.nama_lengkap}</div>
                  <div className="text-xs font-bold text-indigo-500 uppercase">{item.nama_usaha}</div>
                </td>
                <td className="p-4 flex justify-center gap-2">
                  {activeTab === "main" ? (
                    <>
                      <button onClick={() => setEditData(item)} className="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl font-bold hover:bg-amber-200">✏️ Edit</button>
                      <button onClick={() => handleSoftDelete(item.id)} className="px-4 py-2 bg-red-100 text-red-600 rounded-xl font-bold hover:bg-red-200">🗑️ Hapus</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleRestore(item.id)} className="px-4 py-2 bg-green-100 text-green-700 rounded-xl font-bold hover:bg-green-200">🔄 Pulihkan</button>
                      <button onClick={() => handlePermanentDelete(item.id)} className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700">💀 Hapus Permanen</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL EDIT */}
      {editData && (
        <div className="fixed inset-0 bg-blue-900/60 backdrop-blur-md flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-8 relative animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black text-blue-800 mb-6 flex items-center gap-2">📝 Edit Informasi IKM</h2>
            <div className="space-y-4">
              {["nama_lengkap", "nama_usaha", "no_hp", "alamat"].map((key) => (
                <div key={key}>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-1 block">{key.replace('_', ' ')}</label>
                  <input 
                    value={editData[key] || ""} 
                    onChange={(e) => setEditData({...editData, [key]: e.target.value})} 
                    className="w-full border border-gray-200 rounded-2xl p-3 focus:ring-2 focus:ring-blue-400 outline-none font-bold"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setEditData(null)} className="px-6 py-3 font-bold text-gray-400 hover:text-gray-600">Batal</button>
              <button onClick={handleUpdate} className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg hover:bg-blue-700 active:scale-95 transition-all">Simpan Perubahan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}