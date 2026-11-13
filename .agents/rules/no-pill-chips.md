---
trigger: always_on
description: Permanent strict prohibition against pill chips, oval badges, and pulse dots across all Heliora UI components.
---

# Strict UI Rule: BANNED PILL CHIPS & OVAL BADGES

Mulai saat ini dan seterusnya, di seluruh antarmuka (Frontend / UI / Tailwind / React) proyek HELIORA:

## 1. LARANGAN MUTLAK (STRICT BAN)
AI DILARANG KERAS membuat atau memunculkan elemen:
- **Pill Chips / Oval Badges**: Kontainer kapsul membulat penuh (`rounded-full` dengan padding `px-3 py-1`, background tipis, dan border) yang diletakkan mengambang di atas heading, hero, section header, maupun di dalam kartu.
- **Dot Indikator Dekoratif**: Dot kecil berkedip (`w-2 h-2 rounded-full animate-pulse`) di dalam kapsul.
- **Badge Kapsul Status**: Membungkus teks status (seperti "AUC-ROC", "Terenkripsi", "Langkah X") ke dalam pill badge lonjong.

## 2. PANDUAN PENGGANTI (EDITORIAL & MINIMALIST STANDARD)
Sesuai PRD dan `docs/Design.md §15.1`:
> *"Do NOT use any pill-shaped chip/badge anywhere on this page — notes and disclaimers should be plain text, not chips."*

Gunakan alternatif berikut:
1. **Section Eyebrow / Kategori**:
   Gunakan teks tipografi bersih murni:
   `text-xs font-mono font-bold tracking-widest text-brand-900/40 uppercase mb-3`
   (Tanpa latar belakang kapsul, tanpa border, tanpa dot).
2. **Hero Section**:
   Judul utama (H1) harus berdiri sendiri secara gagah dan bersih di puncak hirarki visual tanpa dihiasi chip mengambang di atasnya.
3. **Status & Metrik**:
   Tampilkan sebagai teks biasa (*plain text*) dengan tipografi monospaced atau sans-serif yang berbobot:
   `text-xs font-mono font-semibold text-brand-900/70` atau `text-xs font-mono font-bold text-emerald-700`.
