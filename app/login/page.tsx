"use client";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
// 1. IMPORT COOKIES
import Cookies from 'js-cookie';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- TAMBAHAN FUNGSI LOGGER ---
  const saveLog = async (username: string, role: string, description: string, actionType: string) => {
    await supabase
      .from("activity_logs")
      .insert([
        { 
          username, 
          role, 
          description, 
          action_type: actionType, 
          created_at: new Date().toISOString() 
        }
      ]);
  };
  // ------------------------------

  // Efek Partikel Digital Neural Network
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: any[] = [];
    const particleCount = 60;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    class Particle {
      x: number; y: number; vx: number; vy: number;
      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > canvas!.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas!.height) this.vy *= -1;
      }
    }

    for (let i = 0; i < particleCount; i++) particles.push(new Particle());

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(99, 102, 241, 0.5)";
      ctx.strokeStyle = "rgba(99, 102, 241, 0.1)";

      particles.forEach((p, i) => {
        p.update();
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });
      requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    resize();
    animate();
    return () => window.removeEventListener('resize', resize);
  }, []);

  // 2. LOGIKA LOGIN DENGAN COOKIES
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Ambil data session saat login
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert('Akses Ditolak: ' + error.message);
      setLoading(false);
    } else if (data?.session) {
      // --- REKAM AKTIVITAS DI SINI ---
      // Kita asumsikan role default adalah 'admin' atau 'user' sesuai kebutuhan sistem Anda
      const userEmail = data.session.user.email || 'Unknown';
      await saveLog(userEmail, 'admin', `Admin ${userEmail} berhasil login ke dashboard`, 'pencarian');
      await saveLog(userEmail, 'user', `User ${userEmail} login`, 'pencarian');
      // -------------------------------

      // SIMPAN ACCESS TOKEN KE COOKIE
      Cookies.set('sb-access-token', data.session.access_token, { 
        expires: 1, // Token hangus dalam 1 hari
        path: '/',
        sameSite: 'lax'
      });

      // Redirect ke halaman admin
      router.push('/admin');
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#020617] overflow-hidden">
      
      {/* Canvas Partikel */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 opacity-60" />

      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] z-0"></div>

      <div className="relative z-10 w-full max-w-md px-6 animate-fadeIn">
        <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-[0_0_100px_rgba(0,0,0,1)]">
          
          <div className="text-center mb-10">
            <div className="inline-block p-4 bg-white rounded-3xl shadow-[0_0_30px_rgba(255,255,255,0.2)] mb-6 animate-float">
              <Image src="/ikmjuarav1.png" alt="Logo" width={70} height={70} />
            </div>
            <h1 className="text-4xl font-black text-white italic tracking-tighter leading-none">
            <span className="text-indigo-500">IKM JUARA</span>
            </h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[5px] mt-3">Halaman Login admin</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-2">username</label>
              <input
                required type="email"
                placeholder="admin@madiun.go.id"
                className="w-full px-6 py-4 bg-black/20 border border-white/5 rounded-2xl text-white outline-none focus:border-indigo-500 transition-all font-medium"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-2">Password</label>
              <input
                required type="password"
                placeholder="••••••••"
                className="w-full px-6 py-4 bg-black/20 border border-white/5 rounded-2xl text-white outline-none focus:border-indigo-500 transition-all font-medium"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full group relative py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-[4px] shadow-2xl hover:bg-indigo-500 transition-all active:scale-95 disabled:opacity-50 overflow-hidden"
            >
              <span className="relative z-10">{loading ? 'Processing...' : 'LOGIN'}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
            </button>
          </form>
        </div>
        
        <p className="mt-8 text-center text-slate-600 text-[10px] font-bold uppercase tracking-widest">
          Copyright © 2026 IKM Juara (Bidang Perindustrian DISNAKERKUKM KOTA MADIUN)
        </p>
      </div>

      <style jsx global>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        .animate-float { animation: float 5s ease-in-out infinite; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 1s ease-out forwards; }
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        .animate-shimmer { animation: shimmer 2s infinite; }
      `}</style>
    </div>
  );
}