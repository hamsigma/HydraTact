/**
 * Model Data Matriks Taktis Armada & Barikade Jalan.
 *
 * File: apps/web-command/src/lib/tactical-units.ts
 * PIC: @Hervino (TASK-306)
 */

export interface TacticalUnitMatrixItem {
  id: string;
  callSign: string;
  vehicleType: "PORTABLE_PUMP" | "TANKER_MEDIUM" | "TANKER_HEAVY";
  tankCapacityLiters: number;
  assignedRole: "ATTACKER" | "FEEDER";
  waterPressureBar: number;
  targetPressureBar: number;
  distanceFromFireMeters: number;
  status: "EN_ROUTE" | "ON_SCENE" | "PUMPING";
}

export interface ActiveBarricadeItem {
  id: string;
  roadName: string;
  feederCallSign: string;
  hoseLengthMeters: number;
  isActive: boolean;
  createdAt: string;
  incidentId?: string;
  originCoords?: [number, number];
  targetCoords?: [number, number];
}

export const DEFAULT_TACTICAL_UNITS: TacticalUnitMatrixItem[] = [
  {
    id: "unit-01",
    callSign: "UNIT BALAKARCANA 01",
    vehicleType: "PORTABLE_PUMP",
    tankCapacityLiters: 800,
    assignedRole: "ATTACKER",
    waterPressureBar: 6.8,
    targetPressureBar: 7.0,
    distanceFromFireMeters: 25,
    status: "PUMPING",
  },
  {
    id: "unit-05",
    callSign: "UNIT TANGKI INDUK 05",
    vehicleType: "TANKER_HEAVY",
    tankCapacityLiters: 5000,
    assignedRole: "FEEDER",
    waterPressureBar: 8.5,
    targetPressureBar: 8.5,
    distanceFromFireMeters: 135,
    status: "PUMPING",
  },
];

export const DEFAULT_ACTIVE_BARRICADES: ActiveBarricadeItem[] = [
  {
    id: "barricade-33333333-3333-3333-3333-333333333301",
    incidentId: "33333333-3333-3333-3333-333333333301",
    roadName: "Mulut Masuk Gang - Gg. 4 Jl. Pelita",
    feederCallSign: "UNIT TANGKI INDUK 05",
    hoseLengthMeters: 110,
    isActive: true,
    createdAt: new Date().toISOString(),
    originCoords: [-0.4840, 117.1638],
    targetCoords: [-0.4848, 117.1628],
  },
];
