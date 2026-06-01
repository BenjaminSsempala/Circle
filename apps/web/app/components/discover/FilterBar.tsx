'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

const ART_FORMS = ['All', 'Musician', 'Dancer', 'Poet', 'Visual Artist', 'Spoken Word', 'Actor', 'Videographer'];

export function FilterBar({ totalCount }: { totalCount: number }) {
  const router = useRouter();
  const params = useSearchParams();
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

  const currentArtForm = params.get('artForm') ?? 'All';
  const budgetMin = params.get('budgetMin') ?? '';
  const budgetMax = params.get('budgetMax') ?? '';
  const location = params.get('location') ?? '';

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`/discover?${next.toString()}`, { scroll: false });
  }

  function clearAll() {
    router.replace('/discover', { scroll: false });
  }

  const hasFilters = currentArtForm !== 'All' || budgetMin || budgetMax || location;

  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
      {/* Art form chips */}
      <div className="flex items-center gap-2 shrink-0">
        {ART_FORMS.map((form) => (
          <button
            key={form}
            onClick={() => setParam('artForm', form === 'All' ? '' : form)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
              (form === 'All' && currentArtForm === 'All') || currentArtForm === form
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {form}
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-outline-variant/30 shrink-0" />

      {/* Budget dropdown */}
      <div className="relative shrink-0">
        <button
          onClick={() => { setBudgetOpen((v) => !v); setLocationOpen(false); }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
            budgetMin || budgetMax
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'border-outline-variant/40 text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          Budget
          {(budgetMin || budgetMax) && (
            <span className="text-xs">
              {budgetMin ? `${Number(budgetMin).toLocaleString()}` : '0'}
              {' – '}
              {budgetMax ? `${Number(budgetMax).toLocaleString()}` : '∞'}
            </span>
          )}
          <svg className={`w-3.5 h-3.5 transition-transform ${budgetOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {budgetOpen && (
          <div className="absolute top-full mt-2 left-0 bg-surface border border-outline-variant/30 rounded-xl shadow-lg p-4 z-20 w-64">
            <p className="text-xs font-semibold text-on-surface-variant mb-3">Budget range (UGX)</p>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={budgetMin}
                onChange={(e) => setParam('budgetMin', e.target.value)}
                className="flex-1 border border-outline-variant/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
              <input
                type="number"
                placeholder="Max"
                value={budgetMax}
                onChange={(e) => setParam('budgetMax', e.target.value)}
                className="flex-1 border border-outline-variant/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <button
              onClick={() => { setParam('budgetMin', ''); setParam('budgetMax', ''); setBudgetOpen(false); }}
              className="mt-3 text-xs text-primary hover:underline"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Location dropdown */}
      <div className="relative shrink-0">
        <button
          onClick={() => { setLocationOpen((v) => !v); setBudgetOpen(false); }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
            location
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'border-outline-variant/40 text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          {location || 'Location'}
          <svg className={`w-3.5 h-3.5 transition-transform ${locationOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {locationOpen && (
          <div className="absolute top-full mt-2 left-0 bg-surface border border-outline-variant/30 rounded-xl shadow-lg p-4 z-20 w-52">
            <p className="text-xs font-semibold text-on-surface-variant mb-3">City</p>
            <input
              type="text"
              placeholder="e.g. Kampala"
              value={location}
              onChange={(e) => setParam('location', e.target.value)}
              className="w-full border border-outline-variant/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              autoFocus
            />
            {location && (
              <button
                onClick={() => { setParam('location', ''); setLocationOpen(false); }}
                className="mt-2 text-xs text-primary hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {hasFilters && (
        <button onClick={clearAll} className="shrink-0 text-xs text-on-surface-variant hover:text-primary transition-colors underline">
          Clear all
        </button>
      )}

      <span className="ml-auto shrink-0 text-caption font-caption text-on-surface-variant text-xs whitespace-nowrap">
        {totalCount} artist{totalCount !== 1 ? 's' : ''}
      </span>
    </div>
  );
}
