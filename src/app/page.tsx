"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // GPS y Ubicación del Usuario
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>("Obteniendo ubicación...");

  // Datos de Comercios y Filtros
  const [partners, setPartners] = useState<any[]>([]);
  const [sectorFilter, setSectorFilter] = useState("Todos");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [selectedPartner, setSelectedPartner] = useState<any | null>(null);

  // Redemptions / Historial
  const [redemptions, setRedemptions] = useState<any[]>([]);

  // Pedir Ubicación GPS
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("GPS no soportado en tu navegador");
      return;
    }

    setLocationStatus("Solicitando GPS...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationStatus("GPS Activo 📍");
      },
      (error) => {
        console.error("Error obteniendo ubicación:", error);
        setLocationStatus("Activa el GPS para ver distancias");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    // Pedir GPS al cargar
    requestLocation();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userPassCode = `VIVE-${currentUser.uid.slice(0, 4).toUpperCase()}`;

        // 1. Cargar Comercios desde Firestore
        const fetchPartners = async () => {
          try {
            const querySnapshot = await getDocs(collection(db, "partners"));
            const list = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            setPartners(list);
          } catch (e) {
            console.error("Error al cargar comercios:", e);
          }
        };
        fetchPartners();

        // 2. Cargar historial de canjes
        const q = query(collection(db, "redemptions"), where("passCode", "==", userPassCode));
        const unsubRedemptions = onSnapshot(q, (snapshot) => {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          setRedemptions(list);
        });

        setLoading(false);
        return () => unsubRedemptions();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoginLoading(true);

    try {
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Correo o contraseña incorrectos.");
      } else {
        setError("Error al iniciar sesión. Verifica tus datos.");
      }
    } finally {
      setLoginLoading(false);
    }
  };

  // Función Matemática Haversine para calcular distancia exacta en KM
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Radio de la tierra en KM
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distancia en KM
    return d;
  };

  // Filtrar y Ordenar Comercios por Cercanía
  const filteredPartners = partners
    .map((p) => {
      let distance = null;
      if (userCoords && p.lat && p.lng) {
        distance = calculateDistance(userCoords.lat, userCoords.lng, parseFloat(p.lat), parseFloat(p.lng));
      }
      return { ...p, distance };
    })
    .filter((p) => {
      const matchSector = sectorFilter === "Todos" || p.sector === sectorFilter;
      const matchCategory = categoryFilter === "Todas" || p.category === categoryFilter;
      return matchSector && matchCategory;
    })
    .sort((a, b) => {
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
        Cargando experiencia VIP...
      </div>
    );
  }

  // --- VISTA 1: FORMULARIO DE LOGIN ---
  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 p-8 rounded-2xl shadow-2xl backdrop-blur-sm">
          <div className="text-center mb-6">
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-2">
              👑 Acceso Privado VIP
            </span>
            <h1 className="text-2xl font-black text-white">Vive Brasil Pass</h1>
            <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
              Plataforma exclusiva para pasajeros de <strong className="text-emerald-400 font-bold">Vive Brasil</strong>. Accede con tus credenciales entregadas.
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-400">Correo Electrónico</label>
              <input
                type="email"
                required
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-400">Contraseña</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-all"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-xl text-center font-bold">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full mt-2 py-3.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-sky-500/20 transition-all disabled:opacity-50"
            >
              {loginLoading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-slate-800/80 pt-4">
            <p className="text-[11px] text-slate-500">
              🔒 Si no tienes un usuario activo, contacta al equipo de <span className="text-slate-400 font-medium">Vive Brasil</span>.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const passCode = `VIVE-${user.uid.slice(0, 4).toUpperCase()}`;

  // --- VISTA 2: PASE VIP + DISTANCIAS Y LOCALES ---
  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 max-w-md mx-auto flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex justify-between items-center bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div>
          <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest">
            PASAJERO VERIFICADO 👑
          </span>
          <h2 className="text-xs font-bold text-slate-200 truncate max-w-[200px]">{user.email}</h2>
        </div>
        <button
          onClick={() => signOut(auth)}
          className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/30 hover:bg-rose-500/20 transition-all"
        >
          Salir
        </button>
      </div>

      {/* TARJETA CREDENCIAL VIP */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950 p-6 rounded-3xl border border-sky-500/30 shadow-2xl shadow-sky-500/10 flex flex-col items-center text-center gap-4">
        <div className="flex justify-between items-center w-full">
          <span className="text-xs font-black tracking-widest text-emerald-400 uppercase">
            VIVE BRASIL PASS
          </span>
          <span className="bg-amber-400/10 text-amber-300 text-[9px] font-extrabold px-2.5 py-1 rounded-full border border-amber-400/20">
            VIP MEMBER
          </span>
        </div>

        <div className="bg-white p-3 rounded-2xl shadow-xl border-4 border-slate-800/80">
          <QRCodeSVG value={passCode} size={140} />
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
            CÓDIGO DE PASE
          </span>
          <h1 className="text-2xl font-black font-mono tracking-widest text-white mt-0.5">
            {passCode}
          </h1>
        </div>
      </div>

      {/* BANNER ESTADO GPS */}
      <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm">📍</span>
          <span className="text-xs font-bold text-slate-300">{locationStatus}</span>
        </div>
        {!userCoords && (
          <button
            onClick={requestLocation}
            className="text-[10px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/30 px-2.5 py-1 rounded-xl hover:bg-sky-500/20 transition-all"
          >
            Activar GPS
          </button>
        )}
      </div>

      {/* FILTROS Y CATEGORÍAS */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
          🏖️ Beneficios & Locales Cerca
        </h3>

        {/* Filtro Sector */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {["Todos", "Búzios", "Río de Janeiro", "Florianópolis"].map((sector) => (
            <button
              key={sector}
              onClick={() => setSectorFilter(sector)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                sectorFilter === sector
                  ? "bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {sector}
            </button>
          ))}
        </div>

        {/* Filtro Categorías */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {["Todas", "Gastronomía", "Playa", "Bares", "Bienestar / Wellness"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all ${
                categoryFilter === cat
                  ? "bg-emerald-500 text-slate-950"
                  : "bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800/60"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* LISTA DE COMERCIOS */}
      <div className="flex flex-col gap-3">
        {filteredPartners.length === 0 ? (
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 text-center">
            <p className="text-xs text-slate-400">No hay locales registrados en esta categoría aún.</p>
          </div>
        ) : (
          filteredPartners.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedPartner(item)}
              className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-lg hover:border-slate-700 transition-all cursor-pointer flex flex-col"
            >
              {item.imageUrl && (
                <div className="relative h-36 w-full">
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  <span className="absolute top-3 right-3 bg-emerald-500 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-full shadow-md">
                    {item.discount || "BENEFICIO VIP"}
                  </span>
                </div>
              )}

              <div className="p-4 flex flex-col gap-1.5">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-black text-white">{item.name}</h4>
                  
                  {/* BADGE DE DISTANCIA CALCULADA POR GPS */}
                  {item.distance !== null ? (
                    <span className="text-[10px] font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">
                      📍 {item.distance < 1 ? `${Math.round(item.distance * 1000)} m` : `${item.distance.toFixed(1)} km`}
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
                      {item.sector}
                    </span>
                  )}
                </div>

                <p className="text-xs text-emerald-400 font-bold">🎁 {item.benefit}</p>
                <p className="text-[11px] text-slate-400">📍 {item.location || item.sector}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* HISTORIAL DE CANJES */}
      <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 flex flex-col gap-3 mt-2">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <span>🎉</span> Mis Canjes ({redemptions.length})
        </h3>

        {redemptions.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-3 italic">
            Aún no has canjeado beneficios. ¡Muestra tu QR en los locales!
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {redemptions.map((item) => (
              <div
                key={item.id}
                className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex justify-between items-center"
              >
                <div>
                  <p className="text-xs font-bold text-white">{item.comercioName}</p>
                  <p className="text-[10px] text-slate-400">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                  ✓ Canjeado
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DETALLE COMERCIO + BOTÓN IR CON GOOGLE MAPS */}
      {selectedPartner && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-5 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            {selectedPartner.imageUrl && (
              <img src={selectedPartner.imageUrl} alt={selectedPartner.name} className="w-full h-40 object-cover rounded-2xl" />
            )}

            <div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                {selectedPartner.discount}
              </span>
              <h3 className="text-lg font-black text-white mt-2">{selectedPartner.name}</h3>
              <p className="text-xs text-slate-400">📍 {selectedPartner.location} - {selectedPartner.sector}</p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Beneficio Exclusivo:</span>
              <p className="text-xs text-emerald-300 font-bold mt-0.5">{selectedPartner.benefit}</p>
            </div>

            {/* BOTÓN COMO LLEGAR CON GOOGLE MAPS */}
            {selectedPartner.lat && selectedPartner.lng && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPartner.lat},${selectedPartner.lng}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black rounded-xl text-center shadow-lg transition-all flex items-center justify-center gap-2"
              >
                🗺️ Cómo llegar (Google Maps)
              </a>
            )}

            {selectedPartner.menuUrl && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-300">Menú / Carta:</span>
                <img src={selectedPartner.menuUrl} alt="Menú" className="w-full rounded-xl border border-slate-800 max-h-48 object-cover" />
              </div>
            )}

            {selectedPartner.instagram && (
              <a
                href={`https://instagram.com/${selectedPartner.instagram}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-xl text-center shadow-lg"
              >
                Ver Instagram @{selectedPartner.instagram}
              </a>
            )}

            <button
              onClick={() => setSelectedPartner(null)}
              className="w-full py-2.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}