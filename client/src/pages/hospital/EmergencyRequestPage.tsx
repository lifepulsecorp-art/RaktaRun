import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Radio, ShieldCheck, AlertCircle } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { AppLayout } from '../../components/AppLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

const field = 'mt-1.5 w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition shadow-sm';

export default function EmergencyRequestPage() {
  const { roleData } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const hospitalId = roleData?.id;

  const refresh = async () => {
    if (!hospitalId) return;
    try {
      const { data } = await api.get(`/hospitals/${hospitalId}/requests`);
      setRequests(data);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Could not load dispatches.');
    }
  };

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 8000);
    return () => clearInterval(timer);
  }, [hospitalId]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const { data } = await api.post(`/hospitals/${hospitalId}/requests`, {
        bloodGroup: form.get('bloodGroup'),
        component: form.get('component'),
        unitsRequired: Number(form.get('unitsRequired')),
        urgency: form.get('urgency'),
        radiusKm: Number(form.get('radiusKm')),
        requiredBy: new Date(Date.now() + Number(form.get('requiredInHours')) * 3600000).toISOString(),
        patientInfo: { ward: form.get('ward'), doctor: form.get('doctor') },
        contactPerson: roleData?.bloodBankContact,
      });
      await refresh();
      navigate(`/live-tracking/${data.request.id}`);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Dispatch could not be created.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppLayout
      title="Emergency Blood Dispatch"
      subtitle={`${roleData?.name || 'Hospital Authority'} • Verified Donor Coordination Network`}
      badge={<Badge variant="destructive">Code Red Dispatch</Badge>}
      withSidebar={true}
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <Card className="p-6 sm:p-7">
          <form onSubmit={submit} className="space-y-5">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Create an Emergency Request</h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Only verified, medically screened donors are matched based on ABO/Rh compatibility and proximity.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400">
                Recipient Blood Group
                <select name="bloodGroup" required className={field}>
                  {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400">
                Component Required
                <select name="component" className={field}>
                  <option value="whole_blood">Whole Blood</option>
                  <option value="RBC">Red Cells (RBC)</option>
                  <option value="platelets">Platelets</option>
                  <option value="plasma">Plasma</option>
                </select>
              </label>

              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400">
                Units Required
                <input name="unitsRequired" type="number" min="1" max="10" defaultValue="1" required className={field} />
              </label>

              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400">
                Urgency Level
                <select name="urgency" className={field}>
                  <option value="critical">Critical Trauma (Code Red)</option>
                  <option value="urgent">Urgent</option>
                  <option value="standard">Standard</option>
                </select>
              </label>

              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400">
                Initial Search Radius
                <select name="radiusKm" className={field} defaultValue="25">
                  <option value="10">10 km</option>
                  <option value="15">15 km</option>
                  <option value="25">25 km</option>
                  <option value="50">50 km</option>
                </select>
              </label>

              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400">
                Needed Within (Hours)
                <input name="requiredInHours" type="number" min="1" max="72" defaultValue="4" className={field} />
              </label>

              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400">
                Ward / Bed
                <input name="ward" placeholder="Trauma ICU, Bed 4" className={field} />
              </label>

              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400">
                Responsible Doctor
                <input name="doctor" placeholder="On-duty clinician" className={field} />
              </label>
            </div>

            {error && (
              <div role="alert" className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-3.5 text-sm text-rose-800 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Donor identity and live coordinates are shared securely only upon response acceptance.</span>
            </div>

            <Button
              type="submit"
              disabled={busy || !hospitalId}
              isLoading={busy}
              className="w-full py-3.5 text-sm font-bold shadow-lg shadow-rose-600/30 gap-2"
            >
              <Radio className="h-4 w-4" />
              {busy ? 'Dispatching Emergency Alerts…' : 'Dispatch Emergency Alert to Screened Donors'}
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Recent Dispatches</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Live sync every 8 seconds</p>
            </div>
            <Badge variant="outline">{requests.length} total</Badge>
          </div>

          <div className="mt-4 space-y-3">
            {requests.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-8">No recent emergency dispatches found.</p>
            )}
            {requests.slice().reverse().map((r) => (
              <Link
                key={r.id}
                to={`/live-tracking/${r.id}`}
                className="block rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4 hover:border-rose-500/50 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <b className="text-slate-900 dark:text-white text-sm">{r.bloodGroup} · {r.unitsRequired} units</b>
                  <Badge variant={r.status === 'fulfilled' ? 'success' : r.status === 'cancelled' ? 'outline' : 'destructive'} className="uppercase text-[10px]">
                    {r.status}
                  </Badge>
                </div>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
                  {r.component?.replace('_', ' ')} · {r.radiusKm} km search radius · <span className="capitalize">{r.urgency}</span>
                </p>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
