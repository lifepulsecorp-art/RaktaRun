import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  Search,
} from 'lucide-react';

interface Hospital {
  id: string;
  name: string;
  address: string;
  district: string;
  coordinates: { latitude: number; longitude: number };
  verificationStatus: 'verified' | 'pending' | 'rejected';
  bloodBankContact: {
    name: string;
    phone: string;
    email: string;
  };
  licenseNumber: string;
  registrationNumber: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

export const AdminHospitalsPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDistrict, setFilterDistrict] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/hospitals');
      setHospitals(res.data);
    } catch (err: any) {
      console.error('Failed to load hospitals:', err);
      setMessage({ type: 'error', text: 'Could not fetch hospitals from backend.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const handleVerify = async (id: string, newStatus: 'verified' | 'rejected') => {
    setActionInProgress(id);
    setMessage(null);
    try {
      await api.put(`/hospitals/${id}/verify`, { status: newStatus });
      setMessage({
        type: 'success',
        text: `Hospital status updated to "${newStatus}".`,
      });
      await fetchHospitals();
    } catch (err: any) {
      console.error('Verification error:', err);
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update hospital status.' });
    } finally {
      setActionInProgress(null);
    }
  };

  const filteredHospitals = hospitals.filter((h) => {
    const matchesDistrict = filterDistrict === 'All' || h.district === filterDistrict;
    const matchesStatus = filterStatus === 'All' || h.verificationStatus === filterStatus;
    const matchesSearch =
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDistrict && matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin')}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition"
              title="Back to Admin Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 font-bold text-white shadow-lg shadow-rose-600/30">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-none text-white">Hospital Accreditation Auditing</h1>
                <span className="text-xs text-rose-400 font-medium">Block F • LifePulse Medical Authority</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/admin/donors"
              className="rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              Go to Donor Verification (Block I) →
            </Link>
            <div className="text-right">
              <p className="text-xs font-medium text-white">{profile?.name || 'Administrator'}</p>
              <span className="text-xs text-emerald-400 font-medium">Live Audit Mode</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {message && (
          <div
            className={`mb-6 rounded-xl border p-4 text-sm flex items-center justify-between ${
              message.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="text-xs opacity-75 hover:opacity-100">
              Dismiss
            </button>
          </div>
        )}

        {/* Filters and Controls */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by hospital name, license, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none transition"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 focus:border-rose-500 focus:outline-none"
            >
              <option value="All">All Districts</option>
              <option value="Udupi">Udupi District</option>
              <option value="Dakshina Kannada">Dakshina Kannada</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 focus:border-rose-500 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="verified">Verified (Approved)</option>
              <option value="pending">Pending Audit</option>
              <option value="rejected">Rejected</option>
            </select>

            <button
              onClick={fetchHospitals}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
              title="Refresh records"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Hospitals Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-md">
          {loading && hospitals.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <RefreshCw className="mx-auto h-8 w-8 animate-spin text-rose-500" />
              <p className="mt-3 text-sm">Loading hospital accreditations...</p>
            </div>
          ) : filteredHospitals.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Building2 className="mx-auto h-12 w-12 text-slate-600" />
              <p className="mt-3 text-base font-semibold text-slate-300">No hospitals matched your filter</p>
              <p className="text-xs text-slate-500 mt-1">Try adjusting the district or search query</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-900/90 text-xs uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Hospital Details</th>
                    <th className="px-6 py-4">District & Location</th>
                    <th className="px-6 py-4">Licenses & Registration</th>
                    <th className="px-6 py-4">Blood Bank Contact</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-normal">
                  {filteredHospitals.map((h) => {
                    const isPending = h.verificationStatus === 'pending';
                    const isVerified = h.verificationStatus === 'verified';
                    const isUpdating = actionInProgress === h.id;

                    return (
                      <tr key={h.id} className="hover:bg-slate-800/30 transition">
                        {/* Name and ID */}
                        <td className="px-6 py-4">
                          <div className="font-bold text-white text-base">{h.name}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">ID: {h.id}</div>
                        </td>

                        {/* District & Location */}
                        <td className="px-6 py-4 text-xs">
                          <div className="flex items-center gap-1.5 font-medium text-slate-300">
                            <MapPin className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                            {h.district}
                          </div>
                          <div className="text-slate-400 mt-1 line-clamp-1 max-w-xs">{h.address}</div>
                          <div className="font-mono text-[10px] text-slate-500 mt-0.5">
                            {h.coordinates?.latitude.toFixed(4)}, {h.coordinates?.longitude.toFixed(4)}
                          </div>
                        </td>

                        {/* Licenses */}
                        <td className="px-6 py-4 text-xs">
                          <div>
                            <span className="text-slate-500">License:</span>{' '}
                            <span className="font-mono font-medium text-slate-200">{h.licenseNumber}</span>
                          </div>
                          <div className="mt-1">
                            <span className="text-slate-500">Reg:</span>{' '}
                            <span className="font-mono text-slate-400">{h.registrationNumber}</span>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-6 py-4 text-xs">
                          <div className="font-medium text-slate-200">{h.bloodBankContact?.name}</div>
                          <div className="flex items-center gap-1 text-slate-400 mt-0.5">
                            <Phone className="h-3 w-3 text-slate-500" /> {h.bloodBankContact?.phone}
                          </div>
                          <div className="flex items-center gap-1 text-slate-400 mt-0.5">
                            <Mail className="h-3 w-3 text-slate-500" /> {h.bloodBankContact?.email}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          {isVerified && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Accredited
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20 animate-pulse">
                              <Clock className="h-3.5 w-3.5" /> Pending Audit
                            </span>
                          )}
                          {h.verificationStatus === 'rejected' && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-400 border border-rose-500/20">
                              <XCircle className="h-3.5 w-3.5" /> Rejected
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isVerified ? (
                              <button
                                onClick={() => handleVerify(h.id, 'rejected')}
                                disabled={isUpdating}
                                className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 hover:text-white transition disabled:opacity-50"
                              >
                                Revoke Approval
                              </button>
                            ) : (
                              <button
                                onClick={() => handleVerify(h.id, 'verified')}
                                disabled={isUpdating}
                                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 transition disabled:opacity-50"
                              >
                                <ShieldCheck className="h-3.5 w-3.5" /> Approve Accreditation
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminHospitalsPage;

