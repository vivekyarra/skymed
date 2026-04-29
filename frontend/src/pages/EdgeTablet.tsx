import { useState } from 'react';
import { Camera, RefreshCw, Save, Activity, Upload, CheckCircle2, Bluetooth } from 'lucide-react';
import { submitTriage } from '../api/client';
import type { OfflineQueuedCase } from '../types';

interface EdgeTabletProps {
  isOffline: boolean;
  queueCount: number;
  onQueueCase: (item: OfflineQueuedCase) => void;
}

export default function EdgeTablet({ isOffline, queueCount, onQueueCase }: EdgeTabletProps) {
  const [scanning, setScanning] = useState(false);
  const [vitals, setVitals] = useState({ spo2: '', hr: '', temp: '', sysBp: '', diaBp: '' });
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      // Simulate realistic tribal-field values
      setVitals({
        spo2: '94',
        hr: '110',
        temp: '101.2',
        sysBp: '90',
        diaBp: '60',
      });
      setScanning(false);
    }, 1500);
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();
    if (photo) formData.append('image', photo);
    else formData.append('image', new Blob([''], { type: 'image/jpeg' }), 'dummy.jpg');

    const vitalsData = {
      age: 45,
      sex: 'F',
      heart_rate: parseInt(vitals.hr || '0'),
      spo2: parseInt(vitals.spo2 || '0'),
      temperature_f: parseFloat(vitals.temp || '0'),
      systolic_bp: parseInt(vitals.sysBp || '0'),
      diastolic_bp: parseInt(vitals.diaBp || '0'),
      chief_complaint: 'fever',
      gps_lat: 18.2871,
      gps_lon: 82.8712,
      village_name: 'Paderu Hamlet',
      asha_id: 'ASHA-PAD-01',
      patient_name: 'Patient (Edge Mode)',
      asha_name: 'ASHA Worker',
    };
    formData.append('vitals', JSON.stringify(vitalsData));

    try {
      if (isOffline) {
        throw new Error('Offline mode simulation');
      }
      await submitTriage(formData);
      setSuccess(true);
    } catch (err) {
      // Fallback to offline queue
      onQueueCase({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        villageName: vitalsData.village_name,
        ashaId: vitalsData.asha_id,
        vitals: vitalsData,
        result: {
          case_id: crypto.randomUUID(),
          triage_score: 0,
          priority: 'P2',
          recommended_action: 'Pending sync',
          suggested_payload: [],
          drone_eta_min: null,
          vitals_flagged: [],
          timestamp: new Date().toISOString(),
          asha_id: vitalsData.asha_id,
          queuedOffline: true,
        }
      });
      setSuccess(true);
    } finally {
      setSubmitting(false);
      setTimeout(() => {
        setSuccess(false);
        setVitals({ spo2: '', hr: '', temp: '', sysBp: '', diaBp: '' });
        setPhoto(null);
      }, 3000);
    }
  };

  return (
    <div className="mx-auto max-w-lg overflow-hidden rounded-2xl border-4 border-gray-800 bg-gray-900 shadow-2xl">
      {/* Tablet Header */}
      <div className="flex items-center justify-between bg-black px-4 py-2 text-white">
        <div className="flex items-center gap-2 font-bold tracking-wider">
          <Activity className="h-5 w-5 text-green-500" />
          <span>SkyMed Field</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {isOffline ? (
            <span className="rounded bg-red-600 px-2 py-1 font-bold">OFFLINE (ఆఫ్‌లైన్)</span>
          ) : (
            <span className="rounded bg-green-600 px-2 py-1 font-bold">ONLINE (ఆన్‌లైన్)</span>
          )}
          {queueCount > 0 && (
            <span className="flex items-center gap-1 rounded bg-yellow-600 px-2 py-1 font-bold">
              <Upload className="h-3 w-3" /> {queueCount} Q
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <h2 className="mb-6 border-b border-gray-700 pb-2 text-2xl font-bold text-white">
          New Patient <span className="text-gray-400">/ కొత్త రోగి</span>
        </h2>

        {success ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="mb-4 h-20 w-20 text-green-500" />
            <h3 className="text-2xl font-bold text-white">Saved / సేవ్ చేయబడింది</h3>
            <p className="mt-2 text-gray-400">
              {isOffline ? 'Saved to local queue. Will sync when mesh returns.' : 'Successfully synced to district hub.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Vitals Section */}
            <div className="rounded-xl border border-gray-700 bg-gray-800 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">Vitals / ప్రాణాధారాలు</h3>
                <button
                  type="button"
                  onClick={handleScan}
                  disabled={scanning}
                  className="flex h-14 items-center gap-2 rounded-lg bg-blue-600 px-6 font-bold text-white hover:bg-blue-500 disabled:opacity-50"
                  style={{ minHeight: '64px' }}
                >
                  {scanning ? (
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  ) : (
                    <Bluetooth className="h-6 w-6" />
                  )}
                  {scanning ? 'Scanning...' : 'Auto Capture'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400">SpO2 (%)</label>
                  <input
                    type="number"
                    value={vitals.spo2}
                    onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                    className="mt-1 block h-14 w-full rounded-lg border-gray-600 bg-gray-700 px-4 text-xl text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400">HR (bpm)</label>
                  <input
                    type="number"
                    value={vitals.hr}
                    onChange={(e) => setVitals({ ...vitals, hr: e.target.value })}
                    className="mt-1 block h-14 w-full rounded-lg border-gray-600 bg-gray-700 px-4 text-xl text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400">Temp (°F)</label>
                  <input
                    type="number"
                    value={vitals.temp}
                    onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
                    className="mt-1 block h-14 w-full rounded-lg border-gray-600 bg-gray-700 px-4 text-xl text-white"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <div className="w-full">
                    <label className="block text-sm text-gray-400">Sys</label>
                    <input
                      type="number"
                      value={vitals.sysBp}
                      onChange={(e) => setVitals({ ...vitals, sysBp: e.target.value })}
                      className="mt-1 block h-14 w-full rounded-lg border-gray-600 bg-gray-700 px-2 text-xl text-white"
                      required
                    />
                  </div>
                  <div className="w-full">
                    <label className="block text-sm text-gray-400">Dia</label>
                    <input
                      type="number"
                      value={vitals.diaBp}
                      onChange={(e) => setVitals({ ...vitals, diaBp: e.target.value })}
                      className="mt-1 block h-14 w-full rounded-lg border-gray-600 bg-gray-700 px-2 text-xl text-white"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Photo Section */}
            <div className="rounded-xl border border-gray-700 bg-gray-800 p-5">
              <h3 className="mb-4 text-xl font-semibold text-white">Symptom Photo / ఫోటో</h3>
              <label className="flex min-h-[64px] w-full cursor-pointer items-center justify-center gap-3 rounded-lg border-2 border-dashed border-gray-500 bg-gray-700 py-4 hover:border-gray-400 hover:bg-gray-600">
                <Camera className="h-8 w-8 text-white" />
                <span className="text-lg font-bold text-white">
                  {photo ? photo.name : 'Take Photo (కెమెరా)'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoCapture}
                />
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-green-600 text-xl font-bold text-white hover:bg-green-500 disabled:opacity-50"
              style={{ minHeight: '80px' }}
            >
              {submitting ? (
                <RefreshCw className="h-8 w-8 animate-spin" />
              ) : (
                <Save className="h-8 w-8" />
              )}
              {submitting ? 'Processing...' : 'SAVE TRIAGE / సేవ్‌ చేయండి'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
