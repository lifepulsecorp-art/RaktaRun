import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  Phone,
  MapPin,
  X,
  FileQuestion,
  ShieldCheck,
  Info,
} from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const DEFAULT_HOSPITALS = [
  {
    id: 'hosp_manipal_01',
    name: 'Kasturba Hospital, Manipal',
    address: 'Tiger Circle, Madhav Nagar, Manipal, Karnataka 576104',
    district: 'Udupi',
    phone: '+918202922761',
    contactPerson: 'Dr. Anand Kumar (Blood Bank Officer)',
    timing: '24/7 Transfusion Medicine & Screening Desk',
  },
  {
    id: 'hosp_aj_02',
    name: 'AJ Hospital & Research Centre',
    address: 'Kuntikana, Mangaluru, Karnataka 575004',
    district: 'Dakshina Kannada',
    phone: '+918242225533',
    contactPerson: 'Dr. Pradeep Nayak (Blood Bank Department)',
    timing: '24/7 Blood Bank & Donor Health Station',
  },
  {
    id: 'hosp_udupi_dist_03',
    name: 'District Government Hospital, Udupi',
    address: 'Court Road, Udupi, Karnataka 576101',
    district: 'Udupi',
    phone: '+918202520555',
    contactPerson: 'Dr. Vasudeva K (District Blood Bank)',
    timing: '8:00 AM – 6:00 PM (Emergency Desk 24/7)',
  },
  {
    id: 'hosp_wenlock_04',
    name: 'Wenlock District Hospital, Mangaluru',
    address: 'Hampankatta, Mangaluru, Karnataka 575001',
    district: 'Dakshina Kannada',
    phone: '+918242423333',
    contactPerson: 'Blood Bank & Clinical Screening Unit',
    timing: '24/7 Government Blood Bank Service',
  },
];

