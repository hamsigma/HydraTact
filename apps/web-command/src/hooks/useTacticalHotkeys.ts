/**
 * Hook & Handler Navigasi Pintasan Keyboard Taktis untuk Operator Posko Komando (Web Command).
 * Memfasilitasi respons cepat satu tombol tanpa ketergantungan kursor mouse saat kondisi darurat.
 */

export interface TacticalHotkeyActions {
  onSelectBasemap?: (basemap: "osm" | "hot" | "minimal") => void;
  onFocusIncidents?: () => void;
  onFocusWaterSources?: () => void;
  onToggleBarricades?: () => void;
  onDismissModal?: () => void;
}

export function handleTacticalKey(
  event: { key: string; altKey?: boolean; ctrlKey?: boolean; metaKey?: boolean; target?: any },
  actions: TacticalHotkeyActions
): boolean {
  // Abaikan pintasan jika pengguna sedang mengetik di input teks
  const tagName = event.target?.tagName?.toLowerCase();
  if (tagName === "input" || tagName === "textarea" || tagName === "select") {
    return false;
  }

  // Hindari tabrakan dengan shortcut browser umum (Ctrl/Cmd)
  if (event.ctrlKey || event.metaKey) {
    return false;
  }

  switch (event.key) {
    case "1":
      actions.onSelectBasemap?.("osm");
      return true;
    case "2":
      actions.onSelectBasemap?.("hot");
      return true;
    case "3":
      actions.onSelectBasemap?.("minimal");
      return true;
    case "i":
    case "I":
      actions.onFocusIncidents?.();
      return true;
    case "w":
    case "W":
      actions.onFocusWaterSources?.();
      return true;
    case "b":
    case "B":
      actions.onToggleBarricades?.();
      return true;
    case "Escape":
      actions.onDismissModal?.();
      return true;
    default:
      return false;
  }
}
