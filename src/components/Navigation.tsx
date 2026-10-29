import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

interface NavigationProps {
  onOpenRegister: () => void;
  showBrandLogo: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  onOpenRegister,
  showBrandLogo,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on Escape key or window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handleMobileNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 150);
  };

  return (
    <>
      <header
        data-theme="dark"
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 pt-[env(safe-area-inset-top,0px)] ${
          showBrandLogo || isMobileMenuOpen
            ? 'bg-transparent border-b border-gold/25 shadow-[0_4px_30px_rgba(0,0,0,0.5)]'
            : 'bg-transparent pointer-events-none'
        }`}
      >
        <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between gap-4 md:gap-8 px-4 sm:px-6 lg:px-12 pointer-events-auto">
          {/* Zone 1: Mask Motif + Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="#"
              className={`flex items-center gap-2.5 transition-all duration-400 min-h-[44px] min-w-[44px] ${
                showBrandLogo
                  ? 'opacity-100 translate-x-0 pointer-events-auto'
                  : 'opacity-0 -translate-x-3 pointer-events-none md:opacity-0'
              }`}
            >
              {/* Logo Mask Motif */}
              <div id="nav-brand-logo" className="h-11 w-11 shrink-0 rounded-full bg-[#E7DBC3] flex items-center justify-center">
                <img
                  src="https://d2ol7oe51mr4n9.cloudfront.net/user_3L3BcEGyaQpmkmEhNe5xVxLe3my/9798219d-d695-44ba-ac50-1a0b70e05a70.jpg"
                  alt="ICON MUN emblem"
                  className="h-full w-full rounded-full object-cover"
                  loading="lazy"
                />
              </div>
              <span className="font-cinzel text-base sm:text-xl font-bold uppercase tracking-[0.22em] text-accent whitespace-nowrap">
                ICON MUN
              </span>
            </a>
          </div>

          {/* Zone 2: Desktop 4–5 single-line navigation links */}
          <nav
            className={`hidden md:flex items-center gap-8 text-xs uppercase tracking-[0.2em] font-medium transition-all duration-300 ${
              showBrandLogo ? 'text-ink2' : 'text-ink2/75 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]'
            }`}
          >
            <a
              href="#about"
              className="hover:text-accent transition-colors whitespace-nowrap shrink-0 py-2"
            >
              About
            </a>
            <a
              href="#committees"
              className="hover:text-accent transition-colors whitespace-nowrap shrink-0 py-2"
            >
              Councils (TBA)
            </a>
            <a
              href="#schedule"
              className="hover:text-accent transition-colors whitespace-nowrap shrink-0 py-2"
            >
              Timeline (TBA)
            </a>
            <a
              href="#conference-info"
              className="hover:text-accent transition-colors whitespace-nowrap shrink-0 py-2"
            >
              Visitor guide
            </a>
            <a
              href="#secretariat"
              className="hover:text-accent transition-colors whitespace-nowrap shrink-0 py-2"
            >
              Secretariat
            </a>
          </nav>

          {/* Zone 3: Desktop Register CTA + Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <a href="/portal" className="hidden lg:inline-flex min-h-[44px] items-center px-2 text-[10px] uppercase tracking-[.14em] text-ink2 transition hover:text-accent">Applicant portal</a>
            <button
              type="button"
              onClick={onOpenRegister}
              className="hidden sm:inline-flex gold-btn-primary px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] rounded-sm whitespace-nowrap shrink-0 cursor-pointer shadow-md min-h-[44px] items-center justify-center"
            >
              Register (TBA)
            </button>

            {/* Mobile Hamburger Button (at least 44x44px hitbox) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileMenuOpen}
              className="md:hidden flex h-11 w-11 items-center justify-center rounded-lg border border-gold/30 bg-surface/80 text-accent transition-all hover:border-gold hover:bg-surface2 active:scale-95 cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Full-Screen Mobile Navigation Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden flex flex-col justify-between bg-paper/98 backdrop-blur-2xl text-ink pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] px-6 overflow-y-auto min-h-screen-dvh"
        >
          {/* Header Row in Mobile Menu */}
          <div className="flex items-center justify-between border-b border-gold/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 shrink-0 rounded-full bg-[#E7DBC3] flex items-center justify-center">
                <img
                  src="/brand/logo-mark.webp"
                  alt="ICON MUN emblem"
                  className="h-[86%] w-[86%] object-contain"
                />
              </div>
              <span className="font-cinzel text-lg font-bold uppercase tracking-[0.22em] text-accent">
                ICON MUN
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close menu"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/30 bg-surface2 text-accent active:scale-95 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links list (48px+ tap height) */}
          <nav className="my-auto py-8 flex flex-col gap-3">
            {[
              { id: 'about', label: '01. About (TBA)' },
              { id: 'committees', label: '02. Councils (TBA)' },
              { id: 'schedule', label: '03. Itinerary (TBA)' },
              { id: 'conference-info', label: '04. Conference guide & FAQ' },
              { id: 'secretariat', label: '05. High Secretariat' },
              { id: 'registration', label: '06. Registry (TBA)' },
            ].map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => handleMobileNavClick(e, item.id)}
                className="flex items-center justify-between min-h-[52px] px-4 py-3 rounded-xl border border-ink/5 bg-surface/60 font-cinzel text-lg tracking-[0.15em] text-ink hover:text-accent hover:border-gold/40 active:bg-gold/10 transition-all cursor-pointer"
              >
                <span>{item.label}</span>
                <span className="text-xs text-gold font-mono">→</span>
              </a>
            ))}
          </nav>

          {/* Bottom Action Area */}
          <div className="space-y-4 pt-4 border-t border-gold/20">
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenRegister();
              }}
              className="gold-btn-primary w-full py-4 text-xs font-bold uppercase tracking-[0.25em] rounded-xl flex items-center justify-center min-h-[48px] shadow-lg cursor-pointer"
            >
              Register Interest (TBA)
            </button>
            <a href="/portal" onClick={() => setIsMobileMenuOpen(false)} className="flex min-h-[48px] w-full items-center justify-center rounded-xl border border-gold/30 text-xs uppercase tracking-[.2em] text-accent transition hover:bg-gold/10">Applicant portal</a>
            <p className="text-center text-[10px] uppercase tracking-[0.25em] text-ink3">
              ICON MUN 2027 · Premier Model UN
            </p>
          </div>
        </div>
      )}
    </>
  );
};
