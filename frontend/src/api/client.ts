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

import { MOCK_CASES, MOCK_FLEET, MOCK_MESH_NODES, MOCK_VILLAGES } from './mockData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000, // Reduced timeout for faster fallback
});

export const wsUrl = API_BASE_URL.replace(/^http/, 'ws') + '/ws/live';

export async function fetchCases(filters?: { priority?: string; status?: string; village?: string }) {
  try {
    const { data } = await api.get<CaseRecord[]>('/api/cases', { params: filters });
    return data;
  } catch (error) {
    console.warn('Backend unreachable, using mock cases', error);
    return MOCK_CASES;
  }
}

export async function fetchMeshNodes() {
  try {
    const { data } = await api.get<MeshNode[]>('/api/mesh/nodes');
    return data;
  } catch (error) {
    console.warn('Backend unreachable, using mock mesh nodes', error);
    return MOCK_MESH_NODES;
  }
}

export async function fetchMissions() {
  try {
    const { data } = await api.get<Mission[]>('/api/drone/missions');
    return data;
  } catch (error) {
    console.warn('Backend unreachable, using mock missions', error);
    return [];
  }
}

export async function fetchFleet() {
  try {
    const { data } = await api.get<FleetDrone[]>('/api/drone/fleet');
    return data;
  } catch (error) {
    console.warn('Backend unreachable, using mock fleet', error);
    return MOCK_FLEET;
  }
}

export async function fetchVillages() {
  try {
    const { data } = await api.get<Village[]>('/api/villages');
    return data;
  } catch (error) {
    console.warn('Backend unreachable, using mock villages', error);
    return MOCK_VILLAGES;
  }
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
