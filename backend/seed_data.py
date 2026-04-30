from __future__ import annotations

import json
import uuid
from datetime import datetime, timedelta, timezone

from sqlmodel import Session, func, select

from drone_simulator import build_waypoints, choose_origin, mission_estimates, random_wind_speed_ms
from models import Case, Mission
from triage_engine import score_triage


MESH_NODES = [
    {
        "node_id": "SM-NODE-01",
        "village_name": "Araku Valley HQ",
        "district": "Alluri Sitarama Raju",
        "lat": 18.3273,
        "lon": 82.8763,
        "status": "online",
        "battery_pct": 94,
        "last_sync_ago_min": 2,
        "drones_available": 2,
        "cases_today": 11,
        "connectivity": "4g",
    },
    {
        "node_id": "SM-NODE-02",
        "village_name": "Paderu Block",
        "district": "Alluri Sitarama Raju",
        "lat": 18.0677,
        "lon": 82.6547,
        "status": "online",
        "battery_pct": 88,
        "last_sync_ago_min": 4,
        "drones_available": 1,
        "cases_today": 9,
        "connectivity": "mesh",
    },
    {
        "node_id": "SM-NODE-03",
        "village_name": "Lambasingi",
        "district": "Alluri Sitarama Raju",
        "lat": 17.9156,
        "lon": 82.6234,
        "status": "degraded",
        "battery_pct": 71,
        "last_sync_ago_min": 18,
        "drones_available": 1,
        "cases_today": 6,
        "connectivity": "lora",
    },
    {
        "node_id": "SM-NODE-04",
        "village_name": "Chintapalle",
        "district": "Alluri Sitarama Raju",
        "lat": 17.8234,
        "lon": 81.9876,
        "status": "online",
        "battery_pct": 83,
        "last_sync_ago_min": 7,
        "drones_available": 1,
        "cases_today": 7,
        "connectivity": "mesh",
    },
    {
        "node_id": "SM-NODE-05",
        "village_name": "GK Veedhi",
        "district": "Alluri Sitarama Raju",
        "lat": 17.5432,
        "lon": 81.7654,
        "status": "degraded",
        "battery_pct": 64,
        "last_sync_ago_min": 35,
        "drones_available": 0,
        "cases_today": 4,
        "connectivity": "lora",
    },
    {
        "node_id": "SM-NODE-06",
        "village_name": "Maredumilli",
        "district": "Alluri Sitarama Raju",
        "lat": 17.5876,
        "lon": 81.8432,
        "status": "online",
        "battery_pct": 79,
        "last_sync_ago_min": 11,
        "drones_available": 1,
        "cases_today": 5,
        "connectivity": "mesh",
    },
    {
        "node_id": "SM-NODE-07",
        "village_name": "Bhadrachalam",
        "district": "Alluri Sitarama Raju / Telangana Border",
        "lat": 17.6699,
        "lon": 80.8912,
        "status": "online",
        "battery_pct": 91,
        "last_sync_ago_min": 5,
        "drones_available": 1,
        "cases_today": 8,
        "connectivity": "4g",
    },
    {
        "node_id": "SM-NODE-08",
        "village_name": "Rampachodavaram",
        "district": "Alluri Sitarama Raju",
        "lat": 17.4321,
        "lon": 81.7890,
        "status": "offline",
        "battery_pct": 41,
        "last_sync_ago_min": 128,
        "drones_available": 0,
        "cases_today": 3,
        "connectivity": "offline",
    },
]


VILLAGE_COORDS = {
    "Araku": (18.3273, 82.8763),
    "Paderu": (18.0677, 82.6547),
    "Hukumpeta": (18.1875, 82.7055),
    "Munchingput": (18.2386, 82.6978),
    "Dumbriguda": (18.2264, 82.9915),
    "Ananthagiri": (18.2446, 83.0051),
    "Koyyuru": (17.6651, 82.2027),
    "Chintoor": (17.7484, 81.3995),
    "Kunavaram": (17.5914, 81.2582),
    "Lambasingi": (17.9156, 82.6234),
    "Chintapalle": (17.8234, 81.9876),
    "GK Veedhi": (17.5432, 81.7654),
    "Maredumilli": (17.5876, 81.8432),
    "Rampachodavaram": (17.4321, 81.7890),
    "Addateegala": (17.4821, 81.9785),
    "Y. Ramavaram": (17.6134, 81.9245),
    "Devipatnam": (17.3312, 81.6647),
    "Gangavaram": (17.6228, 81.9062),
    "Rajavommangi": (17.5847, 82.1413),
    "Seethampeta": (18.6155, 83.9406),
}


