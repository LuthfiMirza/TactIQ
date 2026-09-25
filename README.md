<div align="center">

# ⚽ TactIQ
### Enterprise-Grade Football Intelligence & Tactical Tracking Platform

[![Next.js](https://img.shields.io/badge/Next.js-14_App_Router-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Express.js](https://img.shields.io/badge/Express.js-4.19+-000000?style=for-the-badge&logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7.2_Streams-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose_Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

<p align="center">
  <b>TactIQ</b> is an advanced sports analytics and tactical computer vision ecosystem designed for modern football clubs, performance analysts, and scouting departments. It unifies high-dimensional player radar profiles, bivariate statistical match forecasting, and real-time 2D pitch tracking streamed directly to interactive HTML5 overlays.
</p>

[Key Features](#-key-capabilities) • [System Architecture](#-system-architecture) • [Microservices](#-monorepo-services) • [Quick Start](#-quick-start-with-docker) • [API & WebSockets](#-api--websocket-specification) • [Audit & Verification](#-system-quality-audit)

---

</div>

## 🌟 Key Capabilities

### 1. 🔍 Advanced Scouting & Metric Radar Dossiers
- **7-Axis Skill Profiling:** Visualizes physical and technical traits (Pace, Shooting, Passing, Dribbling, Defending, Physical, Vision) via normalized interactive radar charts.
- **High-Dimensional Similarity Engine:** Employs blended Cosine Similarity (directional alignment) and Euclidean proximity (trait magnitude) to surface statistical counterparts across European leagues.
- **Multi-Criteria Query Pipeline:** High-performance filtering across positions, domestic leagues, market valuation thresholds, and minimum attribute floors.

### 2. 🔮 Match Center & Predictive Intelligence
- **Probabilistic Outcome Modeling:** Computes balanced Home Win / Draw / Away Win distributions that mathematically sum to 100%, weighted by rolling form momentum and venue advantage.
- **Head-to-Head (H2H) Historical Analysis:** Synthesizes past encounters, goal disparities, and tactical matchup tendencies.
- **Bivariate Scoreline Forecasting:** Estimates expected goals ($xG$) and projects the most probable final scoreline distribution.

### 3. 🎯 Computer Vision Tactical Tracking (2D Pitch Overlay)
- **High-Frequency Ingestion Pipeline:** Streams player and ball coordinates at 10 frames per second over Redis Pub/Sub directly to connected web clients via Socket.io rooms.
- **Perspective Homography Correction:** Maps broadcast camera angles and perspective distortions onto FIFA-standard canonical 2D pitch coordinates ($105\text{m} \times 68\text{m}$).
- **Kinematic Visualizer:** Renders entity velocities, dynamic motion trails, tactical formations, and event timeline markers over YouTube or custom match feeds.

---

## 🏛️ System Architecture

TactIQ is engineered as a loosely coupled, event-driven monorepo architecture. Shared domain models guarantee end-to-end type safety between the TypeScript API Gateway, Next.js frontend, and the Python FastAPI ML microservice.

```
                                  [ Browser / Client ]
                                            │
                             ┌──────────────┴──────────────┐
                             │ HTTP / Next.js              │ WebSocket (Socket.io)
                             ▼                             ▼
                    ┌─────────────────┐           ┌─────────────────┐
                    │    apps/web     │           │    apps/api     │
                    │  (Next.js 14)   │           │ (Express/Prisma)│
                    │   Client UI     │           │   API Gateway   │
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
                                                                       │ (FastAPI Engine)│
                                                                       │  Scikit / NumPy │
                                                                       └─────────────────┘
```

### Data & Event Flow
1. **Scouting Flow:** Web client requests player profile $\rightarrow$ API Gateway queries PostgreSQL $\rightarrow$ Dispatches vector computation to FastAPI $\rightarrow$ Returns top 5 statistical twins.
2. **Match Analyst Flow:** User selects fixture $\rightarrow$ Fetches H2H record $\rightarrow$ API proxies parameters to ML prediction engine $\rightarrow$ Visualizes win probability distribution and tactical insights.
3. **Tactical Tracking Flow:** User starts video session $\rightarrow$ ML worker processes detection coordinates $\rightarrow$ Coordinates publish to Redis channel `tactiq_tracking_stream` $\rightarrow$ Node.js Socket.io broadcasts to subscribers $\rightarrow$ HTML5 Canvas draws 16:9 pitch overlay.

---

## 📦 Monorepo Services

| Directory | Service Name | Tech Stack | Primary Responsibility |
| :--- | :--- | :--- | :--- |
| **`apps/web`** | **TactIQ Web UI** | Next.js 14, Tailwind CSS, Chart.js, Lucide Icons | Responsive sports analyst dashboard, radar charts, video canvas |
| **`apps/api`** | **Central API Gateway** | Node.js, Express, TypeScript, Prisma ORM, Socket.io | Relational schema, ETL cron pipelines, WebSocket streaming hub |
| **`services/ml`** | **ML Intelligence Engine** | Python 3.11, FastAPI, Scikit-learn, NumPy | Vector similarity, match prediction models, field homography |
| **`packages/shared-types`** | **Domain Contracts** | TypeScript (ESNext / CJS) | Synchronized DTOs, API contracts, WebSocket event maps |

---

## ⚡ Quick Start with Docker

The fastest way to spin up the entire production-ready TactIQ platform:

```bash
# 1. Clone repository
git clone https://github.com/LuthfiMirza/TactIQ.git
cd TactIQ

# 2. Configure environment variables
cp .env.example .env

# 3. Build and launch all microservices in background
docker compose up --build -d
```

### Service Health & Port Mapping

| Service | Port | Endpoint URL | Status / Notes |
| :--- | :---: | :--- | :--- |
| **Web Frontend** | `3000` | `http://localhost:3000` | Tactical Analytics Dashboard |
| **API Gateway** | `4000` | `http://localhost:4000/api/v1` | Express REST Endpoints |
| **Gateway Health** | `4000` | `http://localhost:4000/api/v1/health` | Gateway status & uptime |
| **WebSocket Hub** | `4000` | `ws://localhost:4000` | Socket.io Live Stream Hub |
| **ML Microservice** | `8000` | `http://localhost:8000` | FastAPI Inference Engine |
| **OpenAPI Docs** | `8000` | `http://localhost:8000/docs` | Interactive Swagger UI |
| **PostgreSQL 16** | `5432` | `localhost:5432` | Database (`tactiq_db`) |
| **Redis 7.2** | `6379` | `localhost:6379` | In-memory message bus |

---

## 💻 Local Development Setup

For local step-by-step development across decoupled terminals:

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.10 or v3.11
- **PostgreSQL**: v15 or higher
- **Redis**: v6 or higher

### 1. Workspace Installation
```bash
# Install root and workspace dependencies
npm install
```

### 2. Database Migration & Seeding
```bash
# Generate Prisma client
npm run prisma:generate

# Push schema directly to PostgreSQL
npm run prisma:push

# Seed database (4 top European clubs, 20 players with radar attributes, fixtures, and 100 tracking frames)
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
# In another terminal window:
npm run dev:api
```

### 5. Run Next.js Web App
```bash
# In another terminal window:
npm run dev:web
```

---

## 📡 API & WebSocket Specification

### 1. Player Scouting Endpoints
```http
GET  /api/v1/players                # Query players with filters: ?position=MID&league=Premier+League&minPassing=85&search=Kevin
GET  /api/v1/players/:id            # Fetch player bio and 7-axis radar metrics
GET  /api/v1/players/:id/similar    # Compute top 5 statistical counterparts via ML similarity
```

### 2. Match Center Endpoints
```http
GET  /api/v1/matches/fixtures       # List scheduled and past match fixtures
GET  /api/v1/matches/standings      # Retrieve official league standings table
GET  /api/v1/matches/h2h/:hId/:aId  # Query Head-to-Head record between two teams
POST /api/v1/matches/predict        # Predict win probabilities (Home, Draw, Away) and scoreline
```

### 3. Tactical Tracking Endpoints & WebSocket Events
```http
GET  /api/v1/tracking/sessions      # List recorded tactical camera sessions
GET  /api/v1/tracking/sessions/:id  # Retrieve session metadata and stored frame coordinates
POST /api/v1/tracking/start         # Trigger background CV tracking stream at 10 FPS
```

#### WebSocket Interface (`ws://localhost:4000`)
```typescript
// Client -> Server
socket.emit('join_session', { sessionId: string });
socket.emit('leave_session', { sessionId: string });
socket.emit('ping_stream');

// Server -> Client
socket.on('frame_update', (payload: TrackingFramePayload) => {
  // payload.entities: Array<{ id, team, x, y, speedKmh, jerseyNumber }>
});
socket.on('session_status', ({ sessionId, status }) => { ... });
```

---

## 🧪 Testing & Code Quality

```bash
# Run unit & integration test suite (apps/api)
npm test --workspace=apps/api

# Run ML benchmarking & model verification (services/ml)
python3 services/ml/scripts/benchmark.py

# Verify TypeScript compilation across all packages
npm run build --workspaces --if-present
```

---

## 🛡️ System Quality Audit

A comprehensive 5-layer engineering audit was executed across Data, ML Algorithms, Backend Gateway, Frontend UI, and End-to-End integration scenarios.

Detailed findings, mathematical root causes, cross-service contract matrices, and concrete code patches are documented in:  
👉 **[View the Complete System Audit Report (`AUDIT_REPORT.md`)](./AUDIT_REPORT.md)**

---

## 👥 Engineering Team & Architecture Ownership

- **Luthfi** — *Back-End Architecture & Database Systems* (`apps/api`, Prisma ORM, PostgreSQL, ETL Pipelines, WebSocket Gateway)
- **Fuad** — *Machine Learning & Computer Vision* (`services/ml`, Cosine Similarity, Match Outcome Modeling, Homography)
- **Ferrel** — *Front-End Engineering & Visualizations* (`apps/web`, Next.js 14, Radar Visualizations, HTML5 Canvas Overlay)

---

## 📜 License

This project is licensed under the terms of the **MIT License**.  
© 2026 TactIQ Platform Contributors.
