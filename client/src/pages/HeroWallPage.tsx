import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Award, Share2, Camera, Sparkles, Lock } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

type Hero = { id: string; displayName: string; district: string; bloodGroup: string; donations: number; responses: number; badges: string[] };

const BADGE_LABELS: Record<string, { label: string; icon: string }> = {
  life_pulse_hero: { label: 'LifePulse Hero', icon: '🦸' },
  rapid_responder: { label: 'Rapid Responder', icon: '⚡' },
  repeat_hero: { label: 'Repeat Hero', icon: '❤️' },
  rare_blood_hero: { label: 'Rare Blood Hero', icon: '🏅' },
  community_champion: { label: 'Community Champion', icon: '🌟' },
};

function makeLandscapeCard(hero: Hero) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
  gradient.addColorStop(0, '#881337');
  gradient.addColorStop(1, '#0f172a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 630);

  ctx.fillStyle = '#fb7185';
  ctx.font = 'bold 32px Arial, sans-serif';
  ctx.fillText('LIFEPULSE · EMERGENCY HERO RECOGNITION', 72, 88);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 68px Arial, sans-serif';
  ctx.fillText(hero.displayName, 72, 220);

  ctx.font = '34px Arial, sans-serif';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(`${hero.district} · ${hero.bloodGroup} Donor`, 72, 290);

  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 48px Arial, sans-serif';
  ctx.fillText(`${hero.donations} Verified Life-Saving Donations`, 72, 400);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '26px Arial, sans-serif';
  ctx.fillText('“Every minute matters. Connect. Locate. Respond. Save.”', 72, 530);
  return canvas;
}

function makeInstagramStoryCard(hero: Hero) {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
  gradient.addColorStop(0, '#090d16');
  gradient.addColorStop(0.35, '#4c0519');
  gradient.addColorStop(0.8, '#0f172a');
  gradient.addColorStop(1, '#020617');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1920);

  // Border frame
  ctx.strokeStyle = '#e11d48';
  ctx.lineWidth = 12;
  ctx.strokeRect(40, 40, 1000, 1840);

  // Top branding
  ctx.fillStyle = '#fb7185';
  ctx.font = 'bold 46px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LIFEPULSE HERO ❤️', 540, 220);

  ctx.fillStyle = '#fda4af';
  ctx.font = '30px Arial, sans-serif';
  ctx.fillText('COASTAL KARNATAKA EMERGENCY NETWORK', 540, 280);

  // Central Card Box
  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.beginPath();
  ctx.roundRect(100, 370, 880, 960, 40);
  ctx.fill();
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Donor Title
  ctx.fillStyle = '#94a3b8';
  ctx.font = '34px Arial, sans-serif';
  ctx.fillText('MEET OUR VERIFIED RESPONDER', 540, 460);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 74px Arial, sans-serif';
  ctx.fillText(hero.displayName, 540, 560);

  // Badges & Details
  ctx.font = 'bold 44px Arial, sans-serif';
  ctx.fillStyle = '#fb7185';
  ctx.fillText(`🩸 ${hero.bloodGroup} Donor`, 540, 680);

  ctx.fillStyle = '#38bdf8';
  ctx.fillText(`⚡ Emergency Response`, 540, 760);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '38px Arial, sans-serif';
  ctx.fillText(`📍 ${hero.district}`, 540, 840);

  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 46px Arial, sans-serif';
  ctx.fillText(`❤️ Supported verified emergency cases`, 540, 940);

  // Lifetime metrics
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 58px Arial, sans-serif';
  ctx.fillText(`${hero.donations} Life-Saving Donations`, 540, 1060);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '32px Arial, sans-serif';
  ctx.fillText(`${hero.responses} Emergency Dispatches Answered`, 540, 1130);

  // Evocative Quote
  ctx.fillStyle = '#ffffff';
  ctx.font = 'italic bold 52px Georgia, serif';
  ctx.fillText('“He didn’t just receive an alert.', 540, 1460);
  ctx.fillText('He responded.”', 540, 1540);

  // Footer Tagline
  ctx.fillStyle = '#f43f5e';
  ctx.font = 'bold 40px Arial, sans-serif';
  ctx.fillText('LifePulse', 540, 1690);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '30px Arial, sans-serif';
  ctx.fillText('Connecting Lives When It Matters Most', 540, 1750);

  return canvas;
}

