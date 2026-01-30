"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import * as XLSX from "xlsx"

export default function IKMPage() {
  const [data, setData] = useState<any[]>([])
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
    const { data, error } = await supabase
      .from("ikm_binaan")
      .select("*")
      .order("id", { ascending: true })

    if (!error) setData(data || [])
  }

  useEffect(() => { fetchData() }, [])

  // ================= CHECK DUPLICATE =================
  const checkDuplicate = async (column: string, value: string) => {
    if (!value) return;
    const { data } = await supabase.from("ikm_binaan").select(column).eq(column, value);
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
    if (form.no_nib.length > 13) return alert("NIB maksimal 13 digit");
    if (form.nik.length > 16) return alert("NIK maksimal 16 digit");

    const { error } = await supabase.from("ikm_binaan").insert([form]);
    if (!error) {
      alert("Data berhasil disimpan");
      setForm({ no_nib: "", nik: "", nama_lengkap: "", nama_usaha: "", alamat: "", no_hp: "" });
      fetchData();
    } else {
      alert("Terjadi kesalahan: " + error.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return
    await supabase.from("ikm_binaan").delete().eq("id", id)
    fetchData()
  }

  const handleUpdate = async () => {
    const { id, ...updatedData } = editData
    const { error } = await supabase.from("ikm_binaan").update(updatedData).eq("id", id)
    if (!error) {
      alert("Data berhasil diperbarui");
      setEditData(null);
      fetchData();
    }
  }

  // ================= EXCEL LOGIC (IMPORT, EXPORT, TEMPLATE) =================
  
  // 1. Download Template Excel
  const downloadTemplate = () => {
    const template = [
      {
        no_nib: "Isi NIB (13 digit)",
        nik: "Isi NIK (16 digit)",
        nama_lengkap: "Isi Nama Pemilik",
        nama_usaha: "Isi Nama Usaha",
        alamat: "Isi Alamat Lengkap",
        no_hp: "08123456789"
      }
    ];
    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "template_import_ikm.xlsx");
  };

  // 2. Import Data
  const importExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const workbook = XLSX.read(event.target?.result, { type: "binary" })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        const { error } = await supabase.from("ikm_binaan").insert(jsonData)
        if (!error) {
          alert(`${jsonData.length} data berhasil diimport!`);
          fetchData();
        } else {
          alert("Gagal: Pastikan NIB/NIK unik & format header benar.");
        }
      } catch (err) {
        alert("Gagal membaca file.");
      }
    }
    reader.readAsBinaryString(file)
  }

  // 3. Export Data
  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data IKM")
    XLSX.writeFile(workbook, "data-ikm-binaan.xlsx")
  }

  // ================= LOGIC SEARCH & PAGE =================
  const filteredData = data.filter((item) =>
    Object.values(item).join(" ").toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.ceil(filteredData.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage)

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-extrabold text-blue-800 mb-6 flex items-center gap-2">
        📊 Database IKM Binaan
      </h1>

      {/* FORM SECTION */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <div className="flex flex-col">
            <label className="text-sm font-bold text-gray-600 mb-1">Nomor NIB</label>
            <input name="no_nib" type="text" value={form.no_nib} onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                if (val.length <= 13) { setForm({ ...form, no_nib: val }); if (val.length === 13) checkDuplicate("no_nib", val); }
            }} placeholder="13 Digit NIB" className={`border p-3 rounded-xl text-black focus:ring-2 focus:ring-blue-400 outline-none ${errors.no_nib ? 'border-red-500' : 'border-gray-200'}`} />
            {errors.no_nib && <span className="text-red-500 text-xs mt-1 font-semibold">{errors.no_nib}</span>}
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-bold text-gray-600 mb-1">NIK Pemilik</label>
            <input name="nik" type="text" value={form.nik} onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                if (val.length <= 16) { setForm({ ...form, nik: val }); if (val.length === 16) checkDuplicate("nik", val); }
            }} placeholder="16 Digit NIK" className={`border p-3 rounded-xl text-black focus:ring-2 focus:ring-blue-400 outline-none ${errors.nik ? 'border-red-500' : 'border-gray-200'}`} />
            {errors.nik && <span className="text-red-500 text-xs mt-1 font-semibold">{errors.nik}</span>}
          </div>
          <input name="nama_lengkap" value={form.nama_lengkap} onChange={handleChange} placeholder="Nama Lengkap" className="border p-3 rounded-xl text-black border-gray-200" />
          <input name="nama_usaha" value={form.nama_usaha} onChange={handleChange} placeholder="Nama Usaha" className="border p-3 rounded-xl text-black border-gray-200" />
          <input name="alamat" value={form.alamat} onChange={handleChange} placeholder="Alamat Usaha" className="border p-3 rounded-xl text-black border-gray-200 md:col-span-2" />
          <input name="no_hp" value={form.no_hp} onChange={handleChange} placeholder="Nomor WA (Contoh: 0812...)" className="border p-3 rounded-xl text-black border-gray-200" />
        </div>
        <button onClick={handleSubmit} disabled={!!errors.no_nib || !!errors.nik} className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-blue-200 transition-all active:scale-95 disabled:opacity-50">
           ➕ Simpan Data Baru
        </button>
      </div>

      {/* FILTER & TOOLS (IMPORT, EXPORT, TEMPLATE) */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative">
          <input type="text" placeholder="🔍 Cari data IKM..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-80 pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-black outline-none focus:ring-2 focus:ring-blue-400 transition" />
        </div>
        
        <div className="flex gap-2">
          {/* Tombol Template */}
          <button onClick={downloadTemplate} className="bg-blue-100 text-blue-700 px-4 py-2.5 rounded-xl font-bold border border-blue-200 hover:bg-blue-200 transition-all flex items-center gap-2 text-sm">
            📄 Template Excel
          </button>

          {/* Tombol Import */}
          <label className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl cursor-pointer font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 text-sm">
            ⬆ Import Data
            <input type="file" accept=".xlsx, .xls" onChange={importExcel} className="hidden" />
          </label>

          {/* Tombol Export */}
          <button onClick={exportExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-all active:scale-95 flex items-center gap-2 text-sm">
            ⬇ Export Data
          </button>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-700 border-b">
              <th className="p-4 text-center">No</th>
              <th className="p-4 text-left">Identitas</th>
              <th className="p-4 text-left">Nama Pemilik</th>
              <th className="p-4 text-left">Nama Usaha</th>
              <th className="p-4 text-left">Alamat</th>
              <th className="p-4 text-center">No HP</th>
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-black divide-y divide-gray-100">
            {paginatedData.map((item, index) => (
              <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                <td className="p-4 text-center text-gray-400">{startIndex + index + 1}</td>
                <td className="p-4">
                   <div className="text-xs text-blue-600 font-bold">NIB: {item.no_nib}</div>
                   <div className="text-[10px] text-gray-400">NIK: {item.nik}</div>
                </td>
                <td className="p-4 font-semibold">{item.nama_lengkap}</td>
                <td className="p-4 font-bold text-blue-800">{item.nama_usaha}</td>
                <td className="p-4 text-gray-600 max-w-[200px] truncate">{item.alamat}</td>
                <td className="p-4 text-center font-medium">{item.no_hp}</td>
                <td className="p-4 text-center space-x-2">
                  <button onClick={() => setEditData(item)} className="p-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition">✏️</button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-center mt-8 gap-2 pb-10">
        {Array.from({ length: totalPages }, (_, i) => (
          <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-10 h-10 rounded-xl font-bold transition-all ${currentPage === i + 1 ? "bg-blue-600 text-white shadow-lg" : "bg-white text-gray-400 border border-gray-200"}`}>
            {i + 1}
          </button>
        ))}
      </div>

      {/* MODAL EDIT */}
      {editData && (
        <div className="fixed inset-0 bg-blue-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-8 relative">
            <h2 className="text-2xl font-black text-blue-800 mb-6">Edit Data IKM</h2>
            <div className="grid grid-cols-2 gap-4 text-black">
              {[{k:"no_nib", l:"NIB"}, {k:"nik", l:"NIK"}, {k:"nama_lengkap", l:"Nama"}, {k:"nama_usaha", l:"Usaha"}, {k:"no_hp", l:"HP WA"}].map((f) => (
                <div key={f.k} className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1">{f.l}</label>
                  <input value={editData[f.k] || ""} onChange={(e) => setEditData({...editData, [f.k]: e.target.value})} className="border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-400 outline-none" />
                </div>
              ))}
              <div className="col-span-2 flex flex-col">
                <label className="text-xs font-bold text-gray-500 mb-1">Alamat</label>
                <textarea value={editData.alamat || ""} onChange={(e) => setEditData({...editData, alamat: e.target.value})} className="border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-400 outline-none" rows={3} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setEditData(null)} className="px-6 py-3 bg-gray-100 rounded-xl font-bold text-gray-500">Batal</button>
              <button onClick={handleUpdate} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg">Simpan Perubahan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}