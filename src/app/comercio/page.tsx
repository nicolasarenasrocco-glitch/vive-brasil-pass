"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from "react";
import { auth, db, storage } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export default function ComercioDashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Datos del Formulario Comercio
  const [formData, setFormData] = useState({
    name: "",
    category: "Restaurante",
    phone: "",
    address: "",
    description: "",
    imageUrl: "",
    menuImages: [] as string[],
  });

  // Escáner & Validación QR
  const [validationMode, setValidationMode] = useState<"qr" | "manual">("qr");
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  // Estados de carga e interfaz
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingMenu, setUploadingMenu] = useState(false);
  const [savingData, setSavingData] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Referencia para el input de perfil
  const profileInputRef = useRef<HTMLInputElement>(null);

  // 1. Escuchar estado de Autenticación y cargar datos de Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const docRef = doc(db, "partners", currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setFormData({
              name: data.name || "",
              category: data.category || "Restaurante",
              phone: data.phone || "",
              address: data.address || "",
              description: data.description || "",
              imageUrl: data.imageUrl || "",
              menuImages: data.menuImages || [],
            });
          }
        } catch (e) {
          console.error("Error cargando datos de Firestore:", e);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Inicializar Lector QR de forma segura solo en el navegador
  useEffect(() => {
    let scannerInstance: any = null;

    if (scanning && validationMode === "qr" && typeof window !== "undefined") {
      import("html5-qrcode").then(({ Html5QrcodeScanner }) => {
        scannerInstance = new Html5QrcodeScanner(
          "reader",
          { fps: 10, qrbox: { width: 220, height: 220 } },
          false
        );

        scannerInstance.render(
          (decodedText: string) => {
            setScanResult(decodedText);
            setScanning(false);
            if (scannerInstance) {
              scannerInstance.clear().catch(() => {});
            }
          },
          () => {}
        );
      });
    }

    return () => {
      if (scannerInstance) {
        scannerInstance.clear().catch((err: any) => console.error("Limpiando lector QR:", err));
      }
    };
  }, [scanning, validationMode]);

  // Validar Código Manual
  const handleManualValidation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    setScanResult(manualCode.trim().toUpperCase());
    setManualCode("");
  };

  // Guardar Cambios de Texto del Comercio
  const handleSaveData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingData(true);
    setMessage(null);

    try {
      await setDoc(doc(db, "partners", user.uid), formData, { merge: true });
      setMessage({ type: "success", text: "¡Datos del comercio actualizados!" });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Error al guardar los datos." });
    } finally {
      setSavingData(false);
    }
  };

  // 📸 Subir Foto de Perfil
  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const currentUser = user || auth.currentUser;
    if (!currentUser) {
      setMessage({ type: "error", text: "Debes iniciar sesión para subir fotos." });
      return;
    }

    setUploadingProfile(true);
    setMessage(null);

    try {
      const storageRef = ref(storage, `partners/${currentUser.uid}/profile_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const updated = { ...formData, imageUrl: url };
      setFormData(updated);
      await setDoc(doc(db, "partners", currentUser.uid), updated, { merge: true });

      setMessage({ type: "success", text: "Foto de perfil actualizada. 📸" });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Error al subir foto de perfil." });
    } finally {
      setUploadingProfile(false);
      if (e.target) e.target.value = "";
    }
  };

  // 🗑️ Eliminar Foto de Perfil
  const handleDeleteProfile = async () => {
    const currentUser = user || auth.currentUser;
    if (!currentUser || !formData.imageUrl) return;
    if (!confirm("¿Eliminar foto de perfil?")) return;

    try {
      if (formData.imageUrl.includes("firebasestorage")) {
        await deleteObject(ref(storage, formData.imageUrl)).catch(() => {});
      }
      const updated = { ...formData, imageUrl: "" };
      setFormData(updated);
      await setDoc(doc(db, "partners", currentUser.uid), updated, { merge: true });
      setMessage({ type: "success", text: "Foto de perfil eliminada." });
    } catch (err) {
      console.error(err);
    }
  };

  // 🍕 Subir Foto de Menú (Máximo 3)
  const handleMenuUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const currentUser = user || auth.currentUser;
    if (!file || !currentUser) return;

    if (formData.menuImages.length >= 3) {
      setMessage({ type: "error", text: "Solo puedes subir un máximo de 3 fotos de menú." });
      return;
    }

    setUploadingMenu(true);
    setMessage(null);

    try {
      const storageRef = ref(storage, `partners/${currentUser.uid}/menu_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const newMenu = [...formData.menuImages, url];
      const updated = { ...formData, menuImages: newMenu };
      setFormData(updated);
      await setDoc(doc(db, "partners", currentUser.uid), updated, { merge: true });

      setMessage({ type: "success", text: "Foto de menú agregada. 🍕" });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Error al subir imagen de menú." });
    } finally {
      setUploadingMenu(false);
      if (e.target) e.target.value = "";
    }
  };

  // 🗑️ Eliminar Una Foto del Menú
  const handleDeleteMenuImage = async (urlToDelete: string) => {
    const currentUser = user || auth.currentUser;
    if (!currentUser) return;
    if (!confirm("¿Eliminar esta foto del menú?")) return;

    try {
      if (urlToDelete.includes("firebasestorage")) {
        await deleteObject(ref(storage, urlToDelete)).catch(() => {});
      }
      const newMenu = formData.menuImages.filter((img) => img !== urlToDelete);
      const updated = { ...formData, menuImages: newMenu };
      setFormData(updated);
      await setDoc(doc(db, "partners", currentUser.uid), updated, { merge: true });
      setMessage({ type: "success", text: "Foto de menú eliminada." });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center text-xs font-bold">Cargando panel...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 max-w-md mx-auto flex flex-col gap-6 pb-16">
      
      {/* HEADER PRINCIPAL */}
      <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl text-center flex flex-col items-center">
        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-2">
          🏬 DASHBOARD COMERCIO
        </span>
        <h1 className="text-xl font-black text-white">{formData.name || "Mi Comercio"}</h1>
        <p className="text-xs text-slate-400">{formData.category}</p>
      </div>

      {message && (
        <div className={`p-3.5 rounded-xl border text-xs font-bold text-center ${
          message.type === "success" ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" : "bg-rose-500/10 border-rose-500/40 text-rose-400"
        }`}>
          {message.text}
        </div>
      )}

      {/* 1️⃣ VALIDAR PASE VIP (CÁMARA / MANUAL) */}
      <section className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col gap-4 text-center">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          🔍 Validar Pase de Cliente
        </h3>

        {/* Switch de Modo */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => { setValidationMode("qr"); setScanResult(null); }}
            className={`py-2 rounded-lg text-xs font-bold transition-all ${
              validationMode === "qr" ? "bg-sky-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            📷 Cámara QR
          </button>
          <button
            type="button"
            onClick={() => { setValidationMode("manual"); setScanning(false); setScanResult(null); }}
            className={`py-2 rounded-lg text-xs font-bold transition-all ${
              validationMode === "manual" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            ⌨️ Código Manual
          </button>
        </div>

        {/* Cámara QR */}
        {validationMode === "qr" && (
          <div className="flex flex-col gap-3">
            {!scanning ? (
              <button
                type="button"
                onClick={() => { setScanning(true); setScanResult(null); }}
                className="w-full py-3.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
              >
                📷 Abrir Cámara y Escanear
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <div id="reader" className="overflow-hidden rounded-2xl border border-slate-700 bg-black"></div>
                <button
                  type="button"
                  onClick={() => setScanning(false)}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cerrar Cámara
                </button>
              </div>
            )}
          </div>
        )}

        {/* Formulario Código Manual */}
        {validationMode === "manual" && (
          <form onSubmit={handleManualValidation} className="flex gap-2">
            <input
              type="text"
              placeholder="Ej: VIVE-1234"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white uppercase font-mono tracking-wider flex-1 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black px-4 rounded-xl uppercase transition-all"
            >
              Validar
            </button>
          </form>
        )}

        {/* Resultado del Escaneo/Validación */}
        {scanResult && (
          <div className="bg-emerald-500/10 border border-emerald-500/40 p-4 rounded-2xl text-center flex flex-col gap-1 mt-2">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">¡Código Detectado!</span>
            <span className="text-base font-mono font-bold text-white tracking-widest">{scanResult}</span>
          </div>
        )}
      </section>

      {/* 2️⃣ FOTO DE PERFIL / PORTADA */}
      <section className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col gap-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          📸 Foto de Perfil / Logo
        </h3>

        {formData.imageUrl ? (
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 group">
            <img src={formData.imageUrl} alt="Perfil" className="w-full h-40 object-cover" />
            <button
              type="button"
              onClick={handleDeleteProfile}
              className="absolute top-2 right-2 bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-lg"
            >
              🗑️ Eliminar
            </button>
          </div>
        ) : (
          <div className="w-full h-32 bg-slate-950 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-1 text-slate-500">
            <span className="text-2xl">📷</span>
            <span className="text-xs font-bold">Sin foto de perfil</span>
          </div>
        )}

        {/* Input oculto controlado por referencia */}
        <input 
          type="file" 
          ref={profileInputRef}
          accept="image/*" 
          onChange={handleProfileUpload} 
          className="hidden" 
        />

        <button
          type="button"
          disabled={uploadingProfile}
          onClick={() => profileInputRef.current?.click()}
          className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl text-center transition-all cursor-pointer disabled:opacity-50"
        >
          {uploadingProfile ? "Subiendo a la nube..." : formData.imageUrl ? "🔄 Cambiar Foto" : "⬆️ Seleccionar Foto"}
        </button>
      </section>

      {/* 3️⃣ GALERÍA / FOTOS DE MENÚ (MÁXIMO 3) */}
      <section className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            🍕 Fotos del Menú / Productos
          </h3>
          <span className="text-[11px] font-bold text-slate-500">{formData.menuImages.length}/3 fotos</span>
        </div>

        {/* Grilla de imágenes del menú */}
        <div className="grid grid-cols-3 gap-2">
          {formData.menuImages.map((imgUrl, index) => (
            <div key={index} className="relative group rounded-xl overflow-hidden border border-slate-800 aspect-square">
              <img src={imgUrl} alt={`Menú ${index + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleDeleteMenuImage(imgUrl)}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-rose-400 font-bold text-xs"
              >
                ❌
              </button>
            </div>
          ))}

          {/* Slots vacíos si no se llega a 3 */}
          {Array.from({ length: 3 - formData.menuImages.length }).map((_, idx) => (
            <div key={idx} className="border-2 border-dashed border-slate-800 rounded-xl aspect-square flex items-center justify-center text-slate-600 text-xs font-bold">
              +
            </div>
          ))}
        </div>

        {formData.menuImages.length < 3 && (
          <label className="w-full cursor-pointer">
            <input type="file" accept="image/*" onChange={handleMenuUpload} disabled={uploadingMenu} className="hidden" />
            <div className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl text-center border border-slate-700 transition-all">
              {uploadingMenu ? "Subiendo..." : "➕ Agregar Foto al Menú"}
            </div>
          </label>
        )}
      </section>

      {/* 4️⃣ DATOS GENERALES DEL COMERCIO */}
      <form onSubmit={handleSaveData} className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col gap-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          📝 Datos del Comercio
        </h3>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-slate-400">Nombre del Local</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
            placeholder="Ej: Restaurant O Peixe"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-slate-400">Categoría</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="Restaurante">Restaurante</option>
            <option value="Cafetería / Bar">Cafetería / Bar</option>
            <option value="Tienda / Ropa">Tienda / Ropa</option>
            <option value="Tours / Excursiones">Tours / Excursiones</option>
            <option value="Servicios">Servicios</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-slate-400">WhatsApp / Teléfono</label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
            placeholder="+55 22 99999-9999"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-slate-400">Dirección / Ubicación</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
            placeholder="Rua das Pedras, Búzios"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-slate-400">Promoción / Descripción</label>
          <textarea
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
            placeholder="Ej: 10% de descuento abonando en efectivo presentando tu Pase VIP."
          />
        </div>

        <button
          type="submit"
          disabled={savingData}
          className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all mt-2"
        >
          {savingData ? "Guardando..." : "💾 Guardar Todos los Cambios"}
        </button>
      </form>
    </main>
  );
}