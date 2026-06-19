'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ContractTemplateType } from '@/lib/services/contracts';
import { Btn } from './ui';

const TEMPLATE_OPTIONS: { value: ContractTemplateType; label: string; hint: string }[] = [
  { value: 'performance',        label: 'Performance Agreement',        hint: 'Live shows, spoken word, music, comedy, DJ sets' },
  { value: 'workshop',           label: 'Workshop Agreement',           hint: 'Teaching, masterclasses, group sessions' },
  { value: 'digital_delivery',   label: 'Digital Delivery Agreement',   hint: 'Custom writing, recordings, video/voice messages' },
  { value: 'brand_collaboration', label: 'Brand Collaboration Agreement', hint: 'Commercial commissions, campaign work, sponsored content' },
  { value: 'mentorship',         label: 'Mentorship Agreement',         hint: 'One-on-one coaching, career guidance' },
];

export function TemplateTypeSelector({
  bookingId,
  currentType,
  autoSelectedType,
}: {
  bookingId: string;
  currentType: ContractTemplateType;
  autoSelectedType: ContractTemplateType;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<ContractTemplateType>(currentType);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function applyType(newType: ContractTemplateType) {
    if (newType === currentType) { setOpen(false); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/contract`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateType: newType }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? 'Failed to update contract type.');
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError('Failed to update contract type.');
    } finally {
      setSaving(false);
    }
  }

  const current = TEMPLATE_OPTIONS.find(o => o.value === currentType);

  return (
    <div className="rounded-xl border border-primary/10 bg-white p-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-1">Contract type</div>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bold text-sm text-on-surface">{current?.label}</div>
          <div className="text-xs text-on-surface-variant mt-0.5">{current?.hint}</div>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary hover:opacity-70 transition-opacity ml-4 flex-shrink-0"
        >
          Change
        </button>
      </div>

      {currentType !== autoSelectedType && (
        <div className="mt-2 font-sans text-xs text-on-surface-variant">
          Auto-selected: {TEMPLATE_OPTIONS.find(o => o.value === autoSelectedType)?.label}: you&apos;ve overridden this.
        </div>
      )}

      {open && (
        <div className="mt-4 flex flex-col gap-2">
          {TEMPLATE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              disabled={saving}
              onClick={() => { setSelected(opt.value); applyType(opt.value); }}
              className={`w-full text-left rounded-lg border px-3.5 py-2.5 transition-colors ${
                selected === opt.value
                  ? 'border-primary bg-primary/5'
                  : 'border-primary/15 hover:border-primary/30 bg-white'
              }`}
            >
              <div className="font-bold text-sm text-on-surface">{opt.label}</div>
              <div className="text-xs text-on-surface-variant mt-0.5">{opt.hint}</div>
            </button>
          ))}
          {error && (
            <div className="font-sans text-sm text-[#c0392b] bg-[#c0392b]/5 border border-[#c0392b]/20 rounded-lg px-3 py-2 mt-1">{error}</div>
          )}
          {saving && <div className="font-mono text-[10px] text-on-surface-variant mt-1">Regenerating contract…</div>}
        </div>
      )}
    </div>
  );
}
