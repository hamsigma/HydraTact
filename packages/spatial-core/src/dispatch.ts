/**
 * Logika Alokasi Peran Armada (Dynamic Role Dispatching / Auto-Split)
 * 
 * File: packages/spatial-core/src/dispatch.ts
 * PIC: @Ilham (TASK-203)
 * Aturan:
 * - W_road < 2.5m & Kapasitas >= 3.000 L -> FEEDER
 * - W_road < 2.5m & Kapasitas < 1.000 L  -> ATTACKER
 * - W_road < 2.5m & 1.000 L <= Kapasitas < 3.000 L -> RESERVE_FEEDER
 * - W_road >= 2.5m -> DIRECT_ATTACK
 */

import { haversineDistanceMeters } from "./haversine.ts";

export type TacticalRole =
  | "ATTACKER"
  | "FEEDER"
  | "RESERVE_FEEDER"
  | "DIRECT_ATTACK"
  | "UNASSIGNED";

export interface UnitDispatchInfo {
  unitId: string;
  unitCode: string;
  waterCapacityLiters: number;
}

export interface DispatchDecision {
  unitId: string;
  unitCode: string;
  assignedRole: TacticalRole;
  roadWidthMeters: number;
  waterCapacityLiters: number;
  tacticalInstruction: string;
}

/**
 * Menentukan peran taktis armada secara deterministik berdasarkan lebar gang dan kapasitas tangki air.
 */
export function determineTacticalRole(
  roadWidthMeters: number,
  tankCapacityLiters: number
): TacticalRole {
  if (roadWidthMeters < 2.5) {
    if (tankCapacityLiters >= 3000) {
      return "FEEDER";
    } else if (tankCapacityLiters < 1000) {
      return "ATTACKER";
    } else {
      return "RESERVE_FEEDER";
    }
  }
  return "DIRECT_ATTACK";
}

/**
 * Menghasilkan instruksi operasional taktis untuk awak armada.
 */
export function generateTacticalInstruction(
  role: TacticalRole,
  roadWidthMeters: number
): string {
  switch (role) {
    case "ATTACKER":
      return `Gang sempit (${roadWidthMeters.toFixed(1)}m). Unit lincah maju ke dekat titik api. Bentangkan selang serbu.`;
    case "FEEDER":
      return `Mulut gang sempit (${roadWidthMeters.toFixed(1)}m). BERHENTI di jalan arteri. Siapkan pompa estafet & pasokan ke unit ATTACKER.`;
    case "RESERVE_FEEDER":
      return `Tangki sedang di gang sempit (${roadWidthMeters.toFixed(1)}m). Parkir di zona penyangga sebagai cadangan suplai air estafet.`;
    case "DIRECT_ATTACK":
      return `Akses jalan cukup lebar (${roadWidthMeters.toFixed(1)}m >= 2.5m). Unit langsung mendekat ke sektor kebakaran.`;
    default:
      return "Menunggu penugasan sektor dari operator komando.";
  }
}

/**
 * Memproses alokasi taktis untuk satu armada.
 */
export function dispatchUnitRole(
  unit: UnitDispatchInfo,
  roadWidthMeters: number
): DispatchDecision {
  const role = determineTacticalRole(roadWidthMeters, unit.waterCapacityLiters);
  const instruction = generateTacticalInstruction(role, roadWidthMeters);

  return {
    unitId: unit.unitId,
    unitCode: unit.unitCode,
    assignedRole: role,
    roadWidthMeters,
    waterCapacityLiters: unit.waterCapacityLiters,
    tacticalInstruction: instruction,
  };
}

export interface RoadAccessEvaluationParams {
  unitId: string;
  unitCode: string;
  waterCapacityLiters: number;
  roadWidthMeters: number;
  incidentCoordinates: [number, number]; // [lng, lat]
  arterialCoordinates?: [number, number]; // [lng, lat]
}

export interface RoadAccessEvaluationResult {
  unitId: string;
  unitCode: string;
  assignedRole: TacticalRole;
  roadWidthMeters: number;
  waterCapacityLiters: number;
  tacticalInstruction: string;
  dispatchRationale: string;
  arterialStagingPoint: [number, number]; // [lng, lat]
  attackEntryPoint: [number, number];     // [lng, lat]
}

/**
 * Mengevaluasi peran armada beserta penentuan koordinat titik siaga arteri (Feeder)
 * dan titik serang gang sempit (Attacker).
 */
