import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { CircleMarker, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { AlertTriangle, BatteryCharging, CheckCircle2, Clock, Navigation, RadioTower, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchCases, fetchFleet, fetchMeshNodes } from '../api/client';
import type { CaseRecord, FleetDrone, LiveSnapshot, MeshNode, Mission, Priority } from '../types';

const priorityColors: Record<Priority, string> = {
  P1: '#ff1744',
  P2: '#ffb300',
  P3: '#00e676',
};

function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame = 0;
    const steps = 24;
    const tick = () => {
      frame += 1;
      setDisplay(Math.round((value * frame) / steps));
      if (frame < steps) requestAnimationFrame(tick);
    };
    tick();
  }, [value]);

  return <span>{display.toLocaleString('en-IN')}</span>;
}

function droneIcon(mission: Mission) {
  const telemetry = mission.telemetry;
  const status = telemetry?.status ?? mission.status;
  return L.divIcon({
    className: 'skymed-drone-icon',
    html: `<div style="width:32px;height:32px;border-radius:999px;background:rgba(0,212,255,.18);border:1px solid #00d4ff;display:grid;place-items:center;box-shadow:0 0 20px rgba(0,212,255,.45);color:#00d4ff;font-weight:900;font-size:13px;transform:rotate(${status === 'landing' ? 0 : 35}deg)">✚</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function timeAgo(timestamp: string) {
  const diff = Math.max(0, Date.now() - new Date(timestamp).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.floor(minutes / 60)} hr ago`;
}

export default function Dashboard({
  isOffline,
  live,
  wsConnected,
}: {
  isOffline: boolean;
  live: LiveSnapshot;
  wsConnected: boolean;
}) {
  const [nodes, setNodes] = useState<MeshNode[]>([]);
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [fleet, setFleet] = useState<FleetDrone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOffline) return;
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const [nodeData, caseData, fleetData] = await Promise.all([fetchMeshNodes(), fetchCases(), fetchFleet()]);
        if (!cancelled) {
          setNodes(nodeData);
          setCases(caseData);
          setFleet(fleetData);
        }
      } catch {
        if (!cancelled) toast.error('Unable to load command center data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    const timer = window.setInterval(load, 9000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [isOffline]);

  const p1Alerts = live.p1_alerts.length ? live.p1_alerts : cases.filter((item) => item.priority === 'P1' && item.status !== 'closed').slice(0, 6);
  const activeMissions = live.active_missions;
  const p1Active = cases.filter((item) => item.priority === 'P1' && item.status !== 'closed').length;
  const connectedAshas = new Set(cases.map((item) => item.asha_id)).size;

  const villageCases = useMemo(() => {
    const latestByVillage = new Map<string, CaseRecord>();
    cases.forEach((record) => {
      const existing = latestByVillage.get(record.village_name);
      if (!existing || new Date(record.created_at) > new Date(existing.created_at)) {
        latestByVillage.set(record.village_name, record);
      }
    });
    return [...latestByVillage.values()];
  }, [cases]);

  return (
    <div className="space-y-4">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Cases Today', value: cases.length || live.cases_last_hour, icon: Clock, color: 'text-accent-cyan' },
          { label: 'P1 Active', value: p1Active || p1Alerts.length, icon: AlertTriangle, color: 'text-accent-red' },
          { label: 'Drones Airborne', value: live.drones_airborne || fleet.filter((drone) => drone.mission).length, icon: Navigation, color: 'text-accent-green' },
          { label: 'ASHAs Connected', value: connectedAshas || 8, icon: RadioTower, color: 'text-accent-amber' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="panel rounded-md p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">{item.label}</span>
                <Icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <div className="mt-3 text-3xl font-black">
                <CountUp value={item.value} />
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className={`panel overflow-hidden rounded-md ${isOffline ? 'border-accent-amber/40' : ''}`}>
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <h1 className="text-lg font-black">Command Center</h1>
              <p className="text-sm text-text-muted">Tribal Andhra Pradesh mesh, P1 alerts, and active VTOL missions</p>
            </div>
            <span className={`badge ${isOffline ? 'border-accent-amber/50 text-accent-amber' : 'border-accent-green/40 text-accent-green'}`}>
              {isOffline ? 'Local Edge View' : wsConnected ? 'Live' : 'Polling'}
            </span>
          </div>
          <div className="relative h-[62vh] min-h-[520px]">
            {loading && !cases.length && (
              <div className="absolute inset-x-4 top-4 z-[500] rounded-md border border-white/10 bg-surface/90 p-3 text-sm text-text-muted">
                <RefreshCw className="mr-2 inline h-4 w-4 animate-spin text-accent-cyan" />
                Loading command telemetry...
              </div>
            )}
            <MapContainer center={[18.0, 82.5]} zoom={8} minZoom={7} maxZoom={12} className="h-full w-full">
              <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              {nodes.map((node) => (
                <CircleMarker
                  key={node.node_id}
                  center={[node.lat, node.lng]}
                  radius={node.status === 'offline' ? 8 : 11}
                  pathOptions={{
                    color: node.status === 'offline' ? '#ff1744' : node.status === 'degraded' ? '#ffb300' : '#00d4ff',
                    fillColor: node.status === 'offline' ? '#ff1744' : '#00d4ff',
                    fillOpacity: node.status === 'offline' ? 0.35 : 0.58,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div className="space-y-1 text-sm">
                      <strong>{node.village_name}</strong>
                      <div>Hops: {node.hop_distance_to_hub}</div>
                      <div>Status: {node.status}</div>
                      <div>Connectivity: LORA</div>
                      <div>Queue Depth: {node.queue_depth}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
              {villageCases.map((record) => (
                <CircleMarker
                  key={record.case_id}
                  center={[record.gps_lat, record.gps_lon]}
                  radius={record.priority === 'P1' ? 9 : 7}
                  pathOptions={{
                    color: priorityColors[record.priority],
                    fillColor: priorityColors[record.priority],
                    fillOpacity: 0.72,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div className="space-y-1 text-sm">
                      <strong>{record.village_name}</strong>
                      <div>{record.priority} | Score {record.triage_score}</div>
                      <div>{record.chief_complaint.replace(/_/g, ' ')}</div>
                      <div>ASHA: {record.asha_name}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
              {activeMissions.map((mission) => {
                const telemetry = mission.telemetry;
                if (!telemetry) return null;
                return (
                  <Marker
                    key={mission.mission_id}
                    position={[telemetry.current_lat, telemetry.current_lon]}
                    icon={droneIcon(mission)}
                  >
                    <Popup>
                      <div className="space-y-1 text-sm">
                        <strong>{mission.drone_id}</strong>
                        <div>Status: {telemetry.status}</div>
                        <div>ETA: {telemetry.estimated_arrival_min} min</div>
                        <div>Battery: {telemetry.battery_pct}%</div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>

            <div className="absolute bottom-4 left-4 z-[500] rounded-md border border-white/10 bg-surface/90 p-3 text-xs shadow-xl">
              <div className="mb-2 font-bold text-text-primary">Legend</div>
              <div className="flex flex-wrap gap-3">
                {(['P1', 'P2', 'P3'] as Priority[]).map((priority) => (
                  <span key={priority} className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: priorityColors[priority] }} />
                    {priority}
                  </span>
                ))}
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full border border-accent-cyan bg-accent-cyan/40" />
                  Mesh Node
                </span>
              </div>
            </div>
          </div>
        </div>

        <aside className="panel rounded-md">
          <div className="border-b border-white/10 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black">Live P1 Alert Feed</h2>
              <span className="badge border-accent-red/40 text-accent-red">{p1Alerts.length} active</span>
            </div>
          </div>
          <div className="max-h-[62vh] space-y-3 overflow-y-auto p-4">
            {p1Alerts.length === 0 ? (
              <div className="grid min-h-56 place-items-center rounded-md border border-accent-green/30 bg-accent-green/5 text-center">
                <div>
                  <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-accent-green" />
                  <div className="text-xl font-black text-accent-green">ALL CLEAR</div>
                  <div className="mt-1 text-sm text-text-muted">No active P1 cases in the live stream.</div>
                </div>
              </div>
            ) : (
              p1Alerts.map((alert) => (
                <div key={alert.case_id} className="rounded-md border border-accent-red/25 bg-accent-red/10 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-text-primary">{alert.village_name}</div>
                      <div className="text-sm text-text-muted">{alert.asha_name} | {alert.chief_complaint.replace(/_/g, ' ')}</div>
                    </div>
                    <span className="text-xs text-accent-amber">{timeAgo(alert.created_at)}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="badge border-accent-red/40 text-accent-red">Score {alert.triage_score}</span>
                    <button
                      type="button"
                      className="rounded-md bg-accent-cyan px-3 py-2 text-xs font-black text-bg-primary transition hover:brightness-110"
                      onClick={() => toast('Review opens in the Triage Portal navigation tab.')}
                    >
                      REVIEW
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </section>

      <section className="panel rounded-md p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-black">Drone Telemetry</h2>
          <span className="text-xs text-text-muted">Updated every 3 seconds when online</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {fleet.map((drone) => (
            <div key={drone.drone_id} className="rounded-md border border-white/10 bg-bg-primary p-3">
              <div className="flex items-center justify-between">
                <div className="font-black">{drone.drone_id}</div>
                <span className={`badge ${drone.mission ? 'border-accent-cyan/40 text-accent-cyan' : 'border-accent-green/40 text-accent-green'}`}>
                  {drone.status}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm text-text-muted">
                <BatteryCharging className="h-4 w-4 text-accent-green" />
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-accent-green" style={{ width: `${drone.battery_pct}%` }} />
                </div>
                <span>{drone.battery_pct}%</span>
              </div>
              <div className="mt-2 text-xs text-text-muted">
                {drone.mission ? `Payload ${drone.mission.payload_manifest.join(', ')} | ETA ${drone.eta_min} min` : 'Payload bay empty | ready for doctor-confirmed dispatch'}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
