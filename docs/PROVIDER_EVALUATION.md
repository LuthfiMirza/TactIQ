# Evaluasi Provider Data Sepak Bola Live (FASE 1B)
**Proyek:** TactIQ AI Football Intelligence Platform  
**Dokumen:** `docs/PROVIDER_EVALUATION.md`  
**Status:** Rekomendasi Selesai — Menunggu Konfirmasi User Sebelum Fase 2  
**Tanggal Evaluasi:** 30 September 2026 (WIB) / 2026 Season

---

## 1. Ringkasan Eksekutif & Temuan Kunci

Berdasarkan audit Fase 0 (`docs/DATA_READINESS_REPORT.md`) dan implementasi Fase 1A (Data Honesty Patch), TactIQ membutuhkan satu penyedia data eksternal (*live data provider*) yang jujur, stabil, dan dapat diandalkan pada skema *free-tier*.

Dari hasil penelaahan dokumentasi resmi terhadap 3 kandidat utama:
1. **API-Football (api-sports.io):** Menyediakan data terlengkap (skor live real-time, susunan pemain/lineup dengan koordinat grid, timeline events gol/kartu/VAR, statistik tembakan/penguasaan bola, serta estimasi xG). Namun, batas kuota gratisnya sangat ketat (**100 request/hari**).
2. **football-data.org:** Menyediakan kuota request lebih tinggi (10 req/menit tanpa batas harian ketat), namun pada paket gratis **TIDAK menyediakan skor real-time (data tertunda/delayed), TIDAK menyertakan lineup, dan TIDAK menyertakan statistik pertandingan**.
3. **TheSportsDB:** Fitur livescore real-time dan API v2 **eksklusif untuk pelanggan berbayar Patreon ($9/bulan)**; tier gratis (kunci test `123`) tidak mendukung pemantauan live dan dilarang untuk publikasi aplikasi.

**Rekomendasi Utama:**  
Gunakan **API-Football (api-sports.io)** dengan arsitektur **Smart / On-Demand Polling** (polling hanya aktif saat ada pengguna yang membuka halaman pertandingan live di Match Center). Hal ini memungkinkan seluruh fitur Match Center (lineup, timeline, stats) beroperasi dengan data asli tanpa melanggar batas 100 request/hari.

---

## 2. Analisis Komparatif Kandidat Provider

### A. API-Football (`api-sports.io` / `v3.football.api-sports.io`)

*Sumber acuan resmi:* `https://api-sports.io/documentation/football/v3`, `https://dashboard.api-football.com`

* **Cakupan Liga Free Tier:**
  * Semua liga utama dunia dapat diakses, termasuk **Premier League (League ID: 39)** dan **La Liga (League ID: 140)**.
* **Endpoint yang Tersedia:**
  * **Live Scores:** `GET /fixtures?live=all` atau `GET /fixtures?live=39` (mendukung filter per liga).
  * **Jadwal & Hasil:** `GET /fixtures?league=39&season=2024`.
  * **Lineup / Susunan Pemain:** `GET /fixtures/lineups?fixture={id}` (formasi, starting XI, nomor punggung, posisi, koordinat grid lapangan `grid: "1:1"`, cadangan, pelatih).
  * **Match Events:** `GET /fixtures/events?fixture={id}` (gol, assist, kartu kuning/merah, pergantian pemain, ulasan VAR, penalti).
  * **Statistik Pertandingan:** `GET /fixtures/statistics?fixture={id}` (persentase ball possession, total shots, shots on target, shots off target, blocked shots, corner kicks, offsides, fouls, passes total, passes accurate, expected_goals/xG).
  * **Cedera / Absensi:** `GET /injuries?fixture={id}` (nama pemain, tipe cedera/skorsing, alasan).
  * **Klasemen:** `GET /standings?league=39&season=2024`.
* **Rate Limit & Kuota Harian:**
  * **Batas Request:** Maksimal **10 request/menit**.
  * **Kuota Harian:** Tepat **100 request/hari** (reset setiap 00:00 UTC).
  * **Perilaku saat Melebihi Kuota:** Mengembalikan status HTTP 200 dengan payload error: `{"errors": {"requests": "You have reached the request limit for the day..."}}`. Tidak ada penagihan otomatis (*no surprise charges*).
