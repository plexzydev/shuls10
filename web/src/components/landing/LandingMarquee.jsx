import useScrollReveal from '../../hooks/useScrollReveal';

export default function LandingMarquee() {
  useScrollReveal();

  const stats = [
    { value: '10K+', label: 'Orbes canjeados' },
    { value: '500+', label: 'Viewers activos' },
    { value: '50+', label: 'Recompensas' },
    { value: '24/7', label: 'Tracking activo' },
  ];

  return (
    <div className="px-6 py-12">
      <div className="reveal max-w-[1100px] mx-auto rounded-3xl border border-brand/20 bg-card overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`flex flex-col items-center justify-center py-8 px-4 ${
                i < stats.length - 1 ? 'md:border-r md:border-brand/10' : ''
              } ${i < 2 ? 'border-b md:border-b-0 border-brand/10' : ''}`}
            >
              <span className="text-4xl font-heading font-black text-brand mb-1">
                {stat.value}
              </span>
              <span className="text-sm text-muted-foreground">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
