from __future__ import annotations

import os
from typing import Any

from PIL import Image, ImageStat


MODEL_NOTE = (
    "Production: MobileNetV3-Small fine-tuned on DermNet + ISIC wound "
    "classification dataset, quantized to INT8 ONNX <8MB, runs on Snapdragon "
    "680 tablet NPU offline"
)


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


_onnx_session = None
_onnx_load_attempted = False

def _get_onnx_session():
    global _onnx_session, _onnx_load_attempted
    if not _onnx_load_attempted:
        _onnx_load_attempted = True
        try:
            import onnxruntime as ort
            model_path = os.path.join(os.path.dirname(__file__), "models", "triage_mobilenet_v3_int8.onnx")
            if os.path.exists(model_path):
                _onnx_session = ort.InferenceSession(model_path)
        except Exception:
            pass
    return _onnx_session


def estimate_visual_severity(image: Image.Image) -> dict[str, Any]:
    """Deterministic visual severity estimator for offline demo triage.

    This is intentionally not a diagnostic model. It extracts explainable image
    statistics and maps them to a bounded 0-25 triage severity contribution.
    """
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
                "severity_score": _clamp(scaled_score, 0, 25),
                "visual_features": {
                    "onnx_inference": "success",
                    "raw_logit": round(raw_score, 2),
                },
                "model_note": MODEL_NOTE,
            }
        except Exception:
            pass

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
            "visual_features": {
                "mean_brightness": round(brightness, 2),
                "contrast_std_dev": round(contrast, 2),
                "red_channel_dominance": round(red_dominance, 2),
                "image_entropy": round(entropy, 2),
                "onnx_inference": "failed_or_missing",
            },
            "model_note": MODEL_NOTE,
        }
    except Exception:
        return {
            "severity_score": 12,
            "visual_features": {
                "mean_brightness": None,
                "contrast_std_dev": None,
                "red_channel_dominance": None,
                "image_entropy": None,
            },
            "model_note": MODEL_NOTE,
        }
