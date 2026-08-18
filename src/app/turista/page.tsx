"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react";

type Comercio = {
  id: string;

  name: string;
  category: string;
  zone: string;

  benefit: string;
  discount: string;

  description: string;
  details: string;

  imageUrl: string;
  images: string[];

  address: string;
  phone: string;
  instagram: string;

  raw: any;
};

function texto(...valores: any[]): string {
  for (const valor of valores) {
    if (valor !== undefined && valor !== null && String(valor).trim() !== "") {
      return String(valor).trim();
    }
  }

  return "";
}

function lista(...valores: any[]): string[] {
  for (const valor of valores) {
    if (Array.isArray(valor) && valor.length > 0) {
      return valor.filter(Boolean).map(String);
    }
  }

  return [];
}

function normalizarInstagram(valor: string): string {
  if (!valor) return "";

  return valor
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/\/$/, "");
}

function normalizarComercio(
  id: string,
  data: any
): Comercio {
  const instagram = normalizarInstagram(
    texto(
      data.instagram,
      data.instagramUser,
      data.instagramUsername,
      data.instagramHandle,
      data.redes,
      data.redeSocial,
      data.social,
      data.socialMedia
    )
  );

  const comercio: Comercio = {
    id,

    name: texto(
      data.name,
      data.nombre,
      data.nome,
      data.businessName,
      data.nombreComercio,
      data.nombreNegocio,
      data.empresa
    ) || "Comercio sin nombre",

    category: texto(
      data.category,
      data.categoria,
      data.categoriaComercio,
      data.type,
      data.tipo
    ) || "General",

    zone: texto(
      data.zone,
      data.zona,
      data.location,
      data.ciudad,
      data.destination,
      data.destino
    ) || "Brasil",

    benefit: texto(
      data.benefit,
      data.beneficio,
      data.description,
      data.descripcion,
      data.discount,
      data.descuento
    ) || "Beneficio VIP",

    discount: texto(
      data.discount,
      data.descuento,
      data.benefit,
      data.beneficio
    ),

    description: texto(
      data.description,
      data.descripcion,
      data.descriptionShort,
      data.descripcionCorta
    ),

    details: texto(
      data.details,
      data.detalles,
      data.about,
      data.sobreNosotros,
      data.descriptionLong,
      data.descripcionLarga
    ),

    imageUrl: texto(
      data.imageUrl,
      data.image,
      data.logo,
      data.logoUrl,
      data.photo,
      data.foto,
      data.fotoUrl,
      data.coverImage,
      data.portada
    ),

    images: lista(
      data.images,
      data.galeria,
      data.gallery,
      data.photos,
      data.fotos
    ),

    address: texto(
      data.address,
      data.direccion,
      data.endereco,
      data.addressLine,
      data.ubicacion,
      data.locationAddress
    ),

    phone: texto(
      data.phone,
      data.telefono,
      data.telefone,
      data.whatsapp,
      data.whatsApp,
      data.contactPhone,
      data.contacto,
      data.contact
    ),

    instagram,

    raw: data,
  };

  return comercio;
}

