import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useScrollReveal, useParallax } from '../../hooks/useGsap';
import { useRef, useEffect } from 'react';

export default function FeatureSplit() {
  const revealRef = useScrollReveal('.gsap-reveal');
  const parallaxRef = useParallax('.gsap-parallax', 0.15);

  // Combine refs
  const sectionRef = useRef(null);
  useEffect(() => {
    if (sectionRef.current) {
      revealRef.current = sectionRef.current;
      parallaxRef.current = sectionRef.current;
    }
  }, []);

  return (
    <section ref={sectionRef} className="px-6 py-[100px]">
      <div className="max-w-[1100px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Text */}
          <div>
            <p className="gsap-reveal text-sm font-bold uppercase tracking-[0.2em] text-brand mb-5" data-gsap-dir="left">
              LA EXTENSIÓN
            </p>
            <h2
              className="gsap-reveal font-heading font-black text-foreground mb-6 text-balance"
              data-gsap-dir="left"
              data-gsap-delay="0.1"
              style={{
                fontSize: 'clamp(30px, 5vw, 52px)',
                letterSpacing: '-2px',
                lineHeight: '1.05',
              }}
            >
              Tu lealtad, visible en el chat
            </h2>
            <p className="gsap-reveal text-muted-foreground leading-relaxed mb-8 text-pretty" data-gsap-dir="left" data-gsap-delay="0.2">
              Instalá la extensión de Chrome y llevá tu experiencia al siguiente nivel.
              Badges en el chat, panel de orbes integrado y notificaciones de retos en tiempo real.
            </p>

            {/* Bullet points */}
            <div className="space-y-3 mb-8">
              {[
                'Badges y roles visibles en el chat',
                'Panel integrado en la página de Kick',
                'Notificaciones de retos y rewards',
                'Seguimiento automático de watch time'
              ].map((item, i) => (
                <div
                  key={i}
                  className="gsap-reveal flex items-center gap-3"
                  data-gsap-dir="left"
                  data-gsap-delay={String(0.3 + i * 0.08)}
                >
                  <CheckCircle2 size={16} className="text-brand flex-shrink-0" />
                  <span className="text-sm text-foreground/80">{item}</span>
                </div>
              ))}
            </div>

            <Link
              to="/login"
              className="gsap-reveal inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 text-black font-bold text-sm hover:bg-brand-light hover:scale-[1.02] transition-all duration-300 tracking-wider shadow-lg shadow-brand/20 group"
              data-gsap-dir="left"
              data-gsap-delay="0.6"
            >
              VER MI PANEL
              <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Right: Mock dashboard card */}
          <div className="relative gsap-parallax" data-speed="0.2">
            {/* Glow */}
            <div className="absolute -inset-6 bg-brand/[0.04] rounded-3xl blur-3xl" />

            {/* Card */}
            <div className="gsap-reveal relative rounded-[32px] bg-card border border-brand/20 p-6 shadow-2xl shadow-black/30 overflow-hidden" data-gsap-dir="right">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="font-heading font-black text-sm text-foreground tracking-tight">
                  KICK.COM/SHULS10
                </div>
                <div className="ml-auto flex items-center gap-1.5 rounded-full bg-brand/12 px-3 py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse-dot" />
                  <span className="text-[9px] text-brand font-bold">LIVE</span>
                </div>
              </div>

              {/* Points display */}
              <div className="rounded-2xl bg-background/60 border border-brand/10 p-5 mb-4">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Tus orbes</p>
                <p className="text-3xl font-black text-brand font-heading">2,450</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">+125 esta sesión</p>
              </div>

              {/* Stats rows */}
              <div className="space-y-3">
                {[
                  { label: 'Watch time', value: '48h 32m', color: 'text-brand' },
                  { label: 'Racha actual', value: '7 días', color: 'text-orange-400' },
                  { label: 'Ranking', value: '#12', color: 'text-purple-400' },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-brand/10 last:border-0">
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                    <span className={`text-xs font-bold ${stat.color}`}>{stat.value}</span>
                  </div>
                ))}
              </div>

              {/* Bottom — go to stream button */}
              <button className="mt-5 w-full rounded-full bg-brand py-3 text-black text-xs font-bold tracking-wider hover:bg-brand-light transition-all duration-300">
                IR AL STREAM
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
