'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import '../../auth/auth.css';

const PLATFORMS = [
  {
    name: 'YouTube',
    icon: '📺',
    color: '#FF0000',
    description: 'Link your videos and channel',
    connected: false,
  },
  {
    name: 'Spotify',
    icon: '🎵',
    color: '#1DB954',
    description: 'Your music library',
    connected: false,
  },
  {
    name: 'TikTok',
    icon: '🎬',
    color: '#000000',
    description: 'Your trending content',
    connected: false,
  },
  {
    name: 'Instagram',
    icon: '📸',
    color: '#E1306C',
    description: 'Your visual portfolio',
    connected: false,
  },
  {
    name: 'SoundCloud',
    icon: '🎙️',
    color: '#FF5500',
    description: 'Your audio collection',
    connected: false,
  },
];

export default function SocialsOnboardingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [platforms, setPlatforms] = useState(PLATFORMS);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return; // Wait for auth state to load
    
    if (!user) {
      // Not authenticated - need to sign up
      router.push('/auth/signup');
      return;
    }

    if (user.onboarding_complete) {
      // Already completed onboarding - go to dashboard
      router.push('/dashboard');
      return;
    }

    // Allow access if:
    // 1. Role is 'artist' (already selected)
    // 2. Role is null/undefined but not yet onboarded (in process of selecting role)
    // 3. Role is 'organiser' - reject to their onboarding page
    if (user.role === 'organiser') {
      router.push('/onboarding/organiser');
      return;
    }

    // Otherwise allow (role === 'artist' or role === null/undefined)
  }, [user, loading, router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="text-body-lg font-body-lg text-on-surface-variant">Loading...</div></div>;
  if (!user || user.onboarding_complete || (user.role && user.role !== 'artist')) return null;

  const handleConnect = (platformName: string) => {
    setConnecting(platformName);

    // Frontend flag - simulate connection
    if (true) {
      setTimeout(() => {
        setPlatforms((prev) =>
          prev.map((p) => (p.name === platformName ? { ...p, connected: true } : p))
        );
        setConnecting(null);
      }, 800);
    }
  };

  const handleSkip = () => {
    // Frontend flag - allow skip without connection
    if (true) {
      sessionStorage.setItem(
        'onboarding_socials',
        JSON.stringify({
          platforms: platforms.filter((p) => p.connected),
          step: 3,
        })
      );
      router.push('/onboarding/success');
    }
  };

  const connectedCount = platforms.filter((p) => p.connected).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="w-full py-md px-margin-mobile md:px-margin-desktop flex justify-between items-center bg-transparent border-b border-primary-container/10">
        <div className="text-headline-md font-headline-md text-primary tracking-tight">Circle</div>
        <div className="bg-primary-container/20 text-primary px-4 py-1.5 rounded-full text-label-mono font-label-mono">
          Step 3 of 4
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-margin-mobile md:px-margin-desktop pt-8 pb-xl flex flex-col items-center">
        {/* Progress Bar */}
        <div className="w-full max-w-2xl mb-12">
          <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-container transition-all duration-500"
              style={{ width: '75%' }}
            ></div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="text-center mb-12 max-w-2xl">
          <h1 className="text-headline-xl font-headline-xl text-on-surface mb-4">
            Connect Platforms
          </h1>
          <p className="text-body-lg font-body-lg text-on-surface-variant">
            Bringing your digital presence into one hearth. Connecting a platform brings your
            profile to life with your actual work.
          </p>
        </div>

        {/* Platforms Bento-style Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter w-full max-w-5xl mb-16">
          {platforms.map((platform) => (
            <div
              key={platform.name}
              className={`bg-surface-container-lowest rounded-xl p-md border transition-all duration-300 hover:translate-y-[-4px] ${
                platform.connected ? 'border-primary bg-primary/5' : 'border-outline-variant/30'
              }`}
            >
              <div className="flex flex-col h-full">
                <div className="mb-8 flex items-center justify-between">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${platform.color}20` }}
                  >
                    {platform.icon}
                  </div>
                  {platform.connected && (
                    <span className="text-primary text-sm font-semibold">✓ Connected</span>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="text-headline-md font-headline-md text-on-surface mb-1">
                    {platform.name}
                  </h3>
                  <p className="text-body-md font-body-md text-on-surface-variant mb-6">
                    {platform.description}
                  </p>
                </div>

                <button
                  onClick={() => handleConnect(platform.name)}
                  disabled={platform.connected || connecting === platform.name}
                  className={`w-full py-3 rounded-lg font-body-md transition-all ${
                    platform.connected
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'bg-primary text-on-primary hover:opacity-90'
                  } ${connecting === platform.name ? 'opacity-50' : ''}`}
                >
                  {connecting === platform.name
                    ? 'Connecting...'
                    : platform.connected
                      ? 'Connected'
                      : 'Connect'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Progress Indicator */}
        <div className="text-center mb-12">
          <p className="text-body-lg font-body-lg text-on-surface-variant">
            {connectedCount} of {platforms.length} platforms connected
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-4 w-full max-w-sm">
          <button
            onClick={() => router.back()}
            className="flex-1 px-lg py-3 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-low transition-all text-body-md font-body-md"
          >
            Back
          </button>
          <button
            onClick={handleSkip}
            className="flex-1 px-lg py-3 rounded-lg bg-primary text-on-primary hover:opacity-90 transition-all text-body-md font-body-md"
          >
            {connectedCount > 0 ? 'Continue' : 'Skip For Now'}
          </button>
        </div>

        {/* Trust Note */}
        <div className="mt-12 text-center text-caption font-caption text-on-surface-variant opacity-70">
          <p>We only access your public profile information. Your credentials are never stored.</p>
        </div>
      </main>
    </div>
  );
}
