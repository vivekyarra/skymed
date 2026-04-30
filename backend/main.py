from __future__ import annotations

import asyncio
import json
import os
import random
import uuid
from datetime import datetime, timezone
from io import BytesIO
from typing import Any, Optional

from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel, Field
from sqlmodel import Session, SQLModel, create_engine, desc, select

from drone_simulator import build_waypoints, choose_origin, interpolate_route, mission_estimates, random_wind_speed_ms
from models import Case, Mission, utc_now
from seed_data import VILLAGE_COORDS, seed_database
from mesh_engine import generate_mesh_status, simulate_packet_routing, run_mesh_heartbeat
from triage_engine import CHIEF_COMPLAINTS, PAYLOAD_LABELS, PAYLOAD_WEIGHTS_KG, calculate_payload_weight, score_triage
from triage_model import estimate_visual_severity, get_visual_model_status


DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./skymed.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

app = FastAPI(
    title="SkyMed Command API",
    version="1.0.0",
    description="Offline-first triage scoring, mesh relay, and doctor-confirmed VTOL dispatch coordination.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class DispatchRequest(BaseModel):
    case_id: str
    drone_id: str
    destination_lat: float
    destination_lon: float
    payload_manifest: list[str] = Field(default_factory=list)
    doctor_confirmed: bool


def _json_loads(value: str, fallback: Any) -> Any:
    try:
        return json.loads(value)
    except Exception:
        return fallback


def _aware_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def case_to_public(case: Case) -> dict[str, Any]:
    return {
        "case_id": case.case_id,
        "patient_name": case.patient_name,
        "age": case.age,
        "sex": case.sex,
        "asha_id": case.asha_id,
        "asha_name": case.asha_name,
        "village_name": case.village_name,
        "gps_lat": case.gps_lat,
        "gps_lon": case.gps_lon,
        "heart_rate": case.heart_rate,
        "spo2": case.spo2,
        "temperature_f": case.temperature_f,
        "systolic_bp": case.systolic_bp,
        "diastolic_bp": case.diastolic_bp,
        "chief_complaint": case.chief_complaint,
        "visual_severity_score": case.visual_severity_score,
        "visual_features": _json_loads(case.visual_features_json, {}),
        "triage_score": case.triage_score,
        "priority": case.priority,
        "recommended_action": case.recommended_action,
        "suggested_payload": _json_loads(case.suggested_payload_json, []),
        "suggested_payload_labels": [PAYLOAD_LABELS.get(item, item) for item in _json_loads(case.suggested_payload_json, [])],
        "vitals_flagged": _json_loads(case.vitals_flagged_json, []),
        "status": case.status,
        "doctor_reviewed": case.doctor_reviewed,
        "mission_id": case.mission_id,
        "timestamp": case.created_at.isoformat(),
        "created_at": case.created_at.isoformat(),
        "updated_at": case.updated_at.isoformat(),
    }


def mission_to_public(mission: Mission) -> dict[str, Any]:
    return {
        "mission_id": mission.mission_id,
        "case_id": mission.case_id,
        "drone_id": mission.drone_id,
        "origin_name": mission.origin_name,
        "origin_lat": mission.origin_lat,
        "origin_lon": mission.origin_lon,
        "destination_lat": mission.destination_lat,
        "destination_lon": mission.destination_lon,
        "payload_manifest": _json_loads(mission.payload_manifest_json, []),
        "payload_weight_kg": mission.payload_weight_kg,
        "wind_speed_ms": mission.wind_speed_ms,
        "go_nogo": mission.go_nogo,
        "rejection_reason": mission.rejection_reason,
        "estimated_flight_time_min": mission.estimated_flight_time_min,
        "battery_required_pct": mission.battery_required_pct,
        "waypoints": _json_loads(mission.waypoints_json, []),
        "status": mission.status,
        "start_time": mission.start_time.isoformat(),
        "created_at": mission.created_at.isoformat(),
    }


@app.on_event("startup")
def on_startup() -> None:
    SQLModel.metadata.create_all(engine)
    seed_database(engine)
    visual_status = get_visual_model_status()
    print(
        "SkyMed visual triage mode: "
        f"{visual_status['mode']} "
        f"(ONNX present={visual_status['onnx_artifact_present']}, "
        f"loaded={visual_status['onnx_loaded']})"
    )
    asyncio.create_task(run_mesh_heartbeat())


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "service": "SkyMed Command API",
        "timestamp": utc_now().isoformat(),
        "visual_model": get_visual_model_status(),
    }


