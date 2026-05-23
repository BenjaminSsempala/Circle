'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext'; // 1. Hook up your Auth Context
import { createClient } from '@/lib/supabase/client'; // 2. Hook up your Browser Client
import { AuthLayout } from '../../components/auth/AuthLayout';
import { GoogleButton, ErrorBanner } from '../../components/auth/AuthComponents';
import '../auth.css';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refetchProfile } = useAuth(); // 3. Grab the refetch runner

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get('error') ? 'There was a problem signing in. Please try again.' : null,
  );

  async function handleSubmit(e: React.FormEvent) {
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

      // Perform a hard redirect. The browser's new page request will transmit the cookies 
      // set by the login API route, allowing the client-side AuthContext on the target page
      // to initialize cleanly from the start.
      window.location.href = data.redirectTo || '/dashboard';

    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Welcome Back" subtitle="Log in to your Circle profile." showImage>
      <form onSubmit={handleSubmit} className="space-y-5">

        {error && <ErrorBanner message={error} />}

        <GoogleButton label="Continue with Google" />

        <div className="relative flex items-center py-4">
          <div className="flex-grow border-t border-outline-variant/30" />
          <span className="flex-shrink mx-4 text-caption font-caption text-outline">OR CONTINUE WITH EMAIL</span>
          <div className="flex-grow border-t border-outline-variant/30" />
        </div>

        <div>
          <label className="block text-label-mono font-label-mono text-on-surface-variant mb-2">EMAIL ADDRESS</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="artist@circle.com" className="w-full" required
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