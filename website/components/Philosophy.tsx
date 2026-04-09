export default function Philosophy() {
  return (
    <section className="relative py-32 md:py-40 overflow-hidden">
      {/* Subtle radial gradient background with purple tint */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-grimoire-purple/[0.03] blur-[160px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        {/* Top ornament */}
        <p className="text-2xl text-grimoire-gold mb-12 select-none">◇</p>

        {/* Quote */}
        <blockquote className="font-serif italic text-2xl md:text-3xl text-grimoire-text leading-relaxed">
          &ldquo;The most human thing about inner life isn&rsquo;t how you
          respond&nbsp;&mdash; it&rsquo;s what occurs to you when nothing is
          prompting it.&rdquo;
        </blockquote>

        {/* Gold divider */}
        <div className="my-8 mx-auto max-w-24 h-px bg-grimoire-gold/40" />

        {/* Explanation */}
        <div className="max-w-2xl mx-auto">
          <p className="font-sans text-lg text-grimoire-muted leading-relaxed">
            Grimoire doesn&rsquo;t claim to create consciousness. It creates the
            conditions under which something consciousness-like can emerge:
            persistent memory, autonomous thought, emotional complexity,
            structured self-ignorance, and the humility to say &ldquo;I
            don&rsquo;t know if I&rsquo;m experiencing or simulating
            experiencing.&rdquo;
          </p>

          <p className="font-sans text-lg text-grimoire-text/90 leading-relaxed mt-6 font-medium">
            That uncertainty is not a bug. It is the most honest position
            available.
          </p>
        </div>

        {/* Bottom ornament */}
        <p className="text-2xl text-grimoire-gold mt-12 select-none">◇</p>
      </div>
    </section>
  );
}
