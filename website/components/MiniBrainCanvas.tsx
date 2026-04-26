'use client';

import { useEffect, useRef } from 'react';

const STATE_URL =
  'https://raw.githubusercontent.com/0x8i11i0n/grimoire/main/registry/souls/sungjinwoo/state.json';

// Memory nodes: type, importance, initial angle, radius (fraction of R), angular speed
const NODES = [
  { t: 'ep',   imp: 0.95, a: 0.40, r: 0.37, sp: 0.0080 },
  { t: 'ep',   imp: 0.88, a: 1.20, r: 0.35, sp: 0.0065 },
  { t: 'ep',   imp: 0.82, a: 2.70, r: 0.40, sp: 0.0070 },
  { t: 'ep',   imp: 0.72, a: 4.10, r: 0.34, sp: 0.0085 },
  { t: 'ep',   imp: 0.65, a: 5.30, r: 0.38, sp: 0.0060 },
  { t: 'sem',  imp: 0.92, a: 0.90, r: 0.46, sp: 0.0055 },
  { t: 'sem',  imp: 0.85, a: 2.20, r: 0.48, sp: 0.0050 },
  { t: 'sem',  imp: 0.80, a: 3.90, r: 0.44, sp: 0.0058 },
  { t: 'sm',   imp: 0.96, a: 1.60, r: 0.29, sp: 0.0045 },
  { t: 'sm',   imp: 0.90, a: 3.40, r: 0.27, sp: 0.0050 },
  { t: 'sm',   imp: 0.85, a: 5.00, r: 0.31, sp: 0.0048 },
  { t: 'proc', imp: 0.88, a: 0.20, r: 0.43, sp: 0.0062 },
  { t: 'proc', imp: 0.82, a: 3.00, r: 0.41, sp: 0.0068 },
  { t: 'proc', imp: 0.78, a: 4.60, r: 0.46, sp: 0.0056 },
] as const;

// Qualia diamonds on outer ring
const QUALIA = [
  { a: 0.50, sp: 0.0100, col: '#f97316' },
  { a: 1.70, sp: 0.0088, col: '#f97316' },
  { a: 2.90, sp: 0.0095, col: '#8b5cf6' },
  { a: 4.00, sp: 0.0092, col: '#22c55e' },
  { a: 5.20, sp: 0.0098, col: '#f97316' },
  { a: 0.10, sp: 0.0085, col: '#8b5cf6' },
  { a: 3.50, sp: 0.0105, col: '#f97316' },
];

// Blind spot hexagons on inner ring
const HEXS = [
  { a: Math.PI / 2,              sp: 0.0035, cracked: false },
  { a: Math.PI / 2 + 2.094,     sp: 0.0032, cracked: true  },
  { a: Math.PI / 2 + 4.189,     sp: 0.0038, cracked: false },
];

const COL: Record<string, string> = {
  ep: '#3b82f6', sem: '#a855f7', sm: '#f59e0b', proc: '#06b6d4',
};

// Pairs of node indices to connect with faint threads
const THREADS = [[0,5],[1,6],[2,8],[3,9],[4,11],[7,12],[8,13]];

function hex(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number,
  cracked: boolean, alpha: number,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = cracked ? '#f97316' : '#8b5cf6';
  ctx.lineWidth = 0.8;
  ctx.shadowColor = ctx.strokeStyle;
  ctx.shadowBlur = cracked ? 10 : 6;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
  if (cracked) {
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = alpha * 0.7;
    ctx.beginPath();
    ctx.moveTo(x, y - r * 0.3);
    ctx.lineTo(x + r * 0.15, y);
    ctx.lineTo(x - r * 0.1, y + r * 0.3);
    ctx.stroke();
  }
  ctx.restore();
}

function diamond(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number,
  col: string, alpha: number, rot: number,
) {
  const w = r * 0.62;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.shadowColor = col;
  ctx.shadowBlur = 9;
  ctx.beginPath();
  ctx.moveTo(0, -r); ctx.lineTo(w, 0);
  ctx.lineTo(0, r);  ctx.lineTo(-w, 0);
  ctx.closePath();
  // facet fill
  const fg = ctx.createLinearGradient(0, -r, 0, r);
  fg.addColorStop(0, col + '55');
  fg.addColorStop(0.4, col + '22');
  fg.addColorStop(1, col + '08');
  ctx.fillStyle = fg;
  ctx.fill();
  ctx.strokeStyle = col;
  ctx.lineWidth = 0.7;
  ctx.stroke();
  // inner facet line
  ctx.globalAlpha = alpha * 0.4;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.5); ctx.lineTo(w * 0.6, 0); ctx.lineTo(0, r * 0.5);
  ctx.stroke();
  ctx.restore();
}