export default function TuristaPage() {
  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [loading, setLoading] = useState(true);

  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState("Todos");

  const [zonaSeleccionada, setZonaSeleccionada] =
    useState("Todas");

  const [comercioActivo, setComercioActivo] =
    useState<Comercio | null>(null);

  useEffect(() => {
    async function cargarDatos() {
      try {
        const querySnapshot = await getDocs(
          collection(db, "partners")
        );

        const lista: Comercio[] = [];

        querySnapshot.forEach((documento) => {
          const data = documento.data();

          console.log(
            "PARTNER FIREBASE:",
            documento.id,
            data
          );

          lista.push(
            normalizarComercio(
              documento.id,
              data
            )
          );
        });

        console.log(
          "COMERCIOS NORMALIZADOS:",
          lista
        );

        setComercios(lista);
      } catch (error) {
        console.error(
          "Error al cargar partners:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    cargarDatos();
  }, []);

  const categorias = useMemo(() => {
    return [
      "Todos",
      ...Array.from(
        new Set(
          comercios
            .map((item) => item.category)
            .filter(Boolean)
        )
      ),
    ];
  }, [comercios]);

  const zonas = useMemo(() => {
    return [
      "Todas",
      ...Array.from(
        new Set(
          comercios
            .map((item) => item.zone)
            .filter(Boolean)
        )
      ),
    ];
  }, [comercios]);

  const comerciosFiltrados = useMemo(() => {
    return comercios.filter((item) => {
      const coincideCategoria =
        categoriaSeleccionada === "Todos" ||
        item.category === categoriaSeleccionada;

      const coincideZona =
        zonaSeleccionada === "Todas" ||
        item.zone === zonaSeleccionada;

      return (
        coincideCategoria &&
        coincideZona
      );
    });
  }, [
    comercios,
    categoriaSeleccionada,
    zonaSeleccionada,
  ]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white font-medium">
        Cargando Pase VIP y comercios...
      </div>
    );
  }

  const passCode = "VIVE-8824";

  return (
    <div className="flex flex-col gap-4 p-4 max-w-md mx-auto text-white bg-slate-950 min-h-screen">

      {/* ============================= */}
      {/* MODAL COMERCIO */}
      {/* ============================= */}

      {comercioActivo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">

          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

            {/* Imagen principal */}

            <div className="relative h-48 w-full bg-slate-950">

              <img
                src={
                  comercioActivo.imageUrl ||
                  comercioActivo.images[0] ||
                  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5"
                }
                alt={comercioActivo.name}
                className="w-full h-full object-cover"
              />

              <button
                onClick={() =>
                  setComercioActivo(null)
                }
                className="absolute top-3 right-3 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold hover:bg-black"
              >
                ✕
              </button>

            </div>

            <div className="p-5 overflow-y-auto space-y-3">

              {/* Nombre */}

              <div>

                <span className="text-[10px] bg-sky-500/20 text-sky-300 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  {comercioActivo.zone}
                </span>

                <h3 className="text-xl font-black text-white mt-1">
                  {comercioActivo.name}
                </h3>

                <p className="text-xs text-slate-400 mt-1">
                  {comercioActivo.category}
                </p>

              </div>

              {/* Beneficio */}

              <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl">

                <p className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider mb-0.5">
                  Beneficio VIP 🎁
                </p>

                <p className="text-xs text-white font-bold">
                  {comercioActivo.benefit}
                </p>

              </div>

              {/* Galería */}

              {comercioActivo.images.length > 0 && (

                <div>

                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1.5">
                    Galería / Menú
                  </p>

                  <div className="grid grid-cols-3 gap-2">

                    {comercioActivo.images.map(
                      (imgUrl, index) => (

                        <div
                          key={index}
                          className="h-20 rounded-xl overflow-hidden border border-slate-800 bg-slate-950"
                        >

                          <img
                            src={imgUrl}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-full object-cover"
                          />

                        </div>

                      )
                    )}

                  </div>

                </div>

              )}

              {/* Descripción */}

              {comercioActivo.description && (

                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {comercioActivo.description}
                  </p>

                </div>

              )}

              {/* Detalles */}

              {comercioActivo.details && (

                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {comercioActivo.details}
                  </p>

                </div>

              )}

              {/* ============================= */}
              {/* DATOS DE CONTACTO */}
              {/* ============================= */}

              <div className="pt-2 text-xs text-slate-400 space-y-3 bg-slate-950/30 p-3 rounded-xl border border-slate-800/60">

                {/* Dirección */}

                {comercioActivo.address && (

                  <div className="flex items-start justify-between gap-2">

                    <p className="leading-relaxed">

                      📍{" "}
                      <strong className="text-slate-200">
                        Dirección:
                      </strong>{" "}

                      {comercioActivo.address}

                    </p>

                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        comercioActivo.address
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] bg-sky-600 hover:bg-sky-500 text-white font-bold px-2 py-1 rounded-md shrink-0"
                    >
                      Ver Maps ↗
                    </a>

                  </div>

                )}

                {/* Teléfono */}

                {comercioActivo.phone && (

                  <div className="flex items-center justify-between gap-2">

                    <p>
                      📞{" "}
                      <strong className="text-slate-200">
                        Contacto:
                      </strong>{" "}

                      {comercioActivo.phone}
                    </p>

                    <a
                      href={`https://wa.me/${comercioActivo.phone.replace(
                        /\D/g,
                        ""
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2 py-1 rounded-md shrink-0"
                    >
                      WhatsApp ↗
                    </a>

                  </div>

                )}

                {/* Instagram */}

                {comercioActivo.instagram && (

                  <div className="flex items-center justify-between gap-2">

                    <p>

                      📸{" "}
                      <strong className="text-slate-200">
                        Instagram:
                      </strong>{" "}

                      @{comercioActivo.instagram}

                    </p>

                    <a
                      href={`https://instagram.com/${comercioActivo.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] bg-pink-600 hover:bg-pink-500 text-white font-bold px-2 py-1 rounded-md shrink-0"
                    >
                      Abrir Insta ↗
                    </a>

                  </div>

                )}

                {/* Aviso si no hay datos */}

                {!comercioActivo.address &&
                  !comercioActivo.phone &&
                  !comercioActivo.instagram && (

                    <p className="text-[11px] text-amber-400">
                      ⚠️ Este comercio no tiene
                      datos de contacto registrados.
                    </p>

                  )}

              </div>

              <button
                onClick={() =>
                  setComercioActivo(null)
                }
                className="w-full mt-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-all shadow-md"
              >
                Cerrar Detalle
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ============================= */}
      {/* PASE VIP */}
      {/* ============================= */}

      <div className="bg-gradient-to-br from-sky-900 via-slate-900 to-emerald-950 p-6 rounded-2xl border border-emerald-500/40 shadow-xl text-center">

        <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-500/40 inline-block mb-2">
          PASSE VIP ATIVO 🇧🇷
        </span>

        <h2 className="text-2xl font-black text-white">
          Viajero
        </h2>

        <p className="text-xs text-slate-300 mt-0.5">
          viajero@vivebrasil.com
        </p>

        <div className="mt-5 p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex flex-col items-center justify-center">

          <div className="bg-white p-2.5 rounded-xl shadow-md">

            <QRCodeSVG
              value={passCode}
              size={110}
              level="H"
            />

          </div>

          <p className="text-[11px] text-slate-400 mt-3 font-medium">

            Código:{" "}

            <span className="font-mono font-bold text-sky-400 text-sm tracking-wider">
              {passCode}
            </span>

          </p>

        </div>

      </div>

      {/* ============================= */}
      {/* COMERCIOS */}
      {/* ============================= */}

      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">

        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
          Comercios Partners ({comerciosFiltrados.length}) 📍
        </h3>

        {/* Zonas */}

        {zonas.length > 2 && (

          <div>

            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">
              Zona / Destino:
            </p>

            <div className="flex gap-1.5 overflow-x-auto pb-1">

              {zonas.map((zona) => (

                <button
                  key={zona}
                  onClick={() =>
                    setZonaSeleccionada(zona)
                  }
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap ${
                    zonaSeleccionada === zona
                      ? "bg-sky-500 text-slate-950"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {zona}
                </button>

              ))}

            </div>

          </div>

        )}

        {/* Categorías */}

        {categorias.length > 2 && (

          <div>

            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">
              Categoría:
            </p>

            <div className="flex gap-1.5 overflow-x-auto pb-1">

              {categorias.map((categoria) => (

                <button
                  key={categoria}
                  onClick={() =>
                    setCategoriaSeleccionada(
                      categoria
                    )
                  }
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap ${
                    categoriaSeleccionada ===
                    categoria
                      ? "bg-emerald-500 text-slate-950"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {categoria}
                </button>

              ))}

            </div>

          </div>

        )}

        {/* Lista */}

        {comerciosFiltrados.length > 0 ? (

          <div className="space-y-3 pt-1">

            {comerciosFiltrados.map((item) => (

              <div
                key={item.id}
                onClick={() =>
                  setComercioActivo(item)
                }
                className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg cursor-pointer hover:border-emerald-500/50 transition-all"
              >

                <div className="h-32 w-full overflow-hidden relative bg-slate-950">

                  <img
                    src={
                      item.imageUrl ||
                      item.images[0] ||
                      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5"
                    }
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />

                  <span className="absolute top-2 left-2 bg-slate-950/80 text-sky-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
                    {item.zone}
                  </span>

                  {item.discount && (

                    <span className="absolute top-2 right-2 bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-1 rounded-md">
                      {item.discount}
                    </span>

                  )}

                </div>

                <div className="p-3">

                  <h4 className="font-bold text-white text-sm">
                    {item.name}
                  </h4>

                  <p className="text-[11px] text-emerald-400 font-medium mt-0.5">
                    {item.benefit}
                  </p>

                </div>

              </div>

            ))}

          </div>

        ) : (

          <p className="text-xs text-slate-500 text-center py-6">
            No hay comercios con los filtros seleccionados.
          </p>

        )}

      </div>

      <a
        href="/"
        className="w-full py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs text-center block mb-4"
      >
        Volver / Salir
      </a>

    </div>
  );
}