# Panduan Kontribusi, Branch, Commit, & Pull Request

> Dokumen ini adalah standar resmi alur kerja Git dan kolaborasi kode untuk repositori **HydraTact Samarinda**. Seluruh kontributor wajib mematuhi panduan ini guna menjaga kualitas kode, riwayat commit yang bersih, dan stabilitas sistem.

---

## 1. Aturan Branching (Branch Strategy & Naming)

### 1.1 Base Branch
* **`main`**: Branch produksi utama. Seluruh kode di `main` harus selalu berada dalam kondisi stabil, dapat dibuild (*buildable*), dan lolos seluruh pengujian otomatis.
* **Larangan Keras**: Dilarang melakukan *direct commit* atau *direct push* ke branch `main`. Seluruh perubahan wajib masuk melalui Pull Request.

### 1.2 Format Penamaan Branch
Penamaan branch wajib mengikuti pola deterministik berikut:

```text
<type>/<issue-id>-<short-description>
```

| Bagian | Keterangan | Contoh |
| :--- | :--- | :--- |
| `<type>` | Kategori pekerjaan (huruf kecil) | `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore` |
| `<issue-id>` | ID issue atau task yang sedang dikerjakan | `HT-101`, `HT-204`, `issue-12` |
| `<short-description>` | Ringkasan deskripsi singkat dengan pemisah tanda hubung (*kebab-case*) | `auto-split-role`, `haversine-sort`, `offline-mbtiles-view` |

#### Contoh Penamaan yang Benar:
* `feat/HT-101-auto-split-role-dispatcher`
* `fix/HT-204-haversine-nearest-water-sorting`
* `refactor/HT-302-outbox-sync-queue-isar`
* `docs/HT-005-api-contract-specification`
* `perf/HT-410-gist-spatial-index-query`
* `chore/HT-001-setup-monorepo-turborepo`

#### Contoh Penamaan yang Dilarang:
* ❌ `hervino-branch` (menggunakan nama orang)
* ❌ `fix-bug` (tanpa ID issue dan tanpa tipe jelas)
* ❌ `feat/Update` (menggunakan huruf kapital)
* ❌ `test_feature` (menggunakan underscore)

### 1.3 Siklus Hidup Branch
1. Buat branch baru dari `main` versi terbaru:
   ```bash
   git fetch origin main
   git checkout -b feat/HT-101-auto-split-role origin/main
   ```
2. Satu branch hanya boleh menyelesaikan **satu tujuan issue/task**. Hindari mencampuradukkan perbaikan bug dengan pembuatan fitur baru dalam branch yang sama.
3. Hapus branch lokal dan remote setelah PR berhasil di-merge ke `main`.

---

## 2. Aturan Commit (Conventional Commits Standard)

Riwayat commit wajib menggunakan format **Conventional Commits v1.0.0** agar mudah dibaca oleh manusia maupun alat pembuat changelog otomatis.

### 2.1 Format Pesan Commit
```text
<type>(<scope>): <deskripsi imperatif dalam huruf kecil>

[Opsional: Paragraf penjelasan alasan dan konteks perubahan]

[Opsional: Referensi Issue ID, misal: Closes #101 / Refs #101]
```

### 2.2 Tipe Commit (`type`)
* **`feat`**: Menambahkan fitur baru bagi pengguna atau sistem.
* **`fix`**: Memperbaiki bug atau anomali logika.
* **`docs`**: Perubahan atau penambahan dokumentasi (`README`, `docs/`, dsb.).
* **`style`**: Format kode (spasi, titik koma, indentasi) tanpa mengubah logika program.
* **`refactor`**: Restrukturisasi kode tanpa menambah fitur baru atau memperbaiki bug.
* **`perf`**: Optimasi performa sistem atau kueri basis data spasial.
* **`test`**: Menambah atau memperbaiki unit test / integration test.
* **`build`**: Perubahan pada build system, konfigurasi pnpm, turborepo, atau dependensi eksternal.
* **`ci`**: Perubahan pada skrip GitHub Actions atau otomatisasi deployment.
* **`chore`**: Pekerjaan pemeliharaan rutin, konfigurasi tooling, atau pembaruan `.gitignore`.

### 2.3 Lingkup Monorepo (`scope`)
Pilih lingkup yang sesuai dengan modul yang diubah:
* `web-command`: Dasbor Komando Posko Induk (Next.js)
* `pwa-citizen`: Portal Pelaporan Darurat Warga (Next.js PWA)
* `mobile-volunteer`: Aplikasi Lapangan Android Relawan (Flutter)
* `api-server`: Backend Fastify / Node.js
* `spatial-core`: Paket algoritma spasial murni (Haversine, FSM, Auto-Split)
* `database`: Skema DDL PostGIS, migrasi, dan Isar DB
* `deps`: Pembaruan versi paket/pustaka
* `infra`: Docker compose, pipeline tile Tippecanoe

