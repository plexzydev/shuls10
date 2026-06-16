import { useEffect } from 'react';
import { useScrollReveal } from '../hooks/useGsap';
import LandingNavbar from '../components/landing/LandingNavbar';
import LandingFooter from '../components/landing/LandingFooter';
import PageHero from '../components/landing/PageHero';
import LandingMarquee from '../components/landing/LandingMarquee';

const values = [
  {
    num: '01',
    title: 'Comunidad',
    desc: 'Creemos que una comunidad unida es más fuerte. Shuls Loyalty nació para recompensar a quienes hacen crecer este espacio.'
  },
  {
    num: '02',
    title: 'Transparencia',
    desc: 'Cada punto ganado, cada reward canjeada, todo es visible y verificable. Sin letra chica, sin sorpresas.'
  },
  {
    num: '03',
    title: 'Diversión',
    desc: 'Retos, ranking, clips, badges — convertimos mirar streams en una experiencia interactiva y competitiva.'
  }
];

export default function About() {
  const containerRef = useScrollReveal('.gsap-reveal');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background relative">
      <div className="bg-grid" />
      <div className="bg-noise" />
      <div className="relative z-10">
        <LandingNavbar />

        <PageHero
          eyebrow="SOBRE NOSOTROS"
          title="¿Qué es Shuls Loyalty?"
          description="Un sistema de lealtad diseñado para recompensar a los viewers más fieles de la comunidad de Shuls en Kick."
        />

        {/* Story section */}
        <section ref={containerRef} className="py-24 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24">
              <div>
                <p className="gsap-reveal text-[10px] text-brand font-bold uppercase tracking-[0.3em] mb-4">
                  LA HISTORIA
                </p>
                <h2 className="gsap-reveal font-heading text-2xl md:text-3xl font-black text-foreground mb-6 leading-tight">
                  Nacido de la comunidad, para la comunidad
                </h2>
                <p className="gsap-reveal text-muted-foreground leading-relaxed mb-4">
                  Shuls Loyalty comenzó como una idea simple: ¿qué pasaría si recompensáramos a la gente por estar presente?
                  No solo por mirar, sino por participar, chatear, y ser parte activa de la comunidad.
                </p>
                <p className="gsap-reveal text-muted-foreground leading-relaxed">
                  Hoy, el sistema incluye orbes automáticos, rewards canjeables, un ranking competitivo,
                  retos diarios, clips compartidos y una extensión de Chrome que integra todo directamente en Kick.
                </p>
              </div>
              <div className="gsap-reveal relative" data-gsap-dir="right">
                <div className="absolute -inset-4 bg-brand/5 rounded-3xl blur-2xl" />
                <div className="relative rounded-3xl bg-card border border-brand/15 p-8 text-center">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-brand-dark to-brand-deep overflow-hidden mb-4 shadow-xl shadow-brand-deep/30">
                    <img src="/logo.png" alt="Shuls" className="w-full h-full object-cover" />
                  </div>
                  <p className="font-heading text-xl font-black text-foreground mb-1">SHULS LOYALTY</p>
                  <p className="text-[9px] text-brand/50 tracking-[0.3em] uppercase">Mirá · Chateá · Acumulá</p>
                  <div className="mt-6 flex justify-center gap-6">
                    <div>
                      <p className="text-lg font-black text-brand font-heading">v1.0</p>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Versión</p>
                    </div>
                    <div className="w-px bg-brand/15" />
                    <div>
                      <p className="text-lg font-black text-foreground font-heading">2025</p>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Lanzamiento</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Values */}
            <div>
              <p className="gsap-reveal text-[10px] text-brand font-bold uppercase tracking-[0.3em] mb-4 text-center">
                NUESTROS VALORES
              </p>
              <h2 className="gsap-reveal font-heading text-2xl md:text-3xl font-black text-foreground mb-12 text-center">
                Lo que nos mueve
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {values.map((val, i) => (
                  <div
                    key={i}
                    className="gsap-reveal rounded-3xl bg-card/60 border border-brand/15 p-6 hover:border-brand/30 transition-all duration-300"
                    data-gsap-delay={String(i * 0.12)}
                  >
                    <span className="font-heading text-4xl font-black text-brand/15 leading-none">{val.num}</span>
                    <h3 className="font-heading text-lg font-black text-foreground mt-3 mb-3">{val.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{val.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <LandingMarquee />
        <LandingFooter />
      </div>
    </div>
  );
}
