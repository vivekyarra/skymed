import { useEffect, useState } from 'react';
import L from 'leaflet';
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer } from 'react-leaflet';
import { BatteryCharging, CheckCircle2, Loader2, Package, Plane, RotateCcw, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchFleet } from '../api/client';
import type { FleetDrone } from '../types';

const steps = ['Dispatched', 'En Route', 'Approaching', 'Landing', 'Returning'];

function currentStep(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes('return')) return 4;
  if (normalized.includes('landing')) return 3;
  if (normalized.includes('approach')) return 2;
  if (normalized.includes('route')) return 1;
  return 0;
}

function DroneSvg({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 160 120" className="h-28 w-full" role="img" aria-label="VTOL medical drone">
      <g stroke="#00d4ff" strokeWidth="4" strokeLinecap="round" fill="none">
        <path d="M35 35 L80 58 L125 35" />
        <path d="M35 85 L80 62 L125 85" />
        <path d="M80 42 V80" />
      </g>
      {[35, 125].map((x) =>
        [35, 85].map((y) => (
          <g key={`${x}-${y}`} className={active ? 'origin-center animate-rotor' : ''} style={{ transformBox: 'fill-box' }}>
            <circle cx={x} cy={y} r="18" fill="rgba(0,212,255,.08)" stroke="#00d4ff" strokeWidth="2" />
            <path d={`M${x - 14} ${y} H${x + 14} M${x} ${y - 14} V${y + 14}`} stroke="#6ee7f9" strokeWidth="3" strokeLinecap="round" />
          </g>
        )),
      )}
      <rect x="61" y="43" width="38" height="34" rx="6" fill="#111827" stroke="#00d4ff" strokeWidth="3" />
      <path d="M80 51v18M71 60h18" stroke="#ff1744" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

function droneIcon() {
  return L.divIcon({
    className: 'fleet-drone-icon',
    html: '<div style="height:24px;width:24px;border-radius:999px;background:#00d4ff;color:#0a0f1e;display:grid;place-items:center;font-weight:900;box-shadow:0 0 18px rgba(0,212,255,.6)">+</div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export default function DroneFleet({ isOffline }: { isOffline: boolean }) {
  const [fleet, setFleet] = useState<FleetDrone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOffline) return;
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const data = await fetchFleet();
        if (!cancelled) setFleet(data);
      } catch {
        if (!cancelled) toast.error('Unable to load drone fleet.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    const timer = window.setInterval(load, 3500);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [isOffline]);

  const active = fleet.find((drone) => drone.mission);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black">Drone Fleet</h1>
          <p className="text-sm text-text-muted">Doctor-confirmed VTOL missions delivering inbound heat-stable therapeutics only.</p>
        </div>
        <span className={`badge ${isOffline ? 'border-accent-amber/50 text-accent-amber' : 'border-accent-cyan/40 text-accent-cyan'}`}>
          {isOffline ? 'Fleet telemetry cached' : 'Live telemetry'}
        </span>
      </div>

      {loading && !fleet.length ? (
        <div className="panel grid min-h-72 place-items-center rounded-md">
          <Loader2 className="h-10 w-10 animate-spin text-accent-cyan" />
        </div>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {fleet.map((drone) => {
            const mission = drone.mission;
            const status = drone.status;
            const activeDrone = Boolean(mission);
            const statusTone = status.includes('MAINTENANCE')
              ? 'border-accent-amber/40 text-accent-amber'
              : activeDrone
                ? 'border-accent-cyan/40 text-accent-cyan'
                : 'border-accent-green/40 text-accent-green';

            return (
              <div key={drone.drone_id} className={`panel rounded-md p-4 ${activeDrone ? 'shadow-glow' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="font-black">{drone.drone_id}</div>
                  <span className={`badge ${statusTone}`}>{status}</span>
                </div>
                <DroneSvg active={activeDrone} />
                <div className="flex items-center gap-3">
                  <div className="relative grid h-16 w-16 place-items-center rounded-full border-4 border-white/10">
                    <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="28" fill="none" stroke={drone.battery_pct < 30 ? '#ff1744' : '#00e676'} strokeWidth="5" strokeDasharray={`${drone.battery_pct * 1.76} 176`} />
                    </svg>
                    <span className="text-sm font-black">{drone.battery_pct}%</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      {activeDrone ? <Package className="h-4 w-4 text-accent-cyan" /> : status.includes('MAINTENANCE') ? <Wrench className="h-4 w-4 text-accent-amber" /> : <CheckCircle2 className="h-4 w-4 text-accent-green" />}
                      {activeDrone ? 'Mission payload' : status.includes('MAINTENANCE') ? 'Scheduled service' : 'AVAILABLE'}
                    </div>
                    <div className="mt-1 truncate text-xs text-text-muted">
                      {mission ? `${mission.payload_manifest.join(', ')} | ETA ${drone.eta_min} min` : 'Payload bay empty'}
                    </div>
                  </div>
                </div>

                {mission && (
                  <div className="mt-4 space-y-3">
                    <div className="rounded-md border border-white/10 bg-bg-primary p-3 text-xs text-text-muted">
                      <div>Destination: {mission.destination_lat.toFixed(4)}, {mission.destination_lon.toFixed(4)}</div>
                      <div>Wind: {mission.wind_speed_ms} m/s | Battery need: {mission.battery_required_pct}%</div>
                    </div>
                    <div className="h-40 overflow-hidden rounded-md border border-white/10">
                      <MapContainer center={[drone.current_lat, drone.current_lon]} zoom={10} className="h-full w-full" zoomControl={false} attributionControl={false}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                        <Polyline positions={mission.waypoints.map((point) => [point.lat, point.lon])} pathOptions={{ color: '#00d4ff', weight: 3 }} />
                        <Marker position={[drone.current_lat, drone.current_lon]} icon={droneIcon()} />
                        <CircleMarker center={[mission.destination_lat, mission.destination_lon]} radius={6} pathOptions={{ color: '#ff1744', fillColor: '#ff1744', fillOpacity: 0.8 }} />
                      </MapContainer>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {active && active.mission && (
        <section className="panel rounded-md p-4">
          <div className="mb-4 flex items-center gap-2">
            <Plane className="h-5 w-5 text-accent-cyan" />
            <h2 className="text-lg font-black">Active Mission Stepper</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-5">
            {steps.map((step, index) => {
              const done = index <= currentStep(active.status);
              return (
                <div key={step} className={`rounded-md border p-3 ${done ? 'border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan' : 'border-white/10 bg-bg-primary text-text-muted'}`}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-normal">Step {index + 1}</span>
                    {index === currentStep(active.status) && <RotateCcw className="h-4 w-4 animate-spin" />}
                  </div>
                  <div className="font-black">{step}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-text-muted">
            <BatteryCharging className="h-4 w-4 text-accent-green" />
            Payload intact, doctor-confirmed dispatch command recorded.
          </div>
        </section>
      )}
    </div>
  );
}