### 2.4 Kaidah Penulisan Commit
1. Gunakan kalimat **imperatif waktu sekarang** (*present tense*), bukan bentuk lampau:
   * ✅ `feat(spatial-core): implement auto-split feeder and attacker logic`
   * ❌ `feat(spatial-core): implemented auto-split` atau `adding auto-split`
2. Baris subjek diawali huruf kecil setelah titik dua dan **tanpa tanda titik** di akhir kalimat.
3. **Dilarang keras commit sampah**: Jangan membuat commit seperti `wip`, `update`, `test1`, `bismillah`, `fix lagi`.
4. **Dilarang menyertakan rahasia**: Jangan pernah melakukan commit file `.env`, API key, token otentikasi, atau password.

---

## 3. Aturan Pull Request (PR) & Alur Review

### 3.1 Format Pull Request (Wajib 5W1H)
Sesuai template pada [pull_request_template.md](file:///.github/pull_request_template.md), setiap PR **wajib** mengisi keenam elemen 5W1H secara lengkap:

```markdown
What:
<!-- Apa saja yang diubah atau ditambahkan dalam PR ini secara teknis -->

Why:
<!-- Alasan mengapa perubahan ini diperlukan (masalah lapangan/tiket terkait) -->

Who:
<!-- Pihak yang terdampak (Citizen, Commander, Volunteer Attacker, Volunteer Feeder) -->

When:
<!-- Kapan perubahan ini aktif/berlaku (kondisi normal, saat offline, transisi FSM) -->

Where:
<!-- Direktori, package, atau modul sistem yang terpengaruh -->

How:
<!-- Bagaimana implementasi teknisnya dilakukan (arsitektur, algoritma, skema) -->
```

Sertakan pula kaitan issue pada bagian bawah PR:
```text
Closes #HT-101
```

### 3.2 Pre-Flight Checklist (Gerbang Mandatori Sebelum Buka PR)
Sebelum membuka PR, pengembang **wajib** memastikan verifikasi lokal berikut lolos tanpa peringatan/error:
- [ ] Lolos linting: `pnpm lint` (atau `flutter analyze` untuk modul mobile)
- [ ] Lolos verifikasi tipe: `pnpm typecheck`
- [ ] Lolos seluruh pengujian: `pnpm test` (atau `flutter test`)
- [ ] Lolos build lokal: `pnpm build`
- [ ] Tidak ada file sampah yang terbawa (`Thumbs.db`, `.DS_Store`, file debug sementara)

---

## 4. Aturan Ketat Review & Penggabungan (*Strict Merge Rules*)

> [!IMPORTANT]
> **Kebijakan Keamanan Git Repositori HydraTact:**
> 1. Dilarang melakukan *direct push* ke `main`.
> 2. Dilarang melakukan merge mandiri (*self-merge*) tanpa persetujuan.
> 3. Setiap Pull Request **WAJIB** melewati review dan persetujuan tertulis (*Approval*) dari **Project Manager (PM)** sebelum digabungkan.

### 4.1 Aturan Pemeriksaan Konflik & Simulasi Merge
Saat menganalisis potensi konflik atau simulasi merge pada branch PR:
* **DILARANG KERAS** mengeksekusi `git merge` atau `git pull` secara nyata pada working tree aktif.
* Lakukan pengecekan secara **dry-run / read-only** menggunakan perintah simulasi:
  ```bash
  # Cek konflik secara read-only tanpa commit dan tanpa fast-forward
  git merge --no-commit --no-ff <branch-target>
  # Batalkan simulasi seketika
  git merge --abort
  ```
  atau gunakan perbandingan diff git:
  ```bash
  git diff main...<branch-target>
  ```

### 4.2 Prosedur Eksekusi Merge
* Eksekusi merge ke `main` **hanya boleh dijalankan setelah ada izin eksplisit** dari User / Project Manager (PM).
* Metode penggabungan yang digunakan di GitHub adalah **Squash and Merge** untuk memastikan riwayat commit di `main` tetap bersih, linier, dan mudah ditelusuri (*1 PR = 1 meaningful commit*).

---

## 5. Ringkasan Alur Kerja Pengembang (Cheat Sheet)

```bash
# 1. Ambil versi terbaru main
git checkout main
git pull origin main

# 2. Buat branch fitur/bugfix baru
git checkout -b feat/HT-101-role-dispatch

# 3. Kembangkan kode, pastikan gate lokal lolos
pnpm lint && pnpm test && pnpm build

# 4. Buat commit terstruktur
git add .
git commit -m "feat(spatial-core): add dynamic role dispatching rules"

# 5. Push branch ke GitHub
git push -u origin feat/HT-101-role-dispatch

# 6. Buka PR di GitHub menggunakan template 5W1H
# 7. Tunggu Review & Approval dari Project Manager (PM)
# 8. Eksekusi Squash and Merge setelah disetujui
```