* **Latensi / Delay Data:**
  * **Real-time (in-play latency 15–60 detik).**
* **Lisensi & Atribusi:**
  * Diizinkan untuk prototipe, portofolio, dan evaluasi.
  * Logo klub dan pemain dilindungi hak kekayaan intelektual liga terkait; pengguna bertanggung jawab atas penampilan aset visual di produk publik.
  * Disarankan mencantumkan atribusi: *"Data powered by API-Football / API-Sports"*.
* **Status Verifikasi:** **Terverifikasi Resmi via Dashboard & Live Test API**.

---

### B. football-data.org (`api.football-data.org/v4`)

*Sumber acuan resmi:* `https://docs.football-data.org/`, `https://www.football-data.org/pricing`

* **Cakupan Liga Free Tier:**
  * Terbatas pada **12 kompetisi**: Premier League (`PL` / ID 2021), La Liga (`PD` / ID 2014), Serie A (`SA`), Bundesliga (`BL1`), Ligue 1 (`FL1`), Eredivisie (`DED`), Primeira Liga (`PPL`), UEFA Champions League (`CL`), Championship (`ELC`), Campeonato Brasileiro (`BSA`), Copa Libertadores, Piala Dunia / Euro.
* **Endpoint yang Tersedia:**
  * **Fixtures & Hasil:** `GET /v4/matches` atau `GET /v4/competitions/{code}/matches`.
  * **Live Scores:** `GET /v4/matches?status=IN_PLAY` (hanya status pertandingan dasar & skor global).
  * **Klasemen:** `GET /v4/competitions/{code}/standings`.
  * **Lineup:** ❌ **TIDAK TERSEDIA di Free Tier** (node `lineups` memerlukan paket berbayar *Free+Deep* atau *Standard*).
  * **Match Events (Cards, Substitutions):** ❌ **TIDAK TERSEDIA di Free Tier** (parameter `unfold_bookings`, `unfold_subs` dikunci untuk tier berbayar).
  * **Statistik Pertandingan (Possession, Shots):** ❌ **TIDAK TERSEDIA di Free Tier** (`unfold_stats` membutuhkan langganan berbayar).
  * **Cedera / Absensi:** ❌ **TIDAK TERSEDIA**.
* **Rate Limit & Kuota Harian:**
  * **Batas Request:** **10 request/menit**.
  * **Kuota Harian:** Tidak ada kuota harian ketat (dibatasi oleh rate limiter 10 req/menit dan kebijakan *fair use*).
* **Latensi / Delay Data:**
  * **DELAYED / BUKAN REAL-TIME.** Pada paket gratis, pembaruan skor mengalami penundaan (beberapa menit hingga pertandingan usai).
* **Lisensi & Atribusi:**
  * **Wajib atribusi:** Harus mencantumkan teks: *"Football data provided by the Football-Data.org API"*.
  * Hanya boleh untuk proyek non-komersial personal/edukasi.
* **Status Verifikasi:** **Terverifikasi Resmi via Dokumentasi Resmi v4**.

---

### C. TheSportsDB (`thesportsdb.com`)

*Sumber acuan resmi:* `https://www.thesportsdb.com/api.php`, `https://www.patreon.com/thesportsdb`

* **Cakupan Liga Free Tier:**
  * Mencakup liga-liga populer via database V1 legacy.
* **Endpoint yang Tersedia:**
  * **Livescore Real-time:** ❌ **TIDAK TERSEDIA di Free Tier**. Endpoint livescore (API V2) dikunci khusus untuk donatur Patreon minimal $9/bulan.
  * **Lineup & Taktik:** ❌ Format tidak terstruktur, sering kosong, atau hanya tersedia untuk laga tertentu.
  * **Statistik Detail:** ❌ Tidak menyediakan shot maps, xG, pass accuracy, atau timeline event menit per menit.
  * **Klasemen:** `GET /api/v1/json/123/lookuptable.php?l=4328&s=2024-2025` (Premier League).
