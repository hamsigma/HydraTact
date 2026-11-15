"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  DEFAULT_SAMARINDA_WATER_SOURCES,
  type WaterSourcePoint,
  type ActiveIncidentMarker,
} from "../lib/water-sources";
import type { ActiveBarricadeItem } from "../lib/tactical-units";

export { DEFAULT_SAMARINDA_WATER_SOURCES, type WaterSourcePoint, type ActiveIncidentMarker };

export type BaseMapType = "OSM_STANDARD" | "OSM_HOT" | "CARTO_LIGHT";

export interface TacticalMapCanvasProps {
  incidents?: ActiveIncidentMarker[];
  waterSources?: WaterSourcePoint[];
  barricades?: ActiveBarricadeItem[];
  skmTideLevelMeters?: number;
  isHighTide?: boolean;
  selectedIncidentId?: string | null;
  onSelectIncident?: (id: string) => void;
  className?: string;
}

// Koordinat alur Sungai Karang Mumus (SKM) melintasi pusat Kota Samarinda
const SKM_RIVER_COORDINATES: [number, number][] = [
  [-0.485, 117.168],
  [-0.490, 117.162],
  [-0.496, 117.158],
  [-0.501, 117.154],
  [-0.506, 117.149],
  [-0.512, 117.145],
  [-0.518, 117.142],
];

