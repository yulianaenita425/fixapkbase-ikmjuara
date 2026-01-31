"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export default function IKMPage() {
  const [data, setData] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<"main" | "recycle">("main")
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 5

  const [form, setForm] = useState({
    no_nib: "",
    no_nik: "",
    nama: "",
    usaha: "",
    alamat: "",
    hp: ""
  })

  const [editData, setEditData] = useState<any | null>(null)

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

  const handleUpdate = async () => {
    if (!editData) return
    const { id, created_at, is_deleted, deleted_at, ...payload } = editData
    const { error } = await supabase.from("ikm_binaan").update(payload).eq("id", id)

    if (!error) {
      alert("Berhasil disimpan! ✅")
      setEditData(null)
      await fetchData() 
    } else {
      alert("Gagal update: " + error.message)
    }
  }

  // LOGIKA SOFT DELETE YANG DIPERBAIKI
  const handleSoftDelete = async (id: number) => {
    if (!confirm("Pindahkan data ini ke Recycle Bin?")) return;

    const { error } = await supabase
      .from("ikm_binaan")
      .update({ 
        is_deleted: true, 
        deleted_at: new Date().toISOString() 
      })
      .eq("id", id);

    if (error) {
      console.error("Error Detail:", error);
      alert("Gagal memindahkan: " + error.message + " (Cek RLS di Supabase)");
    } else {
      alert("Data berhasil dipindahkan ke Sampah! 🗑️");
      await fetchData(); 
    }
  };

  const handleRestore = async (id: number) => {
    const { error } = await supabase
      .from("ikm_binaan")
      .update({ is_deleted: false, deleted_at: null })
      .eq("id", id)
    if (!error) { alert("Data dipulihkan! ✅"); await fetchData(); }
  }

  const handlePermanentDelete = async (id: number) => {
    if (!confirm("Hapus permanen?")) return
    const { error } = await supabase.from("ikm_binaan").delete().eq("id", id)
    if (!error) { alert("Terhapus permanen! 💀"); await fetchData(); }
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

  const filteredData = data.filter((item) =>
    Object.values(item).join(" ").toLowerCase().includes(search.toLowerCase())
  )
  const paginatedData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  return (
    <div className="p-8 bg-gray-50 min-h-screen text-black font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-blue-900 uppercase tracking-tighter">
          {activeTab === "main" ? "📊 Database IKM" : "🗑️ Recycle Bin"}
        </h1>
        <div className="flex bg-gray-200 p-1 rounded-2xl shadow-inner">
          <button onClick={() => setActiveTab("main")} className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === "main" ? "bg-white text-blue-600 shadow" : "text-gray-500"}`}>Aktif</button>
          <button onClick={() => setActiveTab("recycle")} className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === "recycle" ? "bg-white text-red-600 shadow" : "text-gray-500"}`}>Sampah</button>
        </div>
      </div>

      {activeTab === "main" && (
        <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
             <input placeholder="NIB" value={form.no_nib} onChange={(e) => setForm({...form, no_nib: e.target.value})} className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
             <input placeholder="NIK" value={form.no_nik} onChange={(e) => setForm({...form, no_nik: e.target.value})} className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
             <input placeholder="Nama Pemilik" value={form.nama} onChange={(e) => setForm({...form, nama: e.target.value})} className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
             <input placeholder="Nama Usaha" value={form.usaha} onChange={(e) => setForm({...form, usaha: e.target.value})} className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
             <input placeholder="No HP" value={form.hp} onChange={(e) => setForm({...form, hp: e.target.value})} className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
             <input placeholder="Alamat" value={form.alamat} onChange={(e) => setForm({...form, alamat: e.target.value})} className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
             <button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-bold md:col-span-3 transition-colors shadow-lg">➕ Tambah Data Baru</button>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        <table className="w-full">
          <thead className={activeTab === "main" ? "bg-blue-600 text-white" : "bg-red-600 text-white"}>
            <tr>
              <th className="p-4 text-left">Identitas</th>
              <th className="p-4 text-left">Nama / Usaha</th>
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 text-sm">
                   <div className="font-bold text-blue-700">NIB: {item.no_nib}</div>
                   <div className="text-gray-400">NIK: {item.no_nik}</div>
                </td>
                <td className="p-4">
                   <div className="font-bold text-gray-800">{item.nama}</div>
                   <div className="text-blue-500 text-xs font-black uppercase tracking-widest">{item.usaha}</div>
                </td>
                <td className="p-4 flex gap-2 justify-center">
                  {activeTab === "main" ? (
                    <>
                      <button onClick={() => setEditData(item)} className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl font-bold hover:bg-amber-100 transition-colors">✏️ Edit</button>
                      <button onClick={() => handleSoftDelete(item.id)} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors">🗑️ Hapus</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleRestore(item.id)} className="px-4 py-2 bg-green-50 text-green-700 rounded-xl font-bold hover:bg-green-100 transition-colors">🔄 Pulihkan</button>
                      <button onClick={() => handlePermanentDelete(item.id)} className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-md">💀 Hapus Permanen</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editData && (
        <div className="fixed inset-0 bg-blue-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl p-8 shadow-2xl scale-in-center">
            <h2 className="text-2xl font-black text-gray-800 mb-6">✏️ Update Data IKM</h2>
            <div className="grid grid-cols-1 gap-4">
              {["nama", "usaha", "hp", "alamat"].map((key) => (
                <div key={key}>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{key}</label>
                  <input value={editData[key] || ""} onChange={(e) => setEditData({...editData, [key]: e.target.value})} className="w-full border border-gray-200 rounded-2xl p-3 focus:ring-2 focus:ring-blue-400 outline-none font-medium" />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setEditData(null)} className="font-bold text-gray-400 hover:text-gray-600 px-4">Batal</button>
              <button onClick={handleUpdate} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all">Simpan Perubahan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}