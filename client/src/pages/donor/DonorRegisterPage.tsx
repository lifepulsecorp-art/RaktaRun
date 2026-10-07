import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  Heart,
  Upload,
  ArrowLeft,
  ShieldCheck,
  FileText,
  User,
  Activity,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const DonorRegisterPage: React.FC = () => {
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+91');
  const [bloodGroup, setBloodGroup] = useState<'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'>('O+');
  const [components, setComponents] = useState<string[]>(['whole_blood', 'RBC']);
  const [hemoglobinLevel, setHemoglobinLevel] = useState<number>(14.0);
  const [weight, setWeight] = useState<number>(68);
  const [homeLocality, setHomeLocality] = useState('Manipal, Udupi');
  const [preferredRadius, setPreferredRadius] = useState<number>(15);

  // Certificate fields
  const [hospitalName, setHospitalName] = useState('Kasturba Hospital, Manipal');
  const [certificateId, setCertificateId] = useState(`LP-CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [verifiedBy, setVerifiedBy] = useState('Dr. Screening Officer');
  const [certificateFileName, setCertificateFileName] = useState<string>('');
  const [certificateFileBase64, setCertificateFileBase64] = useState<string>('');

  const toggleComponent = (comp: string) => {
    if (components.includes(comp)) {
      setComponents(components.filter((c) => c !== comp));
    } else {
      setComponents([...components, comp]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCertificateFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1] || result;
      setCertificateFileBase64(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const rhType = bloodGroup.includes('-') ? 'negative' : 'positive';

    const payload = {
      fullName,
      phone,
      bloodGroup,
      rhType,
      bloodComponentEligibility: components,
      hemoglobinLevel: Number(hemoglobinLevel),
      weight: Number(weight),
      homeLocality,
      preferredRadius: Number(preferredRadius),
      hospitalName,
      certificateId,
      verifiedBy,
      certificateFileName: certificateFileName || 'certificate.pdf',
      certificateFileBase64: certificateFileBase64 || btoa('Hospital Verified Screening Certificate Mock Content'),
    };

    try {
      await api.post('/donors', payload);
      await refreshProfile();
      navigate('/donor');
    } catch (err: any) {
      console.error('Registration error:', err);
      setErrorMessage(err.response?.data?.error || 'Failed to complete donor onboarding.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/donor')}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 font-bold text-white shadow-lg shadow-rose-600/30">
                <Heart className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-none text-white">Donor Verification & Onboarding</h1>
                <span className="text-xs text-rose-400 font-medium">Block H • Hospital Screened Network</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Form */}
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-6 w-6 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-base font-bold text-white">Medically Screened Network Only</h2>
              <p className="text-xs text-rose-200/80 mt-1">
                LifePulse is an emergency network reserved for hospital-verified donors. Please upload the digital screening certificate
                issued to you during your blood bank evaluation in Udupi or Dakshina Kannada.
              </p>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Donor Personal & Contact Details */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md shadow-xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
              <User className="h-4 w-4 text-rose-500" /> Donor Information
            </h2>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Full Name (as on Aadhaar) *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Shetty"
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-4 text-sm text-white focus:border-rose-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+919876543210"
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-4 text-sm text-white focus:border-rose-500 focus:outline-none transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Home Locality (Approximate) *
                </label>
                <input
                  type="text"
                  required
                  value={homeLocality}
                  onChange={(e) => setHomeLocality(e.target.value)}
                  placeholder="e.g. Manipal, Kadri, Brahmavar, Surathkal"
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-4 text-sm text-white focus:border-rose-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Emergency Travel Radius (km) *
                </label>
                <input
                  type="number"
                  required
                  value={preferredRadius}
                  onChange={(e) => setPreferredRadius(parseInt(e.target.value))}
                  min={5}
                  max={50}
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-4 text-sm text-white focus:border-rose-500 focus:outline-none transition font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Medical Typing & Eligibility */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md shadow-xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-rose-500" /> Medical Typing & Health Vitals
            </h2>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Blood Group *
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value as any)}
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-4 text-sm font-bold text-rose-400 focus:border-rose-500 focus:outline-none transition"
                >
                  <option value="O+">O Positive (O+)</option>
                  <option value="O-">O Negative (O-) [Universal]</option>
                  <option value="A+">A Positive (A+)</option>
                  <option value="A-">A Negative (A-)</option>
                  <option value="B+">B Positive (B+)</option>
                  <option value="B-">B Negative (B-)</option>
                  <option value="AB+">AB Positive (AB+)</option>
                  <option value="AB-">AB Negative (AB-)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Hemoglobin Level (g/dL) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={hemoglobinLevel}
                  onChange={(e) => setHemoglobinLevel(parseFloat(e.target.value))}
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-4 text-sm text-white focus:border-rose-500 focus:outline-none transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Weight (kg) *
                </label>
                <input
                  type="number"
                  required
                  value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value))}
                  min={45}
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-4 text-sm text-white focus:border-rose-500 focus:outline-none transition font-mono"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Screened Component Eligibility
                </label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: 'whole_blood', label: 'Whole Blood' },
                    { id: 'RBC', label: 'Red Blood Cells (RBC)' },
                    { id: 'platelets', label: 'Platelets (Single Donor)' },
                    { id: 'plasma', label: 'Plasma (FFP)' },
                  ].map((comp) => (
                    <button
                      type="button"
                      key={comp.id}
                      onClick={() => toggleComponent(comp.id)}
                      className={`rounded-xl px-4 py-2 text-xs font-semibold border transition ${
                        components.includes(comp.id)
                          ? 'border-rose-500 bg-rose-500/20 text-rose-300'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {components.includes(comp.id) && '✓ '}
                      {comp.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Hospital Certificate Verification Upload */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md shadow-xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
              <FileText className="h-4 w-4 text-rose-500" /> Hospital Digital Screening Certificate
            </h2>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Screening Hospital *
                </label>
                <input
                  type="text"
                  required
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  placeholder="Kasturba Hospital, Manipal"
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-4 text-sm text-white focus:border-rose-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Certificate Serial ID *
                </label>
                <input
                  type="text"
                  required
                  value={certificateId}
                  onChange={(e) => setCertificateId(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-4 text-sm text-white focus:border-rose-500 focus:outline-none transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Verified By Doctor *
                </label>
                <input
                  type="text"
                  required
                  value={verifiedBy}
                  onChange={(e) => setVerifiedBy(e.target.value)}
                  placeholder="Dr. Anand Kumar"
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-4 text-sm text-white focus:border-rose-500 focus:outline-none transition"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Upload Digital Certificate (PDF / Scanned Photo)
                </label>
                <div className="relative border-2 border-dashed border-slate-800 rounded-2xl p-6 text-center hover:border-rose-500/50 transition bg-slate-950/40">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.txt"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="mx-auto h-8 w-8 text-rose-500" />
                  {certificateFileName ? (
                    <p className="mt-2 text-sm font-semibold text-emerald-400">
                      Selected: {certificateFileName}
                    </p>
                  ) : (
                    <>
                      <p className="mt-2 text-sm font-medium text-slate-300">
                        Click or drag file here to attach certificate
                      </p>
                      <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG or TXT up to 5MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/donor')}
              className="rounded-xl border border-slate-800 bg-slate-900 px-6 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-rose-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 transition disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Submit for Verification
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default DonorRegisterPage;

