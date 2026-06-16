import { useEffect, useRef, useState } from 'react';
import { gsap } from '../../hooks/useGsap';

export default function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  const containerRef = useRef(null);
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const textContainerRef = useRef(null);
  const shulsWrapperRef = useRef(null);
  const worldWrapperRef = useRef(null);
  const fillRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    document.body.style.overflow = 'hidden';

    const tl = gsap.timeline({
      onComplete: () => {
        document.body.style.overflow = '';
        setVisible(false);
      }
    });

    // Fade in the text container (outline)
    tl.to(textContainerRef.current, {
      opacity: 1,
      duration: 0.4,
      ease: 'power2.out'
    });

    // Fill up the text with color (clip-path animation from left to right)
    tl.fromTo(fillRef.current,
      { clipPath: 'inset(0 100% 0 -10%)' },
      { clipPath: 'inset(0 -10% 0 -10%)', duration: 1.4, ease: 'power2.inOut' }
    );

    // SHULS moves up, WORLD unfolds downwards
    tl.to(shulsWrapperRef.current, {
      yPercent: -40,
      duration: 0.7,
      ease: 'back.out(1.2)'
    });

    tl.fromTo(worldWrapperRef.current, {
      opacity: 0,
      yPercent: -80,
      clipPath: 'inset(0 -20% 100% -20%)'
    }, {
      opacity: 1,
      yPercent: -40,
      clipPath: 'inset(-20% -20% -20% -20%)',
      duration: 0.7,
      ease: 'back.out(1.2)'
    }, '<');

    // Wait briefly, then text fades out
    tl.to(textContainerRef.current, {
      opacity: 0,
      scale: 0.95,
      duration: 0.4,
      ease: 'power2.in'
    }, '+=0.6');

    // Curtains split
    tl.to(leftRef.current, {
      xPercent: -100,
      duration: 0.7,
      ease: 'power3.inOut'
    }, '-=0.1');
    tl.to(rightRef.current, {
      xPercent: 100,
      duration: 0.7,
      ease: 'power3.inOut'
    }, '<');

    // Main content reveal
    const mainContent = document.getElementById('main-content');
    const landingNav = document.getElementById('landing-navbar');
    
    if (mainContent) {
      gsap.set(mainContent, { scale: 0.92, opacity: 0, filter: 'blur(8px)' });
      if (landingNav) gsap.set(landingNav, { opacity: 0 });

      tl.to(mainContent, {
        scale: 1,
        opacity: 1,
        filter: 'blur(0px)',
        duration: 0.6,
        ease: 'power3.out'
      }, '-=0.3');

      if (landingNav) {
        tl.to(landingNav, {
          opacity: 1,
          duration: 0.6,
          ease: 'power3.out'
        }, '<');
      }
    }

    return () => {
      tl.kill();
      document.body.style.overflow = '';
    };
  }, []);

  if (!visible) return null;

  return (
    <div ref={containerRef} className="fixed inset-0 z-[100] pointer-events-auto">
      {/* Left curtain */}
      <div
        ref={leftRef}
        className="absolute top-0 left-0 w-1/2 h-full bg-[#16a34a] bg-gradient-to-br from-[#16a34a] to-[#064e3b]"
      />
      {/* Right curtain */}
      <div
        ref={rightRef}
        className="absolute top-0 right-0 w-1/2 h-full bg-[#16a34a] bg-gradient-to-bl from-[#16a34a] to-[#064e3b]"
      />

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-4">
        
        {/* Giant text container */}
        <div ref={textContainerRef} className="relative inline-block opacity-0">
          
          {/* SHULS Wrapper */}
          <div ref={shulsWrapperRef} className="relative inline-block">
            {/* Background Outline Text */}
            <h2
              className="font-heading font-black leading-none select-none drop-shadow-[0_0_25px_rgba(34,197,94,0.4)] px-8"
              style={{
                fontSize: 'clamp(56px, 15vw, 200px)',
                letterSpacing: '-8px',
                WebkitTextStroke: '2px rgba(34,197,94,0.6)',
                color: 'transparent',
              }}
            >
              SHULS
            </h2>

            {/* Foreground Filled Text */}
            <h2
              ref={fillRef}
              className="absolute top-0 left-0 right-0 bottom-0 font-heading font-black leading-none select-none text-[#22c55e] px-8"
              style={{
                fontSize: 'clamp(56px, 15vw, 200px)',
                letterSpacing: '-8px',
                clipPath: 'inset(0 100% 0 -10%)',
              }}
            >
              SHULS
            </h2>
          </div>

          {/* WORLD Wrapper */}
          <div ref={worldWrapperRef} className="absolute left-0 right-0 top-[78%] flex justify-center opacity-0 pointer-events-none">
            <h2
              className="font-heading font-black leading-none select-none px-12"
              style={{
                fontSize: 'clamp(56px, 15vw, 200px)',
                letterSpacing: '-8px',
                WebkitTextStroke: '2px rgba(34,197,94,0.6)',
                color: 'transparent',
              }}
            >
              WORLD
            </h2>
          </div>

        </div>
        
      </div>
    </div>
  );
}
