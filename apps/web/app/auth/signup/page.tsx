'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { GoogleButton, ErrorBanner } from '../../components/auth/AuthComponents';
import '../auth.css';

type Step = 'credentials' | 'email-confirmation' | 'role';

export default function SignupPage() {
  const router = useRouter();
  const { refetchProfile } = useAuth();
  const searchParams = useSearchParams();

  // If arriving from Google OAuth callback without a role yet
  const initialStep: Step = searchParams.get('step') === 'role' ? 'role' : 'credentials';

  const [step, setStep] = useState<Step>(initialStep);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 — create account with email + password
  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!terms) { setError('Please accept the Terms of Service to continue.'); return; }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName: name }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Signup failed');
        setLoading(false);
        return;
      }

      // Move to email confirmation step
      setStep('email-confirmation');
      setLoading(false);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  }

  // Step 2 — check if email is confirmed, then proceed to role
  async function handleCheckEmailConfirmation() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/me', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        setError('Please confirm your email address first. Check your inbox for a confirmation link.');
        setLoading(false);
        return;
      }

      // Email is confirmed, proceed to role selection
      setStep('role');
      setLoading(false);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  }

  // Resend confirmation email
  async function handleResendEmail() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/resend-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to resend email');
        setLoading(false);
        return;
      }

      // Show success message
      setError(null);
      alert('Confirmation email resent! Check your inbox.');
      setLoading(false);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  }

  // Step 3 — write role to profiles table, then route to onboarding
  async function handleRoleSelect(role: 'artist' | 'organiser') {
    setLoading(true);
    setError(null);
    console.log('Role selection started for role:', role);

  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Role selection: Current session data:', session);
    
    if (!session?.user) {
      setError("Session lost. Please sign in again.");
      setLoading(false);
      return;
    }
    console.log('Role selection: Current session user ID:', session.user.id);

    // 1. Perform the update
    const { error: dbError } = await supabase
      .from('profiles')
      .upsert({
        id: session.user.id,
        role: role,
        full_name: name || session.user.user_metadata?.full_name || '',
        onboarding_complete: false,
      });

    if (dbError) throw dbError;

    // 2. IMPORTANT: Manually update the Context state locally 
    // instead of just waiting for a refetch to finish.
    await refetchProfile();

    // 3. Use a small delay to allow state to settle, then hard redirect
    // This breaks the "Infinite Loading" loop seen in your logs
    setTimeout(() => {
      window.location.href = role === 'organiser' ? '/onboarding/organiser' : '/onboarding/artist';
    }, 100);

  } catch (err: any) {
    console.error('Role selection error:', err);
    setError(err.message);
    setLoading(false);
  }
}

  return (
    <AuthLayout
      title={
        step === 'credentials'
          ? 'Join the Circle'
          : step === 'email-confirmation'
            ? 'Confirm Your Email'
            : 'What brings you here?'
      }
      subtitle={
        step === 'credentials'
          ? 'Your professional home for your craft.'
          : step === 'email-confirmation'
            ? `We've sent a confirmation link to ${email}. Click the link to verify your email.`
            : 'This helps us personalise your experience.'
      }
      showImage
    >
      {error && <ErrorBanner message={error} />}

      {step === 'credentials' ? (
        <form onSubmit={handleCreateAccount} className="space-y-5">
          <GoogleButton label="Sign up with Google" />

          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-outline-variant/30" />
            <span className="flex-shrink mx-4 text-caption font-caption text-outline">OR CONTINUE WITH EMAIL</span>
            <div className="flex-grow border-t border-outline-variant/30" />
          </div>

          <div>
            <label className="block text-label-mono font-label-mono text-on-surface-variant mb-2">FULL NAME</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Amani Okafor" className="w-full" required
            />
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
              placeholder="Min 8 characters" minLength={8} className="w-full" required
            />
          </div>

          <div className="flex items-start gap-3 py-2">
            <input
              type="checkbox" id="terms" checked={terms} onChange={e => setTerms(e.target.checked)}
              className="mt-1 rounded border-outline-variant text-primary"
            />
            <label htmlFor="terms" className="text-caption font-caption text-on-surface-variant">
              I agree to the{' '}
              <Link href="#" className="text-primary hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link href="#" className="text-primary hover:underline">Privacy Policy</Link>.
            </label>
          </div>

          <button
            type="submit" disabled={loading || !name || !email || password.length < 8 || !terms}
            className="w-full py-4 rounded-xl bg-primary text-white text-headline-md font-headline-md hover:opacity-90 transition-all shadow-lg shadow-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>

          <p className="text-center text-body-md font-body-md text-on-surface-variant">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary hover:underline font-semibold">Log in</Link>
          </p>
        </form>
      ) : step === 'email-confirmation' ? (
        <div className="space-y-6 text-center">
          <div className="py-6">
            <div className="text-5xl mb-4">✉️</div>
            <p className="text-body-md font-body-md text-on-surface-variant mb-4">
              Please check your inbox and click the confirmation link we sent to <strong>{email}</strong>.
            </p>
            <p className="text-caption font-caption text-on-surface-variant mb-4">
              Didn't receive it? Check your spam folder.
            </p>
          </div>

          <button
            onClick={handleCheckEmailConfirmation}
            disabled={loading}
            className="w-full py-4 rounded-xl bg-primary text-white text-headline-md font-headline-md hover:opacity-90 transition-all shadow-lg shadow-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Checking confirmation…' : 'Email Confirmed?'}
          </button>

          <button
            onClick={handleResendEmail}
            disabled={loading}
            className="w-full py-4 rounded-xl border border-outline-variant text-on-surface-variant text-headline-md font-headline-md hover:bg-surface-container-low transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Resending…' : 'Resend Confirmation Email'}
          </button>

          <button
            onClick={() => setStep('credentials')}
            disabled={loading}
            className="w-full py-4 rounded-xl border border-outline-variant text-on-surface-variant text-headline-md font-headline-md hover:bg-surface-container-low transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Go Back
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <button
            onClick={() => handleRoleSelect('artist')} disabled={loading}
            className="w-full p-6 rounded-xl border border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low hover:border-primary transition-all text-left disabled:opacity-50"
          >
            <div className="text-2xl mb-2">🎤</div>
            <h3 className="text-headline-md font-headline-md text-primary mb-1">I'm an Artist</h3>
            <p className="text-body-md font-body-md text-on-surface-variant">
              Build my profile, list my packages, get booked safely
            </p>
          </button>

          <button
            onClick={() => handleRoleSelect('organiser')} disabled={loading}
            className="w-full p-6 rounded-xl border border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low hover:border-primary transition-all text-left disabled:opacity-50"
          >
            <div className="text-2xl mb-2">🎪</div>
            <h3 className="text-headline-md font-headline-md text-primary mb-1">I'm an Organiser</h3>
            <p className="text-body-md font-body-md text-on-surface-variant">
              Find and book vetted talent for my events
            </p>
          </button>

          {loading && (
            <p className="text-center text-sm text-on-surface-variant animate-pulse">Setting up your account…</p>
          )}
        </div>
      )}
    </AuthLayout>
  );
}
