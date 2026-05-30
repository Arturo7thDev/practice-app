import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Display tipográfica con carácter editorial/clásico — coherente con la
// solidez y permanencia de un faro. Variable para usar pesos 400-700.
const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
  display: "swap",
});

// Mono técnica para datos, precios, números de mercado.
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Faro · Arbitraje cripto honesto",
  description:
    "Bot de arbitraje BTC + ETH en tiempo real, lineal y triangular, con modelo de costos completo. Hecho para el Coding Challenge Mexico 2026.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${fraunces.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="ambient-bg flex min-h-full flex-col">{children}</body>
    </html>
  );
}
