export type Priority = 'P1' | 'P2' | 'P3';

export type ChiefComplaint =
  | 'snakebite'
  | 'trauma_injury'
  | 'high_fever'
  | 'pregnancy_complication'
  | 'respiratory_distress'
  | 'suspected_cardiac'
  | 'severe_diarrhea'
  | 'unknown';

export type MeshNode = {
  node_id: string;
  village_name: string;
  status: 'online' | 'degraded' | 'offline';
  battery_pct: number;
  last_seen: string;
  queue_depth: number;
  lat: number;
  lng: number;
  link_quality: number;
  hop_distance_to_hub: number;
};

export type CaseRecord = {
  case_id: string;
  patient_name: string;
  age: number;
  sex: string;
  asha_id: string;
  asha_name: string;
  village_name: string;
  gps_lat: number;
  gps_lon: number;
  heart_rate: number;
  spo2: number;
  temperature_f: number;
  systolic_bp: number;
  diastolic_bp: number;
  chief_complaint: ChiefComplaint;
  visual_severity_score: number;
  visual_features: Record<string, number | null>;
  triage_score: number;
  priority: Priority;
  recommended_action: string;
  suggested_payload: PayloadItem[];
  suggested_payload_labels?: string[];
  vitals_flagged: VitalFlag[];
  status: string;
  doctor_reviewed: boolean;
  mission_id?: string | null;
  timestamp: string;
  created_at: string;
  updated_at: string;
};

export type VitalFlag = {
  vital: string;
  value: number | string;
  severity: 'critical' | 'high' | 'moderate';
  points: number;
  reason: string;
};

export type PayloadItem =
  | 'epipen_2pack'
  | 'ors_sachets'
  | 'wound_dressing_kit'
  | 'malaria_dengue_test_kit'
  | 'glucagon_kit'
  | 'glucose_strips_kit';

export type Mission = {
  mission_id: string;
  case_id: string;
  drone_id: string;
  origin_name: string;
  origin_lat: number;
  origin_lon: number;
  destination_lat: number;
  destination_lon: number;
  payload_manifest: PayloadItem[];
  payload_weight_kg: number;
  wind_speed_ms: number;
  go_nogo: boolean;
  rejection_reason?: string | null;
  estimated_flight_time_min: number;
  battery_required_pct: number;
  waypoints: Waypoint[];
  status: string;
  start_time: string;
  created_at: string;
  telemetry?: Telemetry;
};

export type Waypoint = {
  lat: number;
  lon: number;
  altitude_m: number;
};

export type Telemetry = {
  drone_id?: string;
  battery_pct: number;
  altitude_m: number;
  speed_kmh: number;
  current_lat: number;
  current_lon: number;
  distance_to_destination_km: number;
  status: string;
  wind_speed_ms?: number;
  payload_intact?: boolean;
  estimated_arrival_min: number;
};

export type FleetDrone = {
  drone_id: string;
  status: string;
  battery_pct: number;
  mission: Mission | null;
  current_lat: number;
  current_lon: number;
  eta_min: number | null;
};

export type LiveSnapshot = {
  active_missions: Mission[];
  p1_alerts: CaseRecord[];
  mesh_status_summary: {
    online: number;
    degraded: number;
    offline: number;
  };
  drones_airborne: number;
  cases_last_hour: number;
  timestamp: string;
};

export type TriageResponse = {
  case_id: string;
  triage_score: number;
  priority: Priority;
  recommended_action: string;
  suggested_payload: PayloadItem[];
  drone_eta_min: number | null;
  vitals_flagged: VitalFlag[];
  visual_assessment?: {
    severity_score: number;
    visual_features: Record<string, number | null>;
    model_note: string;
  };
  timestamp: string;
  asha_id: string;
  queuedOffline?: boolean;
};

export type Village = {
  village_name: string;
  lat: number;
  lon: number;
};

export type OfflineQueuedCase = {
  id: string;
  createdAt: string;
  villageName: string;
  ashaId: string;
  vitals: Record<string, unknown>;
  result: TriageResponse;
};
