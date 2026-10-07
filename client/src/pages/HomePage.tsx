import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center font-bold">♥</div>
          <div>
            <h1 className="text-xl font-bold">LifePulse</h1>
            <p className="text-xs text-red-400">Udupi & Dakshina Kannada Emergency Response</p>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-3xl text-center">
          <span className="inline-block text-xs bg-red-600/10 border border-red-500/30 text-red-400 px-3 py-1 rounded-full mb-6">
            ● Medically Verified Network Only
          </span>

          <h2 className="text-5xl font-bold mb-4">
            Every minute matters.
          </h2>
          <h3 className="text-3xl font-bold text-red-500 mb-6">
            Connect. Locate. Respond. Save.
          </h3>

          <p className="text-slate-400 mb-10 text-lg">
            A real-time emergency blood coordination system connecting hospital-screened
            donors with emergency care units across coastal Karnataka.
          </p>

          <div className="flex gap-4 justify-center">
            <Link
              to="/login"
              className="px-8 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold transition"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-8 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition"
            >
              Register →
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-6 text-left">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
              <div className="text-2xl mb-2">🩸</div>
              <h4 className="font-semibold mb-1">For Donors</h4>
              <p className="text-sm text-slate-400">
                Get alerted when your blood type is needed nearby. Accept, travel, save a life.
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
              <div className="text-2xl mb-2">🏥</div>
              <h4 className="font-semibold mb-1">For Hospitals</h4>
              <p className="text-sm text-slate-400">
                Create emergency requests and instantly see verified nearby donors en route.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="p-6 text-center text-xs text-slate-500 border-t border-slate-800">
        LifePulse Emergency Portal • Version 1.0 (Phase 1)
      </footer>
    </div>
  );
}

