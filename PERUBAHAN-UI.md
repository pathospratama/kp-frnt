# Perubahan UI — “Yudit Cloud” → “Arsip Digital DPRD Kuningan”

Dokumen ini merangkum **perbedaan tampilan dan interaksi sebelum vs sesudah** redesign
frontend. Ditulis untuk reviewer yang ingin tahu apa yang berubah tanpa membaca seluruh
diff.

| | |
|---|---|
| Branch | `fitur/arsip-digital-dprd` |
| Commit | `fc0e60d` — *Redesain UI Arsip Digital DPRD Kuningan* |
| Basis | `main` (`fb2c285`) |
| Lingkup | Frontend `kp-frnt` saja. **Backend `dprd` tidak disentuh.** |
| Perubahan | 23 file (10 ditambah, 11 diubah, 2 dihapus) |
| Status | `yarn typecheck` bersih, `yarn build` sukses, login terverifikasi masuk |

---

## 1. Ringkasan

Sebelumnya aplikasi adalah dashboard cloud storage **“Yudit Cloud”** bertema **gelap**
dengan glassmorphism, gradien indigo–cyan, dan efek glow — gaya “template dashboard SaaS”.
Fitur utamanya menjelajah file & Google Drive.

Sesudahnya aplikasi menjadi **“Arsip Digital — Bagian Persidangan DPRD Kabupaten
Kuningan”**: tema **terang hangat**, datar (tanpa gradien/glass/glow), dan **pencarian
arsip sebagai fokus utama**. Struktur navigasi kini dipisah per peran: **Pegawai**
(mencari/melihat/mengunduh) dan **Admin** (mengelola & mengunggah).

---

## 2. Perbandingan langsung

| Aspek | Sebelum | Sesudah |
|---|---|---|
| Identitas | “Yudit**Cloud**”, ikon awan | “Arsip Digital”, ikon arsip |
| Tagline | “Satu cloud virtual, banyak Google Drive di belakangnya” | “Bagian Persidangan DPRD Kabupaten Kuningan” |
| Tema | Gelap (dipaksa `class="dark"`) | Terang hangat (off-white) |
| Gaya permukaan | Glassmorphism + gradien + glow | Datar, pemisah lewat tone & border tipis |
| Warna primer | Indigo `oklch(0.62 0.21 266)` | Muted navy `#1e3a5f` |
| Aksen | Cyan/indigo gradien | Muted teal `#0f766e`, dipakai hemat |
| Navigasi | My Files · Per Bulan · Statistik · Google Drive | Peran Pegawai: Arsip · Profil — Peran Admin: Ringkasan · Semua Arsip · Unggah · Aktivitas · Penyimpanan · Profil |
| Halaman pendarat | “My Files” (file manager) | “Arsip Digital” (pencarian arsip) |
| Statistik | 2 kartu + 3 grafik (recharts) | Ringkasan: 4 metrik nyata + daftar dokumen terbaru + kategori + status penyimpanan |
| Tabel data | Daftar baris file | Tabel arsip (kolom kondisional, pagination, chips filter) |
| Unggah | Tombol kecil di topbar | Halaman khusus: drag-and-drop, antrean, kategori per file, progress, retry |
| Peran | Tidak ada | Pemisahan UI Pegawai vs Admin (role switch) |
| Bahasa UI | Campur Inggris/Indonesia | Indonesia konsisten |
| Ikon | Lucide (ikon awan, dsb.) | Lucide (arsip, dokumen, peran) — konsisten |

---

## 3. Tema & token warna

**Sebelum** (dark + dekoratif): `layout.tsx` memaksa `<html class="dark">`, sidebar
`oklch(0.19 ...)`, latar berlapis `ambient glow`, `y-grid-pattern`, teks judul bergradien
(`y-gradient-text`), permukaan `y-glass`, dan bayangan glow.

**Sesudah** (terang, datar, hangat):

