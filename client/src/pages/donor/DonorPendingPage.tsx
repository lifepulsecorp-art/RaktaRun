import { useAuth } from '../../context/AuthContext';

export default function DonorPendingPage() {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="max-w-md text-center bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        <div className="text-6xl mb-4">⏳</div>
        <h1 className="text-2xl font-bold mb-2">Verification In Progress</h1>
        <p className="text-slate-400 mb-6 text-sm">
          Your hospital certificate has been received. A LifePulse administrator will review it shortly.
          Once approved, your emergency alert network status will be activated.
        </p>
        <button
          onClick={logout}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 py-2.5 rounded-xl font-medium transition text-sm border border-slate-700"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

