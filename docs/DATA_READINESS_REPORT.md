# 📊 TactIQ — Data Readiness & System Integrity Audit Report (Fase 0)

**Date of Audit:** September 30, 2026  
**Auditor:** Senior Full-Stack & Data Engineer (TactIQ Engineering Core)  
**Scope:** Monorepo (`apps/web`, `apps/api`, `services/ml`, `packages/shared-types`)  
**Mode:** READ-ONLY Verification (No code modified)

---

## 1. Executive Summary

Audit teknis mendalam telah dilakukan terhadap seluruh lapisan sistem TactIQ untuk memeriksa kesesuaian antara **klaim produk/dokumentasi** dengan **implementasi kode nyata**.

### Temuan Utama:
1. **Status Kredensial Provider Eksternal:**
   - `FOOTBALL_DATA_TOKEN` di `.env` berstatus **INVALID** (Panggilan nyata ke `https://api.football-data.org/v4/competitions/PL/standings` menghasilkan `HTTP 400: Your API token is invalid`).
   - `API_FOOTBALL_KEY` di `.env` berstatus **INVALID** (Panggilan nyata ke `https://v3.football.api-sports.io/status` menghasilkan `HTTP 200: Error/Missing application key`).
   - `TheSportsDB` (Free Stream di `thesportsdb.com/api/v1/json/3/livescore.php?s=Soccer`) **AKTIF & BERHASIL**, namun hanya menyediakan skor dasar global tanpa detail lineup, event berbobot, atau match stats.
2. **Mekanisme Silent Fallback:**
   - Jika provider eksternal gagal atau key tidak valid, `etl.service.ts` dan `apiFootball.service.ts` secara diam-diam beralih ke data *hardcoded* (4 fixtures 2023/2024 dan 4 tim klasemen) atau generator *scripted storyline* (`liveMatchEngine.service.ts`), namun di metadata tetap mengklaim bersumber dari `"API-Football Live API"` (jika env key terdeteksi).
3. **Computer Vision & Video Tracking:**
   - Pelacakan video YouTube pada kanvas web **TIDAK menjalankan Computer Vision secara real-time pada video YouTube**. Koordinat pemain dan bola dihasilkan oleh fungsi gelombang sinus/kosinus sintetis (`Math.sin` / `Math.cos`), karena browser membatasi pembacaan frame video lintas domain (CORS / Same-Origin Policy) dari iframe YouTube.
4. **Redis Streams vs Pub/Sub:**
   - README dan badges mengklaim `Redis 7.2 Streams`. Kode nyata (`redis.service.ts` & `socket.server.ts`) menggunakan **Redis Pub/Sub standar (`subscribe`/`publish`)**, bukan Redis Streams (`XADD`/`XREADGROUP`). Implikasinya: pesan tidak dipersistenkan di memori stream dan klien yang terlambat/terputus akan kehilangan data frame.
5. **Radar 7 Sumbu & Metrik Per-90:**
   - Atribut radar (Pace, Shooting, dll.) adalah angka statis (0–100) mirip rating game FIFA/EA FC yang tersimpan di `players_fbref_500.json`.
   - Metrik per-90 di modul Scouting (SCA, Penalty Box Passes, dll.) **bukan data event mentah**, melainkan rumus matematis linier yang diskalakan dari atribut 0–100 tersebut.

---

## 2. Inventaris Sumber Data Per Fitur (Bagian 3.1)

