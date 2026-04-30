from __future__ import annotations

from typing import Any


CHIEF_COMPLAINTS = {
    "snakebite",
    "trauma_injury",
    "high_fever",
    "pregnancy_complication",
    "respiratory_distress",
    "suspected_cardiac",
    "severe_diarrhea",
    "unknown",
}

PAYLOAD_WEIGHTS_KG = {
    "epipen_2pack": 0.18,
    "ors_sachets": 0.25,
    "wound_dressing_kit": 0.35,
    "malaria_dengue_test_kit": 0.12,
    "glucagon_kit": 0.22,
    "glucose_strips_kit": 0.08,
}

PAYLOAD_LABELS = {
    "epipen_2pack": "EpiPen 2-pack",
    "ors_sachets": "ORS sachets x10",
    "wound_dressing_kit": "Wound dressing kit",
    "malaria_dengue_test_kit": "Rapid malaria/dengue test kit",
    "glucagon_kit": "Glucagon emergency kit",
    "glucose_strips_kit": "Blood glucose strips kit",
}


def _flag(vital: str, value: Any, severity: str, points: int, reason: str) -> dict[str, Any]:
    return {
        "vital": vital,
        "value": value,
        "severity": severity,
        "points": points,
        "reason": reason,
    }


def suggested_payload_for(chief_complaint: str, priority: str) -> list[str]:
    if priority == "P3":
        return []

    mapping = {
        "snakebite": ["wound_dressing_kit", "ors_sachets"],
        "trauma_injury": ["wound_dressing_kit", "glucose_strips_kit"],
        "high_fever": ["malaria_dengue_test_kit", "ors_sachets"],
        "pregnancy_complication": ["glucose_strips_kit", "ors_sachets"],
        "respiratory_distress": ["epipen_2pack", "glucose_strips_kit"],
        "suspected_cardiac": ["glucose_strips_kit", "ors_sachets"],
        "severe_diarrhea": ["ors_sachets", "glucose_strips_kit"],
        "unknown": ["ors_sachets", "wound_dressing_kit"],
    }
    return mapping.get(chief_complaint, ["ors_sachets"])


def calculate_payload_weight(payload_manifest: list[str]) -> float:
    return round(sum(PAYLOAD_WEIGHTS_KG[item] for item in payload_manifest), 3)


def score_triage(vitals: dict[str, Any], visual_severity_score: int) -> dict[str, Any]:
    score = 0
    flags: list[dict[str, Any]] = []

    spo2 = int(vitals["spo2"])
    heart_rate = int(vitals["heart_rate"])
    temperature_f = float(vitals["temperature_f"])
    systolic_bp = int(vitals["systolic_bp"])
    chief_complaint = str(vitals["chief_complaint"])

    if chief_complaint not in CHIEF_COMPLAINTS:
        raise ValueError(f"Unsupported chief_complaint: {chief_complaint}")

    if spo2 < 85:
        score += 45
        flags.append(_flag("SpO2", spo2, "critical", 45, "SpO2 below 85%"))
    elif 85 <= spo2 < 90:
        score += 30
        flags.append(_flag("SpO2", spo2, "high", 30, "SpO2 between 85-90%"))
    elif 90 <= spo2 < 95:
        score += 15
        flags.append(_flag("SpO2", spo2, "moderate", 15, "SpO2 between 90-95%"))

    if heart_rate > 140 or heart_rate < 40:
        score += 35
        flags.append(_flag("Heart Rate", heart_rate, "critical", 35, "Heart rate outside 40-140 bpm"))
    elif 120 <= heart_rate <= 140 or 40 <= heart_rate <= 50:
        score += 20
        flags.append(_flag("Heart Rate", heart_rate, "high", 20, "Heart rate in warning range"))

    if temperature_f > 104:
        score += 25
        flags.append(_flag("Temperature", temperature_f, "critical", 25, "Temperature above 104F"))
    elif 103 <= temperature_f <= 104:
        score += 15
        flags.append(_flag("Temperature", temperature_f, "high", 15, "Temperature between 103-104F"))

    if systolic_bp < 70:
        score += 40
        flags.append(_flag("Systolic BP", systolic_bp, "critical", 40, "Systolic BP below 70 mmHg"))
    elif 70 <= systolic_bp < 90:
        score += 20
        flags.append(_flag("Systolic BP", systolic_bp, "high", 20, "Systolic BP between 70-90 mmHg"))

    if chief_complaint in {"snakebite", "pregnancy_complication"}:
        score += 20
        flags.append(_flag("Chief Complaint", chief_complaint, "high", 20, "High-risk complaint bonus"))

    visual_points = max(0, min(25, int(visual_severity_score)))
    score += visual_points
    if visual_points >= 18:
        flags.append(_flag("Visual Risk Proxy", visual_points, "high", visual_points, "Visual cue proxy indicates high concern; not diagnostic"))
    elif visual_points >= 10:
        flags.append(_flag("Visual Risk Proxy", visual_points, "moderate", visual_points, "Visual cue proxy indicates moderate concern; not diagnostic"))

    score = min(100, int(score))
    if score >= 70:
        priority = "P1"
        recommended_action = "Immediate AMTZ doctor alert; doctor review required before drone dispatch."
        drone_eta_min = 18
    elif score >= 40:
        priority = "P2"
        recommended_action = "Doctor telemedicine review within 30 minutes; monitor vitals and prepare ASHA follow-up."
        drone_eta_min = None
    else:
        priority = "P3"
        recommended_action = "Schedule ASHA follow-up and sync case to district dashboard."
        drone_eta_min = None

    payload = suggested_payload_for(chief_complaint, priority)
    return {
        "triage_score": score,
        "priority": priority,
        "recommended_action": recommended_action,
        "suggested_payload": payload,
        "drone_eta_min": drone_eta_min,
        "vitals_flagged": flags,
    }