export function evaluateRoadAccessRole(
  params: RoadAccessEvaluationParams
): RoadAccessEvaluationResult {
  const {
    unitId,
    unitCode,
    waterCapacityLiters,
    roadWidthMeters,
    incidentCoordinates,
    arterialCoordinates = [117.1639, -0.4839],
  } = params;

  const role = determineTacticalRole(roadWidthMeters, waterCapacityLiters);
  const instruction = generateTacticalInstruction(role, roadWidthMeters);

  let rationale: string;
  let arterialStagingPoint: [number, number];
  let attackEntryPoint: [number, number];

  if (roadWidthMeters < 2.5) {
    if (waterCapacityLiters >= 3000) {
      rationale = `Lebar akses jalan ${roadWidthMeters.toFixed(1)}m (< 2.5m). Kapasitas tangki ${waterCapacityLiters}L (>= 3.000 L) dilarang masuk gang sempit. Dialokasikan sebagai unit FEEDER penyuplai air di jalan arteri.`;
      arterialStagingPoint = arterialCoordinates;
      attackEntryPoint = incidentCoordinates;
    } else {
      rationale = `Lebar akses jalan ${roadWidthMeters.toFixed(1)}m (< 2.5m). Unit dengan kapasitas ${waterCapacityLiters}L (< 3.000 L) dapat bermanuver masuk ke gang sempit sebagai unit ATTACKER titik api.`;
      arterialStagingPoint = arterialCoordinates;
      attackEntryPoint = incidentCoordinates;
    }
  } else {
    rationale = `Akses jalan cukup lebar (${roadWidthMeters.toFixed(1)}m >= 2.5m). Akses langsung (DIRECT_ATTACK) diizinkan tanpa pemisahan peran statis.`;
    arterialStagingPoint = incidentCoordinates;
    attackEntryPoint = incidentCoordinates;
  }

  return {
    unitId,
    unitCode,
    assignedRole: role,
    roadWidthMeters,
    waterCapacityLiters,
    tacticalInstruction: instruction,
    dispatchRationale: rationale,
    arterialStagingPoint,
    attackEntryPoint,
  };
}

export const MIN_SAFE_PRESSURE_BAR = 4.0;
export const MAX_SAFE_PRESSURE_BAR = 14.0;
export const HOSE_FRICTION_COEFFICIENT_BAR_PER_METER = 0.002;

export interface HoseHydraulicResult {
  targetNozzleBar: number;
  hoseLengthMeters: number;
  pressureLossBar: number;
  requiredFeederPumpBar: number;
  isSafeRange: boolean;
  warning?: "HOSE_BURST_RISK" | "INSUFFICIENT_PRESSURE" | "EMERGENCY_SHUTOFF";
}

/**
 * Menghitung kompensasi tekanan pompa Feeder berdasarkan panjang selang relay.
 */
export function calculateRelayHosePressure(
  targetNozzleBar: number,
  hoseLengthMeters: number = 0
): HoseHydraulicResult {
  if (targetNozzleBar <= 0) {
    return {
      targetNozzleBar: 0,
      hoseLengthMeters,
      pressureLossBar: 0,
      requiredFeederPumpBar: 0,
      isSafeRange: true,
      warning: "EMERGENCY_SHUTOFF",
    };
  }

  const pressureLossBar = Math.round(hoseLengthMeters * HOSE_FRICTION_COEFFICIENT_BAR_PER_METER * 100) / 100;
  const requiredFeederPumpBar = Math.round((targetNozzleBar + pressureLossBar) * 100) / 100;
  const isSafeRange = requiredFeederPumpBar >= MIN_SAFE_PRESSURE_BAR && requiredFeederPumpBar <= MAX_SAFE_PRESSURE_BAR;

  let warning: HoseHydraulicResult["warning"];
  if (requiredFeederPumpBar > MAX_SAFE_PRESSURE_BAR) {
    warning = "HOSE_BURST_RISK";
  } else if (requiredFeederPumpBar < MIN_SAFE_PRESSURE_BAR) {
    warning = "INSUFFICIENT_PRESSURE";
  }

  return {
    targetNozzleBar,
    hoseLengthMeters,
    pressureLossBar,
    requiredFeederPumpBar,
    isSafeRange,
    warning,
  };
}

export interface GenerateHoseBarricadeParams {
  incidentId: string;
  roadName: string;
  feederCallSign: string;
  feederCoords: [number, number]; // [lat, lng]
  attackerCoords: [number, number]; // [lat, lng]
}

export interface HoseBarricadeResult {
  id: string;
  incidentId: string;
  roadName: string;
  feederCallSign: string;
  originCoords: [number, number];
  targetCoords: [number, number];
  hoseLengthMeters: number;
  colorHex: "#C026D3";
  isActive: boolean;
  requiresIntermediateRelay: boolean;
  trafficWarningText: string;
  createdAt: string;
}

export const MAX_SINGLE_STAGE_HOSE_METERS = 300.0;

/**
 * Menghasilkan segmen barikade selang relay fuchsia (#C026D3) antara posisi Feeder dan Attacker.
 */
export function generateHoseCrossingBarricade(
  params: GenerateHoseBarricadeParams
): HoseBarricadeResult {
  const { incidentId, roadName, feederCallSign, feederCoords, attackerCoords } = params;

  // Haversine distance antara feeder dan attacker
  const hoseLengthMeters = haversineDistanceMeters(
    [feederCoords[1], feederCoords[0]],
    [attackerCoords[1], attackerCoords[0]]
  );

  const requiresIntermediateRelay = hoseLengthMeters > MAX_SINGLE_STAGE_HOSE_METERS;
  const trafficWarningText = `PERINGATAN: Jalur selang relay bertekanan tinggi melintasi ${roadName} (${hoseLengthMeters.toFixed(0)}m). Jalur disterilkan dari lalu lintas kendaraan.`;

  return {
    id: `barricade-${incidentId}`,
    incidentId,
    roadName,
    feederCallSign,
    originCoords: feederCoords,
    targetCoords: attackerCoords,
    hoseLengthMeters,
    colorHex: "#C026D3",
    isActive: true,
    requiresIntermediateRelay,
    trafficWarningText,
    createdAt: new Date().toISOString(),
  };
}




