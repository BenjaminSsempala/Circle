'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Props {
  onClose: () => void;
}

export function ArtistModePrompt({ onClose }: Props) {
  const router = useRouter();

  async function handleCreateAudienceAccount() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/signup');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Sheet */}
      <div
        className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="w-12 h-12 rounded-2xl bg-[#E1F5EE] flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#005440" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        </div>

        {/* Copy */}
        <div>
          <h2 className="text-[17px] font-bold text-on-surface leading-snug mb-2">
            This feature is for your audience.
          </h2>
          <p className="text-[13px] text-on-surface-variant leading-relaxed">
            You&apos;re currently signed in as an artist. Saving artists and booking experiences is how your audience connects with creators: not the other way around.
          </p>
          <p className="text-[13px] text-on-surface-variant leading-relaxed mt-2">
            If you&apos;d like to book or save artists for yourself, you can create a separate audience account.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={handleCreateAudienceAccount}
            className="w-full bg-primary text-white font-semibold py-3 rounded-xl text-[14px] hover:opacity-90 transition-opacity"
          >
            Create an audience account
          </button>
          <button
            onClick={onClose}
            className="w-full text-on-surface-variant text-[13px] py-2 hover:text-on-surface transition-colors"
          >
            Keep browsing as an artist
          </button>
        </div>
      </div>
    </div>
  );
}
