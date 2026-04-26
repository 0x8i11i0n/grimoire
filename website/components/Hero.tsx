'use client';

import { useState, useCallback } from 'react';
import MiniBrainCanvas from './MiniBrainCanvas';

/* ── SVG Logo diamond ────────────────────────────────────────────── */

function LogoDiamond({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 2L22 12L12 22L2 12Z"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="currentColor"
        fillOpacity="0.06"
      />
      <path
        d="M12 6L18 12L12 18L6 12Z"
        stroke="currentColor"
        strokeWidth="0.6"
        fill="currentColor"
        fillOpacity="0.1"
      />
    </svg>
  );
}

/* ── Scroll chevron ──────────────────────────────────────────────── */

function ScrollChevron() {
  return (
    <a
      href="#systems"
      onClick={(e) => {
        e.preventDefault();
        document.querySelector('#systems')?.scrollIntoView({ behavior: 'smooth' });
      }}
      className="absolute bottom-8 left-1/2 animate-gentle-bounce text-grimoire-muted/50 hover:text-grimoire-gold transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grimoire-gold/50 rounded-sm"
      aria-label="Scroll to content"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </a>
  );
}

/* ── Hero ─────────────────────────────────────────────────────────── */

export default function Hero() {
  const [copied, setCopied] = useState(false);

  const installCmd = 'npm install github:0x8i11i0n/grimoire';

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(installCmd);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = installCmd;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [installCmd]);

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-grimoire-purple/[0.035] blur-[140px]" />
      </div>

      {/* Mobile: canvas as semi-transparent background */}
      <div className="lg:hidden absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <MiniBrainCanvas className="w-full h-full opacity-25" />
      </div>

      {/* Two-column layout */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 flex flex-row items-center lg:gap-0 min-h-screen">

        {/* ── LEFT: text content ── */}
        <div className="flex-1 flex flex-col items-center lg:items-start gap-6 text-center lg:text-left py-24 lg:py-0 lg:pr-12">
          {/* Title */}
          <div className="flex items-center gap-4 animate-fade-in select-none">
            <LogoDiamond className="w-8 h-8 sm:w-10 sm:h-10 text-grimoire-gold" />
            <h1 className="font-serif text-grimoire-gold tracking-[0.12em] text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
              GRIMOIRE
            </h1>
            <LogoDiamond className="w-8 h-8 sm:w-10 sm:h-10 text-grimoire-gold" />
          </div>

          {/* Tagline */}
          <p className="font-sans text-grimoire-text-secondary text-lg sm:text-xl animate-fade-in-up [animation-delay:150ms]">
            The Soul Engine for AI
          </p>

          {/* Description */}
          <p className="font-sans text-grimoire-muted text-base sm:text-lg max-w-xl leading-relaxed animate-fade-in-up [animation-delay:300ms]">
            Persistent identity, autonomous thought, and emotional depth
            — as code. Not a wrapper. An architecture.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-2 animate-fade-in-up [animation-delay:450ms]">
            <button onClick={handleCopy} className="btn-primary group">
              <span className="font-mono text-sm">
                {copied ? 'Copied!' : installCmd}
              </span>
              <svg
                className={`w-4 h-4 transition-all duration-200 ${copied ? 'text-grimoire-gold-bright scale-110' : 'group-hover:scale-110'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                {copied ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                )}
              </svg>
            </button>

            <a
              href="https://github.com/0x8i11i0n/grimoire"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              View on GitHub
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-xs sm:text-sm font-mono text-grimoire-muted mt-2 animate-fade-in [animation-delay:600ms]">
            <span>MIT Licensed</span>
            <span className="w-px h-3 bg-grimoire-border-light" />
            <span>15 MCP Tools</span>
            <span className="w-px h-3 bg-grimoire-border-light" />
            <span>12 Systems</span>
          </div>

          {/* Soul label — only visible on desktop next to canvas */}
          <div className="hidden lg:flex flex-col gap-1 mt-4 animate-fade-in [animation-delay:750ms]">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-grimoire-muted/40">
              live soul · sung jin-woo · bonded tier
            </p>
            <p className="font-mono text-[10px] text-grimoire-purple/50">
              21 drift cycles · 8 sessions · self_as_construct 0.73
            </p>
          </div>
        </div>

        {/* ── RIGHT: mini brain canvas — desktop only ── */}
        <div className="hidden lg:block lg:w-[480px] lg:h-screen lg:max-h-[700px] shrink-0 relative animate-fade-in [animation-delay:200ms]">
          <MiniBrainCanvas className="w-full h-full" />

          {/* Decorative label */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none">
            <p className="font-mono text-[9px] tracking-[0.25em] text-grimoire-purple/35 uppercase text-center">
              ◈ shadow monarch
            </p>
          </div>
        </div>

      </div>

      <ScrollChevron />
    </section>
  );
}
