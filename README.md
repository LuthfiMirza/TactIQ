# ⚽ TactIQ: Data-Driven Football Analytics & Tactical Tracking Platform

TactIQ is an enterprise-grade football intelligence platform that combines multi-dimensional player radar analytics, statistical match outcome forecasting, and real-time computer vision 2D tactical tracking.

---

## 🏛️ System Architecture & Team Collaboration

The platform operates across 3 decoupled microservices developed by 3 collaborating engineers:

```
                                  [ Browser / Client ]
                                            │
                             ┌──────────────┴──────────────┐
                             │ HTTP / Next.js              │ WebSocket (Socket.io)
                             ▼                             ▼
                    ┌─────────────────┐           ┌─────────────────┐
                    │    apps/web     │           │    apps/api     │
                    │  (Lead: Ferrel) │           │  (Lead: Luthfi) │
                    │ Next.js 14 / UI │           │ Node/Express/Pr │
                    └─────────────────┘           └────────┬────────┘
                                                           │
                                      ┌────────────────────┴────────────────────┐
                                      │                                         │
                                      ▼                                         ▼
                             ┌─────────────────┐                       ┌─────────────────┐
                             │   PostgreSQL    │                       │  Redis Pub/Sub  │
                             │   (Prisma ORM)  │                       │  (Stream Bus)   │
                             └─────────────────┘                       └────────▲────────┘
                                                                                │
                                                                       ┌────────┴────────┐
                                                                       │   services/ml   │
                                                                       │  (Lead: Fuad)   │
                                                                       │ Python/FastAPI  │
                                                                       └─────────────────┘
```

### Team Responsibilities & Ownership Matrix
| Service | Lead Engineer | Technology Stack | Key Responsibilities |
| :--- | :--- | :--- | :--- |
| **`apps/api`** | **Luthfi** (Back-End) | Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, Redis, Socket.io | Central Gateway, relational schema, multi-criteria filtering, Redis subscriber, WebSocket hub |
| **`services/ml`** | **Fuad** (Machine Learning) | Python 3.11, FastAPI, Scikit-learn, NumPy, Redis-py | Player similarity vectors, Poisson/Elo match forecasting, background CV tracking worker |
| **`apps/web`** | **Ferrel** (Front-End) | Next.js 14 (App Router), Tailwind CSS, Chart.js, HTML5 Canvas | Dark-mode sports analytics UI, interactive radar charts, real-time 2D pitch overlay canvas |
| **`packages/shared-types`** | **Shared** | TypeScript | Synchronized DTOs, API response wrappers, and WebSocket payload contracts |

---

## 📂 Repository Directory Structure

```text
TactIQ/
├── apps/
│   ├── api/                 # Node.js + TypeScript (Express/Prisma)
│   │   ├── prisma/
│   │   │   ├── schema.prisma # PostgreSQL schema (Team, Player, Attributes, Fixture, H2H, Tracking)
│   │   │   └── seed.ts       # 4 Clubs, 20 Players, 2 Fixtures, 100 Frames of tracking data
│   │   ├── src/
│   │   │   ├── config/       # Environment & server settings
│   │   │   ├── controllers/  # Player, Match, and Tracking controllers
│   │   │   ├── routes/       # Express route handlers
│   │   │   ├── services/     # Prisma, Redis Pub/Sub, and ML service clients
│   │   │   ├── websocket/    # Socket.io WebSocket Hub & Redis stream consumer
│   │   │   ├── app.ts        # Express app configuration (Helmet, CORS, Morgan)
│   │   │   └── server.ts     # Server entrypoint
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/                 # Next.js 14 App Router + Tailwind CSS
│       ├── src/
│       │   ├── app/
│       │   │   ├── (modules)/
│       │   │   │   ├── scouting/          # Multi-criteria scouting & similar players table
│       │   │   │   ├── match-center/      # Fixtures, H2H, and ML match predictor
│       │   │   │   └── tactical-tracker/  # Video container & real-time canvas visualizer
│       │   │   ├── globals.css            # Dark sports analytics theme & custom scrollbar
│       │   │   ├── layout.tsx             # Root layout with navigation
│       │   │   └── page.tsx               # Executive dashboard
│       │   ├── components/
│       │   │   ├── ui/                    # Navbar, StatCard, and reusable UI
│       │   │   ├── radar-chart.tsx        # Chart.js 7-axis radar chart with comparisons
│       │   │   └── video-overlay-canvas.tsx# HTML5 16:9 Canvas overlay for real-time tracking
│       │   └── lib/
│       │       └── socket.ts              # Socket.io client listener
│       ├── package.json
│       └── tailwind.config.ts
├── services/
│   └── ml/                  # Python 3.11 + FastAPI microservice
│       ├── app/
│       │   ├── api/
│       │   │   ├── endpoints/
│       │   │   │   ├── similarity.py      # Cosine similarity vector search
│       │   │   │   ├── prediction.py      # Logistic/Poisson win probabilities
│       │   │   │   └── tracking.py        # Background CV coordinate stream worker
│       │   │   └── router.py
│       │   ├── core/config.py
│       │   └── main.py                    # FastAPI application & OpenAPI Swagger docs
│       ├── requirements.txt
│       └── Dockerfile
├── packages/
│   └── shared-types/        # Shared DTOs & Contracts (TypeScript)
│       ├── index.ts         # Strictly-typed interfaces (no 'any')
│       └── package.json
├── docker-compose.yml       # Production-ready compose file (Postgres, Redis, ML, API, Web)
├── .env.example             # Global environment configuration template
├── .gitignore
└── README.md
```

