import { useRef, useState, useCallback } from 'react';

/**
 * TiltCard — Interactive 3D tilt card with glare effect
 * Ported from shuls-streamer-website design
 */
export default function TiltCard({ children, className = '', max = 12, glare = true, ...props }) {
  const cardRef = useRef(null);
  const [transform, setTransform] = useState('rotateX(0deg) rotateY(0deg)');
  const [glareStyle, setGlareStyle] = useState({});

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -max;
    const rotateY = ((x - centerX) / centerX) * max;

    setTransform(`rotateX(${rotateX}deg) rotateY(${rotateY}deg)`);

    if (glare) {
      const percentX = (x / rect.width) * 100;
      const percentY = (y / rect.height) * 100;
      setGlareStyle({
        background: `radial-gradient(circle at ${percentX}% ${percentY}%, rgba(74,222,128,0.18) 0%, transparent 60%)`,
        opacity: 1,
      });
    }
  }, [max, glare]);

  const handleMouseLeave = useCallback(() => {
    setTransform('rotateX(0deg) rotateY(0deg)');
    setGlareStyle({ opacity: 0 });
  }, []);

  return (
    <div className="perspective-near" {...props}>
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`relative ${className}`}
        style={{
          transform,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.35s cubic-bezier(0.22,0.61,0.36,1)',
        }}
      >
        {children}
        {glare && (
          <div
            className="absolute inset-0 rounded-[inherit] pointer-events-none transition-opacity duration-300"
            style={glareStyle}
          />
        )}
      </div>
    </div>
  );
}
