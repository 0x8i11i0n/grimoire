'use client';

import { useState, useEffect, useCallback } from 'react';

const navLinks = [
  { label: 'Systems', href: '#systems' },
  { label: 'Compare', href: '#compare' },
  { label: 'Get Started', href: '#quickstart' },
  { label: 'Registry', href: '/grimoire/registry' },
];

function GrimoireLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="flex-shrink-0">
      <path d="M10 1L18.66 6v8L10 19 1.34 14V6L10 1z" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <path d="M10 5L15 8v4l-5 3-5-3V8l5-3z" stroke="currentColor" strokeWidth="0.8" fill="currentColor" fillOpacity="0.08" />
      <circle cx="10" cy="10" r="1.5" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <div className="relative w-5 h-4 flex flex-col justify-between">
      <span className={`block h-px w-full bg-grimoire-gold transition-all duration-300 origin-center ${open ? 'rotate-45 translate-y-[7px]' : ''}`} />
      <span className={`block h-px w-full bg-grimoire-gold transition-all duration-300 ${open ? 'opacity-0 scale-x-0' : ''}`} />
      <span className={`block h-px w-full bg-grimoire-gold transition-all duration-300 origin-center ${open ? '-rotate-45 -translate-y-[7px]' : ''}`} />
    </div>
  );
}

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Track active section
  useEffect(() => {
    const sectionIds = navLinks.filter((l) => l.href.startsWith('#')).map((l) => l.href.slice(1));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleNavClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      if (href.startsWith('#')) {
        e.preventDefault();
        document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
        setMobileOpen(false);
      } else {
        setMobileOpen(false);
      }
    },
    [],
  );

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-grimoire-bg/90 backdrop-blur-md border-b border-grimoire-border/50'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 flex items-center justify-between h-16">
          {/* Logo */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 text-grimoire-gold hover:text-grimoire-gold-bright transition-colors duration-300 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grimoire-gold/50 rounded-sm"
          >
            <GrimoireLogo />
            <span className="font-serif tracking-wider text-lg">GRIMOIRE</span>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`relative text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grimoire-gold/50 rounded-sm px-1 py-0.5 ${
                  activeSection === link.href.slice(1)
                    ? 'text-grimoire-gold'
                    : 'text-grimoire-muted hover:text-grimoire-text'
                }`}
              >
                {link.label}
                {activeSection === link.href.slice(1) && (
                  <span className="absolute -bottom-1 left-0 right-0 h-px bg-grimoire-gold/60" />
                )}
              </a>
            ))}
            <a
              href="https://github.com/0x8i11i0n/grimoire"
              target="_blank"
              rel="noopener noreferrer"
              className="text-grimoire-muted hover:text-grimoire-text transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grimoire-gold/50 rounded-sm"
              aria-label="GitHub"
            >
              <GitHubIcon className="w-5 h-5" />
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 -mr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grimoire-gold/50 rounded-sm"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            <HamburgerIcon open={mobileOpen} />
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile drawer */}
      <div
        className={`fixed top-0 right-0 z-[60] h-full w-64 bg-grimoire-surface border-l border-grimoire-border transform transition-transform duration-300 ease-out md:hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Close button inside drawer */}
        <button
          className="absolute top-5 right-5 p-2 text-grimoire-muted hover:text-grimoire-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grimoire-gold/50 rounded-sm"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col pt-20 px-6 gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className={`py-3 transition-colors duration-200 border-b border-grimoire-border/30 text-sm ${
                activeSection === link.href.slice(1)
                  ? 'text-grimoire-gold'
                  : 'text-grimoire-muted hover:text-grimoire-text'
              }`}
            >
              {link.label}
            </a>
          ))}
          <a
            href="https://github.com/0x8i11i0n/grimoire"
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 flex items-center gap-2 text-grimoire-muted hover:text-grimoire-text transition-colors duration-200 text-sm"
          >
            <GitHubIcon className="w-4 h-4" />
            GitHub
          </a>
        </div>
      </div>
    </>
  );
}