export const TacticalMapCanvas: React.FC<TacticalMapCanvasProps> = ({
  incidents = [
    {
      id: "33333333-3333-3333-3333-333333333301",
      name: "Gg. 4 Pelita (Titik Api Aktif)",
      coordinates: [-0.5021, 117.1536],
      status: "VERIFIED",
      reportersCount: 2,
    },
  ],
  waterSources = DEFAULT_SAMARINDA_WATER_SOURCES,
  barricades = [
    {
      id: "barricade-01",
      roadName: "Mulut Jl. Pelita Gg. 4",
      feederCallSign: "UNIT TANGKI INDUK 05",
      hoseLengthMeters: 110,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ],
  skmTideLevelMeters = 1.8,
  isHighTide = true,
  selectedIncidentId = "33333333-3333-3333-3333-333333333301",
  onSelectIncident,
  className = "",
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  const [baseMap, setBaseMap] = useState<BaseMapType>("OSM_STANDARD");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "READY" | "LOW" | "EMPTY">("ALL");
  const [isMapReady, setIsMapReady] = useState(false);

  const filteredSources = waterSources.filter((ws) => {
    if (activeFilter === "ALL") return true;
    if (activeFilter === "READY") return ws.status === "READY";
    if (activeFilter === "LOW") return ws.status === "LOW_DISCHARGE";
    if (activeFilter === "EMPTY") return ws.status === "EMPTY";
    return true;
  });

  const activeBarricades = barricades.filter((b) => b.isActive);

  // Inisialisasi Leaflet.js Real Slippy Map (Client-Side Only)
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    let isSubscribed = true;

    import("leaflet").then((L) => {
      if (!isSubscribed || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      // Buat Leaflet Map terpusat di Samarinda (Sektor Pelita - Citra Niaga)
      const map = L.map(mapContainerRef.current, {
        center: [-0.5021, 117.1536],
        zoom: 15,
        minZoom: 11,
        maxZoom: 19,
        zoomControl: false,
      });

      // Kontrol Zoom di pojok kanan bawah agar tidak menabrak HUD
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Default Basemap: OpenStreetMap Standard
      const tileLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      tileLayerRef.current = tileLayer;

      // Buat LayerGroup untuk marker & polylines
      const markersLayer = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      markersLayerRef.current = markersLayer;
      setIsMapReady(true);
    });

    return () => {
      isSubscribed = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Basemap Tiles saat opsi basemap berubah
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;

      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }

      let newTileLayer: any;

      if (baseMap === "OSM_STANDARD") {
        // OpenStreetMap Standard Tiles
        newTileLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        });
      } else if (baseMap === "OSM_HOT") {
        // OpenStreetMap Humanitarian Tiles (Tinggi kontras jalan & gang)
        newTileLayer = L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles courtesy of Humanitarian OpenStreetMap Team',
          maxZoom: 19,
        });
      } else {
        // CartoDB Positron Light Minimalist
        newTileLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
          subdomains: "abcd",
          maxZoom: 19,
        });
      }

      newTileLayer.addTo(map);
      tileLayerRef.current = newTileLayer;
    });
  }, [baseMap, isMapReady]);

  // Render Marker, Polylines, dan Garis Selang saat data berubah
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !markersLayerRef.current) return;

    import("leaflet").then((L) => {
      const markersLayer = markersLayerRef.current;
      markersLayer.clearLayers();

      // 1. Gambar Alur Sungai Karang Mumus (SKM) - Poligon & Polyline Biru
      const skmLine = L.polyline(SKM_RIVER_COORDINATES, {
        color: "#0284C7",
        weight: 6,
        opacity: 0.65,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(markersLayer);

      skmLine.bindPopup(`
        <div style="font-family: monospace; font-size: 11px;">
          <p style="font-weight: bold; color: #0284C7; margin: 0 0 4px 0;">KORIDOR SUNGAI KARANG MUMUS</p>
          <p style="margin: 0; color: #475569;">STATUS: ${isHighTide ? "PASANG MAKSIMAL" : "SURUT NORMAL"}</p>
          <p style="margin: 2px 0 0 0; color: #0F172A; font-weight: bold;">ELEVASI: +${skmTideLevelMeters.toFixed(1)} METER</p>
          <p style="margin: 2px 0 0 0; color: #059669;">KAPASITAS SEDOT: OPTIMAL (POMPA PORTABEL)</p>
        </div>
      `);

      // 2. Garis Barikade Selang Relay Fuchsia (#C026D3)
      activeBarricades.forEach((barricade) => {
        // Hubungkan jalan arteri (Feeder) ke gang insiden (Attacker)
        const barricadePoints: [number, number][] = [
          [-0.5035, 117.1518], // Jl. Pelita Arteri
          [-0.5021, 117.1536], // Gg. 4 Titik Api
        ];

        const hoseLine = L.polyline(barricadePoints, {
          color: "#C026D3",
          weight: 5,
          opacity: 0.85,
          dashArray: "8, 6",
          lineCap: "square",
        }).addTo(markersLayer);

        hoseLine.bindPopup(`
          <div style="font-family: monospace; font-size: 11px;">
            <p style="font-weight: bold; color: #C026D3; margin: 0 0 4px 0;">BARIKADE SELANG RELAY</p>
            <p style="margin: 0; color: #0F172A; font-weight: bold;">${barricade.roadName}</p>
            <p style="margin: 2px 0 0 0; color: #475569;">DIBENTANGKAN: ${barricade.feederCallSign}</p>
            <p style="margin: 2px 0 0 0; color: #C026D3; font-weight: bold;">PANJANG: ${barricade.hoseLengthMeters} METER (4 BAR)</p>
          </div>
        `);
      });

      // 3. Titik-Titik Sumber Air (30+ Hydrants & Water Points)
      filteredSources.forEach((ws) => {
        const isReady = ws.status === "READY";
        const isLow = ws.status === "LOW_DISCHARGE";
        const color = isReady ? "#059669" : isLow ? "#D97706" : "#64748B";

        const hydrantIcon = L.divIcon({
          className: "custom-hydrant-icon",
          html: `
            <div style="
              width: 12px;
              height: 12px;
              background-color: ${color};
              border: 2px solid #FFFFFF;
              box-shadow: 0 1px 3px rgba(0,0,0,0.35);
              cursor: pointer;
            "></div>
          `,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        });

        const marker = L.marker(ws.coordinates, { icon: hydrantIcon }).addTo(markersLayer);

        marker.bindPopup(`
          <div style="font-family: monospace; font-size: 11px;">
            <p style="font-weight: bold; color: #0F172A; margin: 0 0 2px 0;">${ws.name}</p>
            <p style="margin: 0; color: #64748B;">TIPE: ${ws.type} • DEBIT: ${ws.dischargeLitersPerMin} L/MIN</p>
            <p style="margin: 4px 0 0 0; font-weight: bold; color: ${color};">STATUS: ${ws.status}</p>
          </div>
        `);
      });

      // 4. Titik Api / Insiden Aktif Berdenyut
      incidents.forEach((inc) => {
        const isSelected = inc.id === selectedIncidentId;

        const fireIcon = L.divIcon({
          className: "custom-fire-icon",
          html: `
            <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
              <div class="tactical-pulse-ring" style="position: absolute; inset: 0; background: rgba(220, 38, 38, 0.45); border-radius: 9999px;"></div>
              <div style="
                width: 20px;
                height: 20px;
                background-color: #DC2626;
                border: 2px solid ${isSelected ? "#0F172A" : "#FFFFFF"};
                box-shadow: 0 2px 8px rgba(220, 38, 38, 0.6);
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <span style="width: 6px; height: 6px; background-color: #FFFFFF;"></span>
              </div>
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        const marker = L.marker(inc.coordinates, { icon: fireIcon }).addTo(markersLayer);

        marker.on("click", () => {
          onSelectIncident?.(inc.id);
        });

        marker.bindPopup(`
          <div style="font-family: monospace; font-size: 11px;">
            <p style="font-weight: bold; color: #DC2626; margin: 0 0 4px 0;">TITIK API AKTIF</p>
            <p style="font-weight: bold; color: #0F172A; margin: 0 0 2px 0;">${inc.name}</p>
            <p style="margin: 0; color: #475569;">STATUS: ${inc.status}</p>
            <p style="margin: 2px 0 0 0; color: #059669; font-weight: bold;">${inc.reportersCount} LAPORAN TERVERIFIKASI</p>
          </div>
        `);

        if (isSelected) {
          marker.openPopup();
        }
      });
    });
  }, [
    isMapReady,
    incidents,
    filteredSources,
    activeBarricades,
    selectedIncidentId,
    skmTideLevelMeters,
    isHighTide,
    onSelectIncident,
  ]);

  return (
    <div
      data-testid="tactical-map-canvas"
      className={`relative w-full h-full min-h-[500px] bg-[#E2E8F0] border border-[#CBD5E1] overflow-hidden flex flex-col ${className}`}
    >
      {/* HUD Bar Atas Peta */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-3 bg-[#FFFFFF]/95 backdrop-blur-md border border-[#CBD5E1] p-3 shadow-sm select-none">
        <div>
          <p className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase">
            PETA TAKTIS OPENSTREETMAP SAMARINDA • WGS 84
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="w-2.5 h-2.5 bg-red-600 inline-block" />
            <span className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider">
              {incidents.length} INSIDEN KEBAKARAN AKTIF
            </span>
          </div>
        </div>

        {/* Kontrol Layer: Basemap Switcher & Filter Sumber Air */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          {/* Pemilih Tipe Lapisan OpenStreetMap */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-500 uppercase mr-1">PETA:</span>
            <button
              type="button"
              onClick={() => setBaseMap("OSM_STANDARD")}
              className={`px-2 py-1 text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer border ${
                baseMap === "OSM_STANDARD"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
              }`}
            >
              OSM STANDAR
            </button>
            <button
              type="button"
              onClick={() => setBaseMap("OSM_HOT")}
              className={`px-2 py-1 text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer border ${
                baseMap === "OSM_HOT"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
              }`}
            >
              OSM HUMANITARIAN
            </button>
            <button
              type="button"
              onClick={() => setBaseMap("CARTO_LIGHT")}
              className={`px-2 py-1 text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer border ${
                baseMap === "CARTO_LIGHT"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
              }`}
            >
              MINIMALIS
            </button>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          {/* Filter Status Sumber Air */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-500 uppercase mr-1">FILTER AIR:</span>
            {(["ALL", "READY", "LOW", "EMPTY"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setActiveFilter(mode)}
                className={`px-2 py-1 text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer border ${
                  activeFilter === mode
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Kontainer Peta Riil Leaflet OpenStreetMap */}
      <div ref={mapContainerRef} className="w-full h-full flex-1 z-0" />

      {/* Footer Status Bar Bawah */}
      <div className="z-[1000] bg-[#FFFFFF] border-t border-[#CBD5E1] px-4 py-2 flex items-center justify-between text-[11px] font-mono text-slate-600 select-none">
        <div>
          KOORDINAT POSKO: <span className="text-slate-900 font-bold tabular-nums">-0.5021° S, 117.1536° E</span>
          <span className="text-slate-400 ml-2">| TILE: {baseMap}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-emerald-700 font-bold">● {waterSources.filter(s => s.status === "READY").length} READY</span>
          <span className="text-amber-700 font-bold">● {waterSources.filter(s => s.status === "LOW_DISCHARGE").length} LOW</span>
          <span className="text-slate-600 font-bold">● {waterSources.filter(s => s.status === "EMPTY").length} EMPTY</span>
          <span className="text-fuchsia-700 font-bold">● {activeBarricades.length} BARIKADE SELANG</span>
        </div>
      </div>
    </div>
  );
};