export default function HeroWallPage() {
  const { profile, role } = useAuth();
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/heroes')
      .then(({ data }) => setHeroes(data.heroes))
      .catch(() => setError('Hero profiles are temporarily unavailable.'));
  }, []);

  const downloadCard = (hero: Hero, format: 'landscape' | 'story') => {
    if (!profile) {
      window.alert('Please log in to download verified LifePulse recognition cards.');
      return;
    }
    const canvas = format === 'story' ? makeInstagramStoryCard(hero) : makeLandscapeCard(hero);
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lifepulse-hero-${hero.displayName.toLowerCase().replace(/\s+/g, '-')}-${format}.png`;
      link.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/60 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:text-white transition">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="font-bold text-white text-lg">LifePulse Hero Wall</h1>
              <p className="text-xs text-rose-400">Celebrating coastal Karnataka donors who responded when seconds counted</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {role === 'donor' && (
              <Link
                to="/donor/hero-card"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 transition"
              >
                <Camera className="h-3.5 w-3.5" /> My Hero Card & Preview →
              </Link>
            )}
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-400">
              <Sparkles className="h-3.5 w-3.5" /> Opt-In Recognition Only
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-widest text-rose-400">Verified Emergency Donors</p>
          <h2 className="mt-2 text-3xl font-extrabold text-white">Every minute matters. These heroes responded.</h2>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Recognizing donors based on verified emergency actions, not gamified points. Donors appear here only with explicit consent. Exact locations and contact numbers remain completely private.
          </p>
        </div>

        {/* Private Portal Callout Banner for Donors */}
        {role === 'donor' && (
          <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-950/20 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Verified Donor Recognition Portal</p>
                <p className="text-xs text-slate-400">Access your private preview with live canvas rendering and high-res downloads.</p>
              </div>
            </div>
            <Link
              to="/donor/hero-card"
              className="shrink-0 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 transition"
            >
              Open My Private Card Portal →
            </Link>
          </div>
        )}

        {/* Public Visitor Notice */}
        {!profile && (
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex items-center justify-between text-xs text-slate-400">
            <span>Viewing public community wall. To download verified high-res shareable post cards, please log in.</span>
            <Link to="/login" className="text-rose-400 font-semibold hover:underline ml-2">Login here →</Link>
          </div>
        )}

        {error && <p role="alert" className="mt-6 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-300">{error}</p>}
        {!error && heroes.length === 0 && (
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
            No donors have completed an emergency dispatch and opted in yet.
          </div>
        )}

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {heroes.map((hero) => (
            <article key={hero.id} className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <Award className="h-6 w-6" />
                  </div>
                  <span className="rounded-full bg-rose-500/10 border border-rose-500/20 px-3 py-1 text-xs font-bold text-rose-400">
                    {hero.bloodGroup}
                  </span>
                </div>

                <h3 className="mt-4 text-xl font-bold text-white">{hero.displayName}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{hero.district} District</p>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-emerald-400">{hero.donations}</span>
                  <span className="text-xs font-medium text-slate-400">verified donations</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-xs text-slate-400">{hero.responses} responses</span>
                </div>

                {/* Badges */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {hero.badges.map((badge) => {
                    const info = BADGE_LABELS[badge] || { label: badge.replace(/_/g, ' '), icon: '🏆' };
                    return (
                      <span key={badge} className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-300">
                        <span>{info.icon}</span> {info.label}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Share / Download Actions: Authenticated vs Public Lock */}
              <div className="mt-6 pt-4 border-t border-slate-800/80">
                {profile ? (
                  <div className="space-y-2">
                    <button
                      onClick={() => downloadCard(hero, 'story')}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-rose-600/20 hover:from-rose-500 hover:to-pink-500 transition"
                    >
                      <Camera className="h-3.5 w-3.5" /> Instagram Story (9:16)
                    </button>
                    <button
                      onClick={() => downloadCard(hero, 'landscape')}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                    >
                      <Share2 className="h-3.5 w-3.5" /> Landscape Banner
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:border-slate-700 transition"
                  >
                    <Lock className="h-3.5 w-3.5 text-amber-400" /> Login to Download Share Cards
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
