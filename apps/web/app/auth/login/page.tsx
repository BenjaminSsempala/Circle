'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { GoogleButton, ErrorBanner } from '../../components/auth/AuthComponents';
import '../auth.css';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const { refetchProfile } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get('error') ? 'There was a problem signing in. Please try again.' : null,
  );
  const confirmed = searchParams.get('confirmed') === 'true';

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${siteUrl}/api/auth/callback` },
      });

      if (error) throw error;

      // Supabase should auto-redirect, but manually navigate as a failsafe
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Google sign-in is not configured. Please enable the Google provider in your Supabase dashboard.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      const data = await res.json();
      await refetchProfile();
      window.location.href = data.redirectTo || '/dashboard';
    } catch {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Welcome Back" subtitle="Log in to your Engero profile." showImage>
      {confirmed && (
        <div className="rounded-xl bg-primary/10 border border-primary/30 px-4 py-3 text-sm text-primary font-medium mb-1">
          ✓ Email confirmed! You can now log in.
        </div>
      )}
      {error && <ErrorBanner message={error} />}

      {/* Google: outside the form so it never triggers form validation */}
      <GoogleButton
        label={googleLoading ? 'Redirecting…' : 'Continue with Google'}
        onClick={handleGoogleLogin}
        disabled={googleLoading || loading}
      />

      <div className="relative flex items-center py-4">
        <div className="flex-grow border-t border-outline-variant/30" />
        <span className="flex-shrink mx-4 text-caption font-caption text-outline">OR CONTINUE WITH EMAIL</span>
        <div className="flex-grow border-t border-outline-variant/30" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-label-mono font-label-mono text-on-surface-variant mb-2">EMAIL ADDRESS</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="artist@engero.art" className="w-full" required
          />
        </div>

        <div>
          <label className="block text-label-mono font-label-mono text-on-surface-variant mb-2">PASSWORD</label>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" className="w-full" required
          />
        </div>

        <div className="text-right">
          <Link href="/auth/reset-password" className="text-primary text-body-md font-body-md hover:underline">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit" disabled={loading || !email || !password}
          className="w-full py-4 rounded-xl bg-primary text-white text-headline-md font-headline-md hover:opacity-90 transition-all shadow-lg shadow-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Logging in…' : 'Log In'}
        </button>

        <p className="text-center text-body-md font-body-md text-on-surface-variant">
          Don't have an account?{' '}
          <Link href="/auth/signup" className="text-primary hover:underline font-semibold">Sign up</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
