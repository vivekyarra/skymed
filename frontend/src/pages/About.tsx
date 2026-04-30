import { Cpu, HeartHandshake, Network, Plane, ShieldCheck, Users } from 'lucide-react';

function ArchitectureDiagram() {
  return (
    <svg viewBox="0 0 1200 900" className="w-full rounded-md border border-white/10 bg-bg-primary shadow-2xl" role="img" aria-label="SkyMed — Three-Ring Architecture">
      <defs>
        <filter id="gCyan" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="gAmber" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="gRed" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="aCyan" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto"><path d="M0,0 L10,4 L0,8z" fill="#00d4ff"/></marker>
        <marker id="aAmber" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto"><path d="M0,0 L10,4 L0,8z" fill="#ffb300"/></marker>
        <marker id="aRed" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto"><path d="M0,0 L10,4 L0,8z" fill="#ff1744"/></marker>
        <radialGradient id="rgOuter" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor="transparent"/>
          <stop offset="100%" stopColor="rgba(0,212,255,0.06)"/>
        </radialGradient>
        <radialGradient id="rgMid" cx="50%" cy="50%" r="50%">
          <stop offset="65%" stopColor="transparent"/>
          <stop offset="100%" stopColor="rgba(255,179,0,0.08)"/>
        </radialGradient>
        <radialGradient id="rgInner" cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor="transparent"/>
          <stop offset="100%" stopColor="rgba(255,23,68,0.10)"/>
        </radialGradient>
      </defs>

      <rect width="1200" height="900" fill="#0a0f1e"/>

      <g fill="#1a2038" opacity="0.5">
        {[100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100].map(x => (
          <g key={x}>
            <circle cx={x} cy={100} r="1.2"/><circle cx={x} cy={200} r="1.2"/><circle cx={x} cy={800} r="1.2"/>
          </g>
        ))}
      </g>

      <text x="600" y="52" textAnchor="middle" fill="#f0f4f8" fontFamily="system-ui,sans-serif" fontSize="28" fontWeight="800" letterSpacing="1">SKYMED  ·  THREE-RING  ARCHITECTURE</text>
      <text x="600" y="80" textAnchor="middle" fill="#4b5563" fontFamily="system-ui,sans-serif" fontSize="14" letterSpacing="2">COMMAND · COORDINATION · INTELLIGENCE</text>

      <circle cx="600" cy="460" r="340" fill="url(#rgOuter)" stroke="#00d4ff" strokeWidth="2.5" strokeDasharray="12 6" filter="url(#gCyan)" opacity="0.85"/>
      <text x="600" y="160" textAnchor="middle" fill="#00d4ff" fontFamily="system-ui,sans-serif" fontSize="13" fontWeight="700" letterSpacing="4">LAYER 3</text>
      <text x="600" y="182" textAnchor="middle" fill="#00d4ff" fontFamily="system-ui,sans-serif" fontSize="22" fontWeight="800" letterSpacing="2">DISTRICT CLOUD</text>

      <g fontFamily="system-ui,sans-serif" fontSize="11" fontWeight="600">
        <rect x="410" y="198" width="145" height="26" rx="13" fill="#0d1829" stroke="#00d4ff" strokeWidth="1" opacity="0.8"/>
        <text x="482" y="216" textAnchor="middle" fill="#7dd3fc">AMTZ Dashboard</text>
        <rect x="570" y="198" width="150" height="26" rx="13" fill="#0d1829" stroke="#00d4ff" strokeWidth="1" opacity="0.8"/>
        <text x="645" y="216" textAnchor="middle" fill="#7dd3fc">Health Analytics</text>
        <rect x="735" y="198" width="120" height="26" rx="13" fill="#0d1829" stroke="#00d4ff" strokeWidth="1" opacity="0.8"/>
        <text x="795" y="216" textAnchor="middle" fill="#7dd3fc">AES-256</text>
      </g>

      <circle cx="600" cy="460" r="230" fill="url(#rgMid)" stroke="#ffb300" strokeWidth="2.5" strokeDasharray="8 5" filter="url(#gAmber)" opacity="0.85"/>
      <text x="600" y="268" textAnchor="middle" fill="#ffb300" fontFamily="system-ui,sans-serif" fontSize="12" fontWeight="700" letterSpacing="4">LAYER 2</text>
      <text x="600" y="290" textAnchor="middle" fill="#ffb300" fontFamily="system-ui,sans-serif" fontSize="19" fontWeight="800" letterSpacing="2">VILLAGE MESH</text>

      <g fontFamily="system-ui,sans-serif" fontSize="11" fontWeight="600">
        <rect x="440" y="304" width="105" height="24" rx="12" fill="#111827" stroke="#ffb300" strokeWidth="1" opacity="0.8"/>
        <text x="492" y="321" textAnchor="middle" fill="#fcd34d">LoRa P2P</text>
        <rect x="558" y="304" width="140" height="24" rx="12" fill="#111827" stroke="#ffb300" strokeWidth="1" opacity="0.8"/>
        <text x="628" y="321" textAnchor="middle" fill="#fcd34d">Store &amp; Forward</text>
        <rect x="712" y="304" width="100" height="24" rx="12" fill="#111827" stroke="#ffb300" strokeWidth="1" opacity="0.8"/>
        <text x="762" y="321" textAnchor="middle" fill="#fcd34d">No PII</text>
      </g>

      <circle cx="600" cy="460" r="120" fill="url(#rgInner)" stroke="#ff1744" strokeWidth="2.5" filter="url(#gRed)" opacity="0.9"/>
      <text x="600" y="400" textAnchor="middle" fill="#ff1744" fontFamily="system-ui,sans-serif" fontSize="11" fontWeight="700" letterSpacing="4">LAYER 1</text>
      <text x="600" y="422" textAnchor="middle" fill="#ff1744" fontFamily="system-ui,sans-serif" fontSize="17" fontWeight="800" letterSpacing="2">DRONE EDGE</text>

      <g fontFamily="system-ui,sans-serif" fontSize="10" fontWeight="600">
        <rect x="534" y="436" width="132" height="22" rx="11" fill="#111827" stroke="#ff1744" strokeWidth="1" opacity="0.8"/>
        <text x="600" y="451" textAnchor="middle" fill="#ff8a80">Vitals Rules Engine</text>
        <rect x="540" y="465" width="120" height="22" rx="11" fill="#111827" stroke="#ff1744" strokeWidth="1" opacity="0.8"/>
        <text x="600" y="480" textAnchor="middle" fill="#ff8a80">Offline First</text>
        <rect x="543" y="494" width="114" height="22" rx="11" fill="#111827" stroke="#ff1744" strokeWidth="1" opacity="0.8"/>
        <text x="600" y="509" textAnchor="middle" fill="#ff8a80">Telugu UI</text>
      </g>

      <g fill="none" strokeWidth="2.5" strokeLinecap="round">
        <path d="M510 490 C400 530 370 470 410 400" stroke="#ffb300" strokeDasharray="6 3" markerEnd="url(#aAmber)"/>
        <path d="M700 430 C830 400 860 340 810 280" stroke="#00d4ff" strokeDasharray="6 3" markerEnd="url(#aCyan)"/>
        <path d="M390 260 C310 340 350 420 480 440" stroke="#00d4ff" strokeDasharray="6 3" markerEnd="url(#aCyan)"/>
        <path d="M720 490 C830 520 870 470 830 400" stroke="#ff1744" strokeDasharray="6 3" markerEnd="url(#aRed)"/>
      </g>

      <g fontFamily="system-ui,sans-serif">
        <rect x="68" y="470" width="260" height="56" rx="8" fill="#0d1829" stroke="#ffb300" strokeWidth="1.5" opacity="0.95"/>
        <text x="198" y="494" textAnchor="middle" fill="#ffb300" fontSize="13" fontWeight="700">EDGE → MESH</text>
        <text x="198" y="514" textAnchor="middle" fill="#9ca3af" fontSize="11">Triage packet · LoRa · Offline-capable</text>

        <rect x="876" y="240" width="260" height="56" rx="8" fill="#0d1829" stroke="#00d4ff" strokeWidth="1.5" opacity="0.95"/>
        <text x="1006" y="264" textAnchor="middle" fill="#00d4ff" fontSize="13" fontWeight="700">MESH → CLOUD</text>
        <text x="1006" y="284" textAnchor="middle" fill="#9ca3af" fontSize="11">Batch sync · 4G / VSAT when available</text>

        <rect x="68" y="232" width="270" height="56" rx="8" fill="#0d1829" stroke="#00d4ff" strokeWidth="1.5" opacity="0.95"/>
        <text x="203" y="256" textAnchor="middle" fill="#00d4ff" fontSize="13" fontWeight="700">CLOUD → DRONE</text>
        <text x="203" y="276" textAnchor="middle" fill="#9ca3af" fontSize="11">Dispatch command · Doctor-confirmed only</text>

        <rect x="876" y="470" width="260" height="56" rx="8" fill="#0d1829" stroke="#ff1744" strokeWidth="1.5" opacity="0.95"/>
        <text x="1006" y="494" textAnchor="middle" fill="#ff1744" fontSize="13" fontWeight="700">DRONE → LANDING PAD</text>
        <text x="1006" y="514" textAnchor="middle" fill="#9ca3af" fontSize="11">Payload delivery · ASHA Worker</text>
      </g>

      <g transform="translate(600 620)">
        <rect x="-28" y="-22" width="56" height="44" rx="6" fill="#111827" stroke="#ff1744" strokeWidth="2"/>
        <path d="M0 -12 V12 M-14 0 H14" stroke="#ff1744" strokeWidth="3.5" strokeLinecap="round"/>
        <circle cx="-38" cy="-20" r="8" fill="none" stroke="#00d4ff" strokeWidth="1.5"/>
        <circle cx="38" cy="-20" r="8" fill="none" stroke="#00d4ff" strokeWidth="1.5"/>
        <circle cx="-38" cy="20" r="8" fill="none" stroke="#00d4ff" strokeWidth="1.5"/>
        <circle cx="38" cy="20" r="8" fill="none" stroke="#00d4ff" strokeWidth="1.5"/>
      </g>
      <text x="600" y="660" textAnchor="middle" fill="#6b7280" fontFamily="system-ui,sans-serif" fontSize="10" fontWeight="600" letterSpacing="1.5">VTOL DRONE</text>

      <g transform="translate(310 460)">
        <circle cx="0" cy="-14" r="10" fill="none" stroke="#ffb300" strokeWidth="2"/>
        <path d="M0 -4 V18 M-12 6 H12 M-8 30 L0 18 L8 30" fill="none" stroke="#ffb300" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
      <text x="310" y="506" textAnchor="middle" fill="#6b7280" fontFamily="system-ui,sans-serif" fontSize="10" fontWeight="600" letterSpacing="1.5">ASHA WORKER</text>

      <g transform="translate(890 370)">
        <rect x="-22" y="-16" width="44" height="32" rx="4" fill="#111827" stroke="#00d4ff" strokeWidth="2"/>
        <path d="M-12 0 H12 M0 -10 V10" stroke="#00d4ff" strokeWidth="2.5" strokeLinecap="round"/>
      </g>
      <text x="890" y="404" textAnchor="middle" fill="#6b7280" fontFamily="system-ui,sans-serif" fontSize="10" fontWeight="600" letterSpacing="1.5">AMTZ DOCTOR</text>

      <rect x="60" y="720" width="1080" height="62" rx="10" fill="#0d1829" stroke="#1e293b" strokeWidth="1"/>
      <g fontFamily="system-ui,sans-serif" textAnchor="middle">
        {[
          {x: 150, n: '1', t: 'Vitals Capture'},
          {x: 240, n: '2', t: 'Edge Triage'},
          {x: 360, n: '3', t: 'LoRa Relay'},
          {x: 480, n: '4', t: 'Mesh Forward'},
          {x: 600, n: '5', t: 'Doctor Review'},
          {x: 720, n: '6', t: 'Dispatch'},
          {x: 840, n: '7', t: 'Drone Flight'},
          {x: 960, n: '8', t: 'ASHA Delivers'},
        ].map((s, i) => (
          <g key={i}>
            <circle cx={s.x} cy={745} r="12" fill={i < 2 ? '#ff1744' : i < 4 ? '#ffb300' : i < 6 ? '#00d4ff' : '#10b981'} opacity="0.9"/>
            <text x={s.x} y={749} fill="#fff" fontSize="10" fontWeight="700">{s.n}</text>
            <text x={s.x} y={770} fill="#d1d5db" fontSize="9.5">{s.t}</text>
          </g>
        ))}
        <circle cx="1050" cy="745" r="14" fill="#10b981" opacity="0.9"/>
        <text x="1050" y="749} fill="#fff" fontSize="10" fontWeight="700">✓</text>
        <text x="1050" y="770} fill="#d1d5db" fontSize="9.5">Golden Hour</text>
      </g>
      <text x="60" y="716" fill="#4b5563" fontFamily="system-ui,sans-serif" fontSize="10" fontWeight="600" letterSpacing="3">PATIENT JOURNEY</text>
    </svg>
  );
}

