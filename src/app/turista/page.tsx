"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function TuristaDashboard() {
  const [userData, setUserData] = useState<any>(null);
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);
  const [comercios, setComercios] = useState<any[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);
  const [selectedSector, setSelectedSector] = useState<string>("Todos");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        console.warn("GPS no disponible:", err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    requestLocation();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUserId(currentUser.uid);
        let phoneNum = "";

        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const uData = docSnap.data();
            setUserData(uData);
            phoneNum = uData?.phone || "";
          }
        } catch (err) {
          console.error("Error al cargar datos del usuario:", err);
        }

        const generatedCode = `VIVE-${phoneNum.slice(-4) || currentUser.uid.slice(0, 4).toUpperCase()}`;

        // Cargar listas de forma segura e independiente
        await loadComercios();
        await loadHistorial(generatedCode);
      } else {
        window.location.href = "/";
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loadComercios = async () => {
    try {
      const snap = await getDocs(collection(db, "partners"));
      const list: any[] = [];
      
      snap.forEach((d) => {
        const data = d.data();
        if (data) {
          const comName = data.name || data.nombre;
          // Validar que tenga nombre registrado y no esté vacío
          if (comName && typeof comName === "string" && comName.trim() !== "" && comName !== "Sin nombre registrado") {
            list.push({ id: d.id, ...data });
          }
        }
      });

      setComercios(list);
    } catch (e) {
      console.error("Error al cargar comercios:", e);
    }
  };

  const loadHistorial = async (passCode: string) => {
    try {
      const q = query(collection(db, "redemptions"), where("passCode", "==", passCode));
      const snap = await getDocs(q);
      const list: any[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setHistorial(list);
    } catch (e) {
      console.error("Error al cargar historial:", e);
    }
  };

  if (loading) return <p className="text-center text-slate-400 mt-8 text-sm">Cargando tu Pase...</p>;

  const passCode = `VIVE-${userData?.phone?.slice(-4) || userId.slice(0, 4).toUpperCase()}`;

  let processedComercios = (comercios || []).map((item) => {
    let distanceKm: number | null = null;
    if (userCoords && item?.lat && item?.lng) {
      distanceKm = calculateDistance(userCoords.lat, userCoords.lng, item.lat, item.lng);
    }
    return { ...item, distanceKm };
  });

  if (selectedSector !== "Todos") {
    processedComercios = processedComercios.filter(
      (item) => item?.sector && item.sector.toLowerCase() === selectedSector.toLowerCase()
    );
  }

  if (selectedCategory !== "Todas") {
    processedComercios = processedComercios.filter((item) => {
      const cat = item?.category || item?.categoria;
      if (!cat) return false;
      const catClean = String(cat).toLowerCase().replace(/[^\w\s]/gi, '').trim();
      const selClean = selectedCategory.toLowerCase().replace(/[^\w\s]/gi, '').trim();
      return catClean.includes(selClean) || selClean.includes(catClean);
    });
  }

  processedComercios.sort((a, b) => {
    if (a.distanceKm !== null && b.distanceKm !== null) {
      return a.distanceKm - b.distanceKm;
    }
    if (a.distanceKm !== null) return -1;
    if (b.distanceKm !== null) return 1;
    return 0;
  });

  const sectores = ["Todos", "Búzios", "Río de Janeiro", "Florianópolis"];
  const categorias = ["Todas", "Gastronomía 🍽️", "Playa 🏖️", "Bares 🍹", "Bienestar / Wellness 🧘‍♀️"];

  return (
    <div className="flex flex-col gap-4">
      {/* Tarjeta Pase VIP */}
      <div className="bg-gradient-to-br from-sky-900 via-slate-900 to-emerald-950 p-6 rounded-2xl border border-emerald-500/40 shadow-xl text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none"></div>

        <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-500/40 inline-block mb-2">
          PASSE VIP ATIVO 🇧🇷
        </span>

        <h2 className="text-2xl font-black text-white">{userData?.name || "Viajero"}</h2>
        <p className="text-xs text-slate-300 mt-0.5">{userData?.email || auth.currentUser?.email}</p>

        <div
          onClick={() => setShowQRModal(true)}
          className="mt-5 p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/50 transition-all group"
        >
          <div className="bg-white p-2.5 rounded-xl shadow-md group-hover:scale-105 transition-transform">
            <QRCodeSVG value={passCode} size={110} level="H" />
          </div>

          <p className="text-[11px] text-slate-400 mt-3 font-medium">
            Código: <span className="font-mono font-bold text-sky-400 text-sm tracking-wider">{passCode}</span>
          </p>
          <span className="text-[10px] text-emerald-400/80 mt-1">🔍 Toca para agrandar QR</span>
        </div>
      </div>

      {/* Historial de Canjes */}
      <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
        <h3 className="text-xs font-bold text-slate-200 mb-2.5 uppercase tracking-wider">
          Mis Canjes Realizados 🎉
        </h3>

        {historial.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-2">
            Aún no has canjeado beneficios. ¡Muestra tu QR en los locales socios!
          </p>
        ) : (
          <ul className="text-xs text-slate-300 space-y-2">
            {historial.map((item) => (
              <li
                key={item.id}
                className="flex justify-between items-center p-2.5 bg-slate-900/60 rounded-xl border border-slate-800"
              >
                <div>
                  <p className="font-bold text-emerald-400">{item.comercioName}</p>
                  <p className="text-[10px] text-slate-400">Pase: {item.passCode}</p>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(item.timestamp).toLocaleDateString([], { month: "short", day: "numeric" })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Explorar Locales */}
      <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Locales Partners 📍
          </h3>
          {userCoords ? (
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
              GPS Activo ✓
            </span>
          ) : (
            <button
              onClick={requestLocation}
              className="text-[10px] bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 px-2.5 py-1 rounded-full border border-sky-500/40 font-bold transition-all animate-pulse cursor-pointer"
            >
              📍 Activar GPS
            </button>
          )}
        </div>

        {/* Filtro por Ciudad */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-2">
          {sectores.map((sec) => (
            <button
              key={sec}
              onClick={() => setSelectedSector(sec)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                selectedSector === sec
                  ? "bg-emerald-500 text-slate-950 shadow-md"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {sec}
            </button>
          ))}
        </div>

        {/* Filtro por Categorías */}
        <div className="relative mb-4">
          <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-none touch-pan-x pr-8">
            {categorias.map((cat) => {
              const rawName = cat.split(" ")[0];
              const isSelected =
                selectedCategory === cat ||
                (cat === "Todas" && selectedCategory === "Todas") ||
                selectedCategory === rawName;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat === "Todas" ? "Todas" : rawName)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                    isSelected
                      ? "bg-sky-500 text-slate-950 shadow-sm"
                      : "bg-slate-950/60 text-slate-400 border border-slate-800"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Catálogo de Tarjetas */}
        {processedComercios.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">
            No hay locales disponibles con estos filtros.
          </p>
        ) : (
          <div className="space-y-3">
            {processedComercios.map((item) => {
              const mainImage = item.imageUrl || item.image || item.logo || "/placeholder.jpg";
              const comName = item.name || item.nombre || "Comercio Socio";
              const comDesc = item.benefit || item.description || item.descripcion || "Beneficio VIP";
              const comCat = item.category || item.categoria || "General";
              const comLoc = item.location || item.address || item.direccion || "Dirección no especificada";

              return (
                <Link
                  key={item.id}
                  href={`/turista/comercio/${item.id}`}
                  className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-lg flex flex-col block hover:border-emerald-500/40 transition-all group"
                >
                  <div className="h-32 w-full overflow-hidden relative bg-slate-950">
                    <img
                      src={mainImage}
                      alt={comName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {(item.discount || item.descuento) && (
                      <span className="absolute top-2 right-2 bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md shadow-md">
                        {item.discount || item.descuento}
                      </span>
                    )}
                    {item.distanceKm !== null && (
                      <span className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-md text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/30">
                        📍 a {item.distanceKm < 1 ? `${Math.round(item.distanceKm * 1000)} m` : `${item.distanceKm.toFixed(1)} km`}
                      </span>
                    )}
                  </div>

                  <div className="p-3 flex justify-between items-center">
                    <div>
                      <span className="text-[9px] text-sky-400 font-bold uppercase tracking-wider">
                        {comCat}
                      </span>
                      <h4 className="font-bold text-white text-sm mt-0.5">{comName}</h4>
                      <p className="text-[11px] text-emerald-400 font-medium mt-0.5">{comDesc}</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        📍 {comLoc} {item.sector ? `• ${item.sector}` : ""}
                      </p>
                    </div>
                    <span className="text-slate-500 text-xs font-bold group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all">
                      Ver →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <button
        onClick={() => signOut(auth)}
        className="w-full py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 font-medium text-xs transition-all mb-4 cursor-pointer"
      >
        Cerrar Sesión
      </button>

      {/* Modal QR */}
      {showQRModal && (
        <div
          onClick={() => setShowQRModal(false)}
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6"
        >
          <div className="bg-slate-900 p-6 rounded-3xl border border-emerald-500/40 shadow-2xl text-center flex flex-col items-center max-w-xs w-full">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">
              Presenta este QR al comercio
            </span>
            <div className="bg-white p-4 rounded-2xl shadow-inner my-3">
              <QRCodeSVG value={passCode} size={200} level="H" />
            </div>
            <p className="font-mono font-black text-sky-400 text-lg tracking-widest mt-2">{passCode}</p>
            <p className="text-[11px] text-slate-400 mt-4">Toca cualquier parte para cerrar</p>
          </div>
        </div>
      )}
    </div>
  );
}