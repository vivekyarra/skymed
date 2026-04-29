from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Case(SQLModel, table=True):
    case_id: str = Field(primary_key=True, index=True)
    patient_name: str
    age: int
    sex: str
    asha_id: str = Field(index=True)
    asha_name: str
    village_name: str = Field(index=True)
    gps_lat: float
    gps_lon: float
    heart_rate: int
    spo2: int
    temperature_f: float
    systolic_bp: int
    diastolic_bp: int
    chief_complaint: str
    visual_severity_score: int
    visual_features_json: str
    triage_score: int
    priority: str = Field(index=True)
    recommended_action: str
    suggested_payload_json: str
    vitals_flagged_json: str
    status: str = Field(default="pending", index=True)
    doctor_reviewed: bool = False
    mission_id: Optional[str] = Field(default=None, index=True)
    created_at: datetime = Field(default_factory=utc_now, index=True)
    updated_at: datetime = Field(default_factory=utc_now)


class Mission(SQLModel, table=True):
    mission_id: str = Field(primary_key=True, index=True)
    case_id: str = Field(index=True)
    drone_id: str = Field(index=True)
    origin_name: str
    origin_lat: float
    origin_lon: float
    destination_lat: float
    destination_lon: float
    payload_manifest_json: str
    payload_weight_kg: float
    wind_speed_ms: float
    go_nogo: bool
    rejection_reason: Optional[str] = None
    estimated_flight_time_min: int
    battery_required_pct: int
    waypoints_json: str
    status: str = Field(default="en_route", index=True)
    start_time: datetime = Field(default_factory=utc_now, index=True)
    created_at: datetime = Field(default_factory=utc_now)