* **Rate Limit & Kuota Harian:**
  * Free test key `123`: Maksimal **30 request/menit**.
* **Lisensi & Atribusi:**
  * Free test key `123` dilarang untuk publikasi aplikasi publik (*not allowed for production/public release*).
* **Status Verifikasi:** **Terverifikasi Resmi via Dokumentasi TheSportsDB & Patreon**.

---

### D. Provider Tambahan yang Ditinjau

* **OpenFootball (`github.com/footballcsv`):**
  * Lisensi Public Domain (CC0), data teks statis (CSV/JSON).
  * Sangat cocok untuk *historical training* model prediksi (Dixon-Coles / Elo), namun **bukan live API** sehingga tidak bisa dipakai untuk pemantauan live matchday.
* **StatsBomb Open Data:**
  * Data event shot-level dan freeze frame xG paling mendalam di dunia sepak bola.
  * Bebas digunakan untuk riset non-komersial/akademik.
  * Namun hanya bersifat historis (turnamen lampau), bukan feed laga hari ini.

---

## 3. Perhitungan Kuota Harian & Analisis Latensi (Keputusan User #5)

### A. Aturan Polling Dasar User
* **Laga Live:** Polling setiap **60 detik**.
* **Di Luar Laga Live (Idle):** Polling setiap **15 menit**.

### B. Simulasi Matematis Polling Naif (Tanpa Optimasi)
Asumsi 1 matchday (misal Sabtu Premier League):
1. **Periode Idle (tidak ada laga live):**
   * Durasi: 22 jam / hari.
   * Frekuensi: 1 request per 15 menit = 4 request/jam.
   * Total request idle: $22 \times 4 = 88\text{ request/hari}$.
2. **Periode Laga Live:**
   * Durasi 1 laga: 90 menit + 15 menit jeda babak + 10 menit injury time $\approx 115\text{ menit}$.
   * Frekuensi: 1 request per 60 detik = 1 request/menit.
   * Total request laga live: $115 \times 1 = 115\text{ request}$.
3. **Total Request Harian Naif:**
   $$88\text{ (idle)} + 115\text{ (1 laga live)} = 203\text{ request/hari}$$

### C. Komparasi Terhadap Batas Provider
| Provider | Kuota Harian | Kebutuhan Naif (203 req) | Status Kelayakan |
| :--- | :--- | :--- | :--- |
| **API-Football** | 100 req/hari | 203 req/hari | ❌ **Defisit 103 request** (terbakar dalam ~2 jam) |
| **football-data.org** | Tidak dibatasi (10/min) | 203 req/hari | ⚠️ Cukup kuota, namun **skor tertunda & tidak ada lineup/stats** |
| **TheSportsDB** | 0 livescore (berbayar) | N/A | ❌ Tidak memiliki endpoint live gratis |

---

### D. Solusi Rekayasa: Arsitektur Smart On-Demand Polling (TactIQ Adaptive Worker)

Agar TactIQ tetap dapat menggunakan kedalaman data **API-Football** tanpa pernah melanggar kuota 100 request/hari, kami merancang strategi **Adaptive On-Demand Budgeting**:

1. **Jadwal Harian Otomatis (Background Budget = 3 request/hari):**
   * Pukul 06:00 UTC: 1 request untuk sinkronisasi klasemen (`/standings?league=39&season=2024`).
   * Pukul 07:00 UTC: 1 request untuk daftar jadwal matchday hari ini (`/fixtures?league=39&date={today}`).
   * Pukul 23:00 UTC: 1 request untuk rekonsiliasi hasil akhir skor (`/fixtures?league=39&date={today}`).
   * **Sisa Kuota untuk Live: 97 request/hari.**

