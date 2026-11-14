/**
 * Finite State Machine (FSM) Siklus Hidup Insiden Kebakaran
 * 
 * File: packages/spatial-core/src/incident_fsm.ts
 * PIC: @Hervino (TASK-204)
 * Single Source of Truth: docs/Architecture.md §5.3 & docs/PRD.md
 */

export type IncidentFSMStatus =
  | "PENDING_VERIFICATION"
  | "VERIFIED"
  | "DISPATCHING"
  | "SUPPRESSION_ACTIVE"
  | "OVERHAUL_COOLING"
  | "INCIDENT_CLOSED"
  | "ARCHIVED"
  | "CANCELLED_PRANK";

/**
 * Matriks Transisi Status Resmi Berdasarkan SOP Damkar Samarinda.
 */
export const ALLOWED_FSM_TRANSITIONS: Record<IncidentFSMStatus, IncidentFSMStatus[]> = {
  PENDING_VERIFICATION: ["VERIFIED", "CANCELLED_PRANK", "ARCHIVED"],
  VERIFIED: ["DISPATCHING", "CANCELLED_PRANK", "ARCHIVED"],
  DISPATCHING: ["SUPPRESSION_ACTIVE", "CANCELLED_PRANK", "ARCHIVED"],
  SUPPRESSION_ACTIVE: ["OVERHAUL_COOLING", "DISPATCHING"],
  OVERHAUL_COOLING: ["INCIDENT_CLOSED", "SUPPRESSION_ACTIVE"],
  INCIDENT_CLOSED: ["ARCHIVED", "OVERHAUL_COOLING"],
  CANCELLED_PRANK: ["ARCHIVED"],
  ARCHIVED: [],
};

export interface FSMValidationResult {
  isValid: boolean;
  reason?: string;
  isOverrideAllowed?: boolean;
}

/**
 * Memvalidasi apakah transisi status dari status saat ini ke status target sah.
 */
export function isValidFSMTransition(
  currentStatus: IncidentFSMStatus,
  targetStatus: IncidentFSMStatus,
  isOverride: boolean = false
): FSMValidationResult {
  if (currentStatus === targetStatus) {
    return {
      isValid: false,
      reason: `Status tujuan sama dengan status saat ini (${currentStatus}).`,
    };
  }

  if (currentStatus === "ARCHIVED") {
    return {
      isValid: false,
      reason: "Insiden yang telah diarsipkan (ARCHIVED) adalah status terminal dan tidak dapat diubah kembali.",
    };
  }

  const allowedNext = ALLOWED_FSM_TRANSITIONS[currentStatus] || [];

  if (allowedNext.includes(targetStatus)) {
    return { isValid: true };
  }

  // Jika operator melakukan Manual Override dengan otorisasi resmi
  if (isOverride) {
    // Override dari PENDING_VERIFICATION langsung ke VERIFIED atau CANCELLED_PRANK selalu diizinkan
    if (
      currentStatus === "PENDING_VERIFICATION" &&
      (targetStatus === "VERIFIED" || targetStatus === "CANCELLED_PRANK")
    ) {
      return { isValid: true, isOverrideAllowed: true };
    }

    // Posko dapat membatalkan insiden darurat ke CANCELLED_PRANK atau ARCHIVED kapan saja
    if (targetStatus === "CANCELLED_PRANK" || targetStatus === "ARCHIVED") {
      return { isValid: true, isOverrideAllowed: true };
    }

    // Melompati DISPATCHING langsung ke SUPPRESSION_ACTIVE jika unit sudah tiba di lokasi
    if (currentStatus === "VERIFIED" && targetStatus === "SUPPRESSION_ACTIVE") {
      return { isValid: true, isOverrideAllowed: true };
    }
  }

  return {
    isValid: false,
    reason: `Transisi status tidak valid dari '${currentStatus}' ke '${targetStatus}'. Tahap yang diizinkan: [${allowedNext.join(", ")}].`,
    isOverrideAllowed: true,
  };
}

/**
 * Menentukan protokol dispatch operasional berdasarkan lebar jalan dan tahap FSM.
 */
export function determineDispatchProtocol(
  roadWidthMeters: number,
  status: IncidentFSMStatus
): string | null {
  if (status === "DISPATCHING" || status === "SUPPRESSION_ACTIVE") {
    if (roadWidthMeters < 2.5) {
      return "AUTO_SPLIT_NARROW_ALLEY";
    }
    return "DIRECT_ATTACK_WIDE_ROAD";
  }
  return null;
}

export interface IncidentStateSnapshot {
  incidentId: string;
  status: IncidentFSMStatus;
  roadWidthMeters: number;
  verifiedAt?: Date | string | null;
  closedAt?: Date | string | null;
}

export interface TransitionExecutionInput {
  targetStatus: IncidentFSMStatus;
  roadWidthMeters?: number | null;
  overrideReason?: string | null;
  operatorNotes?: string | null;
  isManualOverride?: boolean;
}

export interface TransitionExecutionOutput {
  incidentId: string;
  previousStatus: IncidentFSMStatus;
  currentStatus: IncidentFSMStatus;
  roadWidthMeters: number;
  verifiedAt: Date | string | null;
  closedAt: Date | string | null;
  isManualOverride: boolean;
  overrideReason: string | null;
  operatorNotes: string | null;
  dispatchProtocol: string | null;
  updatedAt: string;
}

/**
 * Mengeksekusi transisi status FSM insiden kebakaran dan memperbarui stempel waktu operasional.
 */
export function executeFSMTransition(
  incident: IncidentStateSnapshot,
  input: TransitionExecutionInput
): TransitionExecutionOutput {
  const isOverride = Boolean(input.isManualOverride || input.overrideReason);
  const validation = isValidFSMTransition(incident.status, input.targetStatus, isOverride);

  if (!validation.isValid) {
    throw new Error(validation.reason || "Transisi status FSM tidak sah.");
  }

  const effectiveRoadWidth =
    typeof input.roadWidthMeters === "number" && input.roadWidthMeters > 0
      ? input.roadWidthMeters
      : incident.roadWidthMeters;

  const nowIso = new Date().toISOString();

  let verifiedAt = incident.verifiedAt ?? null;
  if (input.targetStatus === "VERIFIED" && !verifiedAt) {
    verifiedAt = nowIso;
  }

  let closedAt = incident.closedAt ?? null;
  if (input.targetStatus === "INCIDENT_CLOSED" && !closedAt) {
    closedAt = nowIso;
  }

  const dispatchProtocol = determineDispatchProtocol(effectiveRoadWidth, input.targetStatus);

  return {
    incidentId: incident.incidentId,
    previousStatus: incident.status,
    currentStatus: input.targetStatus,
    roadWidthMeters: effectiveRoadWidth,
    verifiedAt,
    closedAt,
    isManualOverride: isOverride,
    overrideReason: input.overrideReason ?? null,
    operatorNotes: input.operatorNotes ?? null,
    dispatchProtocol,
    updatedAt: nowIso,
  };
}
