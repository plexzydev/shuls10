import { useState, useEffect, useRef } from 'react';
import { Gift, Coins } from 'lucide-react';
import { API_URL } from '../App';
import { gsap } from '../hooks/useGsap';

let rewardsAnimated = {};

export default function Rewards({ user, token, onUpdate }) {
  const [rewards, setRewards] = useState([]);
  const [claims, setClaims] = useState([]);
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState('rewards');
  const [claimingId, setClaimingId] = useState(null);
  const pageRef = useRef(null);

  useEffect(() => {
    fetchRewards();
    fetchClaims();
  }, []);

  useEffect(() => {
    if (!pageRef.current || rewardsAnimated[tab]) return;
    rewardsAnimated[tab] = true;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.fromTo('.gsap-rw-header', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.5 })
        .fromTo('.gsap-rw-balance', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.3')
        .fromTo('.gsap-rw-card', { opacity: 0, y: 20, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08 }, '-=0.2');
    }, pageRef);
    return () => ctx.revert();
  }, [tab]);

  async function fetchRewards() {
    try {
      const res = await fetch(`${API_URL}/api/rewards`);
      if (res.ok) {
        const data = await res.json();
        setRewards(data.rewards);
      }
    } catch (e) {}
  }

  async function fetchClaims() {
    try {
      const res = await fetch(`${API_URL}/api/rewards/my-claims`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setClaims(data.claims);
      }
    } catch (e) {}
  }

  async function claimReward(rewardId) {
    setMessage('');
    setClaimingId(rewardId);
    try {
      const res = await fetch(`${API_URL}/api/rewards/${rewardId}/claim`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) {
        setMessage(data.message);

        // Optimistic update: update rewards locally without refetch
        setRewards(prev => prev.map(r => {
          if (r.id !== rewardId) return r;
          const myClaimer = { username: user.displayName || user.kickUsername, avatar: user.avatar };
          const existingClaimers = r.claimers || [];
          const hasMe = existingClaimers.some(c => c.username === myClaimer.username);
          return {
            ...r,
            stock: r.stock > 0 ? r.stock - 1 : r.stock,
            claimCount: (r.claimCount || 0) + 1,
            claimers: hasMe ? existingClaimers : [myClaimer, ...existingClaimers],
          };
        }));

        // Add to claims list locally
        const reward = rewards.find(r => r.id === rewardId);
        if (reward) {
          setClaims(prev => [{ id: Date.now().toString(), reward, status: 'pending', createdAt: new Date().toISOString() }, ...prev]);
        }

        // Sync user points in background
        if (onUpdate) onUpdate();
      } else {
        setMessage(data.error || 'Error al reclamar');
      }
    } catch (e) {
      setMessage('Error de conexión');
    } finally {
      setClaimingId(null);
    }
  }

  return (
    <div ref={pageRef} className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="gsap-rw-header flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand/12 border border-brand/20 flex items-center justify-center">
            <Gift className="text-brand" size={24} />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-black text-foreground">Rewards</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Canjeá tus orbes por premios</p>
          </div>
        </div>
        <div className="bg-popover rounded-xl p-1 flex gap-0.5 border border-brand/10">
          <button
            onClick={() => setTab('rewards')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
              tab === 'rewards' ? 'bg-brand/15 text-brand shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Disponibles
          </button>
          <button
            onClick={() => setTab('claims')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
              tab === 'claims' ? 'bg-brand/15 text-brand shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Mis Claims
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-4 p-3 rounded-xl bg-brand/10 border border-brand/20 text-brand text-xs font-bold animate-fade-in">
          {message}
        </div>
      )}

      {/* Balance */}
      <div className="gsap-rw-balance card-hover bg-card border border-brand/15 rounded-3xl p-5 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand/12 border border-brand/20 flex items-center justify-center">
            <Coins size={18} className="text-brand" />
          </div>
          <span className="text-sm text-muted-foreground font-bold">Tu balance</span>
        </div>
        <span className="font-heading text-3xl font-black text-foreground">{user.points?.toLocaleString()} <span className="text-base text-brand font-bold">Orbes</span></span>
      </div>

      {tab === 'rewards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.length > 0 ? rewards.map((reward) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              canAfford={user.points >= reward.cost}
              claiming={claimingId === reward.id}
              onClaim={() => claimReward(reward.id)}
            />
          )) : (
            <div className="col-span-full text-center py-16">
              <div className="w-16 h-16 rounded-3xl bg-brand/10 border border-brand/15 flex items-center justify-center mx-auto mb-4">
                <Gift size={28} className="text-brand/60" />
              </div>
              <p className="text-foreground text-base font-bold">No hay rewards disponibles</p>
              <p className="text-muted-foreground text-sm mt-1">Pronto habrá premios para canjear</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {claims.length > 0 ? claims.map((claim) => (
            <div key={claim.id} className="gsap-rw-card card-hover bg-card border border-brand/15 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-foreground">{claim.reward.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(claim.createdAt).toLocaleDateString('es-AR', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </p>
              </div>
              <StatusBadge status={claim.status} />
            </div>
          )) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-3xl bg-brand/10 border border-brand/15 flex items-center justify-center mx-auto mb-4">
                <Gift size={28} className="text-brand/60" />
              </div>
              <p className="text-foreground text-base font-bold">Sin claims todavía</p>
              <p className="text-muted-foreground text-sm mt-1">Canjeá un reward para verlo acá</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RewardCard({ reward, canAfford, claiming, onClaim }) {
  const hasImage = !!reward.image;
  const hasStock = reward.stock >= 0;
  const lowStock = hasStock && reward.stock <= 10;
  const claimers = (reward.claimers || []).filter((v, i, a) => a.findIndex(t => t.username === v.username) === i);
  const claimCount = reward.claimCount || 0;
  const MAX_AVATARS = 3;
  const extraCount = claimCount > MAX_AVATARS ? claimCount - MAX_AVATARS : 0;

  return (
    <div className="gsap-rw-card group relative overflow-hidden rounded-3xl border border-brand/15 bg-card cursor-default transition-all duration-500 ease-out hover:border-brand/30 hover:shadow-2xl hover:shadow-brand/10 hover:-translate-y-1.5"
      style={{ minHeight: '320px' }}>

      {/* Background: image or gradient */}
      {hasImage ? (
        <>
          <img
            src={reward.image}
            alt={reward.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </>
      ) : (
        <div className="absolute inset-0 bg-popover">
          <div className="absolute inset-0 opacity-30"
            style={{ background: 'radial-gradient(circle at 30% 40%, rgba(34,197,94,0.15), transparent 50%), radial-gradient(circle at 70% 80%, rgba(22,163,74,0.15), transparent 50%)' }} />
          <div className="absolute top-6 right-6 opacity-10 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6">
            <Gift size={90} className="text-brand" strokeWidth={1} />
          </div>
        </div>
      )}

      {/* Hover glow overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10"
        style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(34,197,94,0.15), transparent 70%)' }} />

      {/* Stock badge */}
      {hasStock && (
        <div className={`absolute top-4 right-4 z-20 px-3 py-1.5 rounded-full text-[10px] font-bold backdrop-blur-md border transition-transform duration-300 group-hover:scale-105 ${
          lowStock
            ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
            : 'bg-brand/15 text-brand border-brand/25'
        }`}>
          {reward.stock} restantes
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-end h-full p-6">
        {/* Title */}
        <h3 className="font-heading text-xl font-black text-foreground leading-tight tracking-tight mb-2 drop-shadow-lg transition-transform duration-300 group-hover:translate-x-1">
          {reward.name}
        </h3>

        {/* Description */}
        <p className="text-muted-foreground text-sm leading-relaxed mb-5 line-clamp-2">
          {reward.description}
        </p>

        {/* Bottom row: price + claimers + button */}
        <div className="flex items-center justify-between gap-3 mt-auto">
          {/* Price badge */}
          <div className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold border backdrop-blur-md transition-all duration-300 group-hover:scale-[1.03] ${
            canAfford
              ? 'bg-brand/15 text-brand border-brand/25'
              : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            <Coins size={14} className={canAfford ? 'text-brand' : 'text-red-400'} />
            {reward.cost.toLocaleString()}
          </div>

          {/* Claimers avatars */}
          {claimCount > 0 && (
            <div className="flex items-center flex-1 justify-end mr-1">
              <div className="flex -space-x-2">
                {claimers.slice(0, MAX_AVATARS).map((c, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-card overflow-hidden bg-popover transition-transform duration-300 hover:scale-110 hover:z-10" title={c.username}>
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
                <div className="w-8 h-8 rounded-full border-2 border-card bg-popover flex items-center justify-center -ml-2">
                  <span className="text-[9px] text-brand font-bold">+{extraCount}</span>
                </div>
              )}
            </div>
          )}

          {/* Claim button */}
          <button
            onClick={onClaim}
            disabled={!canAfford || claiming}
            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
              canAfford
                ? 'bg-brand text-black shadow-lg shadow-brand/20 hover:shadow-xl hover:shadow-brand/30 hover:scale-[1.04] hover:bg-brand-light active:scale-[0.96]'
                : 'bg-popover border border-brand/10 text-muted-foreground/50 cursor-not-allowed'
            }`}
          >
            {claiming ? (
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              </span>
            ) : (
              'Canjear'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    approved: 'bg-brand/10 text-brand border-brand/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    delivered: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  };

  const labels = {
    pending: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    delivered: 'Entregado'
  };

  return (
    <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold border ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
}
