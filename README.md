# SkyMed

![Python FastAPI](https://img.shields.io/badge/Python-FastAPI-009688)
![React TypeScript](https://img.shields.io/badge/React-TypeScript-3178c6)
![SQLite](https://img.shields.io/badge/SQLite-Local%20Edge-044a64)
![Leaflet](https://img.shields.io/badge/Leaflet-Maps-199900)
![APSCHE NTD 2026](https://img.shields.io/badge/APSCHE%20NTD-2026-ffb300)
![MIT License](https://img.shields.io/badge/License-MIT-00d4ff)

SkyMed is the command, coordination, and intelligence software layer for a VTOL medical drone network serving tribal Andhra Pradesh. It is an offline-first triage priority scoring system, drone dispatch coordination platform, and telemetry relay linking ASHA workers to AMTZ doctors. It does not diagnose, does not transport infectious biological samples, and does not dispatch drones without doctor confirmation.

## Architecture

SkyMed has three layers:

- Drone Edge: rugged Android tablet, Bluetooth vitals, local vitals-first triage priority scoring, symptom photo capture with an explicit visual-risk proxy.
- Village Mesh: LoRa store-and-forward node, no PII in mesh broadcast, offline queue.
- District Cloud: AMTZ doctor dashboard, WebSocket telemetry, dispatch go/no-go checks, state health analytics.

See [docs/architecture.svg](docs/architecture.svg) and [docs/use_case_document.md](docs/use_case_document.md).

## Quick Start

```bash
docker-compose up --build
```

Open:

- Frontend: http://localhost:5173
- Backend API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/api/health
- Visual model status: http://localhost:8000/api/model/status

## Model Disclosure

This repository does not bundle a trained or clinically validated wound severity classifier. By default the backend reports `visual_risk_proxy` mode and uses an inspectable image cue score from brightness, contrast, color balance, and image entropy. If a trained ONNX artifact is mounted at `backend/models/triage_mobilenet_v3_int8.onnx`, `/api/model/status` will report whether it loaded.

Judge-facing answer: "There is no validated wound classifier bundled in this demo; visual input is a transparent proxy pending pilot data and a documented model artifact."

## Manual Setup

Backend:

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## API Docs

Primary routes:

- `POST /api/triage`: multipart image plus vitals JSON; returns case ID, triage score, priority, action, payload, ETA, and flagged vitals.
- `POST /api/drone/dispatch`: doctor-confirmed dispatch only; validates payload weight and wind go/no-go.
- `GET /api/drone/telemetry/{mission_id}`: interpolated drone position, battery, ETA, status.
- `GET /api/cases`: newest 50 cases with priority/status/village filters.
- `GET /api/mesh/nodes`: 13 real tribal AP mesh nodes with store-and-forward simulation telemetry.
- `POST /api/mesh/inject`: inject a packet and trace its route across the mesh.
- `POST /api/sync`: edge-to-cloud sync simulation.
- `WebSocket /ws/live`: active missions, P1 alerts, mesh summary, airborne drones, recent cases.

## Demo Walkthrough

1. Start backend and frontend with Docker or manual setup.
2. Open the dashboard and confirm the map is centered on tribal Andhra Pradesh.
3. Check pulsing mesh nodes, P1 alert feed, and drone telemetry strip.
4. Open the **Edge Tablet** tab to see the simulated ASHA worker interface in Telugu/English with Bluetooth vitals capture.
5. Open Triage Portal or use the Edge Tablet to submit a case.
6. Upload a symptom photo for visual cues.
7. Use the default P1-style vitals or enter severe values: SpO2 88, HR 132, systolic BP 84, chief complaint snakebite.
8. Click `Analyze & Triage`.
9. Confirm the response shows `P1`, score, flagged vitals, suggested heat-stable payload, and drone ETA.
10. Toggle `Doctor Confirmed`.
11. Click `Dispatch Drone`, select payload items, and confirm the payload stays under 1.5kg.
12. Confirm a mission ID appears, then open Drone Fleet to watch route, status stepper, and battery telemetry.
13. Return to the navbar and toggle Offline Mode.
14. Submit another triage case while offline.
15. Confirm the UI switches to Local Edge Mode and shows `Sync Queue: 1 Pending`.
16. Toggle back online and watch the animated flush from ASHA tablet to village mesh to district cloud.

## Deployment

The backend is a FastAPI app with SQLite for the demo. For pilot deployment, replace SQLite with managed PostgreSQL, pin package versions, configure HTTPS, mount encrypted storage for local queues, and place the API behind a government-approved network boundary. The frontend is a Vite static app and can be built with:

```bash
cd frontend
npm run build
```

## Tech Stack

- FastAPI, SQLModel, SQLite, optional ONNXRuntime hook, Pillow
- React, TypeScript, Vite, Tailwind
- Leaflet maps, Recharts analytics, Framer Motion interactions
- WebSocket live telemetry
- Docker Compose for local judge demo

## License

MIT License. Built for APSCHE National Technology Day 2026 under the theme "Responsible Innovation for Inclusive Growth."
