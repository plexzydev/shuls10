import { useState, useEffect, useRef } from 'react';
import { User, Shield, Star, Heart, Award, Eye, EyeOff, Clock, Zap, Trophy, Target, Film, Coins, Plus, Trash2, UserCog, Minus, Gift, Check, X, BadgeCheck, Palette, Send, Search } from 'lucide-react';
import gsap from 'gsap';
import { API_URL } from '../App';

const BADGE_ICONS = [
  'star','shield','heart','zap','crown','flame','diamond','sword','skull','ghost',
  'rocket','music','camera','gamepad','trophy','medal','flag','bolt','gem','leaf',
  'sun','moon','cloud','snowflake','flower','fish','bird','cat','dog','paw',
  'lightning','crosshair','glasses','headphones','mic','pizza','coffee','beer',
  'fire','alien','robot','wizard','ninja','pirate','dragon','unicorn',
  'controller','tv','clapperboard','popcorn'
];

const BADGE_ICON_SVGS = {
  star: 'M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  heart: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
  zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  crown: 'M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z M3 20h18',
  flame: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z',
  diamond: 'M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z',
  sword: 'M14.5 17.5L3 6V3h3l11.5 11.5 M13 19l6-6 M16 16l4 4 M19 21l2-2',
  skull: 'M12 2a8 8 0 0 0-8 8c0 6 8 12 8 12s8-6 8-12a8 8 0 0 0-8-8z',
  ghost: 'M9 10h.01 M15 10h.01 M12 2a8 8 0 0 0-8 8v12l3-3 2 2 3-3 3 3 2-2 3 3V10a8 8 0 0 0-8-8z',
  rocket: 'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z',
  music: 'M9 18V5l12-2v13 M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0z M21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  camera: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  gamepad: 'M6 12H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2 M6 8h12 M12 8v8 M6 16l-4 4v-4 M18 16l4 4v-4',
  trophy: 'M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 9 7 9 7 M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 15 7 15 7 M4 22h16 M18 2H6v7a6 6 0 0 0 12 0V2Z',
  medal: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z M8.21 13.89L7 23l5-3 5 3-1.21-9.12',
  flag: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z M4 22v-7',
  bolt: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  gem: 'M6 3h12l4 6-10 13L2 9z M12 22L2 9h20 M12 22l4-13 M12 22L8 9 M12 2l4 7 M12 2L8 9 M2 9h20',
  leaf: 'M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 1c1 2 2 4.5 2 8 0 5.5-4.78 11-10 11z M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M6.34 17.66l-1.41 1.41 M19.07 4.93l-1.41 1.41',
  moon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
  cloud: 'M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z',
  snowflake: 'M12 2v20 M2 12h20 M4.93 4.93l14.14 14.14 M19.07 4.93L4.93 19.07',
  flower: 'M12 7.5a4.5 4.5 0 1 1 4.5 4.5M12 7.5A4.5 4.5 0 1 0 7.5 12M12 7.5V9m-4.5 3a4.5 4.5 0 1 0 4.5 4.5M7.5 12H9m7.5 0a4.5 4.5 0 1 1-4.5 4.5m4.5-4.5H15m-3 4.5V15',
  fish: 'M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6-3.56 0-7.56-2.53-8.5-6z M2.5 12H4 M18 19l2 1 M18 5l2-1',
  bird: 'M16 7h.01 M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20',
  cat: 'M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.1 6.96-.09 2.05 2.13.17 4.1-2 3.83 0 .94-.13 1.86-.39 2.73A6.5 6.5 0 0 1 12 18a6.5 6.5 0 0 1-6.57-6.27A6.98 6.98 0 0 1 5.04 9C2.87 9.27 1 7.2 3.04 5.07 4.97 2.97 8.22 3.07 10 5.07c.65-.17 1.33-.26 2-.26z',
  dog: 'M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5 M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.239-2.5 M8 14v.5 M16 14v.5 M11.25 16.25h1.5L12 17l-.75-.75z',
  paw: 'M11.2 2a1.7 1.7 0 0 0-1.58 2.3l.32.96a4.5 4.5 0 0 1-.36 3.58L8 11.5A5.5 5.5 0 0 0 8 18.5h8a5.5 5.5 0 0 0 0-7l-1.58-2.66a4.5 4.5 0 0 1-.36-3.58l.32-.96A1.7 1.7 0 0 0 12.8 2z',
  lightning: 'M6 16l6-12v8h6L12 24v-8H6z',
  crosshair: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M12 8v8 M8 12h8 M12 2v4 M12 18v4 M2 12h4 M18 12h4',
  glasses: 'M2 12a5 5 0 0 0 5 5h1a3 3 0 0 0 2-1 3 3 0 0 1 4 0 3 3 0 0 0 2 1h1a5 5 0 0 0 5-5V9a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v3z',
  headphones: 'M3 18v-6a9 9 0 0 1 18 0v6 M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3v5z M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3v5z',
  mic: 'M12 1a4 4 0 0 0-4 4v7a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v4 M8 23h8',
  pizza: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z M12 2l-3 18 M12 2l3 18 M5 9h14',
  coffee: 'M17 8h1a4 4 0 1 1 0 8h-1 M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z M6 2v3 M10 2v3 M14 2v3',
  beer: 'M17 11h1a3 3 0 0 1 0 6h-1 M5 11h12v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-7z M9 7V3 M13 7V3',
  fire: 'M12 2c-2.5 3-5 6-5 9a5 5 0 0 0 10 0c0-3-2.5-6-5-9z',
  alien: 'M12 2C6.5 2 2 7 2 12c0 3 2 6 5 7l2-4h6l2 4c3-1 5-4 5-7 0-5-4.5-10-10-10z M8 11h.01 M16 11h.01',
  robot: 'M4 6h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2 M8 12h.01 M16 12h.01 M10 16h4',
  wizard: 'M12 2l2 7h-4l2-7z M6 22l3-8h6l3 8H6z M9 14l-4 2 M15 14l4 2',
  ninja: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M2 12h20 M8 12v.01 M16 12v.01',
  pirate: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M8 9a1 1 0 1 0 0 2 1 1 0 0 0 0-2z M14 14h-4c0 2 4 2 4 0z',
  dragon: 'M12 2C8 2 4 6 4 10c0 3 2 6 5 8l3 4 3-4c3-2 5-5 5-8 0-4-4-8-8-8z M8 10h.01 M16 10h.01',
  unicorn: 'M12 2l2 5h3l-3 4 1 5-3-2-3 2 1-5-3-4h3l2-5z M12 22v-4',
  controller: 'M6 11h4 M8 9v4 M15 12h.01 M18 10h.01 M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1.105 0 2-.672 2.5-1.5l1.414-2.5h6.172l1.414 2.5c.5.828 1.395 1.5 2.5 1.5a3 3 0 0 0 3-3c0-1.544-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z',
  tv: 'M2 7h20v13H2V7z M7 2l5 5 5-5',
  clapperboard: 'M2 4h20v4l-20 0V4z M2 8h20v12H2V8z M7 4l-3 4 M13 4l-3 4 M19 4l-3 4',
  popcorn: 'M7 22l-1-10h12l-1 10H7z M5 12a3 3 0 0 1 3-3 3 3 0 0 1 4-2 3 3 0 0 1 4 2 3 3 0 0 1 3 3',
};

