"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function ComercioLoginPage() {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/comercio");
    } catch (err: any) {
      console.error("Error detallado de Firebase:", err.code, err.message);
      // Mostramos el código de error real de Firebase para saber qué pasa exactamente
      setError(`Error (${err.code}): ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center text-xs font-bold">
        Cargando...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 max-w-md mx-auto flex flex-col justify-center items-center">
      <div className="w-full bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col gap-6">
        
        <div className="text-center flex flex-col items-center gap-2">
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
            🔐 Acceso Comercios
          </span>
          <h1 className="text-xl font-black text-white">Iniciar Sesión</h1>
          <p className="text-xs text-slate-400">Ingresa con tu cuenta de socio para administrar tu local.</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/40 rounded-xl text-xs font-bold text-rose-400 text-center break-words">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400">Correo Electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@comercio.com"
              className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all mt-2 disabled:opacity-50"
          >
            {loading ? "Iniciando sesión..." : "Entrar al Panel"}
          </button>
        </form>

      </div>
    </main>
  );
}