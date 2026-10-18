import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, ShieldAlert, UserRoundX } from 'lucide-react';
import api from '../../utils/api';
import { AppLayout } from '../../components/AppLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

const categoryLabels: Record<string, string> = {
  certificate_unavailable: 'Certificate unavailable',
  identity_not_verified: 'Identity could not be verified',
  not_available: 'Person was not available',
  screening_concern: 'Screening concern',
  other: 'Other operational concern',
};

export default function AdminBuddyReportsPage() {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState('');

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/buddy-referrals');
      setReferrals(data.referrals || []);
    } catch (error: any) {
      setNotice(error.response?.data?.error || 'Could not load buddy reports.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadReports(); }, [loadReports]);

  const review = async (referralId: string, decision: 'dismissed' | 'confirmed' | 'delete_and_block') => {
    const promptText = decision === 'delete_and_block'
      ? 'Permanently remove this referrer account and block its email from creating another RaktaRun account?'
      : decision === 'confirmed'
        ? 'Confirm this concern and flag the referrer account for admin review?'
        : 'Dismiss this hospital report?';
    if (!window.confirm(promptText)) return;
    setBusyId(referralId);
    setNotice('');
    try {
      const { data } = await api.post(`/admin/buddy-referrals/${referralId}/review`, { decision });
      setNotice(data.message);
      await loadReports();
    } catch (error: any) {
      setNotice(error.response?.data?.error || 'Could not save the review decision.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <AppLayout title="Buddy invite reports" subtitle="Review hospital reports about no-signup donor interests.">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <p>Hospital reports are operational concerns, not proof of misconduct. Review each report before changing an account. Clinical details should stay with the hospital and must not be entered here.</p>
        </div>
        {notice && <p role="status" className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">{notice}</p>}
        {loading && <p className="py-8 text-center text-sm text-slate-500">Loading reports…</p>}
        {!loading && referrals.length === 0 && (
          <Card className="p-8 text-center text-sm text-slate-600 dark:text-slate-300">No hospital buddy reports are waiting for review.</Card>
        )}
        {referrals.map((referral) => {
          const reviewed = Boolean(referral.adminReview);
          const referrer = referral.referrer;
          return (
            <Card key={referral.id} className="space-y-4 p-4 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white">{categoryLabels[referral.hospitalReport?.category] || 'Hospital report'}</h2>
                  <p className="mt-1 text-xs text-slate-500">{referral.hospital?.name || 'Hospital'} · {new Date(referral.hospitalReport?.reportedAt || referral.createdAt).toLocaleString()}</p>
                </div>
                <Badge variant={reviewed ? (referral.adminReview.decision === 'confirmed' ? 'warning' : 'secondary') : 'destructive'}>
                  {reviewed ? referral.adminReview.decision : 'Needs review'}
                </Badge>
              </div>

              <div className="grid gap-3 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-950 sm:grid-cols-2">
                <p><span className="text-slate-500">Buddy visitor:</span> <strong>{referral.friendName}</strong> · {referral.friendPhone}</p>
                <p><span className="text-slate-500">Emergency:</span> {referral.request?.bloodGroup} at {referral.request?.hospitalName}</p>
                <p><span className="text-slate-500">Referrer:</span> {referrer ? `${referrer.name} · ${referrer.email}` : 'Account removed'}</p>
                <p><span className="text-slate-500">Account status:</span> {referrer?.trustStatus || (referrer ? 'clear' : 'removed')}</p>
              </div>

              {referral.hospitalReport?.notes && (
                <p className="rounded-lg border border-slate-200 p-3 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-300">Hospital note: {referral.hospitalReport.notes}</p>
              )}
              {referral.adminReview?.notes && (
                <p className="rounded-lg border border-slate-200 p-3 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-300">Admin decision: {referral.adminReview.notes}</p>
              )}

              {!reviewed && referrer && (
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Button size="sm" variant="secondary" loading={busyId === referral.id} onClick={() => review(referral.id, 'dismissed')}>
                    <CheckCircle2 className="h-4 w-4" /> Dismiss report
                  </Button>
                  <Button size="sm" variant="outline" loading={busyId === referral.id} onClick={() => review(referral.id, 'confirmed')}>
                    <AlertCircle className="h-4 w-4" /> Confirm concern and flag
                  </Button>
                  <Button size="sm" variant="destructive" loading={busyId === referral.id} onClick={() => review(referral.id, 'delete_and_block')}>
                    <UserRoundX className="h-4 w-4" /> Remove account and block email
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </AppLayout>
  );
}
