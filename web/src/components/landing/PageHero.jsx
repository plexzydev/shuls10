import useScrollReveal from '../../hooks/useScrollReveal';

export default function PageHero({ eyebrow, title, description, children }) {
  useScrollReveal();

  return (
    <section className="relative pt-32 pb-20 px-6 overflow-hidden border-b border-brand/10">
      {/* Background */}
      <div className="absolute inset-0 bg-background" />
      <div className="bg-glow-bottom" style={{ position: 'absolute' }} />
      <div className="absolute inset-0 bg-grid opacity-30" />

      {/* Content */}
      <div className="max-w-[800px] mx-auto text-center relative z-10">
        {eyebrow && (
          <p className="reveal text-sm font-bold uppercase tracking-[0.2em] text-brand mb-4">
            {eyebrow}
          </p>
        )}
        <h1
          className="reveal font-heading font-black text-foreground mb-6"
          style={{
            fontSize: 'clamp(40px, 6vw, 64px)',
            letterSpacing: '-2px',
            lineHeight: '1.05',
          }}
        >
          {title}
        </h1>
        {description && (
          <p className="reveal text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed text-pretty">
            {description}
          </p>
        )}
        <div className="reveal mt-8">
          {children}
        </div>
      </div>
    </section>
  );
}
