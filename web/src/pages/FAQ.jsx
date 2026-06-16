import { useEffect, useState } from 'react';
import { useScrollReveal } from '../hooks/useGsap';
import LandingNavbar from '../components/landing/LandingNavbar';
import LandingFooter from '../components/landing/LandingFooter';
import PageHero from '../components/landing/PageHero';

const faqs = [
  {
    question: '¿Cómo gano orbes?',
    answer: 'Los orbes se acumulan automáticamente mientras mirás el stream de Shuls en Kick. La extensión de Chrome registra tu tiempo de visualización y cada minuto suma orbes a tu cuenta. También podés ganar orbes extra completando retos diarios y semanales.'
  },
  {
    question: '¿Necesito la extensión de Chrome?',
    answer: 'La extensión es necesaria para el seguimiento automático de watch time y para ver los badges en el chat. Sin embargo, podés acceder al dashboard web para ver tu perfil, ranking y rewards disponibles sin la extensión.'
  },
  {
    question: '¿Qué puedo canjear con mis orbes?',
    answer: 'Las rewards varían e incluyen beneficios exclusivos dentro de la comunidad. Desde roles especiales en el chat hasta premios personalizados. Revisá la sección de Rewards en tu dashboard para ver las opciones disponibles.'
  },
  {
    question: '¿Cómo funciona el ranking?',
    answer: 'El ranking se basa en los orbes acumulados. Cuanto más mirés y participés, más alto será tu puesto. El ranking se actualiza en tiempo real y podés ver tu posición en el leaderboard global.'
  },
  {
    question: '¿Qué son los retos?',
    answer: 'Los retos son desafíos diarios, semanales y especiales que te permiten ganar orbes extra. Pueden incluir metas de tiempo de visualización, participación en el chat, o acciones específicas durante el stream.'
  },
  {
    question: '¿Es seguro conectar mi cuenta de Kick?',
    answer: 'Sí, la autenticación se realiza directamente a través de la API oficial de Kick con OAuth. No almacenamos tu contraseña ni datos sensibles. Solo accedemos a tu nombre de usuario y avatar público.'
  },
  {
    question: '¿Cómo funcionan los badges?',
    answer: 'Los badges son insignias visuales que aparecen junto a tu nombre en el chat de Kick cuando tenés la extensión instalada. Se otorgan automáticamente según tu rol, nivel de orbes o logros especiales.'
  },
  {
    question: '¿Puedo usar Shuls Loyalty en móvil?',
    answer: 'El dashboard web es totalmente responsive y funciona en móvil. Sin embargo, la extensión de Chrome solo está disponible para navegadores de escritorio por el momento.'
  }
];

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-brand/15 rounded-2xl overflow-hidden hover:border-brand/30 transition-colors duration-300 bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left group"
      >
        <span className="text-sm font-medium text-foreground group-hover:text-brand transition-colors pr-4">
          {question}
        </span>
        <span className={`flex-shrink-0 w-6 h-6 rounded-lg bg-popover flex items-center justify-center text-muted-foreground transition-all duration-300 border border-brand/5 ${open ? 'rotate-45 bg-brand/10 text-brand border-brand/20' : ''}`}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-48' : 'max-h-0'}`}>
        <div className="px-6 pb-5">
          <p className="text-sm text-muted-foreground leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  );
}

export default function FAQ() {
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
          eyebrow="FAQ"
          title="Preguntas frecuentes"
          description="Todo lo que necesitás saber sobre Shuls Loyalty y cómo funciona el sistema."
        />

        <section ref={containerRef} className="py-24 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div key={i} className="gsap-reveal" data-gsap-delay={String(i * 0.06)}>
                  <FAQItem question={faq.question} answer={faq.answer} />
                </div>
              ))}
            </div>

            {/* Contact card */}
            <div className="gsap-reveal mt-16 rounded-3xl bg-card border border-brand/15 p-8 text-center">
              <h3 className="font-heading text-xl font-black text-foreground mb-3">
                ¿Tenés otra pregunta?
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Contactanos en nuestras redes o unite al Discord de la comunidad.
              </p>
              <div className="flex justify-center gap-3">
                <a
                  href="https://discord.gg/shuls10"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2.5 bg-[#5865F2] text-white text-xs font-bold rounded-full hover:bg-[#4752c4] transition-all duration-300 tracking-wider"
                >
                  DISCORD
                </a>
                <a
                  href="https://kick.com/shuls10"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2.5 border border-brand/25 text-foreground text-xs font-bold rounded-full hover:bg-brand/5 transition-all duration-300 tracking-wider"
                >
                  KICK
                </a>
              </div>
            </div>
          </div>
        </section>

        <LandingFooter />
      </div>
    </div>
  );
}
