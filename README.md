<div align="center">

<img src="https://img.shields.io/badge/-%F0%9F%9A%81%20SKYMED-0a0f1e?style=for-the-badge&logoColor=00d4ff" />

# SkyMed
### The Last Mile is the Hardest Mile.

*We built the software that crosses it.*

---

[![Python](https://img.shields.io/badge/Python_3.11-FastAPI-009688?style=flat-square&logo=python&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React_18-TypeScript-3178c6?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![SQLite](https://img.shields.io/badge/SQLite-Edge_Persistent-044a64?style=flat-square&logo=sqlite&logoColor=white)](https://sqlite.org)
[![Leaflet](https://img.shields.io/badge/Leaflet-Live_Maps-199900?style=flat-square&logo=leaflet&logoColor=white)](https://leafletjs.com)
[![Docker](https://img.shields.io/badge/Docker-One_Command-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![APSCHE](https://img.shields.io/badge/APSCHE_NTD-2026_Submission-ffb300?style=flat-square)](https://apsche.ac.in)
[![License](https://img.shields.io/badge/License-MIT-00d4ff?style=flat-square)](LICENSE)

</div>

---

## The Problem

A tribal mother in Paderu, Alluri Sitarama Raju district, goes into labour at 2 AM.

The nearest doctor is **47 kilometres away**. The road washed out in the monsoon. The PHC has no anaesthetist. Her ASHA worker — the one trained, trusted health link in this village — has no way to reach anyone faster than a four-hour jeep ride on a dirt track.

This is not a hypothetical. It is **Tuesday night** in tribal Andhra Pradesh.

- **1 doctor per 10,000+ population** in Schedule V tribal areas
- **<23% reliable 4G coverage** in Alluri Sitarama Raju district (DoT Digital Bharat Nidhi gap reports)
- **2.3× the state average** maternal mortality in tribal districts
- **4–6 hours** average emergency response time

The golden hour does not wait for bad roads.

---

## What SkyMed Is

SkyMed is the **command, coordination, and intelligence software layer** for a VTOL medical drone network serving tribal Andhra Pradesh.

It is **not** a diagnostic tool.  
It is **not** a hardware project.  
It is **not** a kiosk in a forest.

It does **one thing precisely**: ensures the right medicine reaches the right ASHA worker — within the golden hour — through software that works offline, respects medical ethics, and trusts the humans already in the field.

```
ASHA captures vitals → Tablet scores triage locally (offline) →
LoRa mesh relays alert → Doctor reviews + confirms →
Drone dispatches to landing pad → ASHA carries last mile →
Patient receives care within golden hour
```

---

## Architecture: Three Rings

```
┌─────────────────────────────────────────────────────────────┐
│                    DISTRICT CLOUD                           │
│         AMTZ Doctor Dashboard · State Analytics            │
│              AES-256 · DPDP Act 2023 Aligned               │
│  ┌───────────────────────────────────────────────────┐     │
│  │                 VILLAGE MESH                      │     │
│  │     LoRa Store-and-Forward · No PII Broadcast    │     │
│  │          ASHA Worker Tech Kit · Solar             │     │
│  │  ┌─────────────────────────────────────────┐    │     │
│  │  │            DRONE EDGE                   │    │     │
│  │  │  Vitals Rules Engine · Visual Risk Proxy │    │     │
│  │  │   Offline-First · INT8 Ready · Telugu UI │    │     │
│  │  └─────────────────────────────────────────┘    │     │
│  └───────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

**Why three rings?** Because the internet disappears in a valley. The ring closest to the patient must never need it.

### Layer 1 — Drone Edge (Rugged Tablet)
The ASHA worker's tablet runs a vitals-first triage scoring engine **entirely offline**. Bluetooth vitals peripherals (pulse oximeter, BP cuff, thermometer) feed directly into the rules engine. The Telugu-language, voice-guided interface requires no training beyond what ASHAs already know. If `triage_mobilenet_v3_int8.onnx` is present, the visual input path upgrades to a quantized edge model. Until pilot data validates a clinical model, the demo runs a transparent visual-risk proxy — and says so openly.

### Layer 2 — Village Mesh (LoRa Gateway)
When the tablet scores a P1, a compact structured packet — no patient PII — is broadcast over LoRa mesh to the nearest SkyMed base node. Store-and-forward means **no case is ever lost** when connectivity is intermittent. The node batches packets for the district hub when any uplink (4G, VSAT, or opportunistic WiFi) becomes available.

### Layer 3 — District Cloud (AMTZ Dashboard)
A doctor at the district hub receives the telemetry packet via WebSocket. They review vitals, call the ASHA worker directly, and — only after explicit confirmation — trigger a drone dispatch. **No autonomous dispatch. Ever.** The human is always the final authority.

---

## Quick Start

### One Command

```bash
git clone https://github.com/vivekyarra/skymed.git
cd skymed
docker-compose up --build
```

| Service | URL |
|---|---|
| Dashboard | http://localhost:5173 |
| API Docs (Swagger) | http://localhost:8000/docs |
| Health Check | http://localhost:8000/api/health |
| Model Status | http://localhost:8000/api/model/status |

### Manual Setup

**Backend**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

---

## API Reference

| Method | Route | What it does |
|---|---|---|
| `POST` | `/api/triage` | Vitals + image → P1/P2/P3 score + suggested payload |
| `POST` | `/api/drone/dispatch` | Doctor-confirmed dispatch only; weight + wind validated |
| `GET` | `/api/drone/telemetry/{mission_id}` | Live drone position, battery, ETA, status |
| `GET` | `/api/cases` | Last 50 cases; filter by priority, status, village |
| `GET` | `/api/mesh/nodes` | 13 tribal AP mesh nodes with connectivity telemetry |
| `POST` | `/api/mesh/inject` | Inject a packet; trace its route across the mesh |
| `POST` | `/api/sync` | Simulate edge-to-cloud store-and-forward flush |
| `WS` | `/ws/live` | Live broadcast: missions, P1 alerts, mesh summary |

Full Swagger docs at `/docs` when running.

---

## Demo Walkthrough (For Judges)

> Run `docker-compose up --build` first. The database seeds 30 realistic cases on startup.

**Step 1 — Command Center**
Open `http://localhost:5173`. You land on the Dashboard. Tribal AP centered on the Leaflet dark-tile map. Pulsing cyan mesh nodes. P1 alert feed on the right. Drone telemetry strip at the bottom. Everything is live via WebSocket.

**Step 2 — Edge Tablet (ASHA Interface)**
Click **Edge Tablet** in the sidebar. This is what the ASHA worker sees: Telugu UI, large single-action buttons, Bluetooth vitals capture. Click **Scan Vitals** — watch the Bluetooth animation and auto-populated critical values appear in 1.5 seconds. This simulates the peripheral handshake.

**Step 3 — Submit a P1 Case**
Open **Triage Portal**. Upload any photo (a wound image works best for demo). Enter these vitals:
- SpO2: `88` 
- Heart Rate: `132`
- Temperature: `103.8`
- Systolic BP: `84`
- Chief Complaint: `Snakebite`

Click **Analyze & Triage**. Watch the RadialBar gauge animate to a P1 score. Flagged vitals appear in red. Suggested payload auto-populates.

**Step 4 — Doctor Confirmation + Dispatch**
Toggle **Doctor Confirmed** to ON. Click **Dispatch Drone**. In the modal, select payload items — the weight bar turns amber near 1.2kg and red at 1.5kg. Confirm. Mission ID appears.

**Step 5 — Live Drone Tracking**
Open **Drone Fleet**. Watch the mission stepper: Dispatched → En Route → Approaching → Landing → Returning. The drone marker on the Dashboard map moves in real time.

**Step 6 — Offline Mode**
Toggle **Offline Mode** in the top bar. Submit another triage case. The UI switches to **Local Edge Mode**. The sync queue badge shows `1 Pending`. Toggle back online — watch the animated three-stage flush: ASHA Tablet → Village Mesh → District Cloud.

**Step 7 — Mesh Network**
Open **Mesh Network**. See the 13 tribal AP nodes, their LoRa connectivity status, last sync times, and data flow animation. Click **Simulate Sync** for the animated batch flush.

---

## What We Don't Claim (And Why That Matters)

| What SkyMed does NOT do | Why we are explicit about this |
|---|---|
| Autonomous diagnosis | AI assigns urgency priority only. NMC telemedicine guidelines require a registered practitioner for all clinical decisions. |
| Transport infectious biological samples | TB cultures and biopsies require biohazard protocols; a drone crash is a public health incident. Outbound data only. |
| BVLOS operations in Phase 1 | Phase 1 is VLOS (<450m, DGCA compliant). BVLOS is Phase 2 after exemption application. |
| Quantum encryption | AES-256 + DPDP Act 2023 aligned. QKD requires hardware that cannot run on a LoRa node. |
| Cold-chain payloads in Phase 1 | Antivenom requires refrigeration. Phase 1 carries heat-stable items only. Phase 2 adds an insulated pod. |

The responsible part of "Responsible Innovation" is knowing where to stop.

---

## Payload Constraints

| Item | Weight |
|---|---|
| EpiPen 2-pack | 0.18 kg |
| ORS Sachets ×10 | 0.25 kg |
| Wound Dressing Kit | 0.35 kg |
| Rapid Malaria/Dengue Test Kit | 0.12 kg |
| Glucagon Emergency Kit | 0.22 kg |
| Blood Glucose Strips Kit | 0.08 kg |
| **Maximum per mission** | **1.50 kg** |

Dispatch is rejected automatically if payload exceeds 1.5 kg or wind speed exceeds 8 m/s.

---

## Impact Model

| Input | Value | Source |
|---|---|---|
| Tribal habitations in scope | 847 | Paderu ITDA jurisdiction |
| High-risk health events per hamlet/month | ~12 | NHM tribal district baseline |
| P1 access-gap proxy | 28.3% | Conservative estimate |
| **Potential P1 review opportunities/month** | **~2,874** | 847 × 12 × 28.3% |

> "This is a proxy pending pilot data. We've been deliberately conservative." — the answer any judge should hear.

---

## Roadmap

| Phase | Timeline | Milestone |
|---|---|---|
| **Phase 1** | 0–3 months | Software simulation + AMTZ MoU discussion + safety protocol documentation |
| **Phase 2** | 3–9 months | VLOS pilot: Paderu block, 3 villages, 3 drones, cold-chain pod development |
| **Phase 3** | 9–18 months | DGCA BVLOS exemption application + 13 tribal district rollout |
| **Phase 4** | 18–36 months | NHA partnership + national replication model |

---

## Technology Stack

| Layer | Stack |
|---|---|
| Backend | FastAPI · SQLModel · SQLite · WebSocket · Pillow |
| Triage Engine | Weighted vitals rules · transparent visual-risk proxy · optional ONNX hook |
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS |
| Maps | Leaflet · react-leaflet · CartoDB dark tiles |
| Charts | Recharts (AreaChart, RadialBar, PieChart, BarChart) |
| Animation | Framer Motion |
| Realtime | Native WebSocket |
| Infrastructure | Docker Compose · Railway (backend) · Vercel (frontend) |

---

## APSCHE Thematic Alignment

| Theme | SkyMed |
|---|---|
| ✅ AI & Electronics | Edge triage priority scoring with transparent visual-risk proxy |
| ✅ Space Technology & Drones | VTOL dispatch and coordination software layer |
| ✅ Medicine, Biotechnology & Allied Life Sciences | ASHA-integrated care relay, doctor-confirmed dispatch, NMC compliant |

Three themes. Claimed honestly. Defended with specifics.

---

## Built For

**APSCHE National Technology Day 2026**  
Theme: *Responsible Innovation for Inclusive Growth*  
Amaravati Vigyan Puraskar — Top Use Case  

Submitted by **Vivek Yarra**  
III Year B.Tech CSE · Vignan's LARA Institute of Technology & Science, Guntur  

---

<div align="center">

*"SkyMed does not replace the doctor. It ensures the doctor sees the right patient first — before the patient runs out of time."*

**[Live Demo](https://frontend-chi-green-80.vercel.app) · [API Docs](https://skymed-backend-production.up.railway.app/docs) · [Use Case Document](docs/use_case_document.md) · [Architecture](docs/architecture.svg)**

MIT License · Built with purpose for tribal Andhra Pradesh

</div>