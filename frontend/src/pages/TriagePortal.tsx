import { ChangeEvent, DragEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  BatteryCharging,
  Camera,
  Check,
  ChevronRight,
  CircleAlert,
  CloudOff,
  HeartPulse,
  Loader2,
  MapPin,
  PackageCheck,
  Plane,
  Thermometer,
  UploadCloud,
  UserRound,
} from 'lucide-react';
import { RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { dispatchDrone, fetchVillages, submitTriage } from '../api/client';
import type { ChiefComplaint, OfflineQueuedCase, PayloadItem, TriageResponse, Village, VitalFlag } from '../types';

const payloadWeights: Record<PayloadItem, number> = {
  epipen_2pack: 0.18,
  ors_sachets: 0.25,
  wound_dressing_kit: 0.35,
  malaria_dengue_test_kit: 0.12,
  glucagon_kit: 0.22,
  glucose_strips_kit: 0.08,
};

const payloadLabels: Record<PayloadItem, string> = {
  epipen_2pack: 'EpiPen 2-pack',
  ors_sachets: 'ORS sachets x10',
  wound_dressing_kit: 'Wound dressing kit',
  malaria_dengue_test_kit: 'Rapid malaria/dengue test kit',
  glucagon_kit: 'Glucagon emergency kit',
  glucose_strips_kit: 'Blood glucose strips kit',
};

const complaintOptions: Array<{ value: ChiefComplaint; label: string }> = [
  { value: 'snakebite', label: 'పాము కాటు (Snakebite)' },
  { value: 'trauma_injury', label: 'గాయం (Trauma injury)' },
  { value: 'high_fever', label: 'అధిక జ్వరం (High fever)' },
  { value: 'pregnancy_complication', label: 'గర్భధారణ సమస్య (Pregnancy complication)' },
  { value: 'respiratory_distress', label: 'శ్వాస ఇబ్బంది (Respiratory distress)' },
  { value: 'suspected_cardiac', label: 'గుండె సమస్య అనుమానం (Suspected cardiac)' },
  { value: 'severe_diarrhea', label: 'తీవ్ర విరేచనాలు (Severe diarrhea)' },
  { value: 'unknown', label: 'తెలియదు (Unknown)' },
];

const defaultVillages: Village[] = [
  { village_name: 'Araku', lat: 18.3273, lon: 82.8763 },
  { village_name: 'Paderu', lat: 18.0677, lon: 82.6547 },
  { village_name: 'Hukumpeta', lat: 18.1875, lon: 82.7055 },
  { village_name: 'Munchingput', lat: 18.2386, lon: 82.6978 },
  { village_name: 'Dumbriguda', lat: 18.2264, lon: 82.9915 },
  { village_name: 'Ananthagiri', lat: 18.2446, lon: 83.0051 },
  { village_name: 'Koyyuru', lat: 17.6651, lon: 82.2027 },
  { village_name: 'Chintoor', lat: 17.7484, lon: 81.3995 },
  { village_name: 'Kunavaram', lat: 17.5914, lon: 81.2582 },
  { village_name: 'Lambasingi', lat: 17.9156, lon: 82.6234 },
  { village_name: 'Chintapalle', lat: 17.8234, lon: 81.9876 },
  { village_name: 'GK Veedhi', lat: 17.5432, lon: 81.7654 },
  { village_name: 'Maredumilli', lat: 17.5876, lon: 81.8432 },
  { village_name: 'Rampachodavaram', lat: 17.4321, lon: 81.789 },
  { village_name: 'Addateegala', lat: 17.4821, lon: 81.9785 },
  { village_name: 'Y. Ramavaram', lat: 17.6134, lon: 81.9245 },
  { village_name: 'Devipatnam', lat: 17.3312, lon: 81.6647 },
  { village_name: 'Gangavaram', lat: 17.6228, lon: 81.9062 },
  { village_name: 'Rajavommangi', lat: 17.5847, lon: 82.1413 },
  { village_name: 'Seethampeta', lat: 18.6155, lon: 83.9406 },
];

type FormState = {
  village_name: string;
  asha_id: string;
  spo2: number;
  heart_rate: number;
  temperature_f: number;
  systolic_bp: number;
  diastolic_bp: number;
  chief_complaint: ChiefComplaint;
  age: number;
  sex: 'Male' | 'Female' | 'Other';
  gps_lat: number;
  gps_lon: number;
};

const initialForm: FormState = {
  village_name: 'Paderu',
  asha_id: 'ASHA-1001',
  spo2: 88,
  heart_rate: 132,
  temperature_f: 100.2,
  systolic_bp: 84,
  diastolic_bp: 58,
  chief_complaint: 'snakebite',
  age: 34,
  sex: 'Female',
  gps_lat: 18.0677,
  gps_lon: 82.6547,
};

function scoreLocally(form: FormState, visualBoost = 16): TriageResponse {
  let score = 0;
  const flags: VitalFlag[] = [];
  const addFlag = (vital: string, value: number | string, severity: VitalFlag['severity'], points: number, reason: string) => {
    flags.push({ vital, value, severity, points, reason });
    score += points;
  };

  if (form.spo2 < 85) addFlag('SpO2', form.spo2, 'critical', 45, 'SpO2 below 85%');
  else if (form.spo2 < 90) addFlag('SpO2', form.spo2, 'high', 30, 'SpO2 between 85-90%');
  else if (form.spo2 < 95) addFlag('SpO2', form.spo2, 'moderate', 15, 'SpO2 between 90-95%');

  if (form.heart_rate > 140 || form.heart_rate < 40) addFlag('Heart Rate', form.heart_rate, 'critical', 35, 'Heart rate outside 40-140 bpm');
  else if ((form.heart_rate >= 120 && form.heart_rate <= 140) || (form.heart_rate >= 40 && form.heart_rate <= 50)) {
    addFlag('Heart Rate', form.heart_rate, 'high', 20, 'Heart rate in warning range');
  }

  if (form.temperature_f > 104) addFlag('Temperature', form.temperature_f, 'critical', 25, 'Temperature above 104F');
  else if (form.temperature_f >= 103) addFlag('Temperature', form.temperature_f, 'high', 15, 'Temperature between 103-104F');

  if (form.systolic_bp < 70) addFlag('Systolic BP', form.systolic_bp, 'critical', 40, 'Systolic BP below 70 mmHg');
  else if (form.systolic_bp < 90) addFlag('Systolic BP', form.systolic_bp, 'high', 20, 'Systolic BP between 70-90 mmHg');

  if (form.chief_complaint === 'snakebite' || form.chief_complaint === 'pregnancy_complication') {
    addFlag('Chief Complaint', form.chief_complaint, 'high', 20, 'High-risk complaint bonus');
  }

  const visualPoints = Math.min(25, visualBoost);
  score += visualPoints;
  if (visualPoints >= 10) {
    flags.push({
      vital: 'Visual Risk Proxy',
      value: visualPoints,
      severity: visualPoints >= 18 ? 'high' : 'moderate',
      points: visualPoints,
      reason: 'Local visual cue proxy; not diagnostic',
    });
  }

  score = Math.min(100, score);
  const priority = score >= 70 ? 'P1' : score >= 40 ? 'P2' : 'P3';
  const suggestedPayload: PayloadItem[] =
    priority === 'P3'
      ? []
      : form.chief_complaint === 'high_fever'
        ? ['malaria_dengue_test_kit', 'ors_sachets']
        : form.chief_complaint === 'trauma_injury'
          ? ['wound_dressing_kit', 'glucose_strips_kit']
          : form.chief_complaint === 'respiratory_distress'
            ? ['epipen_2pack', 'glucose_strips_kit']
            : form.chief_complaint === 'severe_diarrhea'
              ? ['ors_sachets', 'glucose_strips_kit']
              : ['wound_dressing_kit', 'ors_sachets'];

  return {
    case_id: `LOCAL-${crypto.randomUUID()}`,
    triage_score: score,
    priority,
    recommended_action:
      priority === 'P1'
        ? 'Immediate AMTZ doctor alert queued locally; dispatch requires doctor confirmation when mesh sync restores.'
        : priority === 'P2'
          ? 'Doctor telemedicine review within 30 minutes; packet queued locally.'
          : 'Schedule ASHA follow-up and sync when connectivity restores.',
    suggested_payload: suggestedPayload,
    drone_eta_min: priority === 'P1' ? 18 : null,
    vitals_flagged: flags,
    visual_assessment: {
      severity_score: visualPoints,
      visual_features: {
        mean_brightness: 118,
        contrast_std_dev: 39,
        red_channel_dominance: 32,
        image_entropy: 5.8,
        onnx_inference: 'offline_local_proxy',
        model_mode: 'visual_risk_proxy',
        calibration_status: 'not clinically validated',
      },
      model_note:
        'Demo build: no validated wound severity classifier is bundled. Visual input contributes only a transparent risk-cue score; priority remains vitals-first and doctor-reviewed.',
    },
    timestamp: new Date().toISOString(),
    asha_id: form.asha_id,
    queuedOffline: true,
  };
}

function vitalTone(vital: keyof Pick<FormState, 'spo2' | 'heart_rate' | 'temperature_f' | 'systolic_bp'>, value: number) {
  if (vital === 'spo2') return value < 90 ? 'border-accent-red text-accent-red' : value < 95 ? 'border-accent-amber text-accent-amber' : 'border-accent-green text-accent-green';
  if (vital === 'heart_rate') return value > 140 || value < 40 ? 'border-accent-red text-accent-red' : value >= 120 || value <= 50 ? 'border-accent-amber text-accent-amber' : 'border-accent-green text-accent-green';
  if (vital === 'temperature_f') return value > 104 ? 'border-accent-red text-accent-red' : value >= 103 ? 'border-accent-amber text-accent-amber' : 'border-accent-green text-accent-green';
  return value < 70 ? 'border-accent-red text-accent-red' : value < 90 ? 'border-accent-amber text-accent-amber' : 'border-accent-green text-accent-green';
}

export default function TriagePortal({
  isOffline,
  queueCount,
  onQueueCase,
  onNavigate,
}: {
  isOffline: boolean;
  queueCount: number;
  onQueueCase: (item: OfflineQueuedCase) => void;
  onNavigate?: (page: 'fleet') => void;
}) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [villages, setVillages] = useState<Village[]>(defaultVillages);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TriageResponse | null>(null);
  const [doctorConfirmed, setDoctorConfirmed] = useState(false);
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [selectedPayload, setSelectedPayload] = useState<PayloadItem[]>([]);
  const [missionId, setMissionId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOffline) return;
    fetchVillages().then(setVillages).catch(() => setVillages(defaultVillages));
  }, [isOffline]);

  useEffect(() => {
    if (result) setSelectedPayload(result.suggested_payload);
  }, [result]);

  const selectedVillage = villages.find((item) => item.village_name === form.village_name) ?? villages[0];
  const payloadWeight = useMemo(() => selectedPayload.reduce((sum, item) => sum + payloadWeights[item], 0), [selectedPayload]);
  const payloadTone = payloadWeight > 1.5 ? 'bg-accent-red' : payloadWeight >= 1.2 ? 'bg-accent-amber' : 'bg-accent-green';

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const applyVillage = (villageName: string) => {
    const village = villages.find((item) => item.village_name === villageName);
    setForm((current) => ({
      ...current,
      village_name: villageName,
      gps_lat: village?.lat ?? current.gps_lat,
      gps_lon: village?.lon ?? current.gps_lon,
    }));
  };

  const handleImage = (file: File | null) => {
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    handleImage(event.dataTransfer.files.item(0));
  };

  const useLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation unavailable on this device.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        update('gps_lat', Number(position.coords.latitude.toFixed(6)));
        update('gps_lon', Number(position.coords.longitude.toFixed(6)));
        toast.success('GPS coordinate captured.');
      },
      () => toast.error('Unable to capture GPS. Using selected landing pad coordinate.'),
      { enableHighAccuracy: true, timeout: 5000 },
    );
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!imageFile && !isOffline) {
      toast.error('Upload or capture a symptom image before triage.');
      return;
    }

    setLoading(true);
    setMissionId(null);
    try {
      if (isOffline) {
        await new Promise((resolve) => window.setTimeout(resolve, 850));
        const localResult = scoreLocally(form, imageFile ? 18 : 12);
        setResult(localResult);
        onQueueCase({
          id: localResult.case_id,
          createdAt: localResult.timestamp,
          villageName: form.village_name,
          ashaId: form.asha_id,
          vitals: form,
          result: localResult,
        });
        return;
      }

      const formData = new FormData();
      formData.append('image', imageFile as File);
      formData.append('vitals', JSON.stringify(form));
      const response = await submitTriage(formData);
      setResult(response);
      toast.success(`Triage complete: ${response.priority} score ${response.triage_score}`);
    } catch {
      toast.error('Triage submission failed.');
    } finally {
      setLoading(false);
    }
  };

  const confirmDispatch = async () => {
    if (!result) return;
    if (!doctorConfirmed) {
      toast.error('Doctor confirmation is required before dispatch.');
      return;
    }
    if (payloadWeight > 1.5) {
      toast.error('Payload exceeds 1.5kg mission limit.');
      return;
    }
    if (isOffline || result.queuedOffline) {
      toast.error('Dispatch command requires district hub connectivity.');
      return;
    }

    try {
      const response = await dispatchDrone({
        case_id: result.case_id,
        drone_id: 'VTOL-01',
        destination_lat: form.gps_lat,
        destination_lon: form.gps_lon,
        payload_manifest: selectedPayload,
        doctor_confirmed: doctorConfirmed,
      });
      if (!response.go_nogo) {
        toast.error(response.rejection_reason ?? 'Mission rejected by go/no-go check.');
        return;
      }
      setMissionId(response.mission_id);
      setDispatchOpen(false);
      toast.success(`Mission ${response.mission_id} active. ETA ${response.estimated_flight_time_min} min.`);
    } catch {
      toast.error('Dispatch failed.');
    }
  };

  const priorityColor = result?.priority === 'P1' ? '#ff1744' : result?.priority === 'P2' ? '#ffb300' : '#00e676';
  const visualAssessment = result?.visual_assessment;
  const visualMode = visualAssessment?.visual_features.model_mode ?? 'visual_risk_proxy';
  const calibrationStatus = visualAssessment?.visual_features.calibration_status ?? 'not clinically validated';

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(420px,0.86fr)_minmax(360px,0.64fr)]">
      <form onSubmit={submit} className={`panel rounded-md p-4 ${isOffline ? 'border-accent-amber/40 shadow-amber' : ''}`}>
        <div className="mb-5 flex flex-col gap-3 border-b border-white/10 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-black">ASHA Triage Portal</h1>
            <p className="text-sm font-semibold text-accent-cyan">ట్రయేజ్ పోర్టల్</p>
          </div>
          <div className={`rounded-md border px-3 py-2 text-sm ${isOffline ? 'border-accent-amber/50 bg-accent-amber/10 text-accent-amber' : 'border-accent-green/40 bg-accent-green/5 text-accent-green'}`}>
            {isOffline ? <CloudOff className="mr-2 inline h-4 w-4" /> : <Check className="mr-2 inline h-4 w-4" />}
            {isOffline ? `Local Edge Mode | Sync Queue: ${queueCount} Pending` : 'Online | District hub reachable'}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <label
              onDrop={handleDrop}
              onDragOver={(event) => event.preventDefault()}
              className="flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-accent-cyan/40 bg-bg-primary p-4 text-center transition hover:border-accent-cyan"
            >
              {preview ? (
                <img src={preview} alt="Uploaded symptom preview" className="max-h-56 w-full rounded-md object-cover" />
              ) : (
                <>
                  <Camera className="mb-3 h-10 w-10 text-accent-cyan" />
                  <div className="font-bold">Upload symptom photo for visual cues</div>
                  <div className="mt-1 text-sm text-text-muted">Drag-drop image or tap to open camera roll</div>
                </>
              )}
              <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => handleImage(event.target.files?.item(0) ?? null)} />
            </label>
          </div>

          <div>
            <label className="label">Village landing pad</label>
            <select className="input-field" value={form.village_name} onChange={(event) => applyVillage(event.target.value)}>
              {villages.map((village) => (
                <option key={village.village_name}>{village.village_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">ASHA ID</label>
            <input className="input-field" value={form.asha_id} onChange={(event) => update('asha_id', event.target.value)} />
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[
            { key: 'spo2', label: 'SpO2 (%)', icon: HeartPulse, min: 60, max: 100, value: form.spo2 },
            { key: 'heart_rate', label: 'Heart Rate (bpm)', icon: HeartPulse, min: 30, max: 180, value: form.heart_rate },
            { key: 'temperature_f', label: 'Temperature (°F)', icon: Thermometer, min: 95, max: 107, value: form.temperature_f, step: 0.1 },
            { key: 'systolic_bp', label: 'Systolic BP (mmHg)', icon: ActivityIcon, min: 50, max: 220, value: form.systolic_bp },
            { key: 'diastolic_bp', label: 'Diastolic BP (mmHg)', icon: ActivityIcon, min: 30, max: 140, value: form.diastolic_bp },
          ].map((item) => {
            const Icon = item.icon;
            const tone = item.key === 'diastolic_bp' ? 'border-white/10 text-text-primary' : vitalTone(item.key as keyof Pick<FormState, 'spo2' | 'heart_rate' | 'temperature_f' | 'systolic_bp'>, Number(item.value));
            return (
              <div key={item.key} className={`rounded-md border bg-bg-primary p-3 ${tone}`}>
                <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-normal">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </label>
                <input
                  type="number"
                  min={item.min}
                  max={item.max}
                  step={item.step ?? 1}
                  value={item.value}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => update(item.key as keyof FormState, Number(event.target.value) as never)}
                  className="w-full bg-transparent text-2xl font-black outline-none"
                />
              </div>
            );
          })}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div>
            <label className="label">Chief complaint</label>
            <select className="input-field" value={form.chief_complaint} onChange={(event) => update('chief_complaint', event.target.value as ChiefComplaint)}>
              {complaintOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-[1fr_1.4fr] gap-3">
            <div>
              <label className="label">Age</label>
              <input type="number" min={0} max={110} className="input-field" value={form.age} onChange={(event) => update('age', Number(event.target.value))} />
            </div>
            <div>
              <label className="label">Sex</label>
              <div className="grid grid-cols-3 rounded-md border border-white/10 bg-bg-primary p-1">
                {(['Male', 'Female', 'Other'] as const).map((sex) => (
                  <button
                    key={sex}
                    type="button"
                    onClick={() => update('sex', sex)}
                    className={`rounded px-2 py-2 text-xs font-bold transition ${form.sex === sex ? 'bg-accent-cyan text-bg-primary' : 'text-text-muted hover:text-text-primary'}`}
                  >
                    {sex}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-md border border-white/10 bg-bg-primary p-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 font-bold">
                <MapPin className="h-4 w-4 text-accent-cyan" />
                GPS landing coordinate
              </div>
              <div className="mt-1 text-sm text-text-muted">
                {selectedVillage?.village_name}: {form.gps_lat.toFixed(5)}, {form.gps_lon.toFixed(5)}
              </div>
            </div>
            <button type="button" onClick={useLocation} className="rounded-md border border-accent-cyan/40 px-3 py-2 text-sm font-bold text-accent-cyan transition hover:bg-accent-cyan/10">
              Use My Location
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-accent-cyan px-5 py-4 text-sm font-black uppercase tracking-normal text-bg-primary transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
          Analyze & Triage
        </button>
      </form>

      <section className="panel min-h-[640px] rounded-md p-4">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid h-full min-h-[560px] place-items-center text-center"
            >
              <div>
                <CircleAlert className="mx-auto mb-4 h-14 w-14 text-accent-cyan" />
                <h2 className="text-xl font-black">Awaiting ASHA submission</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-text-muted">
                  The tablet scores triage locally first; online mode sends the structured packet to the district hub.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={result.case_id}
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between rounded-md border border-white/10 bg-bg-primary p-4">
                <div>
                  <div className="text-sm text-text-muted">Priority</div>
                  <div className={`text-6xl font-black ${result.priority === 'P1' ? 'animate-pulse text-accent-red' : result.priority === 'P2' ? 'text-accent-amber' : 'text-accent-green'}`}>
                    {result.priority}
                  </div>
                </div>
                <div className="h-36 w-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart innerRadius="72%" outerRadius="100%" data={[{ name: 'Score', value: result.triage_score, fill: priorityColor }]} startAngle={90} endAngle={-270}>
                      <RadialBar dataKey="value" cornerRadius={4} background={{ fill: '#1f2937' }} />
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#f9fafb" fontSize={28} fontWeight={900}>
                        {result.triage_score}
                      </text>
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {result.queuedOffline && (
                <div className="rounded-md border border-accent-amber/40 bg-accent-amber/10 p-3 text-sm text-accent-amber">
                  <CloudOff className="mr-2 inline h-4 w-4" />
                  Packet stored locally. Sync Queue: {queueCount} Pending.
                </div>
              )}

              <div className="rounded-md border border-white/10 bg-bg-primary p-4">
                <h3 className="mb-3 font-black">Vitals Review</h3>
                <div className="space-y-2">
                  {[
                    ['SpO2', `${form.spo2}%`],
                    ['Heart Rate', `${form.heart_rate} bpm`],
                    ['Temperature', `${form.temperature_f} °F`],
                    ['Systolic BP', `${form.systolic_bp} mmHg`],
                    ['Diastolic BP', `${form.diastolic_bp} mmHg`],
                  ].map(([label, value]) => {
                    const flag = result.vitals_flagged.find((item) => item.vital === label);
                    return (
                      <div key={label} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded border border-white/5 px-3 py-2 text-sm">
                        <span className="text-text-muted">{label}</span>
                        <span className="font-bold">{value}</span>
                        <span className={flag?.severity === 'critical' ? 'text-accent-red' : flag ? 'text-accent-amber' : 'text-accent-green'}>
                          {flag?.severity === 'critical' ? '🔴' : flag ? '⚠' : '✓'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {visualAssessment && (
                <div className="rounded-md border border-accent-amber/30 bg-accent-amber/10 p-4">
                  <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <h3 className="font-black text-accent-amber">Visual Cue Source</h3>
                    <span className="rounded border border-accent-amber/40 px-2 py-1 text-xs font-bold uppercase tracking-normal text-accent-amber">
                      {String(visualMode)}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-text-muted">{visualAssessment.model_note}</p>
                  <div className="mt-3 grid gap-2 text-xs text-text-muted md:grid-cols-2">
                    <div>Visual contribution: {visualAssessment.severity_score}/25 triage points</div>
                    <div>Calibration: {String(calibrationStatus)}</div>
                  </div>
                </div>
              )}

              <div className="rounded-md border border-white/10 bg-bg-primary p-4">
                <h3 className="mb-2 font-black">Recommended Action</h3>
                <p className="text-sm leading-6 text-text-muted">{result.recommended_action}</p>
              </div>

              {result.priority === 'P1' && (
                <div className="rounded-md border border-accent-red/30 bg-accent-red/10 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-black text-accent-red">Drone ETA</div>
                      <div className="text-sm text-text-muted">Doctor-confirmed dispatch to ASHA landing pad</div>
                    </div>
                    <div className="text-3xl font-black">{result.drone_eta_min ?? 18}m</div>
                  </div>
                </div>
              )}

              <div className="rounded-md border border-white/10 bg-bg-primary p-4">
                <h3 className="mb-3 font-black">Suggested Payload</h3>
                <div className="flex flex-wrap gap-2">
                  {result.suggested_payload.length ? (
                    result.suggested_payload.map((item) => (
                      <span key={item} className="badge border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan">
                        {payloadLabels[item]} | {payloadWeights[item].toFixed(2)}kg
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-text-muted">No drone payload recommended for P3.</span>
                  )}
                </div>
              </div>

              <div className="rounded-md border border-white/10 bg-bg-primary p-4">
                <label className="flex cursor-pointer items-center justify-between gap-3">
                  <span>
                    <span className="block font-black">Doctor Confirmed</span>
                    <span className="text-sm text-text-muted">No autonomous dispatch. Human review is mandatory.</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setDoctorConfirmed((value) => !value)}
                    className={`relative h-7 w-12 rounded-full transition ${doctorConfirmed ? 'bg-accent-green' : 'bg-white/15'}`}
                  >
                    <span className={`absolute top-1 h-5 w-5 rounded-full bg-bg-primary transition ${doctorConfirmed ? 'left-6' : 'left-1'}`} />
                  </button>
                </label>
              </div>

              {result.priority === 'P1' && (
                <button
                  type="button"
                  disabled={!doctorConfirmed || isOffline || result.queuedOffline}
                  onClick={() => setDispatchOpen(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-accent-red px-5 py-4 text-sm font-black uppercase tracking-normal text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-text-muted"
                >
                  <Plane className="h-5 w-5" />
                  Dispatch Drone
                </button>
              )}

              {missionId && (
                <div className="rounded-md border border-accent-green/40 bg-accent-green/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-black text-accent-green">Mission Active</div>
                      <div className="text-sm text-text-muted">{missionId}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate?.('fleet')}
                      className="flex items-center gap-1 rounded-md border border-accent-green/40 px-3 py-2 text-sm font-bold text-accent-green"
                    >
                      Drone Fleet <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <AnimatePresence>
        {dispatchOpen && result && (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-bg-primary/80 p-4 backdrop-blur" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0.94, y: 18 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 12 }} className="w-full max-w-2xl rounded-md border border-accent-cyan/40 bg-surface p-5 shadow-glow">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black">Confirm Dispatch Payload</h2>
                  <p className="text-sm text-text-muted">Max payload 1.5kg. Heat-stable inbound therapeutics only.</p>
                </div>
                <button type="button" onClick={() => setDispatchOpen(false)} className="rounded-md border border-white/10 px-3 py-2 text-sm text-text-muted">
                  Close
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {(Object.keys(payloadWeights) as PayloadItem[]).map((item) => (
                  <label key={item} className="flex cursor-pointer items-center justify-between rounded-md border border-white/10 bg-bg-primary p-3">
                    <span>
                      <span className="block font-bold">{payloadLabels[item]}</span>
                      <span className="text-sm text-text-muted">{payloadWeights[item].toFixed(2)}kg</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={selectedPayload.includes(item)}
                      onChange={() =>
                        setSelectedPayload((current) =>
                          current.includes(item) ? current.filter((value) => value !== item) : [...current, item],
                        )
                      }
                      className="h-5 w-5 accent-[#00d4ff]"
                    />
                  </label>
                ))}
              </div>

              <div className="mt-5 rounded-md border border-white/10 bg-bg-primary p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-bold">Payload weight</span>
                  <span className={payloadWeight > 1.5 ? 'text-accent-red' : payloadWeight >= 1.2 ? 'text-accent-amber' : 'text-accent-green'}>
                    {payloadWeight.toFixed(2)}kg / 1.50kg
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full rounded-full ${payloadTone}`} style={{ width: `${Math.min(100, (payloadWeight / 1.5) * 100)}%` }} />
                </div>
              </div>

              <button
                type="button"
                disabled={payloadWeight > 1.5 || selectedPayload.length === 0}
                onClick={() => void confirmDispatch()}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-accent-cyan px-5 py-4 text-sm font-black uppercase tracking-normal text-bg-primary transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <PackageCheck className="h-5 w-5" />
                Confirm Dispatch
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActivityIcon({ className }: { className?: string }) {
  return <BatteryCharging className={className} />;
}
