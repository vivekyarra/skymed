# SkyMed Use Case Document

## Page 1 — Executive Summary

Remote tribal communities in Andhra Pradesh face emergency-care delays from difficult terrain, monsoon road failures, sparse doctors, and unreliable mobile data coverage. SkyMed is a software command layer for an ASHA-anchored VTOL medical drone network: it scores triage priority offline on a rugged tablet, relays structured telemetry over village mesh nodes, and lets AMTZ doctors confirm medicine dispatch to the ASHA landing pad. The key innovation is ASHA-integrated offline-first edge triage, not a new hardware booth, not diagnostics, and not outbound biological sample logistics.

SkyMed does three things in exactly the right order. First, the ASHA worker captures vitals, symptom photo, village landing-pad GPS, and chief complaint in Telugu. Second, the tablet calculates P1/P2/P3 triage priority locally and sends only the minimum structured packet through LoRa store-and-forward mesh. Third, an AMTZ doctor reviews the packet, calls the ASHA worker, and confirms any drone dispatch.

## Page 2 — Technical Architecture

SkyMed uses a three-layer design.

| Layer | Role | Why it exists |
| --- | --- | --- |
| Drone Edge | Rugged Android tablet runs an INT8 triage priority model offline and captures Bluetooth vitals. | The first decision must work without internet. |
| Village Mesh | LoRa relay node stores and forwards encrypted packets. | Valleys and monsoon conditions make cloud-only designs brittle. |
| District Cloud | AMTZ doctor dashboard, drone dispatch coordination, and state health analytics. | Clinical decisions and public-health review stay with accountable humans. |

Offline-first rationale: the pilot assumption is that reliable 4G availability in Alluri Sitarama Raju Schedule V hamlets is below 23% [5] based on DoT's Digital Bharat Nidhi infrastructure gap reports; the field pilot must validate this with site surveys before deployment. This is why the edge tablet runs triage priority scoring locally and the mesh network carries compact packets when connectivity is intermittent.

Triage-not-diagnosis framing: SkyMed assigns urgency priority only. The NMC telemedicine-guideline-compatible workflow keeps doctor review and all clinical decisions with registered medical practitioners.

Hardware and operational constraints are intentionally narrow.

| Constraint | Phase 1 value |
| --- | --- |
| Payload limit | 1.5kg per mission |
| Allowed payloads | Heat-stable inbound therapeutics and test kits only |
| Excluded payloads | No infectious biological samples outbound |
| Antivenom | Not Phase 1; requires cold-chain pod in Phase 2 |
| Operations | VLOS only, within 450m of ASHA worker or trained operator |
| Wind ceiling | Dispatch rejected above 8 m/s |
| Dispatch authority | Doctor confirmation required; no automatic dispatch |

Why ASHA workers: India already has an ASHA-centered village health system, with NHM guidance describing ASHA as the community interface and a norm around one ASHA per 1,000 population, with flexibility in hilly and tribal areas. A fixed health booth can cost ₹15-20 lakh per location; an ASHA Worker Tech Kit is budgeted at about ₹35,000 and requires no new building infrastructure.

## Page 3 — Patient Journey & Demo

1. Patient reaches ASHA worker or ASHA does home visit.
2. ASHA opens SkyMed app: Telugu UI, voice-guided, single large buttons.
3. Bluetooth vitals auto-capture: SpO2, HR, temperature, BP.
4. ASHA takes photo of wound or symptom with tablet camera.
5. App runs triage model locally on device, offline, no internet needed.
6. Triage score calculated: P1, P2, or P3.
7. If P1: alert auto-sent to nearest SkyMed mesh node via LoRa.
8. Mesh node relays to district hub when connection available, using store-and-forward.
9. Doctor at AMTZ receives structured telemetry packet, reviews, calls ASHA.
10. If P1 and doctor confirms: drone dispatched from nearest base to ASHA landing pad.
11. Drone delivers heat-stable payload: EpiPens, ORS, rapid test kits, wound dressings, glucagon kit, or glucose strips.
12. ASHA carries payload last mile to patient.
13. Case closed and synced to state health dashboard.

Technical stack:

| Area | Stack |
| --- | --- |
| Backend | FastAPI, SQLModel, SQLite, WebSocket live feed |
| Triage | Weighted vitals rules engine + INT8-quantized MobileNetV3-Small ONNX model for visual severity estimation (ImageNet pretrained; wound-specific fine-tuning in Phase 2) |
| Frontend | React, TypeScript, Vite, Tailwind, Leaflet, Recharts |
| Drone simulation | Waypoint interpolation, wind go/no-go, battery estimate |
| Offline mode | Local Edge Mode toggle, local queue badge, animated district flush |
| Security posture | AES-256 encryption target, DPDP Act 2023 aligned minimization, no PII in mesh broadcast |

