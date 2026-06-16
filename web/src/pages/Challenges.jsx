import { useState, useEffect, useRef } from 'react';
import { Target, Clock, Zap, Trophy, CheckCircle, Coins, MessageSquare, Eye, Flame } from 'lucide-react';
import gsap from 'gsap';
import { API_URL } from '../App';

export default function Challenges({ user, token, onUpdate }) {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);
  const [msg, setMsg] = useState('');
  const pageRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    fetchChallenges();
    // Poll every 5 seconds for real-time updates
    pollRef.current = setInterval(fetchChallengesSilent, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    if (!pageRef.current || loading) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.fromTo('.gsap-ch-header', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.5 })
        .fromTo('.gsap-ch-card', { opacity: 0, y: 20, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.06 }, '-=0.2');
    }, pageRef);
    return () => ctx.revert();
  }, [loading]);

  async function fetchChallenges() {
    try {
      const res = await fetch(`${API_URL}/api/challenges`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setChallenges(data.challenges);
      }
    } catch (e) {}
    setLoading(false);
  }

  async function fetchChallengesSilent() {
    try {
      const res = await fetch(`${API_URL}/api/challenges`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setChallenges(data.challenges);
      }
    } catch (e) {}
  }

  async function claimChallenge(id) {
    setClaimingId(id);
    try {
      const res = await fetch(`${API_URL}/api/challenges/${id}/claim`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMsg(`+${data.pointsAwarded} Orbes reclamados`);
        setTimeout(() => setMsg(''), 3000);
        setChallenges(prev => prev.map(c => c.id === id ? { ...c, claimed: true } : c));
        if (onUpdate) onUpdate();
      }
    } catch (e) {}
    setClaimingId(null);
  }

  const metricLabels = { watchTime: 'minutos viendo', messages: 'mensajes', streak: 'días seguidos', logins: 'días activo' };
  const typeColors = { daily: '#22c55e', weekly: '#5B9DFF', special: '#C9A84C' };
  const typeGradients = {
    daily: 'linear-gradient(135deg, #052e16 0%, #064e3b 40%, #052e16 100%)',
    weekly: 'linear-gradient(135deg, #0f1a2e 0%, #1a3a5c 40%, #0f1a2e 100%)',
    special: 'linear-gradient(135deg, #1f1a0f 0%, #3d2e10 40%, #1f1a0f 100%)',
  };
  const typeGlows = {
    daily: 'radial-gradient(circle at 30% 40%, rgba(34,197,94,0.15), transparent 50%), radial-gradient(circle at 70% 80%, rgba(22,163,74,0.15), transparent 50%)',
    weekly: 'radial-gradient(circle at 30% 40%, rgba(91,157,255,0.15), transparent 50%), radial-gradient(circle at 70% 80%, rgba(30,80,180,0.15), transparent 50%)',
    special: 'radial-gradient(circle at 30% 40%, rgba(201,168,76,0.15), transparent 50%), radial-gradient(circle at 70% 80%, rgba(150,120,40,0.15), transparent 50%)',
  };

  return (
    <div ref={pageRef} className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="gsap-ch-header flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center">
          <Target size={24} className="text-brand" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-black text-foreground">Retos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Completá desafíos para ganar orbes y badges</p>
        </div>
      </div>

      {msg && (
        <div className="mb-4 p-3 rounded-xl bg-brand/10 border border-brand/20 text-brand text-xs font-bold animate-fade-in">
          {msg}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : challenges.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-3xl bg-brand/10 border border-brand/15 flex items-center justify-center mx-auto mb-4">
            <Target size={28} className="text-brand/60" />
          </div>
          <p className="text-foreground text-base font-bold">No hay retos activos</p>
          <p className="text-muted-foreground text-sm mt-1">Pronto habrá nuevos desafíos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {challenges.map(challenge => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              typeColors={typeColors}
              typeGradients={typeGradients}
              typeGlows={typeGlows}
              metricLabels={metricLabels}
              claimingId={claimingId}
              onClaim={() => claimChallenge(challenge.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ChallengeCard({ challenge, typeColors, typeGradients, typeGlows, metricLabels, claimingId, onClaim }) {
  const color = typeColors[challenge.type] || '#22c55e';
  const pct = Math.min((challenge.progress / challenge.goal) * 100, 100);
  const completers = challenge.completers || [];
  const completedCount = challenge.completedCount || 0;
  const MAX_AVATARS = 3;
  const extraCount = completedCount > MAX_AVATARS ? completedCount - MAX_AVATARS : 0;
  const claiming = claimingId === challenge.id;

  const metricIcons = { watchTime: <Eye size={16} />, messages: <MessageSquare size={16} />, streak: <Flame size={16} />, logins: <Clock size={16} /> };

  return (
    <div className="gsap-ch-card group relative overflow-hidden rounded-3xl border border-brand/15 transition-all duration-500 hover:border-brand/30 hover:shadow-xl hover:-translate-y-1"
      style={{ minHeight: '240px', boxShadow: challenge.completed ? `0 0 20px ${color}10` : undefined }}>

      {/* Background gradient */}
      <div className="absolute inset-0 bg-card" style={{ background: typeGradients[challenge.type] || typeGradients.daily }}>
        <div className="absolute inset-0 opacity-20" style={{ background: typeGlows[challenge.type] || typeGlows.daily }} />
      </div>

      {/* Hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 100%, ${color}10, transparent 70%)` }} />

      {/* Type badge */}
      <div className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border"
        style={{ color, background: color + '15', borderColor: color + '30' }}>
        {challenge.type}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between h-full p-6" style={{ minHeight: '240px' }}>
        <div>
          {/* Icon + Title */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ background: color + '15', color, borderColor: color + '20' }}>
              {metricIcons[challenge.metric] || <Target size={18} />}
            </div>
            <h3 className="font-heading text-xl font-black text-foreground leading-tight tracking-tight">{challenge.title}</h3>
          </div>

          {/* Description */}
          <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-2">{challenge.description}</p>
        </div>

        {/* Progress section */}
        <div className="mt-auto">
          {/* Progress bar */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-3 rounded-full bg-background overflow-hidden backdrop-blur-sm border border-brand/5">
              <div className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)`, boxShadow: `0 0 8px ${color}40` }} />
            </div>
            <span className="text-xs font-mono font-bold" style={{ color }}>
              {challenge.progress}/{challenge.goal}
            </span>
          </div>

          {/* Bottom row: reward + completers + claim */}
          <div className="flex items-center justify-between gap-3">
            {/* Reward badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border backdrop-blur-md"
              style={{ background: color + '15', color, borderColor: color + '25' }}>
              <Coins size={14} />
              +{challenge.reward}
            </div>

            {/* Completers avatars */}
            {completedCount > 0 && (
              <div className="flex items-center flex-1 justify-end mr-1">
                <div className="flex -space-x-2">
                  {completers.slice(0, MAX_AVATARS).map((c, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-card overflow-hidden bg-popover" style={{ borderColor: color + '40' }} title={c.username}>
                      {c.avatar ? (
                        <img src={c.avatar} alt={c.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-muted-foreground bg-popover">
                          {c.username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {extraCount > 0 && (
                  <div className="w-8 h-8 rounded-full bg-popover flex items-center justify-center -ml-2 border-2" style={{ borderColor: color + '40' }}>
                    <span className="text-[9px] font-bold" style={{ color }}>+{extraCount}</span>
                  </div>
                )}
              </div>
            )}

            {/* Claim button or completed badge */}
            {challenge.completed && !challenge.claimed ? (
              <button
                onClick={onClaim}
                disabled={claiming}
                className="px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.03] active:scale-[0.97] text-black"
                style={{ background: `linear-gradient(135deg, ${color}cc, ${color})`, boxShadow: `0 4px 12px ${color}30` }}
              >
                {claiming ? (
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin inline-block" />
                ) : (
                  'Reclamar'
                )}
              </button>
            ) : challenge.claimed ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: color + '15', color }}>
                <CheckCircle size={14} /> Reclamado
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
