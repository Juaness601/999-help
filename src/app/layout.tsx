import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "999help — Tu Biblioteca y Backlog Personal de Videojuegos",
  description:
    "Rastrea qué estás jugando, completa tu backlog, guarda tus puntuaciones y escribe tu bitácora personal de videojuegos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased bg-[#09090d] text-zinc-100 min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
