'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';
import '../../auth/auth.css';

export default function ArtistOnboardingPage() {
  const router = useRouter();
  const { user, loading, session } = useAuth();
  
  const [formData, setFormData] = useState({
    fullName: '',
    tags: '',
    artForm: '',
    city: '',
    bio: '',
  });
  const [wordCount, setWordCount] = useState(0);

  /**
   * NAVIGATION & AUTH GUARD
   * Only runs when 'loading' is false to ensure we have the final Auth state.
   */
  useEffect(() => {
    if (loading) return;

    console.log('ArtistOnboarding: State Check', { 
      hasUser: !!user, 
      hasSession: !!session, 
      role: user?.role 
    });

    // 1. Not Authenticated
    if (!session && !user) {
      console.log('ArtistOnboarding: Not authenticated, redirecting to signup');
      router.push('/auth/signup');
      return;
    }

    // 2. Authenticated but Role not set yet
    if (session && user && !user.role) {
      console.log('ArtistOnboarding: User has no role, redirecting to role selection');
      router.push('/auth/signup?step=role');
      return;
    }

    // 3. Wrong Role (Organiser trying to access Artist onboarding)
    if (user?.role === 'organiser') {
      console.log('ArtistOnboarding: User is organiser, redirecting to correct path');
      router.push('/onboarding/organiser');
      return;
    }

    if (!user.role) {
    router.push('/auth/signup?step=role');
    return;
  }

    // 4. Already finished
    if (user?.onboarding_complete) {
      console.log('ArtistOnboarding: Complete, moving to dashboard');
      router.push('/dashboard');
      return;
    }

    // Pre-fill name if it exists in the profile
    if (user?.full_name && !formData.fullName) {
      setFormData(prev => ({ ...prev, fullName: user.full_name }));
    }

    

  }, [user, session, loading, router]);

  /**
   * FORM HANDLERS
   */
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'bio') {
      // Simple word counter
      setWordCount(value.trim().split(/\s+/).filter((w) => w.length > 0).length);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.artForm || !formData.city) {
      alert('Please fill all required fields');
      return;
    }

    // Store in session storage to persist through the multi-step flow
    sessionStorage.setItem(
      'onboarding_artist_data',
      JSON.stringify({ ...formData, step: 1 })
    );

    // Proceed to the next step (e.g., packages, gallery, or pricing)
    router.push('/onboarding/package');
  };

  /**
   * LOADING STATE
   */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-body-lg font-body-lg text-on-surface-variant animate-pulse">
            Authenticating...
          </p>
        </div>
      </div>
    );
  }

  // Final safety check: if we are here but don't have a user, 
  // don't render the form to prevent "undefined" errors
  // if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md px-margin-mobile md:px-margin-desktop py-4 flex justify-between items-center border-b border-primary-container/10">
        <div className="text-headline-md font-headline-md text-primary tracking-tight">Circle</div>
        <div className="hidden md:flex items-center gap-base">
          <span className="text-label-mono font-label-mono text-primary bg-primary-container/10 px-3 py-1 rounded-full">
            Step 1 of 4
          </span>
        </div>
        <button
          onClick={() => router.push('/auth/signup')}
          className="text-on-surface-variant hover:text-primary transition-colors text-2xl"
          aria-label="Close onboarding"
        >
          ✕
        </button>
      </header>

      <main className="min-h-screen pt-[120px] pb-xl flex items-center justify-center">
        <div className="w-full max-w-2xl px-margin-mobile">
          {/* Mobile Step Indicator */}
          <div className="md:hidden mb-gutter text-center">
            <span className="text-label-mono font-label-mono text-primary bg-primary-container/10 px-3 py-1 rounded-full">
              Step 1 of 4
            </span>
          </div>

          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-primary-container/10 p-md md:p-lg">
            <div className="mb-lg text-center md:text-left">
              <h1 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg text-on-surface mb-2">
                Claim your space
              </h1>
              <p className="text-body-md font-body-md text-on-surface-variant">
                Tell us who you are. This information will help us build your professional profile.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-gutter">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                {/* Full Name */}
                <div className="flex flex-col gap-xs">
                  <label htmlFor="fullName" className="text-label-mono font-label-mono text-on-surface-variant uppercase tracking-wider text-xs">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Amani Okafor"
                    className="w-full"
                    required
                  />
                </div>

                {/* Profile Tags */}
                <div className="flex flex-col gap-xs">
                  <label htmlFor="tags" className="text-label-mono font-label-mono text-on-surface-variant uppercase tracking-wider text-xs">
                    Profile Tags
                  </label>
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="e.g. Poet, Digital Artist"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                {/* Primary Art Form */}
                <div className="flex flex-col gap-xs">
                  <label htmlFor="artForm" className="text-label-mono font-label-mono text-on-surface-variant uppercase tracking-wider text-xs">
                    Primary Art Form *
                  </label>
                  <select
                    id="artForm"
                    name="artForm"
                    value={formData.artForm}
                    onChange={handleInputChange}
                    className="w-full"
                    required
                  >
                    <option value="">Select your craft</option>
                    <option value="poet">Poet</option>
                    <option value="musician">Musician</option>
                    <option value="visual">Visual Artist</option>
                    <option value="dancer">Dancer</option>
                    <option value="digital">Digital Media</option>
                    <option value="theater">Theater</option>
                  </select>
                </div>

                {/* City */}
                <div className="flex flex-col gap-xs">
                  <label htmlFor="city" className="text-label-mono font-label-mono text-on-surface-variant uppercase tracking-wider text-xs">
                    City *
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Nairobi"
                    className="w-full"
                    required
                  />
                </div>
              </div>

              {/* Bio Section */}
              <div className="flex flex-col gap-xs">
                <div className="flex justify-between items-center">
                  <label htmlFor="bio" className="text-label-mono font-label-mono text-on-surface-variant uppercase tracking-wider text-xs">
                    Your Story
                  </label>
                  <span className={`text-label-mono font-label-mono text-[10px] ${wordCount > 12 ? 'text-error' : 'text-on-surface-variant'}`}>
                    {wordCount}/12 words recommended
                  </span>
                </div>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  maxLength={250}
                  placeholder="Bridging ancestral rhythms with modern jazz through the strings of an nyatiti."
                  className="w-full resize-none min-h-[100px]"
                  rows={3}
                ></textarea>
                <p className="text-caption font-caption text-on-surface-variant italic">
                  Keep it resonant. This is your primary greeting to the community.
                </p>
              </div>

              {/* Navigation Actions */}
              <div className="pt-8 flex justify-between gap-sm">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-lg py-3 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-low transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 bg-primary text-white text-body-md font-semibold px-12 py-3 rounded-lg shadow-lg hover:shadow-primary/20 hover:opacity-90 transition-all"
                >
                  <span>Continue</span>
                  <span className="text-xl">→</span>
                </button>
              </div>
            </form>
          </div>

          {/* Privacy Note */}
          <div className="mt-gutter flex items-center justify-center gap-2 opacity-50">
            <span className="text-xs font-caption text-on-surface-variant">
              ✓ Your profile data is secured within the Circle ecosystem.
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}