| Token | Nilai | Fungsi |
|---|---|---|
| `--y-bg` | `#faf7f2` | Latar utama off-white hangat |
| `--y-bg-elev` | `#ffffff` | Kartu / permukaan |
| `--y-text` | `#292524` | Teks utama (charcoal) |
| `--y-text-dim` | `#78716c` | Teks sekunder |
| `--y-primary` | `#1e3a5f` | Muted navy (aksi utama) |
| `--y-accent` | `#0f766e` | Muted teal (aksen terbatas) |
| `--y-border` | `#e5ded2` | Border tipis |
| `--y-success / warn / danger` | `#15803d / #b45309 / #b91c1c` | Status |

Nama kelas lama (`y-glass`, `y-glass-strong`, `y-gradient-brand`, `yudit-ambient`, dst.)
**dipertahankan** agar komponen lama tetap jalan, tetapi kini hanya menghasilkan warna flat
— bukan gradien/glass. Ditambah utilitas `.tnum` (angka tabular) dan focus ring navy yang
jelas.

---

## 4. Navigasi & peran

| | Sebelum | Sesudah |
|---|---|---|
| Jenis | Nav tunggal, 4 menu | Nav per peran |
| Pegawai | — | **Arsip**, **Profil** |
| Admin | — | **Ringkasan**, **Semua Arsip** (+tab “Per bulan”), **Unggah Dokumen**, **Aktivitas**, **Penyimpanan**, **Profil** |
| Topbar | Judul halaman + tombol unggah | Breadcrumb + tombol “Unggah” (khusus admin) |
| Peran | Tidak ada konsep peran | Role switch level UI (default Pegawai) |

> Catatan keamanan: pemisahan ini **hanya tampilan**. Backend belum menyediakan field
> `role`, sehingga hak akses final tetap **wajib** diperiksa di backend (lihat §8).

---

## 5. Halaman: sebelum → sesudah

| Sebelum | Sesudah | Keterangan |
|---|---|---|
| `files-view.tsx` (544 baris) | `arsip/arsip-view.tsx` + `archive-filters.tsx` + `archive-table.tsx` | Dipisah jadi komponen reusable; ditambah chips filter aktif, reset, jumlah hasil, pagination, kolom kondisional |
| `stats-view.tsx` (248 baris, 3 grafik) | `arsip/ringkasan-view.tsx` | Grafik diganti metrik ringkas + daftar, sesuai arahan brief (hindari grafik yang tidak menunjang tugas) |
| `monthly-view.tsx` | tetap, kini jadi tab “Per bulan” di Semua Arsip (admin) | Tidak ada fitur hilang |
| `drives-view.tsx` | tetap, jadi menu “Penyimpanan” | Tidak ada fitur hilang |
| `login-view.tsx` | `login-view.tsx` (reskin) | Brand baru, **tampil/sembunyikan password**, pesan error dari backend, animasi framer-motion dihapus |
| — | `arsip/unggah-view.tsx` (baru) | Drag-and-drop, antrean, kategori per file, validasi tipe/ukuran, progress, retry |
| — | `arsip/aktivitas-view.tsx` (baru) | State jujur “belum terintegrasi” (bukan log palsu) |
| — | `arsip/profil-view.tsx` (baru) | Info akun, pilih peran, keluar |

Komponen bersama baru: `page-header.tsx` (judul + deskripsi + aksi) dan `state-views.tsx`
(loading skeleton, empty state, error state, badge data demo).

---

## 6. Daftar file

**Ditambah (9):** `src/components/arsip/` → `page-header`, `state-views`, `archive-filters`,
`archive-table`, `arsip-view`, `ringkasan-view`, `unggah-view`, `aktivitas-view`,
`profil-view`. Plus `yarn.lock` (lihat §9).

**Diubah (11):** `src/app/globals.css` (tema), `src/app/layout.tsx` (hapus paksa dark),
`src/components/yudit/{sidebar,topbar,yudit-cloud}.tsx`, `src/components/yudit/views/login-view.tsx`,
`src/lib/yudit/{store,types}.ts`, `src/lib/api/client.ts`, `next.config.ts`, `.gitignore`.

