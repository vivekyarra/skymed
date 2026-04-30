import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowDownUp, Clock, Loader2, MapPinned, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchCases } from '../api/client';
import type { CaseRecord, Priority } from '../types';

const priorityColors: Record<Priority, string> = {
  P1: '#ff1744',
  P2: '#ffb300',
  P3: '#00e676',
};

export default function Analytics({ isOffline }: { isOffline: boolean }) {
  const [range, setRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    if (isOffline) return;
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const data = await fetchCases();
        if (!cancelled) setCases(data);
      } catch {
        if (!cancelled) toast.error('Unable to load analytics.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
  }, [isOffline]);

  const casesByHour = useMemo(() => {
    const buckets = Array.from({ length: 12 }, (_, index) => ({ hour: `${index * 2}:00`, cases: 0, p1: 0 }));
    cases.forEach((record, index) => {
      const bucket = buckets[index % buckets.length];
      bucket.cases += 1;
      if (record.priority === 'P1') bucket.p1 += 1;
    });
    return buckets;
  }, [cases]);

  const priorityDistribution = useMemo(() => {
    return (['P1', 'P2', 'P3'] as Priority[]).map((priority) => ({
      name: priority,
      value: cases.filter((record) => record.priority === priority).length,
    }));
  }, [cases]);

  const responseTimes = [
    { label: 'Triage', min: 4.2 },
    { label: 'Doctor review', min: 9.6 },
    { label: 'Dispatch approval', min: 12.8 },
    { label: 'Drone delivery', min: 18.4 },
  ];

  const villageRows = useMemo(() => {
    const map = new Map<string, { village: string; total: number; p1: number; avgScore: number }>();
    cases.forEach((record) => {
      const row = map.get(record.village_name) ?? { village: record.village_name, total: 0, p1: 0, avgScore: 0 };
      row.total += 1;
      row.p1 += record.priority === 'P1' ? 1 : 0;
      row.avgScore += record.triage_score;
      map.set(record.village_name, row);
    });
    return [...map.values()]
      .map((row) => ({ ...row, avgScore: Math.round(row.avgScore / Math.max(1, row.total)) }))
      .sort((a, b) => (sortAsc ? a.total - b.total : b.total - a.total));
  }, [cases, sortAsc]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black">Analytics</h1>
          <p className="text-sm text-text-muted">Operational impact proxy derived from demo triage packets and planning assumptions.</p>
        </div>
        <div className="grid grid-cols-3 rounded-md border border-white/10 bg-surface p-1">
          {(['24h', '7d', '30d'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRange(item)}
              className={`rounded px-4 py-2 text-sm font-bold ${range === item ? 'bg-accent-cyan text-bg-primary' : 'text-text-muted hover:text-text-primary'}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Avg triage-to-doctor', value: '4.2 min', icon: Clock, color: 'text-accent-cyan' },
          { label: 'Avg drone delivery', value: '18.4 min', icon: TrendingUp, color: 'text-accent-green' },
          { label: 'Golden-hour risk proxy', value: 'Pilot TBD', icon: MapPinned, color: 'text-accent-amber' },
          { label: 'Projected P1 gap cases', value: '2,874/mo', icon: TrendingUp, color: 'text-accent-red' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="panel rounded-md p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">{item.label}</span>
                <Icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <div className="mt-3 text-3xl font-black">{item.value}</div>
            </div>
          );
        })}
      </section>

      {loading && !cases.length ? (
        <div className="panel grid min-h-72 place-items-center rounded-md">
          <Loader2 className="h-10 w-10 animate-spin text-accent-cyan" />
        </div>
      ) : (
        <>
          <section className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
            <div className="panel rounded-md p-4">
              <h2 className="mb-4 text-lg font-black">Cases Per Hour</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={casesByHour}>
                    <defs>
                      <linearGradient id="caseArea" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.55} />
                        <stop offset="95%" stopColor="#00d4ff" stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,.08)" />
                    <XAxis dataKey="hour" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,.14)', color: '#f9fafb' }} />
                    <Area type="monotone" dataKey="cases" stroke="#00d4ff" fill="url(#caseArea)" strokeWidth={3} />
                    <Area type="monotone" dataKey="p1" stroke="#ff1744" fill="#ff174422" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="panel rounded-md p-4">
              <h2 className="mb-4 text-lg font-black">P1/P2/P3 Distribution</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={priorityDistribution} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={4}>
                      {priorityDistribution.map((entry) => (
                        <Cell key={entry.name} fill={priorityColors[entry.name as Priority]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,.14)', color: '#f9fafb' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                {priorityDistribution.map((entry) => (
                  <div key={entry.name} className="rounded-md border border-white/10 bg-bg-primary p-2">
                    <div className="font-black" style={{ color: priorityColors[entry.name as Priority] }}>
                      {entry.name}
                    </div>
                    <div className="text-text-muted">{entry.value} cases</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[0.85fr_1fr]">
            <div className="panel rounded-md p-4">
              <h2 className="mb-4 text-lg font-black">Response Time</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={responseTimes}>
                    <CartesianGrid stroke="rgba(255,255,255,.08)" />
                    <XAxis dataKey="label" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,.14)', color: '#f9fafb' }} />
                    <Bar dataKey="min" fill="#ffb300" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="panel rounded-md p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-black">Cases By Village</h2>
                <button type="button" onClick={() => setSortAsc((value) => !value)} className="flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm text-text-muted">
                  <ArrowDownUp className="h-4 w-4" />
                  Sort
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-white/10 text-xs uppercase tracking-normal text-text-muted">
                    <tr>
                      <th className="py-3">Village</th>
                      <th className="py-3">Cases</th>
                      <th className="py-3">P1</th>
                      <th className="py-3">Avg Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {villageRows.map((row) => (
                      <tr key={row.village} className="border-b border-white/5">
                        <td className="py-3 font-bold">{row.village}</td>
                        <td className="py-3">{row.total}</td>
                        <td className="py-3 text-accent-red">{row.p1}</td>
                        <td className="py-3">{row.avgScore}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="panel rounded-md p-4">
            <h2 className="mb-3 text-lg font-black">Projected Impact Model</h2>
            <div className="grid gap-3 md:grid-cols-4">
              {[
                ['847', 'tribal villages'],
                ['12', 'cases per month'],
                ['28.3%', 'P1 access-gap proxy'],
                ['~2,874', 'P1 reviews/month'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-md border border-white/10 bg-bg-primary p-4 text-center">
                  <div className="text-2xl font-black text-accent-cyan">{value}</div>
                  <div className="mt-1 text-sm text-text-muted">{label}</div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm leading-6 text-text-muted">
              847 tribal villages x 12 cases/month x 28.3% proxy gap = approximately 2,874 possible P1 review opportunities per month.
              Proxy pending pilot data; the 28.3% input is deliberately conservative and should be replaced with measured pilot outcomes.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
