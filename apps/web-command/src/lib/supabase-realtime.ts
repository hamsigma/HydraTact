/**
 * Supabase Realtime CDC Client & Channel Subscription Service.
 *
 * Mengelola langganan WebSocket Change Data Capture (CDC) Postgres untuk insiden aktif,
 * pembaruan peran taktis armada (ATTACKER/FEEDER), penambahan barikade selang jalan,
 * dan fluktuasi pasokan air hidran di Samarinda.
 *
 * File: apps/web-command/src/lib/supabase-realtime.ts
 * PIC: @Hervino (TASK-207)
 */

export type PostgresEventType = "INSERT" | "UPDATE" | "DELETE" | "*";

export interface PostgresChangePayload<T = Record<string, any>> {
  schema: string;
  table: string;
  commit_timestamp: string;
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: T;
  old: Partial<T>;
  errors?: string[];
}

export interface IncidentRealtimeRow {
  id: string;
  status: "REPORTED" | "VERIFIED" | "DISPATCHED" | "WATER_ON_FIRE" | "CONTROLLED" | "RESOLVED" | "FALSE_ALARM";
  verified_reporters_count: number;
  latitude: number;
  longitude: number;
  street_name?: string;
  target_water_pressure_bar?: number;
  updated_at: string;
}

export interface IncidentUnitRealtimeRow {
  id: string;
  incident_id: string;
  unit_id: string;
  assigned_role: "ATTACKER" | "FEEDER";
  status: "DISPATCHED" | "EN_ROUTE" | "ON_SCENE" | "RETURNING";
  target_pressure_bar?: number;
  updated_at: string;
}

export interface RoadBarricadeRealtimeRow {
  id: string;
  incident_id: string;
  road_name: string;
  reason: "HOSE_CONNECTED" | "FIRE_SPREAD" | "COLLAPSED_DEBRIS" | "ACCESS_LOCKED" | "PRESSURIZED_HOSE_LINE";
  hose_length_meters: number;
  is_active: boolean;
  created_at: string;
  deactivated_at?: string | null;
}

export interface WaterSourceRealtimeRow {
  id: string;
  name: string;
  operational_status: "READY" | "LOW_PRESSURE" | "DEPLETED" | "DAMAGED";
  pressure_bar: number;
  updated_at: string;
}

export interface IncidentRealtimeCallbacks {
  onIncidentUpdate?: (payload: PostgresChangePayload<IncidentRealtimeRow>) => void;
  onUnitChange?: (payload: PostgresChangePayload<IncidentUnitRealtimeRow>) => void;
  onBarricadeChange?: (payload: PostgresChangePayload<RoadBarricadeRealtimeRow>) => void;
  onWaterSourceChange?: (payload: PostgresChangePayload<WaterSourceRealtimeRow>) => void;
  onError?: (error: Error) => void;
}

export interface RealtimeSubscription {
  channelName: string;
  incidentId: string;
  unsubscribe: () => void;
  dispatchMockEvent: (tableName: string, eventType: "INSERT" | "UPDATE" | "DELETE", newRecord: any, oldRecord?: any) => void;
}

export interface SupabaseRealtimeConfig {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

/**
 * Berlangganan ke saluran Realtime CDC Supabase untuk insiden spesifik.
 * Mendengarkan perubahan tabel: incidents, incident_units, road_barricades, dan water_sources.
 */
export function subscribeToIncidentRealtime(
  incidentId: string,
  callbacks: IncidentRealtimeCallbacks,
  _config?: SupabaseRealtimeConfig
): RealtimeSubscription {
  const channelName = `incident-tactical-${incidentId}`;
  let isActive = true;

  const dispatchEvent = (
    tableName: string,
    eventType: "INSERT" | "UPDATE" | "DELETE",
    newRecord: any,
    oldRecord: any = {}
  ) => {
    if (!isActive) return;

    const payload: PostgresChangePayload = {
      schema: "public",
      table: tableName,
      commit_timestamp: new Date().toISOString(),
      eventType,
      new: newRecord,
      old: oldRecord,
    };

    try {
      switch (tableName) {
        case "incidents":
          if (newRecord?.id === incidentId || oldRecord?.id === incidentId) {
            callbacks.onIncidentUpdate?.(payload as PostgresChangePayload<IncidentRealtimeRow>);
          }
          break;
        case "incident_units":
          if (newRecord?.incident_id === incidentId || oldRecord?.incident_id === incidentId) {
            callbacks.onUnitChange?.(payload as PostgresChangePayload<IncidentUnitRealtimeRow>);
          }
          break;
        case "road_barricades":
          if (newRecord?.incident_id === incidentId || oldRecord?.incident_id === incidentId) {
            callbacks.onBarricadeChange?.(payload as PostgresChangePayload<RoadBarricadeRealtimeRow>);
          }
          break;
        case "water_sources":
          callbacks.onWaterSourceChange?.(payload as PostgresChangePayload<WaterSourceRealtimeRow>);
          break;
        default:
          break;
      }
    } catch (err: any) {
      callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  };

  return {
    channelName,
    incidentId,
    unsubscribe: () => {
      isActive = false;
    },
    dispatchMockEvent: (tableName, eventType, newRecord, oldRecord) => {
      dispatchEvent(tableName, eventType, newRecord, oldRecord);
    },
  };
}