@app.get("/api/model/status")
def visual_model_status() -> dict[str, Any]:
    return get_visual_model_status()


@app.post("/api/triage")
async def create_triage_case(image: UploadFile = File(...), vitals: str = Form(...)) -> dict[str, Any]:
    try:
        vitals_data = json.loads(vitals)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="vitals must be valid JSON") from exc

    required_fields = [
        "heart_rate",
        "spo2",
        "temperature_f",
        "systolic_bp",
        "diastolic_bp",
        "age",
        "sex",
        "chief_complaint",
        "gps_lat",
        "gps_lon",
        "village_name",
        "asha_id",
    ]
    missing = [field for field in required_fields if field not in vitals_data]
    if missing:
        raise HTTPException(status_code=422, detail=f"Missing fields: {', '.join(missing)}")
    if vitals_data["chief_complaint"] not in CHIEF_COMPLAINTS:
        raise HTTPException(status_code=422, detail="Unsupported chief_complaint")

    image_bytes = await image.read()
    try:
        visual_result = estimate_visual_severity(Image.open(BytesIO(image_bytes)))
    except Exception:
        visual_result = estimate_visual_severity(Image.new("RGB", (32, 32), color=(128, 64, 64)))

    try:
        scored = score_triage(vitals_data, int(visual_result["severity_score"]))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    case_id = str(uuid.uuid4())
    now = utc_now()
    patient_name = vitals_data.get("patient_name") or "ASHA-Submitted Patient"
    asha_name = vitals_data.get("asha_name") or "ASHA Worker"

    case = Case(
        case_id=case_id,
        patient_name=patient_name,
        age=int(vitals_data["age"]),
        sex=str(vitals_data["sex"]),
        asha_id=str(vitals_data["asha_id"]),
        asha_name=asha_name,
        village_name=str(vitals_data["village_name"]),
        gps_lat=float(vitals_data["gps_lat"]),
        gps_lon=float(vitals_data["gps_lon"]),
        heart_rate=int(vitals_data["heart_rate"]),
        spo2=int(vitals_data["spo2"]),
        temperature_f=float(vitals_data["temperature_f"]),
        systolic_bp=int(vitals_data["systolic_bp"]),
        diastolic_bp=int(vitals_data["diastolic_bp"]),
        chief_complaint=str(vitals_data["chief_complaint"]),
        visual_severity_score=int(visual_result["severity_score"]),
        visual_features_json=json.dumps(visual_result["visual_features"]),
        triage_score=scored["triage_score"],
        priority=scored["priority"],
        recommended_action=scored["recommended_action"],
        suggested_payload_json=json.dumps(scored["suggested_payload"]),
        vitals_flagged_json=json.dumps(scored["vitals_flagged"]),
        status="pending",
        created_at=now,
        updated_at=now,
    )

    with Session(engine) as session:
        session.add(case)
        session.commit()
        session.refresh(case)

    return {
        "case_id": case.case_id,
        "triage_score": case.triage_score,
        "priority": case.priority,
        "recommended_action": case.recommended_action,
        "suggested_payload": _json_loads(case.suggested_payload_json, []),
        "drone_eta_min": scored["drone_eta_min"],
        "vitals_flagged": _json_loads(case.vitals_flagged_json, []),
        "visual_assessment": visual_result,
        "timestamp": case.created_at.isoformat(),
        "asha_id": case.asha_id,
    }


