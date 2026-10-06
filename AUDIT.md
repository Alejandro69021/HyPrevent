# AUDIT.md — HyPrevent Codebase Audit (FASE 0)

Tanggal audit: 2026-10-06
Sumber: hanya file di repo, bukan asumsi. "Tidak ditemukan" = tidak ada file/fitur tersebut di repo.

---

## 1. Framework, Router, Struktur Folder, Dependensi

| Aspek | Fakta |
|---|---|
| Framework UI | React 19.2.4, JSX |
| Bundler | Vite 7.3.1 |
| CSS | Tailwind CSS v4.2.1 (`@tailwindcss/vite`) + vanilla CSS (`src/index.css`, 40 500 byte) |
| Router | **Tidak ada library router.** Navigasi SPA lewat state `activePage` di `src/App.jsx`. Halaman dirender kondisional di `renderContent()`. |
| State management | React `useState` lokal. Tidak ada Redux/Zustand/Context global. |
| Bahasa | JavaScript (ESM, `"type": "module"`). Tidak ada TypeScript. |
| Backend (lokal) | Express 4.21.2 di `server/index.js`, port 3001. Vite proxy `/api` -> `localhost:3001` saat dev. |
| Netlify Functions | `netlify/functions/chat.js`, `netlify/functions/calendar-status.js` |
| Image processing | `sharp` v0.34.5 (devDependency) — tidak ditemukan pemakaiannya di kode src |
| AI SDK | `@google/genai` v1.0.0 (Gemini) |
| Google API | `googleapis` v148.0.0 (Calendar OAuth2) |
| Serverless wrapper | `serverless-http` v4.0.0 (dependency di package.json, tidak ditemukan pemakaiannya) |
| Env loader | `dotenv` v16.4.7 |
| CORS | `cors` v2.8.5 |

### Struktur folder penting

```
HyPrevent/
├─ index.html            (entry HTML utama)
├─ jadwal.html           (6 KB, HTML statis — multi-page entry)
├─ smart-workout-scheduler.html (27 KB, HTML statis — multi-page entry)
├─ vite.config.js        (3 entry: main, jadwal, scheduler)
├─ netlify.toml
├─ package.json
├─ .env                  (berisi API key nyata, lihat bagian 4)
├─ .env.example
├─ public/               (favicon, logo, manifest)
├─ src/
│  ├─ main.jsx
│  ├─ App.jsx
│  ├─ index.css          (40 KB)
│  ├─ components/
│  │  ├─ IntroSection.jsx    (home — dipakai App.jsx)
│  │  ├─ Home.jsx            (home versi lain — TIDAK diimpor di App.jsx)
│  │  ├─ ModuleSection.jsx   (modul 1-3 — dipakai App.jsx)
│  │  ├─ ModuleLayout.jsx    (layout modul alternatif — TIDAK diimpor di App.jsx)
│  │  ├─ StepIllustration.jsx(SVG ilustrasi — dipakai oleh ModuleLayout.jsx)
│  │  ├─ StepperTabs.jsx     (stepper alternatif — TIDAK diimpor di App.jsx)
│  │  ├─ ReferensiSection.jsx
│  │  ├─ JadwalSection.jsx   (chatbot AI)
│  │  ├─ AIMotionSection.jsx (48 KB, pose detection)
│  │  └─ Sidebar.jsx
│  ├─ data/
│  │  └─ modules.js      (data 3 modul)
│  └─ utils/
│     └─ jadwalParser.js (17 KB, parser teks jadwal)
├─ server/
│  ├─ index.js           (Express entry)
│  ├─ routes/chat.js     (POST /api/chat)
│  ├─ routes/calendar.js (OAuth2 flow)
│  ├─ services/gemini.js (Gemini SDK wrapper)
│  └─ services/calendar.js (Google Calendar SDK)
└─ netlify/functions/
   ├─ chat.js            (Netlify Function: Gemini chat)
   └─ calendar-status.js (selalu return {connected: false})
```

### File yang ada di repo tapi TIDAK diimpor oleh App.jsx

- `Home.jsx` — versi alternatif home pakai Tailwind classes, tidak dipakai
- `ModuleLayout.jsx` — layout modul dengan stepper dots dan ilustrasi SVG, tidak dipakai
- `StepIllustration.jsx` — diimpor oleh ModuleLayout.jsx saja
- `StepperTabs.jsx` — tidak diimpor di mana pun
- `jadwal.html` dan `smart-workout-scheduler.html` — file HTML statis multi-page entry di vite.config.js, bukan bagian SPA React

---

## 2. Daftar Halaman/Rute dan File Komponen

