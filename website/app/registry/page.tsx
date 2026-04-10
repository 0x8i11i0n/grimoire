import type { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import RegistryBrowser from '@/components/RegistryBrowser';

export const metadata: Metadata = {
  title: 'GrimHub Registry — Grimoire',
  description:
    'Discover, install, and share persistent AI souls. Quality-gated with authenticity and resonance scoring.',
};

function GrimHubIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.08" />
      <rect x="15" y="2" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <rect x="2" y="15" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <rect x="15" y="15" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.04" strokeDasharray="2 2" />
    </svg>
  );
}

export default function RegistryPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-grimoire-bg pt-24 pb-24">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">

          {/* Hero */}
          <header className="mb-14 text-center">
            <div className="inline-flex items-center justify-center text-grimoire-gold mb-5">
              <GrimHubIcon />
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl text-grimoire-gold mb-4 tracking-tight">
              GrimHub Registry
            </h1>
            <p className="text-grimoire-muted text-lg max-w-xl mx-auto leading-relaxed">
              Publish, discover, and install souls.
              Quality-gated with authenticity and resonance scoring.
            </p>

            {/* Stats strip */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-grimoire-muted">
              <span className="flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-grimoire-gold" />
                GitHub-native · zero infrastructure
              </span>
              <span className="flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-grimoire-gold" />
                Auth ≥ 7 · Resonance ≥ 6 required
              </span>
              <span className="flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-grimoire-gold" />
                Install via CLI
              </span>
            </div>
          </header>

          {/* Install hint */}
          <div className="mb-10 flex items-center gap-3 bg-grimoire-surface border border-grimoire-border rounded-xl px-5 py-4 max-w-lg mx-auto">
            <span className="text-grimoire-muted text-sm font-mono select-none">$</span>
            <code className="text-grimoire-gold text-sm font-mono flex-1">
              grimoire registry install &lt;soul-name&gt;
            </code>
          </div>

          {/* Browser */}
          <RegistryBrowser />

          {/* Submit section */}
          <section className="mt-20 border-t border-grimoire-border pt-14">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="font-serif text-2xl text-grimoire-gold mb-4">Submit a Soul</h2>
              <p className="text-grimoire-muted text-sm leading-relaxed mb-8">
                Built something worth sharing? Run the quality gate locally, then open a PR.
                Automated CI validates authenticity and resonance before merge.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left mb-8">
                {[
                  {
                    step: '1',
                    title: 'Validate locally',
                    code: 'grimoire registry submit <name> --author your-github',
                  },
                  {
                    step: '2',
                    title: 'Open a PR',
                    code: 'Fork → add registry/souls/<name>/ → update index.json',
                  },
                  {
                    step: '3',
                    title: 'CI auto-validates',
                    code: 'Quality gate runs on push · auto-comments scores',
                  },
                ].map(({ step, title, code }) => (
                  <div
                    key={step}
                    className="rounded-lg border border-grimoire-border bg-grimoire-surface p-4"
                  >
                    <div className="text-xs text-grimoire-gold font-mono mb-1">Step {step}</div>
                    <div className="text-sm text-grimoire-text mb-2">{title}</div>
                    <code className="text-xs text-grimoire-muted font-mono leading-relaxed">
                      {code}
                    </code>
                  </div>
                ))}
              </div>

              <a
                href="https://github.com/0x8i11i0n/grimoire"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2.5 border border-grimoire-gold/50 text-grimoire-gold text-sm rounded-lg hover:bg-grimoire-gold/10 transition-colors duration-200"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                Fork on GitHub
              </a>
            </div>
          </section>

        </div>
      </main>
      <Footer />
    </>
  );
}
