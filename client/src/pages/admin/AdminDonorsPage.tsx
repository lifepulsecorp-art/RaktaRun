import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import {
  Heart,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  FileText,
  Search,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { AppLayout } from '../../components/AppLayout';
import { Badge } from '../../components/ui/Badge';

interface Donor {
  id: string;
  fullName: string;
  phone: string;
  bloodGroup: string;
  rhType: string;
  bloodComponentEligibility: string[];
  hemoglobinLevel: number;
  weight: number;
  eligibilityStatus: 'pending' | 'eligible' | 'temporary_deferral' | 'permanent_deferral';
  deferralReason?: string | null;
  homeLocality: string;
  verification: {
    hospitalId: string;
    hospitalName: string;
    certificateId: string;
    verifiedAt: string;
    verifiedBy: string;
    certificateFileName?: string;
    expiryDate: string;
  };
}

export const AdminDonorsPage: React.FC = () => {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBloodGroup, setFilterBloodGroup] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchDonors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/donors');
      setDonors(res.data);
    } catch (err: any) {
      console.error('Error fetching donors:', err);
      setMessage({ type: 'error', text: 'Could not fetch donors from backend.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, []);

  const handleUpdateStatus = async (
    id: string,
    eligibilityStatus: 'pending' | 'eligible' | 'temporary_deferral' | 'permanent_deferral',
    deferralReason?: string
  ) => {
    setActionInProgress(id);
    setMessage(null);
    try {
      await api.put(`/donors/${id}/verify`, { eligibilityStatus, deferralReason });
      setMessage({
        type: 'success',
        text: `Donor eligibility updated to "${eligibilityStatus}".`,
      });
      await fetchDonors();
    } catch (err: any) {
      console.error('Update error:', err);
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update donor eligibility.' });
    } finally {
      setActionInProgress(null);
    }
  };

  const filteredDonors = donors.filter((d) => {
    const matchesGroup = filterBloodGroup === 'All' || d.bloodGroup === filterBloodGroup;
    const matchesStatus = filterStatus === 'All' || d.eligibilityStatus === filterStatus;
    const matchesSearch =
      d.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.phone.includes(searchQuery) ||
      d.homeLocality.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.verification?.certificateId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGroup && matchesStatus && matchesSearch;
  });

  const headerActions = (
    <div className="flex items-center gap-3">
      <Link
        to="/admin/hospitals"
        className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition shadow-sm"
      >
        Go to Hospital Accreditation (Block F) →
      </Link>
      <Badge variant="outline" className="border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
        Live Audit Mode
      </Badge>
    </div>
  );

  return (
    <AppLayout
      title="Donor Certificate Audit Portal"
      subtitle="LifePulse Medical Authority • Block I Medical Screening Verification"
      actions={headerActions}
      withSidebar={true}
    >
      <div className="space-y-6">
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
              placeholder="Search donor name, certificate ID, phone, or town..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none transition"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={filterBloodGroup}
              onChange={(e) => setFilterBloodGroup(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 focus:border-rose-500 focus:outline-none"
            >
              <option value="All">All Blood Groups</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 focus:border-rose-500 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="pending">Pending Verification</option>
              <option value="eligible">Eligible (Active)</option>
              <option value="temporary_deferral">Temporary Deferral</option>
              <option value="permanent_deferral">Permanent Deferral</option>
            </select>

            <button
              onClick={fetchDonors}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Donors Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-md">
          {loading && donors.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <RefreshCw className="mx-auto h-8 w-8 animate-spin text-rose-500" />
              <p className="mt-3 text-sm">Loading donor medical records...</p>
            </div>
          ) : filteredDonors.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Heart className="mx-auto h-12 w-12 text-slate-600" />
              <p className="mt-3 text-base font-semibold text-slate-300">No donor records matched</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-900/90 text-xs uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Donor & Group</th>
                    <th className="px-6 py-4">Vitals & Components</th>
                    <th className="px-6 py-4">Hospital Certificate</th>
                    <th className="px-6 py-4">Eligibility Status</th>
                    <th className="px-6 py-4 text-right">Admin Audit Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-normal">
                  {filteredDonors.map((d) => {
                    const isEligible = d.eligibilityStatus === 'eligible';
                    const isUpdating = actionInProgress === d.id;

                    return (
                      <tr key={d.id} className="hover:bg-slate-800/30 transition">
                        {/* Name and Group */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 font-black text-rose-400 text-sm">
                              {d.bloodGroup}
                            </span>
                            <div>
                              <div className="font-bold text-white text-base">{d.fullName}</div>
                              <div className="text-xs text-slate-400 mt-0.5">{d.phone} • {d.homeLocality}</div>
                            </div>
                          </div>
                        </td>

                        {/* Vitals */}
                        <td className="px-6 py-4 text-xs">
                          <div>
                            <span className="text-slate-400">Hb:</span>{' '}
                            <span className="font-semibold text-white">{d.hemoglobinLevel} g/dL</span>
                          </div>
                          <div className="mt-1">
                            <span className="text-slate-400">Weight:</span>{' '}
                            <span className="font-semibold text-white">{d.weight} kg</span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {d.bloodComponentEligibility?.map((c) => (
                              <span key={c} className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300 font-mono">
                                {c}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Certificate Details */}
                        <td className="px-6 py-4 text-xs">
                          <div className="font-mono font-bold text-white flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                            {d.verification?.certificateId}
                          </div>
                          <div className="text-slate-400 mt-1">{d.verification?.hospitalName}</div>
                          <div className="text-slate-500 text-[11px] mt-0.5">Screener: {d.verification?.verifiedBy}</div>
                          {d.verification?.certificateFileName && (
                            <a
                              href={`http://localhost:5000/certificates/${d.verification.certificateFileName}`}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300"
                            >
                              <ExternalLink className="h-3 w-3" /> View Certificate Document
                            </a>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          {isEligible ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Eligible for Alerts
                            </span>
                          ) : (
                            <div>
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20">
                                <Clock className="h-3.5 w-3.5" /> {d.eligibilityStatus.replace(/_/g, ' ')}
                              </span>
                              {d.deferralReason && (
                                <p className="text-[11px] text-slate-400 mt-1 max-w-xs">{d.deferralReason}</p>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Audit Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isEligible ? (
                              <button
                                onClick={() => handleUpdateStatus(d.id, 'temporary_deferral', 'Temporary health deferral')}
                                disabled={isUpdating}
                                className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition disabled:opacity-50"
                              >
                                Defer
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateStatus(d.id, 'eligible')}
                                disabled={isUpdating}
                                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 transition disabled:opacity-50"
                              >
                                <ShieldCheck className="h-3.5 w-3.5" /> Approve & Activate
                              </button>
                            )}

                            <button
                              onClick={() => handleUpdateStatus(d.id, 'permanent_deferral', 'Permanent deferral')}
                              disabled={isUpdating}
                              className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition disabled:opacity-50"
                              title="Disqualify"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
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
      </div>
    </AppLayout>
  );
};

export default AdminDonorsPage;

