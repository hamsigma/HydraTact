import type { Metadata } from "next";
import React from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "HydraTact Samarinda - Pelaporan Darurat Warga",
  description: "Aplikasi Pelaporan Darurat Kebakaran Zero-Hardware Tepian Mahakam Samarinda",
  manifest: "/manifest.json",
  themeColor: "#F8F9FA",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-[#F0F2F5] text-slate-900 font-sans antialiased min-h-screen selection:bg-red-100 selection:text-red-900">
        {children}
      </body>
    </html>
  );
}
