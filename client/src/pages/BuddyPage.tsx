import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, ArrowUpRight, CheckCircle2, Clock3, MapPin, Users } from 'lucide-react';
import api from '../utils/api';
import { AppLayout } from '../components/AppLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import LiveMap from '../components/LiveMap';

interface BuddyInfo {
  request: { id: string; bloodGroup: string; component: string; urgency: string; requiredBy: string; status: string };
  hospital: { id: string; name: string; address: string; coordinates: { latitude: number; longitude: number } };
  expiresAt: string;
}

export default function BuddyPage() {
  const { token = '' } = useParams();
  const [info, setInfo] = useState<BuddyInfo | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get(`/buddies/${token}`)
      .then(({ data }) => setInfo(data))
      .catch((err: any) => setError(err.response?.data?.error || 'This buddy link is not available.'));
  }, [token]);

  const submitInterest = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post(`/buddies/${token}/interest`, { name, phone, consent });
      setMessage(data.message);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not send your details to the hospital.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppLayout withSidebar={false} title="A friend invited you to help">
      <div className="mx-auto max-w-3xl space-y-5">
        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {info && (
          <>
            <Card className="space-y-4 p-5 sm:p-7">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                  <Users className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">Community buddy invite</p>
                  <h2 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">A nearby hospital needs {info.request.bloodGroup} blood.</h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{info.hospital.name}{info.hospital.address ? ` · ${info.hospital.address}` : ''}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Invite expires {new Date(info.expiresAt).toLocaleString()}</p>
                </div>
              </div>

              {!submitted ? (
                <form onSubmit={submitInterest} className="space-y-4 border-t border-slate-200 pt-4 dark:border-slate-800">
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Share your name and phone number so hospital staff can confirm the need and next steps. You do not need to create an account.
                  </p>
                  <label className="block space-y-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Your name
                    <input required minLength={2} maxLength={80} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
                  </label>
                  <label className="block space-y-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Phone number
                    <input required inputMode="tel" autoComplete="tel" type="tel" pattern="[0-9+() -]{10,16}" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="10-digit phone number" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
                  </label>
                  <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                    <input required type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-amber-600" />
                    <span>I agree that this hospital may contact me about this request. My details will be shared with the hospital team for this purpose.</span>
                  </label>
                  <Button type="submit" loading={busy} className="w-full sm:w-auto">Share my interest</Button>
                </form>
              ) : (
                <div role="status" className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs leading-5 text-amber-950 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>This invite is not a medical clearance or donation confirmation. Hospital staff must verify availability, identity, and eligibility before any donation.</span>
              </div>
            </Card>

            {submitted && (
              <Card className="space-y-4 p-4 sm:p-6">
                <div>
                  <h2 className="flex items-center gap-2 font-bold text-slate-900 dark:text-white"><MapPin className="h-5 w-5 text-rose-600" /> Hospital location</h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Please wait for the hospital to confirm that they still need a donor before you travel.</p>
                </div>
                <LiveMap hospital={info.hospital.coordinates} donors={[]} />
                <a
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white hover:bg-rose-700 sm:w-auto"
                  href={`https://www.google.com/maps/dir/?api=1&destination=${info.hospital.coordinates.latitude},${info.hospital.coordinates.longitude}&travelmode=driving`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MapPin className="h-4 w-4" /> Directions to hospital <ArrowUpRight className="h-4 w-4" />
                </a>
              </Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
