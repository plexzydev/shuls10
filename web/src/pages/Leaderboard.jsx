import { useState, useEffect, useRef } from 'react';
import { Trophy, Medal, Flame, Coins, Clock, Zap } from 'lucide-react';
import { API_URL } from '../App';
import { gsap } from '../hooks/useGsap';

const TABS = [
  { key: 'points', label: 'Orbes', icon: <Coins size={13} />, valueKey: 'points', format: v => v.toLocaleString(), color: 'text-brand' },
  { key: 'watchTime', label: 'Watch Time', icon: <Clock size={13} />, valueKey: 'totalWatchTimeFormatted', format: v => v || '0m', color: 'text-blue-400' },
  { key: 'streak', label: 'Racha', icon: <Flame size={13} />, valueKey: 'longestStreak', format: v => v.toString(), color: 'text-orange-400' },
];

let lbAnimated = {};

export default function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [sortBy, setSortBy] = useState('points');
  const pageRef = useRef(null);

  useEffect(() => { fetchLeaderboard(); }, [sortBy]);

  useEffect(() => {
    if (!pageRef.current || !users.length || lbAnimated[sortBy]) return;
    lbAnimated[sortBy] = true;
    const ctx = gsap.context(() => {
      gsap.fromTo('.gsap-lb-row', { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.3, stagger: 0.04, ease: 'power2.out' });
    }, pageRef);
    return () => ctx.revert();
  }, [users]);

  async function fetchLeaderboard() {
    try {
      const res = await fetch(`${API_URL}/api/users/leaderboard?sortBy=${sortBy}`);
      if (res.ok) { const d = await res.json(); setUsers(d.leaderboard); }
    } catch (e) {}
  }

  const activeTab = TABS.find(t => t.key === sortBy) || TABS[0];

  function getMedal(i) {
    if (i === 0) return <Medal className="text-yellow-400" size={18} />;
    if (i === 1) return <Medal className="text-gray-300" size={18} />;
    if (i === 2) return <Medal className="text-amber-600" size={18} />;
    return <span className="w-5 text-center text-muted-foreground text-xs font-bold">{i + 1}</span>;
  }

  function getValue(user) {
    if (sortBy === 'points') return user.points.toLocaleString();
    if (sortBy === 'watchTime') return user.totalWatchTimeFormatted || '0m';
    if (sortBy === 'streak') return user.longestStreak;
    return '';
  }

  return (
    <div ref={pageRef} className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 flex items-center justify-center border border-yellow-400/20">
            <Trophy className="text-yellow-400" size={24} />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-black text-foreground">Ranking</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Los mejores viewers del canal</p>
          </div>
        </div>
        <div className="flex bg-popover rounded-xl p-1 gap-0.5 border border-brand/10">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setSortBy(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 ${
                sortBy === t.key ? 'bg-brand/15 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-brand/15 rounded-3xl overflow-hidden shadow-xl shadow-brand/5">
        <div className="grid grid-cols-[40px_1fr_100px] gap-2 px-6 py-4 border-b border-brand/10 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
          <span>#</span>
          <span>Usuario</span>
          <span className="text-right">{activeTab.label}</span>
        </div>

        {users.length > 0 ? users.map((user, i) => (
          <div key={user.kickUsername}
            className={`gsap-lb-row grid grid-cols-[40px_1fr_100px] gap-2 px-6 py-3 items-center border-b border-brand/5 last:border-0 hover:bg-brand/5 transition-all duration-200 ${
              i < 3 ? 'bg-brand/[0.02]' : ''
            }`}>
            <span className="flex items-center">{getMedal(i)}</span>
            <div className="flex items-center gap-3 min-w-0">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-8 h-8 rounded-xl object-cover flex-shrink-0 ring-1 ring-brand/20" />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-brand/12 flex items-center justify-center text-xs font-black text-brand flex-shrink-0 border border-brand/20">
                  {(user.displayName || user.kickUsername || '?')[0].toUpperCase()}
                </div>
              )}
              <span className="font-bold text-sm truncate text-foreground">{user.displayName || user.kickUsername}</span>
              {user.kickRole && user.kickRole !== 'viewer' && <RoleBadge role={user.kickRole} />}
            </div>
            <span className={`text-right font-bold text-sm ${activeTab.color}`}>
              {getValue(user)}
            </span>
          </div>
        )) : (
          <div className="text-center py-16">
            <Trophy size={28} className="text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-foreground text-sm font-bold">No hay usuarios todavía</p>
          </div>
        )}
      </div>
    </div>
  );
}

function RoleBadge({ role }) {
  const config = {
    broadcaster: { label: 'Broadcaster', color: '#C9A84C', icon: <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg> },
    moderator: { label: 'Mod', color: '#5B9DFF', icon: <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
    vip: { label: 'VIP', color: '#A855F7', icon: <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
    subscriber: { label: 'Sub', color: '#22c55e', icon: <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
  };
  const c = config[role];
  if (!c) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider flex-shrink-0"
      style={{ color: c.color, background: c.color + '15', borderColor: c.color + '30' }}>
      {c.icon} {c.label}
    </span>
  );
}
