import React, { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { Navigation } from './components/Navigation';
import { HeroSection } from './components/HeroSection';
import { AboutSection } from './components/AboutSection';
import { CommitteesSection } from './components/CommitteesSection';
import { ScheduleSection } from './components/ScheduleSection';
import { ConferenceInfoSection } from './components/ConferenceInfoSection';
import { SecretariatSection } from './components/SecretariatSection';
import { RegistrationSection } from './components/RegistrationSection';
import { FooterSection } from './components/FooterSection';
import { CustomCursor } from './components/CustomCursor';
import { GlobalScrollEffects } from './components/GlobalScrollEffects';
import { PerfHUD } from './components/PerfHUD';
import { SiteDataProvider } from './lib/SiteData';
import { BackgroundVideoScrubber } from './components/BackgroundVideoScrubber';
import { DiplomaticConstellation } from './components/DiplomaticConstellation';
import { CinematicIntro } from './components/CinematicIntro';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedCommitteeCode, setSelectedCommitteeCode] = useState<string>('UNSC');
  const [showNavLogo, setShowNavLogo] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const [isIntroExiting, setIsIntroExiting] = useState(false);

  const lenisRef = useRef<Lenis | null>(null);

  // Initialize Lenis and GSAP ScrollTrigger Synchronization
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
    });
    lenisRef.current = lenis;

    lenis.on('scroll', ({ scroll }: { scroll: number }) => {
      ScrollTrigger.update();
      window.dispatchEvent(new CustomEvent('icon-mun-scroll', { detail: { scroll } }));
    });

    const updateTicker = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateTicker, false, true);
    gsap.ticker.lagSmoothing(500, 33);

    document.fonts.ready.then(() => {
      ScrollTrigger.refresh();
    });

    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleDebouncedRefresh = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 200);
    };

    window.addEventListener('resize', handleDebouncedRefresh);
    window.addEventListener('orientationchange', handleDebouncedRefresh);

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleDebouncedRefresh);
      window.removeEventListener('orientationchange', handleDebouncedRefresh);
      gsap.ticker.remove(updateTicker);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  const handleNavigateTo = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (!el) return;

    if (lenisRef.current) {
      lenisRef.current.scrollTo(el, {
        offset: sectionId === 'hero-scroll-container' ? 0 : -20,
        duration: 1.3,
      });
    } else {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Replay intro always begins from the very top of the site, including Lenis' virtual scroll.
  useEffect(() => {
    const returnToTopBeforeReplay = () => {
      if (lenisRef.current) {
        lenisRef.current.scrollTo(0, { immediate: true, force: true });
      } else {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
      ScrollTrigger.update();
    };

    window.addEventListener('icon-mun-replay-intro', returnToTopBeforeReplay);
    return () => window.removeEventListener('icon-mun-replay-intro', returnToTopBeforeReplay);
  }, []);

  const handleOpenRegister = useCallback((committeeCode?: string) => {
    if (committeeCode) {
      setSelectedCommitteeCode(committeeCode);
    }
    setIsRegisterOpen(true);
  }, []);

  const handleCloseRegister = useCallback(() => {
    setIsRegisterOpen(false);
  }, []);

  const handleVideoReady = useCallback(() => {
    ScrollTrigger.refresh();
  }, []);

  const handleHeroScrollProgress = useCallback((p: number) => {
    const isPast = p > 0.22;
    setShowNavLogo((prev) => (prev !== isPast ? isPast : prev));
  }, []);

  return (
    <SiteDataProvider>
    <div className="relative min-h-screen bg-paper text-ink selection:bg-gold/20 selection:text-accent overflow-x-hidden">
      {/* Grand Cinematic Curtain Intro & Logo Reveal with Skip Option */}
      <CinematicIntro
        isHeroReady={true}
        onExiting={() => setIsIntroExiting(true)}
        onComplete={() => {
          setIsIntroExiting(true);
          setIntroComplete(true);
        }}
      />

      {/* 3D Mask Animation Background Video with Scroll-Direction Logic */}
      <BackgroundVideoScrubber />

      {/* Global Scroll Effects: top progress bar and section navigation */}
      <GlobalScrollEffects onNavigateTo={handleNavigateTo} />

      {/* Custom Gold Ring Cursor */}
      <CustomCursor />

      {/* Top Navigation (Brand logo hidden until hero title scrolls away or intro completes) */}
      <Navigation
        onOpenRegister={handleOpenRegister}
        showBrandLogo={introComplete || showNavLogo}
      />

      {/* Content Layers with Frosted Glass Panels over Background */}
      <main className="relative z-10">
        <HeroSection
          introComplete={introComplete}
          isIntroExiting={isIntroExiting}
          onHeroReady={handleVideoReady}
          onHeroProgressChange={handleHeroScrollProgress}
          onOpenRegister={handleOpenRegister}
        />

        {/* Pinned & scroll-scrubbed sections */}
        <DiplomaticConstellation />
        <AboutSection />
        <CommitteesSection onSelectCommitteeForRegister={handleOpenRegister} />
        <ScheduleSection />
        <ConferenceInfoSection />
        <SecretariatSection />
        <RegistrationSection
          isOpenModal={isRegisterOpen}
          onCloseModal={handleCloseRegister}
          onOpenModal={handleOpenRegister}
          preselectedCommittee={selectedCommitteeCode}
        />
      </main>

      {/* Scroll-Scrubbed Footer */}
      <FooterSection />

      {/* Dev-only FPS meter: open the site with ?perf */}
      {typeof window !== 'undefined' && window.location.search.includes('perf') && <PerfHUD />}
    </div>
    </SiteDataProvider>
  );
}
