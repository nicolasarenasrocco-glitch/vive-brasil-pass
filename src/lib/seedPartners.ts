import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";

export const initialPartners = [
  // BÚZIOS
  {
    name: "Geribá Beach Lounge",
    category: "Playa",
    sector: "Búzios",
    discount: "20% OFF",
    benefit: "2x1 en Caipirinhas + Reposera gratis",
    location: "Praia de Geribá, Búzios",
    lat: -22.7758,
    lng: -41.9022,
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    menuUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    instagram: "geribabeachlounge"
  },
  {
    name: "Chez Michou Creperie",
    category: "Gastronomía",
    sector: "Búzios",
    discount: "15% OFF",
    benefit: "Crepe dulce de regalo en consumo superior a R$100",
    location: "Rua das Pedras, Búzios",
    lat: -22.7548,
    lng: -41.8885,
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    menuUrl: "",
    instagram: "chezmichoubuzios"
  },
  {
    name: "Silk Beach Club",
    category: "Bares",
    sector: "Búzios",
    discount: "25% OFF",
    benefit: "Acceso VIP a camastros + Trago de bienvenida",
    location: "Praia Brava, Búzios",
    lat: -22.7601,
    lng: -41.8792,
    imageUrl: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80",
    menuUrl: "",
    instagram: "silkbeachclub"
  },

  // RÍO DE JANEIRO (Lapa & Zona Sul)
  {
    name: "Rio Scenarium",
    category: "Bares",
    sector: "Río de Janeiro",
    discount: "20% OFF",
    benefit: "Entrada preferencial sin fila + Cerveza artesanal gratis",
    location: "Rua do Lavradio, Lapa, Río de Janeiro",
    lat: -22.9098,
    lng: -43.1818,
    imageUrl: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80",
    menuUrl: "",
    instagram: "rioscenarium"
  },
  {
    name: "Carioca da Gema",
    category: "Bares",
    sector: "Río de Janeiro",
    discount: "15% OFF",
    benefit: "10% de descuento en mesa + Caipirinha de maracuyá de cortesía",
    location: "Av. Mem de Sá, Lapa, Río de Janeiro",
    lat: -22.9131,
    lng: -43.1812,
    imageUrl: "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=800&q=80",
    menuUrl: "",
    instagram: "barcariocadagema"
  },
  {
    name: "Beco do Rato",
    category: "Gastronomía",
    sector: "Río de Janeiro",
    discount: "10% OFF",
    benefit: "Porción de petiscos gratis en el consumo de balde de cerveza",
    location: "Rua Joaquim Silva, Lapa, Río de Janeiro",
    lat: -22.9152,
    lng: -43.1789,
    imageUrl: "https://images.unsplash.com/photo-1538332576228-eb5b4c4de6f5?auto=format&fit=crop&w=800&q=80",
    menuUrl: "",
    instagram: "becodorato"
  },

  // FLORIANÓPOLIS
  {
    name: "P12 Jurerê Internacional",
    category: "Playa",
    sector: "Florianópolis",
    discount: "20% OFF",
    benefit: "Descuento en ticket de entrada + Welcome Drink",
    location: "Jurerê Internacional, Florianópolis",
    lat: -27.4372,
    lng: -48.4975,
    imageUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
    menuUrl: "",
    instagram: "p12jurere"
  }
];

export async function seedPartnersDatabase() {
  try {
    for (const partner of initialPartners) {
      await addDoc(collection(db, "partners"), partner);
    }
    console.log("¡Socios cargados exitosamente!");
    return true;
  } catch (error) {
    console.error("Error al cargar socios:", error);
    return false;
  }
}