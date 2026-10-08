import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Award, Share2 } from 'lucide-react';
import api from '../utils/api';

type Hero = { id: string; displayName: string; district: string; bloodGroup: string; donations: number; responses: number; badges: string[] };

function makeShareCard(hero: Hero) {
  const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 630;
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  const gradient = ctx.createLinearGradient(0, 0, 1200, 630); gradient.addColorStop(0, '#881337'); gradient.addColorStop(1, '#0f172a');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1200, 630);
  ctx.fillStyle = '#fb7185'; ctx.font = 'bold 34px Arial'; ctx.fillText('LIFEPULSE · COMMUNITY HERO', 72, 88);
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 72px Arial'; ctx.fillText(hero.displayName, 72, 230);
  ctx.font = '36px Arial'; ctx.fillStyle = '#cbd5e1'; ctx.fillText(`${hero.district}  ·  ${hero.bloodGroup}`, 72, 300);
  ctx.fillStyle = '#34d399'; ctx.font = 'bold 54px Arial'; ctx.fillText(`${hero.donations} completed donations`, 72, 410);
  ctx.fillStyle = '#e2e8f0'; ctx.font = '28px Arial'; ctx.fillText('Every minute matters. Connect. Locate. Respond. Save.', 72, 550);
  return canvas;
}

export default function HeroWallPage() {
  const [heroes, setHeroes] = useState<Hero[]>([]); const [error, setError] = useState('');
  useEffect(() => { api.get('/heroes').then(({ data }) => setHeroes(data.heroes)).catch(() => setError('Hero profiles are temporarily unavailable.')); }, []);
  const share = (hero: Hero) => {
    const canvas = makeShareCard(hero); if (!canvas) return;
    canvas.toBlob((blob) => { if (!blob) return; const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `lifepulse-hero-${hero.id}.png`; link.click(); URL.revokeObjectURL(url); }, 'image/png');
  };
  return <div className="min-h-screen bg-slate-950 text-slate-100"><header className="border-b border-slate-800 px-6 py-4"><div className="mx-auto flex max-w-6xl items-center gap-4"><Link to="/" className="rounded-lg border border-slate-700 p-2"><ArrowLeft className="h-4 w-4"/></Link><div><h1 className="font-bold">LifePulse Hero Wall</h1><p className="text-xs text-slate-400">Celebrating donors who chose to share their contribution</p></div></div></header>
    <main className="mx-auto max-w-6xl px-6 py-10"><div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-widest text-rose-300">Our community</p><h2 className="mt-2 text-3xl font-extrabold">Every donation can change a life.</h2><p className="mt-3 text-slate-400">Only donors who have explicitly opted in appear here. Profiles show no phone number or precise location.</p></div>
      {error && <p role="alert" className="mt-6 text-rose-300">{error}</p>}
      {!error && heroes.length === 0 && <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-400">No donors have opted in to the public wall yet.</div>}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{heroes.map((hero) => <article key={hero.id} className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6"><Award className="h-7 w-7 text-amber-300"/><h3 className="mt-4 text-xl font-bold">{hero.displayName}</h3><p className="text-sm text-slate-400">{hero.district} · {hero.bloodGroup}</p><p className="mt-5 text-2xl font-extrabold text-emerald-300">{hero.donations} <span className="text-sm font-medium text-slate-400">donations</span></p><div className="mt-3 flex flex-wrap gap-2">{hero.badges.map((badge)=><span key={badge} className="rounded-full bg-amber-400/10 px-2 py-1 text-xs text-amber-200">{badge.replace(/_/g,' ')}</span>)}</div><button onClick={()=>share(hero)} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 py-2 text-sm font-semibold hover:bg-slate-800"><Share2 className="h-4 w-4"/> Download share card</button></article>)}</div>
    </main></div>;
}
