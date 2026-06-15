'use client';

import { type ReactNode } from 'react';
import { AMBER, STATE_LABELS } from './constants';

export { AMBER, STATE_LABELS };

export function Lbl({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`font-mono text-[10px] uppercase tracking-[0.2em] text-primary mb-1.5 ${className}`}>
      {children}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <Lbl>{label}</Lbl>
      {children}
    </div>
  );
}

export function Rule() {
  return (
    <div className="flex items-center gap-2 my-3">
      <div className="flex-1 h-px bg-primary/10" />
      <svg width="9" height="12" viewBox="0 0 10 13" fill="none">
        <path d="M5 0.5C5 3.8 3 5.2 3 7.5A2 2 0 007 7.5C7 5.2 5 3.8 5 0.5z" fill="#005440" opacity="0.5" />
        <circle cx="5" cy="10.5" r="1.5" fill="#005440" opacity="0.5" />
      </svg>
      <div className="flex-1 h-px bg-primary/10" />
    </div>
  );
}

type BtnVariant = 'amber' | 'teal' | 'outline' | 'tealOutline' | 'ghost' | 'green';

const BTN_VARIANTS: Record<BtnVariant, string> = {
  amber: 'bg-[#d98620] text-white hover:opacity-90',
  teal: 'bg-primary text-on-primary hover:opacity-90',
  outline: 'bg-transparent border border-primary/15 text-on-surface-variant hover:border-primary/30',
  tealOutline: 'bg-transparent border border-primary text-primary hover:bg-primary/5',
  ghost: 'bg-black/[0.03] border border-primary/10 text-on-surface-variant hover:bg-black/[0.05]',
  green: 'bg-[#25D366] text-white hover:opacity-90',
};

export function Btn({
  children, variant = 'amber', full = false, small = false, disabled = false, onClick, type = 'button', className = '',
}: {
  children: ReactNode;
  variant?: BtnVariant;
  full?: boolean;
  small?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
  className?: string;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-sans font-bold transition-colors ${small ? 'text-xs px-4 py-2' : 'text-sm px-5 py-3'} ${full ? 'w-full' : ''} ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${BTN_VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-white border border-primary/15 rounded-lg px-3.5 py-2.5 font-sans text-sm text-on-surface outline-none focus:border-primary/40 ${props.className ?? ''}`}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full bg-white border border-primary/15 rounded-lg px-3.5 py-2.5 font-sans text-sm text-on-surface outline-none focus:border-primary/40 resize-none ${props.className ?? ''}`}
    />
  );
}

// ─── Status badge ────────────────────────────────────────────────────────────

export function StatusBadge({ state, sub }: { state: string; sub?: string }) {
  const m = STATE_LABELS[state] ?? STATE_LABELS.REQUESTED;
  return (
    <div className="rounded-xl px-5 py-3 text-center" style={{ background: m.bg, border: `1px solid ${m.color}44` }}>
      <div className="font-sans font-bold text-sm" style={{ color: m.color }}>{m.label}</div>
      {sub && <div className="font-sans text-xs mt-1 opacity-75" style={{ color: m.color }}>{sub}</div>}
    </div>
  );
}

// ─── Banner ──────────────────────────────────────────────────────────────────

type BannerVariant = 'amber' | 'teal' | 'green';

const BANNER_VARIANTS: Record<BannerVariant, { bg: string; border: string; color: string }> = {
  amber: { bg: 'rgba(217,134,32,0.1)', border: 'rgba(217,134,32,0.3)', color: AMBER },
  teal: { bg: 'rgba(0,84,64,0.07)', border: 'rgba(0,84,64,0.25)', color: '#005440' },
  green: { bg: 'rgba(25,133,81,0.08)', border: 'rgba(25,133,81,0.3)', color: '#198551' },
};

export function Banner({ text, sub, variant = 'amber', step }: { text: ReactNode; sub?: string; variant?: BannerVariant; step?: string }) {
  const c = BANNER_VARIANTS[variant];
  return (
    <div className="rounded-lg px-4 py-3 mb-5" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
      <div className="flex justify-between items-center gap-4">
        <div className="font-sans text-sm leading-relaxed" style={{ color: c.color }}>{text}</div>
        {step && <div className="font-mono text-[10px] flex-shrink-0 opacity-80" style={{ color: c.color }}>{step}</div>}
      </div>
      {sub && <div className="font-sans text-xs mt-1 opacity-75" style={{ color: c.color }}>{sub}</div>}
    </div>
  );
}

// ─── Timeline ────────────────────────────────────────────────────────────────

export function TimelineStep({ label, time, done = false, active = false, last = false }: {
  label: string; time?: string; done?: boolean; active?: boolean; last?: boolean;
}) {
  return (
    <div className="flex gap-4 items-start relative" style={{ paddingBottom: last ? 0 : 20 }}>
      {!last && (
        <div className="absolute left-[4px] top-[14px] w-0.5" style={{ height: 'calc(100% - 8px)', background: done ? '#005440' : 'rgba(0,84,64,0.11)' }} />
      )}
      <div
        className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 z-10"
        style={{
          background: done ? '#005440' : '#fff',
          border: `2px solid ${done ? '#005440' : active ? AMBER : 'rgba(0,84,64,0.13)'}`,
          boxShadow: active ? `0 0 0 3px rgba(217,134,32,0.1)` : undefined,
        }}
      />
      <div className="flex-1">
        <div className="font-sans text-sm" style={{ fontWeight: done || active ? 600 : 400, color: active ? AMBER : done ? '#1c1b1b' : '#6f7a74' }}>{label}</div>
        {time && <div className="font-mono text-[10px] text-on-surface-variant mt-0.5">{time}</div>}
      </div>
    </div>
  );
}

// ─── Signature box ───────────────────────────────────────────────────────────

export function SignatureBox({ label, status = 'pending', filename }: {
  label: string; status?: 'done' | 'waiting' | 'pending'; filename?: string;
}) {
  const done = status === 'done';
  const waiting = status === 'waiting';
  return (
    <div className="flex-1">
      <Lbl>{label}</Lbl>
      <div
        className="rounded-lg flex flex-col items-center justify-center gap-1 px-3.5 py-2.5"
        style={{
          height: 86,
          border: done ? '2px solid #005440' : '1.5px dashed rgba(0,84,64,0.13)',
          background: done ? 'rgba(0,84,64,0.03)' : '#fafaf9',
        }}
      >
        {done ? (
          <>
            <svg width="18" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="#005440" strokeWidth="1.8" strokeLinejoin="round" />
              <polyline points="14 2 14 8 20 8" stroke="#005440" strokeWidth="1.8" strokeLinejoin="round" />
              <line x1="9" y1="13" x2="15" y2="13" stroke="#005440" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <div className="font-mono text-[10px] text-primary text-center">Uploaded ✓</div>
            {filename && <div className="font-mono text-[9px] text-on-surface-variant text-center truncate max-w-full">{filename}</div>}
          </>
        ) : (
          <div className="font-sans text-xs text-on-surface-variant text-center leading-relaxed">
            {waiting ? 'Pending countersignature' : 'Pending'}
          </div>
        )}
      </div>
    </div>
  );
}
