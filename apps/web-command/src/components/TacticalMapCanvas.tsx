"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  DEFAULT_SAMARINDA_WATER_SOURCES,
  type WaterSourcePoint,
  type ActiveIncidentMarker,
} from "../lib/water-sources";
import type { ActiveBarricadeItem } from "../lib/tactical-units";

export { DEFAULT_SAMARINDA_WATER_SOURCES, type WaterSourcePoint, type ActiveIncidentMarker };

export interface DispatchedFleetRoute {
  active: boolean;
  unitCallSign: string;
  origin: [number, number];
  destination: [number, number];
  destinationName: string;
  etaMinutes?: number;
}

export interface TacticalMapCanvasProps {
  incidents?: ActiveIncidentMarker[];
  waterSources?: WaterSourcePoint[];
  barricades?: ActiveBarricadeItem[];
  skmTideLevelMeters?: number;
  isHighTide?: boolean;
  selectedIncidentId?: string | null;
  dispatchedRoute?: DispatchedFleetRoute | null;
  onSelectIncident?: (id: string) => void;
  className?: string;
}

export const TacticalMapCanvas: React.FC<TacticalMapCanvasProps> = ({
  incidents = [
    {
      id: "33333333-3333-3333-3333-333333333301",
      name: "Gg. 4 Jl. Pelita (Titik Api Aktif)",
      coordinates: [-0.4848, 117.1628], // Tepat di dalam lorong pemukiman padat Gang 4 Jl. Pelita
      status: "VERIFIED",
      reportersCount: 2,
    },
    {
      id: "33333333-3333-3333-3333-333333333302",
      name: "Gg. Madura Pasar Segiri (Siaga)",
      coordinates: [-0.4828, 117.1480], // Gang pemukiman padat di seberang barat Pasar Segiri
      status: "REPORTED",
      reportersCount: 1,
    },
  ],
  waterSources = DEFAULT_SAMARINDA_WATER_SOURCES,
  barricades = [
    {
      id: "barricade-01",
      roadName: "Mulut Jl. Pelita (Arteri) -> Gg. 4",
      feederCallSign: "UNIT TANGKI INDUK 05",
      hoseLengthMeters: 110,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ],
  skmTideLevelMeters = 1.8,
  isHighTide = true,
  selectedIncidentId = "33333333-3333-3333-3333-333333333301",
  dispatchedRoute = null,
  onSelectIncident,
  className = "",
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

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

  // Inisialisasi Leaflet Map murni dengan OpenStreetMap Standard
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    let isSubscribed = true;

    import("leaflet").then((L) => {
      if (!isSubscribed || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      // Default fokus pada insiden aktif pertama (Gg. 4 Jl. Pelita)
      const initialCenter: [number, number] = [-0.4848, 117.1628];

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 16,
        minZoom: 11,
        maxZoom: 19,
        zoomControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // OpenStreetMap Standard Tiles Resmi
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

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

  // Track target flyTo agar tidak memicu animasi berulang kali saat polling data setiap 4 detik
  const lastFlownTargetRef = useRef<string>("");

  // Responsif memindahkan tampilan peta (flyTo) hanya saat target insiden atau rute dispatch benar-benar berganti
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    let targetCoords: [number, number] | null = null;
    let targetKey = "";

    const hasActiveTarget =
      incidents.length > 0 &&
      incidents.some(
        (i) => i.status !== "RESOLVED" && i.status !== "FALSE_ALARM"
      );

    if (dispatchedRoute && dispatchedRoute.active && dispatchedRoute.destination && hasActiveTarget) {
      targetCoords = dispatchedRoute.destination;
      targetKey = `route:${targetCoords[0].toFixed(5)},${targetCoords[1].toFixed(5)}`;
    } else if (selectedIncidentId && hasActiveTarget) {
      const targetIncident = incidents.find((i) => i.id === selectedIncidentId);
      if (targetIncident && targetIncident.coordinates) {
        targetCoords = targetIncident.coordinates;
        targetKey = `incident:${selectedIncidentId}:${targetCoords[0].toFixed(5)},${targetCoords[1].toFixed(5)}`;
      }
    } else if (incidents.length === 0 && lastFlownTargetRef.current !== "standby:overview") {
      targetCoords = [-0.4890, 117.1580];
      targetKey = "standby:overview";
    }

    if (targetCoords && targetKey && targetKey !== lastFlownTargetRef.current) {
      lastFlownTargetRef.current = targetKey;
      mapInstanceRef.current.flyTo(targetCoords, targetKey === "standby:overview" ? 14 : 16, {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    }
  }, [
    selectedIncidentId,
    dispatchedRoute?.active,
    dispatchedRoute?.destination?.[0],
    dispatchedRoute?.destination?.[1],
    incidents,
  ]);

  // Render Marker, Polylines, Garis Barikade, dan Armada Meluncur
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !markersLayerRef.current) return;

    import("leaflet").then((L) => {
      const markersLayer = markersLayerRef.current;
      markersLayer.clearLayers();

      const hasActiveTarget =
        incidents.length > 0 &&
        incidents.some(
          (i) => i.status !== "RESOLVED" && i.status !== "FALSE_ALARM"
        );

      // Pastikan target rute benar-benar mengacu pada insiden aktif yang masih ada di antrean
      const targetMatchesActiveIncident =
        dispatchedRoute &&
        dispatchedRoute.active &&
        incidents.some(
          (inc) =>
            inc.status !== "RESOLVED" &&
            inc.status !== "FALSE_ALARM" &&
            inc.coordinates &&
            Math.hypot(
              inc.coordinates[0] - dispatchedRoute.destination[0],
              inc.coordinates[1] - dispatchedRoute.destination[1]
            ) < 0.005
        );

      // 1. Rute Gerak Armada Meluncur Menuju Lokasi Insiden (Jika Terverifikasi / Dispatch dan ada insiden aktif)
      if (targetMatchesActiveIncident && dispatchedRoute) {
        const routePoints: [number, number][] = [
          dispatchedRoute.origin,
          [
            (dispatchedRoute.origin[0] + dispatchedRoute.destination[0]) / 2,
            (dispatchedRoute.origin[1] + dispatchedRoute.destination[1]) / 2,
          ],
          dispatchedRoute.destination,
        ];

        const fleetLine = L.polyline(routePoints, {
          color: "#0284C7",
          weight: 4,
          opacity: 0.9,
          dashArray: "6, 8",
        }).addTo(markersLayer);

        fleetLine.bindPopup(`
          <div style="font-family: monospace; font-size: 11px;">
            <p style="font-weight: bold; color: #0284C7; margin: 0 0 2px 0;">JALUR DISPATCH ARMADA MELUNCUR</p>
            <p style="margin: 0; color: #0F172A; font-weight: bold;">${dispatchedRoute.unitCallSign}</p>
            <p style="margin: 2px 0; color: #475569;">SASARAN: ${dispatchedRoute.destinationName}</p>
            <p style="margin: 2px 0 0 0; color: #059669; font-weight: bold;">STATUS: MENUJU KE ARAH SANA (ETA 2.5M)</p>
          </div>
        `);

        // Ikon Armada Pemadam yang Meluncur
        const fleetIcon = L.divIcon({
          className: "custom-fleet-icon",
          html: `
            <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
              <div style="
                position: absolute;
                inset: 0;
                border-radius: 50%;
                border: 2px solid #0284C7;
                background-color: rgba(2, 132, 199, 0.3);
                animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
              "></div>
              <div style="
                width: 26px;
                height: 26px;
                border-radius: 50%;
                background-color: #0284C7;
                border: 2px solid #FFFFFF;
                box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                display: flex;
                align-items: center;
                justify-content: center;
                color: #FFFFFF;
              ">
                <svg style="width: 14px; height: 14px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <rect x="2" y="5" width="12" height="10" rx="1.5" />
                  <path d="M14 8h4.5l2.5 3.5V15h-7V8z" />
                  <circle cx="6" cy="17.5" r="2" />
                  <circle cx="17.5" cy="17.5" r="2" />
                </svg>
              </div>
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        const fleetMarker = L.marker(dispatchedRoute.origin, { icon: fleetIcon }).addTo(markersLayer);
        fleetMarker.bindPopup(`
          <div style="font-family: monospace; font-size: 11px;">
            <p style="font-weight: bold; color: #0284C7; margin: 0 0 2px 0;">ARMADA MELUNCUR KE SASARAN</p>
            <p style="margin: 0; color: #0F172A; font-weight: bold;">${dispatchedRoute.unitCallSign}</p>
            <p style="margin: 2px 0; color: #475569;">TUJUAN: ${dispatchedRoute.destinationName}</p>
            <p style="margin: 2px 0 0 0; color: #059669; font-weight: bold;">STATUS: BERGERAK CEPAT KE TITIK API</p>
          </div>
        `);
      }

      // 2. Garis Barikade Selang Relay Fuchsia (#C026D3) Terkalibrasi Jalan Nyata Mengikuti Titik Api
      const activeIncidentsExist =
        incidents.length > 0 &&
        incidents.some(
          (i) => i.status !== "RESOLVED" && i.status !== "FALSE_ALARM"
        );

      if (activeIncidentsExist && activeBarricades.length > 0) {
        activeBarricades.forEach((barricade) => {
          let targetCoords: [number, number] | null = barricade.targetCoords || null;
          let originCoords: [number, number] | null = barricade.originCoords || null;

          if (!targetCoords) {
            const matchedInc =
              (barricade.incidentId && incidents.find((i) => i.id === barricade.incidentId)) ||
              (selectedIncidentId && incidents.find((i) => i.id === selectedIncidentId)) ||
              incidents.find((i) => i.status !== "RESOLVED" && i.status !== "FALSE_ALARM");
            if (matchedInc && matchedInc.coordinates) {
              targetCoords = matchedInc.coordinates;
            }
          }

          if (targetCoords) {
            if (!originCoords) {
              originCoords = [targetCoords[0] + 0.0008, targetCoords[1] + 0.0010];
            }

            const barricadePoints: [number, number][] = [originCoords, targetCoords];

            const hoseLine = L.polyline(barricadePoints, {
              color: "#C026D3",
              weight: 5,
              opacity: 0.9,
              dashArray: "8, 6",
              lineCap: "square",
            }).addTo(markersLayer);

            hoseLine.bindPopup(`
              <div style="font-family: monospace; font-size: 11px;">
                <p style="font-weight: bold; color: #C026D3; margin: 0 0 4px 0;">BARIKADE SELANG RELAY JALAN</p>
                <p style="margin: 0; color: #0F172A; font-weight: bold;">${barricade.roadName}</p>
                <p style="margin: 2px 0 0 0; color: #475569;">DIBENTANGKAN: ${barricade.feederCallSign}</p>
                <p style="margin: 2px 0 0 0; color: #C026D3; font-weight: bold;">PANJANG: ${barricade.hoseLengthMeters} METER (TEKANAN 4.0 BAR)</p>
              </div>
            `);

            // Ikon Penanda Barikade / Penutupan Jalan di Mulut Gang
            const barricadeIcon = L.divIcon({
              className: "custom-barricade-icon",
              html: `
                <div style="
                  width: 26px;
                  height: 26px;
                  border-radius: 6px;
                  background-color: #C026D3;
                  border: 2px solid #FFFFFF;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: #FFFFFF;
                  font-size: 13px;
                  font-weight: bold;
                ">
                  ⛔
                </div>
              `,
              iconSize: [26, 26],
              iconAnchor: [13, 13],
            });

            L.marker(originCoords, { icon: barricadeIcon })
              .bindPopup(`
                <div style="font-family: monospace; font-size: 11px;">
                  <p style="font-weight: bold; color: #C026D3; margin: 0 0 2px 0;">TITIK PANGKAL PENUTUPAN JALAN</p>
                  <p style="margin: 0; color: #0F172A; font-weight: bold;">${barricade.roadName}</p>
                  <p style="margin: 2px 0; color: #475569;">Posisi Parkir Truk Feeder Suplai Air</p>
                </div>
              `)
              .addTo(markersLayer);
          }
        });
      }

      // 2. Titik-Titik Sumber Air (30 Hidran & Tandon Terkalibrasi ke Jalan Nyata - Circular Pins)
      filteredSources.forEach((ws) => {
        const isReady = ws.status === "READY";
        const isLow = ws.status === "LOW_DISCHARGE";
        const color = isReady ? "#059669" : isLow ? "#D97706" : "#64748B";

        const hydrantIcon = L.divIcon({
          className: "custom-hydrant-icon",
          html: `
            <div style="
              width: 14px;
              height: 14px;
              border-radius: 50%;
              background-color: ${color};
              border: 2.5px solid #FFFFFF;
              box-shadow: 0 2px 5px rgba(0,0,0,0.35);
              cursor: pointer;
            "></div>
          `,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        const marker = L.marker(ws.coordinates, { icon: hydrantIcon }).addTo(markersLayer);

        marker.bindPopup(`
          <div style="font-family: monospace; font-size: 11px;">
            <p style="font-weight: bold; color: #0F172A; margin: 0 0 2px 0;">${ws.name}</p>
            <p style="margin: 0; color: #64748B;">TIPE: ${ws.type} • DEBIT: ${ws.dischargeLitersPerMin} L/MIN</p>
            <p style="margin: 2px 0; color: #475569;">KOORDINAT: ${ws.coordinates[0].toFixed(4)}, ${ws.coordinates[1].toFixed(4)}</p>
            <p style="margin: 4px 0 0 0; font-weight: bold; color: ${color};">STATUS: ${ws.status}</p>
          </div>
        `);
      });

      // 3. Titik Api Insiden Aktif (Circular Pulsing Radar Beacon)
      incidents.forEach((inc) => {
        const isSelected = inc.id === selectedIncidentId;

        const fireIcon = L.divIcon({
          className: "custom-fire-icon",
          html: `
            <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
              <div style="
                position: absolute;
                inset: 0;
                border-radius: 50%;
                border: 2px solid #DC2626;
                background-color: rgba(220, 38, 38, 0.25);
                animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
              "></div>
              <div style="
                width: 22px;
                height: 22px;
                border-radius: 50%;
                background-color: #DC2626;
                border: 2.5px solid ${isSelected ? "#0F172A" : "#FFFFFF"};
                box-shadow: 0 2px 8px rgba(220, 38, 38, 0.6);
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <span style="width: 7px; height: 7px; border-radius: 50%; background-color: #FFFFFF; display: block;"></span>
              </div>
            </div>
          `,
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        });

        const marker = L.marker(inc.coordinates, { icon: fireIcon }).addTo(markersLayer);

        marker.on("click", () => {
          onSelectIncident?.(inc.id);
        });

        marker.bindPopup(`
          <div style="font-family: monospace; font-size: 11px;">
            <p style="font-weight: bold; color: #DC2626; margin: 0 0 4px 0;">TITIK API AKTIF</p>
            <p style="font-weight: bold; color: #0F172A; margin: 0 0 2px 0;">${inc.name}</p>
            <p style="margin: 0; color: #475569;">STATUS FSM: ${inc.status}</p>
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
    dispatchedRoute,
  ]);

  return (
    <div
      data-testid="tactical-map-canvas"
      className={`relative w-full h-full min-h-[460px] bg-[#E2E8F0] border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm ${className}`}
    >
      {/* Top Left Floating Indicator (Compact & Pill-Free) */}
      <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2.5 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl px-3.5 py-2 shadow-sm select-none">
        <span
          className={`w-2.5 h-2.5 rounded-full inline-block ${
            incidents.length > 0 ? "bg-red-600 animate-pulse" : "bg-emerald-500"
          }`}
        />
        <span className="text-xs font-mono font-bold text-slate-900 tracking-wider">
          {incidents.length > 0
            ? `${incidents.length} INSIDEN AKTIF`
            : "SIAGA HIJAU (0 INSIDEN)"}
        </span>
        <span className="text-slate-300">|</span>
        <span className="text-xs font-mono font-bold text-sky-700 tabular-nums">
          SKM {isHighTide ? "PASANG" : "SURUT"} (+{skmTideLevelMeters.toFixed(1)}M)
        </span>
      </div>

      {/* Top Right Filter Buttons (Compact & Pill-Free) */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl px-3 py-1.5 shadow-sm select-none">
        <span className="text-[10px] font-mono text-slate-500 uppercase mr-1">AIR:</span>
        {(["ALL", "READY", "LOW", "EMPTY"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setActiveFilter(mode)}
            className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer border rounded-lg ${
              activeFilter === mode
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Kontainer Peta Riil Leaflet OpenStreetMap */}
      <div ref={mapContainerRef} className="w-full h-full flex-1 z-0" />

      {/* Footer Status Bar Bawah */}
      <div className="z-[1000] bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 flex items-center justify-between text-[11px] font-mono text-slate-600 select-none">
        <div>
          SEKTOR: <span className="text-slate-900 font-bold">PELITA - CITRA NIAGA</span>
          <span className="text-slate-400 ml-2">| OPENSTREETMAP</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span className="text-emerald-700 font-bold">
            READY: {waterSources.filter((s) => s.status === "READY").length}
          </span>
          <span className="text-amber-700 font-bold">
            LOW: {waterSources.filter((s) => s.status === "LOW_DISCHARGE").length}
          </span>
          <span className="text-slate-600 font-bold">
            EMPTY: {waterSources.filter((s) => s.status === "EMPTY").length}
          </span>
          <span className="text-fuchsia-700 font-bold">
            BARIKADE: {activeBarricades.length}
          </span>
        </div>
      </div>
    </div>
  );
};