| activePage | Komponen | File |
|---|---|---|
| `home` | `IntroSection` | `src/components/IntroSection.jsx` |
| `modul-1` | `ModuleSection` | `src/components/ModuleSection.jsx` + `src/data/modules.js` |
| `modul-2` | `ModuleSection` | sama |
| `modul-3` | `ModuleSection` | sama |
| `ai-motion` | `AIMotionSection` | `src/components/AIMotionSection.jsx` |
| `jadwal` | `JadwalSection` | `src/components/JadwalSection.jsx` |
| `referensi` | `ReferensiSection` | `src/components/ReferensiSection.jsx` |
| fallback | `IntroSection` | (default jika tidak cocok) |

Menu sidebar (Sidebar.jsx): Home, Modul 1: Penjelasan, Modul 2: Pantangan, Modul 3: Olahraga, Praktik Gerakan HyPrevent, Jadwal Latihan, Referensi.

---

## 3. Semua Tempat yang Memanggil Backend/API

| File | Baris | Panggilan | Tujuan |
|---|---|---|---|
| `JadwalSection.jsx` | 81 | `fetch('/api/calendar/status?sessionId=...')` | Cek status OAuth Calendar |
| `JadwalSection.jsx` | 97 | `fetch('/api/chat', { method: 'POST', ... })` | Kirim pesan ke Gemini |
| `JadwalSection.jsx` | 147 | `fetch('/api/calendar/create-event', { method: 'POST', ... })` | Buat event Calendar |
| `AIMotionSection.jsx` | — | **Tidak ada fetch/XHR** | Semua pemrosesan lokal di browser |

### Backend routes

- `server/routes/chat.js` -> POST `/api/chat`
- `server/routes/calendar.js` -> GET `/api/calendar/auth`, GET `/api/calendar/callback`, GET `/api/calendar/status`, POST `/api/calendar/create-event`

### Netlify Functions

- `netlify/functions/chat.js` -> dipetakan via netlify.toml: `/api/chat` -> `/.netlify/functions/chat`
- `netlify/functions/calendar-status.js` -> `/api/calendar/status` -> selalu return `{ connected: false }`

### Error developer bocor ke pengguna

- `JadwalSection.jsx:106` — `throw new Error('Backend server belum jalan. Jalankan perintah: npm run server')`
- `JadwalSection.jsx:127` — string sama ditampilkan langsung ke pengguna di chat area

### Proxy dev

- `vite.config.js:12-17` — proxy `/api` -> `http://localhost:3001` saat dev

---

## 4. Variabel Lingkungan

### .env (ada di disk lokal, TIDAK di-track git — .gitignore berisi `.env`)

```
GEMINI_API_KEY=<REDACTED — kunci nyata ada di file>
GOOGLE_CLIENT_ID=your_google_oauth_client_id (placeholder)
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret (placeholder)
GOOGLE_REDIRECT_URI=http://localhost:3001/api/calendar/callback
```

### .env.example

Isi sama tapi `GEMINI_API_KEY=your_gemini_api_key_here`.

### Risiko

- Tidak ada variabel berawalan `VITE_` (bagus — tidak ada rahasia di bundle frontend).
- `GEMINI_API_KEY` dipakai oleh `server/services/gemini.js` dan `netlify/functions/chat.js` (via `process.env`).
- `.env` tidak di-track git. Namun kunci nyata ada di disk. **Pemilik harus merotasi kunci ini.**

---

## 5. Library Deteksi Pose/Tangan

| Aspek | Detail |
|---|---|
| Library | MediaPipe Tasks Vision (via CDN) |
| Versi | 0.10.14 |
| Sumber modul JS | `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm` |
| Sumber WASM | `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm` |
| Model pose | `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task` |
| Model tangan | `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task` |
| Dimuat dari | CDN pihak ketiga (jsdelivr + Google Storage) |
| Disimpan lokal? | Tidak |

### Apakah frame/gambar dikirim ke jaringan?

