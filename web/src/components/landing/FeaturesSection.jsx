import { Eye, Gift, Trophy, Target, Film, Award } from 'lucide-react';
import { useScrollReveal } from '../../hooks/useGsap';
import TiltCard from '../TiltCard';
import SectionHeader from '../SectionHeader';

const features = [
  {
    icon: Eye,
    title: 'Orbes por ver',
    desc: 'Acumulá orbes automáticamente mientras mirás el stream de Shuls.'
  },
  {
    icon: Gift,
    title: 'Rewards exclusivas',
    desc: 'Canjeá tus orbes por recompensas únicas y beneficios especiales.'
  },
  {
    icon: Trophy,
    title: 'Ranking global',
    desc: 'Competí con otros viewers y escalá posiciones en el leaderboard.'
  },
  {
    icon: Target,
    title: 'Retos diarios',
    desc: 'Completá desafíos diarios y semanales para ganar orbes extra.'
  },
  {
    icon: Film,
    title: 'Clips destacados',
    desc: 'Compartí y votá los mejores momentos del stream.'
  },
  {
    icon: Award,
    title: 'Badges personalizados',
    desc: 'Desbloqueá insignias únicas que muestran tu dedicación.'
  }
];

export default function FeaturesSection() {
  const containerRef = useScrollReveal('.gsap-reveal');

  return (
    <section ref={containerRef} className="px-6 py-[100px]">
      <div className="max-w-[1100px] mx-auto">
        <SectionHeader
          label="CARACTERÍSTICAS"
          title="Todo lo que necesitás"
          subtitle="Un ecosistema completo de recompensas para la comunidad."
        />

        {/* Feature grid — TiltCards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <TiltCard key={i} className="rounded-3xl h-full">
                <div
                  className="gsap-reveal rounded-3xl border border-brand/15 bg-card p-8 relative overflow-hidden group h-full"
                  data-gsap-delay={String(i * 0.08)}
                >
                  {/* Hover gradient overlay */}
                  <div
                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: 'radial-gradient(50% 50% at 50% 0%, rgba(34,197,94,0.10) 0%, transparent 70%)' }}
                  />

                  <div className="relative z-10">
                    <div className="rounded-2xl bg-brand/12 p-3.5 w-fit mb-5 group-hover:scale-110 transition-transform duration-300">
                      <Icon size={20} className="text-brand" />
                    </div>
                    <h3 className="font-heading text-xl font-black text-foreground mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              </TiltCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
