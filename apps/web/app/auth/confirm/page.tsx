'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function handleConfirm() {
      const supabase = createClient();

      // ── PKCE flow: ?code= in the query string ─────────────────────────
      const code = searchParams.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setErrorMsg(error.message);
          setStatus('error');
          return;
        }
        return redirect(supabase);
      }

      // ── Implicit flow: #access_token in the URL hash ──────────────────
      // getSession() auto-parses and sets the session from hash tokens
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        setErrorMsg(error.message);
        setStatus('error');
        return;
      }
      if (session) {
        return redirect(supabase);
      }

      // Neither: something went wrong
      setErrorMsg('Confirmation link is invalid or has expired. Please request a new one.');
      setStatus('error');
    }

    async function redirect(supabase: ReturnType<typeof createClient>) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setErrorMsg('Could not load session.'); setStatus('error'); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, onboarding_complete')
        .eq('id', user.id)
        .maybeSingle();

      const role = profile?.role ?? null;
      const done = profile?.onboarding_complete ?? false;

      if (!role) {
        router.replace('/auth/signup?step=role');
      } else if (role === 'audience') {
        router.replace('/discover');
      } else if (done) {
        router.replace('/dashboard');
      } else {
        router.replace('/onboarding/artist');
      }
    }

    handleConfirm();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-surface rounded-2xl border border-outline-variant/30 p-8 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-headline-md font-headline-md text-on-surface mb-2">Link expired</h1>
          <p className="text-body-md font-body-md text-on-surface-variant mb-6">{errorMsg}</p>
          <a
            href="/auth/login"
            className="block bg-primary text-on-primary font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity"
          >
            Back to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-on-surface-variant text-body-md font-body-md">Confirming your email…</p>
      </div>
    </div>
  );
}