Tidak ditemukan `fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, atau panggilan jaringan lain di `AIMotionSection.jsx` (48 KB, 904 baris). Pemrosesan pose dan tangan terjadi sepenuhnya di browser menggunakan WASM MediaPipe yang dimuat dari CDN.

**Klaim privasi** (AIMotionSection.jsx:897): "Kamera hanya berjalan di browser Anda — tidak ada video yang dikirim ke server." — **Secara teknis benar** untuk frame video. Model dimuat dari CDN saat pertama kali, yang berarti browser membuat HTTP request ke jsdelivr dan Google Storage untuk mengunduh model (bukan mengirim video). Klaim perlu diperjelas bahwa model dimuat dari CDN pihak ketiga.

---

## 6. Sumber Gambar dan Video

### Gambar (dari modules.js — dimuat langsung dari Pexels)

| Modul | Langkah | URL | Alt | Kredit/Lisensi |
|---|---|---|---|---|
| Modul 1 | Memahami Hipertensi | pexels-photo-4386467.jpeg | "Memahami Hipertensi" | Pexels (lisensi bebas) — tidak ada atribusi eksplisit |
| Modul 1 | Pemeriksaan Rutin | pexels-photo-4386466.jpeg | "Pentingnya Pemeriksaan Rutin" | Pexels |
| Modul 1 | Pola Makan Sehat | pexels-photo-1640777.jpeg | "Pola Makan Sehat untuk Jantung" | Pexels |
| Modul 1 | Mengelola Stres | pexels-photo-3822622.jpeg | "Mengelola Stres & Istirahat" | Pexels |
| Modul 2 | Pantangan Makanan | pexels-photo-1640774.jpeg | "Pantangan Makanan" | Pexels |
| Modul 2 | Kafein, Rokok, Alkohol | pexels-photo-1537635.jpeg | "Kafein, Rokok, dan Alkohol" | Pexels — foto pizza + anggur (menormalkan alkohol) |
| Modul 2 | Makanan Berlemak | pexels-photo-1279330.jpeg | "Makanan Berlemak Jenuh" | Pexels |
| Modul 2 | Menjaga Konsistensi | pexels-photo-4498362.jpeg | "Menjaga Konsistensi" | Pexels |
| Modul 3 | Manfaat Olahraga | pexels-photo-2294361.jpeg | "Manfaat Olahraga Teratur" | Pexels |
| Modul 3 | Jalan Kaki | pexels-photo-4498606.jpeg | "Jalan Kaki & Jogging Ringan" | Pexels |
| Modul 3 | Yoga | pexels-photo-3822906.jpeg | "Yoga & Latihan Pernapasan" | Pexels |
| Modul 3 | Membuat Jadwal | pexels-photo-4498220.jpeg | "Membuat Jadwal Olahraga" | Pexels |

- Semua dimuat dari `images.pexels.com` dengan parameter `?auto=compress&cs=tinysrgb&w=800`
- Ukuran: tidak diketahui pasti (dimuat via CDN, w=800), diperkirakan 50-200 KB per gambar
- Tidak ada gambar lokal di `src/` atau `public/` selain logo
- Alt text: hanya judul langkah, bukan deskriptif
- Tidak ada format WebP/AVIF
- `loading="lazy"` ada di ModuleSection.jsx:68

### Video YouTube

| Lokasi | URL | ID Video | Konten |
|---|---|---|---|
| IntroSection.jsx:20 (Home) | youtube.com/embed/0CvPzjJ9w0Q | 0CvPzjJ9w0Q | Belum diverifikasi |
| Home.jsx:22 (tidak dipakai) | youtu.be/0CvPzjJ9w0Q | 0CvPzjJ9w0Q | Sama |
| modules.js:10 (Modul 1) | youtube.com/embed/dQw4w9WgXcQ | dQw4w9WgXcQ | **Rick Astley — Never Gonna Give You Up (Rickroll)** |
| modules.js:63 (Modul 2) | youtube.com/embed/dQw4w9WgXcQ | dQw4w9WgXcQ | **Rickroll (sama)** |
| modules.js:117 (Modul 3) | youtube.com/embed/dQw4w9WgXcQ | dQw4w9WgXcQ | **Rickroll (sama)** |

- Semua 3 modul video adalah placeholder Rickroll
- Dimuat langsung sebagai `<iframe>`, bukan lazy-loaded, tidak pakai `youtube-nocookie.com`
- YouTube memuat pelacak pihak ketiga saat iframe dimuat

### Logo

- `public/HyPrevent.png` — 389 KB, dipakai di sidebar dan AIMotionSection
- Favicon set lengkap di `public/` (ico, png 16/32/48, apple-touch-icon, android-chrome 192/512)

---

## 7. Isi index.html

| Tag | Ada? | Nilai |
|---|---|---|
| `<html lang="id">` | Ya | `id` |
| `<title>` | Ya | "HyPrevent — Cegah Hipertensi, Mulai Sekarang" (45 karakter) |
| `<meta name="description">` | Ya | "HyPrevent — Panduan lengkap pencegahan hipertensi untuk segala usia..." — klaim "segala usia" dan "panduan lengkap" |
| `<meta charset>` | Ya | UTF-8 |
| `<meta name="viewport">` | Ya | `width=device-width, initial-scale=1.0` |
| `<meta name="theme-color">` | Ya | `#1a2744` |
| Open Graph tags | **Tidak** | Tidak ada og:title, og:description, og:image, og:type, og:url |
| Twitter Card tags | **Tidak** | Tidak ada |
| `<link rel="canonical">` | **Tidak** | Tidak ada |
| Favicon | Ya | ico + png 16/32/48 + apple-touch-icon |
| Manifest | Ya | `site.webmanifest` |
| Font | Ya | Inter (300-800) dari Google Fonts, dengan preconnect |

