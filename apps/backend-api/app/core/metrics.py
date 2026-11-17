"""
Prometheus Metrics Engine untuk HydraTact Samarinda Backend API.
Menyediakan metrik operasional standar Prometheus exposition format tanpa ketergantungan paket eksternal berat.
"""

from collections import defaultdict
import threading
import time
from typing import Dict, Tuple

_lock = threading.Lock()
_request_counts: Dict[Tuple[str, str, int], int] = defaultdict(int)
_request_latencies: Dict[str, float] = defaultdict(float)
_consensus_evaluated_counter = 0
_outbox_synced_counter = 0


def record_request_metric(method: str, path: str, status_code: int, duration_seconds: float):
    """Mencatat jumlah permintaan HTTP dan durasi eksekusi."""
    # Normalisasi path bertarget UUID/ID menjadi parameter generik
    normalized_path = path
    segments = path.strip("/").split("/")
    if len(segments) >= 4 and segments[0] == "api" and segments[1] == "v1":
        # misal: /api/v1/incidents/<uuid> -> /api/v1/incidents/:id
        if segments[2] in ("incidents", "units", "water-sources", "barricades") and len(segments) > 3:
            segments[3] = ":id"
            normalized_path = "/" + "/".join(segments)

    with _lock:
        _request_counts[(method.upper(), normalized_path, status_code)] += 1
        _request_latencies[normalized_path] += duration_seconds


def increment_consensus_evaluated():
    """Mencatat evaluasi klaster konsensus anti-prank."""
    global _consensus_evaluated_counter
    with _lock:
        _consensus_evaluated_counter += 1


def increment_outbox_synced(count: int = 1):
    """Mencatat jumlah mutasi outbox mobile yang berhasil disinkronkan."""
    global _outbox_synced_counter
    with _lock:
        _outbox_synced_counter += count


def generate_prometheus_metrics_text() -> str:
    """Menghasilkan teks berformat standar Prometheus text/plain v0.0.4."""
    lines = [
        "# HELP hydratact_http_requests_total Total HTTP requests processed by HydraTact API",
        "# TYPE hydratact_http_requests_total counter",
    ]

    with _lock:
        for (method, path, status_code), count in sorted(_request_counts.items()):
            lines.append(
                f'hydratact_http_requests_total{{method="{method}",endpoint="{path}",status="{status_code}"}} {count}'
            )

        lines.extend([
            "# HELP hydratact_consensus_evaluations_total Total citizen consensus evaluations executed",
            "# TYPE hydratact_consensus_evaluations_total counter",
            f"hydratact_consensus_evaluations_total {_consensus_evaluated_counter}",
            "# HELP hydratact_outbox_mutations_synced_total Total mobile offline outbox mutations synced",
            "# TYPE hydratact_outbox_mutations_synced_total counter",
            f"hydratact_outbox_mutations_synced_total {_outbox_synced_counter}",
            "# HELP hydratact_system_up Process uptime status",
            "# TYPE hydratact_system_up gauge",
            "hydratact_system_up 1",
        ])

    return "\n".join(lines) + "\n"
