import type { Metadata } from "next";
import React from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "HydraTact Samarinda - Dasbor Komando Posko Induk",
  description: "Tactical Zero-Hardware Command Center for Samarinda Dense Settlement Firefighting",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body className="bg-[#07090E] text-stone-100 antialiased min-h-screen overflow-hidden selection:bg-red-950 selection:text-red-200">
        {children}
      </body>
    </html>
  );
}
