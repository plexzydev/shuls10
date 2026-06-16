import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Download } from 'lucide-react';
import { gsap } from '../../hooks/useGsap';

export default function LandingHero() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 2.8 });

      // Badge
      tl.from('.hero-badge', {
        y: 20,
        opacity: 0,
        duration: 0.5,
        ease: 'power3.out'
      });

      // Title lines stagger
      tl.from('.hero-line', {
        yPercent: 110,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.12
      }, '-=0.2');

      // Subtitle
      tl.from('.hero-sub', {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.out'
      }, '-=0.4');

      // CTAs
      tl.from('.hero-cta', {
        y: 20,
        opacity: 0,
        duration: 0.5,
        ease: 'power3.out',
        stagger: 0.1
      }, '-=0.3');

      // Floating circles
      tl.from('.hero-circle', {
        scale: 0,
        opacity: 0,
        duration: 0.8,
        ease: 'back.out(1.7)',
        stagger: 0.15
      }, '-=0.6');
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background — radial green glow at bottom */}
      <div className="absolute inset-0 bg-background" />
      <div className="bg-glow-bottom" style={{ position: 'absolute' }} />
      <div className="absolute inset-0 bg-grid opacity-30" />

      {/* Floating decorative circles */}
      <div
        className="hero-circle absolute top-[15%] left-[8%] w-32 h-32 rounded-full border border-brand/15 animate-float hidden md:block"
        style={{ animationDelay: '0s' }}
      />
      <div
        className="hero-circle absolute top-[25%] right-[12%] w-48 h-48 rounded-full border border-brand/10 animate-float hidden md:block"
        style={{ animationDelay: '2s' }}
      />
      <div
        className="hero-circle absolute bottom-[20%] left-[15%] w-24 h-24 rounded-full border border-brand/20 animate-float hidden lg:block"
        style={{ animationDelay: '4s' }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-[1100px] mx-auto px-6 pt-32 pb-20 w-full text-center">
        {/* Live badge */}
        <div className="hero-badge flex items-center justify-center mb-8">
          <div className="flex items-center gap-2.5 rounded-full bg-brand/12 px-5 py-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand" />
            </span>
            <span className="text-sm font-bold text-brand-light tracking-wide">EN VIVO</span>
          </div>
        </div>

        {/* Title */}
        <div className="mb-8">
          <div className="overflow-hidden">
            <h1
              className="hero-line font-heading font-black text-foreground"
              style={{
                fontSize: 'clamp(48px, 9vw, 110px)',
                letterSpacing: '-4px',
                lineHeight: '0.95',
              }}
            >
              La lealtad
            </h1>
          </div>
          <div className="overflow-hidden">
            <h1
              className="hero-line font-heading font-black text-brand"
              style={{
                fontSize: 'clamp(48px, 9vw, 110px)',
                letterSpacing: '-4px',
                lineHeight: '0.95',
              }}
            >
              tiene recompensa
            </h1>
          </div>
        </div>

        {/* Subtitle */}
        <p
          className="hero-sub text-muted-foreground max-w-xl mx-auto leading-relaxed mb-10 text-pretty"
          style={{ fontSize: 'clamp(15px, 2vw, 18px)' }}
        >
          Mirá streams, acumulá orbes automáticamente y canjeá rewards exclusivas.
          Todo desde tu navegador con la extensión de Chrome.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          <Link
            to="/login"
            className="hero-cta group flex items-center gap-3 rounded-full bg-brand px-8 py-3.5 font-bold text-sm text-black hover:bg-brand-light hover:scale-[1.02] transition-all duration-300 tracking-wider shadow-lg shadow-brand/20"
          >
            EMPEZAR AHORA
            <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <a
            href="https://chrome.google.com/webstore"
            target="_blank"
            rel="noopener noreferrer"
            className="hero-cta flex items-center gap-3 rounded-full border-2 border-brand/25 px-8 py-3.5 text-foreground font-bold text-sm hover:bg-brand/5 hover:border-brand/40 transition-all duration-300 tracking-wider"
          >
            <Download size={16} />
            EXTENSIÓN
          </a>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
