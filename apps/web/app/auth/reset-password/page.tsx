'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { ErrorBanner } from '../../components/auth/AuthComponents';
import '../auth.css';

export default function ResetPasswordPage() {
  const router = useRouter();

  // Detect if we arrived via a password-reset email link (hash has type=recovery)
  const [mode, setMode] = useState<'request' | 'update' | 'loading' | 'sent'>('loading');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check hash for recovery token (implicit flow)
    const hash = window.location.hash;
    if (hash.includes('type=recovery') || hash.includes('access_token')) {
      // supabase client auto-parses the hash and sets the session
      const supabase = createClient();
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) setMode('update');
        else setMode('request');
      });
    } else {
      // Check query string for PKCE code
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (code) {
        const supabase = createClient();
        supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
          if (!error) setMode('update');
          else setMode('request');
        });
      } else {
        setMode('request');
      }
    }
  }, []);

  // ── Request reset email ───────────────────────────────────────────────

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? 'Failed to send reset email');
        return;
      }
      setMode('sent');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Set new password ──────────────────────────────────────────────────

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }

    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) { setError(error.message); return; }

      // Get profile to redirect correctly
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id ?? '')
        .maybeSingle();

      router.replace(profile?.role === 'audience' ? '/discover' : '/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────

  if (mode === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Email sent confirmation ───────────────────────────────────────────

  if (mode === 'sent') {
    return (
      <AuthLayout
        title="Check your inbox"
        subtitle={`We sent a password reset link to ${email}. Click the link to set a new password.`}
        showImage
      >
        <div className="flex flex-col gap-4">
          <button
            onClick={() => setMode('request')}
            className="text-sm text-on-surface-variant hover:text-primary transition-colors underline text-center"
          >
            Didn't receive it? Try again
          </button>
          <Link
            href="/auth/login"
            className="block text-center text-sm text-on-surface-variant hover:text-primary transition-colors"
          >
            ← Back to login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // ── New password form (arrived via reset link) ────────────────────────

  if (mode === 'update') {
    return (
      <AuthLayout
        title="Set new password"
        subtitle="Choose a strong password for your account."
        showImage
      >
        {error && <ErrorBanner message={error} />}
        <form onSubmit={handleUpdate} className="space-y-5">
          <div>
            <label className="block text-label-mono font-label-mono text-on-surface-variant mb-2">NEW PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              minLength={8}
              className="w-full"
              required
            />
          </div>
          <div>
            <label className="block text-label-mono font-label-mono text-on-surface-variant mb-2">CONFIRM PASSWORD</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat password"
              className="w-full"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary font-semibold py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </AuthLayout>
    );
  }

  // ── Request form (default) ────────────────────────────────────────────

  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="Enter your email and we'll send you a reset link."
      showImage
    >
      {error && <ErrorBanner message={error} />}
      <form onSubmit={handleRequest} className="space-y-5">
        <div>
          <label className="block text-label-mono font-label-mono text-on-surface-variant mb-2">EMAIL ADDRESS</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="artist@circle.com"
            className="w-full"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-on-primary font-semibold py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
        <div className="text-center">
          <Link href="/auth/login" className="text-sm text-on-surface-variant hover:text-primary transition-colors">
            ← Back to login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
