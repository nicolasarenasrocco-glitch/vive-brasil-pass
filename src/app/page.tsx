"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const uid = cred.user.uid;

      const userDoc = await getDoc(doc(db, "users", uid));
      let role = userDoc.exists() ? userDoc.data().role : null;

      if (!role) {
        const partnerDoc = await getDoc(doc(db, "partners", uid));
        if (partnerDoc.exists()) {
          role = partnerDoc.data().role || "comercio";
        }
      }

      if (role === "admin") {
        router.push("/admin");
      } else if (role === "comercio") {
        router.push("/comercio");
      } else if (role === "turista") {
        router.push("/turista");
      } else {
        setError("Tu cuenta no tiene un rol asignado. Contacta al equipo de Vive Brasil.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        setError("Correo o contraseña incorrectos.");
      } else {
        setError("Error al iniciar sesión. Intenta de nuevo.");
      }
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-3">
            ACCESO PRIVADO VIP
          </span>
          <h1 className="text-2xl font-black text-white">Vive Brasil Pass</h1>
          <p className="text-xs text-slate-400 mt-1">
            Plataforma exclusiva para pasajeros de Vive Brasil.<br />
            Accede con tus credenciales entregadas.
          </p>
        </div>

        <form onSubmit={handleLogin} className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-400">Correo Electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
              placeholder="tu@email.com"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-400">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/40 text-rose-400 text-xs font-bold p-3 rounded-xl text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all mt-2 disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="text-center text-[11px] text-slate-500 mt-6">
          Si no tienes un usuario activo, contacta al equipo de Vive Brasil.
        </p>
      </div>
    </main>
  );
}