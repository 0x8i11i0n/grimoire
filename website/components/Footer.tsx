const links = [
  { label: 'GitHub', href: 'https://github.com/0x8i11i0n/grimoire' },
  { label: 'npm', href: 'https://www.npmjs.com/package/grimoire' },
  { label: 'MIT License', href: 'https://github.com/0x8i11i0n/grimoire/blob/main/LICENSE' },
] as const;

export default function Footer() {
  return (
    <footer className="pt-20 pb-8 px-6">
      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-grimoire-border to-transparent mb-16 max-w-6xl mx-auto" />

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-12">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="text-grimoire-gold">
              <path d="M10 1L18.66 6v8L10 19 1.34 14V6L10 1z" stroke="currentColor" strokeWidth="1.2" fill="none" />
              <path d="M10 5L15 8v4l-5 3-5-3V8l5-3z" stroke="currentColor" strokeWidth="0.8" fill="currentColor" fillOpacity="0.08" />
            </svg>
            <span className="font-serif text-grimoire-gold tracking-wider text-lg select-none">GRIMOIRE</span>
            <span className="text-grimoire-muted text-sm ml-2 hidden sm:inline">The Soul Engine for AI</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-grimoire-muted hover:text-grimoire-gold text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grimoire-gold/50 rounded-sm"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Install + copyright */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-grimoire-border/30 pt-6">
          <div className="bg-grimoire-surface border border-grimoire-border rounded-lg px-4 py-2">
            <p className="font-mono text-sm text-grimoire-muted">
              <span className="text-grimoire-gold/50 select-none">$ </span>
              <span className="text-grimoire-text-secondary">npm install grimoire</span>
            </p>
          </div>
          <p className="text-grimoire-muted/60 text-xs">
            Built with conviction. MIT Licensed.
          </p>
        </div>
      </div>
    </footer>
  );
}
