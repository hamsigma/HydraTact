import type { Metadata } from "next";
import React from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "HydraTact Samarinda - Pelaporan Darurat Warga",
  description: "Aplikasi Pelaporan Darurat Kebakaran Zero-Hardware Tepian Mahakam Samarinda",
  manifest: "/manifest.json",
  themeColor: "#0c0a09",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-[#07090E] text-stone-100 antialiased min-h-screen selection:bg-red-950 selection:text-red-200">
        {children}
      </body>
    </html>
  );
}
