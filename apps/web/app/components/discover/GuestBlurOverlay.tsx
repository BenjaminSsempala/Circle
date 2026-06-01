'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export function GuestBlurOverlay() {
  const [emailMode, setEmailMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGoogleSignup() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/discover&role=audience`,
      },
    });
  }

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName: name }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? 'Signup failed');
        return;
      }
      // Set audience role immediately
      await fetch('/api/auth/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'audience', fullName: name }),
      });
      window.location.href = '/discover';
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative col-span-full mt-4">
      {/* Blur backdrop over remaining cards — positioned via CSS */}
      <div className="absolute inset-x-0 -top-32 h-32 bg-gradient-to-b from-transparent to-background pointer-events-none z-10" />

      <div className="relative z-20 flex flex-col items-center text-center py-12 px-6">
        <h2 className="text-headline-lg font-headline-lg text-on-surface mb-2">
          Sign up to see more artists
        </h2>
        <p className="text-body-md font-body-md text-on-surface-variant mb-8 max-w-sm">
          Join 2,000+ people discovering East Africa's finest creative talent.
        </p>

        {!emailMode ? (
          <div className="flex flex-col items-center gap-4 w-full max-w-sm">
            <button
              onClick={handleGoogleSignup}
              className="w-full flex items-center justify-center gap-3 border border-outline-variant bg-surface hover:bg-surface-container-low text-on-surface font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <button
              onClick={() => setEmailMode(true)}
              className="text-sm text-on-surface-variant hover:text-primary transition-colors underline"
            >
              or continue with email
            </button>

            <Link href="/auth/signup?type=artist" className="text-xs text-on-surface-variant/60 hover:text-on-surface-variant transition-colors mt-2">
              I'm an artist — set up my profile instead
            </Link>
          </div>
        ) : (
          <form onSubmit={handleEmailSignup} className="w-full max-w-sm flex flex-col gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full border border-outline-variant/40 rounded-xl px-4 py-3 text-body-md focus:outline-none focus:border-primary"
              required
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full border border-outline-variant/40 rounded-xl px-4 py-3 text-body-md focus:outline-none focus:border-primary"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full border border-outline-variant/40 rounded-xl px-4 py-3 text-body-md focus:outline-none focus:border-primary"
              required
              minLength={6}
            />
            {error && <p className="text-error text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Creating account…' : 'Sign up free'}
            </button>
            <button type="button" onClick={() => setEmailMode(false)} className="text-xs text-on-surface-variant hover:underline">
              ← Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