## Page 4 — Impact & Strategic Alignment

Impact model:

| Input | Value |
| --- | --- |
| Input | Value |
| --- | --- |
| Tribal habitations | 847 within Paderu ITDA jurisdiction [1] |
| High-risk health events | ~12 per hamlet per month [2] |
| P1 intervention gap | 28.3% [3] |
| Potential critical interventions | 847 x 12 x 28.3% = about 2,874 per month |

Cost-per-intervention comparison:

| Pathway | Approximate cost | Outcome risk |
| --- | ---: | --- |
| SkyMed software-coordinated payload dispatch | ₹180 marginal mission cost [4] | Doctor-reviewed medicine reaches ASHA landing pad |
| Current delayed pathway | ₹0 paid by system at point of delay | Patient may miss golden hour |
| Private ambulance | ₹4,500+ | Often unavailable or delayed by road access |

APSCHE thematic areas claimed honestly:

| Theme | SkyMed alignment |
| --- | --- |
| AI & Electronics | Edge AI triage priority scoring on tablet |
| Space Tech & Drones | VTOL dispatch and coordination software |
| Medicine & Biotechnology | ASHA-integrated care relay and doctor review workflow |

Viksit Andhra alignment: tribal health equity, emergency response modernization, and district-level health analytics without excluding villages with poor connectivity. Atmanirbhar alignment: indigenous software stack, open deployment path, and leverage of the existing ASHA network. DGCA roadmap: Phase 1 VLOS software simulation and pilot evidence, then Phase 2 exemption application after safety data.

## Page 5 — Roadmap & Conclusion

| Phase | Timeline | Scope |
| --- | --- | --- |
| Phase 1 | 0-3 months | Software simulation, district workflow review, AMTZ MoU discussion |
| Phase 2 | 3-9 months | VLOS pilot in Paderu block, 3 villages, 3 drones |
| Phase 3 | 9-18 months | DGCA BVLOS exemption application, 13-district expansion plan |
| Phase 4 | 18-36 months | National replication and NHA partnership discussion |

SkyMed does not build fixed health booths. It does not transport infectious samples. It does not diagnose. It does one thing precisely: it ensures the right medicine reaches the right patient within the golden hour, through the hands of the ASHA worker who was already there.

Contact and links:

- Project: SkyMed Command Center
- Submission: APSCHE National Technology Day 2026, Amaravati Vigyan Puraskar
- Theme: Responsible Innovation for Inclusive Growth
- Repository: local competition build

## Data Sources & References

1. **847 tribal habitations**: Habitations within Paderu ITDA jurisdiction per AP Tribal Welfare Department district census records (2011); figure pending verification against current ITDA habitation register.
2. **~12 high-risk events/month**: Estimated monthly health events (fever with chills, severe diarrhea, high-risk pregnancy follow-ups, trauma) per 300-population hamlet, based on ASHA activity baselines and rural AP emergency transport utilization rates (HMIS 2022-23).
3. **28.3% P1 intervention gap**: Based on the percentage of mothers who did NOT use an ambulance for delivery transport in rural Andhra Pradesh (Indicator 55, NFHS-5 State Factsheet).
4. **₹180 marginal mission cost**: Breakdown: Drone battery cycle cost (₹50) + sterilized mission consumables/packaging (₹30) + localized operator time (₹100). Payload contents (EpiPens, kits) are pre-stocked at the hub by the health system and not included in marginal mission flight cost.
5. **23% 4G coverage**: Estimate of fully connected Schedule V hamlets prior to ongoing Universal Service Obligation Fund (USOF) / Digital Bharat Nidhi 4G saturation tower rollouts in ASR district.

Reference anchors for final submission packet:

- NHM ASHA support mechanism: https://www.nhm.gov.in/index1.php?lang=1&level=2&lid=249&sublinkid=176
- NMC telemedicine public notice archive: https://www.nmc.org.in/old-archive-news
- Ministry of Civil Aviation Drone Rules, 2021: https://www.civilaviation.gov.in/ministry-documents/rules/drones-rules-2021-dated-25-august-2021
- India Code DPDP Act, 2023: https://www.indiacode.nic.in/handle/123456789/22037?view_type=browse
