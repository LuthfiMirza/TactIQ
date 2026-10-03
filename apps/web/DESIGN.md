# 🎨 TactIQ UI Design System Specification (`DESIGN.md`)

> **Single Source of Truth (SSOT)** untuk seluruh antarmuka dan token visual aplikasi TactIQ.  
> Digunakan oleh Front-End Engineer dan AI Agents agar tampilan konsisten, profesional, dan bebas dari inkonsistensi warna/gaya.

---

## 1. Core Philosophy & Visual Language

TactIQ adalah **platform analitik taktis sepak bola bertenaga AI** dengan standar broadcast telemetry (seperti Opta, StatsBomb, Hudl).

Prinsip desain:
- **High Contrast & Matte Dark**: Dominan canvas gelap pekat (`#0A0A0C` / `#121215`) dengan hairline borders tipis (`#27272A`).
- **Signature Accent — Neon Lime (`#CEFF00` / `lime-400`)**: Aksen utama untuk semua status aktif, tab yang dipilih, filter aktif, CTA, dan telemetry highlight.
- **Zero Gradient Slop**: Tidak ada gradient pelangi atau drop-shadow ungu/biru generik. Semua surface bersifat flat/solid matte dengan kontras tinggi.
- **Readability & Contrast First**: Teks di atas background `lime-400` **WAJIB** berwarna gelap (`text-black font-extrabold`).

---

## 2. Color Tokens

### 2.1 Accent Colors (Brand Identity)
| Token Name | Hex Code | Tailwind Equivalent | Penggunaan Utama |
| :--- | :--- | :--- | :--- |
| **TactIQ Lime** (Telemetry Accent) | `#CEFF00` | `lime-400` / `tactiq-lime` | **Garis telemetri, live indicator dot, rank #1 highlight, subtle outline hover** *(BUKAN background pill badge)* |
| **TactIQ Lime Subtle / Tint** | `rgba(206, 255, 0, 0.12)` | `bg-lime-400/10` / `border-lime-400/30` | Selected card highlight, border accent, subtle badge outline |
| **TactIQ Live Emerald** | `#10B981` | `emerald-500` / `emerald-400` | Status pertandingan sedang berlangsung (LIVE indicator & ping dot) |
| **TactIQ Alert / Danger** | `#EF4444` | `red-500` / `rose-500` | Kartu merah, status delay/batal, metrik heat-loss |
| **TactIQ Secondary Cyan** | `#00D2FF` | `cyan-400` | xG telemetry tim tamu (away metric), cool telemetry |

### 2.2 Neutral Canvas & Surfaces
| Surface Level | Hex Code | Tailwind Equivalent | Penggunaan |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `#0A0A0C` | `bg-[#0A0A0C]` | Background utama halaman web |
| **Card / Container (Level 1)** | `#121215` | `bg-[#121215]` | Panel scoreboard, match card, navigation bar |
| **Elevated Surface (Level 2)** | `#18181C` | `bg-[#18181C]` | Inner card, input search, chip container, dropdown |
| **Active Neutral Surface** | `#27272A` / `#222228` | `bg-zinc-800` | **Status aktif untuk tab, filter, date switcher, dan navigation pills** |
| **Subtle Hover (Level 3)** | `#222227` | `hover:bg-[#222227]` | State hover pada baris tabel & list pertandingan |
| **Hairline Border** | `#27272A` | `border-[#27272A]` | Garis pemisah, card border, divider (1px solid) |

### 2.3 Typography & Text Colors
| Role | Class / Hex | Penggunaan |
| :--- | :--- | :--- |
| **Primary Text** | `text-white` (`#FFFFFF`) | Judul, skor, nama tim, nilai statistik utama |
| **Secondary Text** | `text-zinc-400` (`#A1A1AA`) | Venue, tanggal, posisi liga, label deskriptif |
| **Muted Text** | `text-zinc-500` / `text-zinc-600` | Placeholder, divider slash, info sekunder |
| **Monospace Stats** | `font-mono tabular-nums` | Waktu menit (e.g. `68'`), skor (e.g. `2 - 1`), xG telemetry |

