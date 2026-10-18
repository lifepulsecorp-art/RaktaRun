import { useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, KeyRound, MailCheck } from 'lucide-react';
import { api } from '../utils/api';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface EmailOtpVerificationProps {
  email: string;
  onVerified: (token: string) => Promise<void>;
  onBack: () => void;
}

export default function EmailOtpVerification({ email, onVerified, onBack }: EmailOtpVerificationProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verifiedToken, setVerifiedToken] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const busyRef = useRef(false);

  const continueAfterVerification = async (token: string) => {
    setError('');
    setLoading(true);
    try {
      await onVerified(token);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Email verified, but account setup could not finish. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (value: string) => {
    if (busyRef.current || value.length !== 6) return;
    busyRef.current = true;
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/verify-otp', { email, code: value });
      const token = response.data?.token;
      if (!token) throw new Error('Verification succeeded, but the sign-in token was missing.');
      setVerifiedToken(token);
      await continueAfterVerification(token);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Could not verify the code.');
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setResending(true);
    setError('');
    setNotice('');
    try {
      const response = await api.post('/auth/register/resend-otp', { email });
      setNotice(response.data?.message || 'A new verification code was sent.');
      setCode('');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Could not resend the code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-lg p-6 shadow-xl sm:p-8">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
        {verifiedToken ? <CheckCircle2 className="h-6 w-6" /> : <MailCheck className="h-6 w-6" />}
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        {verifiedToken ? 'Email verified' : 'Check your email'}
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
        {verifiedToken
          ? 'Your email address is verified. Continue to finish your account setup.'
          : <>Enter the 6-digit code sent to <strong className="break-all">{email}</strong>. The code expires in 10 minutes.</>}
      </p>

      {!verifiedToken && (
        <form className="mt-6 space-y-4" onSubmit={(event) => { event.preventDefault(); void verifyCode(code); }}>
          <label htmlFor="email-verification-code" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Verification code
          </label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="email-verification-code"
              autoFocus
              required
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(event) => {
                const nextCode = event.currentTarget.value.replace(/\D/g, '').slice(0, 6);
                setCode(nextCode);
                if (nextCode.length === 6) void verifyCode(nextCode);
              }}
              placeholder="000000"
              aria-label="6-digit email verification code"
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-center font-mono text-xl font-bold tracking-[0.45em] text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <Button type="submit" disabled={loading || code.length !== 6} isLoading={loading} className="w-full py-3">
            Verify email
          </Button>
        </form>
      )}

      {error && (
        <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {notice && <p role="status" className="mt-4 text-sm text-emerald-700 dark:text-emerald-300">{notice}</p>}

      {verifiedToken ? (
        <Button type="button" disabled={loading} isLoading={loading} onClick={() => void continueAfterVerification(verifiedToken)} className="mt-5 w-full py-3">
          Continue account setup
        </Button>
      ) : (
        <div className="mt-5 flex flex-col items-center justify-between gap-3 text-sm sm:flex-row">
          <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Edit registration details
          </button>
          <button type="button" disabled={resending} onClick={() => void resendCode()} className="font-semibold text-rose-700 hover:underline disabled:opacity-50 dark:text-rose-300">
            {resending ? 'Sending…' : 'Resend code'}
          </button>
        </div>
      )}
    </Card>
  );
}
