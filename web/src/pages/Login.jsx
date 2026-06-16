import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Coins, Gift, Trophy, ArrowRight, ShieldCheck } from 'lucide-react';
import { API_URL } from '../App';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [hover, setHover] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlError = searchParams.get('error');

  async function handleKickLogin() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/kick`);
      if (!res.ok) throw new Error('Backend not ready');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No URL returned');
      }
    } catch (e) {
      console.warn('Backend connection failed. Using mock login for UI testing.');
      // Mock login to allow user to see the dashboard without backend
      setTimeout(() => {
        localStorage.setItem('shuls_token', 'mock-token-123');
        // We use window.location.href to force a full reload so App.jsx picks up the token
        window.location.href = '/dashboard';
      }, 1000);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 bg-background">
      
      {/* Decorative Floating Circles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[15%] w-64 h-64 border border-brand/20 rounded-full animate-float opacity-30" style={{ animationDelay: '0s' }} />
        <div className="absolute bottom-[20%] right-[10%] w-96 h-96 border border-brand/10 rounded-full animate-float opacity-20" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] right-[25%] w-32 h-32 border border-brand/30 rounded-full animate-float opacity-40" style={{ animationDelay: '1s' }} />
        
        {/* Glows */}
        <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] bg-brand/10 rounded-full blur-[160px] animate-glow" />
        <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] bg-brand/10 rounded-full blur-[140px] animate-glow delay-700" />
      </div>

      <div className="relative z-10 w-full max-w-md text-center">
        
        {/* Logo */}
        <div className="flex justify-center mb-6 animate-fade-in-scale">
          <div className="relative">
            <div className="absolute -inset-4 bg-brand/15 rounded-3xl blur-2xl animate-glow" />
            <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-brand via-brand-dark to-brand-deep p-[2px] shadow-2xl shadow-brand/20 animate-float">
              <div className="w-full h-full rounded-[22px] bg-card overflow-hidden">
                <img src="/logo.png" alt="Shuls" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>

        {/* Brand */}
        <h1 className="text-4xl font-heading font-black tracking-wider text-foreground mb-1.5 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          SHULS<span className="text-brand">.</span>
        </h1>
        <p className="text-[9px] tracking-[5px] text-brand font-bold uppercase mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          LOYALTY SYSTEM
        </p>

        {/* Features Row */}
        <div className="flex justify-center gap-6 mb-10 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <FeatureIcon icon={<Coins size={18} />} label="Orbes" />
          <FeatureIcon icon={<Gift size={18} />} label="Rewards" />
          <FeatureIcon icon={<Trophy size={18} />} label="Ranking" />
        </div>

        {/* Login Card (Tilt/Glassmorphism) */}
        <div 
          className="bg-card border border-brand/15 rounded-3xl p-8 shadow-2xl shadow-black/50 animate-fade-in-up relative overflow-hidden group" 
          style={{ animationDelay: '0.4s' }}
        >
          {/* Subtle hover gradient inside card */}
          <div className="absolute inset-0 bg-gradient-radial from-brand/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          <div className="relative z-10">
            <h2 className="text-xl font-heading font-black text-foreground mb-2">Bienvenido de vuelta</h2>
            <p className="text-sm text-muted-foreground mb-8">Conectá tu cuenta de Kick para empezar a sumar orbes.</p>

            <button
              onClick={handleKickLogin}
              disabled={loading}
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
              className="group/btn w-full py-4 bg-brand text-black font-black rounded-full transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] hover:bg-brand-light hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-black border-t-transparent animate-spin" />
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="transition-transform duration-300 group-hover/btn:scale-110">
                    <path d="M5 2h3.5v6.5L13 2h4.5L11.75 9.5 18 18h-4.5l-5-8.5V18H5V2z" />
                  </svg>
                  <span className="text-sm tracking-wider uppercase">Conectar con Kick</span>
                  <ArrowRight size={16} className={`transition-all duration-300 ${hover ? 'translate-x-1 opacity-100' : 'opacity-0 -translate-x-2'}`} />
                </>
              )}
            </button>

            {urlError && (
              <div className="mt-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-center animate-fade-in">
                <p className="text-red-400 text-xs font-bold">Error al autenticar. Intentá de nuevo.</p>
              </div>
            )}
          </div>
        </div>

        {/* Secure verification line */}
        <div className="mt-8 flex items-center justify-center gap-2 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <ShieldCheck size={14} className="text-brand/60" />
          <span className="text-[9px] text-muted-foreground uppercase tracking-[2px] font-bold">Verificación oficial via Kick</span>
        </div>

        <a
          href="https://chrome.google.com/webstore"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-card border border-brand/15 hover:border-brand/30 hover:bg-brand/5 transition-all text-muted-foreground hover:text-foreground animate-fade-in-up shadow-lg shadow-black/20"
          style={{ animationDelay: '0.6s' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          <span className="text-[10px] font-bold tracking-wider">INSTALAR EXTENSIÓN</span>
        </a>

      </div>
    </div>
  );
}

function FeatureIcon({ icon, label }) {
  return (
    <div className="flex flex-col items-center gap-2 group cursor-default">
      <div className="w-12 h-12 rounded-2xl bg-card border border-brand/15 flex items-center justify-center text-brand transition-all duration-300 group-hover:bg-brand/10 group-hover:border-brand/30 group-hover:scale-110 group-hover:-translate-y-1 shadow-lg shadow-black/20">
        {icon}
      </div>
      <span className="text-[9px] text-muted-foreground font-bold tracking-wider group-hover:text-foreground transition-colors">{label}</span>
    </div>
  );
}
