import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vive Brasil Pass | Tu Pase VIP",
  description: "Plataforma exclusiva de beneficios para pasajeros.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen flex flex-col items-center justify-start">
        {/* Contenedor vista móvil */}
        <div className="w-full max-w-md min-h-screen flex flex-col justify-between p-4 bg-slate-900 border-x border-slate-800 shadow-2xl">
          {/* Header */}
          <header className="flex justify-between items-center py-3 px-2 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🇧🇷</span>
              <span className="font-extrabold text-lg tracking-tight text-sky-400">
                Vive Brasil <span className="text-emerald-400">Pass</span>
              </span>
            </div>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full border border-slate-700">
              MVP v1.0
            </span>
          </header>

          {/* Contenido */}
          <main className="flex-1">{children}</main>

          {/* Footer */}
          <footer className="mt-8 py-4 text-center border-t border-slate-800 text-xs text-slate-500">
            © {new Date().getFullYear()} Vive Brasil Experience
          </footer>
        </div>
      </body>
    </html>
  );
}