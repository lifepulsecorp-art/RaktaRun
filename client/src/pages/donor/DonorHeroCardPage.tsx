import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Camera, Share2, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { AppLayout } from '../../components/AppLayout';

const BADGE_DESCRIPTIONS: Record<string, { label: string; icon: string; desc: string }> = {
  life_pulse_hero: { label: 'LifePulse Hero', icon: '✦', desc: 'Responded to your first verified hospital emergency dispatch.' },
  rapid_responder: { label: 'Rapid Responder', icon: '›', desc: 'Accepted alert promptly and arrived within required trauma window.' },
  repeat_hero: { label: 'Repeat Hero', icon: '◆', desc: 'Supported 3 or more verified life-saving emergency requests.' },
  rare_blood_hero: { label: 'Rare Blood Hero', icon: '◇', desc: 'Screened donor with high-priority Rh-negative blood group.' },
  community_champion: { label: 'Community Champion', icon: '✧', desc: 'Active contributor to regional blood awareness and public mobilisation.' },
};

export const DonorHeroCardPage: React.FC = () => {
  const { roleData } = useAuth();
  const [format, setFormat] = useState<'story' | 'landscape'>('story');
  const [consent, setConsent] = useState(Boolean(roleData?.publicHeroConsent));
  const [consentNotice, setConsentNotice] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const heroName = roleData?.fullName || 'Verified Donor';
  const bloodGroup = roleData?.bloodGroup || 'O+';
  const district = roleData?.homeLocality?.toLowerCase().includes('mangal') ? 'Dakshina Kannada' : 'Udupi';
  const totalDonations = roleData?.heroStats?.totalDonations || 0;
  const totalResponses = roleData?.heroStats?.totalEmergencyResponses || 0;
  const badges = roleData?.heroStats?.badges || ['life_pulse_hero'];

  const drawCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (format === 'story') {
      canvas.width = 1080;
      canvas.height = 1920;

      // Gradient background
      const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
      gradient.addColorStop(0, '#090d16');
      gradient.addColorStop(0.35, '#4c0519');
      gradient.addColorStop(0.8, '#0f172a');
      gradient.addColorStop(1, '#020617');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1080, 1920);

      // Frame
      ctx.strokeStyle = '#e11d48';
      ctx.lineWidth = 12;
      ctx.strokeRect(40, 40, 1000, 1840);

      // Top branding
      ctx.fillStyle = '#fb7185';
      ctx.font = 'bold 46px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('LIFEPULSE HERO', 540, 220);

      ctx.fillStyle = '#fda4af';
      ctx.font = '30px Arial, sans-serif';
      ctx.fillText('COASTAL KARNATAKA EMERGENCY NETWORK', 540, 280);

      // Box
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(100, 370, 880, 960, 40);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '34px Arial, sans-serif';
      ctx.fillText('VERIFIED EMERGENCY RESPONDER', 540, 460);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 74px Arial, sans-serif';
      ctx.fillText(heroName, 540, 560);

      ctx.font = 'bold 44px Arial, sans-serif';
      ctx.fillStyle = '#fb7185';
      ctx.fillText(`${bloodGroup} Blood Donor`, 540, 680);

      ctx.fillStyle = '#38bdf8';
      ctx.fillText('Emergency Response', 540, 760);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '38px Arial, sans-serif';
      ctx.fillText(`${district} District`, 540, 840);

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 46px Arial, sans-serif';
      ctx.fillText('Supported verified emergency cases', 540, 940);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 58px Arial, sans-serif';
      ctx.fillText(`${totalDonations} Life-Saving Donations`, 540, 1060);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '32px Arial, sans-serif';
      ctx.fillText(`${totalResponses} Emergency Dispatches Answered`, 540, 1130);

      // Quote
      ctx.fillStyle = '#ffffff';
      ctx.font = 'italic bold 52px Georgia, serif';
      ctx.fillText('“He didn’t just receive an alert.', 540, 1460);
      ctx.fillText('He responded.”', 540, 1540);

      // Footer
      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 40px Arial, sans-serif';
      ctx.fillText('LifePulse', 540, 1690);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '30px Arial, sans-serif';
      ctx.fillText('Connecting Lives When It Matters Most', 540, 1750);
    } else {
      canvas.width = 1200;
      canvas.height = 630;

      const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
      gradient.addColorStop(0, '#881337');
      gradient.addColorStop(1, '#0f172a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1200, 630);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#fb7185';
      ctx.font = 'bold 32px Arial, sans-serif';
      ctx.fillText('LIFEPULSE · EMERGENCY HERO RECOGNITION', 72, 88);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 68px Arial, sans-serif';
      ctx.fillText(heroName, 72, 220);

      ctx.font = '34px Arial, sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(`${district} District · ${bloodGroup} Donor`, 72, 290);

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 48px Arial, sans-serif';
      ctx.fillText(`${totalDonations} Verified Life-Saving Donations`, 72, 400);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '26px Arial, sans-serif';
      ctx.fillText('“Every minute matters. Connect. Locate. Respond. Save.”', 72, 530);
    }
  };

  useEffect(() => {
    drawCard();
  }, [format, heroName, bloodGroup, district, totalDonations, totalResponses]);

  const downloadCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lifepulse-my-hero-card-${format}.png`;
      link.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const toggleConsent = async (val: boolean) => {
    setConsent(val);
    setConsentNotice('');
    try {
      await api.put('/donors/me/public-hero-consent', { enabled: val });
      setConsentNotice(val ? 'Featured on Public Hero Wall!' : 'Set to Private.');
      setTimeout(() => setConsentNotice(''), 3000);
    } catch {
      setConsent(!val);
    }
  };

  return (
    <AppLayout
      title="My Hero Recognition Studio"
      subtitle="Preview & download your verified life-saving contribution cards"
      actions={
        <Link
          to="/hero-wall"
          className="flex items-center gap-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-3.5 py-2 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition shadow-sm"
        >
          <Sparkles className="h-3.5 w-3.5" /> Public Hero Wall →
        </Link>
      }
      withSidebar={true}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-start">
        {/* Card Preview Column */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-6 shadow-sm dark:shadow-2xl flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Camera className="h-4 w-4 text-rose-500 dark:text-rose-400" /> Live Card Preview
            </h2>
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setFormat('story')}
                className={`rounded-lg px-3 py-1.5 transition ${format === 'story' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                Instagram Story (9:16)
              </button>
              <button
                onClick={() => setFormat('landscape')}
                className={`rounded-lg px-3 py-1.5 transition ${format === 'landscape' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                Banner (Landscape)
              </button>
            </div>
          </div>

          {/* Canvas Container with scale */}
          <div className="w-full flex justify-center bg-slate-100 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-4 overflow-hidden">
            <canvas
              ref={canvasRef}
              className="rounded-xl shadow-md dark:shadow-2xl border border-slate-200 dark:border-slate-800"
              style={{
                maxHeight: format === 'story' ? '540px' : '260px',
                width: 'auto',
                objectFit: 'contain',
              }}
            />
          </div>

          <div className="mt-6 w-full flex flex-col sm:flex-row gap-3">
            <button
              onClick={downloadCard}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 py-3 text-sm font-bold text-white shadow-lg shadow-rose-600/30 hover:from-rose-500 hover:to-pink-500 transition"
            >
              <Download className="h-4 w-4" /> Download High-Res PNG ({format === 'story' ? '1080×1920' : '1200×630'})
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 text-center">
            Watermarked and certified by LifePulse Emergency Network for Udupi & Dakshina Kannada.
          </p>
        </div>

        {/* Donor Stats & Consent Column */}
        <div className="space-y-6">
          {/* Identity & Badges Card */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-6 shadow-sm dark:shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 font-bold text-xl">
                {bloodGroup}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{heroName}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{district} District • Verified Donor</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
                <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{totalDonations}</span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Verified Donations</p>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
                <span className="text-3xl font-extrabold text-sky-600 dark:text-sky-400">{totalResponses}</span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Dispatches Answered</p>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Earned Hero Badges</h4>
              <div className="space-y-2">
                {badges.map((b: string) => {
                  const info = BADGE_DESCRIPTIONS[b] || { label: b.replace(/_/g, ' '), icon: '✦', desc: 'Verified emergency contribution.' };
                  return (
                    <div key={b} className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 p-3">
                      <span className="text-xl">{info.icon}</span>
                      <div>
                        <p className="text-xs font-bold text-amber-800 dark:text-amber-300">{info.label}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{info.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Public Hero Wall Opt-in */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-6 shadow-sm dark:shadow-xl">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Share2 className="h-4 w-4 text-rose-500 dark:text-rose-400" /> Public Hero Wall Setting
              </h4>
              {consentNotice && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{consentNotice}</span>}
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              When enabled, your first name, blood group, and completed donation count appear on the public LifePulse Hero Wall. Exact home location and phone numbers remain strictly confidential.
            </p>

            <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 shadow-inner">
              <div>
                <span className="block text-xs font-bold text-slate-900 dark:text-white">Feature my profile on the Public Hero Wall</span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {consent ? 'Visible to community' : 'Kept private'}
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={consent}
                onClick={() => toggleConsent(!consent)}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 focus:ring-offset-slate-950 ${
                  consent ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/20' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                title="Toggle public recognition on hero wall"
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    consent ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default DonorHeroCardPage;

