import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  Ambulance,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Home,
  Info,
  Menu,
  Network,
  Plane,
  Radio,
  ShieldAlert,
  TabletSmartphone,
  Wifi,
  WifiOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import TriagePortal from './pages/TriagePortal';
import DroneFleet from './pages/DroneFleet';
import MeshNetwork from './pages/MeshNetwork';
import Analytics from './pages/Analytics';
import About from './pages/About';
import EdgeTablet from './pages/EdgeTablet';
import { syncEdgeQueue } from './api/client';
import { useWebSocket } from './hooks/useWebSocket';
import type { OfflineQueuedCase } from './types';

type PageKey = 'dashboard' | 'triage' | 'fleet' | 'mesh' | 'analytics' | 'about' | 'edge-tablet';

const navItems: Array<{ key: PageKey; label: string; icon: typeof Home }> = [
  { key: 'dashboard', label: 'Dashboard', icon: Home },
  { key: 'triage', label: 'Triage Portal', icon: Activity },
  { key: 'fleet', label: 'Drone Fleet', icon: Plane },
  { key: 'mesh', label: 'Mesh Network', icon: Network },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'edge-tablet', label: 'Edge Tablet', icon: TabletSmartphone },
  { key: 'about', label: 'About', icon: Info },
];

function SkyMedLogo() {
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 64 64" className="h-10 w-10 drop-shadow-[0_0_10px_rgba(0,212,255,0.6)]" role="img" aria-label="SkyMed drone logo">
        <circle cx="14" cy="14" r="7" fill="none" stroke="#00d4ff" strokeWidth="3" />
        <circle cx="50" cy="14" r="7" fill="none" stroke="#00d4ff" strokeWidth="3" />
        <circle cx="14" cy="50" r="7" fill="none" stroke="#00d4ff" strokeWidth="3" />
        <circle cx="50" cy="50" r="7" fill="none" stroke="#00d4ff" strokeWidth="3" />
        <path d="M20 18 L32 28 L44 18 M20 46 L32 36 L44 46" fill="none" stroke="#6ee7f9" strokeWidth="3" strokeLinecap="round" />
        <rect x="23" y="23" width="18" height="18" rx="4" fill="#111827" stroke="#00d4ff" strokeWidth="2" />
        <path d="M32 27v10M27 32h10" stroke="#ff1744" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <div>
        <div className="text-xl font-black tracking-normal text-accent-cyan">SkyMed</div>
        <div className="text-[10px] uppercase tracking-normal text-text-muted">Command Layer</div>
      </div>
    </div>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [flushState, setFlushState] = useState<'idle' | 'flushing' | 'complete'>('idle');
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueuedCase[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('skymed-sync-queue') ?? '[]') as OfflineQueuedCase[];
    } catch {
      return [];
    }
  });

  const { snapshot, connected } = useWebSocket(!offlineMode);

  useEffect(() => {
    localStorage.setItem('skymed-sync-queue', JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  const queueCase = (item: OfflineQueuedCase) => {
    setOfflineQueue((current) => [...current, item]);
    toast('Local Edge Mode: triage packet queued for district sync.', { icon: '⚠' });
  };

  const handleOfflineToggle = async (nextOffline: boolean) => {
    setOfflineMode(nextOffline);
    if (nextOffline) {
      toast('Network loss simulated. ASHA tablet is now in Local Edge Mode.', { icon: '⚠' });
      return;
    }

    if (offlineQueue.length > 0) {
      setFlushState('flushing');
      try {
        await syncEdgeQueue();
        await new Promise((resolve) => window.setTimeout(resolve, 1200));
        const flushed = offlineQueue.length;
        setOfflineQueue([]);
        setFlushState('complete');
        toast.success(`${flushed} queued triage packet${flushed === 1 ? '' : 's'} flushed to district hub.`);
        window.setTimeout(() => setFlushState('idle'), 1600);
      } catch {
        setOfflineMode(true);
        setFlushState('idle');
        toast.error('District hub unreachable. Queue preserved locally.');
      }
    } else {
      toast.success('Online: live district hub connection restored.');
    }
  };

  const page = useMemo(() => {
    const common = { isOffline: offlineMode, queueCount: offlineQueue.length };
    switch (activePage) {
      case 'triage':
        return <TriagePortal {...common} onQueueCase={queueCase} onNavigate={setActivePage} />;
      case 'fleet':
        return <DroneFleet isOffline={offlineMode} />;
      case 'mesh':
        return <MeshNetwork isOffline={offlineMode} queueCount={offlineQueue.length} />;
      case 'analytics':
        return <Analytics isOffline={offlineMode} />;
      case 'edge-tablet':
        return <EdgeTablet isOffline={offlineMode} queueCount={offlineQueue.length} onQueueCase={queueCase} />;
      case 'about':
        return <About />;
      default:
        return <Dashboard isOffline={offlineMode} live={snapshot} wsConnected={connected} />;
    }
  }, [activePage, connected, offlineMode, offlineQueue.length, snapshot]);

  const asideWidth = sidebarOpen ? 'lg:w-72' : 'lg:w-24';

  return (
    <div className={`min-h-screen bg-bg-primary text-text-primary ${offlineMode ? 'shadow-[inset_0_0_0_2px_rgba(255,179,0,0.42)]' : ''}`}>
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/10 bg-surface/95 transition-transform lg:translate-x-0 ${asideWidth} ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
          {sidebarOpen ? <SkyMedLogo /> : <Cpu className="h-8 w-8 text-accent-cyan" />}
          <button
            type="button"
            className="hidden rounded-md border border-white/10 p-2 text-text-muted transition hover:border-accent-cyan hover:text-accent-cyan lg:block"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label="Toggle sidebar width"
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 space-y-2 px-3 py-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activePage === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setActivePage(item.key);
                  setMobileOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-semibold transition ${
                  active
                    ? 'border border-accent-cyan/50 bg-accent-cyan/10 text-accent-cyan shadow-glow'
                    : 'border border-transparent text-text-muted hover:border-white/10 hover:bg-white/5 hover:text-text-primary'
                }`}
                title={item.label}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-white/10 p-4">
          <div className={`rounded-md border p-3 ${offlineMode ? 'border-accent-amber/50 bg-accent-amber/10' : 'border-accent-green/30 bg-accent-green/5'}`}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-normal">
                {offlineMode ? <WifiOff className="h-4 w-4 text-accent-amber" /> : <Wifi className="h-4 w-4 text-accent-green" />}
                {sidebarOpen && <span>{offlineMode ? 'Local Edge Mode' : 'Online Mode'}</span>}
              </div>
              <button
                type="button"
                onClick={() => void handleOfflineToggle(!offlineMode)}
                className={`relative h-6 w-11 rounded-full transition ${offlineMode ? 'bg-accent-amber' : 'bg-accent-green'}`}
                aria-label="Simulate network loss"
              >
                <span className={`absolute top-1 h-4 w-4 rounded-full bg-bg-primary transition ${offlineMode ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
            {sidebarOpen && (
              <div className="text-xs leading-5 text-text-muted">
                {offlineMode ? 'Triage packets queue on the ASHA tablet until mesh sync returns.' : 'District hub and WebSocket telemetry active.'}
              </div>
            )}
          </div>

          <div className="rounded-md border border-white/10 bg-bg-primary p-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-normal text-text-muted">
              <Radio className="h-4 w-4 text-accent-cyan" />
              {sidebarOpen && <span>Live Status</span>}
            </div>
            {sidebarOpen && (
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded bg-white/5 p-2">
                  <div className="text-text-muted">Mesh</div>
                  <div className="font-bold text-accent-cyan">{snapshot.mesh_status_summary.online || 0} online</div>
                </div>
                <div className="rounded bg-white/5 p-2">
                  <div className="text-text-muted">Airborne</div>
                  <div className="font-bold text-accent-green">{snapshot.drones_airborne}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className={`transition-all ${sidebarOpen ? 'lg:pl-72' : 'lg:pl-24'}`}>
        <header className="sticky top-0 z-30 border-b border-white/10 bg-bg-primary/90 backdrop-blur">
          <div className="flex min-h-20 flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between lg:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-md border border-white/10 p-2 text-text-muted lg:hidden"
                onClick={() => setMobileOpen((open) => !open)}
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <div className="text-sm font-bold text-text-primary md:text-base">
                  APSCHE NTD 2026 | Responsible Innovation for Inclusive Growth | Amaravati Vigyan Puraskar Submission
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                  <span className={`badge ${connected && !offlineMode ? 'border-accent-green/40 text-accent-green' : 'border-accent-amber/40 text-accent-amber'}`}>
                    {connected && !offlineMode ? 'WebSocket Connected' : 'Edge Store-and-Forward'}
                  </span>
                  <span className={`badge ${offlineQueue.length ? 'border-accent-amber/50 text-accent-amber' : 'border-white/10 text-text-muted'}`}>
                    Sync Queue: {offlineQueue.length} Pending
                  </span>
                  {offlineMode && (
                    <span className="badge border-accent-amber/50 bg-accent-amber/10 text-accent-amber">
                      AES-256 packet cache | No PII mesh broadcast
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-white/10 bg-surface px-3 py-2 text-xs text-text-muted">
              <ShieldAlert className={offlineMode ? 'h-4 w-4 text-accent-amber' : 'h-4 w-4 text-accent-cyan'} />
              <span>{offlineMode ? 'Network loss simulation active' : 'Doctor-confirmed dispatch only'}</span>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage + String(offlineMode)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >
              {page}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {flushState !== 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-bg-primary/80 p-6 backdrop-blur"
          >
            <motion.div
              initial={{ scale: 0.94, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-xl rounded-md border border-accent-cyan/40 bg-surface p-6 shadow-glow"
            >
              <div className="mb-5 flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-accent-cyan/10 text-accent-cyan">
                  <Ambulance className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-lg font-black">{flushState === 'flushing' ? 'Flushing Local Edge Queue' : 'District Hub Updated'}</div>
                  <div className="text-sm text-text-muted">ASHA tablet → LoRa mesh node → AMTZ doctor dashboard</div>
                </div>
              </div>
              <div className="relative h-3 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full bg-accent-cyan"
                  initial={{ width: '8%' }}
                  animate={{ width: flushState === 'flushing' ? ['8%', '70%', '92%'] : '100%' }}
                  transition={{ duration: 1.1, repeat: flushState === 'flushing' ? Infinity : 0 }}
                />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
                {['Edge cache', 'Village mesh', 'District cloud'].map((label, index) => (
                  <div key={label} className="rounded-md border border-white/10 bg-bg-primary p-3">
                    <div className="text-text-muted">Step {index + 1}</div>
                    <div className="mt-1 font-bold text-text-primary">{label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
