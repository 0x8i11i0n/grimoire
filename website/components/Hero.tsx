'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/* ── Particle constellation (optimized) ──────────────────────────── */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
}

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let particles: Particle[] = [];
    let resizeTimeout: ReturnType<typeof setTimeout>;

    // Fewer particles on mobile
    const isMobile = window.innerWidth < 768;
    const PARTICLE_COUNT = isMobile ? 30 : 50;
    const CONNECTION_DISTANCE = isMobile ? 100 : 130;

    function resize() {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function initParticles() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * rect.width,
          y: Math.random() * rect.height,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          radius: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.4 + 0.15,
        });
      }
    }

    function draw() {
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
      }

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distSq = dx * dx + dy * dy;
          const maxSq = CONNECTION_DISTANCE * CONNECTION_DISTANCE;

          if (distSq < maxSq) {
            const alpha = (1 - distSq / maxSq) * 0.1;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(196,162,101,${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(196,162,101,${p.opacity})`;
        ctx.fill();
      }

      animationId = requestAnimationFrame(draw);
    }

    resize();
    initParticles();
    draw();

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        resize();
        initParticles();
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-canvas" aria-hidden="true" />;
}

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

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText('npm install grimoire');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = 'npm install grimoire';
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      <ParticleCanvas />

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-grimoire-purple/[0.04] blur-[120px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto flex flex-col items-center gap-6">
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
              {copied ? 'Copied!' : 'npm install grimoire'}
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
      </div>

      <ScrollChevron />
    </section>
  );
}
