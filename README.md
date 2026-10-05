# ⚡ PREHUNT — Berburu Preset Alight Motion Lewat URL

Web app untuk nyari **link preset Alight Motion (5MB & XML)** secara otomatis dari sebuah URL video.
Tempel link **TikTok, YouTube, atau Instagram** → deskripsi, bio, komentar, sampai **balasan** di-scan
otomatis → link preset langsung nongol. Gratis, tanpa login, tanpa iklan.

> Desain: **neo-brutalism halus** — border tebal, hard shadow, warna tajam (acid lime × hot pink × cyan di atas cream),
> penuh animasi halus, tipografi Archivo Black × Space Grotesk × Space Mono (self-hosted).

---

## ✨ Fitur

| Fitur | Detail |
| --- | --- |
| 🔍 Auto-scan | Deskripsi + bio + komentar + **balasan** di-scan satu-satu |
| 🎯 2 tipe preset | Link **5MB** (alightcreative.com) & **XML** (Google Drive / file .xml langsung) |
| 🏷️ Nama asli preset | Judul halaman share Alight Motion & nama file Drive diambil otomatis |
| 📱 3 platform | TikTok (termasuk short link `vt.tiktok.com`), YouTube (`watch`, `youtu.be`, `shorts`), Instagram (`/p/`, `/reel/`) |
| 🖼️ Info video | Thumbnail, avatar, views/likes/komentar dengan animasi count-up |
| 🔗 Hasil bisa di-share | URL hasil (`?url=...`) otomatis nampilin hasil yang sama saat dibuka |
| 🌐 API publik | `GET /api/hunt?url=...` — JSON, siap dipakai siapa aja |
| 🛡️ Aman | Tanpa login, tanpa tracking, gambar di-proxy biar nggak bocorkan IP user |

## 🧰 Stack

- **Next.js 14** (App Router, React 18) — JavaScript, tanpa dependensi selain Next & React
- **CSS murni** (`app/globals.css`) — tanpa framework CSS, semua animasi & tema di satu file
- Font self-hosted di `public/fonts/` — nggak ada request ke Google Fonts saat runtime

## 🚀 Jalanin di lokal

```bash
npm install
npm run dev
# buka http://localhost:3000
```

## ☁️ Deploy ke Vercel

**Cara 1 — lewat GitHub (rekomendasi):**

1. Push folder ini ke repo GitHub baru.
2. Buka [vercel.com/new](https://vercel.com/new) → import repo-nya.
3. Framework **Next.js** terdeteksi otomatis → langsung tekan **Deploy**. Selesai — nggak perlu setting apa pun.

**Cara 2 — lewat CLI:**

```bash
npm i -g vercel
cd prehunt
vercel          # preview
vercel --prod   # production
```

Nggak ada environment variable yang dibutuhin. Semua scraping jalan di API Route serverless
(`app/api/hunt/route.js`, Node.js runtime, `maxDuration 60`).

## 🌐 API

```
GET /api/hunt?url=<URL video>
GET /api/hunt?url=<URL video>&fresh=1   # lewati cache
```

Respons sukses:

```json
{
  "ok": true,
  "platform": "tiktok",
  "video": { "title": "...", "cover": "...", "author": { "username": "..." }, "stats": { "views": 210546 } },
  "presets": [
    { "type": "5mb", "name": "...", "url": "https://alightcreative.com/am/share/...", "source": { "kind": "balasan", "user": "@..." } },
    { "type": "xml", "name": "...", "size": "64.2 kB", "url": "https://drive.google.com/file/d/...", "source": { "kind": "komentar" } }
  ],
  "scanned": { "comments": 58, "replies": 6, "notes": [] },
  "took": "4.2"
}
```

Respons gagal: `{ "ok": false, "error": "pesan error dalam bahasa Indonesia" }`

## ⚠️ Catatan teknis & batasan

- **TikTok**: meta & komentar utama via API publik tikwm (rate limit ±1 req/detik — sudah diatur otomatis).
  Komentar + **balasan** tambahan diambil dari halaman SEO TikTok (versi crawler). Sebagian balasan memang
  tidak dirender TikTok — kalau hasil kosong, UI bakal ngasih saran.
- **YouTube**: deskripsi dari watch page; komentar + balasan via inner tube API (internal YouTube),
  dibatasi ±7 permintaan lanjutan biar cepat.
- **Instagram**: hanya caption yang bisa dibaca — Instagram menutup akses komentar untuk pihak ketiga.
- Kalau upstream (tikwm/YouTube/IG) berubah struktur, tinggal edit file terkait di `lib/`.

## 🎨 Kustomisasi

- **Nama brand**: cari-ganti `PREHUNT` di `components/Nav.jsx`, `Home.jsx`, `Footer.jsx`, dan `app/layout.js`.
- **Warna & tema**: ubah CSS variables di paling atas `app/globals.css` (`--lime`, `--pink`, `--paper`, dll).
- **Kecepatan animasi**: ubah `--ease-pop` / durasi di keyframes bagian bawah `globals.css`.

## 📁 Struktur

```
prehunt/
├── app/
│   ├── api/hunt/route.js   ← mesin pencarian preset (platform detection + scan + enrich)
│   ├── api/img/route.js    ← proxy gambar (avatar/thumbnail) dengan allowlist host
│   ├── globals.css         ← seluruh design system brutalist + animasi
│   ├── layout.js           ← metadata & font
│   └── page.js
├── components/             ← UI (form, panel hasil, steps, fitur, FAQ, footer, ikon SVG)
├── lib/
│   ├── detect.js           ← deteksi platform & ekstraksi ID dari URL
│   ├── scan.js             ← regex penangkap link 5MB & XML
│   ├── tiktok.js           ← tikwm + parsing halaman SEO TikTok (komentar & balasan)
│   ├── youtube.js          ← watch page + inner tube (komentar & balasan)
│   ├── instagram.js        ← og:tags via user-agent crawler
│   └── enrich.js           ← ambil nama preset (judul Alight Motion / nama file Drive)
└── public/fonts/           ← woff2 self-hosted
```
