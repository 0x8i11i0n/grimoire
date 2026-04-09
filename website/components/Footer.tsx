const linksLeft = [
  { label: 'Documentation', href: '#' },
  { label: 'Architecture', href: '#' },
  { label: 'CLI Reference', href: '#' },
  { label: 'MCP Tools', href: '#' },
] as const;

const linksRight = [
  { label: 'GitHub', href: 'https://github.com/0x8i11i0n/grimoire' },
  { label: 'npm', href: 'https://www.npmjs.com/package/grimoire' },
  { label: 'Discord', href: '#' },
  { label: 'MIT License', href: '#' },
] as const;

export default function Footer() {
  return (
    <footer className="pt-16 pb-8 px-6">
      {/* Section divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-grimoire-border-light to-transparent mb-16" />

      <div className="max-w-6xl mx-auto">
        {/* Three-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 mb-12">
          {/* Left: Logo + tagline */}
          <div>
            <p className="font-serif text-grimoire-gold tracking-widest text-lg select-none mb-2">
              ◇ GRIMOIRE
            </p>
            <p className="text-grimoire-muted text-sm">
              The Soul Engine for AI
            </p>
          </div>

          {/* Center: Links in two columns */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            <div className="flex flex-col gap-2">
              {linksLeft.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-grimoire-muted hover:text-grimoire-gold text-sm transition-colors duration-200"
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              {linksRight.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.href.startsWith('http') ? '_blank' : undefined}
                  rel={
                    link.href.startsWith('http')
                      ? 'noopener noreferrer'
                      : undefined
                  }
                  className="text-grimoire-muted hover:text-grimoire-gold text-sm transition-colors duration-200"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Right: Install command */}
          <div className="flex md:justify-end">
            <div className="bg-grimoire-surface border border-grimoire-border rounded-lg px-5 py-3 inline-block">
              <p className="font-mono text-sm text-grimoire-muted">
                <span className="text-grimoire-gold/60 select-none">$ </span>
                <span className="text-grimoire-text">npm install grimoire</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-grimoire-border/30 pt-4">
          <p className="text-center text-grimoire-muted/60 text-xs">
            Built with conviction. MIT Licensed.
          </p>
        </div>
      </div>
    </footer>
  );
}
