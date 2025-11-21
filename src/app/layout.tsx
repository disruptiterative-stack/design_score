import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Optimización de fuentes
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap", // Optimización de fuentes
});

export const metadata: Metadata = {
  title: "Design Score - Visualizador 3D",
  description: "Plataforma de visualización 3D interactiva con KeyShot XR",
  keywords: ["3D", "visualizador", "KeyShot", "XR", "productos"],
  authors: [{ name: "Design Score Team" }],
  openGraph: {
    title: "Design Score - Visualizador 3D",
    description: "Plataforma de visualización 3D interactiva",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
