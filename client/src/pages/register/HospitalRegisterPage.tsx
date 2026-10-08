import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../utils/api';

export default function HospitalRegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    registrationNumber: '',
    address: '',
    locality: '',
    pincode: '',
    contactName: '',
    contactPhone: '',
    bloodBankName: '',
    bloodBankPhone: '',
    latitude: 13.3524,
    longitude: 74.7927,
  });
  const navigate = useNavigate();

  const update = (k: string, v: any) => setForm({ ...form, [k]: v });

  const setPreset = (lat: number, lng: number, locality: string) => {
    setForm((f) => ({ ...f, latitude: lat, longitude: lng, locality }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      const regRes = await api.post('/auth/register', {
        email: form.email,
        password: form.password,
        role: 'hospital',
        displayName: form.name,
      });

      if (regRes.data?.token) {
        localStorage.setItem('lifepulse_token', regRes.data.token);
      }

      await api.post('/hospitals/register', {
        name: form.name,
        registrationNumber: form.registrationNumber,
        address: form.address,
        locality: form.locality,
        pincode: form.pincode,
        contactPerson: { name: form.contactName, phone: form.contactPhone },
        bloodBankContact: { name: form.bloodBankName, phone: form.bloodBankPhone },
        location: { latitude: form.latitude, longitude: form.longitude },
      });

      setDone(true);
      setTimeout(() => navigate('/hospital/pending'), 2000);
    } catch (err: any) {
      console.error('Hospital registration error:', err);
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold mb-2">Hospital Submitted</h1>
          <p className="text-slate-400">Awaiting admin verification… Redirecting to pending screen.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <Link to="/register" className="text-xs text-slate-500 hover:text-slate-300">← Back</Link>
        <h1 className="text-2xl font-bold mt-2 mb-1">Hospital Registration</h1>
        <p className="text-sm text-slate-400 mb-6">
          Your hospital will be reviewed by a LifePulse administrator before being activated.
        </p>

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-sm p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">LOGIN EMAIL</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="hospital@lifepulse.in"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">HOSPITAL NAME</label>
              <input
                required
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Kasturba Hospital"
                className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">REGISTRATION / LICENSE #</label>
              <input
                required
                value={form.registrationNumber}
                onChange={(e) => update('registrationNumber', e.target.value)}
                placeholder="REG-KA-2026-904"
                className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">ADDRESS</label>
            <input
              required
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
              placeholder="Tiger Circle, Madhav Nagar"
              className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-sm text-white focus:border-red-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">LOCALITY</label>
              <input
                required
                value={form.locality}
                onChange={(e) => update('locality', e.target.value)}
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
            <label className="text-xs text-slate-400 block mb-2">LOCATION PRESET</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPreset(13.3524, 74.7927, 'Manipal')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 hover:text-white transition"
              >
                📍 Manipal
              </button>
              <button
                type="button"
                onClick={() => setPreset(12.9141, 74.8560, 'Mangaluru')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 hover:text-white transition"
              >
                📍 Mangaluru
              </button>
              <button
                type="button"
                onClick={() => setPreset(13.3409, 74.7421, 'Udupi')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 hover:text-white transition"
              >
                📍 Udupi
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">CONTACT PERSON</label>
              <input
                required
                value={form.contactName}
                onChange={(e) => update('contactName', e.target.value)}
                placeholder="Dr. Anand Kumar"
                className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">CONTACT PHONE</label>
              <input
                required
                value={form.contactPhone}
                onChange={(e) => update('contactPhone', e.target.value)}
                placeholder="+918202922761"
                className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">BLOOD BANK INCHARGE</label>
              <input
                required
                value={form.bloodBankName}
                onChange={(e) => update('bloodBankName', e.target.value)}
                placeholder="Dr. Ramesh Shenoy"
                className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">BLOOD BANK PHONE</label>
              <input
                required
                value={form.bloodBankPhone}
                onChange={(e) => update('bloodBankPhone', e.target.value)}
                placeholder="+918202922762"
                className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 p-3 rounded-xl font-semibold transition mt-2 shadow-lg shadow-red-600/30"
          >
            {loading ? 'Submitting…' : 'Register Hospital'}
          </button>
        </form>
      </div>
    </div>
  );
}