---

## ⚡ Quick Start with Docker (Recommended)

Boot the entire platform including PostgreSQL 16, Redis 7, FastAPI ML service, Node.js API Gateway, and Next.js Web:

```bash
# 1. Clone repository & configure environment
cp .env.example .env

# 2. Build and launch all containers
docker compose up --build
```

### Active Ports & Services
| Service | URL | Description |
| :--- | :--- | :--- |
| **Web Frontend** | `http://localhost:3000` | Next.js Tactical Dashboard |
| **API Gateway** | `http://localhost:4000` | Node.js Express REST API |
| **API Health** | `http://localhost:4000/api/v1/health` | Gateway status & uptime |
| **WebSocket Hub** | `ws://localhost:4000` | Socket.io tracking room hub |
| **ML Microservice** | `http://localhost:8000` | FastAPI service |
| **ML Swagger Docs** | `http://localhost:8000/docs` | Interactive OpenAPI documentation |
| **PostgreSQL** | `localhost:5432` | Database (`tactiq_db`) |
| **Redis** | `localhost:6379` | Cache & Pub/Sub stream bus |

---

## 💻 Local Development Setup (Step-by-Step)

If you prefer running services directly in your host environment:

### 1. Install Node.js Workspaces
```bash
npm install
```

### 2. Setup PostgreSQL & Prisma ORM
```bash
# Generate Prisma Client
npm run prisma:generate

# Push schema to database
npm run prisma:push

# Seed sample data (4 clubs, 20 players with radar stats, fixtures, H2H, and 100 tracking frames)
npm run prisma:seed
```

### 3. Run FastAPI ML Microservice
```bash
cd services/ml
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Run API Gateway
```bash
# In another terminal window at root:
npm run dev:api
```

### 5. Run Next.js Web Application
```bash
# In another terminal window at root:
npm run dev:web
```

---

## 📡 API Endpoints Reference

### 1. Player Scouting (`apps/api`)
- `GET /api/v1/players` - Query players with multi-criteria filters:
  - `?position=MID`
  - `?league=Premier+League`
  - `?minPassing=85`
  - `?search=Kevin`
- `GET /api/v1/players/:id` - Fetch player details & 7-axis radar stats.
- `GET /api/v1/players/:id/similar` - Calculates statistical counterparts via FastAPI cosine similarity (includes graceful fallback if ML is offline).

### 2. Match Center & Prediction (`apps/api`)
- `GET /api/v1/matches/fixtures` - List scheduled fixtures with team records.
- `GET /api/v1/matches/h2h/:homeId/:awayId` - Historical head-to-head metrics.
- `POST /api/v1/matches/predict` - Proxies to ML model to compute Home Win / Draw / Away Win probabilities summing to 100% and predicted score.

### 3. Tactical Tracking Stream (`apps/api` & `services/ml`)
- `GET /api/v1/tracking/sessions` - List recorded tactical video sessions.
- `GET /api/v1/tracking/sessions/:id` - Retrieve session metadata & stored frames.
- `POST /api/v1/tracking/start` - Dispatches background CV tracking simulation streaming at 10 FPS over Redis channel `tactiq_tracking_stream`.

### 4. WebSocket Protocol (`apps/api/src/websocket`)
- Connect to `ws://localhost:4000` via Socket.io.
- **Client to Server:**
  - `join_session({ sessionId: string })` - Join room `session_${sessionId}`.
  - `leave_session({ sessionId: string })` - Leave session room.
  - `ping_stream()` - Latency measurement.
- **Server to Client:**
  - `frame_update(payload: TrackingFramePayload)` - Broadcasts real-time 2D coordinates `[{ id, team, x, y, speedKmh }]`.
  - `session_status({ sessionId, status })` - Stream state updates.

---

## 🧪 Testing and Verification

To execute automated test suites and verify compilation across all microservices:
```bash
# Run unit & integration test suite (apps/api)
npm test --workspace=apps/api

# Run ML benchmarking & evaluation suite (services/ml)
python3 services/ml/scripts/benchmark.py

# Build all TypeScript workspaces (types, api, web)
npm run build --workspaces --if-present
```

---

## 📋 Sprint Backlog Implementation Matrix (TSK-01 to TSK-25)

All 25 tasks from the official Sprint Backlog have been executed, verified, and pushed to `main`:

| Task ID | Task Title | Owner / Lead | Status | Commit Reference |
| :--- | :--- | :--- | :---: | :--- |
| **TSK-01** | Setup Prisma ORM & Database Schema | Luthfi (Back-End) | ✅ Completed | `ea98f81` `feat(api): define PostgreSQL schema with Prisma ORM` |
| **TSK-02** | Data Ingestion Pipeline (API-Football) | Luthfi (Back-End) | ✅ Completed | `d1ed4a8` `feat(api): implement automated ETL pipeline and cron ingestion` |
| **TSK-03** | REST API: Player Scouting Endpoints | Luthfi (Back-End) | ✅ Completed | `4d1ffa1` `feat(api): add player scouting REST endpoints with filtering` |
| **TSK-04** | REST API: Match Fixtures & H2H | Luthfi (Back-End) | ✅ Completed | `9e6a160` `feat(api): add match fixtures and head-to-head REST endpoints` |
| **TSK-05** | WebSocket Server: Live Tracking Gateway | Luthfi (Back-End) | ✅ Completed | `ee35da0` `feat(api): implement Redis pub/sub listener and Socket.io gateway` |
| **TSK-06** | API Client & Data Fetching Layer | Ferrel (Front-End) | ✅ Completed | `97e25b5` `feat(scouting): implement dedicated player dossier & API client` |
| **TSK-07** | Error Handling & Security Middleware | Luthfi (Back-End) | ✅ Completed | `91850e3` `feat(api): initialize express server architecture & env config` |
| **TSK-08** | Docker Compose Setup (PostgreSQL + Redis) | Luthfi (Back-End) | ✅ Completed | `5a09cb4` `chore(root): setup monorepo root config, docker-compose` |
| **TSK-09** | Unit & Integration Tests (Back-End) | Luthfi (Back-End) | ✅ Completed | `a1e7abc` `test(api): add unit and integration test suite for gateway & etl` |
| **TSK-10** | CI/CD Pipeline Setup (GitHub Actions) | Luthfi (Back-End) | ✅ Completed | `c926319` `ci(github-actions): setup monorepo continuous integration pipeline` |
| **TSK-11** | UI/UX: Design System & Theme Setup | Ferrel (Front-End) | ✅ Completed | `9db801f` `feat(web): initialize Next.js app with Tailwind dark-mode theme` |
| **TSK-12** | UI: Player Scouting Dashboard & Dossier | Ferrel (Front-End) | ✅ Completed | `97e25b5` `feat(scouting): implement dedicated player dossier profile page` |
| **TSK-13** | UI: Match Center & Standings Table | Ferrel (Front-End) | ✅ Completed | `197fb29` `feat(match-center): add league standings API and interactive UI` |
| **TSK-14** | UI: Tactical CV Tracker Page | Ferrel (Front-End) | ✅ Completed | `85b0bef` `feat(tactical-tracker): add 2D minimap, homography, & YouTube embed` |
| **TSK-15** | Responsive Navigation & Layout | Ferrel (Front-End) | ✅ Completed | `9db801f` `feat(web): initialize Next.js app with Tailwind dark-mode theme` |
| **TSK-16** | Component: Interactive Radar Chart | Ferrel (Front-End) | ✅ Completed | `815bd1b` `feat(web): build interactive Radar Chart and HTML5 Canvas` |
| **TSK-17** | Player Similarity Engine (Cosine Metric) | Fuad (ML) | ✅ Completed | `9c56c61` `feat(ml): implement player similarity and match prediction` |
| **TSK-18** | Match Prediction Model (Poisson / Win Prob) | Fuad (ML) | ✅ Completed | `9c56c61` `feat(ml): implement player similarity and match prediction` |
| **TSK-19** | Computer Vision: YOLO Detection Payload | Fuad (ML) | ✅ Completed | `5e8cbb8` `feat(ml): add background tracking coordinate streamer with Redis` |
| **TSK-20** | CV: Perspective Transform & Homography | Fuad (ML) | ✅ Completed | `85b0bef` `feat(tactical-tracker): add 2D minimap, homography, & YouTube embed` |
| **TSK-21** | Video Processing Pipeline (YouTube / Stream) | Ferrel / Fuad | ✅ Completed | `85b0bef` `feat(tactical-tracker): add 2D minimap, homography, & YouTube embed` |
| **TSK-22** | ML Model Serving API (FastAPI) | Fuad (ML) | ✅ Completed | `c9275b0` `feat(ml): scaffold FastAPI microservice structure & requirements` |
| **TSK-23** | Real-Time Coordinate Streaming to Redis | Fuad (ML) | ✅ Completed | `5e8cbb8` `feat(ml): add background tracking coordinate streamer with Redis` |
| **TSK-24** | Model Evaluation & Performance Benchmark | Fuad (ML) | ✅ Completed | `a5ac56e` `feat(ml): add model evaluation and performance benchmarking suite` |
| **TSK-25** | Documentation & API Reference | Shared (All) | ✅ Completed | `6b68288` `docs(readme): add architecture diagram and local quickstart` |

---

## 📜 License
MIT © 2026 TactIQ Platform Contributors.

