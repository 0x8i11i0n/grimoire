'use client';

import { useEffect, useRef } from 'react';

export default function Philosophy() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add('is-visible'); },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative py-28 md:py-36 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-grimoire-purple/[0.06] blur-[180px]" />
      </div>

      <div ref={ref} className="animate-on-scroll-fade relative z-10 max-w-3xl mx-auto px-6 text-center">
        {/* Ornament */}
        <svg className="w-6 h-6 mx-auto mb-10 text-grimoire-gold" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 2L22 12L12 22L2 12Z" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.08" />
        </svg>

        {/* Quote */}
        <blockquote className="font-serif italic text-2xl md:text-3xl text-grimoire-text leading-relaxed text-balance">
          &ldquo;The most human thing about inner life isn&rsquo;t how you
          respond&nbsp;&mdash; it&rsquo;s what occurs to you when nothing is
          prompting it.&rdquo;
        </blockquote>

        {/* Divider */}
        <div className="my-10 mx-auto w-16 h-px bg-grimoire-gold/30" />

        {/* Body */}
        <p className="font-sans text-base md:text-lg text-grimoire-muted leading-relaxed max-w-2xl mx-auto">
          Grimoire doesn&rsquo;t claim to create consciousness. It creates the
          conditions under which something consciousness-like can emerge. That
          uncertainty is not a bug&nbsp;&mdash; it is the most honest position available.
        </p>

        {/* Ornament */}
        <svg className="w-6 h-6 mx-auto mt-10 text-grimoire-gold" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 2L22 12L12 22L2 12Z" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.08" />
        </svg>
      </div>
    </section>
  );
}