@app.post("/api/drone/dispatch")
def dispatch_drone(request: DispatchRequest) -> dict[str, Any]:
    if not request.doctor_confirmed:
        raise HTTPException(status_code=400, detail="Doctor confirmation is required before dispatch.")

    unknown_payloads = [item for item in request.payload_manifest if item not in PAYLOAD_WEIGHTS_KG]
    if unknown_payloads:
        raise HTTPException(status_code=422, detail=f"Unknown payload items: {', '.join(unknown_payloads)}")

    payload_weight = calculate_payload_weight(request.payload_manifest)
    if payload_weight > 1.5:
        raise HTTPException(status_code=400, detail="Payload exceeds 1.5kg mission limit.")

    wind_speed = random_wind_speed_ms()
    if wind_speed > 8:
        return {
            "mission_id": None,
            "go_nogo": False,
            "rejection_reason": "Wind speed exceeds 8 m/s operational ceiling.",
            "estimated_flight_time_min": None,
            "waypoints": [],
            "battery_required_pct": None,
            "payload_weight_kg": payload_weight,
            "wind_speed_ms": wind_speed,
        }

    with Session(engine) as session:
        case = session.get(Case, request.case_id)
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")

        origin_name, origin_lat, origin_lon = choose_origin(request.destination_lat, request.destination_lon)
        waypoints = build_waypoints(origin_lat, origin_lon, request.destination_lat, request.destination_lon)
        estimates = mission_estimates(origin_lat, origin_lon, request.destination_lat, request.destination_lon)
        mission_id = str(uuid.uuid4())
        mission = Mission(
            mission_id=mission_id,
            case_id=request.case_id,
            drone_id=request.drone_id,
            origin_name=origin_name,
            origin_lat=origin_lat,
            origin_lon=origin_lon,
            destination_lat=request.destination_lat,
            destination_lon=request.destination_lon,
            payload_manifest_json=json.dumps(request.payload_manifest),
            payload_weight_kg=payload_weight,
            wind_speed_ms=wind_speed,
            go_nogo=True,
            estimated_flight_time_min=estimates["estimated_flight_time_min"],
            battery_required_pct=estimates["battery_required_pct"],
            waypoints_json=json.dumps(waypoints),
            status="en_route",
            start_time=utc_now(),
            created_at=utc_now(),
        )
        case.status = "dispatched"
        case.doctor_reviewed = True
        case.mission_id = mission_id
        case.updated_at = utc_now()
        session.add(mission)
        session.add(case)
        session.commit()
        session.refresh(mission)

    return {
        "mission_id": mission.mission_id,
        "go_nogo": True,
        "rejection_reason": None,
        "estimated_flight_time_min": mission.estimated_flight_time_min,
        "waypoints": _json_loads(mission.waypoints_json, []),
        "battery_required_pct": mission.battery_required_pct,
        "payload_weight_kg": mission.payload_weight_kg,
        "wind_speed_ms": mission.wind_speed_ms,
    }


@app.get("/api/drone/telemetry/{mission_id}")
def drone_telemetry(mission_id: str) -> dict[str, Any]:
    with Session(engine) as session:
        mission = session.get(Mission, mission_id)
        if not mission:
            raise HTTPException(status_code=404, detail="Mission not found")
        waypoints = _json_loads(mission.waypoints_json, [])
        movement = interpolate_route(
            waypoints,
            mission.start_time,
            mission.estimated_flight_time_min,
            mission.destination_lat,
            mission.destination_lon,
        )
        mission.status = movement["status"]
        session.add(mission)
        session.commit()
        return {
            "drone_id": mission.drone_id,
            "battery_pct": movement["battery_pct"],
            "altitude_m": movement["altitude_m"],
            "speed_kmh": movement["speed_kmh"],
            "current_lat": movement["current_lat"],
            "current_lon": movement["current_lon"],
            "distance_to_destination_km": movement["distance_to_destination_km"],
            "status": movement["status"],
            "wind_speed_ms": mission.wind_speed_ms,
            "payload_intact": True,
            "estimated_arrival_min": movement["estimated_arrival_min"],
        }


@app.get("/api/cases")
def get_cases(
    priority: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    village: Optional[str] = Query(default=None),
) -> list[dict[str, Any]]:
    query = select(Case)
    if priority:
        query = query.where(Case.priority == priority)
    if status:
        query = query.where(Case.status == status)
    if village:
        query = query.where(Case.village_name.contains(village))
    query = query.order_by(desc(Case.created_at)).limit(50)
    with Session(engine) as session:
        cases = session.exec(query).all()
    return [case_to_public(case) for case in cases]


@app.get("/api/drone/missions")
def get_missions(active_only: bool = True) -> list[dict[str, Any]]:
    query = select(Mission).order_by(desc(Mission.created_at)).limit(20)
    if active_only:
        query = query.where(Mission.status != "standby")
    with Session(engine) as session:
        missions = session.exec(query).all()
    return [mission_to_public(mission) for mission in missions]