---

## 8. Netlify Config

### netlify.toml

```toml
[build]
  command = "npm run build"
  publish = "dist"

[functions]
  node_bundler = "esbuild"

[[redirects]]
  from = "/api/chat"
  to = "/.netlify/functions/chat"
  status = 200
  force = true

[[redirects]]
  from = "/api/calendar/status"
  to = "/.netlify/functions/calendar-status"
  status = 200
  force = true
```

### Yang TIDAK ada

- SPA fallback rule (`/* -> /index.html 200`) — **deep links dan refresh akan menghasilkan 404**
- `public/_redirects` — tidak ditemukan
- `public/robots.txt` — tidak ditemukan
- `public/sitemap.xml` — tidak ditemukan
- Header keamanan (CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- Halaman 404 kustom

---

## 9. Masalah Konten Medis

| Lokasi | Masalah |
|---|---|
| modules.js:14 | "130/80 mmHg atau lebih tinggi" disebut sebagai ambang hipertensi. Ini mengikuti AHA/ACC 2017, bukan Kemenkes/PERHI/WHO (>=140/90). |
| modules.js:17-21 | Klasifikasi tekanan darah memakai skala AHA/ACC (Prehipertensi 120-129, Stage 1: 130-139, Stage 2: >=140/90). Tidak ada label sumber. |
| modules.js:32 | "konsisten di atas 130/85 mmHg" — ambang tidak standar. |
| Tidak ada | Tidak ada `src/config/medical.js` — ambang tersebar di data. |
| Tidak ada | Tidak ada disclaimer medis di mana pun di SPA. |
| IntroSection.jsx:33 | "mudah dipahami oleh semua kalangan usia" — klaim sulit dipertanggungjawabkan. |

---

## 10. Masalah Lain yang Ditemukan

### Kode mati / tidak dipakai
- `Home.jsx` — tidak diimpor oleh App.jsx
- `ModuleLayout.jsx` — tidak diimpor oleh App.jsx
- `StepIllustration.jsx` — hanya diimpor oleh ModuleLayout.jsx (yang tidak dipakai)
- `StepperTabs.jsx` — tidak diimpor di mana pun
- `smart-workout-scheduler.html` — 27 KB HTML statis, entry Vite tapi bukan bagian SPA
- `jadwal.html` — 6 KB HTML statis, entry Vite tapi bukan bagian SPA
- `src/utils/jadwalParser.js` — 17 KB, tidak diimpor di mana pun
- `serverless-http` di dependencies — tidak dipakai
- `sharp` di devDependencies — tidak dipakai

### localStorage / penyimpanan
- Tidak ditemukan penggunaan `localStorage` di kode React (src/).

### Aksesibilitas
- Sidebar `<nav>` dan menu items menggunakan `<div>` + `onClick`, bukan `<button>` atau `<a>` — tidak bisa dinavigasi keyboard
- `aria-label` hanya ada di tombol hamburger mobile
- Tidak ada `aria-live` untuk status kamera atau balasan chat
- Tidak ada `prefers-reduced-motion` handling

### Footer
- "Copyright 2026 — Promosi Kesehatan" — nama tidak jelas
- "Develop by Alwafie" — typo ("Develop" -> "Developed")
- "Version 1.0 (beta)"
- Tagline "Strength to Prevent" — Bahasa Inggris, tidak konsisten dengan situs Bahasa Indonesia

---

## Ringkasan Temuan Kritis

1. **KRITIS — Video Rickroll**: Semua 3 modul memakai video placeholder Rick Astley
2. **KRITIS — Error dev bocor**: "Backend server belum jalan. Jalankan perintah: npm run server" tampil ke pengguna publik
3. **KRITIS — Ambang BP tidak konsisten**: 130/80 vs 140/90, tanpa sumber
4. **KRITIS — Tidak ada disclaimer medis**
5. **KRITIS — Tidak ada SPA fallback** di Netlify — refresh halaman = 404
6. **KRITIS — Tidak ada OG tags** — sharing di sosial media tanpa preview
7. **SEDANG — Model AI dimuat dari CDN** — dependency jaringan pihak ketiga saat runtime
8. **SEDANG — Gambar pizza + anggur** di langkah tentang rokok/alkohol
9. **SEDANG — CORS `Access-Control-Allow-Origin: *`** di Netlify Function chat
10. **SEDANG — Kode mati signifikan** — 5+ file tidak dipakai
11. **RINGAN — Logo 389 KB** — terlalu besar untuk web
12. **RINGAN — Tidak ada robots.txt dan sitemap.xml**
