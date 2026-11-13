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