@app.get("/api/drone/fleet")
def get_fleet() -> list[dict[str, Any]]:
    with Session(engine) as session:
        missions = session.exec(select(Mission).order_by(desc(Mission.created_at)).limit(10)).all()
    active_by_drone = {mission.drone_id: mission for mission in missions if mission.status in {"en_route", "approaching", "landing", "returning"}}
    fleet = []
    for idx in range(1, 5):
        drone_id = f"VTOL-{idx:02d}"
        mission = active_by_drone.get(drone_id)
        if mission:
            telemetry = interpolate_route(
                _json_loads(mission.waypoints_json, []),
                mission.start_time,
                mission.estimated_flight_time_min,
                mission.destination_lat,
                mission.destination_lon,
            )
            fleet.append(
                {
                    "drone_id": drone_id,
                    "status": telemetry["status"].upper(),
                    "battery_pct": telemetry["battery_pct"],
                    "mission": mission_to_public(mission),
                    "current_lat": telemetry["current_lat"],
                    "current_lon": telemetry["current_lon"],
                    "eta_min": telemetry["estimated_arrival_min"],
                }
            )
        else:
            fleet.append(
                {
                    "drone_id": drone_id,
                    "status": "STANDBY" if idx != 4 else "MAINTENANCE",
                    "battery_pct": 92 - idx * 6,
                    "mission": None,
                    "current_lat": 18.3273 - idx * 0.07,
                    "current_lon": 82.8763 - idx * 0.05,
                    "eta_min": None,
                }
            )
    return fleet


@app.get("/api/mesh/nodes")
def get_mesh_nodes() -> list[dict[str, Any]]:
    return generate_mesh_status()

class MeshInjectRequest(BaseModel):
    origin_node_id: str
    payload_type: str = "triage_alert"

@app.post("/api/mesh/inject")
def inject_mesh_packet(request: MeshInjectRequest) -> dict[str, Any]:
    return simulate_packet_routing(request.origin_node_id, request.payload_type)


@app.post("/api/sync")
def sync_edge_to_cloud() -> dict[str, Any]:
    return {
        "synced_count": random.randint(1, 9),
        "conflicts_resolved": random.randint(0, 2),
        "dashboard_updated": True,
        "sync_latency_ms": random.randint(180, 920),
    }


def live_snapshot() -> dict[str, Any]:
    with Session(engine) as session:
        missions = session.exec(select(Mission).order_by(desc(Mission.created_at)).limit(10)).all()
        p1_cases = session.exec(
            select(Case).where(Case.priority == "P1", Case.status.in_(["pending", "reviewed"])).order_by(desc(Case.created_at)).limit(8)
        ).all()
        recent_cases = session.exec(select(Case).order_by(desc(Case.created_at)).limit(50)).all()

    active_missions = []
    for mission in missions:
        telemetry = interpolate_route(
            _json_loads(mission.waypoints_json, []),
            mission.start_time,
            mission.estimated_flight_time_min,
            mission.destination_lat,
            mission.destination_lon,
        )
        active_missions.append({**mission_to_public(mission), "telemetry": telemetry})

    mesh_status_summary = {
        "online": len([node for node in generate_mesh_status() if node["status"] == "online"]),
        "degraded": len([node for node in generate_mesh_status() if node["status"] == "degraded"]),
        "offline": len([node for node in generate_mesh_status() if node["status"] == "offline"]),
    }
    now = datetime.now(timezone.utc)
    cases_last_hour = len([case for case in recent_cases if (now - _aware_utc(case.created_at)).total_seconds() <= 3600])
    return {
        "active_missions": active_missions,
        "p1_alerts": [case_to_public(case) for case in p1_cases],
        "mesh_status_summary": mesh_status_summary,
        "drones_airborne": len(active_missions),
        "cases_last_hour": cases_last_hour,
        "timestamp": now.isoformat(),
    }


@app.websocket("/ws/live")
async def websocket_live(websocket: WebSocket) -> None:
    await websocket.accept()
    try:
        while True:
            await websocket.send_json(live_snapshot())
            await asyncio.sleep(3)
    except WebSocketDisconnect:
        return


@app.get("/api/villages")
def get_villages() -> list[dict[str, Any]]:
    return [
        {"village_name": name, "lat": coords[0], "lon": coords[1]}
        for name, coords in VILLAGE_COORDS.items()
    ]
