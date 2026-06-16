import { useEffect, useRef, useCallback } from 'react';

/**
 * useScrollReveal — IntersectionObserver-based scroll reveal
 * Ported from shuls-streamer-website design
 * 
 * Observes all elements with .reveal or .reveal-3d class
 * and adds .is-visible when they enter the viewport.
 * Supports data-reveal-delay for staggered reveals.
 */
export default function useScrollReveal(deps = []) {
  const observerRef = useRef(null);

  const observe = useCallback(() => {
    // Disconnect previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const delay = entry.target.dataset.revealDelay;
            if (delay) {
              entry.target.style.transitionDelay = `${delay}ms`;
            }
            entry.target.classList.add('is-visible');
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    // Observe all reveal elements
    const elements = document.querySelectorAll('.reveal, .reveal-3d');
    elements.forEach((el) => {
      // Reset visibility for re-observation
      el.classList.remove('is-visible');
      el.style.transitionDelay = '';
      observerRef.current.observe(el);
    });
  }, []);

  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(observe, 100);

    return () => {
      clearTimeout(timer);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, deps);

  return observe;
}
