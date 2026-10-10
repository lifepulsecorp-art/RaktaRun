import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import {
  Navigation,
  Clock,
  Award,
  ArrowRight,
  CheckCircle2,
  Building2,
  Users,
} from 'lucide-react';
import { LifePulseLogo } from '../components/LifePulseLogo';

const COMPATIBILITY_DATA: Record<string, { canGiveTo: string[]; isUniversal?: boolean; note: string }> = {
  'O-': { canGiveTo: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], isUniversal: true, note: 'Universal Red Cell Hero! Vital in immediate trauma resuscitations.' },
  'O+': { canGiveTo: ['O+', 'A+', 'B+', 'AB+'], note: 'Most requested blood type for acute emergency surgeries.' },
  'A-': { canGiveTo: ['A-', 'A+', 'AB-', 'AB+'], note: 'Essential emergency donor for A and AB emergency admissions.' },
  'A+': { canGiveTo: ['A+', 'AB+'], note: 'Critical for scheduled trauma and oncology platelet transfers.' },
  'B-': { canGiveTo: ['B-', 'B+', 'AB-', 'AB+'], note: 'Rare emergency group critical for regional multi-specialty care.' },
  'B+': { canGiveTo: ['B+', 'AB+'], note: 'Vital lifeline for emergency transfusion wards across coastal Karnataka.' },
  'AB-': { canGiveTo: ['AB-', 'AB+'], note: 'Universal plasma donor; rare cellular emergency match.' },
  'AB+': { canGiveTo: ['AB+'], note: 'Universal recipient of red cells; universal life-saving plasma donor.' },
};

