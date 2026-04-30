# Visual Model Artifact Policy

This demo repository intentionally does not bundle a trained wound severity classifier.

Runtime default:

- `backend/triage_model.py` runs in `visual_risk_proxy` mode when `triage_mobilenet_v3_int8.onnx` is absent.
- The proxy is deterministic and inspectable: brightness, contrast, red-channel balance, and image entropy contribute up to 25 triage points.
- The proxy is not diagnostic, not clinically calibrated, and not presented as a wound severity model.

Optional pilot path:

- A trained and validated ONNX artifact may be mounted at `backend/models/triage_mobilenet_v3_int8.onnx`.
- When present and loadable, `/api/model/status` reports `mode: onnx_experimental`.
- Before any clinical pilot, the artifact needs a model card, training dataset provenance, validation metrics, calibration analysis, and doctor-reviewed operating thresholds.

Judge-facing response:

> There is no validated wound classifier bundled in this demo. The submitted build uses an explicit visual-risk proxy for offline triage support, pending pilot data and a properly validated model artifact.