ASHA_NAMES = [
    "Lakshmi Devi",
    "Kamala Bai",
    "Manjula",
    "Parvati",
    "Saraswati",
    "Anasuya",
    "Manga Devi",
    "Bhavani",
]


PATIENT_NAMES = [
    "Lakshmi Devi",
    "Ramu Naidu",
    "Srinivas Rao",
    "Kamala Bai",
    "Venkata Reddy",
    "Manjula",
    "Suresh Kumar",
    "Parvati",
    "Appala Raju",
    "Bujjiamma",
    "Satyavathi",
    "Somulu",
    "Koteswara Rao",
    "Padma",
    "Nagamani",
]


CASE_FIXTURES = [
    ("snakebite", 38, "Female", 126, 88, 99.4, 92, 62, 19, "pending"),
    ("high_fever", 12, "Male", 122, 93, 103.5, 100, 66, 12, "reviewed"),
    ("trauma_injury", 44, "Male", 98, 97, 99.2, 118, 76, 18, "closed"),
    ("pregnancy_complication", 24, "Female", 136, 91, 100.0, 88, 58, 13, "pending"),
    ("respiratory_distress", 67, "Female", 142, 83, 101.1, 86, 60, 16, "dispatched"),
    ("severe_diarrhea", 31, "Male", 116, 95, 100.7, 94, 64, 9, "reviewed"),
    ("suspected_cardiac", 58, "Male", 144, 89, 99.1, 84, 57, 15, "dispatched"),
    ("unknown", 46, "Other", 82, 98, 98.8, 121, 78, 7, "closed"),
    ("high_fever", 9, "Female", 118, 94, 104.4, 96, 62, 14, "pending"),
    ("trauma_injury", 22, "Male", 132, 96, 99.0, 112, 74, 21, "pending"),
    ("snakebite", 50, "Male", 138, 86, 99.8, 82, 55, 22, "dispatched"),
    ("pregnancy_complication", 19, "Female", 118, 95, 100.3, 104, 70, 8, "reviewed"),
    ("respiratory_distress", 73, "Female", 108, 91, 100.8, 99, 68, 11, "pending"),
    ("severe_diarrhea", 6, "Male", 128, 96, 101.3, 90, 56, 10, "reviewed"),
    ("suspected_cardiac", 61, "Male", 48, 92, 98.4, 106, 70, 15, "pending"),
    ("unknown", 36, "Female", 88, 97, 98.7, 118, 76, 5, "closed"),
    ("high_fever", 28, "Female", 112, 96, 102.2, 116, 74, 8, "closed"),
    ("trauma_injury", 39, "Male", 104, 94, 99.5, 98, 64, 13, "reviewed"),
    ("snakebite", 16, "Female", 150, 82, 100.1, 74, 52, 24, "pending"),
    ("pregnancy_complication", 32, "Female", 124, 90, 101.0, 86, 60, 17, "dispatched"),
    ("respiratory_distress", 5, "Male", 130, 87, 100.6, 92, 58, 14, "pending"),
    ("severe_diarrhea", 70, "Female", 118, 94, 101.4, 88, 54, 11, "reviewed"),
    ("suspected_cardiac", 47, "Male", 122, 95, 98.9, 112, 70, 9, "closed"),
    ("unknown", 55, "Female", 92, 97, 98.4, 122, 82, 4, "closed"),
    ("high_fever", 14, "Male", 140, 90, 104.8, 90, 58, 18, "pending"),
    ("trauma_injury", 27, "Female", 88, 98, 98.6, 118, 72, 6, "closed"),
    ("snakebite", 42, "Male", 134, 89, 99.6, 82, 56, 18, "reviewed"),
    ("pregnancy_complication", 21, "Female", 142, 92, 100.2, 92, 62, 12, "pending"),
    ("respiratory_distress", 63, "Male", 39, 84, 99.9, 78, 52, 16, "pending"),
    ("severe_diarrhea", 34, "Female", 104, 98, 99.2, 110, 72, 5, "closed"),
]


