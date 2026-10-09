import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HeartPulse, Lock, Mail, ShieldAlert, ArrowRight, Activity } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { login, role, firebaseUser, loading } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect immediately to the correct portal
  useEffect(() => {
    if (!loading && firebaseUser && role) {
      if (role === 'admin') navigate('/admin', { replace: true });
      else if (role === 'hospital') navigate('/hospital', { replace: true });
      else if (role === 'donor') navigate('/donor', { replace: true });
    }
  }, [firebaseUser, role, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const userProfile = await login(email, password);
      const targetRole = userProfile?.role;

      if (targetRole === 'admin') {
        navigate('/admin', { replace: true });
      } else if (targetRole === 'hospital') {
        navigate('/hospital', { replace: true });
      } else {
        navigate('/donor', { replace: true });
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPassword?: string) => {
    setEmail(demoEmail);
    if (demoPassword) {
      setPassword(demoPassword);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      {/* Left Column: Branding / Mission */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between border-r border-slate-900 bg-gradient-to-b from-slate-950 via-slate-900 to-rose-950/40 p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-600 font-extrabold text-white shadow-xl shadow-rose-600/40">
            <HeartPulse className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">LifePulse</h1>
            <p className="text-xs text-rose-400 font-medium">Udupi & Dakshina Kannada Emergency Response</p>
          </div>
        </div>

        <div className="max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1 text-xs font-semibold text-rose-300">
            <Activity className="h-3.5 w-3.5 text-rose-400 animate-pulse" /> Medically Verified Network Only
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight text-white">
            Every minute matters. <br />
            <span className="text-rose-500">Connect. Locate. Respond. Save.</span>
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            A real-time emergency blood coordination system connecting hospital-screened donors with emergency care units
            across coastal Karnataka.
          </p>
        </div>

        <div className="text-xs text-slate-400">
          LifePulse Emergency Portal • Version 1.0 (Phase 1)
        </div>
      </div>

      {/* Right Column: Sign In Form */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h3 className="text-2xl font-bold tracking-tight text-white">Sign In to LifePulse</h3>
            <p className="mt-2 text-sm text-slate-400">Enter your credentials to access your medical authority dashboard</p>
          </div>

          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
              <ShieldAlert className="h-5 w-5 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Email Address
              </label>
              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@lifepulse.in"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 focus:outline-none transition disabled:opacity-50"
            >
              {submitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  Sign In <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Pre-fills */}
          <div className="border-t border-slate-900 pt-6">
            <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase text-center mb-3">
              One-Click Demo Sign In (All Roles Active)
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@lifepulse.in')}
                className="w-full text-left flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2 text-xs font-medium text-slate-300 hover:border-rose-500/50 hover:bg-slate-800/80 hover:text-white transition"
              >
                <span className="font-semibold text-rose-400">🛡️ Admin</span>
                <span className="text-slate-400">admin@lifepulse.in (your console password)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('manipal@lifepulse.in', 'LifePulse@123')}
                className="w-full text-left flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2 text-xs font-medium text-slate-300 hover:border-rose-500/50 hover:bg-slate-800/80 hover:text-white transition"
              >
                <span className="font-semibold text-emerald-400">🏥 Hospital Staff</span>
                <span className="text-slate-400">manipal@lifepulse.in • LifePulse@123</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('rahul.shetty@gmail.com', 'LifePulse@123')}
                className="w-full text-left flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2 text-xs font-medium text-slate-300 hover:border-rose-500/50 hover:bg-slate-800/80 hover:text-white transition"
              >
                <span className="font-semibold text-rose-400">🩸 Verified Donor</span>
                <span className="text-slate-400">rahul.shetty@gmail.com • LifePulse@123</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-slate-400">
            New to LifePulse?{' '}
            <Link to="/register" className="font-semibold text-rose-500 hover:text-rose-400 hover:underline">
              Register here →
            </Link>
          </div>

          <div className="mt-3 text-center">
            <Link to="/" className="text-xs text-slate-500 hover:text-slate-300">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
