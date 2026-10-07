import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../../config/firebase';
import { api } from '../../utils/api';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function DonorRegisterPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
      // 1. Create Firebase Auth account
      await createUserWithEmailAndPassword(auth, form.email, form.password);

      // 2. Create user + donor records on backend
      await api.post('/auth/register', { role: 'donor', displayName: form.fullName });

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
        <Link to="/register" className="text-xs text-slate-500 hover:text-slate-300">← Back</Link>
        <h1 className="text-2xl font-bold mt-2 mb-1">Donor Registration</h1>
        <p className="text-sm text-slate-400 mb-6">
          You must have a hospital-issued medical certificate to register.
        </p>

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

          <div>
            <label className="text-xs text-slate-400 block mb-1">HOSPITAL CERTIFICATE (PDF/JPG/PNG)</label>
            <input
              required
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => update('certificate', e.target.files?.[0] || null)}
              className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-sm text-white file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-red-600 file:text-white file:text-xs file:font-semibold hover:file:bg-red-700 cursor-pointer"
            />
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
    </div>
  );
}

