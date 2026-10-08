import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Radio, ShieldCheck } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const field = 'mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-rose-500';

export default function EmergencyRequestPage() {
  const { roleData } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const hospitalId = roleData?.id;

  const refresh = async () => {
    if (!hospitalId) return;
    try { const { data } = await api.get(`/hospitals/${hospitalId}/requests`); setRequests(data); }
    catch (e: any) { setError(e.response?.data?.error || 'Could not load dispatches.'); }
  };
  useEffect(() => { refresh(); const timer = setInterval(refresh, 8000); return () => clearInterval(timer); }, [hospitalId]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    try {
      const { data } = await api.post(`/hospitals/${hospitalId}/requests`, {
        bloodGroup: form.get('bloodGroup'), component: form.get('component'), unitsRequired: Number(form.get('unitsRequired')),
        urgency: form.get('urgency'), radiusKm: Number(form.get('radiusKm')),
        requiredBy: new Date(Date.now() + Number(form.get('requiredInHours')) * 3600000).toISOString(),
        patientInfo: { ward: form.get('ward'), doctor: form.get('doctor') },
        contactPerson: roleData?.bloodBankContact,
      });
      await refresh();
      navigate(`/live-tracking/${data.request.id}`);
    } catch (e: any) { setError(e.response?.data?.error || 'Dispatch could not be created.'); }
    finally { setBusy(false); }
  };

  return <div className="min-h-screen bg-slate-950 text-slate-100">
    <header className="border-b border-slate-800 bg-slate-900/70 px-6 py-4"><div className="mx-auto flex max-w-5xl items-center gap-4">
      <Link to="/hospital" className="rounded-lg border border-slate-700 p-2 text-slate-300"><ArrowLeft className="h-4 w-4" /></Link>
      <div><h1 className="font-bold text-white">Emergency blood dispatch</h1><p className="text-xs text-slate-400">{roleData?.name || 'Hospital'} · verified donor network</p></div>
    </div></header>
    <main className="mx-auto grid max-w-5xl gap-6 px-6 py-8 lg:grid-cols-[1.1fr_.9fr]">
      <form onSubmit={submit} className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <div><h2 className="text-xl font-bold">Create an emergency request</h2><p className="mt-1 text-sm text-slate-400">Only verified, medically eligible donors are matched. The hospital confirms compatibility.</p></div>
        <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm text-slate-300">Recipient blood group<select name="bloodGroup" required className={field}>{['O-','O+','A-','A+','B-','B+','AB-','AB+'].map((g)=><option key={g}>{g}</option>)}</select></label>
          <label className="text-sm text-slate-300">Component<select name="component" className={field}><option value="whole_blood">Whole blood</option><option value="RBC">Red cells (RBC)</option><option value="platelets">Platelets</option><option value="plasma">Plasma</option></select></label>
          <label className="text-sm text-slate-300">Units required<input name="unitsRequired" type="number" min="1" max="10" defaultValue="1" required className={field}/></label>
          <label className="text-sm text-slate-300">Urgency<select name="urgency" className={field}><option value="critical">Critical trauma</option><option value="urgent">Urgent</option><option value="standard">Standard</option></select></label>
          <label className="text-sm text-slate-300">Initial radius<select name="radiusKm" className={field}><option value="10">10 km</option><option value="15">15 km</option><option value="25" selected>25 km</option><option value="50">50 km</option></select></label>
          <label className="text-sm text-slate-300">Needed within<input name="requiredInHours" type="number" min="1" max="72" defaultValue="4" className={field}/></label>
          <label className="text-sm text-slate-300">Ward / bed<input name="ward" placeholder="Trauma ICU" className={field}/></label>
          <label className="text-sm text-slate-300">Responsible doctor<input name="doctor" placeholder="On-duty clinician" className={field}/></label>
        </div>
        {error && <p role="alert" className="rounded-lg bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
        <div className="flex items-center gap-2 text-xs text-slate-400"><ShieldCheck className="h-4 w-4 text-emerald-400"/> Donor identity and live location are shared only after acceptance.</div>
        <button disabled={busy || !hospitalId} className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-3 font-semibold text-white hover:bg-rose-500 disabled:opacity-50"><Radio className="h-4 w-4"/>{busy ? 'Dispatching…' : 'Dispatch emergency alert'}</button>
      </form>
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6"><div className="flex items-center justify-between"><div><h2 className="text-lg font-bold">Recent dispatches</h2><p className="text-xs text-slate-400">Refreshes automatically</p></div><span className="text-sm text-slate-400">{requests.length} total</span></div>
        <div className="mt-5 space-y-3">{requests.length === 0 && <p className="text-sm text-slate-500">No requests yet.</p>}{requests.slice().reverse().map((r)=><Link key={r.id} to={`/live-tracking/${r.id}`} className="block rounded-xl border border-slate-800 bg-slate-950/60 p-4 hover:border-rose-500/50"><div className="flex justify-between"><b>{r.bloodGroup} · {r.unitsRequired} units</b><span className="text-xs uppercase text-rose-300">{r.status}</span></div><p className="mt-1 text-xs text-slate-400">{r.component.replace('_',' ')} · {r.radiusKm} km · {r.urgency}</p></Link>)}</div>
      </section>
    </main>
  </div>;
}
