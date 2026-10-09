import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { role, firebaseUser, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && firebaseUser && role) {
      if (role === 'admin') navigate('/admin', { replace: true });
      else if (role === 'hospital') navigate('/hospital', { replace: true });
      else if (role === 'donor') navigate('/donor', { replace: true });
    }
  }, [loading, firebaseUser, role, navigate]);
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Join LifePulse</h1>
          <p className="text-slate-400">Choose how you want to register</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Donor Card */}
          <Link
            to="/register/donor"
            className="bg-slate-900 border-2 border-slate-800 hover:border-red-500 rounded-2xl p-8 transition group"
          >
            <div className="text-5xl mb-4">🩸</div>
            <h2 className="text-2xl font-bold mb-2 group-hover:text-red-500 transition">
              Register as Donor
            </h2>
            <p className="text-sm text-slate-400 mb-4">
              You've been medically screened by a hospital and have a valid donor certificate.
            </p>
            <ul className="text-xs text-slate-500 space-y-1 mb-4">
              <li>✓ Upload your hospital-issued certificate</li>
              <li>✓ Set your location & availability</li>
              <li>✓ Receive emergency alerts</li>
            </ul>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
              <span className="text-red-500 font-semibold text-sm">Continue →</span>
              <span className="text-[11px] text-amber-400/90 font-medium group-hover:text-amber-300">
                No certificate? See hospitals →
              </span>
            </div>
          </Link>

          {/* Hospital Card */}
          <Link
            to="/register/hospital"
            className="bg-slate-900 border-2 border-slate-800 hover:border-red-500 rounded-2xl p-8 transition group"
          >
            <div className="text-5xl mb-4">🏥</div>
            <h2 className="text-2xl font-bold mb-2 group-hover:text-red-500 transition">
              Register Hospital
            </h2>
            <p className="text-sm text-slate-400 mb-4">
              Register your hospital or blood bank to create emergency requests.
            </p>
            <ul className="text-xs text-slate-500 space-y-1 mb-6">
              <li>✓ Provide license & contact details</li>
              <li>✓ Create emergency blood requests</li>
              <li>✓ Track live donor responses</li>
            </ul>
            <div className="text-red-500 font-semibold text-sm">Continue →</div>
          </Link>
        </div>

        <div className="text-center mt-10 text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-red-500 hover:underline">Login here</Link>
        </div>

        <div className="text-center mt-4">
          <Link to="/" className="text-xs text-slate-600 hover:text-slate-400">← Back to home</Link>
        </div>
      </div>
    </div>
  );
}