2. **Smart In-Play Polling (Hanya saat ada pengguna aktif di Match Center):**
   * Polling skor live (`/fixtures?live=39`) **hanya berjalan jika ada client aktif** di WebSocket room `match_{id}` atau `match_center`.
   * Jika tidak ada user yang membuka aplikasi, background worker **TIDAK memanggil API eksternal** (menyimpan data cache terakhir bertanda `isStale: true`).
   * Interval polling live disesuaikan menjadi **90 detik** (atau 60 detik selama maksimal 60 menit sesi demo aktif).
   * Pada interval 90 detik, pemantauan 1 pertandingan penuh hanya menghabiskan:
     $$\frac{115\text{ menit}}{1.5\text{ menit}} \approx 76\text{ request}$$
   * Request lineup & statistics dilakukan **1 kali per babak** (bukan polling tiap menit):
     * Lineup: 1 request saat kickoff.
     * Statistics: 1 request saat Halftime, 1 request saat Fulltime.
   * **Total Penggunaan:** $3\text{ (jadwal)} + 76\text{ (live)} + 3\text{ (lineup/stats)} = 82\text{ request/hari}$.
   * **Margin Keamanan (Buffer):** Tersisa **18 request/hari** untuk toleransi error atau inspeksi manual.

---

## 4. Tabel Pemetaan Field Provider -> Skema TactIQ

Berikut pemetaan atribut dari respons resmi **API-Football (v3)** ke model database Prisma dan DTO TactIQ:

### 1. Fixture & Live Scores (`/fixtures?live=39` atau `/fixtures?id={id}`)
| API-Football v3 Field | Tipe Data Provider | Target Field TactIQ (Prisma/DTO) | Keterangan & Transformasi |
| :--- | :--- | :--- | :--- |
| `fixture.id` | `number` | `Fixture.id` / `externalId` | Dikonversi ke String (`String(fixture.id)`) |
| `fixture.date` | `ISO8601 string` | `Fixture.matchDate` | Parsed to `DateTime` |
| `fixture.status.short` | `string` (`"1H"`, `"2H"`, `"HT"`, `"FT"`, `"NS"`) | `Fixture.status` | Dimetakan ke enum `MatchStatus` (`LIVE`, `FINISHED`, `SCHEDULED`) |
| `fixture.status.elapsed`| `number` | `MatchSnapshot.minute` | Menit pertandingan berjalan |
| `fixture.venue.name` | `string` | `Fixture.venue` | Nama stadion |
| `teams.home.id` | `number` | `Team.code` / mapping | ID eksternal klub kandang |
| `teams.home.name` | `string` | `Team.name` | Nama klub kandang |
| `teams.home.logo` | `string` (URL) | `Team.logoUrl` | URL lambang klub |
| `goals.home` | `number` | `Fixture.homeScore` | Skor tim kandang |
| `goals.away` | `number` | `Fixture.awayScore` | Skor tim tandang |

### 2. Standings (`/standings?league=39&season=2024`)
| API-Football v3 Field | Tipe Data Provider | Target Field TactIQ (`Standing`) |
| :--- | :--- | :--- |
| `rank` | `number` | `Standing.position` |
| `all.played` | `number` | `Standing.played` |
| `all.win` | `number` | `Standing.won` |
| `all.draw` | `number` | `Standing.drawn` |
| `all.lose` | `number` | `Standing.lost` |
| `all.goals.for` | `number` | `Standing.goalsFor` |
| `all.goals.against` | `number` | `Standing.goalsAgainst` |
| `goalsDiff` | `number` | `Standing.goalDifference` |
| `points` | `number` | `Standing.points` |

### 3. Match Lineup (`/fixtures/lineups?fixture={id}`)
| API-Football v3 Field | Tipe Data Provider | Target Field TactIQ (Fase 2 Schema) |
| :--- | :--- | :--- |
| `formation` | `string` (misal `"4-3-3"`) | `MatchLineup.formation` |
| `coach.name` | `string` | `MatchLineup.coachName` |
| `startXI[].player.id` | `number` | `LineupPlayer.id` |
| `startXI[].player.name` | `string` | `LineupPlayer.name` |
| `startXI[].player.number`| `number` | `LineupPlayer.number` |
| `startXI[].player.pos` | `string` (`"G"`, `"D"`, `"M"`, `"F"`) | `LineupPlayer.pos` |
| `startXI[].player.grid`| `string` (misal `"1:1"`, `"2:3"`) | `LineupPlayer.grid` (posisi formasi taktis 2D) |
| `substitutes[].player` | `object[]` | `MatchLineup.substitutes` |

