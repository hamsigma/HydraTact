"use client";

import React, { useState, useEffect, useMemo } from "react";
import { TacticalSidebar, type SidebarTab } from "../components/TacticalSidebar";
import { TacticalMapCanvas, type DispatchedFleetRoute } from "../components/TacticalMapCanvas";
import {
  AutoSplitMatrixPanel,
  DEFAULT_TACTICAL_UNITS,
  DEFAULT_ACTIVE_BARRICADES,
  type ActiveBarricadeItem,
  type TacticalUnitMatrixItem,
} from "../components/AutoSplitMatrixPanel";
import { TelemetryStreamPanel } from "../components/TelemetryStreamPanel";
import { FSMControlPanel } from "../components/FSMControlPanel";
import {
  DEFAULT_INCIDENT_QUEUE,
  DEFAULT_TELEMETRY_STREAM,
  DEFAULT_RESOLVED_HISTORY,
  type IncidentQueueItem,
  type ResolvedIncidentHistoryItem,
  type TelemetryMutationItem,
} from "../lib/telemetry";
import {
  DEFAULT_SAMARINDA_WATER_SOURCES,
  findNearestWaterSources,
  evaluateTidalSuctionViability,
  type WaterSourcePoint,
} from "../lib/water-sources";
import { subscribeToIncidentRealtime } from "../lib/supabase-realtime";
import {
  fetchActiveIncidents,
  executeManualOverride,
  assignArmadaUnit,
} from "../services/incident-api";

