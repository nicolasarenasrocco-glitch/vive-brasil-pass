"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

interface Partner {
  id: string;
  nombre?: string;
  categoria?: string;
  telefono?: string;
  direccion?: string;
  descripcion?: string;
  imageUrl?: string;
}

export default function TuristaExplorarPage() {
  const [comercios, setComercios] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComercios = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "partners"));
        const lista: Partner[] = [];

        querySnapshot.forEach((doc) => {
          lista.push({
            id: doc.id,
            ...doc.data(),
          } as Partner);
        });

        setComercios(lista);
      } catch (error) {
        console.error("Error al obtener comercios:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchComercios();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center text-xs font-bold">
        Cargando comercios destacados...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 max-w-md mx-auto flex flex-col gap-6 pb-12">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-black text-white">Descubre Comercio Local 🛍️</h1>
        <p className="text-xs text-slate-400">Apoya a los emprendimientos locales y gana beneficios.</p>
      </header>

      {comercios.length === 0 ? (
        <div className="p-8 bg-slate-900/50 rounded-2xl border border-slate-800 text-center text-xs font-bold text-slate-500">
          No hay comercios registrados aún.
        </div>
      ) : (
        <div className="grid gap-4">
          {comercios.map((comercio) => (
            <div
              key={comercio.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col"
            >
              {comercio.imageUrl ? (
                <img
                  src={comercio.imageUrl}
                  alt={comercio.nombre || "Comercio"}
                  className="w-full h-40 object-cover"
                />
              ) : (
                <div className="w-full h-28 bg-slate-950 border-b border-slate-800 flex items-center justify-center text-slate-600 text-2xl">
                  🏬
                </div>
              )}

              <div className="p-4 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <h2 className="text-base font-black text-white">
                    {comercio.nombre || "Sin nombre registrado"}
                  </h2>
                  {comercio.categoria && (
                    <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                      {comercio.categoria}
                    </span>
                  )}
                </div>

                {comercio.descripcion && (
                  <p className="text-xs text-slate-300 line-clamp-2">
                    {comercio.descripcion}
                  </p>
                )}

                <div className="flex flex-col gap-1 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  {comercio.direccion && (
                    <p className="flex items-center gap-1.5">
                      📍 <span>{comercio.direccion}</span>
                    </p>
                  )}
                  {comercio.telefono && (
                    <p className="flex items-center gap-1.5">
                      📞 <span>{comercio.telefono}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}