const BADGE_COLORS = [
  '#22c55e','#5B9DFF','#A855F7','#C9A84C','#FF6B6B','#FF8C32','#00D4AA','#FF69B4',
  '#4ECDC4','#FFD93D','#6C5CE7','#FD79A8','#00CEC9','#E17055','#636E72','#2ED573',
  '#1E90FF','#FF4757','#FFA502','#7BED9F'
];

function BadgeIconSvg({ icon, size = 14, color = '#fff' }) {
  const path = BADGE_ICON_SVGS[icon];
  if (!path) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

export default function Profile({ user, token, onUpdate }) {
  const [achievements, setAchievements] = useState([]);
  const [myBadges, setMyBadges] = useState([]);
  const [badgeMsg, setBadgeMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [modTab, setModTab] = useState('challenges');
  const pageRef = useRef(null);
  const isMod = user?.kickRole === 'moderator' || user?.kickRole === 'broadcaster';

  useEffect(() => { fetchAchievements(); fetchMyBadges(); }, []);

  useEffect(() => {
    if (!pageRef.current || loading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.gsap-pf-badge', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.3, stagger: 0.04, ease: 'power2.out' });
    }, pageRef);
    return () => ctx.revert();
  }, [achievements, myBadges, loading]);

  async function fetchAchievements() {
    try {
      const res = await fetch(`${API_URL}/api/profile/me/achievements`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setAchievements(d.achievements); }
    } catch (e) {}
    setLoading(false);
  }

  async function fetchMyBadges() {
    try {
      const res = await fetch(`${API_URL}/api/badges/me`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setMyBadges(d.badges); }
    } catch (e) {}
  }

  async function toggleBadge(badgeId) {
    try {
      const res = await fetch(`${API_URL}/api/badges/me/${badgeId}/toggle`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
      if (res.ok) {
        setMyBadges(prev => prev.map(b => b.badgeId === badgeId ? { ...b, equipped: !b.equipped } : b));
      } else {
        const d = await res.json();
        setBadgeMsg(d.error || 'Error');
        setTimeout(() => setBadgeMsg(''), 3000);
      }
    } catch (e) {}
  }

  async function toggleAchievement(id) {
    try {
      await fetch(`${API_URL}/api/profile/me/achievements/${id}/toggle`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
      setAchievements(prev => prev.map(a => a.id === id ? { ...a, displayed: !a.displayed } : a));
    } catch (e) {}
  }

  const roleConfig = {
    broadcaster: { label: 'Broadcaster', color: '#C9A84C', icon: <Star size={16} /> },
    moderator: { label: 'Moderador', color: '#5B9DFF', icon: <Shield size={16} /> },
    vip: { label: 'VIP', color: '#A855F7', icon: <Star size={16} /> },
    subscriber: { label: 'Suscriptor', color: '#22c55e', icon: <Heart size={16} /> },
  };

  const totalMin = user?.totalWatchTime || 0;
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const unlocked = achievements.filter(a => a.unlocked);

  return (
    <div ref={pageRef} className={`${modTab === 'badges' && isMod ? 'max-w-6xl' : 'max-w-3xl'} mx-auto px-4 py-8 transition-all duration-300`}>
      {/* Profile Header */}
      <div className="bg-card border border-brand/15 rounded-3xl p-6 mb-8 shadow-xl shadow-brand/5">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-3xl font-black text-brand flex-shrink-0 overflow-hidden shadow-inner">
            {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="" /> : (user?.displayName || 'S')[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-heading text-2xl font-black text-foreground">{user?.displayName || user?.kickUsername}</h1>
              {user?.kickRole && user.kickRole !== 'viewer' && (() => {
                const rc = roleConfig[user.kickRole]; if (!rc) return null;
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider"
                  style={{ color: rc.color, background: rc.color + '15', borderColor: rc.color + '30' }}>{rc.icon} {rc.label}</span>;
              })()}
            </div>
            <p className="text-sm text-muted-foreground">@{user?.kickUsername}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          {[
            { icon: <Award size={18} />, val: user?.points?.toLocaleString() || 0, label: 'Orbes', cls: 'text-brand' },
            { icon: <Clock size={18} />, val: days > 0 ? `${days}d ${hours}h` : `${hours}h`, label: 'Watch', cls: 'text-brand' },
            { icon: <Zap size={18} />, val: user?.currentStreak || 0, label: 'Racha', cls: 'text-orange-400' },
            { icon: <Trophy size={18} />, val: unlocked.length, label: 'Logros', cls: 'text-yellow-500' },
          ].map((s, i) => (
            <div key={i} className="text-center p-4 bg-popover rounded-2xl border border-brand/10 hover:border-brand/20 transition-all hover:-translate-y-0.5">
              <div className={`flex items-center justify-center mb-2 ${s.cls}`}>{s.icon}</div>
              <p className="font-heading text-xl font-black text-foreground">{s.val}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Connections & Settings */}
      <div className="bg-card border border-brand/15 rounded-3xl p-6 mb-8">
        <h2 className="font-heading text-lg font-bold text-foreground mb-5 flex items-center gap-2">
          <UserCog size={18} className="text-brand" /> Conexiones
        </h2>
        <div className="space-y-4">
          {/* Discord */}
          <div className="flex items-center justify-between p-4 bg-popover border border-brand/5 rounded-2xl hover:border-brand/15 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#5865F2]/15 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#5865F2"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Discord</p>
                {user?.discordLinked ? (
                  <p className="text-xs text-[#5865F2] font-medium mt-0.5">@{user.discordUsername}</p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-0.5">No vinculado</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user?.discordLinked && (
                <button
                  onClick={async () => {
                    const r = await fetch(`${API_URL}/auth/discord/notify-toggle`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
                    if (r.ok) onUpdate?.();
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    user.streamNotify
                      ? 'bg-brand/10 border-brand/20 text-brand'
                      : 'bg-popover border-brand/10 text-muted-foreground'
                  }`}
                  title={user.streamNotify ? 'Notificaciones activadas' : 'Notificaciones desactivadas'}
                >
                  {user.streamNotify ? '🔔 Notificar stream' : '🔕 Sin notificar'}
                </button>
              )}
              {user?.discordLinked ? (
                <button
                  onClick={async () => {
                    await fetch(`${API_URL}/auth/discord/unlink`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
                    onUpdate?.();
                  }}
                  className="px-4 py-1.5 rounded-full text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
                >
                  Desvincular
                </button>
              ) : (
                <button
                  onClick={async () => {
                    const r = await fetch(`${API_URL}/auth/discord`, { headers: { 'Authorization': `Bearer ${token}` } });
                    if (r.ok) { const d = await r.json(); if (d.url) window.location.href = d.url; }
                  }}
                  className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#5865F2]/15 border border-[#5865F2]/25 text-[#5865F2] hover:bg-[#5865F2]/25 transition-all"
                >
                  Vincular Discord
                </button>
              )}
            </div>
          </div>

          {/* Install Extension */}
          <div className="flex items-center justify-between p-4 bg-popover border border-brand/5 rounded-2xl hover:border-brand/15 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Extensión de Chrome</p>
                <p className="text-xs text-muted-foreground mt-0.5">Insignias y orbes en el chat de Kick</p>
              </div>
            </div>
            <a
              href="https://chrome.google.com/webstore"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-1.5 rounded-full text-xs font-bold bg-brand border border-brand/20 text-black hover:bg-brand-light transition-all"
            >
              Instalar extensión
            </a>
          </div>
        </div>
      </div>

      {/* My Badges */}
      {myBadges.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
              <BadgeCheck size={18} className="text-brand" /> Mis Insignias
            </h2>
            <span className="text-xs text-muted-foreground font-medium">
              Equipadas: <span className={`font-bold ${myBadges.filter(b => b.equipped).length >= 3 ? 'text-orange-400' : 'text-brand'}`}>{myBadges.filter(b => b.equipped).length}</span>/3
            </span>
          </div>
          {badgeMsg && <div className="mb-3 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">{badgeMsg}</div>}
          <p className="text-xs text-muted-foreground/80 mb-3">Tocá una insignia para equipar/desequipar (máx. 3 en el chat)</p>
          <div className="flex flex-wrap gap-3">
            {myBadges.map(ub => (
              <button key={ub.id} onClick={() => toggleBadge(ub.badgeId)}
                className={`gsap-pf-badge flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border transition-all ${
                  ub.equipped ? 'border-brand/30 bg-brand/10 ring-1 ring-brand/20 shadow-md' : 'border-brand/5 bg-card opacity-50 hover:opacity-80 hover:border-brand/15'
                }`}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: ub.badge.color + '20' }}>
                  <BadgeIconSvg icon={ub.badge.icon} size={16} color={ub.badge.color} />
                </div>
                <span className="text-sm font-bold text-foreground">{ub.badge.name}</span>
                {ub.equipped ? <Eye size={14} className="text-brand ml-1" /> : <EyeOff size={14} className="text-muted-foreground ml-1" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Achievements - compact */}
      {unlocked.length > 0 && (
        <div className="mb-8">
          <h2 className="font-heading text-lg font-bold text-foreground mb-4 flex items-center gap-2"><Award size={18} className="text-brand" /> Logros</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {unlocked.map(a => (
              <div key={a.id} className="gsap-pf-badge bg-card border border-brand/10 hover:border-brand/20 rounded-2xl p-4 flex items-center gap-4 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#22c55e15', color: '#22c55e' }}><Award size={18} /></div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-foreground truncate block">{a.title}</span>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{a.description}</p>
                </div>
                <button onClick={() => toggleAchievement(a.id)} className="p-2 rounded-xl hover:bg-popover flex-shrink-0 transition-colors">
                  {a.displayed ? <Eye size={16} className="text-brand" /> : <EyeOff size={16} className="text-muted-foreground" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mod Panel */}
      {isMod && <ModPanel token={token} modTab={modTab} setModTab={setModTab} onUpdate={onUpdate} />}
    </div>
  );
}

function ModPanel({ token, modTab, setModTab, onUpdate }) {
  const [challenges, setChallenges] = useState([]);
  const [clips, setClips] = useState([]);
  const [badges, setBadges] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [claims, setClaims] = useState([]);
  const [pointsUser, setPointsUser] = useState('');
  const [pointsAmount, setPointsAmount] = useState('');
  const [pointsAction, setPointsAction] = useState('add');
  const [newChallenge, setNewChallenge] = useState({ title: '', description: '', type: 'daily', goal: 10, metric: 'watchTime', reward: 50, badgeReward: '', rewardPrize: '' });
  const [newBadge, setNewBadge] = useState({ name: '', icon: 'star', color: '#22c55e', description: '' });
  const [grantUser, setGrantUser] = useState('');
  const [grantBadgeId, setGrantBadgeId] = useState('');
  const [newReward, setNewReward] = useState({ name: '', description: '', cost: 100, stock: -1, image: '' });
  const [allUsers, setAllUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [msg, setMsg] = useState('');

  const h = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  const showMsg = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  useEffect(() => {
    if (modTab === 'challenges') { fetchChallenges(); fetchBadges(); fetchRewards(); }
    if (modTab === 'clips') fetchClips();
    if (modTab === 'badges') { fetchBadges(); fetchAllUsers(); }
    if (modTab === 'rewards') { fetchRewards(); fetchClaims(); }
  }, [modTab]);

  async function fetchChallenges() { try { const r = await fetch(`${API_URL}/api/challenges`, { headers: h }); if (r.ok) { const d = await r.json(); setChallenges(d.challenges); } } catch(e){} }
  async function fetchClips() { try { const r = await fetch(`${API_URL}/api/clips`); if (r.ok) { const d = await r.json(); setClips(d.clips); } } catch(e){} }
  async function fetchBadges() { try { const r = await fetch(`${API_URL}/api/badges`); if (r.ok) { const d = await r.json(); setBadges(d.badges); } } catch(e){} }
  async function fetchAllUsers() { try { const r = await fetch(`${API_URL}/api/badges/admin/users`, { headers: h }); if (r.ok) { const d = await r.json(); setAllUsers(d.users); } } catch(e){} }
  async function fetchRewards() { try { const r = await fetch(`${API_URL}/api/rewards/admin/all`, { headers: h }); if (r.ok) { const d = await r.json(); setRewards(d.rewards); } } catch(e){} }
  async function fetchClaims() { try { const r = await fetch(`${API_URL}/api/rewards/all-claims`, { headers: h }); if (r.ok) { const d = await r.json(); setClaims(d.claims); } } catch(e){} }

  async function createChallenge(e) {
    e.preventDefault();
    const payload = { ...newChallenge, badgeReward: newChallenge.badgeReward || null, rewardPrize: newChallenge.rewardPrize || null };
    const r = await fetch(`${API_URL}/api/challenges`, { method: 'POST', headers: h, body: JSON.stringify(payload) });
    if (r.ok) { setNewChallenge({ title: '', description: '', type: 'daily', goal: 10, metric: 'watchTime', reward: 50, badgeReward: '', rewardPrize: '' }); showMsg('Reto creado'); fetchChallenges(); }
  }
  async function deleteChallenge(id) { await fetch(`${API_URL}/api/challenges/${id}`, { method: 'DELETE', headers: h }); fetchChallenges(); }
  async function deleteClip(id) { await fetch(`${API_URL}/api/clips/${id}`, { method: 'DELETE', headers: h }); fetchClips(); }

  async function modifyPoints(e) {
    e.preventDefault();
    if (!pointsUser.trim() || !pointsAmount) return;
    const r = await fetch(`${API_URL}/api/users/points`, { method: 'POST', headers: h, body: JSON.stringify({ username: pointsUser.trim().toLowerCase(), amount: parseInt(pointsAmount), action: pointsAction }) });
    if (r.ok) { showMsg(`${pointsAction === 'add' ? '+' : '-'}${pointsAmount} Orbes a ${pointsUser}`); setPointsUser(''); setPointsAmount(''); }
    else { const d = await r.json(); showMsg(d.error || 'Error'); }
  }

  async function createBadge(e) {
    e.preventDefault();
    const r = await fetch(`${API_URL}/api/badges`, { method: 'POST', headers: h, body: JSON.stringify(newBadge) });
    if (r.ok) { setNewBadge({ name: '', icon: 'star', color: '#22c55e', description: '' }); showMsg('Insignia creada'); fetchBadges(); }
  }
  async function deleteBadge(id) { await fetch(`${API_URL}/api/badges/${id}`, { method: 'DELETE', headers: h }); fetchBadges(); fetchAllUsers(); }
  async function grantBadge(e) {
    e.preventDefault();
    if (!grantUser.trim() || !grantBadgeId) return;
    const r = await fetch(`${API_URL}/api/badges/${grantBadgeId}/grant`, { method: 'POST', headers: h, body: JSON.stringify({ username: grantUser.trim().toLowerCase() }) });
    if (r.ok) { showMsg(`Insignia otorgada a ${grantUser}`); setGrantUser(''); fetchAllUsers(); }
    else { const d = await r.json(); showMsg(d.error || 'Error'); }
  }
  async function grantBadgeToUser(badgeId, username) {
    const r = await fetch(`${API_URL}/api/badges/${badgeId}/grant`, { method: 'POST', headers: h, body: JSON.stringify({ username }) });
    if (r.ok) { showMsg(`Insignia otorgada a ${username}`); fetchAllUsers(); }
    else { const d = await r.json(); showMsg(d.error || 'Error'); }
  }
  async function revokeBadgeFromUser(badgeId, username) {
    const r = await fetch(`${API_URL}/api/badges/${badgeId}/revoke`, { method: 'POST', headers: h, body: JSON.stringify({ username }) });
    if (r.ok) { showMsg(`Insignia revocada de ${username}`); fetchAllUsers(); }
    else { const d = await r.json(); showMsg(d.error || 'Error'); }
  }

  async function createReward(e) {
    e.preventDefault();
    const r = await fetch(`${API_URL}/api/rewards`, { method: 'POST', headers: h, body: JSON.stringify(newReward) });
    if (r.ok) { setNewReward({ name: '', description: '', cost: 100, stock: -1, image: '' }); showMsg('Reward creado'); fetchRewards(); }
  }
  async function deleteReward(id) { await fetch(`${API_URL}/api/rewards/${id}`, { method: 'DELETE', headers: h }); fetchRewards(); }
  async function resolveClaim(claimId, action) {
    const r = await fetch(`${API_URL}/api/rewards/claims/${claimId}/resolve`, { method: 'POST', headers: h, body: JSON.stringify({ action }) });
    if (r.ok) { showMsg(action === 'approved' ? 'Aprobado' : 'Rechazado (orbes devueltos)'); fetchClaims(); if (onUpdate) onUpdate(); }
  }

  const inputCls = "w-full px-4 py-2.5 rounded-xl bg-popover border border-brand/10 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-brand/30 transition-all";
  const btnCls = "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 text-sm font-bold hover:bg-orange-500/20 transition-all disabled:opacity-40";

  const TABS = [
    { key: 'challenges', label: 'Retos', icon: <Target size={14} /> },
    { key: 'clips', label: 'Clips', icon: <Film size={14} /> },
    { key: 'points', label: 'Orbes', icon: <Coins size={14} /> },
    { key: 'badges', label: 'Insignias', icon: <BadgeCheck size={14} /> },
    { key: 'rewards', label: 'Rewards', icon: <Gift size={14} /> },
  ];

  return (
    <div className="mt-10 bg-card border border-orange-500/20 rounded-3xl p-6 shadow-lg shadow-orange-500/5">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center"><UserCog size={20} className="text-orange-400" /></div>
        <div>
          <h2 className="font-heading text-lg font-black text-foreground">Panel de Moderación</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Gestionar retos, clips, orbes, insignias y rewards</p>
        </div>
      </div>

      {msg && <div className="mb-4 px-4 py-3 rounded-xl bg-brand/10 border border-brand/20 text-brand text-sm font-bold">{msg}</div>}

      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setModTab(t.key)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold transition-all ${
              modTab === t.key ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30 shadow-md shadow-orange-500/10' : 'bg-popover text-muted-foreground border border-brand/10 hover:text-foreground hover:bg-brand/5'
            }`}>{t.icon} {t.label}</button>
        ))}
      </div>

      {/* Challenges */}
      {modTab === 'challenges' && (
        <div className="space-y-4">
          <form onSubmit={createChallenge} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Título del reto</label>
              <input value={newChallenge.title} onChange={e => setNewChallenge({...newChallenge, title: e.target.value})} placeholder="Ej: Ver 2 horas de stream" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Descripción</label>
              <input value={newChallenge.description} onChange={e => setNewChallenge({...newChallenge, description: e.target.value})} placeholder="Ej: Mirá 2 horas de stream hoy" className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Tipo</label>
                <select value={newChallenge.type} onChange={e => setNewChallenge({...newChallenge, type: e.target.value})} className={inputCls}><option value="daily">Diario</option><option value="weekly">Semanal</option><option value="special">Especial</option></select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Métrica</label>
                <select value={newChallenge.metric} onChange={e => setNewChallenge({...newChallenge, metric: e.target.value})} className={inputCls}><option value="watchTime">Watch Time (min)</option><option value="messages">Mensajes</option><option value="streak">Racha (días)</option><option value="logins">Días activo</option></select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Meta (cantidad)</label>
                <input type="number" value={newChallenge.goal} onChange={e => setNewChallenge({...newChallenge, goal: e.target.value})} placeholder="Ej: 120" min="1" className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Orbes de premio</label>
                <input type="number" value={newChallenge.reward} onChange={e => setNewChallenge({...newChallenge, reward: e.target.value})} placeholder="Ej: 50" min="0" className={inputCls} />
              </div>
            </div>
            <div className="pt-3 border-t border-brand/10 mt-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Premios extra (opcional)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground/80 mb-1.5 block">Insignia como premio</label>
                  <select value={newChallenge.badgeReward} onChange={e => setNewChallenge({...newChallenge, badgeReward: e.target.value})} className={inputCls}>
                    <option value="">Sin insignia</option>
                    {badges.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground/80 mb-1.5 block">Reward como premio</label>
                  <select value={newChallenge.rewardPrize} onChange={e => setNewChallenge({...newChallenge, rewardPrize: e.target.value})} className={inputCls}>
                    <option value="">Sin reward</option>
                    {rewards.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <button type="submit" disabled={!newChallenge.title || !newChallenge.description} className={`w-full mt-2 ${btnCls}`}><Plus size={16} /> Crear Reto</button>
          </form>
          {challenges.length > 0 && <div className="space-y-2 pt-4 border-t border-brand/10">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Retos activos ({challenges.length})</p>
            {challenges.map(c => (
              <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-popover border border-transparent hover:border-brand/10 group transition-all">
                <span className="text-sm text-foreground flex-1 truncate font-medium">{c.title}</span>
                <span className="text-xs text-muted-foreground capitalize bg-popover px-2 py-1 rounded-md">{c.type}</span>
                {c.badgeReward && <span className="text-[10px] px-2 py-1 rounded-md bg-purple-500/10 text-purple-400 font-bold">+Insignia</span>}
                {c.rewardPrize && <span className="text-[10px] px-2 py-1 rounded-md bg-brand/10 text-brand font-bold">+Reward</span>}
                <span className="text-xs font-bold text-brand">{c.reward} Orbes</span>
                <button onClick={() => deleteChallenge(c.id)} className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>}
        </div>
      )}

      {/* Clips */}
      {modTab === 'clips' && (
        <div className="space-y-2">
          {clips.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No hay clips</p> : (<>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Clips ({clips.length})</p>
            {clips.map(c => {
              const upvotes = (c.clipVotes || []).filter(v => v.value === 1).length;
              const downvotes = (c.clipVotes || []).filter(v => v.value === -1).length;
              return (
                <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-popover border border-transparent hover:border-brand/10 group transition-all">
                  <span className="text-sm text-foreground flex-1 truncate font-medium">{c.title}</span>
                  <span className="text-xs text-muted-foreground">@{c.user?.kickUsername}</span>
                  <span className="text-xs font-bold text-brand bg-brand/10 px-2 py-1 rounded-md">▲{upvotes}</span>
                  <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded-md">▼{downvotes}</span>
                  <span className={`text-xs font-black ${c.votes > 0 ? 'text-brand' : c.votes < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>={c.votes}</span>
                  <button onClick={() => deleteClip(c.id)} className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all"><Trash2 size={14} /></button>
                </div>
              );
            })}
          </>)}
        </div>
      )}

      {/* Points */}
      {modTab === 'points' && (
        <form onSubmit={modifyPoints} className="space-y-4">
          <input value={pointsUser} onChange={e => setPointsUser(e.target.value)} placeholder="Username de Kick" className={inputCls} />
          <div className="flex gap-3">
            <div className="flex rounded-xl overflow-hidden border border-brand/20">
              <button type="button" onClick={() => setPointsAction('add')} className={`px-4 py-2.5 text-xs font-bold transition-colors ${pointsAction === 'add' ? 'bg-brand/20 text-brand' : 'bg-popover text-muted-foreground hover:bg-brand/5'}`}><Plus size={14} /></button>
              <button type="button" onClick={() => setPointsAction('remove')} className={`px-4 py-2.5 text-xs font-bold transition-colors ${pointsAction === 'remove' ? 'bg-red-500/20 text-red-400' : 'bg-popover text-muted-foreground hover:bg-red-500/5'}`}><Minus size={14} /></button>
            </div>
            <input type="number" value={pointsAmount} onChange={e => setPointsAmount(e.target.value)} placeholder="Cantidad" min="1" className={`flex-1 ${inputCls}`} />
          </div>
          <button type="submit" disabled={!pointsUser.trim() || !pointsAmount} className={`w-full ${btnCls}`}><Coins size={16} /> {pointsAction === 'add' ? 'Agregar' : 'Quitar'} Orbes</button>
        </form>
      )}

      {/* Badges - Split Panel */}
      {modTab === 'badges' && (
        <div className="flex gap-6 min-h-[520px]">
          {/* LEFT PANEL - Badge CRUD */}
          <div className="w-[400px] flex-shrink-0 space-y-4 overflow-y-auto max-h-[620px] pr-4 custom-scrollbar">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Crear Insignia</p>
            <form onSubmit={createBadge} className="space-y-3">
              <input value={newBadge.name} onChange={e => setNewBadge({...newBadge, name: e.target.value})} placeholder="Nombre de la insignia" className={inputCls} />
              <input value={newBadge.description} onChange={e => setNewBadge({...newBadge, description: e.target.value})} placeholder="Descripción (opcional)" className={inputCls} />
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Icono</p>
                <div className="flex flex-wrap gap-1.5">
                  {BADGE_ICONS.map(icon => (
                    <button key={icon} type="button" onClick={() => setNewBadge({...newBadge, icon})}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${newBadge.icon === icon ? 'ring-2 ring-orange-400 bg-popover shadow-md' : 'bg-popover hover:bg-brand/5'}`}>
                      <BadgeIconSvg icon={icon} size={16} color={newBadge.icon === icon ? newBadge.color : '#666'} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Color</p>
                <div className="flex flex-wrap gap-1.5">
                  {BADGE_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setNewBadge({...newBadge, color: c})}
                      className={`w-8 h-8 rounded-full transition-all ${newBadge.color === c ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110 shadow-lg' : 'hover:scale-110'}`}
                      style={{ background: c }} />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-popover border border-brand/5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ background: newBadge.color + '20', borderColor: newBadge.color + '40' }}>
                  <BadgeIconSvg icon={newBadge.icon} size={18} color={newBadge.color} />
                </div>
                <span className="text-sm text-foreground font-bold">{newBadge.name || 'Preview'}</span>
              </div>
              <button type="submit" disabled={!newBadge.name} className={`w-full mt-2 ${btnCls}`}><Plus size={16} /> Crear Insignia</button>
            </form>

            {/* Badge list */}
            {badges.length > 0 && <div className="pt-4 border-t border-brand/10 space-y-2 mt-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Insignias existentes ({badges.length})</p>
              {badges.map(b => (
                <div key={b.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-popover border border-transparent hover:border-brand/10 group transition-all">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center border" style={{ background: b.color + '20', borderColor: b.color + '30' }}>
                    <BadgeIconSvg icon={b.icon} size={14} color={b.color} />
                  </div>
                  <span className="text-sm text-foreground flex-1 truncate font-medium">{b.name}</span>
                  <button onClick={() => deleteBadge(b.id)} className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>}
          </div>

          {/* RIGHT PANEL - Users with badges */}
          <div className="flex-1 border-l border-brand/10 pl-6 flex flex-col min-w-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Buscar usuario..." className={`${inputCls} pl-10`} />
              </div>
              <span className="text-xs font-bold text-muted-foreground whitespace-nowrap bg-popover px-3 py-2 rounded-xl">{allUsers.length} usuarios</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 max-h-[560px] custom-scrollbar pr-2">
              {allUsers
                .filter(u => !userSearch || u.kickUsername.includes(userSearch.toLowerCase()) || (u.displayName || '').toLowerCase().includes(userSearch.toLowerCase()))
                .map(u => (
                <div key={u.id} className="p-3 rounded-2xl bg-popover border border-brand/5 hover:border-brand/20 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0 overflow-hidden text-xs font-black text-brand border border-brand/20">
                      {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" alt="" /> : (u.displayName || u.kickUsername)[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-foreground font-bold block truncate">{u.displayName || u.kickUsername}</span>
                      <span className="text-xs text-muted-foreground">@{u.kickUsername}</span>
                    </div>
                    {u.kickRole && u.kickRole !== 'viewer' && <span className="text-[10px] px-2 py-1 rounded-md bg-card border border-brand/10 text-muted-foreground uppercase font-black">{u.kickRole}</span>}
                  </div>
                  {/* User's current badges */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {u.userBadges.map(ub => (
                      <div key={ub.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-card border border-brand/10 group/badge shadow-sm">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: ub.badge.color + '20' }}>
                          <BadgeIconSvg icon={ub.badge.icon} size={12} color={ub.badge.color} />
                        </div>
                        <span className="text-xs font-medium text-foreground">{ub.badge.name}</span>
                        <button onClick={() => revokeBadgeFromUser(ub.badge.id, u.kickUsername)} className="ml-1 p-1 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400 opacity-0 group-hover/badge:opacity-100 transition-opacity" title="Quitar insignia"><X size={12} /></button>
                      </div>
                    ))}
                    {u.userBadges.length === 0 && <span className="text-xs text-muted-foreground/60 italic py-1">Sin insignias</span>}
                  </div>
                  {/* Grant badge to this user */}
                  <div className="flex gap-2">
                    <select className={`flex-1 ${inputCls} !py-1.5 !text-xs font-medium`} defaultValue="" onChange={e => { if (e.target.value) { grantBadgeToUser(e.target.value, u.kickUsername); e.target.value = ''; } }}>
                      <option value="">+ Agregar insignia...</option>
                      {badges.filter(b => !u.userBadges.find(ub => ub.badge.id === b.id)).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
              ))}
              {allUsers.filter(u => !userSearch || u.kickUsername.includes(userSearch.toLowerCase()) || (u.displayName || '').toLowerCase().includes(userSearch.toLowerCase())).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No se encontraron usuarios</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rewards */}
      {modTab === 'rewards' && (
        <div className="space-y-6">
          <form onSubmit={createReward} className="grid grid-cols-2 gap-3">
            <input value={newReward.name} onChange={e => setNewReward({...newReward, name: e.target.value})} placeholder="Nombre del reward" className={`col-span-2 ${inputCls}`} />
            <input value={newReward.description} onChange={e => setNewReward({...newReward, description: e.target.value})} placeholder="Descripción" className={`col-span-2 ${inputCls}`} />
            <input value={newReward.image} onChange={e => setNewReward({...newReward, image: e.target.value})} placeholder="URL de imagen (opcional)" className={`col-span-2 ${inputCls}`} />
            {newReward.image && <img src={newReward.image} alt="Preview" className="col-span-2 h-24 w-full object-cover rounded-2xl border border-brand/15" onError={e => e.target.style.display='none'} />}
            <input type="number" value={newReward.cost} onChange={e => setNewReward({...newReward, cost: parseInt(e.target.value) || 0})} placeholder="Costo (Orbes)" className={inputCls} />
            <input type="number" value={newReward.stock} onChange={e => setNewReward({...newReward, stock: parseInt(e.target.value)})} placeholder="Stock (-1 = ilimitado)" className={inputCls} />
            <button type="submit" disabled={!newReward.name} className={`col-span-2 mt-2 ${btnCls}`}><Plus size={16} /> Crear Reward</button>
          </form>

          {/* Existing rewards */}
          {rewards.length > 0 && <div className="pt-4 border-t border-brand/10 space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Rewards ({rewards.length})</p>
            {rewards.map(r => (
              <div key={r.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-popover border border-transparent hover:border-brand/10 group transition-all">
                <span className="text-sm font-medium text-foreground flex-1 truncate">{r.name}</span>
                <span className="text-xs font-bold text-brand bg-brand/10 px-2 py-1 rounded-md">{r.cost} Orbes</span>
                <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider ${r.available ? 'bg-brand/10 text-brand' : 'bg-red-500/10 text-red-400'}`}>{r.available ? 'Activo' : 'Inactivo'}</span>
                <button onClick={() => deleteReward(r.id)} className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>}

          {/* Pending claims */}
          {claims.filter(c => c.status === 'pending').length > 0 && (
            <div className="pt-4 border-t border-brand/10 mt-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Claims pendientes</p>
              {claims.filter(c => c.status === 'pending').map(c => (
                <div key={c.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-popover border border-brand/5 mb-2 hover:border-brand/15 transition-all">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-foreground font-bold block truncate">{c.user?.displayName || c.user?.kickUsername}</span>
                    <span className="text-xs text-muted-foreground mt-0.5">{c.reward?.name} — <span className="text-brand font-medium">{c.reward?.cost} Orbes</span></span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => resolveClaim(c.id, 'approved')} className="p-2.5 rounded-xl bg-brand/10 border border-brand/20 text-brand hover:bg-brand hover:text-black transition-all shadow-sm"><Check size={16} strokeWidth={3} /></button>
                    <button onClick={() => resolveClaim(c.id, 'rejected')} className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all shadow-sm"><X size={16} strokeWidth={3} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