export default function WebCommandDashboard() {
  const [activeTab, setActiveTab] = useState<SidebarTab>("COMMAND");
  const [incidentsQueue, setIncidentsQueue] = useState<IncidentQueueItem[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>("");
  const selectedIncidentIdRef = React.useRef(selectedIncidentId);
  useEffect(() => {
    selectedIncidentIdRef.current = selectedIncidentId;
  }, [selectedIncidentId]);
  const [incidentCoordinates, setIncidentCoordinates] = useState<Record<string, [number, number]>>({});
  const [isBackendLive, setIsBackendLive] = useState<boolean>(false);
  const [incidentStatus, setIncidentStatus] = useState<string>("SEMUA_SELESAI");
  const [units, setUnits] = useState<TacticalUnitMatrixItem[]>(DEFAULT_TACTICAL_UNITS);
  const [barricades, setBarricades] = useState<ActiveBarricadeItem[]>([]);
  const [telemetryStream, setTelemetryStream] = useState<TelemetryMutationItem[]>(DEFAULT_TELEMETRY_STREAM);
  const [waterSources, setWaterSources] = useState<WaterSourcePoint[]>(DEFAULT_SAMARINDA_WATER_SOURCES);

  // Status Filter & Pencarian Direktori Air
  const [waterFilterStatus, setWaterFilterStatus] = useState<"ALL" | "READY" | "LOW_DISCHARGE" | "EMPTY">("ALL");
  const [waterSearchQuery, setWaterSearchQuery] = useState<string>("");

  // Tab Filter Notification Center
  const [notificationFilterTab, setNotificationFilterTab] = useState<"TODAY" | "REPORTS" | "SYSTEM">("TODAY");

  // Riwayat Insiden yang Sudah Tuntas Dipadamkan & Diverifikasi Selesai
  const [resolvedHistory, setResolvedHistory] = useState<ResolvedIncidentHistoryItem[]>(DEFAULT_RESOLVED_HISTORY);
  const [incidentQueueTab, setIncidentQueueTab] = useState<"ACTIVE" | "HISTORY">("ACTIVE");
  const [completionNotes, setCompletionNotes] = useState<string>("");

  // Rute Pergerakan Armada Meluncur ke Titik Insiden Terverifikasi
  const [dispatchedFleetRoute, setDispatchedFleetRoute] = useState<DispatchedFleetRoute | null>(null);

  // Ref untuk melacak daftar ID insiden yang telah selesai / diarsipkan agar tidak bangkit kembali dalam interval polling
  const resolvedIdsRef = React.useRef<Set<string>>(
    new Set(DEFAULT_RESOLVED_HISTORY.map((h) => h.id))
  );

  // Inisialisasi daftar insiden selesai & pembersihan dummy dari localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("hydratact_resolved_ids");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            parsed.forEach((id: string) => resolvedIdsRef.current.add(id));
          }
        }
      } catch (e) {}
    }
  }, []);

  // 1. Sinkronisasi Antrean Insiden Aktif dari Backend API (PWA Citizen Ingestion)
  useEffect(() => {
    let isMounted = true;

    const loadIncidents = async () => {
      const result = await fetchActiveIncidents();
      if (!isMounted) return;

      setIsBackendLive(result.isLive);

      if (result.incidents.length > 0) {
        // Hanya masukkan insiden yang belum selesai / belum diarsipkan ke riwayat
        const resolvedIds = resolvedIdsRef.current;
        const activeOnly = result.incidents.filter(
          (inc) =>
            inc.status !== "RESOLVED" &&
            inc.status !== "FALSE_ALARM" &&
            !resolvedIds.has(inc.id)
        );
        setIncidentsQueue(activeOnly);

        // Jika seluruh insiden aktif telah tuntas / tidak ada titik api aktif
        if (activeOnly.length === 0) {
          setDispatchedFleetRoute(null);
          setBarricades([]);
          setSelectedIncidentId("");
          selectedIncidentIdRef.current = "";
          setIncidentStatus("SEMUA_SELESAI");
          return;
        }

        // Petakan koordinat untuk pemancar radar pada peta taktis
        const coordMap: Record<string, [number, number]> = {};
        activeOnly.forEach((inc) => {
          if (inc.coordinates && inc.coordinates.length >= 2) {
            coordMap[inc.id] = [inc.coordinates[0], inc.coordinates[1]];
          }
        });
        result.rawItems.forEach((raw) => {
          if (raw.coordinates && raw.coordinates.length >= 2 && !resolvedIds.has(raw.incident_id)) {
            coordMap[raw.incident_id] = [raw.coordinates[0], raw.coordinates[1]];
          }
        });
        setIncidentCoordinates((prev) => ({ ...prev, ...coordMap }));

        // Sinkronkan status insiden yang sedang difokuskan tanpa mereset pilihan pengguna
        const currentSelectedId = selectedIncidentIdRef.current;
        const currentSelected = activeOnly.find((i) => i.id === currentSelectedId);

        // Jika ada laporan darurat warga baru masuk (REPORTED) dan fokus belum ditentukan, arahkan radar langsung ke laporan tersebut
        const incoming = activeOnly.find((i) => i.status === "REPORTED");
        if (incoming && (!currentSelected || currentSelected.status === "RESOLVED")) {
          setSelectedIncidentId(incoming.id);
          selectedIncidentIdRef.current = incoming.id;
          setIncidentStatus(incoming.status);
        } else if (currentSelected) {
          setIncidentStatus(currentSelected.status);
          const coords = currentSelected.coordinates || coordMap[currentSelected.id] || [-0.4848, 117.1628];
          if (currentSelected.status === "VERIFIED" || currentSelected.status === "DISPATCHED") {
            setDispatchedFleetRoute((prev) => {
              if (
                prev?.active &&
                prev.destination[0] === coords[0] &&
                prev.destination[1] === coords[1]
              ) {
                return prev;
              }
              return {
                active: true,
                unitCallSign: "UNIT 01 CITRA NIAGA (FEEDER) & UNIT 04 PELITA (ATTACKER)",
                origin: [-0.4905, 117.1550],
                destination: coords,
                destinationName: currentSelected.locationName,
                etaMinutes: 2.5,
              };
            });
          }
        } else if (!currentSelectedId && activeOnly[0]) {
          // Hanya default jika belum ada insiden yang dipilih sama sekali
          const first = activeOnly[0];
          setSelectedIncidentId(first.id);
          selectedIncidentIdRef.current = first.id;
          setIncidentStatus(first.status);
          const coords = first.coordinates || coordMap[first.id] || [-0.4848, 117.1628];
          if (first.status === "VERIFIED" || first.status === "DISPATCHED") {
            setDispatchedFleetRoute({
              active: true,
              unitCallSign: "UNIT 01 CITRA NIAGA (FEEDER) & UNIT 04 PELITA (ATTACKER)",
              origin: [-0.4905, 117.1550],
              destination: coords,
              destinationName: first.locationName,
              etaMinutes: 2.5,
            });
          }
        }
      } else {
        setIncidentsQueue([]);
        setDispatchedFleetRoute(null);
        setBarricades([]);
        setSelectedIncidentId("");
        selectedIncidentIdRef.current = "";
        setIncidentStatus("SEMUA_SELESAI");
      }
    };

    loadIncidents();
    const intervalId = setInterval(loadIncidents, 4000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // Berlangganan Saluran Supabase Realtime CDC untuk insiden aktif
  useEffect(() => {
    const sub = subscribeToIncidentRealtime(selectedIncidentId, {
      onBarricadeChange: (payload) => {
        const row = payload.new;
        if (!row) return;

        setBarricades((prev) => {
          const index = prev.findIndex((b) => b.id === row.id);
          const newItem: ActiveBarricadeItem = {
            id: row.id,
            roadName: row.road_name,
            feederCallSign: "UNIT TANGKI INDUK 05",
            hoseLengthMeters: row.hose_length_meters || 100,
            isActive: row.is_active,
            createdAt: row.created_at,
          };

          if (index >= 0) {
            const next = [...prev];
            next[index] = newItem;
            return next;
          }
          return [...prev, newItem];
        });

        // Tambahkan ke stream telemetri
        setTelemetryStream((prev) => [
          {
            id: "mut-" + Date.now(),
            timestamp: new Date().toLocaleTimeString("id-ID", { hour12: false }),
            callSign: "UNIT TANGKI INDUK 05",
            actionType: "HOSE_DEPLOYED",
            description: `Barikade ${row.road_name} status: ${row.is_active ? "TERPASANG" : "DILEPAS"}`,
          }, 
          ...prev,
        ]);
      },
      onUnitChange: (payload) => {
        const row = payload.new;
        if (!row) return;

        setUnits((prev) =>
          prev.map((u) =>
            u.id === row.unit_id || u.callSign.includes(row.unit_id)
              ? {
                  ...u,
                  assignedRole: row.assigned_role,
                  targetPressureBar: row.target_pressure_bar ?? u.targetPressureBar,
                }
              : u
          )
        );
      },
      onIncidentUpdate: (payload) => {
        if (payload.new?.status) {
          const newStatus = payload.new.status;
          setIncidentStatus(newStatus);
          setIncidentsQueue((prev) =>
            prev.map((inc) => (inc.id === selectedIncidentId ? { ...inc, status: newStatus } : inc))
          );
          if (newStatus === "VERIFIED" || newStatus === "DISPATCHED") {
            const targetCoords = incidentCoordinates[selectedIncidentId] || [-0.4848, 117.1628];
            const inc = incidentsQueue.find((i) => i.id === selectedIncidentId);
            setDispatchedFleetRoute({
              active: true,
              unitCallSign: "UNIT 01 CITRA NIAGA (FEEDER) & UNIT 04 PELITA (ATTACKER)",
              origin: [-0.4905, 117.1550],
              destination: targetCoords,
              destinationName: inc ? inc.locationName : "Titik Api Terverifikasi",
              etaMinutes: 2.5,
            });
          }
        }
      },
    });

    return () => {
      sub.unsubscribe();
    };
  }, [selectedIncidentId, incidentsQueue, incidentCoordinates]);

  const handleSelectIncident = (incidentId: string) => {
    setSelectedIncidentId(incidentId);
    selectedIncidentIdRef.current = incidentId;
    const inc = incidentsQueue.find((i) => i.id === incidentId);
    if (inc) {
      setIncidentStatus(inc.status);
      if (inc.status === "VERIFIED" || inc.status === "DISPATCHED") {
        const coords = inc.coordinates || incidentCoordinates[incidentId] || [-0.4848, 117.1628];
        setDispatchedFleetRoute({
          active: true,
          unitCallSign: "UNIT 01 CITRA NIAGA (FEEDER) & UNIT 04 PELITA (ATTACKER)",
          origin: [-0.4905, 117.1550],
          destination: coords,
          destinationName: inc.locationName,
          etaMinutes: 2.5,
        });
      } else {
        setDispatchedFleetRoute(null);
      }
    }
  };

  // Membersihkan seluruh data dummy pelaporan dan menyetel posko ke kondisi Siaga Hijau murni
  const handleClearDummyData = () => {
    DEFAULT_INCIDENT_QUEUE.forEach((item) => resolvedIdsRef.current.add(item.id));
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("hydratact_dummy_cleared", "true");
        localStorage.setItem(
          "hydratact_resolved_ids",
          JSON.stringify(Array.from(resolvedIdsRef.current))
        );
      } catch (e) {}
    }
    setIncidentsQueue([]);
    setSelectedIncidentId("");
    selectedIncidentIdRef.current = "";
    setDispatchedFleetRoute(null);
    setBarricades([]);
    setIncidentStatus("SEMUA_SELESAI");
  };

  // Menstimulasikan panggilan darurat baru untuk pengujian fungsional posko
  const handleInjectSimulationIncident = () => {
    const simId = "sim-" + Date.now();
    const simIncident: IncidentQueueItem = {
      id: simId,
      locationName: "Gg. 4 Jl. Pelita, Samarinda Kota",
      coordinates: [-0.4848, 117.1628],
      status: "REPORTED",
      reportersCount: 2,
      consensusTarget: 2,
      clusterRadiusMeters: 100,
      reportedAt: new Date().toISOString(),
      elapsedMinutes: 1,
    };
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("hydratact_dummy_cleared");
      } catch (e) {}
    }
    setIncidentsQueue((prev) => [simIncident, ...prev]);
    setSelectedIncidentId(simId);
    selectedIncidentIdRef.current = simId;
    setIncidentCoordinates((prev) => ({ ...prev, [simId]: [-0.4848, 117.1628] }));
    setIncidentStatus("REPORTED");
  };

  const handleToggleBarricade = (barricadeId: string, currentActive: boolean) => {
    setBarricades((prev) =>
      prev.map((b) => (b.id === barricadeId ? { ...b, isActive: !currentActive } : b))
    );
  };

  const handleAdjustPressure = (unitId: string, newTargetBar: number) => {
    setUnits((prev) =>
      prev.map((u) => {
        if (u.id === unitId) {
          return {
            ...u,
            targetPressureBar: newTargetBar,
            waterPressureBar: newTargetBar === 0 ? 0 : +(newTargetBar * 0.95).toFixed(1),
          };
        }
        return u;
      })
    );
    setTelemetryStream((prev) => [
      {
        id: "mut-" + Date.now(),
        timestamp: new Date().toLocaleTimeString("id-ID", { hour12: false }),
        callSign: units.find((u) => u.id === unitId)?.callSign || "UNIT TAKTIS",
        actionType: "PRESSURE_REQUEST",
        description: `Target tekanan pompa disesuaikan ke ${newTargetBar.toFixed(1)} Bar (${newTargetBar === 0 ? "EMERGENCY CUT-OFF" : "OPERASIONAL SIAGA"}).`,
      },
      ...prev,
    ]);
  };

  // Verifikasi Pemadaman Selesai: Titik api padam total, titik menghilang dari radar taktis & masuk ke riwayat
  const handleVerifyCompletion = async (incidentIdToResolve?: string) => {
    const targetId = incidentIdToResolve || selectedIncidentId;
    const targetIncident = incidentsQueue.find((i) => i.id === targetId) || activeIncident;
    if (!targetIncident) return;

    const note =
      completionNotes.trim() ||
      "Pemadaman tuntas terverifikasi komandan posko. Situasi aman terkendali, pendinginan bara selesai.";
    const targetCoords = targetIncident.coordinates || incidentCoordinates[targetId] || [-0.4848, 117.1628];
    const nowTimeStr =
      new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WITA";

    const historyItem: ResolvedIncidentHistoryItem = {
      id: targetIncident.id,
      incidentCode: `HT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      locationName: targetIncident.locationName,
      status: "RESOLVED",
      reportersCount: targetIncident.reportersCount,
      reportedAt: targetIncident.reportedAt,
      resolvedAt: nowTimeStr,
      durationMinutes: targetIncident.elapsedMinutes || 15,
      operatorNotes: note,
      unitsInvolved: "UNIT 01 CITRA NIAGA & UNIT 04 PELITA",
      coordinates: targetCoords,
    };

    // 1. Masukkan ke riwayat selesai & catat ID agar tidak pernah dibangkitkan kembali
    setResolvedHistory((prev) => [historyItem, ...prev]);
    resolvedIdsRef.current.add(targetId);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "hydratact_resolved_ids",
          JSON.stringify(Array.from(resolvedIdsRef.current))
        );
      } catch (e) {}
    }

    // 2. Hapus titik dari antrean aktif (otomatis menghilang dari peta radar)
    const remaining = incidentsQueue.filter((i) => i.id !== targetId);
    setIncidentsQueue(remaining);

    // 3. Matikan jalur armada meluncur jika seluruh insiden tuntas ATAU menuju ke insiden ini
    if (remaining.length === 0) {
      setDispatchedFleetRoute(null);
      setBarricades([]);
    } else if (
      dispatchedFleetRoute &&
      (Math.hypot(
        dispatchedFleetRoute.destination[0] - targetCoords[0],
        dispatchedFleetRoute.destination[1] - targetCoords[1]
      ) < 0.001 ||
        dispatchedFleetRoute.destinationName.includes(targetIncident.locationName))
    ) {
      setDispatchedFleetRoute(null);
    }

    // 4. Bersihkan field input catatan verifikasi
    setCompletionNotes("");

    // 5. Pindahkan pilihan insiden aktif jika yang selesai adalah yang sedang dipilih
    if (selectedIncidentId === targetId) {
      if (remaining.length > 0) {
        handleSelectIncident(remaining[0].id);
      } else {
        setSelectedIncidentId("");
        selectedIncidentIdRef.current = "";
        setIncidentStatus("SEMUA_SELESAI");
        setDispatchedFleetRoute(null);
      }
    }

    // 6. Alihkan tab antrean ke tab RIWAYAT agar pengguna langsung melihat insiden masuk riwayat
    setIncidentQueueTab("HISTORY");

    // 7. Catat ke stream mutasi telemetri
    setTelemetryStream((prev) => [
      {
        id: "mut-" + Date.now(),
        timestamp: new Date().toLocaleTimeString("id-ID", { hour12: false }),
        callSign: "KOMANDAN POSKO INDUK",
        actionType: "ROLE_REASSIGNED",
        description: `VERIFIKASI PEMADAMAN SELESAI: Titik api di ${targetIncident.locationName} padam total. Titik dinonaktifkan dari radar taktis dan diarsipkan ke riwayat posko. Catatan: ${note}`,
      },
      ...prev,
    ]);

    // 8. Kirim override FSM ke backend API
    await executeManualOverride(targetId, {
      targetStatus: "INCIDENT_CLOSED",
      overrideReason: "Verifikasi pemadaman tuntas selesai oleh operator posko komando",
      operatorNotes: note,
    });
  };

  const handleExecuteFSMTransition = async (
    targetStatus: string,
    isOverride?: boolean,
    incidentIdToTarget?: string
  ) => {
    const targetId = incidentIdToTarget || selectedIncidentId;
    if (targetStatus === "RESOLVED") {
      await handleVerifyCompletion(targetId);
      return;
    }

    const targetIncident = incidentsQueue.find((i) => i.id === targetId) || activeIncident;
    if (!targetIncident) return;
    const targetCoords = targetIncident.coordinates || incidentCoordinates[targetId] || [-0.4848, 117.1628];

    // 1. Pembaruan optimistik antarmuka posko
    setIncidentStatus(targetStatus);
    setSelectedIncidentId(targetId);
    selectedIncidentIdRef.current = targetId;
    setIncidentsQueue((prev) =>
      prev.map((inc) => (inc.id === targetId ? { ...inc, status: targetStatus as any } : inc))
    );

    // 2. Logika Armada Meluncur: Jika laporan diverifikasi atau didispatch, armada langsung menuju ke arah sana!
    if (targetStatus === "VERIFIED" || targetStatus === "DISPATCHED" || isOverride) {
      setDispatchedFleetRoute({
        active: true,
        unitCallSign: "UNIT 01 CITRA NIAGA (FEEDER) & UNIT 04 PELITA (ATTACKER)",
        origin: [-0.4905, 117.1550], // Posko Induk Damkar Citra Niaga
        destination: targetCoords,
        destinationName: targetIncident.locationName,
        etaMinutes: 2.5,
      });

      // Update unit status pada matriks armada
      setUnits((prev) =>
        prev.map((u, idx) => ({
          ...u,
          assignedRole: idx === 0 ? "FEEDER" : "ATTACKER",
        }))
      );
    } else {
      setDispatchedFleetRoute(null);
    }

    // 3. Hubungkan ke backend API
    if (isOverride) {
      await executeManualOverride(targetId, {
        targetStatus: "VERIFIED",
        overrideReason: "Verifikasi paksa posko komando. Armada pemadam langsung meluncur ke titik api.",
      });
    } else if (targetStatus === "DISPATCHED") {
      await assignArmadaUnit(targetId, {
        unitIdentifier: "UNIT 01 CITRA NIAGA",
        waterCapacityLiters: 4000,
        vehicleType: "LARGE_TANK",
        currentLocation: [targetCoords[1], targetCoords[0]],
      });
    }

    setTelemetryStream((prev) => [
      {
        id: "mut-" + Date.now(),
        timestamp: new Date().toLocaleTimeString("id-ID", { hour12: false }),
        callSign: "UNIT 01 CITRA NIAGA",
        actionType: "ROLE_REASSIGNED",
        description:
          targetStatus === "VERIFIED"
            ? `Laporan ${targetIncident.locationName} TERVERIFIKASI. Armada pemadam langsung meluncur menuju titik api (ETA 2.5m).`
            : `ARMADA DIKERAHKAN MENUJU ${targetIncident.locationName}.`,
      },
      ...prev,
    ]);
  };

  const activeIncident = incidentsQueue.find((i) => i.id === selectedIncidentId) || incidentsQueue[0] || null;

  // Sinkronisasi Barikade Selang Relay Dinamis Mengikuti Titik Api Sasaran
  useEffect(() => {
    if (!activeIncident || incidentsQueue.length === 0) {
      setBarricades([]);
      return;
    }

    const targetCoords: [number, number] =
      activeIncident.coordinates ||
      incidentCoordinates[activeIncident.id] ||
      [-0.4848, 117.1628];

    // Titik parkir feeder di mulut jalan arteri (~90m-120m dari titik api)
    const originCoords: [number, number] = [
      targetCoords[0] + 0.0008,
      targetCoords[1] + 0.0010,
    ];

    setBarricades((prev) => {
      const existing = prev.find(
        (b) =>
          b.incidentId === activeIncident.id ||
          b.id === `barricade-${activeIncident.id}`
      );

      // Barikade aktif secara otomatis jika status insiden sudah masuk fase penanganan
      const defaultActive =
        activeIncident.status === "VERIFIED" ||
        activeIncident.status === "DISPATCHED" ||
        activeIncident.status === "WATER_ON_FIRE";

      const isActive = existing !== undefined ? existing.isActive : defaultActive;

      const updatedItem: ActiveBarricadeItem = {
        id: `barricade-${activeIncident.id}`,
        incidentId: activeIncident.id,
        roadName: `Mulut Masuk Gang - ${activeIncident.locationName}`,
        feederCallSign: "UNIT TANGKI INDUK 05",
        hoseLengthMeters: 110,
        isActive,
        createdAt: existing?.createdAt || new Date().toISOString(),
        originCoords,
        targetCoords,
      };

      return [updatedItem];
    });
  }, [
    activeIncident?.id,
    activeIncident?.locationName,
    activeIncident?.status,
    incidentsQueue.length,
    incidentCoordinates,
  ]);

  // Petakan insiden aktif ke format marker koordinat canvas peta taktis
  const mappedIncidents = incidentsQueue
    .filter((item) => item.status !== "RESOLVED" && item.status !== "FALSE_ALARM")
    .map((item) => {
      const coords = item.coordinates || incidentCoordinates[item.id] || [-0.4848, 117.1628];
      return {
        id: item.id,
        name: item.locationName,
        coordinates: coords,
        status: item.status,
        reportersCount: item.reportersCount,
      };
    });

  // Filter Titik Air berdasarkan Status & Pencarian Nama
  const displayedWaterSources = waterSources.filter((ws) => {
    const matchesStatus =
      waterFilterStatus === "ALL" ? true : ws.status === waterFilterStatus;
    const matchesSearch =
      !waterSearchQuery.trim() ||
      ws.name.toLowerCase().includes(waterSearchQuery.toLowerCase()) ||
      ws.type.toLowerCase().includes(waterSearchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const currentIncidentCoords = activeIncident
    ? activeIncident.coordinates || incidentCoordinates[activeIncident.id] || [-0.4848, 117.1628]
    : [-0.4848, 117.1628];

  const topNearestWaterSources = useMemo(() => {
    return findNearestWaterSources(
      currentIncidentCoords[0],
      currentIncidentCoords[1],
      waterSources,
      3
    );
  }, [currentIncidentCoords, waterSources]);

  const tidalStatus = useMemo(() => evaluateTidalSuctionViability(), []);

  return (
    <div className="flex h-screen w-screen bg-[#F0F2F5] text-slate-900 font-sans overflow-hidden">
      {/* 1. Sidebar Navigasi Ramping Gelap (76px Dark Icon Rail) */}
      <TacticalSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeIncidentsCount={incidentsQueue.length}
        activeBarricadesCount={barricades.filter((b) => b.isActive).length}
      />

      {/* 2. Main Canvas Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-5">
        {/* Header Bersih Minimalis (Matching Reference Header) */}
        <header className="flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {activeTab === "COMMAND"
                ? "Overview"
                : activeTab === "UNITS"
                ? "Matriks Armada"
                : activeTab === "HYDRANTS"
                ? "Direktori Air"
                : "Log Telemetri"}
            </h1>
          </div>
        </header>

        {/* Tab 1: OVERVIEW & KOMANDO TAKTIS (BENTO GRID REFERENCE) */}
        {activeTab === "COMMAND" && (
          <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1">
            {/* Baris Atas Hero Bento: Peta Leaflet + 3 Kartu Status Pastel (Lingkaran) */}
            <div className="grid grid-cols-12 gap-5 shrink-0 min-h-[490px]">
              {/* Kiri: Kartu Hero Peta Leaflet Berukuran Besar (Span 8) */}
              <div className="col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 flex flex-col overflow-hidden h-[490px]">
                <div className="flex items-center justify-between mb-2.5 shrink-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full inline-block ${
                        activeIncident ? "bg-red-600 animate-pulse" : "bg-emerald-500"
                      }`}
                    />
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 tracking-tight uppercase">
                        {activeIncident
                          ? `Peta Sektor Pelita (${activeIncident.locationName})`
                          : "Peta Sektor Samarinda (Kondisi Siaga Hijau)"}
                      </h2>
                      <p className="text-[11px] font-mono text-slate-500">
                        {activeIncident
                          ? `${activeIncident.locationName} • Koordinat ${(
                              incidentCoordinates[activeIncident.id] || [-0.4848, 117.1628]
                            ).join(", ")}`
                          : "Nihil titik kebakaran aktif • Seluruh laporan tuntas dipadamkan"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-mono font-bold">
                    <span className="text-emerald-700 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
                      OSM STANDARD
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-fuchsia-700 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-600 inline-block" />
                      {barricades.filter((b) => b.isActive).length} BARIKADE SELANG
                    </span>
                  </div>
                </div>

                {/* Leaflet Map Canvas */}
                <div className="flex-1 min-h-0 relative rounded-xl overflow-hidden border border-slate-100">
                  <TacticalMapCanvas
                    selectedIncidentId={selectedIncidentId}
                    onSelectIncident={handleSelectIncident}
                    incidents={mappedIncidents}
                    dispatchedRoute={dispatchedFleetRoute}
                    barricades={barricades}
                    waterSources={displayedWaterSources}
                    className="w-full h-full"
                  />
                </div>
              </div>

              {/* Kanan: 3 Kartu Status Pastel Vertikal dengan Ikon Lingkaran (Span 4) */}
              <div className="col-span-4 flex flex-col justify-between h-[490px]">
                <div className="flex items-center justify-between mb-2 shrink-0">
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight uppercase flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-900 inline-block" />
                    Telemetri Sektor
                  </h3>
                  <span className="text-xs font-mono text-slate-500 flex items-center gap-1.5 cursor-pointer hover:text-slate-900">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    CDC LIVE
                  </span>
                </div>

                <div className="flex flex-col gap-2.5 flex-1 justify-between min-h-0">
                  {/* Kartu Pastel 1: Soft Lavender (Armada Taktis) */}
                  <div className="bg-[#F3E8FF] rounded-2xl p-3 border border-[#E9D5FF] flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-200/80 text-purple-900 flex items-center justify-center font-bold text-sm shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-bold text-purple-700 tracking-wider uppercase block">
                          ARMADA TAKTIS
                        </span>
                        <p className="text-sm font-bold font-mono text-purple-950 mt-0.5 tabular-nums">
                          {units.length} Unit ({units.filter((u) => u.assignedRole === "ATTACKER").length} ATK • {units.filter((u) => u.assignedRole === "FEEDER").length} FDR)
                        </p>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-[10px] text-purple-600 block">TEKANAN</span>
                      <span className="text-xs text-purple-950 font-bold tabular-nums">4.0 Bar</span>
                    </div>
                  </div>

                  {/* Kartu Pastel 2: Soft Mint (Logistik Air Siaga) */}
                  <div className="bg-[#ECFDF5] rounded-2xl p-3 border border-[#A7F3D0] flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-200/80 text-emerald-900 flex items-center justify-center font-bold text-sm shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-bold text-emerald-700 tracking-wider uppercase block">
                          LOGISTIK AIR
                        </span>
                        <p className="text-sm font-bold font-mono text-emerald-950 mt-0.5 tabular-nums">
                          {waterSources.length} Titik ({waterSources.filter((s) => s.status === "READY").length} Siaga • {waterSources.filter((s) => s.status === "LOW_DISCHARGE").length} Low)
                        </p>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-[10px] text-emerald-600 block">CAKUPAN</span>
                      <span className="text-xs text-emerald-950 font-bold tabular-nums">100% GIS</span>
                    </div>
                  </div>

                  {/* Kartu Pastel 3: Soft Amber (Sungai Karang Mumus) */}
                  <div className="bg-[#FFFBEB] rounded-2xl p-3 border border-[#FDE68A] flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-200/80 text-amber-900 flex items-center justify-center font-bold text-sm shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-bold text-amber-700 tracking-wider uppercase block">
                          SUNGAI SKM ({tidalStatus.tidalPhase})
                        </span>
                        <p className="text-sm font-bold font-mono text-amber-950 mt-0.5 tabular-nums">
                          {tidalStatus.waterElevationMeters >= 0 ? "+" : ""}{tidalStatus.waterElevationMeters.toFixed(2)} M ({tidalStatus.isViable ? "Siaga Hisap" : "Surut Kritis"})
                        </p>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-[10px] text-amber-600 block">STATUS</span>
                      <span className={`text-xs font-bold uppercase ${tidalStatus.isViable ? "text-amber-950" : "text-rose-700"}`}>
                        {tidalStatus.isViable ? "OPTIMAL" : "ALIHKAN"}
                      </span>
                    </div>
                  </div>

                  {/* Sub-banner: Status Gang & Auto-Split */}
                  <div className="bg-white rounded-xl px-3 py-2 border border-slate-200/80 shadow-xs flex items-center justify-between text-xs font-mono">
                    <span className="font-semibold text-slate-700">LEBAR GANG 2.1M (&lt; 2.5M)</span>
                    <span className="text-amber-700 font-bold uppercase">AUTO-SPLIT AKTIF</span>
                  </div>

                  {/* Rekomendasi 3 Titik Air Terdekat (Haversine Sorting) */}
                  <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-xs font-mono text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                        PASOKAN AIR TERDEKAT (TOP 3)
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold">
                        HAVERSINE ETA
                      </span>
                    </div>
                    <div className="space-y-1">
                      {topNearestWaterSources.map((ws, idx) => (
                        <div key={ws.id} className="flex items-center justify-between text-[11px] px-2 py-1 bg-slate-50 border border-slate-100 rounded">
                          <div className="truncate mr-2">
                            <span className="font-bold text-slate-900">{idx + 1}. {ws.name}</span>
                            <span className="text-slate-500 block text-[10px]">{ws.type} • {ws.dischargeLitersPerMin} L/min</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-bold text-emerald-800 block tabular-nums">{ws.distanceMeters.toFixed(0)}m</span>
                            <span className="text-[10px] text-slate-500 tabular-nums">~{ws.estimatedTravelMinutes} mnt</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Baris Bawah: Tabel Antrean Insiden & Kartu Gelap Kontras (Matching Bottom Row) */}
            <div className="grid grid-cols-12 gap-5 shrink-0 min-h-[400px]">
              {/* Kiri: Tabel Antrean Insiden & Riwayat Selesai (Span 7) */}
              <div className="col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col overflow-hidden min-h-[400px]">
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    {/* Segmented Control: Antrean Aktif vs Riwayat Selesai (Bukan Pill/Oval Badge) */}
                    <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-mono">
                      <button
                        type="button"
                        onClick={() => setIncidentQueueTab("ACTIVE")}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          incidentQueueTab === "ACTIVE"
                            ? "bg-white text-slate-900 shadow-xs"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-red-600 inline-block animate-pulse" />
                        AKTIF ({incidentsQueue.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setIncidentQueueTab("HISTORY")}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          incidentQueueTab === "HISTORY"
                            ? "bg-white text-slate-900 shadow-xs"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                        RIWAYAT SELESAI ({resolvedHistory.length})
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                    {incidentQueueTab === "ACTIVE" ? (
                      <>
                        <span>RADIUS KONSENSUS: 100M</span>
                        {incidentsQueue.length > 0 && (
                          <button
                            type="button"
                            onClick={handleClearDummyData}
                            className="text-[10px] font-bold text-slate-600 hover:text-red-700 bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg px-2 py-0.5 transition-colors cursor-pointer"
                          >
                            BERSIHKAN DATA DUMMY
                          </button>
                        )}
                      </>
                    ) : (
                      "ARSIP OPERASI PEMADAMAN"
                    )}
                  </div>
                </div>

                {/* List Insiden / Riwayat Selesai */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {incidentQueueTab === "ACTIVE" ? (
                    incidentsQueue.length === 0 ? (
                      <div className="p-8 text-center border border-dashed border-emerald-200 rounded-xl bg-emerald-50/40 text-emerald-950 font-mono text-xs">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-2 font-bold text-sm">
                          ✓
                        </div>
                        <p className="font-bold text-sm">Semua Titik Api Berhasil Dipadamkan</p>
                        <p className="text-slate-500 mt-1">
                          Sektor dalam kondisi siaga hijau. Tidak ada antrean insiden aktif saat ini.
                        </p>
                        <div className="mt-3.5 flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={handleInjectSimulationIncident}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
                          >
                            + SIMULASIKAN LAPORAN DARURAT
                          </button>
                        </div>
                      </div>
                    ) : (
                      incidentsQueue.map((item) => {
                        const isSelected = item.id === selectedIncidentId;
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleSelectIncident(item.id)}
                            className={`p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                              isSelected
                                ? "bg-slate-50 border-red-500 shadow-xs"
                                : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                            }`}
                          >
                            <div className="flex items-center gap-3.5">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs font-mono shadow-xs ${
                                  item.status === "VERIFIED"
                                    ? "bg-red-600 text-white"
                                    : "bg-slate-900 text-white"
                                }`}
                              >
                                {item.status === "VERIFIED" ? "API" : "LAP"}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-slate-900">
                                    {item.locationName}
                                  </span>
                                  <span
                                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border flex items-center ${
                                      item.status === "VERIFIED"
                                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                        : "bg-amber-50 text-amber-800 border-amber-200"
                                    }`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full inline-block mr-1.5 ${
                                        item.status === "VERIFIED" ? "bg-emerald-600" : "bg-amber-600"
                                      }`}
                                    />
                                    {item.status}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 font-mono mt-0.5">
                                  Konsensus: {item.reportersCount}/{item.consensusTarget} Pelapor • Sektor Samarinda
                                </p>
                              </div>
                            </div>

                            <div className="text-right font-mono text-xs">
                              <span className="text-slate-400 block text-[11px]">
                                {item.elapsedMinutes}M LALU
                              </span>
                              <span
                                className={`font-bold ${
                                  isSelected ? "text-red-600" : "text-slate-600"
                                }`}
                              >
                                {isSelected ? "[ FOKUS AKTIF ]" : "PILIH INSIDEN"}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )
                  ) : (
                    /* Tampilan Riwayat Selesai */
                    resolvedHistory.map((hist) => (
                      <div
                        key={hist.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/60 transition-all flex flex-col gap-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                              PADAM
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-900">
                                  {hist.locationName}
                                </span>
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border bg-emerald-50 text-emerald-800 border-emerald-200 flex items-center">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block mr-1.5" />
                                  SELESAI & PADAM
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                Selesai: {hist.resolvedAt} • Durasi: {hist.durationMinutes}m • {hist.reportersCount} Pelapor • {hist.incidentCode}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                            TERARSIP
                          </span>
                        </div>

                        {/* Catatan Verifikasi Pemadaman Komandan */}
                        <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-mono text-slate-700">
                          <span className="font-bold text-slate-900 block mb-0.5 text-[10px] uppercase tracking-wider text-slate-500">
                            Catatan Verifikasi Komandan Jaga:
                          </span>
                          &quot;{hist.operatorNotes}&quot;
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Kanan: Notification Center Card (Span 5 - Matching d:\Download\Notification center.jpg) */}
              {(() => {
                const incomingReport = incidentsQueue.find((i) => i.status === "REPORTED");
                const hasIncoming = Boolean(incomingReport);

                const displayedList =
                  notificationFilterTab === "REPORTS"
                    ? incidentsQueue.filter((i) => i.status === "REPORTED" || i.status === "VERIFIED")
                    : incidentsQueue;

                return (
                  <div className="col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between overflow-hidden min-h-[400px]">
                    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                      {/* Top Header: Title & Action (Matching AI Notification Center & See All) */}
                      <div className="flex items-center justify-between mb-3 shrink-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900 tracking-tight">
                            Pusat Notifikasi Posko
                          </h3>
                          {hasIncoming && (
                            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping inline-block" />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (incomingReport) {
                              handleSelectIncident(incomingReport.id);
                            }
                          }}
                          className="text-xs font-mono font-medium text-slate-500 hover:text-slate-900 border border-slate-200/80 rounded-xl px-2.5 py-1 cursor-pointer transition-colors"
                        >
                          Lihat Semua
                        </button>
                      </div>

                      {/* Segmented Control: Hari Ini / Laporan Warga / Log Sistem */}
                      <div className="bg-slate-100/90 p-1 rounded-xl flex items-center gap-1 mb-3 text-xs font-mono shrink-0">
                        <button
                          type="button"
                          onClick={() => setNotificationFilterTab("TODAY")}
                          className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer text-center ${
                            notificationFilterTab === "TODAY"
                              ? "bg-white text-slate-900 shadow-xs"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          Hari Ini
                        </button>
                        <button
                          type="button"
                          onClick={() => setNotificationFilterTab("REPORTS")}
                          className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                            notificationFilterTab === "REPORTS"
                              ? "bg-white text-slate-900 shadow-xs"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          Laporan Warga
                          {hasIncoming && (
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600 inline-block" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setNotificationFilterTab("SYSTEM")}
                          className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer text-center ${
                            notificationFilterTab === "SYSTEM"
                              ? "bg-white text-slate-900 shadow-xs"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          Sistem
                        </button>
                      </div>

                      {/* Notification List Items (Row Structure with Circular Avatars & Direct Action) */}
                      <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
                        {notificationFilterTab === "SYSTEM" ? (
                          <div className="space-y-2 text-xs font-mono">
                            <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/70">
                              <div className="flex items-start justify-between">
                                <p className="font-bold text-slate-900">Elevasi Pasang Surut Mahakam (SKM)</p>
                                <span className="font-bold text-emerald-700">1.80m • SIAGA HIJAU</span>
                              </div>
                              <p className="text-[11px] text-slate-600 mt-1">Dermaga hisap sedot apung aktif siap memasok armada tangki.</p>
                            </div>
                            <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/70">
                              <div className="flex items-start justify-between">
                                <p className="font-bold text-slate-900">Barikade Selang Relay Melintasi Jalan</p>
                                <span className="font-bold text-fuchsia-700">110M AKTIF</span>
                              </div>
                              <p className="text-[11px] text-slate-600 mt-1">Jalur selang dari sumber air terbuka melintasi aspal menuju gang sempit terpasang rapi.</p>
                            </div>
                          </div>
                        ) : displayedList.length === 0 ? (
                          /* Tampilan Jika Seluruh Titik Api Padam */
                          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-start gap-3">
                            <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-emerald-900">Seluruh Titik Api Berhasil Dipadamkan</p>
                              <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                                Posko dalam kondisi siaga hijau. Seluruh laporan telah diverifikasi selesai dan diarsipkan ke tab Riwayat Selesai.
                              </p>
                            </div>
                          </div>
                        ) : (
                          displayedList.map((incident) => {
                            const isIncoming = incident.status === "REPORTED";
                            const isSelected = incident.id === selectedIncidentId;
                            return (
                              <div
                                key={incident.id}
                                onClick={() => handleSelectIncident(incident.id)}
                                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                                  isIncoming
                                    ? "bg-red-50/80 border-red-300 shadow-xs"
                                    : isSelected
                                    ? "bg-slate-50 border-sky-400 shadow-xs"
                                    : "bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/60"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  {/* Circular Icon Avatar */}
                                  <div
                                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${
                                      isIncoming
                                        ? "bg-red-100 border-red-300 text-red-600"
                                        : "bg-white border-slate-200 text-slate-700"
                                    }`}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1">
                                      <p className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                                        <span className={`w-2 h-2 rounded-full inline-block shrink-0 ${isIncoming ? "bg-red-600 animate-pulse" : "bg-emerald-600"}`} />
                                        {isIncoming ? "Panggilan Darurat Masuk" : "Laporan Terverifikasi"}
                                      </p>
                                      <span className="text-[11px] font-mono text-slate-400 shrink-0">
                                        {incident.elapsedMinutes}m lalu
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed line-clamp-2">
                                      {incident.locationName} • {incident.reportersCount}/{incident.consensusTarget} Pelapor
                                    </p>

                                    {/* Tombol Aksi Taktis Cepat Jika Status REPORTED */}
                                    {isIncoming && (
                                      <div className="mt-2.5 flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleExecuteFSMTransition("VERIFIED", true, incident.id);
                                          }}
                                          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
                                        >
                                          VERIFIKASI & LUNCURKAN ARMADA
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleExecuteFSMTransition("DISPATCHED", false, incident.id);
                                          }}
                                          className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
                                        >
                                          DISPATCH
                                        </button>
                                      </div>
                                    )}

                                    {/* Field Catatan & Tombol Verifikasi Pemadaman Selesai */}
                                    <div className="mt-2.5 pt-2 border-t border-slate-200/80 space-y-1.5">
                                      <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block">
                                        Verifikasi Pemadaman Selesai:
                                      </label>
                                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                        <input
                                          type="text"
                                          value={completionNotes}
                                          onChange={(e) => setCompletionNotes(e.target.value)}
                                          placeholder="Catatan verifikasi (misal: Api padam total, nihil korban)..."
                                          className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 select-text cursor-text pointer-events-auto relative z-10"
                                        />
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleVerifyCompletion(incident.id);
                                          }}
                                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95 shadow-xs whitespace-nowrap pointer-events-auto relative z-10"
                                        >
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                          </svg>
                                          VERIFIKASI SELESAI
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}

                        {/* Item 2: Barikade Selang Relay 110m (Muncul pada tab TODAY jika ada barikade aktif) */}
                        {notificationFilterTab === "TODAY" && barricades.some((b) => b.isActive) && (
                          <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/40 flex items-start gap-3">
                            <div className="w-9 h-9 rounded-full bg-fuchsia-50 border border-fuchsia-200 text-fuchsia-600 flex items-center justify-center shrink-0">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                                  <span className={`w-2 h-2 rounded-full inline-block shrink-0 ${barricades[0].isActive ? "bg-fuchsia-600" : "bg-slate-400"}`} />
                                  Barikade Selang Relay 110m
                                </p>
                                <span className="text-[11px] font-mono text-slate-400 shrink-0">8m lalu</span>
                              </div>
                              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed line-clamp-1">
                                {barricades[0].roadName}
                              </p>
                              <div className="mt-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleBarricade(barricades[0].id, barricades[0].isActive)}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer border ${
                                    barricades[0].isActive
                                      ? "bg-fuchsia-600 text-white border-fuchsia-600 shadow-xs"
                                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                  }`}
                                >
                                  {barricades[0].isActive ? "TERPASANG (LEPAS)" : "AKTIFKAN BARIKADE"}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Item 3: Logistik Air & Ketinggian Sungai Karang Mumus (Muncul pada tab TODAY) */}
                        {notificationFilterTab === "TODAY" && (
                          <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/40 flex items-start gap-3">
                            <div className="w-9 h-9 rounded-full bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center shrink-0">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.5C12 2.5 5.5 10 5.5 15C5.5 18.59 8.41 21.5 12 21.5C15.59 21.5 18.5 18.59 18.5 15C18.5 10 12 2.5 12 2.5Z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block shrink-0" />
                                  Sungai Karang Mumus
                                </p>
                                <span className="text-[11px] font-mono text-slate-400 shrink-0">15m lalu</span>
                              </div>
                              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                                Status Pasang (+1.8m) • Dermaga sedot apung siap suplai tanpa batas.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Tab 2: MATRIKS ARMADA (Fleet Management Focus View) */}
        {activeTab === "UNITS" && (
          <div className="flex-1 p-2 overflow-y-auto">
            <div className="max-w-6xl mx-auto space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
                <div>
                  <p className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase mb-1">
                    MANAJEMEN ARMADA PEMADAM
                  </p>
                  <h2 className="text-lg font-bold text-slate-900 uppercase">
                    ALOKASI TAKTIS ARMADA ATTACKER & FEEDER KOTA SAMARINDA
                  </h2>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <div className="bg-sky-50 border border-sky-200 px-3 py-1 text-sky-800 font-bold rounded-lg">
                    ATTACKER: {units.filter((u) => u.assignedRole === "ATTACKER").length} UNIT
                  </div>
                  <div className="bg-amber-50 border border-amber-200 px-3 py-1 text-amber-800 font-bold rounded-lg">
                    FEEDER: {units.filter((u) => u.assignedRole === "FEEDER").length} UNIT
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
                  <AutoSplitMatrixPanel
                    gangWidthMeters={2.1}
                    units={units}
                    barricades={barricades}
                    onToggleBarricade={handleToggleBarricade}
                    onAdjustPressure={handleAdjustPressure}
                  />
                </div>

                <div className="space-y-5">
                  <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs font-mono text-xs">
                    <p className="text-xs font-bold tracking-widest text-slate-500 uppercase border-b border-slate-200 pb-2 mb-3">
                      ATURAN TAKTIS GANG SEMPIT SAMARINDA
                    </p>
                    <div className="space-y-3 text-slate-700 leading-relaxed">
                      <div className="p-3 bg-sky-50/50 border-l-2 border-sky-600 rounded-r-lg">
                        <span className="font-bold text-sky-900 block mb-0.5">1. UNIT ATTACKER (&lt; 1000L)</span>
                        Berbobot ringan. Menembus gang sempit selebar &lt; 2.5 meter langsung ke titik semprot terdekat.
                      </div>
                      <div className="p-3 bg-amber-50/50 border-l-2 border-amber-600 rounded-r-lg">
                        <span className="font-bold text-amber-900 block mb-0.5">2. UNIT FEEDER (&ge; 3000L)</span>
                        Dilarang masuk ke dalam gang. Parkir terkunci di jalan raya arteri (&ge; 6m) untuk memompa selang relay stabil 4.0 Bar.
                      </div>
                      <div className="p-3 bg-fuchsia-50/50 border-l-2 border-fuchsia-600 rounded-r-lg">
                        <span className="font-bold text-fuchsia-900 block mb-0.5">3. BARIKADE SELANG RELAY (#C026D3)</span>
                        Wajib diaktifkan saat selang melintasi jalan umum untuk memblokir kendaraan dan melindungi selang dari lindas ban.
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs font-mono text-xs">
                    <p className="text-xs font-bold tracking-widest text-slate-500 uppercase border-b border-slate-200 pb-2 mb-3">
                      STATUS POMPA & TEKANAN RELAY
                    </p>
                    <div className="space-y-2">
                      {units.map((u) => (
                        <div key={u.id} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                          <span className="font-bold text-slate-900">{u.callSign}</span>
                          <span className="text-emerald-700 font-bold tabular-nums">
                            {u.waterPressureBar.toFixed(1)} BAR / {u.targetPressureBar.toFixed(1)} TARGET
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: DIREKTORI AIR (Water Sources & Hydrants Focus View) */}
        {activeTab === "HYDRANTS" && (
          <div className="flex-1 p-2 overflow-y-auto">
            <div className="max-w-6xl mx-auto space-y-4">
              {/* Header & Status Filter Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
                <div>
                  <p className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase mb-1">
                    DIREKTORI LOGISTIK AIR
                  </p>
                  <h2 className="text-lg font-bold text-slate-900 uppercase">
                    30+ SEBARAN HIDRAN, TANDON & DERMAGA SEDOT SAMARINDA
                  </h2>
                </div>

                {/* Filter Status Interaktif (Sesuai Aturan no-pill-chips: Gunakan Tipografi Bersih Tanpa Pill Badges) */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Filter:</span>
                  <button
                    type="button"
                    onClick={() => setWaterFilterStatus("ALL")}
                    className={`pb-1 font-mono text-xs font-bold transition-all cursor-pointer border-b-2 ${
                      waterFilterStatus === "ALL"
                        ? "border-slate-900 text-slate-900"
                        : "border-transparent text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    SEMUA ({waterSources.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setWaterFilterStatus("READY")}
                    className={`pb-1 font-mono text-xs font-bold transition-all cursor-pointer border-b-2 ${
                      waterFilterStatus === "READY"
                        ? "border-emerald-600 text-emerald-800"
                        : "border-transparent text-emerald-700/60 hover:text-emerald-800"
                    }`}
                  >
                    READY: {waterSources.filter((s) => s.status === "READY").length}
                  </button>
                  <button
                    type="button"
                    onClick={() => setWaterFilterStatus("LOW_DISCHARGE")}
                    className={`pb-1 font-mono text-xs font-bold transition-all cursor-pointer border-b-2 ${
                      waterFilterStatus === "LOW_DISCHARGE"
                        ? "border-amber-600 text-amber-800"
                        : "border-transparent text-amber-700/60 hover:text-amber-800"
                    }`}
                  >
                    LOW: {waterSources.filter((s) => s.status === "LOW_DISCHARGE").length}
                  </button>
                  <button
                    type="button"
                    onClick={() => setWaterFilterStatus("EMPTY")}
                    className={`pb-1 font-mono text-xs font-bold transition-all cursor-pointer border-b-2 ${
                      waterFilterStatus === "EMPTY"
                        ? "border-rose-600 text-rose-800"
                        : "border-transparent text-rose-700/60 hover:text-rose-800"
                    }`}
                  >
                    EMPTY: {waterSources.filter((s) => s.status === "EMPTY").length}
                  </button>
                </div>
              </div>

              {/* Bar Pencarian & Counter Hasil */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
                <div className="relative flex-1 max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-3.35z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={waterSearchQuery}
                    onChange={(e) => setWaterSearchQuery(e.target.value)}
                    placeholder="Filter nama titik air, hidran, jalan, atau tipe (Sungai/Tandon)..."
                    className="w-full pl-10 pr-9 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                  />
                  {waterSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setWaterSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 text-xs font-mono text-slate-500">
                  <span>
                    Ditemukan: <strong className="text-slate-900 font-bold">{displayedWaterSources.length}</strong> dari {waterSources.length} titik air
                  </span>
                  {(waterFilterStatus !== "ALL" || waterSearchQuery) && (
                    <button
                      type="button"
                      onClick={() => {
                        setWaterFilterStatus("ALL");
                        setWaterSearchQuery("");
                      }}
                      className="text-sky-600 hover:text-sky-700 font-bold underline underline-offset-2 cursor-pointer"
                    >
                      Reset Filter
                    </button>
                  )}
                </div>
              </div>

              {/* Tabel Sumber Air */}
              <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <th className="p-3.5 font-bold">NAMA TITIK AIR</th>
                      <th className="p-3.5 font-bold">TIPE</th>
                      <th className="p-3.5 font-bold">KOORDINAT (WGS 84)</th>
                      <th className="p-3.5 font-bold">DEBIT AIR</th>
                      <th className="p-3.5 font-bold">STATUS OPERASIONAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedWaterSources.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 font-mono text-xs">
                          Tidak ada titik air yang sesuai dengan filter &quot;{waterFilterStatus}&quot; {waterSearchQuery ? `dan pencarian "${waterSearchQuery}"` : ""}.
                        </td>
                      </tr>
                    ) : (
                      displayedWaterSources.map((ws) => (
                        <tr key={ws.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5 font-bold text-slate-900">{ws.name}</td>
                          <td className="p-3.5 text-slate-600">{ws.type}</td>
                          <td className="p-3.5 text-slate-500 tabular-nums">
                            {ws.coordinates[0].toFixed(4)}, {ws.coordinates[1].toFixed(4)}
                          </td>
                          <td className="p-3.5 font-bold text-slate-900 tabular-nums">
                            {ws.dischargeLitersPerMin} L/min
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`font-mono font-bold text-xs uppercase tracking-wider ${
                                ws.status === "READY"
                                  ? "text-emerald-700"
                                  : ws.status === "LOW_DISCHARGE"
                                  ? "text-amber-700"
                                  : "text-rose-700"
                              }`}
                            >
                              {ws.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: LOG TELEMETRI (CDC Mutation Feed Focus View) */}
        {activeTab === "TELEMETRY" && (
          <div className="flex-1 p-2 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
                <div>
                  <p className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase mb-1">
                    AUDIT LOG & TELEMETRI CDC
                  </p>
                  <h2 className="text-lg font-bold text-slate-900 uppercase">
                    ALIRAN MUTASI DATA WAKTU NYATA POSKO INDUK
                  </h2>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <div className="bg-emerald-50 border border-emerald-200 px-3 py-1 text-emerald-800 font-bold rounded-lg">
                    CDC: TERHUBUNG
                  </div>
                  <div className="bg-slate-50 border border-slate-200 px-3 py-1 text-slate-700 font-bold tabular-nums rounded-lg">
                    {telemetryStream.length} MUTASI
                  </div>
                </div>
              </div>

              <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
                <TelemetryStreamPanel mutations={telemetryStream} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
