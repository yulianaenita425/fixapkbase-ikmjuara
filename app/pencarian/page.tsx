"use client";
import { useState } from 'react';
import Image from 'next/image';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const DATA_IKM = [
  { id: 1, nama: "IKM Keripik Tempe Madiun", produk: "Makanan Ringan", tahun: "2024", merek: "Sudah Terbit", sertifikat: "CERT-001/IKM/2024" },
  { id: 2, nama: "Batik Madiun Juara", produk: "Fashion & Tekstil", tahun: "2023", merek: "Proses", sertifikat: "-" },
  { id: 3, nama: "Sambel Pecel Asli Madiun", produk: "Bumbu Masak", tahun: "2024", merek: "Sudah Terbit", sertifikat: "CERT-003/IKM/2024" },
];

export default function PencarianData() {
  const [searchTerm, setSearchTerm] = useState("");

  // FUNGSI EXPORT PDF SEMUA DATA
  const exportAllToPDF = () => {
    const doc = new jsPDF();
    
    // Header Kop Surat
    doc.setFontSize(14);
    doc.text("PEMERINTAH KOTA MADIUN", 105, 15, { align: "center" });
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("DATABASE IKM BINAAN - IKM JUARA", 105, 25, { align: "center" });
    doc.setLineWidth(0.5);
    doc.line(20, 30, 190, 30);

    // Tabel Data
    autoTable(doc, {
      startY: 40,
      head: [['No', 'Nama IKM', 'Produk Utama', 'Tahun', 'Status Merek']],
      body: DATA_IKM.map((ikm, index) => [
        index + 1,
        ikm.nama,
        ikm.produk,
        ikm.tahun,
        ikm.merek
      ]),
      headStyles: { fillColor: [26, 26, 64] },
      theme: 'grid'
    });

    doc.save("Laporan_IKM_JUARA.pdf");
  };

  // FUNGSI CETAK SERTIFIKAT SATUAN (SIMULASI)
  const printCertificate = (ikm: any) => {
    const doc = new jsPDF({ orientation: 'landscape' });
    
    // Frame Border
    doc.setLineWidth(2);
    doc.rect(10, 10, 277, 190);
    
    doc.setFontSize(30);
    doc.text("SERTIFIKAT PENGHARGAAN", 148, 50, { align: "center" });
    doc.setFontSize(16);
    doc.text("Diberikan Kepada:", 148, 70, { align: "center" });
    doc.setFontSize(24);
    doc.setFont("times", "bolditalic");
    doc.text(ikm.nama, 148, 90, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.text(`Sebagai IKM Binaan Unggulan Kota Madiun untuk Produk ${ikm.produk}`, 148, 110, { align: "center" });
    doc.text(`ID Sertifikat: ${ikm.sertifikat}`, 148, 125, { align: "center" });

    doc.text("Madiun, 2026", 220, 160);
    doc.text("Admin IKM JUARA", 220, 180);

    doc.save(`Sertifikat_${ikm.nama}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-[#1A1A40]">
      {/* Sidebar (Sama seperti sebelumnya) */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-[#1A1A40] text-white p-6 hidden lg:block shadow-2xl">
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-white p-1 rounded-lg">
            <Image src="/Laura joss.png" alt="Logo" width={24} height={24} />
          </div>
          <span className="font-black text-lg">IKM JUARA</span>
        </div>
        <nav className="space-y-4">
          <div className="bg-indigo-600 p-3 rounded-xl cursor-pointer">📊 Dashboard</div>
        </nav>
      </aside>

      <main className="lg:ml-64 p-6 md:p-10">
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-black italic tracking-tight">DATA IKM BINAAN</h1>
            <p className="text-slate-500 font-medium">Sistem Monitoring Akselerasi Industri</p>
          </div>
          <button 
            onClick={exportAllToPDF}
            className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition-all active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            EXPORT LAPORAN PDF
          </button>
        </header>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-[1.5rem] shadow-sm mb-6 flex gap-4">
            <input 
              type="text" 
              placeholder="Cari nama IKM..."
              className="flex-1 px-6 py-3 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-600"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">No</th>
                <th className="px-6 py-4">Nama IKM</th>
                <th className="px-6 py-4 text-center">Aksi Sertifikat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-sm">
              {DATA_IKM.map((ikm, index) => (
                <tr key={ikm.id} className="hover:bg-slate-50 transition group">
                  <td className="px-6 py-5 text-slate-400">{index + 1}</td>
                  <td className="px-6 py-5 font-bold">{ikm.nama}</td>
                  <td className="px-6 py-5 text-center">
                    {ikm.merek === "Sudah Terbit" ? (
                      <button 
                        onClick={() => printCertificate(ikm)}
                        className="bg-green-100 text-green-700 px-4 py-2 rounded-xl font-bold hover:bg-green-600 hover:text-white transition-all border border-green-200"
                      >
                        CETAK SERTIFIKAT
                      </button>
                    ) : (
                      <span className="text-slate-300 italic text-xs">Dalam Proses</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}