import { useState, useEffect, useRef } from 'react';
import { Clock, Flame, Trophy, TrendingUp, Radio, Gift, ExternalLink, Sparkles, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_URL } from '../App';
import { gsap } from '../hooks/useGsap';

// Track if intro animation already played this session
let dashboardAnimated = false;

export default function Dashboard({ user, token }) {
  const [stats, setStats] = useState(null);
  const [stream, setStream] = useState({ isLive: false });
  const pageRef = useRef(null);

  useEffect(() => {
    fetchStats();
    fetchStream();
    const interval = setInterval(fetchStream, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!pageRef.current || !stats || dashboardAnimated) return;
    dashboardAnimated = true;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.fromTo('.gsap-reveal', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.1 })
        .fromTo('.gsap-stat', { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.1 }, '-=0.4')
        .fromTo('.gsap-hero-number', { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'elastic.out(1,0.5)' }, '-=0.5');
    }, pageRef);
    return () => ctx.revert();
  }, [stats]);

  async function fetchStats() {
    try {
      const res = await fetch(`${API_URL}/api/users/me/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setStats(await res.json());
      else setStats({});
    } catch (e) {
      setStats({});
    }
  }

  async function fetchStream() {
    try {
      const res = await fetch(`${API_URL}/api/stream/status`);
      if (res.ok) setStream(await res.json());
    } catch (e) {}
  }

  return (
    <div ref={pageRef} className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
      
      {/* Top Section: Profile & Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Profile Card */}
        <div className="gsap-reveal bg-card/60 backdrop-blur-xl border border-brand/15 rounded-[32px] p-6 sm:p-8 flex items-center gap-5 sm:gap-6 shadow-2xl shadow-black/50 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-radial from-brand/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
          <div className="relative group/avatar flex-shrink-0">
            <div className="absolute -inset-2 bg-brand/20 rounded-[32px] blur-xl opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-500" />
            {user.avatar ? (
              <img src={user.avatar} alt="" className="relative w-20 h-20 rounded-[28px] object-cover ring-2 ring-brand/30 shadow-2xl transition-transform duration-500 group-hover/avatar:scale-105 group-hover/avatar:ring-brand/60" />
            ) : (
              <div className="relative w-20 h-20 rounded-[28px] bg-brand/10 border border-brand/20 flex items-center justify-center text-brand text-3xl font-black shadow-2xl transition-transform duration-500 group-hover/avatar:scale-105 group-hover/avatar:border-brand/40 group-hover/avatar:bg-brand/20">
                {(user.displayName || user.kickUsername || 'S')[0].toUpperCase()}
              </div>
            )}
            {stream.isLive && <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-brand rounded-full border-[3px] border-background animate-pulse-dot shadow-[0_0_15px_rgba(34,197,94,0.6)]" />}
          </div>
          
          <div className="flex-1 min-w-0 relative z-10">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-heading text-2xl font-black text-foreground truncate drop-shadow-md">
                {user.displayName || user.kickUsername}
              </h1>
              {user.kickRole && user.kickRole !== 'viewer' && <RoleBadge role={user.kickRole} />}
            </div>
            <p className="text-sm text-brand/80 font-bold tracking-wider uppercase">@{user.kickUsername}</p>
          </div>
        </div>

        {/* Stream Status Card */}
        <div className={`gsap-reveal backdrop-blur-xl rounded-[32px] border transition-all duration-700 overflow-hidden relative group shadow-2xl shadow-black/50 flex flex-col justify-center ${
          stream.isLive ? 'bg-brand/10 border-brand/30' : 'bg-card/60 border-brand/15'
        }`}>
          {stream.isLive && (
            <div className="absolute inset-0 bg-gradient-radial from-brand/10 to-transparent opacity-50 animate-pulse pointer-events-none" style={{ animationDuration: '3s' }} />
          )}
          <div className="absolute inset-0 bg-gradient-radial from-brand/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
          <div className="p-6 sm:p-8 flex items-center gap-4 relative z-10">
            <div className="relative flex-shrink-0">
              <div className={`w-12 h-12 rounded-[20px] flex items-center justify-center transition-colors duration-500 ${stream.isLive ? 'bg-brand text-black shadow-[0_0_20px_rgba(34,197,94,0.5)]' : 'bg-popover border border-brand/10 text-muted-foreground'}`}>
                <Radio size={24} />
              </div>
              {stream.isLive && <div className="absolute inset-0 animate-ping opacity-40 bg-brand rounded-[20px]" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className={`text-base font-black tracking-widest uppercase transition-colors duration-500 ${stream.isLive ? 'text-brand drop-shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'text-muted-foreground'}`}>
                  {stream.isLive ? 'EN VIVO AHORA' : 'OFFLINE'}
                </p>
                {stream.isLive && <span className="text-[10px] bg-brand text-black px-2 py-0.5 rounded font-black tracking-wider shadow-[0_0_10px_rgba(34,197,94,0.3)]">+10 Orbes/min</span>}
              </div>
              {stream.isLive && stream.title ? (
                <p className="text-sm text-foreground/90 truncate font-medium">{stream.title}</p>
              ) : (
                <p className="text-xs text-muted-foreground/60">El stream no está activo en este momento</p>
              )}
            </div>
            
            <a href="https://kick.com/shuls10" target="_blank" rel="noreferrer"
              className={`hidden sm:flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold transition-all duration-300 hover:scale-[1.05] flex-shrink-0 shadow-lg ${
                stream.isLive
                  ? 'bg-brand text-black hover:bg-brand-light hover:shadow-brand/30'
                  : 'bg-card border border-brand/20 text-foreground hover:bg-brand/10 hover:border-brand/40'
              }`}>
              <ExternalLink size={14} />
              {stream.isLive ? 'Ir al Stream' : 'Canal'}
            </a>
          </div>
        </div>
      </div>

      {/* Points Hero & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 mb-8">
        
        {/* Giant Points Card */}
        <div className="gsap-reveal bg-card/60 backdrop-blur-xl border border-brand/15 rounded-[40px] p-8 sm:p-12 text-center relative overflow-hidden group shadow-2xl shadow-black/50">
          <div className="absolute inset-0 bg-gradient-to-b from-brand/5 via-transparent to-transparent opacity-50 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand/10 rounded-full blur-[100px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="absolute top-8 right-8"><Sparkles size={24} className="text-brand/30 animate-float" /></div>
          <div className="absolute bottom-8 left-8"><Sparkles size={16} className="text-brand/20 animate-float delay-500" /></div>
          
          <div className="relative z-10 flex flex-col items-center justify-center h-full">
            <p className="text-[11px] font-bold tracking-[4px] text-brand uppercase mb-6 drop-shadow-[0_0_10px_rgba(34,197,94,0.3)]">Tus Orbes Acumulados</p>
            <p className="gsap-hero-number font-heading text-7xl sm:text-8xl md:text-[120px] font-black text-brand leading-none tracking-tighter drop-shadow-[0_0_40px_rgba(34,197,94,0.5)]">
              {user.points?.toLocaleString() || '0'}
            </p>
            
            <div className="mt-12 flex flex-wrap justify-center gap-4">
              <Link to="/rewards"
                className="group/btn flex items-center gap-3 px-8 py-4 bg-brand text-black rounded-full text-sm font-black transition-all duration-300 hover:scale-[1.03] hover:bg-brand-light shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] active:scale-[0.98]">
                <Gift size={18} className="transition-transform duration-300 group-hover/btn:-translate-y-1 group-hover/btn:rotate-12" />
                CANJEAR REWARDS
              </Link>
              <Link to="/leaderboard"
                className="group/btn flex items-center gap-3 px-8 py-4 bg-card border border-brand/20 text-foreground rounded-full text-sm font-black transition-all duration-300 hover:scale-[1.03] hover:bg-brand/10 hover:border-brand/40 shadow-lg active:scale-[0.98]">
                <Trophy size={18} className="text-brand transition-transform duration-300 group-hover/btn:scale-110" />
                VER RANKING
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Column */}
        <div className="space-y-4 flex flex-col justify-center">
          <div className="gsap-stat">
            <StatCard icon={<Clock size={20} />} color="text-brand" bg="bg-brand/10" border="border-brand/20"
              value={stats?.totalWatchTimeFormatted || '0m'} label="Tiempo Mirando" />
          </div>
          <div className="gsap-stat">
            <StatCard icon={<Flame size={20} />} color="text-orange-400" bg="bg-orange-400/10" border="border-orange-400/20"
              value={stats?.currentStreak || user.currentStreak || '0'} label="Racha Actual" />
          </div>
          <div className="gsap-stat">
            <StatCard icon={<Trophy size={20} />} color="text-yellow-400" bg="bg-yellow-400/10" border="border-yellow-400/20"
              value={stats?.longestStreak || user.longestStreak || '0'} label="Mejor Racha" />
          </div>
          <div className="gsap-stat">
            <StatCard icon={<Eye size={20} />} color="text-purple-400" bg="bg-purple-400/10" border="border-purple-400/20"
              value={stats?.totalClaims || '0'} label="Recompensas" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="gsap-reveal bg-card/60 backdrop-blur-xl border border-brand/15 rounded-[32px] p-6 sm:p-8 shadow-2xl shadow-black/50 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-radial from-brand/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        <div className="relative z-10">
          <h2 className="font-heading text-xl font-black mb-6 flex items-center gap-3 text-foreground tracking-wide">
            <TrendingUp size={22} className="text-brand drop-shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
            ACTIVIDAD RECIENTE
          </h2>
          
          {stats?.recentSessions?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {stats.recentSessions.slice(0, 6).map((session, i) => (
                <div key={i}
                  className="flex items-center justify-between p-4 rounded-[20px] bg-popover/40 border border-brand/5 hover:border-brand/20 hover:bg-brand/5 transition-all duration-300 hover:translate-x-1 group/item">
                  <span className="text-sm font-medium text-muted-foreground group-hover/item:text-foreground transition-colors">
                    {new Date(session.date).toLocaleDateString('es-AR', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                  <span className="text-sm text-brand font-black tracking-wider">
                    {session.durationFormatted}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-popover/20 rounded-[24px] border border-brand/5">
              <div className="w-16 h-16 rounded-[24px] bg-brand/10 flex items-center justify-center mx-auto mb-4 animate-float border border-brand/20 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                <Clock size={24} className="text-brand" />
              </div>
              <p className="text-foreground text-sm font-bold tracking-wide">Sin actividad reciente</p>
              <p className="text-muted-foreground text-xs mt-2">Mirá el stream para empezar a acumular orbes.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RoleBadge({ role }) {
  const config = {
    broadcaster: { label: 'Broadcaster', color: '#C9A84C' },
    moderator: { label: 'Mod', color: '#5B9DFF' },
    vip: { label: 'VIP', color: '#A855F7' },
    subscriber: { label: 'Sub', color: '#22c55e' },
  };
  const c = config[role];
  if (!c) return null;
  return (
    <span 
      className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black border uppercase tracking-widest shadow-lg"
      style={{ color: c.color, background: c.color + '15', borderColor: c.color + '40' }}
    >
      {c.label}
    </span>
  );
}

function StatCard({ icon, color, bg, border, value, label }) {
  return (
    <div className="bg-card/60 backdrop-blur-md border border-brand/15 rounded-[28px] p-5 flex items-center gap-4 group cursor-default shadow-xl shadow-black/20 hover:bg-brand/5 hover:border-brand/30 transition-all duration-300">
      <div className={`w-14 h-14 rounded-[20px] ${bg} border ${border} flex items-center justify-center ${color} flex-shrink-0 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-[0_0_15px_rgba(0,0,0,0.2)]`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[2px] mb-1 group-hover:text-foreground/70 transition-colors">{label}</p>
        <p className="font-heading text-2xl font-black text-foreground leading-none tracking-tight">{value}</p>
      </div>
    </div>
  );
}
