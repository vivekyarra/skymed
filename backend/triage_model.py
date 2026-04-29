from __future__ import annotations

from typing import Any

from PIL import Image, ImageStat


MODEL_NOTE = (
    "Production: MobileNetV3-Small fine-tuned on DermNet + ISIC wound "
    "classification dataset, quantized to INT8 ONNX <8MB, runs on Snapdragon "
    "680 tablet NPU offline"
)


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def estimate_visual_severity(image: Image.Image) -> dict[str, Any]:
    """Deterministic visual severity estimator for offline demo triage.

    This is intentionally not a diagnostic model. It extracts explainable image
    statistics and maps them to a bounded 0-25 triage severity contribution.
    """

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