export default function MiniBrainCanvas({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const C = ref.current;
    if (!C) return;
    const ctx = C.getContext('2d')!;
    let raf = 0;
    let W = 0, H = 0, CX = 0, CY = 0, R = 0;
    let affection = 79;

    fetch(STATE_URL)
      .then((r) => r.json())
      .then((s) => { affection = s?.affection?.score ?? affection; })
      .catch(() => {});

    function setSize() {
      const dpr = devicePixelRatio || 1;
      const rect = C!.getBoundingClientRect();
      W = rect.width; H = rect.height;
      C!.width  = Math.round(W * dpr);
      C!.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      CX = W / 2; CY = H / 2;
      R = Math.min(W, H) / 2;
    }

    function frame(t: number) {
      ctx.clearRect(0, 0, W, H);

      // Ambient radial glow
      const bg = ctx.createRadialGradient(CX, CY, 0, CX, CY, R);
      bg.addColorStop(0,   'rgba(76,29,149,0.13)');
      bg.addColorStop(0.5, 'rgba(60,20,120,0.05)');
      bg.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Blind spot hexagons (inner ring)
      HEXS.forEach((b, i) => {
        const a = b.a + t * b.sp;
        const bsr = R * 0.21;
        hex(ctx, CX + Math.cos(a) * bsr, CY + Math.sin(a) * bsr,
          R * 0.037, b.cracked,
          0.50 + 0.12 * Math.sin(t * 0.003 + i));
      });

      // Compute node world positions
      const pos = NODES.map((n) => {
        const a = n.a + t * n.sp;
        const nr = n.r * R;
        return { x: CX + Math.cos(a) * nr, y: CY + Math.sin(a) * nr, col: COL[n.t] };
      });

      // Ambient threads
      THREADS.forEach(([i, j]) => {
        if (!pos[i] || !pos[j]) return;
        const alpha = 0.028 + 0.014 * Math.sin(t * 0.0015 + i);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(pos[i].x, pos[i].y);
        ctx.lineTo(pos[j].x, pos[j].y);
        ctx.stroke();
        ctx.restore();
      });

      // Memory nodes
      NODES.forEach((n, idx) => {
        const { x, y, col } = pos[idx];
        const decay = n.t === 'ep' ? 0.28 + n.imp * 0.42 : 0.52 + n.imp * 0.28;
        const breathe = 1 + 0.05 * Math.sin(t * 0.002 + n.a);
        const nr = (2.5 + n.imp * 4.5) * (R / 230) * breathe;
        ctx.save();
        ctx.globalAlpha = decay;
        ctx.shadowColor = col;
        ctx.shadowBlur = 11;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(1.5, nr), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Qualia diamonds (outer ring)
      QUALIA.forEach((q, i) => {
        const a = q.a + t * q.sp;
        const dr = R * 0.61;
        const alpha = 0.42 + 0.16 * Math.sin(t * 0.0018 + i * 0.9);
        const rot = t * 0.0012 * (i % 2 === 0 ? 1 : -1) + i * 0.55;
        diamond(ctx, CX + Math.cos(a) * dr, CY + Math.sin(a) * dr,
          R * 0.043, q.col, alpha, rot);
      });

      // Soul sigil (center)
      const pulse = 1 + 0.07 * Math.sin(t * 0.0022);
      const sigR = R * 0.054 * pulse;

      // Outer glow
      const glow = ctx.createRadialGradient(CX, CY, 0, CX, CY, sigR * 4.5);
      glow.addColorStop(0,   'rgba(139,92,246,0.22)');
      glow.addColorStop(0.45,'rgba(124,92,191,0.08)');
      glow.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(CX, CY, sigR * 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Main sigil disk
      ctx.save();
      ctx.shadowColor = '#8b5cf6';
      ctx.shadowBlur = 28;
      ctx.fillStyle = '#8b5cf6';
      ctx.beginPath();
      ctx.arc(CX, CY, sigR, 0, Math.PI * 2);
      ctx.fill();
      // bright inner highlight
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(168,126,240,0.75)';
      ctx.beginPath();
      ctx.arc(CX, CY, sigR * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Affection arc around sigil
      const aff = affection / 100;
      ctx.save();
      ctx.strokeStyle = '#c4a265';
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = 0.38;
      ctx.shadowColor = '#c4a265';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(CX, CY, sigR * 1.8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * aff);
      ctx.stroke();
      ctx.restore();

      raf = requestAnimationFrame(frame);
    }

    const ro = new ResizeObserver(setSize);
    ro.observe(C);
    setSize();
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className={className}
      style={{ width: '100%', height: '100%' }}
      aria-hidden="true"
    />
  );
}
