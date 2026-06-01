'use client';

import { useState } from 'react';

export function CopyLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`https://thecircle.co/${slug}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="flex flex-col items-center gap-2 bg-surface-container rounded-xl p-3 hover:bg-surface-container-high transition-colors text-center"
    >
      <span className="text-xl">{copied ? '✓' : '🔗'}</span>
      <span className="text-caption font-caption text-on-surface text-xs">
        {copied ? 'Copied!' : 'Share profile'}
      </span>
    </button>
  );
}