---

## 3. UI Component Patterns

### 3.1 Active Navigation & Filter Pills (Matte Dark Neutral — DILARANG Pill Badge Neon!)
Semua pill switcher (Date switcher: Yesterday/Today/Tomorrow, Status switcher: All/Live/Scheduled, League selector tabs) **WAJIB** menggunakan kontras netral gelap berkelas (*Matte Dark Neutral*). **DILARANG** menggunakan background neon pekat (`bg-lime-400` / `bg-[#CEFF00]`) yang silau dan merusak hierarki visual.

```tsx
// ✅ BENAR — Standar TactIQ Matte Dark Neutral
<button
  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
    isActive
      ? 'bg-zinc-800 text-white font-bold border border-zinc-700/60 shadow-xs'
      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
  }`}
>
  Premier League
</button>

// ❌ SALAH — Dilarang menggunakan pill badge neon solid!
<button className="bg-lime-400 text-black font-extrabold">...</button> // Silau & polusi visual!
<button className="bg-indigo-600 text-white">...</button> // Bukan palet TactIQ
```

### 3.2 Live In-Play Badge
Untuk match yang sedang live:
```tsx
<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
  <span className="relative flex h-1.5 w-1.5">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
  </span>
  LIVE 68'
</span>
```

### 3.3 Match Cards & Selection Rail
Match card yang aktif atau terpilih di sidebar rail:
```tsx
<button
  className={`w-full text-left p-3 rounded-xl border transition-all ${
    isSelected
      ? 'bg-lime-400/10 border-lime-400/50 shadow-xs'
      : 'bg-[#121215] border-[#27272A] hover:border-zinc-700 hover:bg-[#16161A]'
  }`}
>
  ...
</button>
```

### 3.4 Standings Table Rank #1 Highlight
Pemuncak klasemen liga mendapatkan aksen TactIQ Lime:
```tsx
<span className={`font-mono text-xs ${row.rank === 1 ? 'text-lime-400 font-extrabold' : 'text-zinc-300 font-bold'}`}>
  {row.rank}
</span>
```

---

## 4. Page Architecture & Routing Contract

| Rute | Nama Layanan | Tanggung Jawab & Konten |
| :--- | :--- | :--- |
| **`/`** | **Matches Hub** | Jelajahi seluruh jadwal pertandingan (Kemarin, Hari Ini, Besok), filter liga Top 5 Eropa (PL, La Liga, Serie A, Bundesliga, Ligue 1), filter Live/Upcoming, dan featured live showcase. Semua kartu match klik menuju Match Center. |
| **`/match-center`** | **Match Center Deep Dive** | Analisis taktis mendalam untuk 1 match terpilih: Scoreboard hero broadcast, visualisasi 2D Pitch Lineup, Telemetry xG & Shot Map, Head-to-Head, dan klasemen liga dinamis. |

---

## 5. Do's and Don'ts Checklist

- ✅ **DO** gunakan Matte Dark Neutral (`bg-zinc-800 text-white font-bold border border-zinc-700/60 shadow-xs`) untuk active pill switcher, tab navigasi, dan tombol sekunder.
- ✅ **DO** gunakan `text-lime-400` / `#CEFF00` untuk telemetry line, highlight metrik terbaik, live dot, atau data series chart.
- ✅ **DO** gunakan `bg-[#121215]` dan `border-[#27272A]` untuk struktur card.
- ❌ **DON'T** gunakan solid neon pill badge/button (`bg-lime-400 text-black` / `bg-[#CEFF00]`) yang silau dan merusak hierarki visual.
- ❌ **DON'T** mencampur warna aksen aktif (misal sebagian indigo `#5e6ad2`, sebagian hijau tua, sebagian lime).
- ❌ **DON'T** menambahkan badge "DEMO" / "DEMO MATCH". Gunakan label broadcast resmi: "TactIQ Predictive Model" atau "TactIQ AI Engine".