**Dihapus (2):** `src/components/yudit/views/files-view.tsx`, `src/components/yudit/views/stats-view.tsx`
— fungsinya pindah ke halaman arsip & ringkasan, bukan dihilangkan.

---

## 7. Fitur lama yang tetap utuh

Modal preview dokumen, modal bagikan (share), pengelola kategori, halaman & OAuth Google
Drive, tampilan arsip per bulan, dialog konfirmasi, overlay progress upload, dan seluruh
aksi store (login, logout, fetch files/drives/categories, upload, delete, share).

---

## 8. Belum terintegrasi / butuh dukungan backend

Ini **bukan** bug frontend — endpoint-nya memang belum ada di backend:

| Kebutuhan UI | Status backend | Perlakuan di UI |
|---|---|---|
| Halaman Aktivitas (riwayat) | Belum ada endpoint | Ditampilkan sebagai “belum terintegrasi” |
| Peran resmi + halaman Pengguna | Belum ada field `role` / `/users` | Role switch hanya tampilan; halaman Pengguna tidak dibuat |
| Nomor surat & tanggal dokumen | Belum ada kolomnya | Form disiapkan tapi `disabled` + label “segera” |
| Refresh token JWT | Hanya access token di `localStorage` | Belum diperbaiki |
| CORS `localhost` | Hanya origin produksi diizinkan | Diatasi proxy dev (lihat §9) |

---

## 9. Perbaikan non-visual (sekalian)

1. **Proxy dev anti-CORS.** Request dari `localhost` dulu diblokir CORS. Ditambah rewrite
   `/api/be/*` → backend di `next.config.ts`, diaktifkan lewat `NEXT_PUBLIC_USE_PROXY=true`
   di `.env.local`. Di produksi (Vercel) tetap langsung ke backend.
   *Alternatif yang lebih bersih: minta `http://localhost:3000` ditambahkan ke CORS backend.*
2. **Email/username di-`trim()`** saat login/daftar, mencegah 401 karena spasi tak sengaja.
3. **Pesan error jujur.** Login/daftar kini menampilkan pesan asli backend, bukan tebakan
   generik.
4. **`yarn.lock` ditambahkan.** Sebelumnya dihapus, padahal `vercel.json` memakai
   `--frozen-lockfile` — tanpa lockfile build bisa gagal.
5. **File tooling tidak ikut repo.** `.agents/`, `AGENTS.md`, `skills-lock.json`
   dimasukkan ke `.gitignore`.

---

## 10. Cara menjalankan & testing

```powershell
cd "D:\Kerja Praktek\kp-frnt"
yarn install      # kalau node_modules belum ada
yarn dev          # http://localhost:3000
```

`.env.local` (tidak ikut ter-commit):

```
NEXT_PUBLIC_API_URL=https://web-production-c8591.up.railway.app
NEXT_PUBLIC_USE_PROXY=true   # dev-only, agar bebas CORS
```

> ⚠️ Backend yang tersambung adalah **produksi (Railway)**. Upload/hapus/ubah kategori saat
> testing akan **benar-benar mengubah data asli** — pakai file dummy dan hapus kembali.

Urutan pengecekan yang disarankan: Login → Arsip (search, filter, preview, unduh) →
switch ke Admin → Ringkasan → Semua Arsip (+tab Per bulan) → Unggah (file dummy kecil) →
Profil (keluar & masuk lagi).

---

## 11. Catatan keputusan

- **Data demo tidak dipakai.** Semua yang tampil berasal dari API. Tidak ada mock yang
  disamarkan sebagai data asli.
- **Tab “Daftar” di halaman login dipertahankan** (backend mendukung `/auth/register`).
  Brief meminta registrasi publik dihilangkan; instruksi “jangan hilangkan fitur” diutamakan.
- **Backend tidak diubah sama sekali** — seluruh perubahan ada di folder frontend.