export default function HomePage() {
  const [selectedGroup, setSelectedGroup] = useState<string>('O-');
  const compInfo = COMPATIBILITY_DATA[selectedGroup] || COMPATIBILITY_DATA['O-'];

  return (
    <AppLayout withSidebar={false}>
      <div className="mx-auto max-w-7xl space-y-16 py-4 sm:py-8">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white via-rose-50/30 to-white p-8 sm:p-14 lg:p-20 text-center shadow-xl shadow-rose-950/5 dark:border-slate-800/80 dark:from-slate-900/90 dark:via-slate-950 dark:to-slate-950 dark:shadow-2xl dark:shadow-rose-950/10">
          {/* Ambient background glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              <span>Medically Verified Rapid Trauma Network</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white font-display leading-[1.1]">
              Every second counts <br className="hidden sm:inline" />
              when <span className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 bg-clip-text text-transparent">trauma strikes.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              LifePulse coordinates hospital-screened blood donors with emergency intensive care units across Udupi and Dakshina Kannada in real time with turn-by-turn navigation.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 hover:bg-rose-500 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-rose-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Join as a Hero Donor</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/90 hover:bg-slate-100 px-7 py-3.5 text-sm font-bold text-slate-800 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <span>Hospital Blood Bank Login</span>
              </Link>
            </div>

            <div className="flex items-center justify-center gap-6 pt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Aadhaar & Lab Verified
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Zero Commercial Ads
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Instant GPS Dispatch
              </span>
            </div>
          </div>
        </section>

        {/* Live Network Metrics */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
            <div className="flex items-center gap-2 text-rose-500">
              <Clock className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Avg Response</span>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">7.2 mins</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">From alert to donor acceptance</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
            <div className="flex items-center gap-2 text-emerald-500">
              <Users className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Screened Donors</span>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">1,420+</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Certified by partner blood banks</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
            <div className="flex items-center gap-2 text-sky-500">
              <Building2 className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Trauma Centers</span>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">38 Units</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Kasturba, AJ, Wenlock & network</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
            <div className="flex items-center gap-2 text-amber-500">
              <Navigation className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">GPS Transit</span>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">100% Live</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Real-time turn-by-turn navigation</p>
          </div>
        </section>

        {/* 3-Step Emergency Flow */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Protocol</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">
              How LifePulse Saves Lives in Real Time
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Automated emergency response pipeline designed for instant clinical dispatch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-all dark:border-slate-800/80 dark:bg-slate-900/70">
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-lg mb-4">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Emergency Broadcast</h3>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Hospital emergency departments broadcast urgent requirements for specific blood components with patient urgency indicators (Code Red Trauma).
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-all dark:border-slate-800/80 dark:bg-slate-900/70">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-lg mb-4">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Intelligent Matching</h3>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                The algorithm filters verified donors by clinical compatibility, travel radius, donation intervals, and dispatches multi-channel alerts (SMS, WhatsApp, Push).
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-all dark:border-slate-800/80 dark:bg-slate-900/70">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg mb-4">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Turn-by-Turn Transit</h3>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Donor taps accept, launches Google Maps navigation directly to the hospital blood bank, and shares real-time ETA while doctors prepare for transfusion.
              </p>
            </div>
          </div>
        </section>

        {/* Interactive Compatibility Matrix Quick Checker */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-10 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/70">
          <div className="max-w-2xl mx-auto text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Emergency Compatibility Guide</span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white font-display">
              See Who You Can Save With Your Blood Group
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Select your blood type to preview emergency compatibility:
            </p>

            {/* Blood Type Pills */}
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {Object.keys(COMPATIBILITY_DATA).map((grp) => (
                <button
                  key={grp}
                  type="button"
                  onClick={() => setSelectedGroup(grp)}
                  className={`h-10 px-4 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                    selectedGroup === grp
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 scale-105'
                      : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  {grp}
                </button>
              ))}
            </div>

            {/* Compatibility Detail Box */}
            <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-50/50 p-6 text-left dark:border-rose-500/20 dark:bg-rose-950/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase">Selected Group:</span>
                  <p className="text-2xl font-black text-slate-900 dark:text-white font-display">{selectedGroup}</p>
                </div>
                {compInfo.isUniversal && (
                  <span className="self-start rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    ⭐ Universal Emergency Donor
                  </span>
                )}
              </div>

              <div className="mt-4">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Can safely donate red cells to:
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {compInfo.canGiveTo.map((target) => (
                    <span
                      key={target}
                      className="rounded-lg bg-white border border-rose-200 px-3 py-1 text-xs font-bold text-rose-700 shadow-sm dark:bg-slate-900 dark:border-rose-900/40 dark:text-rose-300"
                    >
                      {target}
                    </span>
                  ))}
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-600 dark:text-slate-400 italic">
                {compInfo.note}
              </p>
            </div>
          </div>
        </section>

        {/* Community Wall Teaser */}
        <section className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-transparent p-8 sm:p-12 text-center dark:border-slate-800/80 dark:bg-gradient-to-br dark:from-amber-950/20 dark:via-rose-950/20 dark:to-transparent">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
              <Award className="h-4 w-4" />
              <span>Coastal Karnataka Hero Hall of Fame</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">
              Celebrating Real Life Savers
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Every accepted dispatch and hospital donation earns verified hero badges and community recognition.
            </p>
            <div className="pt-2">
              <Link
                to="/hero-wall"
                className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-400 px-6 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition active:scale-95"
              >
                <span>View Community Hero Leaderboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-8 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <LifePulseLogo size="sm" subtitle="Emergency Blood Coordination Network" />
            <div className="flex items-center gap-6">
              <Link to="/hero-wall" className="hover:text-slate-900 dark:hover:text-white transition">Heroes Wall</Link>
              <Link to="/register/hospital" className="hover:text-slate-900 dark:hover:text-white transition">Hospital Enrolment</Link>
              <Link to="/login" className="hover:text-slate-900 dark:hover:text-white transition">Sign In</Link>
            </div>
            <p>© 2026 LifePulse. Udupi & Dakshina Kannada Emergency Health Grid.</p>
          </div>
        </footer>
      </div>
    </AppLayout>
  );
}