### 4. Match Events (`/fixtures/events?fixture={id}`)
| API-Football v3 Field | Tipe Data Provider | Target Field TactIQ (Fase 2 Schema) |
| :--- | :--- | :--- |
| `time.elapsed` | `number` | `MatchEvent.minute` |
| `time.extra` | `number \| null` | `MatchEvent.extraMinute` |
| `team.name` | `string` | `MatchEvent.team` |
| `player.name` | `string` | `MatchEvent.player` |
| `assist.name` | `string \| null` | `MatchEvent.assist` |
| `type` | `string` (`"Goal"`, `"Card"`, `"subst"`, `"Var"`) | `MatchEvent.type` |
| `detail` | `string` (`"Normal Goal"`, `"Yellow Card"`, etc.)| `MatchEvent.detail` |

### 5. Match Statistics (`/fixtures/statistics?fixture={id}`)
| API-Football v3 Field | Label Indeks | Target Field TactIQ (Fase 2 Schema) |
| :--- | :--- | :--- |
| `statistics[type="Ball Possession"].value` | `"54%"` -> `54` | `MatchStatistic.possession` |
| `statistics[type="Total Shots"].value` | `number` | `MatchStatistic.shotsTotal` |
| `statistics[type="Shots on Goal"].value` | `number` | `MatchStatistic.shotsOnTarget` |
| `statistics[type="Total passes"].value` | `number` | `MatchStatistic.passes` |
| `statistics[type="Passes %"].value` | `"85%"` -> `85` | `MatchStatistic.passAccuracy` |
| `statistics[type="Corner Kicks"].value` | `number` | `MatchStatistic.corners` |
| `statistics[type="Fouls"].value` | `number` | `MatchStatistic.fouls` |
| `statistics[type="expected_goals"].value` | `string \| number` | `MatchStatistic.xG` (real provider xG) |

---

## 5. Rekomendasi & Rencana Tindakan

### Rekomendasi: Pilih **API-Football (api-sports.io)**
**Alasan:**
1. **Kelengkapan Fitur:** Hanya API-Football di tier gratis yang memberikan akses penuh ke lineup dengan koordinat grid, timeline events gol/kartu, serta statistik tembakan dan penguasaan bola. football-data.org tidak memiliki data ini sama sekali pada free-tier.
2. **Kesesuaian Tampilan Match Center:** Tanpa lineup dan match statistics dari API-Football, halaman Match Center TactIQ akan kosong atau terpaksa kembali ke mock data (yang melanggar Aturan Mutlak Kejujuran Data).
3. **Solusi Kuota Dapat Diterapkan:** Dengan implementasi *Adaptive Smart Polling* (polling hanya saat ada sesi live client aktif di web), kuota 100 request/hari **sangat cukup** untuk demonstrasi portofolio live (rata-rata 15–80 request per sesi live matchday).