| Modul / Fitur | Status Riil | Sumber Data | Bukti Kode (File:Baris) | Catatan Kritis & Provenance |
| :--- | :---: | :--- | :--- | :--- |
| **Home: Multi-League Live Ticker** | `HARDCODED` | Array statis lokal di client | [`apps/web/src/app/page.tsx:57-260`](file:///Applications/XAMPP/xamppfiles/htdocs/tactiq/apps/web/src/app/page.tsx#L57-L260) | Tidak ada `fetch` ke backend sama sekali. Hasil seperti *Man United 7-0 Man City (88' LIVE)* adalah konstanta di browser. |
| **Home: Match Cards & Highlight Player** | `HARDCODED` | Objek statis di array `MATCHES` | [`apps/web/src/app/page.tsx:80-84`](file:///Applications/XAMPP/xamppfiles/htdocs/tactiq/apps/web/src/app/page.tsx#L80-L84) | Rating pemain (misal B. Fernandes 9.9) adalah nilai konstan di frontend. |
| **Match Center: Hero Scoreboard** | `HARDCODED` / `SIMULATED` | State lokal default + LiveMatchEngine | [`apps/web/src/app/(modules)/match-center/page.tsx:848-893`](file:///Applications/XAMPP/xamppfiles/htdocs/tactiq/apps/web/src/app/(modules)/match-center/page.tsx#L848-L893) | Default LIV 2-1 CHE menit 74'. Jika terhubung ke socket, menerima simulasi menit bertambah otomatis. |
| **Match Center: Live Goal Scorer & Events** | `SIMULATED` | Skenario waktu tetap di API | [`apps/api/src/services/liveMatchEngine.service.ts:240-297`](file:///Applications/XAMPP/xamppfiles/htdocs/tactiq/apps/api/src/services/liveMatchEngine.service.ts#L240-L297) | Gol menit 24 (Martinelli), 41 (Irankunda), 78 (Jackson), 88 (Rice) dieksekusi berdasarkan menit internal yang berjalan. |
| **Match Center: Preset Spanyol & Custom Input** | `HARDCODED` | Konstanta objek memori di modal | [`apps/web/src/components/match-center/custom-match-modal.tsx:42-120`](file:///Applications/XAMPP/xamppfiles/htdocs/tactiq/apps/web/src/components/match-center/custom-match-modal.tsx#L42-L120) | Preset Final Euro (Spain 2-1 England) & El Clásico tersimpan di memori komponen React. |
| **Match Center: 2D Lineup Formasi** | `HARDCODED` / `SIMULATED` | Array konstanta `LINEUPS` | [`apps/web/src/app/(modules)/match-center/page.tsx:347-398`](file:///Applications/XAMPP/xamppfiles/htdocs/tactiq/apps/web/src/app/(modules)/match-center/page.tsx#L347-L398) | Lineup starter XI dan bangku cadangan default Liverpool vs Chelsea di-*hardcode* di client. |
| **Match Center: Match Stats (All/1H/2H)** | `HARDCODED` | Objek konstanta `STATS_DATA` | [`apps/web/src/app/(modules)/match-center/page.tsx:216-328`](file:///Applications/XAMPP/xamppfiles/htdocs/tactiq/apps/web/src/app/(modules)/match-center/page.tsx#L216-L328) | Nilai possession (54% vs 46%), shots (22 vs 5), xG (4.62 vs 0.38) adalah konstanta lokal. |
| **Match Center: H2H 5 Laga Terakhir** | `HARDCODED` / `SEED` | Konstanta `H2H_ENCOUNTERS` / DB | [`apps/web/src/app/(modules)/match-center/page.tsx:85-121`](file:///Applications/XAMPP/xamppfiles/htdocs/tactiq/apps/web/src/app/(modules)/match-center/page.tsx#L85-L121) | Riwayat laga MCI vs MUN (FA Cup & EPL 2023/2024) di-*hardcode*. Tabel `h2h_records` di DB hanya punya 4 baris. |
| **Match Center: Absentees (Cedera/Sanksi)** | `HARDCODED` | Array statis `TransfermarktService` | [`apps/api/src/services/transfermarkt.service.ts:16-97`](file:///Applications/XAMPP/xamppfiles/htdocs/tactiq/apps/api/src/services/transfermarkt.service.ts#L16-L97) | Tidak melakukan scraping/API ke Transfermarkt. Berisi 10 pemain statis (Rodri ACL, Mount, Alaba, dll.). |
| **Match Center: AI Predictor (100% Outcome)** | `SIMULATED` | RandomForest sintetis + Dixon-Coles | [`services/ml/app/services/match_predictor.py:46-128`](file:///Applications/XAMPP/xamppfiles/htdocs/tactiq/services/ml/app/services/match_predictor.py#L46-L128) | Random Forest dilatih di memori menggunakan data sintetis random (`np.random.randint`), bukan riwayat laga nyata. |
| **Scouting: Radar 7 Sumbu** | `SEED` | `players_fbref_500.json` via Prisma | [`apps/api/prisma/seed.ts:165-217`](file:///Applications/XAMPP/xamppfiles/htdocs/tactiq/apps/api/prisma/seed.ts#L165-L217) | 581 pemain di database memiliki nilai pace/shooting/passing 0–100 tetap (mirip game card FIFA). |
| **Scouting: Statistical Twins (Top 5)** | `LIVE ALGO` (Data Seed) | Cosine + Euclidean di ML / API | [`services/ml/app/api/endpoints/similarity.py:15-120`](file:///Applications/XAMPP/xamppfiles/htdocs/tactiq/services/ml/app/api/endpoints/similarity.py#L15-L120) | Algoritma ML berjalan nyata dan valid, tetapi beroperasi pada 581 pemain data seed. |
| **Scouting: Metrik Per-90 (SCA, Box Passes)** | `SIMULATED` | Rumus turunan linier di frontend | [`apps/web/src/app/(modules)/scouting/page.tsx:712-717`](file:///Applications/XAMPP/xamppfiles/htdocs/tactiq/apps/web/src/app/(modules)/scouting/page.tsx#L712-L717) | Nilai SCA dihitung dari `(vision / 100) * 6`, bukan dari data event tracking Opta/StatsBomb. |
| **Scouting: Komparasi 2 Pemain** | `LIVE ALGO` (Data Seed) | Frontend Canvas / Modal | [`apps/web/src/components/scouting/player-comparison-modal.tsx:1-250`](file:///Applications/XAMPP/xamppfiles/htdocs/tactiq/apps/web/src/components/scouting/player-comparison-modal.tsx#L1-L250) | Berjalan nyata membandingkan 2 radar chart dari pemain database. |
| **Tactical Tracker: Video Background** | `LIVE FEED` | Iframe YouTube / Local Blob Video | [`apps/web/src/components/video-overlay-canvas.tsx:444-460`](file:///Applications/XAMPP/xamppfiles/htdocs/tactiq/apps/web/src/components/video-overlay-canvas.tsx#L444-L460) | Video YouTube terputar nyata via embed iframe. |
| **Tactical Tracker: Bounding Box Pemain/Bola** | `SIMULATED` | Generator lokal & worker sintetis | [`apps/web/src/components/video-overlay-canvas.tsx:263-278`](file:///Applications/XAMPP/xamppfiles/htdocs/tactiq/apps/web/src/components/video-overlay-canvas.tsx#L263-L278) | Menggunakan fungsi `Math.sin`/`Math.cos` untuk menggerakkan 13 entitas di atas kanvas secara periodik. |
| **Tactical Tracker: 2D Minimap (105x68m)** | `SIMULATED` | Render koordinat kanvas 2D | [`apps/web/src/components/tactical-minimap.tsx:1-280`](file:///Applications/XAMPP/xamppfiles/htdocs/tactiq/apps/web/src/components/tactical-minimap.tsx#L1-L280) | Merender posisi entitas sintetis dari payload frame ke kanvas radar 105x68m. |
| **Tactical Tracker: CAM FOV** | `SIMULATED` | Proyeksi batas frustum dinamis | [`apps/web/src/components/tactical-minimap.tsx:210-245`](file:///Applications/XAMPP/xamppfiles/htdocs/tactiq/apps/web/src/components/tactical-minimap.tsx#L210-L245) | Menghitung kotak bounding dinamis mengikuti posisi bola sintetis di radar. |
| **Tactical Tracker: Telemetri (Speed, Dist)** | `SIMULATED` | Formula `16 + Math.abs(Math.sin)` | [`apps/web/src/components/video-overlay-canvas.tsx:268`](file:///Applications/XAMPP/xamppfiles/htdocs/tactiq/apps/web/src/components/video-overlay-canvas.tsx#L268) | Kecepatan instan dihitung dari osilasi sinus, jarak lari dihitung dari akumulasi lokal. |
| **Realtime: Streaming 10 FPS** | `SIMULATED` | Redis Pub/Sub + Socket.io | [`services/ml/app/api/endpoints/tracking.py:97-148`](file:///Applications/XAMPP/xamppfiles/htdocs/tactiq/services/ml/app/api/endpoints/tracking.py#L97-L148) | Loop `asyncio.sleep(0.1)` memublikasikan 100 frame sintetis ke Redis channel `tactiq_tracking_stream`. |

---

## 3. Hasil Pencarian Wajib & Bukti Kode (Bagian 3.2)

### 3.2.1 Audit Grep Simulasi & Hardcode
Hasil eksekusi:
```bash
grep -rnE "Math\.random|faker|mock|dummy|fixture|hardcode|setInterval" \
  --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=venv --exclude-dir=dist \
  --include="*.ts" --include="*.tsx" --include="*.py" apps services packages
```
Ditemukan **152 kemunculan** di seluruh repositori. Distribusi berkas utama:
- `apps/api/src/services/apiFootball.service.ts`: 24 kecocokan (fallback data roster, dummy stats bundle).
- `apps/web/src/app/(modules)/match-center/page.tsx`: 19 kecocokan (hardcoded fixture, simulasi gol, mock stats).
- `apps/api/src/services/liveMatchEngine.service.ts`: 18 kecocokan (setInterval ticker, event generator).
- `apps/api/src/controllers/match.controller.ts`: 16 kecocokan.
- `apps/api/src/services/etl.service.ts`: 15 kecocokan (fallback silent fixtures/standings/players).
- `apps/api/prisma/seed.ts`: 11 kecocokan (generasi koordinat sinus/kosinus 100 frame).
- `apps/web/src/lib/api.ts`: 10 kecocokan.

### 3.2.2 Analisis Database (`prisma/seed.ts` & Live DB)
Berdasarkan query langsung ke database PostgreSQL:
- **Klub/Teams**: 48 klub (kombinasi 20 klub EPL, top La Liga, Serie A, Bundesliga).
- **Pemain/Players**: 581 pemain nyata dengan atribut 7 sumbu (berasal dari `players_fbref_500.json`).
- **Fixtures**: 17 jadwal pertandingan (4 jadwal utama: MCI-ARS, RMA-FCB, LIV-CHE, BAY-B04 + jadwal ETL tambahan).
- **Standings**: 21 baris klasemen Premier League.
- **H2H Records**: 4 baris rekaman pertemuan di database.
- **Tracking Sessions**: 5 sesi video dengan total 500 baris koordinat (`TrackingCoordinate`).
- **Preset Spanyol**: Tidak disimpan di database relasional, melainkan di-*hardcode* di memori komponen React [`custom-match-modal.tsx`](file:///Applications/XAMPP/xamppfiles/htdocs/tactiq/apps/web/src/components/match-center/custom-match-modal.tsx#L42-L120).

### 3.2.3 Status ETL & Cron Job
- Terdapat *cron scheduler* di [`apps/api/src/services/etl.service.ts:322-336`](file:///Applications/XAMPP/xamppfiles/htdocs/tactiq/apps/api/src/services/etl.service.ts#L322-L336) yang dijalankan setiap 4 jam menggunakan `setInterval`.
- **Target Provider**: `FootballDataService` (Football-Data.org) untuk kompetisi `'PL'`.
- **Pelanggaran Rule 2 (Silent Mock Fallback)**:
  Pada [`etl.service.ts:62-86`](file:///Applications/XAMPP/xamppfiles/htdocs/tactiq/apps/api/src/services/etl.service.ts#L62-L86):
  ```typescript
  const fdoFixtures = await FootballDataService.syncFixtures('PL');
  syncedFixtures = fdoFixtures > 0 ? fdoFixtures : await this.syncFixtures(); // Fallback ke data lokal 2023/2024
  ...
  source: process.env.API_FOOTBALL_KEY ? 'API-Football Live API' : 'TactIQ Synthetic Ingestion Engine'
  ```
  Jika token gagal atau mengembalikan 0, sistem mengeksekusi `this.syncFixtures()` (4 fixture palsu) dan tetap menyatakan bahwa sumber data berasal dari `"API-Football Live API"`.

### 3.2.4 Pipeline Computer Vision di `services/ml`
- File `requirements.txt` mencantumkan `ultralytics>=8.0.0`, `opencv-python>=4.8.0`, dan `lap>=0.5.12`.
- Di `services/ml/app/services/video_tracker.py`, terdapat kelas `TacticalVideoTracker` yang dapat memuat model YOLO (`YOLO(self.model_path)`).
- **Kenyataan Eksekusi**:
  1. File bobot model (`yolov8n.pt`) tidak ada di dalam repositori.
  2. Ketika Web UI memanggil `POST /api/v1/tracking/start` dengan `youtube_url`, fungsi [`services/ml/app/api/endpoints/tracking.py:216`](file:///Applications/XAMPP/xamppfiles/htdocs/tactiq/services/ml/app/api/endpoints/tracking.py#L216) langsung mengalihkan ke `run_tracking_simulation`, yaitu loop generator gelombang sinus (`math.sin((frame_idx * 0.2) + p["id"]) * 0.006`).
  3. Bounding box dan minimap tidak membaca piksel video siaran.

### 3.2.5 Sinkronisasi Timestamp Video
- Payload `TrackingFramePayload` hanya membawa `timestampMs: frame_idx * 100` (waktu relatif linier).
- **Ketiadaan Sinkronisasi Playback**: Tidak ada pembacaan status video player (Play, Pause, Buffering, Seek). Jika video di-pause atau di-seek, canvas tracking tetap berjalan secara independen.

### 3.2.6 WebSocket untuk Skor Live
- Berbeda dengan klaim README yang hanya menyebut `frame_update` dan `session_status`, backend memiliki event WebSocket:
  - `match_score_update`: Memancarkan array skor langsung dari `LiveMatchEngineService` ([`liveMatchEngine.service.ts:432`](file:///Applications/XAMPP/xamppfiles/htdocs/tactiq/apps/api/src/services/liveMatchEngine.service.ts#L432)).
  - `match_event`: Memancarkan detail event gol atau kartu ([`liveMatchEngine.service.ts:338`](file:///Applications/XAMPP/xamppfiles/htdocs/tactiq/apps/api/src/services/liveMatchEngine.service.ts#L338)).
- Event ini dipancarkan secara global (`io.emit`), bukan berbasis room per-pertandingan.

### 3.2.7 Redis: Pub/Sub vs Streams
- README mengklaim: *"Redis 7.2 Streams"* (baris 10, 38).
- Implementasi nyata di [`apps/api/src/services/redis.service.ts:18-19`](file:///Applications/XAMPP/xamppfiles/htdocs/tactiq/apps/api/src/services/redis.service.ts#L18-L19) dan [`apps/api/src/websocket/socket.server.ts:57`](file:///Applications/XAMPP/xamppfiles/htdocs/tactiq/apps/api/src/websocket/socket.server.ts#L57) murni menggunakan **Redis Pub/Sub (`redisSubscriber.subscribe`, `redisPublisher.publish`)**.
- Tidak ada pemanggilan perintah Redis Streams (`XADD`, `XREAD`, `XREADGROUP`, `XGROUP`).
- **Implikasi**: Pub/Sub tidak menyimpan histori pesan di buffer disk/memori. Klien yang disconnect tidak dapat melakukan catch-up frame yang terlewat.

### 3.2.8 Kesenjangan Endpoint (Existing vs Dibutuhkan UI)
| Kebutuhan UI | Ketersediaan Endpoint | Evaluasi |
| :--- | :--- | :--- |
| **Home Ticker Multi-Liga** | ❌ `TIDAK ADA` | UI membaca array statis `MATCHES` di client. Dibutuhkan endpoint `GET /api/v1/matches/home-ticker`. |
| **Lineup Detail per Match** | ⚠️ `PARSIAL` | `GET /api/v1/matches/:id/lineup` ada, namun jika provider mati, menggunakan roster statis di backend. |
| **Events per Match** | ⚠️ `PARSIAL` | Hanya ada event live via socket. Tidak ada endpoint histori `GET /api/v1/matches/:id/events` di DB. |
| **Match Stats per Babak (1H/2H)** | ⚠️ `PARSIAL` | `GET /api/v1/matches/:id/statistics` ada, namun jika provider mati, mengembalikan bundle statis. |
| **Absentees / Cedera** | ⚠️ `MOCK` | `GET /api/v1/matches/preview/absentees` ada, tetapi membaca array statis 10 pemain di memori. |
| **Filter Usia & Market Value** | ❌ `TIDAK ADA` | `PlayerQuerySchema` di Zod hanya memvalidasi `position`, `league`, `search`, `minPassing`, `minPace`. Filter `minAge`, `maxAge`, `minMarketValue`, `maxMarketValue` belum didukung backend. |
| **Paginasi Pemain** | ❌ `TIDAK ADA` | `GET /api/v1/players` mengembalikan semua pemain yang cocok tanpa `limit` dan `page`. |

### 3.2.9 Keamanan, Rate Limiting, Validasi, dan Cache
- **Autentikasi & Otorisasi**: 0% (Semua endpoint terbuka untuk umum tanpa API Key atau JWT).
- **Rate Limiting**: 0% (Tidak ada middleware rate limiter Express atau token bucket Redis).
- **Validasi Input**: Terbatas hanya pada `PlayerQuerySchema` (Zod) di route pemain. Route match dan tracking hanya memeriksa `if (!payload.session_id)`.
- **Cache TTL**: 0% (Belum ada layer caching Redis dengan TTL terukur untuk respons HTTP).

---

## 4. Verifikasi Konsistensi Internal (Bagian 3.3)

### 4.1 Rumus Prediksi Hasil Pertandingan
- **Klaim UI (`match-center/page.tsx:3134`)**: *"Monte Carlo match simulation outcomes calculated via TactIQ Match Predictor (Poison/Elo xG model and historical H2H records)."*
- **Implementasi Nyata (`services/ml/app/services/match_predictor.py`)**:
  - Menggunakan **RandomForestClassifier** yang dikalibrasi dengan Sigmoid (`CalibratedClassifierCV`).
  - Dilatih pada 3.500 baris **data sintetis acak** (`np.random.randint`), bukan Monte Carlo.
  - Untuk proyeksi skor akhir, menggunakan **Dixon-Coles Bivariate Poisson Distribution** ([`match_predictor.py:198-255`](file:///Applications/XAMPP/xamppfiles/htdocs/tactiq/services/ml/app/services/match_predictor.py#L198-L255)).
- **Jaminan Probabilitas 100%**:
  Kode menjamin probabilitas tepat 100.0% dengan mematok `draw`:
  ```python
  home_win = round((p_home_raw / total) * 100.0, 1)
  away_win = round((p_away_raw / total) * 100.0, 1)
  draw = round(100.0 - home_win - away_win, 1)
  ```
  Demikian juga di fallback TypeScript ([`ml.service.ts:147`](file:///Applications/XAMPP/xamppfiles/htdocs/tactiq/apps/api/src/services/ml.service.ts#L147)): `draw = parseFloat((100 - homeWin - awayWin).toFixed(1))`.

### 4.2 Asal-usul Expected Goals ($xG$)
- $xG$ pada Match Stats **BUKAN shot-level xG** dari kalkulasi koordinat tembakan (seperti model Opta/Understat).
- Di ML microservice, $xG$ diestimasi menggunakan rasio rata-rata gol liga:
  ```python
  home_xg = 1.45 * (home_scored / 1.40) * (away_conceded / 1.40) * (1.0 + (home_poss - 50.0) * 0.005)
  ```
- Di frontend UI, $xG$ statis di `STATS_DATA` (4.62 vs 0.38) atau rumus heuristik `Math.max(0.35, hScore * 0.82 + 0.45)`.

### 4.3 Asal-usul Atribut Radar 7 Sumbu
- Atribut `pace`, `shooting`, `passing`, `dribbling`, `defending`, `physical`, `vision` berasal dari file seed `players_fbref_500.json`.
- Nilai-nilai ini merupakan angka statis bulat bernilai 0–100 (rating ala kartu FIFA/EA FC). Nilai tersebut **tidak dihitung dari metrik per-90 menit nyata**.

### 4.4 Kredibilitas Statistical Twins
- Database saat ini memiliki **581 pemain**.
- Karena ukuran pool berada di kisaran ratusan pemain Eropa, perbandingan matematis Cosine + Euclidean dapat menghasilkan peringkat 5 pemain paling mirip secara numerik.
- **Peringatan Ilmiah**: Kemiripan dihitung berdasarkan 7 angka rating statis (0–100), bukan klastering data performa kontekstual (misal: *progressive carries*, *pass completion under pressure*, *defensive actions* per 90).

### 4.5 Ketidaksesuaian Versi Dependensi (Matrix Check)
| Komponen | Klaim README | Lingkungan Aktual Host / Docker | Status |
| :--- | :--- | :--- | :---: |
| **Node.js** | v18.0.0+ | Host: `v24.9.0` | ✅ Kompatibel |
| **Python** | 3.10 atau 3.11 | Host: `3.9.6` / Docker: `3.11-slim` | ⚠️ Host Python < 3.10 |
| **PostgreSQL** | PostgreSQL 16 (atau 15+) | Docker: `postgres:16-alpine` | ✅ Kompatibel |
| **Redis** | Redis 7.2 Streams | Docker: `redis:7-alpine` (Menggunakan Pub/Sub) | ❌ Tidak memakai Streams |

---

## 5. Ringkasan Kesiapan & Status "Jujur"

```
[TACTIQ READINESS SCORE: 42% DATA LIVE READY]
├── Database & Relational Schema      : 75% (Prisma, PostgreSQL aktif, 581 pemain)
├── Machine Learning Core (ML)        : 65% (Cosine & Dixon-Coles aktif, data latih sintetis)
├── API Gateway Architecture          : 50% (Express & Socket.io aktif, auth & rate limit nihil)
├── External Live Feed Ingestion      : 20% (Kredensial API eksternal invalid, fallback silent)
└── Real-Time Computer Vision         : 10% (Simulasi sinus/kosinus pada iframe YouTube)
```

---

## 6. Keputusan yang Dibutuhkan dari User (Bagian 3.4)

Sebelum melangkah ke **FASE 1 (Riset Provider)** dan **FASE 2 (Implementasi Ingestion Live)**, kami membutuhkan keputusan eksplisit Anda mengenai 10 poin berikut:

1. **Tujuan Akhir Produk:**
   - [A] Proyek Portofolio / Demo Interaktif Kelas Dunia (data berlabel jelas antara LIVE vs DEMO/SIMULATION).
   - [B] Produk Produksi / Komersial untuk Klub Sepak Bola Nyata (memerlukan API key berbayar & feed live resmi).

2. **Ketersediaan API Key Provider:**
   - Token `FOOTBALL_DATA_TOKEN` dan `API_FOOTBALL_KEY` di `.env` saat ini tidak valid (HTTP 400 & missing key error). Apakah Anda memiliki API Key resmi yang valid untuk salah satu provider tersebut, atau kita menggunakan free provider alternatif (seperti TheSportsDB / web-scraper publik)?

3. **Cakupan Liga Wajib Live:**
   - Liga apa saja yang wajib menampilkan data live? (Contoh: Hanya Premier League Inggris, atau Premier League + La Liga Spanyol, atau termasuk Liga Champions / Serie A?).

4. **Anggaran / Budget Data Feed:**
   - Apakah sistem harus 100% menggunakan Tier Gratis (Free Tier dengan batasan rate limit ketat), atau ada anggaran untuk API berbayar (misal API-Football Pro atau Sportmonks)?

5. **Target Latensi Skor Live:**
   - Berapa toleransi keterlambatan skor? (Pilihan: 15 detik, 30 detik, 60 detik, atau polling terjadwal setiap 2 menit demi menghemat kuota free tier).

6. **Fitur yang Diizinkan Tetap Berstatus `DEMO`:**
   - Apakah fitur video tracking koordinat diizinkan tetap bertanda `DEMO SIMULATION` di UI, sementara kita memfokuskan data live pada Match Center (skor, lineup, klasemen, statistik laga)?

7. **Sumber Data untuk Profil Pemain (Usia, Market Value, Foto):**
   - Apakah kita tetap menggunakan basis data 581 pemain yang sudah ada di database saat ini, atau menyinkronkan data profil dari API baru?

8. **Definisi Radar 7 Sumbu (Scouting):**
   - Apakah radar 7 sumbu tetap dipertahankan dengan skala atribut 0–100 (gaya kartu analitik), atau harus diubah menjadi kalkulasi persentil per-90 menit?

9. **Strategi Tactical Tracker:**
   - Mengingat video YouTube di browser tidak dapat diproses secara Computer Vision karena CORS, opsi mana yang Anda pilih:
     - [Opsi A]: Beri badge **DEMO SIMULATION** yang transparan dan jujur pada visualizer YouTube saat ini.
     - [Opsi B]: Menyediakan fitur upload video MP4 lokal yang diproses secara offline di backend (server-side YOLOv8) lalu di-replay.
     - [Opsi C]: Mengimpor open tracking dataset profesional resmi (seperti Metrica Sports / StatsBomb 360).

10. **Target Deployment:**
    - Apakah platform ini akan dijalankan secara lokal (Local Docker Compose), atau akan di-deploy ke cloud (VPS / AWS / Vercel + Railway)?

---
*Laporan Fase 0 selesai dan disahkan. Eksekusi ditahan sesuai aturan hingga user memberikan instruksi dan jawaban atas pertanyaan di atas.*

---

## 7. Implementasi & Audit Fase 2: Multi-Provider Ingestion Architecture

Sesuai arahan arsitektur Fase 2, sistem data live TactIQ telah ditingkatkan dari polling statis menjadi **Multi-Provider Ingestion Chain dengan Circuit Breaker dan Schedule-Aware Adaptive Scheduler**.

### 7.1 Eksekusi GERBANG 0 (Verifikasi Kredensial Nyata)
Panggilan langsung ke endpoint status API-Football (`https://v3.football.api-sports.io/status`) dengan key di `.env`:
- **Hasil**: HTTP 200 dengan payload `errors: {"requests": "You have reached the request limit for the day, Go to https://dashboard.api-football.com to upgrade your plan."}`.
- **Konfirmasi**: Key terdaftar tetapi kuota harian (100 req/hari) telah habis. Ini membuktikan secara empiris pentingnya **Circuit Breaker** otomatis yang langsung mengalihkan beban ke provider cadangan tanpa merusak ketersediaan sistem.

### 7.2 Verifikasi Provider & Capability Matrix
Setiap provider diimplementasikan di balik kontrak interface `FootballDataProvider` dengan capability flags yang jujur:

| Provider | Peran | Kuota Free Tier | Capabilities | Status Header Kuota | Catatan Resmi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **API-Football** (`api-sports.io`) | Primary | 100 req/hari (10 req/menit) | `live: true`, `lineup: true`, `events: true`, `stats: true`, `injuries: true`, `delayed: false` | `x-ratelimit-requests-remaining` | Provider terlengkap; trip ke EXHAUSTED jika 429 atau kuota 0 s/d 00:00 UTC. |
| **Highlightly** (`highlightly.net` / RapidAPI) | Backup 1 | 100 req/hari | `live: true`, `lineup: true`, `events: true`, `stats: false`, `injuries: false`, `delayed: false` | `x-ratelimit-requests-remaining` | Menyediakan skor live, lineup, dan event. Tidak menyediakan statistik agregat/injuries (ditandai `missingCapabilities: ['stats', 'injuries']`). |
| **football-data.org** | Backup 2 | 10 req/menit | `live: false`, `lineup: false`, `events: false`, `stats: false`, `injuries: false`, `delayed: true` | `x-requests-available-minute` | Khusus jadwal, klasemen, dan skor tertunda (delayed). Lineup/stats mengembalikan `null` dengan alasan jujur. UI menampilkan badge `DELAYED`. |

### 7.3 Scheduler Sadar Jadwal & Polling Adaptif
1. **Sinkronisasi Harian**: 1 request harian mengambil jadwal semua liga yang dipantau (`tracked_leagues: [39 (EPL), 140 (La Liga), 2 (UCL)]`) ke database.
2. **Jendela Live**: Dihitung dari `kickoff - 10m` sampai dengan `kickoff + 125m`.
   - Di luar jendela live: **0 polling** (menghemat kuota 100%).
   - Jika status pertandingan `FT` (Full Time) atau tidak ada klien web/socket yang terhubung: polling otomatis dihentikan.
3. **Single-Flight Coalescing**: Semua panggilan bersamaan ke endpoint skor live menggunakan satu promise bersama (`fetchLiveScoresSingleFlight`), mencegah pemborosan kuota oleh multi-klien.
4. **Formula Interval Adaptif**:
   $$\text{Interval} = \max\left(\text{minInterval}, \left\lfloor\frac{\text{sisaDetikJendela}}{\text{sisaKuota} - \text{cadanganSafety}}\right\rfloor\right)$$
   Contoh: Sisa jendela 90 menit (5400s) dengan sisa kuota 15 req $\rightarrow \max(60, \lfloor 5400 / 10 \rfloor) = 540$ detik (9 menit). Sistem otomatis menghemat sisa kuota agar tidak habis sebelum laga tuntas.

### 7.4 Tabel `provider_fixture_map` & Resolusi Fuzzy
- Dibuat tabel `provider_fixture_map` (migrasi reversibel `02_live_ingestion_schema.up.sql` dan `02_live_ingestion_schema.down.sql`).
- Memetakan `providerFixtureId` ke `internalFixtureId` berdasarkan normalisasi nama tim dan jendela kickoff $\pm 2$ jam.
- Jika terdapat ambiguitas (lebih dari 1 kandidat yang mirip), sistem **tidak menggabungkan secara sembrono**, melainkan menandai status sebagai `'unresolved'`.

### 7.5 Kejujuran Data & UI Badging
- Respons payload membawa `source`, `mode` (`live`/`cached`/`demo`), `isDelayed`, `isStale`, dan `missingCapabilities`.
- Jika provider aktif tidak memiliki kemampuan tertentu (misal fallback ke football-data.org tanpa lineup/stats), API mengembalikan `data: null` atau array kosong dengan alasan eksplisit (bukan data karangan).
- Di UI Match Center:
  - Mode Delay $\rightarrow$ badge **`DELAYED`** (kuning/amber) dengan catatan waktu delay.
  - Mode Terbatas $\rightarrow$ badge **`LIMITED`** (biru) dengan penjelasan kapabilitas yang tidak didukung.
  - Mode Demo $\rightarrow$ badge **`DEMO`** (oranye).
  - Mode Real-time Live $\rightarrow$ badge **`LIVE`** (hijau dengan animasi pulsing).

### 7.6 Endpoint Observabilitas (`/api/v1/health/data`)
Menampilkan status per provider secara transparan:
- `activeProvider`: Provider yang saat ini melayani request.
- `providers`: Array status ketiga provider (status, remaining quota, daily quota, reset time, capabilities).
- `switchHistory`: Catatan histori perpindahan provider beserta alasan pergantian.
- `scheduler`: Status jendela live, jumlah listener aktif, dan status single-flight.

### 7.7 Hasil Pengujian Otomatis
Seluruh 22 tes unit pada 4 test suite berhasil lulus 100%:
1. `src/__tests__/circuitBreakerFallback.test.ts` (6 tes): Lulus
   - Simulasi 429 & kuota habis pada Primary $\rightarrow$ otomatis beralih ke Highlightly.
   - Simulasi kegagalan Backup 1 $\rightarrow$ otomatis beralih ke football-data.org.
   - Pembuktian kejujuran data (delayed: true, missingCapabilities, no fake data).
   - Penyesuaian interval adaptif terhadap sisa kuota.
   - Endpoint `/api/v1/health/data` mengekspos ketiga provider.
   - Resolusi dan persistensi `provider_fixture_map`.
2. `src/__tests__/liveIngestion.test.ts` (7 tes): Lulus
   - Home ticker feed, events, lineup, statistics, absentees, pagination & filter usia/market value, dan token bucket health.
3. `src/__tests__/honesty.test.ts` (5 tes): Lulus
4. `src/__tests__/app.test.ts` (4 tes): Lulus
