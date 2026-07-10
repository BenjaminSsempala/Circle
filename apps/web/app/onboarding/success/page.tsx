'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';
import '../../auth/auth.css';

export default function SuccessPage() {
  const router = useRouter();
  const { user, loading, refetchProfile } = useAuth();

  // ── All hooks declared unconditionally ────────────────────────────────────
  const [copied, setCopied] = useState(false);
  const [artistSlug, setArtistSlug] = useState<string>('');
  const [artistPhoto, setArtistPhoto] = useState<string>('');
  const [artistName, setArtistName] = useState<string>('');
  const [completing, setCompleting] = useState(false);
  const hasCompletedRef = useRef(false); // prevent double-fire in dev strict mode

  // ── Auth guard ────────────────────────────────────────────────────────────
  // NOTE: we do NOT redirect when onboarding_complete because this page is the
  // one that sets it. The user lands here with onboarding_complete = false,
  // we mark it complete, then they navigate away manually.
  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/auth/signup'); return; }
    if (user.role === 'organiser') { router.push('/onboarding/organiser'); return; }
  }, [user, loading, router]);

  // ── Mark onboarding complete + fetch real slug ────────────────────────────
  useEffect(() => {
    if (loading || !user || hasCompletedRef.current) return;
    if (user.role && user.role !== 'artist') return;
    hasCompletedRef.current = true;

    const finish = async () => {
      setCompleting(true);
      try {
        // 1. Fetch artist data to show the real profile URL + photo
        const artistRes = await fetch('/api/onboarding/artist');
        const { artist } = await artistRes.json();
        if (artist?.slug) setArtistSlug(artist.slug);
        if (artist?.profile_photo) setArtistPhoto(artist.profile_photo);
        if (artist?.name) setArtistName(artist.name);

        // 2. Mark onboarding complete in DB
        await fetch('/api/onboarding/complete', { method: 'POST' });
      } catch {
        // Non-fatal: user can still proceed to dashboard
      } finally {
        setCompleting(false);
      }
    };

    finish();
  }, [loading, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Confetti animation ────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = document.getElementById('confetti') as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#005440', '#84d6b9', '#ffdcbe', '#feb56b'];
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      vx: (Math.random() - 0.5) * 8,
      vy: Math.random() * 5 + 3,
      size: Math.random() * 3 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
    }));

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.01;
        p.vy += 0.1;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      if (particles.some((p) => p.life > 0)) {
        animId = requestAnimationFrame(animate);
      }
    };
    animId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animId);
  }, []); // run once on mount

  // ── Handlers ──────────────────────────────────────────────────────────────
  const profileUrl = artistSlug
    ? `engero.art/${artistSlug}`
    : 'engero.art/your-profile';

  const handleCopy = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGoToDashboard = async () => {
    // Refresh context so onboarding_complete = true before navigating
    await refetchProfile();
    router.push('/dashboard');
  };

  // ── Render guards ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-body-lg font-body-lg text-on-surface-variant">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      {/* Confetti canvas */}
      <canvas
        id="confetti"
        className="fixed top-0 left-0 w-full h-full pointer-events-none z-10"
      />

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md border-b border-primary-container/10 px-margin-mobile md:px-margin-desktop py-4 flex justify-between items-center">
        <div className="text-headline-md font-headline-md text-primary tracking-tight">Engero</div>
        <div className="text-label-mono font-label-mono bg-primary/10 text-primary px-3 py-1 rounded-full flex items-center gap-1.5">
          <span>✓</span>
          <span>You&apos;re all set</span>
        </div>
      </header>

      <main className="flex-grow pt-32 pb-xl px-margin-mobile md:px-margin-desktop max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-gutter items-center">
        {/* Left: Success messaging */}
        <div className="lg:col-span-1 flex flex-col space-y-lg">
          <div className="space-y-sm">
            <span className="text-label-mono font-label-mono text-secondary bg-secondary-fixed/30 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
              Welcome to Engero
            </span>
            <h1 className="text-headline-xl font-headline-xl md:text-headline-xl text-primary leading-tight">
              Your profile is live!
            </h1>
            <p className="text-body-lg font-body-lg text-on-surface-variant max-w-md">
              Congratulations! Your professional space is ready to share with clients and the
              Global art community.
            </p>
          </div>

          {/* URL copy section */}
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-md space-y-sm shadow-sm">
            <p className="text-caption font-caption text-on-surface-variant">
              {completing ? 'Building your link...' : 'Share your unique link'}
            </p>
            <div className="flex items-center gap-sm bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-sm">
              <span className="text-label-mono font-label-mono text-primary flex-grow truncate">
                {completing ? '...' : profileUrl}
              </span>
              <button
                onClick={handleCopy}
                disabled={completing}
                className="flex items-center gap-xs bg-primary text-on-primary px-4 py-2 rounded-lg text-label-mono font-label-mono hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
              >
                <span>{copied ? '✓' : '📋'}</span>
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Next steps */}
          <div className="space-y-3">
            <h3 className="text-headline-md font-headline-md text-on-surface">What&apos;s next?</h3>
            <ul className="space-y-2">
              {[
                'Share your link on social media and with potential clients',
                'Add more packages and media to your profile from the dashboard',
                'Start receiving booking requests from your Circle',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="text-primary text-lg flex-shrink-0">✓</span>
                  <span className="text-body-md font-body-md text-on-surface-variant">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTAs */}
          <div className="pt-4 space-y-3">
            <button
              onClick={handleGoToDashboard}
              disabled={completing}
              className="w-full bg-primary text-on-primary text-body-md font-body-md px-lg py-4 rounded-lg shadow-lg shadow-primary/10 hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {completing ? 'Finishing up...' : 'Go to Dashboard'}
            </button>
            {artistSlug && (
              <button
                onClick={() => window.open(`/${artistSlug}`, '_blank')}
                className="w-full border border-outline-variant text-on-surface text-body-md font-body-md px-lg py-4 rounded-lg hover:bg-surface-container-low transition-all"
              >
                View Your Profile
              </button>
            )}
          </div>
        </div>

        {/* Right: Profile photo or fallback visual */}
        <div className="hidden lg:flex flex-col gap-md items-center">
          <div className="relative w-56 h-56 rounded-full overflow-hidden shadow-2xl border-4 border-primary/20">
            {artistPhoto ? (
              <img
                src={artistPhoto}
                alt={artistName || 'Your profile'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary-container/20 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-20 h-20 text-primary/30" fill="none" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </div>
            )}
            {/* Green verified ring glow */}
            <div className="absolute inset-0 rounded-full ring-4 ring-primary/30 ring-offset-2 ring-offset-background" />
          </div>
          {artistName && (
            <p className="text-headline-md font-headline-md text-on-surface text-center">{artistName}</p>
          )}
          <div className="bg-primary-container/5 rounded-xl p-md border border-primary-container/10 max-w-xs text-center">
            <p className="text-body-md font-body-md text-on-surface-variant italic">
              "Your journey on Engero has just begun. Every step you take brings you closer to
              building the creative career you deserve."
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-outline-variant/30 py-md px-margin-mobile md:px-margin-desktop text-center text-caption font-caption text-on-surface-variant opacity-70">
        <p>
          Need help? Check out our{' '}
          <Link href="#" className="text-primary hover:underline">guides</Link>
          {' '}or{' '}
          <Link href="#" className="text-primary hover:underline">contact support</Link>.
        </p>
      </footer>
    </div>
  );
}