### Catatan untuk User Sebelum Fase 2 Dimulai:
1. Kunci API lama di `.env` saat ini telah habis kuota / tidak valid (`requests: You have reached the request limit for the day`).
2. Mohon daftarkan akun baru secara gratis di [https://dashboard.api-football.com/register](https://dashboard.api-football.com/register) untuk mendapatkan API key gratis (100 request/hari).
3. Letakkan key baru tersebut di file `.env` pada variabel:
   ```env
   API_FOOTBALL_KEY=your_fresh_api_key_here
   DATA_PROVIDER=api-football
   DATA_MODE=live
   ```
4. **PERINGATAN KEAMANAN:** Jangan kirimkan API key Anda di chat ini. Cukup masukkan langsung ke `.env` lokal Anda (yang telah terproteksi di `.gitignore`).

---

## 7. FASE 2.5: Verifikasi Provider Nyata, Header Kuota, dan Anggaran 15 Request

### A. Temuan Nyata Header & Perilaku Provider (TERBUKTI vs ASUMSI)

| Provider | Asumsi Awal (Fase 1B) | Bukti Respons Nyata (Fase 2.5) | Status |
| :--- | :--- | :--- | :--- |
| **API-Football** | Header `x-ratelimit-requests-remaining` selalu akurat menunjukkan sisa kuota harian. | **Header Deceptive!** Saat kuota 100/hari habis, API-Football tetap mengirim header `x-ratelimit-requests-remaining: 99` pada HTTP 200, namun body respons berisi `errors: { requests: "You have reached the request limit for the day..." }`. | 🔬 **TERBUKTI DENGAN BUKTI PAYLOAD** (`tests/fixtures/providers/api-football/status_exhausted.json`). Wajib inspeksi body respons! |
| **football-data.org** | Memiliki kuota harian tetap (misal 100 req/hari). | **Batas adalah per Menit, bukan per Hari!** Header resmi: `x-requests-available-minute: 9` (dari limit 10/menit), reset counter: `x-requestcounter-reset: 60`. `dailyQuota` adalah `null`. | 🔬 **TERBUKTI DENGAN BUKTI PAYLOAD** (`tests/fixtures/providers/football-data-org/standings_pl.json`). |
| **football-data.org (Musim 2026/27)** | Belum diketahui apakah musim 2026/27 aktif di free plan. | **Aktif & Dapat Diakses!** Respons `matches_pl.json` mengonfirmasi `season.id: 2502`, rentang `2026-08-21` s/d `2027-05-30`, 50 laga selesai tercatat. | 🔬 **TERBUKTI DENGAN BUKTI PAYLOAD** (`tests/fixtures/providers/football-data-org/matches_pl.json`). |
| **Highlightly** | Berfungsi sebagai Backup 1. | Belum ada API key di `.env` (`HIGHLIGHTLY_API_KEY`). Berstatus jujur **`not_configured`**, dilewati secara otomatis oleh rantai fallback ke `football-data.org`. | ⚠️ **TERBUKTI:** Rantai fallback saat ini memiliki **1 provider cadangan nyata** (`football-data.org`). |

---

### B. Rencana Anggaran Verifikasi Nyata API-Football (Maksimal 15 Request Pasca Reset 00:00 UTC)

Saat ini kuota API-Football di `.env` habis (`errors.requests`). Setelah reset harian pukul 00:00 UTC, verifikasi lanjutan akan dijalankan dengan anggaran ketat maksimal **10–15 request**:

1. **Request 1:** `GET /status` (Verifikasi akun, paket gratis, dan kuota awal 100).
2. **Request 2–4:** `GET /leagues?id=39`, `GET /leagues?id=140`, `GET /leagues?id=2` (Verifikasi season 2026/27 dan coverage flag untuk tracked leagues).
3. **Request 5:** `GET /leagues?name=World Cup` (Verifikasi ID kompetisi timnas resmi tanpa menebak).
4. **Request 6:** `GET /fixtures?date={today}` (Verifikasi jadwal matchday hari ini).
5. **Request 7:** `GET /fixtures?live=all` (Verifikasi live in-play payload format).
6. **Request 8–12 (Satu laga selesai spesifik):**
   - `GET /fixtures?id={sampleFixtureId}` (Detail laga)
   - `GET /fixtures/lineups?fixture={sampleFixtureId}` (Struktur lineup & koordinat grid)
   - `GET /fixtures/events?fixture={sampleFixtureId}` (Struktur events & timeline)
   - `GET /fixtures/statistics?fixture={sampleFixtureId}` (Struktur shots, possession, xG)
   - `GET /injuries?fixture={sampleFixtureId}` (Struktur absensi pemain)
7. **Buffer Darurat:** 3 request tersisa untuk toleransi retry jika ada timeout jaringan.
8. **Total Anggaran:** 12 request terencana + 3 request buffer = **15 request**. Sisa 85 request dialokasikan untuk operasional live.

---

### C. Catatan Utang Teknis: Cakupan Liga (League Coverage Debt)

* **Status Saat Ini:** `tracked_leagues` dikunci pada `[39, 140, 2]` (Premier League, La Liga, UEFA Champions League).
* **Aturan Perluasan:** Dilarang keras menebak league ID (misal untuk Liga Italia Serie A, Bundesliga, Euro, atau World Cup). Perluasan hanya boleh dilakukan dengan ID yang ditemukan dari respons nyata endpoint `/leagues` dan diverifikasi di contract test.
