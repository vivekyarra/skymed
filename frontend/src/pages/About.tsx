import { Cpu, HeartHandshake, Network, Plane, ShieldCheck, Users } from 'lucide-react';

function ArchitectureDiagram() {
  return (
    <svg viewBox="0 0 1200 800" className="w-full rounded-md border border-white/10 bg-bg-primary" role="img" aria-label="SkyMed three layer architecture">
      <rect width="1200" height="800" fill="#0a0f1e" />
      <circle cx="600" cy="400" r="305" fill="rgba(0,212,255,.08)" stroke="#00d4ff" strokeWidth="4" />
      <circle cx="600" cy="400" r="220" fill="rgba(255,179,0,.10)" stroke="#ffb300" strokeWidth="4" />
      <circle cx="600" cy="400" r="135" fill="rgba(255,23,68,.12)" stroke="#ff1744" strokeWidth="4" />

      <text x="600" y="108" textAnchor="middle" fill="#00d4ff" fontSize="30" fontWeight="900">DISTRICT CLOUD</text>
      <text x="600" y="156" textAnchor="middle" fill="#f9fafb" fontSize="20">AMTZ Doctor Dashboard | State Health Analytics | AES-256 Encrypted</text>

      <text x="600" y="225" textAnchor="middle" fill="#ffb300" fontSize="28" fontWeight="900">VILLAGE MESH</text>
      <text x="600" y="263" textAnchor="middle" fill="#f9fafb" fontSize="19">LoRa P2P | Store &amp; Forward | ASHA Worker Tech Kit</text>

      <text x="600" y="380" textAnchor="middle" fill="#ff1744" fontSize="27" fontWeight="900">DRONE EDGE</text>
      <text x="600" y="417" textAnchor="middle" fill="#f9fafb" fontSize="18">INT8 Triage Model | Offline First | Snapdragon NPU</text>

      <g fill="none" strokeLinecap="round" strokeWidth="4">
        <path d="M420 430 C300 500 300 615 460 662" stroke="#ffb300" markerEnd="url(#arrow)" />
        <path d="M740 660 C900 610 900 490 780 430" stroke="#00d4ff" markerEnd="url(#arrow)" />
        <path d="M465 265 C365 190 445 110 555 130" stroke="#00d4ff" markerEnd="url(#arrow)" />
        <path d="M735 130 C845 150 900 238 780 300" stroke="#ff1744" markerEnd="url(#arrow)" />
      </g>
      <defs>
        <marker id="arrow" markerWidth="12" markerHeight="12" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill="#f9fafb" />
        </marker>
      </defs>

      <g fill="#f9fafb" fontSize="16" fontWeight="700">
        <text x="170" y="565">Edge to Mesh: triage packet</text>
        <text x="790" y="575">Mesh to Cloud: batch sync</text>
        <text x="205" y="185">Cloud to Drone: doctor-confirmed command</text>
        <text x="805" y="220">Drone to Edge: landing pad payload delivery</text>
      </g>

      <g transform="translate(560 470)">
        <rect x="-42" y="-34" width="84" height="68" rx="10" fill="#111827" stroke="#ff1744" strokeWidth="4" />
        <circle cx="0" cy="0" r="12" fill="none" stroke="#00d4ff" strokeWidth="4" />
        <path d="M0 -21 V21 M-21 0 H21" stroke="#ff1744" strokeWidth="5" />
      </g>
      <g transform="translate(395 344)" fill="none" stroke="#ffb300" strokeWidth="5">
        <circle cx="0" cy="0" r="16" />
        <circle cx="-38" cy="44" r="12" />
        <circle cx="44" cy="48" r="12" />
        <path d="M-12 12 L-31 35 M13 12 L36 39 M-24 43 H32" />
      </g>
      <g transform="translate(780 325)" fill="none" stroke="#00d4ff" strokeWidth="5">
        <rect x="-36" y="-28" width="72" height="56" rx="8" />
        <path d="M-20 0 H20 M0 -17 V17" stroke="#ff1744" strokeWidth="6" />
      </g>
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
            It performs AI triage priority scoring, coordinates doctor-confirmed dispatch, and relays telemetry between ASHA workers and AMTZ doctors.
          </p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="panel rounded-md p-5">
          <h2 className="mb-3 text-xl font-black">The Problem</h2>
          <div className="space-y-3 text-sm leading-6 text-text-muted">
            <p>Schedule V tribal areas face doctor scarcity, valley terrain, monsoon road disruption, and long emergency response times.</p>
            <p>Planning assumptions for the pilot: one doctor per 10,000+ population in remote tribal service areas, average hospital distance of 47km in Alluri Sitarama Raju district, tribal maternal mortality risk around 2.3x the state average, and emergency response delays of 4-6 hours.</p>
          </div>
        </div>
        <div className="panel rounded-md p-5">
          <h2 className="mb-3 text-xl font-black">Why Existing Solutions Fail</h2>
          <ul className="space-y-3 text-sm leading-6 text-text-muted">
            <li>No all-weather road access for ambulances during monsoon disruptions.</li>
            <li>Valley terrain creates unreliable 4G coverage for cloud-only tools.</li>
            <li>Remote postings struggle to retain enough doctors near every village.</li>
            <li>Traditional drone software often assumes continuous cloud connectivity.</li>
          </ul>
        </div>
      </section>

      <section className="panel rounded-md p-5">
        <h2 className="mb-4 text-xl font-black">SkyMed Solution: Three-Layer Architecture</h2>
        <ArchitectureDiagram />
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            { title: 'Layer 1: Drone Edge', body: 'Tablet runs an INT8 quantized triage priority model offline.', icon: Cpu, color: 'text-accent-red' },
            { title: 'Layer 2: Village Mesh', body: 'LoRa mesh nodes store and forward structured packets without internet.', icon: Network, color: 'text-accent-amber' },
            { title: 'Layer 3: District Cloud', body: 'AMTZ doctors review telemetry and confirm dispatch decisions.', icon: Plane, color: 'text-accent-cyan' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-md border border-white/10 bg-bg-primary p-4">
                <Icon className={`mb-3 h-6 w-6 ${item.color}`} />
                <div className="font-black">{item.title}</div>
                <p className="mt-2 text-sm leading-6 text-text-muted">{item.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="panel rounded-md p-5">
          <h2 className="mb-3 text-xl font-black">Why Triage, Not Diagnosis</h2>
          <div className="space-y-3 text-sm leading-6 text-text-muted">
            <p>We do not replace doctors — we ensure doctors see the right patient first.</p>
            <p>AI assigns a priority score; the human doctor makes all clinical decisions and must confirm dispatch.</p>
            <p>The workflow is framed for NMC telemedicine guideline compatibility and DPDP Act 2023 aligned data handling: AES-256 encryption and no PII in mesh broadcast.</p>
          </div>
        </div>
        <div className="panel rounded-md p-5">
          <h2 className="mb-3 text-xl font-black">ASHA Worker Integration</h2>
          <div className="space-y-3 text-sm leading-6 text-text-muted">
            <p>We leverage India's greatest healthcare asset: 1 million ASHAs.</p>
            <p>Zero new building infrastructure required: rugged Android tablet, solar plus power-bank charging, Bluetooth vitals peripherals, LoRa mesh relay, and pre-cleared 3x3m landing pad.</p>
            <p>Telugu voice-guided UI, single large button workflow, and a 48h power resilience target for the ASHA Worker Tech Kit.</p>
          </div>
        </div>
      </section>

      <section className="panel rounded-md p-5">
        <h2 className="mb-4 text-xl font-black">Hardware Constraints</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-normal text-text-muted">
              <tr>
                <th className="py-3">Constraint</th>
                <th className="py-3">Phase 1 Limit</th>
                <th className="py-3">Rationale</th>
              </tr>
            </thead>
            <tbody className="text-text-muted">
              {[
                ['Payload', '1.5kg max', 'Small VTOL medical delivery mission envelope'],
                ['Range', 'VLOS under 450m from ASHA worker or trained operator', 'DGCA-aligned Phase 1 pilot scope'],
                ['Wind', '8 m/s maximum', 'Go/no-go dispatch safety rule'],
                ['Transport direction', 'Inbound therapeutics only', 'No infectious biological samples outbound'],
                ['Payload type', 'Heat-stable items only', 'Cold-chain pod deferred to Phase 2'],
                ['Operations', 'Phase 1 VLOS', 'BVLOS exemption application only after pilot evidence'],
              ].map((row) => (
                <tr key={row[0]} className="border-b border-white/5">
                  <td className="py-3 font-bold text-text-primary">{row[0]}</td>
                  <td className="py-3">{row[1]}</td>
                  <td className="py-3">{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="panel rounded-md p-5">
          <h2 className="mb-4 text-xl font-black">Thematic Alignment</h2>
          <div className="space-y-3 text-sm leading-6 text-text-muted">
            <div><span className="font-black text-accent-cyan">AI & Electronics:</span> Edge triage priority scoring model.</div>
            <div><span className="font-black text-accent-cyan">Space Tech & Drones:</span> VTOL coordination software.</div>
            <div><span className="font-black text-accent-cyan">Medicine & Biotechnology:</span> ASHA-integrated care relay.</div>
            <div>Honest scoping: SkyMed does not claim unrelated categories.</div>
          </div>
        </div>
        <div className="panel rounded-md p-5">
          <h2 className="mb-4 text-xl font-black">Roadmap</h2>
          <div className="space-y-3">
            {[
              ['Phase 1 (0-3mo)', 'Software simulation + AMTZ MoU discussion'],
              ['Phase 2 (3-9mo)', 'VLOS pilot, Paderu block, 3 villages, 3 drones'],
              ['Phase 3 (9-18mo)', 'DGCA BVLOS exemption application + 13 districts'],
              ['Phase 4 (18-36mo)', 'National replication, NHA partnership'],
            ].map(([phase, detail]) => (
              <div key={phase} className="rounded-md border border-white/10 bg-bg-primary p-3">
                <div className="font-black text-accent-cyan">{phase}</div>
                <div className="mt-1 text-sm text-text-muted">{detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel rounded-md p-5">
        <h2 className="mb-4 text-xl font-black">Team</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { role: 'Software Architecture', icon: ShieldCheck },
            { role: 'Clinical Workflow Review', icon: HeartHandshake },
            { role: 'ASHA Field Operations', icon: Users },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.role} className="rounded-md border border-white/10 bg-bg-primary p-4">
                <Icon className="mb-3 h-6 w-6 text-accent-cyan" />
                <div className="font-black">{item.role}</div>
                <div className="mt-1 text-sm text-text-muted">APSCHE NTD 2026 submission role</div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
