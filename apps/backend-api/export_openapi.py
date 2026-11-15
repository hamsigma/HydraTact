import json
import os
import sys
from pathlib import Path
import yaml

# Ensure apps/backend-api is on sys.path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# Ensure packages/spatial-core/python is on sys.path
spatial_core_dir = BASE_DIR.parent.parent / "packages" / "spatial-core" / "python"
if str(spatial_core_dir) not in sys.path:
    sys.path.insert(0, str(spatial_core_dir))

from main import app


def export_specs():
    print("[HydraTact] Generating OpenAPI v3 specification from FastAPI app...")
    openapi_schema = app.openapi()

    # Ensure security scheme BearerAuth is registered
    components = openapi_schema.setdefault("components", {})
    security_schemes = components.setdefault("securitySchemes", {})
    security_schemes["BearerAuth"] = {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
        "description": "Supabase Auth Bearer JWT token",
    }

    # Target directories
    repo_root = BASE_DIR.parent.parent
    target_contract_dir = repo_root / "packages" / "openapi-contract"
    legacy_contract_dir = repo_root / "packages" / "contracts"

    target_contract_dir.mkdir(parents=True, exist_ok=True)
    legacy_contract_dir.mkdir(parents=True, exist_ok=True)

    yaml_dest = target_contract_dir / "openapi.yaml"
    json_dest = target_contract_dir / "openapi.json"
    legacy_yaml_dest = legacy_contract_dir / "openapi.yaml"

    # Export JSON
    with open(json_dest, "w", encoding="utf-8") as f:
        json.dump(openapi_schema, f, indent=2, ensure_ascii=False)
    print(f"  -> Exported JSON to {json_dest}")

    # Export YAML
    with open(yaml_dest, "w", encoding="utf-8") as f:
        yaml.dump(openapi_schema, f, allow_unicode=True, sort_keys=False)
    print(f"  -> Exported YAML to {yaml_dest}")

    # Export YAML to legacy contracts path for backward compatibility
    with open(legacy_yaml_dest, "w", encoding="utf-8") as f:
        yaml.dump(openapi_schema, f, allow_unicode=True, sort_keys=False)
    print(f"  -> Synchronized legacy path at {legacy_yaml_dest}")

    print("[HydraTact] OpenAPI v3 export completed successfully.")


if __name__ == "__main__":
    export_specs()
