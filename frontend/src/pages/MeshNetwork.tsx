import { useEffect, useMemo, useState } from 'react';
import { Battery, CloudOff, Loader2, Radio, RefreshCw, Router, Satellite, Signal, Wifi } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchMeshNodes, syncEdgeQueue } from '../api/client';
import type { MeshNode } from '../types';

function statusClass(status: MeshNode['status']) {
  if (status === 'online') return 'bg-accent-green text-accent-green border-accent-green/40';
  if (status === 'degraded') return 'bg-accent-amber text-accent-amber border-accent-amber/40';
  return 'bg-accent-red text-accent-red border-accent-red/40';
}

function SignalBars({ level }: { level: number }) {
  return (
    <div className="flex h-8 items-end gap-1">
      {[1, 2, 3, 4].map((bar) => (
        <span
          key={bar}
          className={`w-2 rounded-sm ${bar <= level ? 'bg-accent-cyan' : 'bg-white/10'}`}
          style={{ height: `${bar * 7}px` }}
        />
      ))}
    </div>
  );
}

export default function MeshNetwork({ isOffline, queueCount }: { isOffline: boolean; queueCount: number }) {
  const [nodes, setNodes] = useState<MeshNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (isOffline) return;
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const data = await fetchMeshNodes();
        if (!cancelled) setNodes(data);
      } catch {
        if (!cancelled) toast.error('Unable to load mesh nodes.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    const timer = window.setInterval(load, 12000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [isOffline]);

  const positioned = useMemo(() => {
    if (!nodes.length) return [];
    const minLat = Math.min(...nodes.map((node) => node.lat));
    const maxLat = Math.max(...nodes.map((node) => node.lat));
    const minLon = Math.min(...nodes.map((node) => node.lon));
    const maxLon = Math.max(...nodes.map((node) => node.lon));
    return nodes.map((node) => ({
      ...node,
      x: 80 + ((node.lon - minLon) / Math.max(0.01, maxLon - minLon)) * 840,
      y: 80 + (1 - (node.lat - minLat) / Math.max(0.01, maxLat - minLat)) * 420,
    }));
  }, [nodes]);

  const runSync = async () => {
    if (isOffline) {
      toast('Network is still down. Local queue remains on the ASHA tablet.', { icon: '⚠' });
      return;
    }
    setSyncing(true);
    try {
      const result = await syncEdgeQueue();
      await new Promise((resolve) => window.setTimeout(resolve, 900));
      toast.success(`${result.synced_count} records synced in ${result.sync_latency_ms} ms.`);
    } catch {
      toast.error('Sync simulation failed.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black">Mesh Network</h1>
          <p className="text-sm text-text-muted">LoRa store-and-forward relay linking ASHA kits to AMTZ doctors.</p>
        </div>
        <button
          type="button"
          onClick={() => void runSync()}
          disabled={syncing}
          className={`flex items-center gap-2 rounded-md px-4 py-3 text-sm font-black transition ${
            isOffline ? 'border border-accent-amber/40 text-accent-amber' : 'bg-accent-cyan text-bg-primary hover:brightness-110'
          }`}
        >
          {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Simulate Offline Sync
        </button>
      </div>

      <section className={`panel rounded-md p-4 ${isOffline ? 'border-accent-amber/40 shadow-amber' : ''}`}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-accent-cyan/10 text-accent-cyan">
              {isOffline ? <CloudOff className="h-5 w-5 text-accent-amber" /> : <Router className="h-5 w-5" />}
            </div>
            <div>
              <div className="font-black">Store-and-forward resilience</div>
              <div className="text-sm text-text-muted">Cases are never lost. Offline data syncs automatically when connectivity restores.</div>
            </div>
          </div>
          <span className={`badge ${queueCount ? 'border-accent-amber/50 text-accent-amber' : 'border-accent-green/40 text-accent-green'}`}>
            Sync Queue: {queueCount} Pending
          </span>
        </div>
      </section>

      {loading && !nodes.length ? (
        <div className="panel grid min-h-72 place-items-center rounded-md">
          <Loader2 className="h-10 w-10 animate-spin text-accent-cyan" />
        </div>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {nodes.map((node, index) => {
            const signalLevel = node.status === 'offline' ? 1 : node.status === 'degraded' ? 2 : 4;
            return (
              <div key={node.node_id} className="panel rounded-md p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-black">{node.village_name}</h2>
                    <p className="text-sm text-text-muted">{node.district}</p>
                  </div>
                  <span className={`h-3 w-3 rounded-full ${statusClass(node.status).split(' ')[0]}`} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className={`badge ${statusClass(node.status).replace('bg-', 'border-').replace(' text-', ' text-')}`}>{node.status}</span>
                  <span className="badge border-accent-cyan/40 text-accent-cyan">{node.connectivity.toUpperCase()}</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md border border-white/10 bg-bg-primary p-3">
                    <Battery className="mb-2 h-4 w-4 text-accent-green" />
                    <div className="font-black">{node.battery_pct}%</div>
                    <div className="text-xs text-text-muted">Battery</div>
                  </div>
                  <div className="rounded-md border border-white/10 bg-bg-primary p-3">
                    <Radio className="mb-2 h-4 w-4 text-accent-cyan" />
                    <div className="font-black">{node.last_sync_ago_min}m</div>
                    <div className="text-xs text-text-muted">Last sync</div>
                  </div>
                  <div className="rounded-md border border-white/10 bg-bg-primary p-3">
                    <Satellite className="mb-2 h-4 w-4 text-accent-amber" />
                    <div className="font-black">{node.drones_available}</div>
                    <div className="text-xs text-text-muted">Drones</div>
                  </div>
                  <div className="rounded-md border border-white/10 bg-bg-primary p-3">
                    <Signal className="mb-2 h-4 w-4 text-accent-cyan" />
                    <div className="flex items-center justify-between">
                      <span className="font-black">{node.cases_today}</span>
                      <SignalBars level={signalLevel} />
                    </div>
                    <div className="text-xs text-text-muted">Cases today</div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-text-muted">Node ring index {index + 1}: LoRa broadcast contains case ID and priority only, not patient PII.</div>
              </div>
            );
          })}
        </section>
      )}

      <section className="panel rounded-md p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black">Network Map</h2>
            <p className="text-sm text-text-muted">Line thickness represents relay strength; animated dashes show store-and-forward data flow.</p>
          </div>
          {syncing && <span className="badge border-accent-cyan/40 text-accent-cyan">Syncing...</span>}
        </div>
        <div className="overflow-hidden rounded-md border border-white/10 bg-bg-primary">
          <svg viewBox="0 0 1000 600" className="h-[420px] w-full">
            <defs>
              <filter id="meshGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {positioned.slice(0, -1).map((node, index) => {
              const next = positioned[index + 1];
              const strength = node.status === 'online' && next.status === 'online' ? 5 : 2.5;
              return (
                <line
                  key={`${node.node_id}-${next.node_id}`}
                  x1={node.x}
                  y1={node.y}
                  x2={next.x}
                  y2={next.y}
                  stroke={node.status === 'offline' || next.status === 'offline' ? '#ff1744' : '#00d4ff'}
                  strokeWidth={strength}
                  strokeDasharray="16 14"
                  className={syncing ? 'animate-dataFlow' : ''}
                  opacity="0.72"
                />
              );
            })}
            {positioned.map((node) => (
              <g key={node.node_id} filter="url(#meshGlow)">
                <circle cx={node.x} cy={node.y} r="18" fill={node.status === 'offline' ? '#ff1744' : node.status === 'degraded' ? '#ffb300' : '#00d4ff'} opacity="0.2" />
                <circle cx={node.x} cy={node.y} r="9" fill={node.status === 'offline' ? '#ff1744' : node.status === 'degraded' ? '#ffb300' : '#00d4ff'} />
                <text x={node.x + 16} y={node.y - 14} fill="#f9fafb" fontSize="18" fontWeight="800">
                  {node.village_name}
                </text>
                <text x={node.x + 16} y={node.y + 8} fill="#6b7280" fontSize="13">
                  {node.connectivity.toUpperCase()} | {node.battery_pct}%
                </text>
              </g>
            ))}
          </svg>
        </div>
      </section>
    </div>
  );
}
