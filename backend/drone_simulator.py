from __future__ import annotations

import math
import random
from datetime import datetime, timezone
from typing import Any


BASE_COORDINATES = {
    "Araku Valley HQ": (18.3273, 82.8763),
    "Paderu Block": (18.0677, 82.6547),
    "Lambasingi": (17.9156, 82.6234),
}


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius_km = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return radius_km * c


def choose_origin(destination_lat: float, destination_lon: float) -> tuple[str, float, float]:
    name, (lat, lon) = min(
        BASE_COORDINATES.items(),
        key=lambda item: haversine_km(item[1][0], item[1][1], destination_lat, destination_lon),
    )
    return name, lat, lon


def build_waypoints(origin_lat: float, origin_lon: float, dest_lat: float, dest_lon: float) -> list[dict[str, float]]:
    mid_lat = (origin_lat + dest_lat) / 2 + 0.025
    mid_lon = (origin_lon + dest_lon) / 2 - 0.018
    return [
        {"lat": origin_lat, "lon": origin_lon, "altitude_m": 0},
        {"lat": origin_lat + (mid_lat - origin_lat) * 0.35, "lon": origin_lon + (mid_lon - origin_lon) * 0.35, "altitude_m": 95},
        {"lat": mid_lat, "lon": mid_lon, "altitude_m": 110},
        {"lat": dest_lat + (mid_lat - dest_lat) * 0.25, "lon": dest_lon + (mid_lon - dest_lon) * 0.25, "altitude_m": 85},
        {"lat": dest_lat, "lon": dest_lon, "altitude_m": 0},
    ]


def random_wind_speed_ms() -> float:
    return round(random.uniform(2.0, 8.0), 1)


def mission_estimates(origin_lat: float, origin_lon: float, dest_lat: float, dest_lon: float) -> dict[str, Any]:
    one_way_km = haversine_km(origin_lat, origin_lon, dest_lat, dest_lon)
    cruise_speed_kmh = 45.0
    estimated_flight_time_min = max(4, int(math.ceil((one_way_km / cruise_speed_kmh) * 60)))
    battery_required_pct = min(92, max(18, int(math.ceil(one_way_km * 5.6 + 18))))
    return {
        "distance_km": round(one_way_km, 2),
        "estimated_flight_time_min": estimated_flight_time_min,
        "battery_required_pct": battery_required_pct,
    }


def interpolate_route(
    waypoints: list[dict[str, float]],
    start_time: datetime,
    estimated_flight_time_min: int,
    destination_lat: float,
    destination_lon: float,
) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=timezone.utc)
    elapsed_seconds = max(0.0, (now - start_time).total_seconds())
    total_seconds = max(1, estimated_flight_time_min * 60)
    progress = min(1.0, elapsed_seconds / total_seconds)

    segments = len(waypoints) - 1
    segment_position = min(segments - 1, int(progress * segments))
    local_start = waypoints[segment_position]
    local_end = waypoints[segment_position + 1]
    segment_progress = (progress * segments) - segment_position

    lat = local_start["lat"] + (local_end["lat"] - local_start["lat"]) * segment_progress
    lon = local_start["lon"] + (local_end["lon"] - local_start["lon"]) * segment_progress
    altitude = local_start["altitude_m"] + (local_end["altitude_m"] - local_start["altitude_m"]) * segment_progress

    distance_to_destination_km = haversine_km(lat, lon, destination_lat, destination_lon)
    if progress >= 0.98:
        status = "landing"
    elif progress >= 0.82:
        status = "approaching"
    elif progress >= 1.0:
        status = "returning"
    else:
        status = "en_route"

    battery_pct = max(18, int(100 - progress * 52))
    eta = max(0, int(math.ceil((1.0 - progress) * estimated_flight_time_min)))
    return {
        "battery_pct": battery_pct,
        "altitude_m": round(altitude, 1),
        "speed_kmh": 0 if status == "landing" else 45,
        "current_lat": round(lat, 6),
        "current_lon": round(lon, 6),
        "distance_to_destination_km": round(distance_to_destination_km, 2),
        "status": status,
        "estimated_arrival_min": eta,
    }
