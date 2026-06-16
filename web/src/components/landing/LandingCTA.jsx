import { Link } from 'react-router-dom';
import { Download, ArrowRight } from 'lucide-react';
import useScrollReveal from '../../hooks/useScrollReveal';

export default function LandingCTA() {
  useScrollReveal();

  return (
    <section className="px-6 py-[100px]">
      <div className="max-w-[1100px] mx-auto">
        <div className="reveal relative rounded-3xl border border-brand/20 bg-card overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand/[0.06] rounded-full blur-[100px] pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 px-8 md:px-16 py-16 text-center">
            <h2
              className="font-heading font-black text-foreground mb-5 text-balance"
              style={{
                fontSize: 'clamp(30px, 5vw, 52px)',
                letterSpacing: '-2px',
                lineHeight: '1.05',
              }}
            >
              ¿Listo para ganar mientras{' '}
              <span className="text-brand">mirás</span>?
            </h2>
            <p className="text-muted-foreground mb-10 max-w-lg mx-auto leading-relaxed text-pretty">
              Unite a la comunidad de Shuls y empezá a acumular orbes hoy.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/login"
                className="group flex items-center gap-2 rounded-full bg-brand px-8 py-3.5 text-black font-bold text-sm hover:bg-brand-light hover:scale-[1.02] transition-all duration-300 tracking-wider shadow-lg shadow-brand/20"
              >
                CREAR CUENTA
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="https://chrome.google.com/webstore"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full border-2 border-brand/25 px-8 py-3.5 text-foreground font-bold text-sm hover:bg-brand/5 hover:border-brand/40 transition-all duration-300 tracking-wider"
              >
                <Download size={14} />
                DESCARGAR EXTENSIÓN
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
