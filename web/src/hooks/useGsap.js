import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useScrollReveal(selector = '.gsap-reveal', options = {}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const elements = containerRef.current.querySelectorAll(selector);
    if (!elements.length) return;

    const ctx = gsap.context(() => {
      elements.forEach((el, i) => {
        const direction = el.dataset.gsapDir || 'up';
        const delay = parseFloat(el.dataset.gsapDelay) || i * 0.08;

        let fromVars = { opacity: 0, y: 40, duration: 0.8, ease: 'power3.out' };

        if (direction === 'left') fromVars = { opacity: 0, x: -40, duration: 0.8, ease: 'power3.out' };
        if (direction === 'right') fromVars = { opacity: 0, x: 40, duration: 0.8, ease: 'power3.out' };
        if (direction === 'scale') fromVars = { opacity: 0, scale: 0.9, duration: 0.8, ease: 'power3.out' };

        gsap.from(el, {
          ...fromVars,
          delay,
          scrollTrigger: {
            trigger: el,
            start: options.start || 'top 90%',
            toggleActions: 'play none none none',
            ...options.scrollTrigger,
          },
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, [selector]);

  return containerRef;
}

export function useParallax(selector = '.gsap-parallax', speed = 0.3) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const elements = containerRef.current.querySelectorAll(selector);
    if (!elements.length) return;

    const ctx = gsap.context(() => {
      elements.forEach((el) => {
        const s = parseFloat(el.dataset.speed) || speed;
        gsap.to(el, {
          y: () => s * 100,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, [selector, speed]);

  return containerRef;
}

export { gsap, ScrollTrigger };