export default function About() {
  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-md border border-white/10 bg-[radial-gradient(circle_at_20%_20%,rgba(0,212,255,.18),transparent_32%),#0a0f1e] p-6 md:p-10">
        <div className="max-w-4xl">
          <div className="mb-3 inline-flex rounded-full border border-accent-cyan/40 px-3 py-1 text-sm font-bold text-accent-cyan">
            APSCHE National Technology Day 2026
          </div>
          <h1 className="text-3xl font-black leading-tight md:text-5xl">
            Responsible Innovation for Inclusive Growth — Built for Tribal Andhra Pradesh
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-text-muted">
            SkyMed is the command, coordination, and intelligence software layer for a VTOL medical drone network.
            It performs vitals-first triage priority scoring entirely offline, coordinates doctor-confirmed dispatch, and relays telemetry via a resilient LoRa mesh network.
          </p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="panel rounded-md p-5 shadow-lg border-white/5">
          <h2 className="mb-3 text-xl font-black text-accent-cyan">The Problem</h2>
          <div className="space-y-3 text-sm leading-6 text-text-muted">
            <p>Schedule V tribal areas in Alluri Sitarama Raju district face acute doctor scarcity, rugged valley terrain, and monsoon road disruption.</p>
            <p><strong>Crisis Metrics:</strong> 1 doctor per 10,000+ population, &lt;23% reliable 4G coverage, and emergency response delays averaging 4–6 hours. The "Golden Hour" is often missed due to geography.</p>
          </div>
        </div>
        <div className="panel rounded-md p-5 shadow-lg border-white/5">
          <h2 className="mb-3 text-xl font-black text-accent-amber">Why SkyMed?</h2>
          <ul className="space-y-3 text-sm leading-6 text-text-muted">
            <li className="flex gap-2"><span>🔴</span> <span><strong>Offline-First:</strong> Works in valleys where 4G disappears.</span></li>
            <li className="flex gap-2"><span>🔴</span> <span><strong>ASHA-Anchored:</strong> Trusts the trusted local health link.</span></li>
            <li className="flex gap-2"><span>🔴</span> <span><strong>Human-in-the-Loop:</strong> No autonomous dispatch. Doctor confirmed only.</span></li>
            <li className="flex gap-2"><span>🔴</span> <span><strong>Rugged Tech:</strong> LoRa mesh store-and-forward ensures no case is lost.</span></li>
          </ul>
        </div>
      </section>

      <section className="panel rounded-md p-5 shadow-xl border-white/10">
        <h2 className="mb-4 text-xl font-black text-white">Three-Ring Architecture</h2>
        <div className="overflow-hidden rounded-lg bg-bg-primary/50 p-2">
          <ArchitectureDiagram />
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            { title: 'Layer 1: Drone Edge', body: 'Rugged tablet runs triage scoring offline. Telugu UI and Bluetooth vitals integration.', icon: Cpu, color: 'text-accent-red' },
            { title: 'Layer 2: Village Mesh', body: 'LoRa gateway nodes store and forward compact packets when connectivity is intermittent.', icon: Network, color: 'text-accent-amber' },
            { title: 'Layer 3: District Cloud', body: 'AMTZ Dashboard for doctor review, drone tracking, and state health analytics.', icon: Plane, color: 'text-accent-cyan' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-md border border-white/10 bg-bg-primary p-4 transition-transform hover:scale-[1.02]">
                <Icon className={`mb-3 h-6 w-6 ${item.color}`} />
                <div className="font-black text-white">{item.title}</div>
                <p className="mt-2 text-sm leading-6 text-text-muted">{item.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="panel rounded-md p-5 shadow-lg border-white/5">
          <h2 className="mb-3 text-xl font-black text-white">Responsible Innovation</h2>
          <div className="space-y-3 text-sm leading-6 text-text-muted">
            <p><strong>Triage, Not Diagnosis:</strong> AI assigns urgency priority only. All clinical decisions stay with registered practitioners per NMC guidelines.</p>
            <p><strong>Ethics by Design:</strong> DPDP Act 2023 aligned data minimization. No patient PII is broadcast over the LoRa mesh network.</p>
            <p><strong>Honest Disclosure:</strong> Current demo uses a visual-risk proxy for symptom photos until clinical pilot data validates a medical model.</p>
          </div>
        </div>
        <div className="panel rounded-md p-5 shadow-lg border-white/5">
          <h2 className="mb-3 text-xl font-black text-white">ASHA Tech Kit</h2>
          <div className="space-y-3 text-sm leading-6 text-text-muted">
            <p>We leverage India's greatest asset: 1 million ASHAs. No new building infrastructure required.</p>
            <p><strong>The Kit:</strong> Rugged Tablet + Solar Panel + BT Vitals (SpO2, BP, Temp) + LoRa Node. Budgeted at ₹35,000 per village vs ₹15 Lakh for a fixed booth.</p>
            <p><strong>Operation:</strong> Telugu voice-guided UI, single large-button workflow, and 48h power resilience for disaster scenarios.</p>
          </div>
        </div>
      </section>

      <section className="panel rounded-md p-5 shadow-xl border-white/10">
        <h2 className="mb-4 text-xl font-black text-white">Payload & Mission Constraints</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-text-muted">
              <tr>
                <th className="py-4">Constraint</th>
                <th className="py-4">Phase 1 Limit</th>
                <th className="py-4">Operational Rationale</th>
              </tr>
            </thead>
            <tbody className="text-text-muted">
              {[
                ['Payload Mass', '1.5 kg maximum', 'Optimized for small VTOL medical delivery envelope'],
                ['Range Scope', 'Phase 1 VLOS (<450m)', 'DGCA-aligned pilot scope with trained operators'],
                ['Wind Ceiling', '8 m/s maximum', 'Automated go/no-go dispatch safety validation'],
                ['Bio-Security', 'Inbound Only', 'No infectious biological samples outbound to prevent crash risk'],
                ['Thermal Profile', 'Heat-stable only', 'Cold-chain insulated pods deferred to Phase 2'],
                ['Authority', 'Doctor Confirmed', 'Strict human-in-the-loop; no autonomous dispatch ever'],
              ].map((row) => (
                <tr key={row[0]} className="border-b border-white/5 transition-colors hover:bg-white/5">
                  <td className="py-4 font-bold text-text-primary">{row[0]}</td>
                  <td className="py-4 text-accent-cyan">{row[1]}</td>
                  <td className="py-4 italic">{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="panel rounded-md p-5 shadow-lg border-white/5">
          <h2 className="mb-4 text-xl font-black text-white">Thematic Alignment</h2>
          <div className="space-y-4 text-sm text-text-muted">
            <div className="flex items-start gap-3">
              <div className="rounded bg-accent-cyan/10 p-1 text-accent-cyan"><Cpu size={16} /></div>
              <div><strong>AI & Electronics:</strong> Edge triage scoring on tablet with transparent visual-risk proxy.</div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded bg-accent-cyan/10 p-1 text-accent-cyan"><Plane size={16} /></div>
              <div><strong>Space Tech & Drones:</strong> VTOL coordination and software command layer.</div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded bg-accent-cyan/10 p-1 text-accent-cyan"><HeartHandshake size={16} /></div>
              <div><strong>Medicine & Biotech:</strong> ASHA-integrated care relay and doctor review workflow.</div>
            </div>
          </div>
        </div>
        <div className="panel rounded-md p-5 shadow-lg border-white/5">
          <h2 className="mb-4 text-xl font-black text-white">Roadmap</h2>
          <div className="space-y-3">
            {[
              ['Phase 1 (0-3mo)', 'Software simulation + AMTZ MoU discussion + Safety protocols'],
              ['Phase 2 (3-9mo)', 'VLOS pilot in Paderu block (3 villages, 3 drones)'],
              ['Phase 3 (9-18mo)', 'DGCA BVLOS exemption application + 13 tribal districts'],
              ['Phase 4 (18-36mo)', 'National replication model and NHA partnership integration'],
            ].map(([phase, detail]) => (
              <div key={phase} className="group rounded-md border border-white/10 bg-bg-primary p-3 transition-colors hover:border-accent-cyan/50">
                <div className="font-black text-accent-cyan uppercase text-xs tracking-widest">{phase}</div>
                <div className="mt-1 text-sm text-text-muted">{detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="mt-10 rounded-md border border-white/10 bg-bg-primary p-6 text-center">
        <div className="flex justify-center gap-2 mb-4">
          <ShieldCheck className="text-accent-cyan" />
          <span className="font-black">Amaravati Vigyan Puraskar Submission</span>
        </div>
        <p className="text-sm text-text-muted italic max-w-2xl mx-auto">
          "SkyMed does not replace the doctor. It ensures the doctor sees the right patient first — before the patient runs out of time."
        </p>
        <div className="mt-6 text-xs text-text-muted uppercase tracking-widest">
          Vivek Yarra · Vignan's LARA Institute · 2026
        </div>
      </footer>
    </div>
  );
}