def seed_database(engine) -> None:
    with Session(engine) as session:
        case_count = session.exec(select(func.count(Case.case_id))).one()
        if case_count:
            return

        now = datetime.now(timezone.utc)
        village_names = list(VILLAGE_COORDS.keys())

        for idx, fixture in enumerate(CASE_FIXTURES):
            chief, age, sex, hr, spo2, temp, sbp, dbp, visual_score, desired_status = fixture
            village_name = village_names[idx % len(village_names)]
            lat, lon = VILLAGE_COORDS[village_name]
            vitals = {
                "heart_rate": hr,
                "spo2": spo2,
                "temperature_f": temp,
                "systolic_bp": sbp,
                "diastolic_bp": dbp,
                "age": age,
                "sex": sex,
                "chief_complaint": chief,
                "gps_lat": lat,
                "gps_lon": lon,
                "village_name": village_name,
                "asha_id": f"ASHA-{1000 + (idx % 9) + 1}",
            }
            scored = score_triage(vitals, visual_score)
            created = now - timedelta(minutes=idx * 27 + 8)
            case_id = str(uuid.uuid4())
            status = desired_status
            if scored["priority"] == "P3" and status == "dispatched":
                status = "closed"

            case = Case(
                case_id=case_id,
                patient_name=PATIENT_NAMES[idx % len(PATIENT_NAMES)],
                age=age,
                sex=sex,
                asha_id=vitals["asha_id"],
                asha_name=ASHA_NAMES[idx % len(ASHA_NAMES)],
                village_name=village_name,
                gps_lat=lat + (idx % 3) * 0.004,
                gps_lon=lon - (idx % 4) * 0.004,
                heart_rate=hr,
                spo2=spo2,
                temperature_f=temp,
                systolic_bp=sbp,
                diastolic_bp=dbp,
                chief_complaint=chief,
                visual_severity_score=visual_score,
                visual_features_json=json.dumps(
                    {
                        "mean_brightness": 128 - visual_score,
                        "contrast_std_dev": 25 + visual_score,
                        "red_channel_dominance": 10 + visual_score * 1.8,
                        "image_entropy": round(4.2 + visual_score / 10, 2),
                        "onnx_inference": "seeded_proxy",
                        "model_mode": "visual_risk_proxy",
                        "calibration_status": "not clinically validated",
                    }
                ),
                triage_score=scored["triage_score"],
                priority=scored["priority"],
                recommended_action=scored["recommended_action"],
                suggested_payload_json=json.dumps(scored["suggested_payload"]),
                vitals_flagged_json=json.dumps(scored["vitals_flagged"]),
                status=status,
                doctor_reviewed=status in {"reviewed", "dispatched", "closed"},
                created_at=created,
                updated_at=created + timedelta(minutes=7),
            )
            session.add(case)

            if status == "dispatched" and scored["priority"] == "P1":
                origin_name, origin_lat, origin_lon = choose_origin(case.gps_lat, case.gps_lon)
                waypoints = build_waypoints(origin_lat, origin_lon, case.gps_lat, case.gps_lon)
                estimates = mission_estimates(origin_lat, origin_lon, case.gps_lat, case.gps_lon)
                mission_id = str(uuid.uuid4())
                mission = Mission(
                    mission_id=mission_id,
                    case_id=case_id,
                    drone_id=f"VTOL-{(idx % 4) + 1:02d}",
                    origin_name=origin_name,
                    origin_lat=origin_lat,
                    origin_lon=origin_lon,
                    destination_lat=case.gps_lat,
                    destination_lon=case.gps_lon,
                    payload_manifest_json=case.suggested_payload_json,
                    payload_weight_kg=0.6,
                    wind_speed_ms=random_wind_speed_ms(),
                    go_nogo=True,
                    estimated_flight_time_min=estimates["estimated_flight_time_min"],
                    battery_required_pct=estimates["battery_required_pct"],
                    waypoints_json=json.dumps(waypoints),
                    status="en_route",
                    start_time=now - timedelta(minutes=(idx % 5) + 2),
                    created_at=created + timedelta(minutes=9),
                )
                case.mission_id = mission_id
                session.add(mission)

        session.commit()
