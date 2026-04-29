import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';
import type {
  CaseRecord,
  FleetDrone,
  LiveSnapshot,
  MeshNode,
  Mission,
  PayloadItem,
  TriageResponse,
  Village,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const wsUrl = API_BASE_URL.replace(/^http/, 'ws') + '/ws/live';

export async function fetchCases(filters?: { priority?: string; status?: string; village?: string }) {
  const { data } = await api.get<CaseRecord[]>('/api/cases', { params: filters });
  return data;
}

export async function fetchMeshNodes() {
  const { data } = await api.get<MeshNode[]>('/api/mesh/nodes');
  return data;
}

export async function fetchMissions() {
  const { data } = await api.get<Mission[]>('/api/drone/missions');
  return data;
}

export async function fetchFleet() {
  const { data } = await api.get<FleetDrone[]>('/api/drone/fleet');
  return data;
}

export async function fetchVillages() {
  const { data } = await api.get<Village[]>('/api/villages');
  return data;
}

export async function submitTriage(formData: FormData, config?: AxiosRequestConfig) {
  const { data } = await api.post<TriageResponse>('/api/triage', formData, config);
  return data;
}

export async function dispatchDrone(payload: {
  case_id: string;
  drone_id: string;
  destination_lat: number;
  destination_lon: number;
  payload_manifest: PayloadItem[];
  doctor_confirmed: boolean;
}) {
  const { data } = await api.post('/api/drone/dispatch', payload);
  return data as {
    mission_id: string | null;
    go_nogo: boolean;
    rejection_reason: string | null;
    estimated_flight_time_min: number | null;
    waypoints: { lat: number; lon: number; altitude_m: number }[];
    battery_required_pct: number | null;
    payload_weight_kg: number;
    wind_speed_ms: number;
  };
}

export async function syncEdgeQueue() {
  const { data } = await api.post('/api/sync');
  return data as {
    synced_count: number;
    conflicts_resolved: number;
    dashboard_updated: boolean;
    sync_latency_ms: number;
  };
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export type { LiveSnapshot };
