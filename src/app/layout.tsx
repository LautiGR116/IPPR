import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IPPR",
  description: "Prototipo funcional de Intereses y Preferencias Profesionales"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
