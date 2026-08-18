"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function ComercioDetalle() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [comercio, setComercio] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchComercio = async () => {
      try {
        const docRef = doc(db, "partners", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setComercio({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (e) {
        console.error("Error al obtener el comercio:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchComercio();
  }, [id]);

  if (loading) return <p className="text-center text-slate-400 mt-12 text-sm">Cargando información del comercio...</p>;

  if (!comercio) {
    return (
      <div className="text-center mt-12 space-y-4">
        <p className="text-slate-400 text-sm">Comercio no encontrado.</p>
        <button onClick={() => router.back()} className="text-xs text-sky-400 underline">
          ← Volver
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-8 max-w-md mx-auto p-4 text-white bg-slate-950 min-h-screen">
      {/* Botón Volver */}
      <button
        onClick={() => router.back()}
        className="self-start text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800"
      >
        ← Volver al mapa
      </button>

      {/* Hero Image / Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 h-48 w-full shadow-lg">
        {comercio.imageUrl ? (
          <img src={comercio.imageUrl} alt={comercio.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600">Sin foto</div>
        )}
        {comercio.discount && (
          <span className="absolute top-3 right-3 bg-emerald-500 text-slate-950 font-black text-xs px-3 py-1 rounded-lg shadow-md">
            {comercio.discount}
          </span>
        )}
      </div>

      {/* Info Principal */}
      <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-lg flex flex-col gap-2">
        <span className="text-[10px] font-extrabold text-sky-400 uppercase tracking-wider">
          {comercio.category || "General"}
        </span>
        <h1 className="text-2xl font-black text-white">{comercio.name}</h1>
        <p className="text-sm font-bold text-emerald-400">{comercio.benefit || comercio.discount || comercio.description}</p>
        <p className="text-xs text-slate-400 mt-1">
          📍 {comercio.location || comercio.address || "Ubicación no especificada"} {comercio.sector ? `• ${comercio.sector}` : ""}
        </p>
      </div>

      {/* Botones de Acción corregidos */}
      <div className="grid grid-cols-2 gap-3">
        {comercio.lat && comercio.lng ? (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${comercio.lat},${comercio.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all text-center"
          >
            🗺️ Cómo Llegar
          </a>
        ) : (
          <button disabled className="py-3 px-4 rounded-xl bg-slate-900 text-slate-600 font-bold text-xs border border-slate-800 cursor-not-allowed">
            🗺️ Sin Mapa
          </button>
        )}

        {comercio.instagram ? (
          <a
            href={`https://instagram.com/${comercio.instagram.replace("@", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xs transition-all text-center shadow-md"
          >
            📸 Instagram
          </a>
        ) : (
          <button disabled className="py-3 px-4 rounded-xl bg-slate-900 text-slate-600 font-bold text-xs border border-slate-800 cursor-not-allowed">
            📸 Sin Insta
          </button>
        )}
      </div>

      {/* Menú o Carta */}
      {comercio.menuUrl && (
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Carta / Menú / Servicios 📋</h3>
          <div className="rounded-xl overflow-hidden border border-slate-800">
            <img src={comercio.menuUrl} alt="Carta o Menú" className="w-full h-auto object-cover" />
          </div>
        </div>
      )}
    </div>
  );
}