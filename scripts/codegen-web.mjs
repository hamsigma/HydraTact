import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const openapiYaml = path.join(repoRoot, "packages", "openapi-contract", "openapi.yaml");
const packageTypesOut = path.join(repoRoot, "packages", "openapi-contract", "src", "types", "api.ts");
const packageIndexOut = path.join(repoRoot, "packages", "openapi-contract", "src", "index.ts");
const webCommandTypesOut = path.join(repoRoot, "apps", "web-command", "src", "types", "api.d.ts");
const pwaCitizenTypesOut = path.join(repoRoot, "apps", "pwa-citizen", "src", "types", "api.d.ts");

console.log("[HydraTact Codegen Web] Generating TypeScript types from OpenAPI contract...");

if (!fs.existsSync(openapiYaml)) {
  console.error(`Error: OpenAPI specification not found at ${openapiYaml}`);
  process.exit(1);
}

// Ensure parent directories exist
[packageTypesOut, webCommandTypesOut, pwaCitizenTypesOut].forEach((filePath) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Run openapi-typescript
try {
  execSync(`npx openapi-typescript "${openapiYaml}" -o "${packageTypesOut}"`, {
    stdio: "inherit",
    cwd: repoRoot,
  });
} catch (error) {
  console.error("Failed to run openapi-typescript:", error);
  process.exit(1);
}

// Copy to apps
const generatedContent = fs.readFileSync(packageTypesOut, "utf-8");
fs.writeFileSync(webCommandTypesOut, generatedContent, "utf-8");
fs.writeFileSync(pwaCitizenTypesOut, generatedContent, "utf-8");

console.log(`  -> Synced types to ${webCommandTypesOut}`);
console.log(`  -> Synced types to ${pwaCitizenTypesOut}`);

// Create index.ts with Matt Pocock helper type aliases
const indexContent = `/**
 * @hydratact/openapi-contract
 * Single Source of Truth TypeScript API Types & Helpers
 */

export type * from "./types/api";
import type { components, paths, operations } from "./types/api";

export type Schema<T extends keyof components["schemas"]> = components["schemas"][T];

// Core Domain Schemas
export type GeoPoint = Schema<"GeoPoint">;
export type GeoLineString = Schema<"GeoLineString">;
export type IncidentStatus = Schema<"IncidentFSMStatus">;
export type VehicleType = Schema<"VehicleType">;
export type TacticalRole = Schema<"TacticalRole">;
export type WaterStatus = Schema<"WaterSourceStatus">;
export type WaterSourceType = Schema<"WaterSourceType">;
export type BarricadeReason = Schema<"BarricadeReason">;

// Citizen Incident Reporting
export type CitizenReportRequest = Schema<"CitizenReportRequest">;
export type IncidentReportData = Schema<"IncidentReportData">;
export type IncidentReportResponse = Schema<"IncidentReportResponse">;

// Command & FSM
export type FSMTransitionRequest = Schema<"FSMTransitionRequest">;
export type FSMTransitionData = Schema<"FSMTransitionData">;
export type FSMTransitionResponse = Schema<"FSMTransitionResponse">;
export type IncidentDetailData = Schema<"IncidentDetailData">;
export type IncidentDetailResponse = Schema<"IncidentDetailResponse">;

// Fleet Dispatch & Pressure
export type UnitAssignRequest = Schema<"UnitAssignRequest">;
export type UnitAssignData = Schema<"UnitAssignData">;
export type UnitAssignResponse = Schema<"UnitAssignResponse">;
export type PressureRequest = Schema<"PressureRequest">;
export type PressureRequestData = Schema<"PressureRequestData">;
export type PressureRequestResponse = Schema<"PressureRequestResponse">;
export type UnitTelemetryUpdateRequest = Schema<"UnitTelemetryUpdateRequest">;

// Water Logistics
export type WaterSourceItem = Schema<"WaterSourceItem">;
export type NearestWaterResponse = Schema<"NearestWaterResponse">;
export type WaterStatusUpdateRequest = Schema<"WaterStatusUpdateRequest">;
export type WaterStatusUpdateData = Schema<"WaterStatusUpdateData">;
export type WaterStatusUpdateResponse = Schema<"WaterStatusUpdateResponse">;

// Road Barricade
export type BarricadeCreateRequest = Schema<"BarricadeCreateRequest">;
export type BarricadeData = Schema<"BarricadeData">;
export type BarricadeResponse = Schema<"BarricadeResponse">;
export type BarricadeDeactivateData = Schema<"BarricadeDeactivateData">;
export type BarricadeDeactivateResponse = Schema<"BarricadeDeactivateResponse">;

// Offline Outbox Sync
export type OutboxMutationItem = Schema<"OutboxMutationItem">;
export type OutboxBatchRequest = Schema<"OutboxBatchRequest">;
export type MutationResultItem = Schema<"MutationResultItem">;
export type OutboxBatchData = Schema<"OutboxBatchData">;
export type OutboxBatchResponse = Schema<"OutboxBatchResponse">;

export type ApiPaths = paths;
export type ApiOperations = operations;
`;

fs.writeFileSync(packageIndexOut, indexContent, "utf-8");
console.log(`  -> Generated domain helpers in ${packageIndexOut}`);
console.log("[HydraTact Codegen Web] Web codegen completed successfully.");