export default function DonorRegisterPage() {
  const { role } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHospitalModal, setShowHospitalModal] = useState(false);
  const [hospitalList, setHospitalList] = useState<any[]>(DEFAULT_HOSPITALS);

  useEffect(() => {
    api.get('/hospitals')
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          const formatted = res.data.map((h: any) => ({
            id: h.id,
            name: h.name,
            address: h.address,
            district: h.district || 'Coastal Karnataka',
            phone: h.bloodBankContact?.phone || '+918202922761',
            contactPerson: h.bloodBankContact?.name ? `${h.bloodBankContact.name} (Blood Bank)` : 'Blood Bank Department',
            timing: '24/7 Transfusion Medicine & Screening Desk',
          }));
          setHospitalList(formatted);
        }
      })
      .catch(() => {
        // Fallback to DEFAULT_HOSPITALS
      });
  }, []);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    bloodGroup: 'O+',
    homeLocality: '',
    pincode: '',
    lastDonationDate: '',
    certificate: null as File | null,
  });
  const navigate = useNavigate();

  const update = (k: string, v: any) => setForm({ ...form, [k]: v });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Create account & local JWT on backend
      const regRes = await api.post('/auth/register', {
        email: form.email,
        password: form.password,
        role: 'donor',
        displayName: form.fullName,
      });

      if (regRes.data?.token) {
        localStorage.setItem('lifepulse_token', regRes.data.token);
      }

      await api.post('/donors/register', {
        fullName: form.fullName,
        phone: form.phone,
        bloodGroup: form.bloodGroup,
        homeLocality: form.homeLocality,
        pincode: form.pincode,
        lastDonationDate: form.lastDonationDate || undefined,
      });

      // 3. Upload certificate
      if (form.certificate) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(form.certificate!);
        });

        await api.post(`/donors/certificate`, {
          fileName: form.certificate.name,
          fileData: base64,
          mimeType: form.certificate.type,
        });
      }

      setStep(3);
      setTimeout(() => navigate('/donor/pending'), 2000);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (step === 3) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold mb-2">Registration Submitted</h1>
          <p className="text-slate-400">Redirecting to your pending verification screen…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <Link to={role === 'donor' ? '/donor' : '/register'} className="text-xs text-slate-500 hover:text-slate-300">← Back</Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3 mb-6 bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
          <div>
            <h1 className="text-2xl font-bold mb-1">Donor Registration</h1>
            <p className="text-xs text-slate-400">
              You must have a hospital-issued medical certificate to register.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowHospitalModal(true)}
            className="self-start sm:self-auto flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-3.5 py-2 text-xs font-bold text-rose-300 hover:text-white transition shadow-sm"
          >
            <FileQuestion className="h-4 w-4 text-rose-400" />
            <span>Don't have a certificate?</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-sm p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">FULL NAME</label>
              <input
                required
                value={form.fullName}
                onChange={(e) => update('fullName', e.target.value)}
                placeholder="Rahul Shetty"
                className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">PHONE</label>
              <input
                required
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="+919876543210"
                className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">EMAIL</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="donor@example.com"
                className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">PASSWORD (min 6)</label>
              <input
                required
                type="password"
                minLength={6}
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">BLOOD GROUP</label>
              <select
                value={form.bloodGroup}
                onChange={(e) => update('bloodGroup', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-sm text-white focus:border-red-500 focus:outline-none"
              >
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">LOCALITY</label>
              <input
                required
                value={form.homeLocality}
                onChange={(e) => update('homeLocality', e.target.value)}
                placeholder="Manipal"
                className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">PINCODE</label>
              <input
                required
                value={form.pincode}
                onChange={(e) => update('pincode', e.target.value)}
                placeholder="576104"
                className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">LAST DONATION DATE (optional)</label>
            <input
              type="date"
              value={form.lastDonationDate}
              onChange={(e) => update('lastDonationDate', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-sm text-white focus:border-red-500 focus:outline-none"
            />
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-rose-400" />
                HOSPITAL CERTIFICATE (PDF/JPG/PNG)
              </label>
              <button
                type="button"
                onClick={() => setShowHospitalModal(true)}
                className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 hover:underline"
              >
                <Building2 className="h-3.5 w-3.5" /> Don't have a certificate?
              </button>
            </div>
            <input
              required
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => update('certificate', e.target.files?.[0] || null)}
              className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-lg text-sm text-white file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-red-600 file:text-white file:text-xs file:font-semibold hover:file:bg-red-700 cursor-pointer"
            />
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500">Max size 5MB • Formats: PDF, JPG, PNG</span>
              <button
                type="button"
                onClick={() => setShowHospitalModal(true)}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-medium hover:underline flex items-center gap-1"
              >
                Find available hospitals to visit →
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 p-3 rounded-xl font-semibold transition mt-2 shadow-lg shadow-red-600/30"
          >
            {loading ? 'Creating account…' : 'Register as Donor'}
          </button>
        </form>
      </div>

      {/* Modal: Don't Have a Certificate */}
      {showHospitalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 my-8">
            <button
              type="button"
              onClick={() => setShowHospitalModal(false)}
              className="absolute top-5 right-5 rounded-xl border border-slate-800 bg-slate-950 p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-start gap-4 pr-10">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <span className="inline-block rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                  Medical Screening Requirement
                </span>
                <h2 className="text-xl font-bold text-white">How to Get Your Donor Medical Certificate</h2>
              </div>
            </div>

            {/* Instructional Note */}
            <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-slate-300 leading-relaxed space-y-2">
              <p className="font-semibold text-amber-300 flex items-center gap-1.5 text-sm">
                <Info className="h-4 w-4" /> Note for prospective donors:
              </p>
              <p>
                LifePulse is a medically screened network. To protect patient lives and ensure you are safe to donate, you must obtain a quick, authorized health screening before registering.
              </p>
              <div className="rounded-xl bg-slate-950/70 p-3.5 border border-slate-800/80 space-y-2 text-slate-300">
                <p className="font-bold text-white text-xs">Steps to join LifePulse:</p>
                <div className="space-y-1.5 pl-1">
                  <p>1. <strong>Visit any authorized hospital</strong> from the list below in Udupi or Dakshina Kannada.</p>
                  <p>2. Ask the Blood Bank or Transfusion Medicine Department for a <strong>Free Donor Health Screening & Medical Certificate</strong> (takes ~10–15 mins for vitals, hemoglobin & blood grouping).</p>
                  <p>3. <strong>Collect your certificate</strong> (digital copy or photo of the paper screening certificate).</p>
                  <p className="text-rose-400 font-bold">4. Come back to this portal, upload your certificate, and complete your registration to start saving lives!</p>
                </div>
              </div>
            </div>

            {/* List of Available Hospitals */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Authorized Partner Hospitals & Blood Banks ({hospitalList.length})
                </h3>
                <span className="text-[11px] text-slate-500">Udupi & Dakshina Kannada</span>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {hospitalList.map((hosp) => (
                  <div
                    key={hosp.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 hover:border-slate-700 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm">{hosp.name}</h4>
                          <span className="rounded-md bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                            {hosp.district}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400 flex items-start gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                          <span>{hosp.address}</span>
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400">
                          Contact: <span className="text-slate-300 font-medium">{hosp.contactPerson}</span> · {hosp.timing}
                        </p>
                      </div>

                      <a
                        href={`tel:${hosp.phone}`}
                        className="shrink-0 flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition"
                        title="Call hospital blood bank"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        <span>Call</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <Link
                to="/"
                className="text-xs text-slate-500 hover:text-slate-300 order-2 sm:order-1"
              >
                ← Return to LifePulse Home
              </Link>
              <button
                type="button"
                onClick={() => setShowHospitalModal(false)}
                className="w-full sm:w-auto rounded-xl bg-rose-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 transition order-1 sm:order-2"
              >
                Got it, I'll visit a hospital and come back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

