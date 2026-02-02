import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Kita gunakan font Inter agar lebih elegan
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IKM JUARA - Konsultasi Industri Kota Madiun",
  description: "Layanan klinik konsultasi industri terintegrasi untuk IKM Madiun naik kelas ke pasar global.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="scroll-smooth">
      <body className={`${inter.className} antialiased`}>
        {/* Indikator Database - Dibuat lebih kecil & profesional di pojok atas */}
        <div className="fixed top-0 left-0 right-0 z-[100] bg-green-600 text-white text-[10px] py-1 text-center font-mono opacity-80 pointer-events-none">
          Database IKM JUARA Terhubung 🚀
        </div>
        
        {/* Konten Utama dari page.tsx */}
        {children}
      </body>
    </html>
  );
}