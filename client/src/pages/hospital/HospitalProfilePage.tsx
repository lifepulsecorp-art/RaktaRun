import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Save,
  ShieldCheck,
  Phone,
  FileText,
  AlertCircle,
} from 'lucide-react';

export const HospitalProfilePage: React.FC = () => {
  const { profile, roleData, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [hospitalId, setHospitalId] = useState<string>('');
  const [name, setName] = useState('');
  const [district, setDistrict] = useState<'Udupi' | 'Dakshina Kannada'>('Udupi');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number>(13.3535);
  const [longitude, setLongitude] = useState<number>(74.7865);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'verified' | 'pending' | 'rejected'>('pending');

  useEffect(() => {
    // Populate with existing hospital profile if present
    if (roleData) {
      setHospitalId(roleData.id || '');
      setName(roleData.name || '');
      setDistrict(roleData.district || 'Udupi');
      setAddress(roleData.address || '');
      setLatitude(roleData.coordinates?.latitude || 13.3535);
      setLongitude(roleData.coordinates?.longitude || 74.7865);
      setContactName(roleData.bloodBankContact?.name || '');
      setContactPhone(roleData.bloodBankContact?.phone || '');
      setContactEmail(roleData.bloodBankContact?.email || '');
      setLicenseNumber(roleData.licenseNumber || '');
      setRegistrationNumber(roleData.registrationNumber || '');
      setVerificationStatus(roleData.verificationStatus || 'pending');
    }
  }, [roleData]);

  const handlePresetLocation = (preset: 'manipal' | 'mangaluru' | 'udupi') => {
    if (preset === 'manipal') {
      setDistrict('Udupi');
      setLatitude(13.3535);
      setLongitude(74.7865);
    } else if (preset === 'mangaluru') {
      setDistrict('Dakshina Kannada');
      setLatitude(12.8988);
      setLongitude(74.8562);
    } else {
      setDistrict('Udupi');
      setLatitude(13.3409);
      setLongitude(74.7421);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const payload = {
      name,
      district,
      address,
      coordinates: {
        latitude: Number(latitude),
        longitude: Number(longitude),
      },
      bloodBankContact: {
        name: contactName,
        phone: contactPhone,
        email: contactEmail,
      },
      licenseNumber,
      registrationNumber,
    };

    try {
      if (hospitalId) {
        // Update existing hospital
        await api.put(`/hospitals/${hospitalId}`, payload);
        setSuccessMessage('Hospital profile updated successfully!');
      } else {
        // Create new hospital profile
        const res = await api.post('/hospitals', payload);
        setHospitalId(res.data.id);
        // Sync user role record
        await api.post('/auth/sync', { hospitalId: res.data.id, role: 'hospital' });
        setSuccessMessage('Hospital registered! Pending verification by LifePulse Admin.');
      }
      await refreshProfile();
    } catch (err: any) {
      console.error('Error saving hospital profile:', err);
      setErrorMessage(err.response?.data?.error || 'Failed to save hospital profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/hospital')}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition"
              title="Back to Hospital Portal"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 font-bold text-white shadow-lg shadow-rose-600/30">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-none text-white">Hospital Medical Profile</h1>
                <span className="text-xs text-rose-400 font-medium">Block G • Facility & Blood Bank Accreditation</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400">Signed in as:</span>
            <p className="text-xs font-semibold text-white">{profile?.email}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Accreditation Status Banner */}
        <div className="mb-8">
          {verificationStatus === 'verified' ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 backdrop-blur-md flex items-start gap-4">
              <ShieldCheck className="h-7 w-7 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-emerald-200">Accredited Emergency Medical Center</h3>
                <p className="text-xs text-emerald-300/80 mt-1">
                  This facility is officially authorized by LifePulse Medical Authority. You have permission to dispatch
                  instant blood emergency alerts to verified donors in Udupi & Dakshina Kannada.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 backdrop-blur-md flex items-start gap-4">
              <Clock className="h-7 w-7 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-amber-200">Verification In Progress</h3>
                <p className="text-xs text-amber-300/80 mt-1">
                  Your blood bank accreditation is pending review by the LifePulse District Admin. Please ensure all licensing
                  and emergency contact information below is complete.
                </p>
              </div>
            </div>
          )}
        </div>

        {successMessage && (
          <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Profile Setup Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Facility Information */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md shadow-xl">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-rose-500" /> Facility & Location Details
            </h2>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Hospital Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kasturba Hospital, Manipal"
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-4 text-sm text-white focus:border-rose-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  District *
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value as any)}
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-4 text-sm text-white focus:border-rose-500 focus:outline-none transition"
                >
                  <option value="Udupi">Udupi District</option>
                  <option value="Dakshina Kannada">Dakshina Kannada District</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Quick Coordinate Presets
                </label>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handlePresetLocation('manipal')}
                    className="flex-1 rounded-xl border border-slate-800 bg-slate-950 py-2 text-xs font-medium text-slate-300 hover:border-rose-500 transition"
                  >
                    Manipal
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetLocation('mangaluru')}
                    className="flex-1 rounded-xl border border-slate-800 bg-slate-950 py-2 text-xs font-medium text-slate-300 hover:border-rose-500 transition"
                  >
                    Mangaluru
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetLocation('udupi')}
                    className="flex-1 rounded-xl border border-slate-800 bg-slate-950 py-2 text-xs font-medium text-slate-300 hover:border-rose-500 transition"
                  >
                    Udupi City
                  </button>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Physical Address *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Tiger Circle, Madhav Nagar, Manipal, Karnataka 576104"
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-4 text-sm text-white focus:border-rose-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  GPS Latitude *
                </label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value))}
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-4 text-sm text-white focus:border-rose-500 focus:outline-none transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  GPS Longitude *
                </label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value))}
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-4 text-sm text-white focus:border-rose-500 focus:outline-none transition font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Blood Bank Accreditation & Licensing */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md shadow-xl">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-rose-500" /> Accreditation & Licensing
            </h2>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Blood Bank License Number *
                </label>
                <input
                  type="text"
                  required
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="e.g. KA-BB-UDP-042"
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-4 text-sm text-white focus:border-rose-500 focus:outline-none transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Hospital Registration Number *
                </label>
                <input
                  type="text"
                  required
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="e.g. REG-KH-1953"
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-4 text-sm text-white focus:border-rose-500 focus:outline-none transition font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Blood Bank Contact Person */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md shadow-xl">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Phone className="h-5 w-5 text-rose-500" /> Blood Bank Emergency Officer
            </h2>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Officer / Doctor Name *
                </label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Dr. Anand Kumar"
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-4 text-sm text-white focus:border-rose-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Emergency Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+918202922761"
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-4 text-sm text-white focus:border-rose-500 focus:outline-none transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Official Blood Bank Email *
                </label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="bloodbank@manipal.edu"
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-4 text-sm text-white focus:border-rose-500 focus:outline-none transition"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/hospital')}
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
                  <Save className="h-4 w-4" /> Save Hospital Profile
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default HospitalProfilePage;

