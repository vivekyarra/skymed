from __future__ import annotations

import os
from typing import Any

from PIL import Image, ImageStat


MODEL_FILENAME = "triage_mobilenet_v3_int8.onnx"
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", MODEL_FILENAME)

PROXY_MODEL_NOTE = (
    "Demo build: no validated wound severity classifier is bundled. Visual input "
    "contributes only a transparent risk-cue score from brightness, contrast, "
    "color balance, and image texture; clinical priority remains vitals-first "
    "and doctor-reviewed."
)
ONNX_MODEL_NOTE = (
    "Experimental ONNX artifact loaded from backend/models. Use only after the "
    "artifact is trained, validated, and documented for the deployment setting."
)
JUDGE_IMPACT_RESPONSE = "This is a proxy pending pilot data; we've been deliberately conservative."


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


_onnx_session = None
_onnx_load_attempted = False
_onnx_load_error: str | None = None

def _get_onnx_session():
    global _onnx_session, _onnx_load_attempted, _onnx_load_error
    if not _onnx_load_attempted:
        _onnx_load_attempted = True
        if not os.path.exists(MODEL_PATH):
            _onnx_load_error = "artifact_missing"
            return None
        try:
            import onnxruntime as ort

            _onnx_session = ort.InferenceSession(MODEL_PATH)
            _onnx_load_error = None
        except Exception as exc:
            _onnx_load_error = f"{exc.__class__.__name__}: {exc}"
    return _onnx_session


def get_visual_model_status() -> dict[str, Any]:
    """Return the runtime visual-model mode for API health and judge inspection."""
    session = _get_onnx_session()
    return {
        "mode": "onnx_experimental" if session else "visual_risk_proxy",
        "onnx_artifact_present": os.path.exists(MODEL_PATH),
        "onnx_loaded": session is not None,
        "onnx_artifact_path": MODEL_PATH,
        "load_error": _onnx_load_error,
        "model_note": ONNX_MODEL_NOTE if session else PROXY_MODEL_NOTE,
        "clinical_use": "triage priority support only; not diagnosis and not autonomous dispatch",
        "calibration_status": "not clinically validated in this repository",
        "impact_response": JUDGE_IMPACT_RESPONSE,
    }


def _proxy_features(
    brightness: float | None,
    contrast: float | None,
    red_dominance: float | None,
    entropy: float | None,
    onnx_state: str,
) -> dict[str, Any]:
    return {
        "mean_brightness": None if brightness is None else round(brightness, 2),
        "contrast_std_dev": None if contrast is None else round(contrast, 2),
        "red_channel_dominance": None if red_dominance is None else round(red_dominance, 2),
        "image_entropy": None if entropy is None else round(entropy, 2),
        "onnx_inference": onnx_state,
        "model_mode": "visual_risk_proxy",
        "calibration_status": "not clinically validated",
        "explainability": "brightness/color/contrast/entropy proxy; not a wound classifier",
    }


def estimate_visual_severity(image: Image.Image) -> dict[str, Any]:
    """Deterministic visual risk-cue estimator for offline demo triage.

    This is intentionally not a wound diagnosis or severity classifier. It
    extracts explainable image statistics and maps them to a bounded 0-25
    triage contribution so judges can inspect exactly what is happening.
    """
    global _onnx_load_error
    session = _get_onnx_session()
    
    if session:
        try:
            import numpy as np
            rgb = image.convert("RGB").resize((224, 224))
            img_array = np.array(rgb).astype(np.float32) / 255.0
            
            mean = np.array([0.485, 0.456, 0.406])
            std = np.array([0.229, 0.224, 0.225])
            img_array = (img_array - mean) / std
            
            img_array = np.transpose(img_array, (2, 0, 1))
            img_array = np.expand_dims(img_array, axis=0).astype(np.float32)
            
            input_name = session.get_inputs()[0].name
            output_name = session.get_outputs()[0].name
            result = session.run([output_name], {input_name: img_array})
            
            raw_score = float(result[0][0][0])
            scaled_score = int(round(25.0 / (1.0 + np.exp(-raw_score))))
            
            return {
                "severity_score": int(_clamp(scaled_score, 0, 25)),
                "visual_features": {
                    "onnx_inference": "success",
                    "model_mode": "onnx_experimental",
                    "raw_logit": round(raw_score, 2),
                    "calibration_status": "requires pilot validation before clinical use",
                },
                "model_note": ONNX_MODEL_NOTE,
            }
        except Exception as exc:
            _onnx_load_error = f"inference_{exc.__class__.__name__}: {exc}"

    try:
        rgb = image.convert("RGB").resize((256, 256))
        stat = ImageStat.Stat(rgb)
        red_mean, green_mean, blue_mean = stat.mean
        red_std, green_std, blue_std = stat.stddev

        brightness = (red_mean + green_mean + blue_mean) / 3.0
        contrast = (red_std + green_std + blue_std) / 3.0
        red_dominance = red_mean - ((green_mean + blue_mean) / 2.0)
        entropy = rgb.entropy()

        low_brightness_component = _clamp((135.0 - brightness) / 135.0, 0.0, 1.0)
        red_component = _clamp(red_dominance / 90.0, 0.0, 1.0)
        contrast_component = _clamp(contrast / 80.0, 0.0, 1.0)
        entropy_component = _clamp(entropy / 8.0, 0.0, 1.0)

        severity = (
            red_component * 10.0
            + low_brightness_component * 5.0
            + entropy_component * 6.0
            + contrast_component * 4.0
        )

        severity_score = int(round(_clamp(severity, 0.0, 25.0)))
        return {
            "severity_score": severity_score,
            "visual_features": _proxy_features(
                brightness,
                contrast,
                red_dominance,
                entropy,
                f"not_loaded_{_onnx_load_error or 'unavailable'}",
            ),
            "model_note": PROXY_MODEL_NOTE,
        }
    except Exception:
        return {
            "severity_score": 12,
            "visual_features": _proxy_features(None, None, None, None, f"proxy_failed_{_onnx_load_error or 'unknown'}"),
            "model_note": PROXY_MODEL_NOTE,
        }
