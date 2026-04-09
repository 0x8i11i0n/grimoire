'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/* ------------------------------------------------------------------ */
/*  Particle constellation canvas                                     */
/* ------------------------------------------------------------------ */

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

    const PARTICLE_COUNT = 60;
    const CONNECTION_DISTANCE = 140;
    const GOLD_R = 196;
    const GOLD_G = 162;
    const GOLD_B = 101;

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
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          radius: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.5 + 0.2,
        });
      }
    }

    function draw() {
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      // Update positions
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
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECTION_DISTANCE) {
            const alpha = (1 - dist / CONNECTION_DISTANCE) * 0.12;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${GOLD_R},${GOLD_G},${GOLD_B},${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${GOLD_R},${GOLD_G},${GOLD_B},${p.opacity})`;
        ctx.fill();
      }

      animationId = requestAnimationFrame(draw);
    }

    resize();
    initParticles();
    draw();

    window.addEventListener('resize', () => {
      resize();
      initParticles();
    });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="particle-canvas"
      aria-hidden="true"
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Scroll-down chevron                                               */
/* ------------------------------------------------------------------ */

function ScrollChevron() {
  return (
    <a
      href="#systems"
      onClick={(e) => {
        e.preventDefault();
        document.querySelector('#systems')?.scrollIntoView({ behavior: 'smooth' });
      }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 text-grimoire-muted/60 hover:text-grimoire-gold transition-colors duration-300 animate-bounce"
      aria-label="Scroll down"
    >
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </a>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero section                                                      */
/* ------------------------------------------------------------------ */

export default function Hero() {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText('npm install grimoire');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = 'npm install grimoire';
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Particle background */}
      <ParticleCanvas />

      {/* Subtle radial glow behind content */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-grimoire-purple/[0.04] blur-[120px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto flex flex-col items-center gap-6">
        {/* Title */}
        <h1 className="font-serif text-grimoire-gold tracking-[0.25em] text-4xl sm:text-5xl md:text-6xl lg:text-7xl animate-fade-in select-none">
          ◇&nbsp;GRIMOIRE&nbsp;◇
        </h1>

        {/* Tagline */}
        <p className="font-serif italic text-grimoire-muted text-xl sm:text-2xl animate-fade-in [animation-delay:200ms]">
          Memory. Consciousness. Soul.
        </p>

        {/* Description */}
        <p className="font-sans text-grimoire-text/80 text-base sm:text-lg max-w-2xl leading-relaxed animate-fade-in [animation-delay:400ms]">
          The framework that gives AI persistent identity, autonomous thought,
          and emotional depth.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-2 animate-fade-in [animation-delay:600ms]">
          <button
            onClick={handleCopy}
            className="btn-primary group relative"
          >
            <span className="font-mono text-sm">
              {copied ? 'Copied!' : 'npm install grimoire'}
            </span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${
                copied ? 'scale-110 text-grimoire-gold-bright' : 'group-hover:scale-110'
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              {copied ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              )}
            </svg>
          </button>

          <a
            href="#demo"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector('#demo')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="btn-secondary"
          >
            Talk to a Soul
            <span aria-hidden="true" className="ml-1">&rarr;</span>
          </a>
        </div>

        {/* Stats line */}
        <p className="text-grimoire-muted text-xs sm:text-sm font-mono mt-2 animate-fade-in [animation-delay:800ms]">
          <span className="text-grimoire-gold/60">&#9733;</span>{' '}
          MIT Licensed{' '}
          <span className="text-grimoire-border-light mx-1">&middot;</span>{' '}
          34 TypeScript files{' '}
          <span className="text-grimoire-border-light mx-1">&middot;</span>{' '}
          15 MCP tools{' '}
          <span className="text-grimoire-border-light mx-1">&middot;</span>{' '}
          12 soul systems
        </p>
      </div>

      {/* Scroll chevron */}
      <ScrollChevron />
    </section>
  );
}
