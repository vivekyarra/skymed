import { useEffect, useMemo, useState } from 'react';
import { wsUrl } from '../api/client';
import type { LiveSnapshot } from '../types';

const emptySnapshot: LiveSnapshot = {
  active_missions: [],
  p1_alerts: [],
  mesh_status_summary: { online: 0, degraded: 0, offline: 0 },
  drones_airborne: 0,
  cases_last_hour: 0,
  timestamp: new Date().toISOString(),
};

export function useWebSocket(enabled = true) {
  const [snapshot, setSnapshot] = useState<LiveSnapshot>(emptySnapshot);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setConnected(false);
      return;
    }

    let closed = false;
    let reconnectTimer: number | undefined;
    let socket: WebSocket | undefined;

    const connect = () => {
      socket = new WebSocket(wsUrl);
      socket.onopen = () => setConnected(true);
      socket.onmessage = (event) => {
        try {
          setSnapshot(JSON.parse(event.data) as LiveSnapshot);
        } catch {
          setSnapshot((current) => current);
        }
      };
      socket.onerror = () => setConnected(false);
      socket.onclose = () => {
        setConnected(false);
        if (!closed) {
          reconnectTimer = window.setTimeout(connect, 2500);
        }
      };
    };

    connect();

    return () => {
      closed = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [enabled]);

  return useMemo(() => ({ snapshot, connected }), [snapshot, connected]);
}
