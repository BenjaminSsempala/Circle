'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';

export type MemoryCardData = {
  id: string;
  artistName: string;
  packageName: string;
  date: string | null;
  mood: string;
};

const MOOD_EMOJI: Record<string, string> = {
  magical: '✨', meaningful: '❤️', energetic: '🎉', professional: '🤝', inspiring: '🌱',
};
const MOOD_LABEL: Record<string, string> = {
  magical: 'Magical', meaningful: 'Meaningful', energetic: 'Energetic',
  professional: 'Professional', inspiring: 'Inspiring',
};

const CARD_SIZE = 220;
const DISMISS = 75;

// Rotation + offset for cards peeking behind the front
const PEEK = [
  { dx: -10, dy: 10, r: -5, scale: 0.95, opacity: 0.7 },
  { dx: 14, dy: 16, r: 6, scale: 0.90, opacity: 0.5 },
];

function fmtDate(d: string | null) {
  if (!d) return null;
  const dt = d.includes('T') ? new Date(d) : new Date(`${d}T00:00:00Z`);
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function CardFace({ m }: { m: MemoryCardData }) {
  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#002E23] via-[#005440] to-[#0a7a60]" />
      <div className="absolute bottom-1/2 -right-8 rotate-90 text-[6px] font-mono tracking-widest opacity-10 text-white select-none whitespace-nowrap pointer-events-none">
        ENGERO · engero.art
      </div>
      <div className="absolute inset-0 z-10 p-5 flex flex-col justify-between text-white">
        <span className="font-mono text-[8px] uppercase tracking-widest opacity-50">You experienced</span>
        <div className="flex flex-col gap-0.5">
          <h3 className="font-['Playfair_Display'] text-[22px] font-bold leading-tight">{m.artistName}</h3>
          <p className="font-['Playfair_Display'] italic text-[11px] opacity-75 line-clamp-1">{m.packageName}</p>
        </div>
        <div className="flex justify-between items-end border-t border-white/15 pt-2.5">
          <div>
            <div className="text-[7px] font-mono uppercase opacity-40 mb-0.5">Date</div>
            <div className="text-[10px] leading-tight">{fmtDate(m.date) ?? '-'}</div>
          </div>
          <div className="text-right">
            <div className="text-[7px] font-mono uppercase opacity-40 mb-0.5">Mood</div>
            <div className="text-[10px]">{MOOD_EMOJI[m.mood]} {MOOD_LABEL[m.mood]}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlaceholderFace() {
  return (
    <Link
      href="/discover"
      className="w-full h-full flex flex-col items-center justify-center gap-3 p-5 rounded-2xl bg-white border-2 border-dashed border-primary/25 text-center hover:border-primary/50 hover:bg-[#E1F5EE]/40 transition-all group"
    >
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg group-hover:bg-primary/20 transition-colors">
        ✦
      </div>
      <div>
        <p className="font-['Playfair_Display'] text-[13px] font-bold text-primary leading-snug">
          Your next memory is out there.
        </p>
        <p className="text-[10px] text-primary/50 mt-1.5 font-mono uppercase tracking-wide">
          Discover artists →
        </p>
      </div>
    </Link>
  );
}

export function MemoryCardStack({ memories }: { memories: MemoryCardData[] }) {
  const [idx, setIdx] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [flyDir, setFlyDir] = useState<'left' | 'right' | null>(null);
  const startX = useRef(0);

  // Always add 1 placeholder at the end
  const total = memories.length + 1;
  const isPlaceholder = (i: number) => i >= memories.length;
  const atEnd = idx >= total - 1;

  const advance = useCallback(() => {
    if (atEnd) return;
    setFlyDir('left');
    setTimeout(() => {
      setIdx(i => i + 1);
      setFlyDir(null);
      setDragX(0);
    }, 260);
  }, [atEnd]);

  const retreat = useCallback(() => {
    if (idx === 0) return;
    setFlyDir('right');
    setTimeout(() => {
      setIdx(i => i - 1);
      setFlyDir(null);
      setDragX(0);
    }, 260);
  }, [idx]);

  function onPointerDown(e: React.PointerEvent) {
    if (flyDir) return;
    startX.current = e.clientX;
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    setDragX(e.clientX - startX.current);
  }

  function onPointerUp() {
    if (!dragging) return;
    setDragging(false);
    if (dragX < -DISMISS) advance();
    else if (dragX > DISMISS) retreat();
    else setDragX(0);
  }

  // Peek cards: up to 2 cards visible behind the front
  const peekCards = Array.from({ length: Math.min(2, total - idx - 1) }).map((_, i) => ({
    cardIdx: idx + i + 1,
    cfg: PEEK[i],
  }));

  // Front card transform
  const flying = flyDir !== null;
  const tx = flying ? (flyDir === 'left' ? -500 : 500) : dragX;
  const rot = flying
    ? (flyDir === 'left' ? -20 : 20)
    : dragX * 0.08;
  const transition = dragging
    ? 'none'
    : flying
    ? 'transform 0.26s cubic-bezier(0.4, 0, 0.8, 0.6), opacity 0.26s ease'
    : 'transform 0.38s cubic-bezier(0.34, 1.4, 0.64, 1)';
  const frontOpacity = flying ? 0 : 1;

  return (
    <div className="flex flex-col items-center gap-5">

      {/* Label */}
      <div className="self-start">
        <p className="text-[9px] font-mono uppercase tracking-widest text-on-surface-variant/60">
          Memories
        </p>
      </div>

      {/* Stack */}
      <div
        className="relative select-none"
        style={{ width: CARD_SIZE, height: CARD_SIZE + 24 }}
      >
        {/* Peek cards behind */}
        {peekCards.map(({ cardIdx, cfg }, peekIdx) => (
          <div
            key={cardIdx}
            className="absolute inset-0 pointer-events-none"
            style={{
              width: CARD_SIZE,
              height: CARD_SIZE,
              transform: `translateX(${cfg.dx}px) translateY(${cfg.dy}px) rotate(${cfg.r}deg) scale(${cfg.scale})`,
              opacity: cfg.opacity,
              transformOrigin: 'center bottom',
              transition: 'transform 0.3s ease',
              zIndex: 2 - peekIdx,
            }}
          >
            {isPlaceholder(cardIdx) ? <PlaceholderFace /> : <CardFace m={memories[cardIdx]} />}
          </div>
        ))}

        {/* Front card */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none"
          style={{
            width: CARD_SIZE,
            height: CARD_SIZE,
            transform: `translateX(${tx}px) rotate(${rot}deg)`,
            opacity: frontOpacity,
            transition,
            transformOrigin: 'center bottom',
            zIndex: 10,
          }}
        >
          {isPlaceholder(idx) ? (
            <PlaceholderFace />
          ) : (
            <div
              className="w-full h-full"
              onClick={() => {
                if (Math.abs(dragX) < 6 && !flying) {
                  window.location.href = `/booking/${memories[idx].id}/memory`;
                }
              }}
            >
              <CardFace m={memories[idx]} />
            </div>
          )}
        </div>
      </div>

      {/* Counter + nav */}
      <div className="flex items-center gap-3">
        <button
          onClick={retreat}
          disabled={idx === 0}
          className="w-7 h-7 rounded-full border border-outline-variant/50 flex items-center justify-center text-on-surface-variant text-lg leading-none hover:border-primary hover:text-primary transition-colors disabled:opacity-25"
          aria-label="Previous"
        >
          ‹
        </button>
        <span className="text-[10px] font-mono text-on-surface-variant tabular-nums">
          {idx + 1} / {total}
        </span>
        <button
          onClick={advance}
          disabled={atEnd}
          className="w-7 h-7 rounded-full border border-outline-variant/50 flex items-center justify-center text-on-surface-variant text-lg leading-none hover:border-primary hover:text-primary transition-colors disabled:opacity-25"
          aria-label="Next"
        >
          ›
        </button>
      </div>

      {/* Swipe hint */}
      {!atEnd && (
        <p className="text-[8px] font-mono uppercase tracking-widest text-on-surface-variant/40">
          ← swipe to browse
        </p>
      )}
    </div>
  );
}
