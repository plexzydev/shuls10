import { useEffect } from 'react';
import LoadingScreen from '../components/landing/LoadingScreen';
import LandingNavbar from '../components/landing/LandingNavbar';
import LandingHero from '../components/landing/LandingHero';
import LandingMarquee from '../components/landing/LandingMarquee';
import FeaturesSection from '../components/landing/FeaturesSection';
import FeatureSplit from '../components/landing/FeatureSplit';
import LandingCTA from '../components/landing/LandingCTA';
import LandingFooter from '../components/landing/LandingFooter';

export default function LandingPage({ user }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <LoadingScreen />
      <div id="landing-navbar">
        <LandingNavbar user={user} />
      </div>
      <div id="main-content" className="will-change-transform">
        <main>
          <section id="inicio">
            <LandingHero />
          </section>
          <LandingMarquee />
          <section id="features">
            <FeaturesSection />
          </section>
          <section id="extension">
            <FeatureSplit />
          </section>
          <LandingCTA />
        </main>
        <LandingFooter />
      </div>
    </>
  );
}
