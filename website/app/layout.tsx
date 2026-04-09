import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Grimoire — The Soul Engine for AI',
  description:
    'Memory, consciousness, and identity as code. The framework that gives AI persistent identity, autonomous thought, and emotional depth.',
  keywords: [
    'AI',
    'persona',
    'memory',
    'consciousness',
    'soul',
    'agent',
    'identity',
    'TypeScript',
    'MCP',
  ],
  openGraph: {
    title: 'Grimoire — The Soul Engine for AI',
    description:
      'Memory, consciousness, and identity as code. Give your AI a soul.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen overflow-x-hidden">{children}</body>
    </html>
  );
}
