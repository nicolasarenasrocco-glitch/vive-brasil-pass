"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, collection, onSnapshot, deleteDoc } from "firebase/firestore";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"pasajero" | "comercio">("pasajero");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal de Confirmación de Borrado
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: "pasajero" | "comercio";
    id: string;
    title: string;
  }>({
    isOpen: false,
    type: "pasajero",
    id: "",
    title: "",
  });

  // Listas en tiempo real
  const [pasajerosList, setPasajerosList] = useState<any[]>([]);
  const [partnersList, setPartnersList] = useState<any[]>([]);

  // Formulario Pasajero
  const [pasajeroForm, setPasajeroForm] = useState({
    email: "",
    password: "",
    nombre: "",
    fechaInicio: "",
    fechaFin: "",
  });

  // Formulario Comercio
  const [comercioForm, setComercioForm] = useState({
    email: "",
    password: "",
    nombre: "",
    sector: "Búzios",
    category: "Gastronomía",
    discount: "15% OFF",
    benefit: "Beneficio especial de bienvenida",
    location: "Centro",
  });

  // 1. Cargar Pasajeros y Comercios desde Firestore en tiempo real
  useEffect(() => {
    const unsubPasajeros = onSnapshot(collection(db, "users"), (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPasajerosList(list);
    });

    const unsubPartners = onSnapshot(collection(db, "partners"), (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPartnersList(list);
    });

    return () => {
      unsubPasajeros();
      unsubPartners();
    };
  }, []);

  // Guardar Pasajero VIP
  const handleCreatePasajero = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        pasajeroForm.email,
        pasajeroForm.password
      );
      const uid = userCred.user.uid;
      const passCode = `VIVE-${uid.slice(0, 4).toUpperCase()}`;

      await setDoc(doc(db, "users", uid), {
        uid,
        email: pasajeroForm.email,
        nombre: pasajeroForm.nombre,
        passCode,
        role: "pasajero",
        fechaInicio: pasajeroForm.fechaInicio,
        fechaFin: pasajeroForm.fechaFin,
        createdAt: new Date().toISOString(),
      });

      setMessage({
        type: "success",
        text: `¡Pasajero creado con éxito! Código de pase: ${passCode}`,
      });

      setPasajeroForm({
        email: "",
        password: "",
        nombre: "",
        fechaInicio: "",
        fechaFin: "",
      });
    } catch (err: any) {
      console.error(err);
      setMessage({
        type: "error",
        text: err.message || "Error al crear el usuario. Verifica si el email ya existe.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Guardar Comercio Partner
  const handleCreateComercio = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        comercioForm.email,
        comercioForm.password
      );
      const uid = userCred.user.uid;

      await setDoc(doc(db, "partners", uid), {
        id: uid,
        name: comercioForm.nombre,
        sector: comercioForm.sector,
        category: comercioForm.category,
        discount: comercioForm.discount,
        benefit: comercioForm.benefit,
        location: comercioForm.location,
        imageUrl: "",
        menuUrl: "",
        role: "comercio",
      });

      setMessage({
        type: "success",
        text: `¡Comercio "${comercioForm.nombre}" creado exitosamente!`,
      });

      setComercioForm({
        email: "",
        password: "",
        nombre: "",
        sector: "Búzios",
        category: "Gastronomía",
        discount: "15% OFF",
        benefit: "Beneficio especial de bienvenida",
        location: "Centro",
      });
    } catch (err: any) {
      console.error(err);
      setMessage({
        type: "error",
        text: err.message || "Error al registrar el comercio.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Abrir Modal de Confirmación
  const openDeleteModal = (type: "pasajero" | "comercio", id: string, title: string) => {
    setDeleteModal({
      isOpen: true,
      type,
      id,
      title,
    });
  };

  // Confirmar Eliminación Definitiva
  const confirmDelete = async () => {
    const { type, id, title } = deleteModal;
    setDeleteModal({ ...deleteModal, isOpen: false });

    try {
      if (type === "pasajero") {
        await deleteDoc(doc(db, "users", id));
        setMessage({
          type: "success",
          text: `El pasajero "${title}" fue eliminado correctamente.`,
        });
      } else {
        await deleteDoc(doc(db, "partners", id));
        setMessage({
          type: "success",
          text: `El comercio "${title}" fue eliminado correctamente.`,
        });
      }
    } catch (err: any) {
      console.error(err);
      setMessage({
        type: "error",
        text: "Error al intentar eliminar el registro.",
      });
    }
  };

  // Verificar si un pase está activo o vencido
  const checkIsActive = (fechaFin: string) => {
    if (!fechaFin) return true;
    const today = new Date().toISOString().split("T")[0];
    return today <= fechaFin;
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 max-w-md mx-auto flex flex-col gap-6 pb-12">
      {/* Header Admin */}
      <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl text-center">
        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-2">
          ⚙️ PANEL DE ADMINISTRACIÓN
        </span>
        <h1 className="text-xl font-black text-white">Gestión Global de Pases</h1>
        <p className="text-xs text-slate-400 mt-1">Crea y administra cuentas para Pasajeros VIP y Comercios.</p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
        <button
          onClick={() => { setActiveTab("pasajero"); setMessage(null); }}
          className={`py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "pasajero" ? "bg-sky-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
          }`}
        >
          👤 Pasajeros ({pasajerosList.length})
        </button>
        <button
          onClick={() => { setActiveTab("comercio"); setMessage(null); }}
          className={`py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "comercio" ? "bg-emerald-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
          }`}
        >
          🏬 Comercios ({partnersList.length})
        </button>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold text-center ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/40 text-rose-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* SECCIÓN PASAJEROS */}
      {activeTab === "pasajero" && (
        <div className="flex flex-col gap-6">
          <form onSubmit={handleCreatePasajero} className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white">Nuevo Pasajero VIP</h3>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-400">Nombre Completo</label>
              <input
                type="text"
                required
                placeholder="Ej: Juan Pérez"
                value={pasajeroForm.nombre}
                onChange={(e) => setPasajeroForm({ ...pasajeroForm, nombre: e.target.value })}
                className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-400">Correo Electrónico</label>
              <input
                type="email"
                required
                placeholder="pasajero@email.com"
                value={pasajeroForm.email}
                onChange={(e) => setPasajeroForm({ ...pasajeroForm, email: e.target.value })}
                className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-400">Contraseña Asignada</label>
              <input
                type="text"
                required
                placeholder="Mínimo 6 caracteres"
                value={pasajeroForm.password}
                onChange={(e) => setPasajeroForm({ ...pasajeroForm, password: e.target.value })}
                className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-slate-800 pt-3 mt-1">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-amber-400">📅 Inicio Estadía</label>
                <input
                  type="date"
                  required
                  value={pasajeroForm.fechaInicio}
                  onChange={(e) => setPasajeroForm({ ...pasajeroForm, fechaInicio: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-rose-400">📅 Término Estadía</label>
                <input
                  type="date"
                  required
                  value={pasajeroForm.fechaFin}
                  onChange={(e) => setPasajeroForm({ ...pasajeroForm, fechaFin: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? "Generando Cuenta..." : "Crear Pasajero VIP 👑"}
            </button>
          </form>

          {/* LISTA PASAJEROS */}
          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col gap-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              👥 Pasajeros Registrados ({pasajerosList.length})
            </h3>

            {pasajerosList.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-2 italic">No hay usuarios creados aún.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {pasajerosList.map((u) => {
                  const isActive = checkIsActive(u.fechaFin);
                  return (
                    <div
                      key={u.id}
                      className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex justify-between items-center"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black text-white">{u.nombre || "Sin Nombre"}</h4>
                          <span
                            className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                              isActive
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                            }`}
                          >
                            {isActive ? "🟢 ACTIVO" : "🔴 VENCIDO"}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">{u.email}</p>
                        {u.fechaInicio && u.fechaFin && (
                          <p className="text-[10px] text-slate-500">
                            📅 {u.fechaInicio} al {u.fechaFin}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => openDeleteModal("pasajero", u.id, u.email)}
                        className="text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 p-2 rounded-xl transition-all text-xs font-bold"
                        title="Eliminar Pasajero"
                      >
                        🗑️ Borrar
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECCIÓN COMERCIOS */}
      {activeTab === "comercio" && (
        <div className="flex flex-col gap-6">
          <form onSubmit={handleCreateComercio} className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white">Nuevo Comercio Partner</h3>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-400">Nombre del Local</label>
              <input
                type="text"
                required
                placeholder="Ej: Chez Michou"
                value={comercioForm.nombre}
                onChange={(e) => setComercioForm({ ...comercioForm, nombre: e.target.value })}
                className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-400">Email de Login</label>
                <input
                  type="email"
                  required
                  placeholder="local@email.com"
                  value={comercioForm.email}
                  onChange={(e) => setComercioForm({ ...comercioForm, email: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-400">Contraseña</label>
                <input
                  type="text"
                  required
                  placeholder="123456"
                  value={comercioForm.password}
                  onChange={(e) => setComercioForm({ ...comercioForm, password: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-400">Sector</label>
                <select
                  value={comercioForm.sector}
                  onChange={(e) => setComercioForm({ ...comercioForm, sector: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Búzios">Búzios</option>
                  <option value="Río de Janeiro">Río de Janeiro</option>
                  <option value="Florianópolis">Florianópolis</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-400">Categoría</label>
                <select
                  value={comercioForm.category}
                  onChange={(e) => setComercioForm({ ...comercioForm, category: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Gastronomía">Gastronomía 🍽️</option>
                  <option value="Playa">Playa / Beach Club 🏖️</option>
                  <option value="Bares">Bares / Vida Nocturna 🍹</option>
                  <option value="Bienestar / Wellness">Bienestar / Wellness 🧘‍♀️</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? "Creando Comercio..." : "Crear Comercio Partner 🏬"}
            </button>
          </form>

          {/* LISTA COMERCIOS */}
          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col gap-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              🏬 Comercios Registrados ({partnersList.length})
            </h3>

            {partnersList.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-2 italic">No hay comercios creados aún.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {partnersList.map((p) => (
                  <div
                    key={p.id}
                    className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center"
                  >
                    <div>
                      <h4 className="text-xs font-black text-white">{p.name}</h4>
                      <p className="text-[10px] text-slate-400">
                        {p.sector} • {p.category}
                      </p>
                    </div>

                    <button
                      onClick={() => openDeleteModal("comercio", p.id, p.name)}
                      className="text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 p-2 rounded-xl transition-all text-xs font-bold"
                      title="Eliminar Comercio"
                    >
                      🗑️ Borrar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE BORRADO */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4 text-center shadow-2xl">
            <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto text-xl text-rose-400 font-bold">
              ⚠️
            </div>

            <div>
              <h3 className="text-base font-black text-white">¿Confirmas la eliminación?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Estás a punto de borrar a <strong className="text-rose-400">{deleteModal.title}</strong>. Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all"
              >
                No, cancelar
              </button>

              <button
                onClick={confirmDelete}
                className="py-3 bg-rose-500 hover:bg-rose-400 text-slate-950 text-xs font-black uppercase rounded-xl transition-all shadow-lg shadow-rose-500/20"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}