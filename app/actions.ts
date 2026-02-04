"use server";

import { redirect } from 'next/navigation';

export async function handlePendaftaran(formData: FormData) {
  // 1. PENGAMBILAN DATA
  const data = {
    nama: formData.get('nama') as string,
    hp: formData.get('hp') as string,
    nib: formData.get('nib') as string,
    nik: formData.get('nik') as string,
    nama_usaha: formData.get('nama_usaha') as string,
    produk: formData.get('produk') as string,
    alamat: formData.get('alamat') as string,
    layanan: formData.get('layanan') as string,
    sub_pelatihan: (formData.get('sub_pelatihan') as string) || null,
  };

  // 2. VALIDASI SERVER-SIDE (KEAMANAN GANDA)
  if (!/^\d{13}$/.test(data.nib)) {
    throw new Error("Pendaftaran Gagal: NIB harus tepat 13 digit angka.");
  }
  if (!/^\d{16}$/.test(data.nik)) {
    throw new Error("Pendaftaran Gagal: NIK harus tepat 16 digit angka.");
  }

  try {
    // 3. LOGIKA PENYIMPANAN & ROUTING DATA
    console.log("Memproses pendaftaran untuk:", data.nama);

    if (data.layanan === "Pelatihan Pemberdayaan IKM") {
      /* SIMPAN KE TABEL PELATIHAN
         Lokasi: /admin/kegiatan-pelatihan/rencana-pelatihan 
      */
      console.log("Sistem: Mengarahkan data ke Tabel Pelatihan...");
      
      // Simulasi proses simpan database
      await new Promise((resolve) => setTimeout(resolve, 1000));

    } else {
      /* SIMPAN KE TABEL BINAAN UMUM
         Lokasi: /admin (Menu Pengajuan IKM Binaan Baru)
      */
      console.log("Sistem: Mengarahkan data ke Tabel IKM Binaan Umum...");
      
      // Simulasi proses simpan database
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

  } catch (error) {
    // Log error jika database gagal koneksi
    console.error("Critical Database Error:", error);
    // Jika gagal, lempar kembali agar sistem tahu
    throw new Error("Gagal menyimpan ke database.");
  }

  // 4. FINALISASI (MENGHILANGKAN ERROR VOID)
  // Dengan melakukan redirect, fungsi ini tidak perlu return object {success: true}
  // Ini otomatis menyelesaikan masalah Type mismatch di page.tsx
  redirect("/pendaftaran-berhasil");
}