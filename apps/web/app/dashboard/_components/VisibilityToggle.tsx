'use client';

import { useState } from 'react';

export function VisibilityToggle({ initialVisible, artistSlug }: { initialVisible: boolean; artistSlug: string }) {
  const [visible, setVisible] = useState(initialVisible);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    const next = !visible;
    setVisible(next);
    setLoading(true);
    try {
      const res = await fetch('/api/artists/visibility', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_visible: next }),
      });
      if (!res.ok) setVisible(!next); // revert on failure
    } catch {
      setVisible(!next);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-surface border border-outline-variant/30 rounded-xl p-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-label-mono font-label-mono text-on-surface text-xs uppercase tracking-wider">
          Discover visibility
        </p>
        <p className="text-caption font-caption text-on-surface-variant mt-0.5">
          {visible ? 'Your profile appears on Discover' : 'Hidden from Discover'}
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={loading}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${visible ? 'bg-primary' : 'bg-outline-variant'} ${loading ? 'opacity-60' : ''}`}
        aria-label={visible ? 'Hide profile from Discover' : 'Show profile on Discover'}
        role="switch"
        aria-checked={visible}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${visible ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}
