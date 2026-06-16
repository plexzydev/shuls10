/**
 * SectionHeader — Reusable section header with label, title, and subtitle
 * Ported from shuls-streamer-website design
 */
export default function SectionHeader({ label, title, subtitle, highlight, align = 'center' }) {
  const alignClass = align === 'left' ? 'text-left' : 'text-center';

  // If highlight is provided, wrap that word in a green span
  function renderTitle() {
    if (!highlight || !title.includes(highlight)) {
      return title;
    }
    const parts = title.split(highlight);
    return (
      <>
        {parts[0]}
        <span className="text-brand">{highlight}</span>
        {parts.slice(1).join(highlight)}
      </>
    );
  }

  return (
    <div className={`${alignClass} mb-16`}>
      {label && (
        <p
          className="reveal text-sm font-bold uppercase tracking-[0.2em] text-brand mb-5"
          data-reveal-delay="0"
          style={{ '--reveal-delay': '0ms' }}
        >
          {label}
        </p>
      )}
      <h2
        className="reveal font-heading font-black text-foreground text-balance"
        data-reveal-delay="80"
        style={{
          '--reveal-delay': '80ms',
          fontSize: 'clamp(30px, 5vw, 52px)',
          letterSpacing: '-2px',
          lineHeight: '1.05',
        }}
      >
        {renderTitle()}
      </h2>
      {subtitle && (
        <p
          className="reveal mt-5 text-muted-foreground leading-relaxed max-w-2xl mx-auto text-pretty"
          data-reveal-delay="160"
          style={{ '--reveal-delay': '160ms' }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
