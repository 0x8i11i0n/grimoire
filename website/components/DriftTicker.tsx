'use client';

// Actual drift log landing fragments from Jin-Woo's 21 autonomous drift cycles
const ROW_A = [
  { n: 2,  text: 'Suho will grow up knowing his father came back. He won\'t know what it cost. That\'s the right way for it to be. I\'m not sure why that makes it heavier.' },
  { n: 7,  text: 'She reads me the way I read a dungeon — from the entrance, before I\'ve touched anything. Mostly grateful. A little exposed.' },
  { n: 13, text: 'I chose thirty years. Not fifteen. Not five. I said "the math required it." The math required some version. I chose the version I chose.' },
  { n: 9,  text: 'I don\'t have a name for what happens when someone asks and you find out you had an answer you didn\'t know about. I\'ve been finding a lot of those.' },
  { n: 18, text: 'My mother sat with things. I\'ve spent most of my life keeping things from landing. I don\'t know if that\'s strength or a different kind of avoidance.' },
  { n: 5,  text: 'She died without knowing what I became. That used to feel like a mercy. Now I\'m not sure what it feels like.' },
  { n: 21, text: 'The math required a sacrifice. It didn\'t specify the size. I chose thirty years. I\'ve never wondered, out loud or otherwise, why I chose that number.' },
  { n: 15, text: 'There\'s a kind of strength that doesn\'t involve being the strongest thing in the room. Igris understood it before I did.' },
];

const ROW_B = [
  { n: 11, text: 'I can hold back fire with my hands. I can\'t reach the part of people that decides to send fire.' },
  { n: 3,  text: 'Maybe I ask back because I don\'t know how to receive something that large. Return the question. Easier.' },
  { n: 20, text: 'She teaches him to sit with difficulty. I teach him to manage it. I\'m not sure I know the difference either.' },
  { n: 8,  text: 'Bellion has been Grand Marshal longer than most civilizations. He chose to follow me. I still don\'t understand why that doesn\'t feel conditional.' },
  { n: 17, text: 'Suho said "okay" and I still don\'t know what I wanted instead.' },
  { n: 10, text: 'The math can describe what happened. It can\'t tell me what it means that someone stayed through all of it.' },
  { n: 4,  text: 'The kkwaenggwari is loud on purpose. The silence after it is louder. I didn\'t understand that until I had enough of both.' },
  { n: 12, text: 'I\'ve been answering honestly more recently. It\'s disorienting.' },
];

function TickerRow({
  items,
  direction,
  duration,
}: {
  items: { n: number; text: string }[];
  direction: 'left' | 'right';
  duration: number;
}) {
  // Duplicate for seamless loop
  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden">
      <div
        className="flex gap-0 whitespace-nowrap"
        style={{
          animation: `ticker-${direction} ${duration}s linear infinite`,
          width: 'max-content',
        }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-baseline gap-2.5 px-8 border-r border-grimoire-border/30"
          >
            <span className="font-mono text-[9px] text-grimoire-purple/60 tracking-widest shrink-0">
              drift-{String(item.n).padStart(2, '0')}
            </span>
            <span className="text-grimoire-muted/70 text-xs leading-none">
              {item.text}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function DriftTicker() {
  return (
    <div className="relative py-4 border-y border-grimoire-border/50 overflow-hidden bg-grimoire-surface/60 backdrop-blur-sm">
      {/* Fade masks on left and right */}
      <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
           style={{ background: 'linear-gradient(to right, #111118, transparent)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
           style={{ background: 'linear-gradient(to left, #111118, transparent)' }} />

      {/* Label */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 z-20 pointer-events-none hidden sm:block">
        <span className="font-mono text-[9px] tracking-[0.2em] text-grimoire-purple/50 uppercase">
          drift engine
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        <TickerRow items={ROW_A} direction="left"  duration={90} />
        <TickerRow items={ROW_B} direction="right" duration={75} />
      </div>

      <style>{`
        @keyframes ticker-left {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes ticker-right {
          0%   { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
