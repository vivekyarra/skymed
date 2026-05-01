import { useEffect, useMemo, useState } from 'react';
import { wsUrl } from '../api/client';
import type { LiveSnapshot } from '../types';
import { MOCK_SNAPSHOT } from '../api/mockData';

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

    // Fallback heartbeat for demo when disconnected
    const fallbackInterval = window.setInterval(() => {
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        setSnapshot(prev => ({
          ...MOCK_SNAPSHOT,
          timestamp: new Date().toISOString(),
          // Add slight jitter to values for "live" feel
          drones_airborne: Math.max(0, MOCK_SNAPSHOT.drones_airborne + (Math.random() > 0.5 ? 1 : -1)),
        }));
      }
    }, 3000);

    connect();

    return () => {
      closed = true;
      window.clearInterval(fallbackInterval);
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [enabled]);

  return useMemo(() => ({ snapshot, connected }), [snapshot, connected]);
}
