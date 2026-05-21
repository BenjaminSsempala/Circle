'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import '../../auth/auth.css';

export default function PackageOnboardingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

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
  const [formData, setFormData] = useState({
    packageName: '',
    description: '',
    price: '',
    currency: 'UGX',
    duration: '1 hour',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.packageName || !formData.price || !formData.description) {
      alert('Please fill all required fields');
      return;
    }

    // Store in session
    sessionStorage.setItem(
      'onboarding_package',
      JSON.stringify({
        ...formData,
        step: 2,
      })
    );

    // Frontend flag - skip API wait
    if (true) {
      router.push('/onboarding/socials');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md px-margin-mobile md:px-margin-desktop py-4 flex justify-between items-center border-b border-primary-container/10">
        <div className="flex items-center gap-xs">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
            🔥
          </div>
          <span className="text-headline-md font-headline-md tracking-tight text-primary">Circle</span>
        </div>
        <div className="hidden md:flex items-center gap-sm">
          <span className="text-label-mono font-label-mono text-on-surface-variant">Step 2 of 4</span>
          <div className="flex gap-1">
            <div className="h-1.5 w-6 rounded-full bg-primary-container"></div>
            <div className="h-1.5 w-6 rounded-full bg-primary-container"></div>
            <div className="h-1.5 w-6 rounded-full bg-surface-variant"></div>
            <div className="h-1.5 w-6 rounded-full bg-surface-variant"></div>
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center px-margin-mobile py-lg md:py-xl mt-20">
        <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-gutter">
          {/* Visual Side */}
          <div className="hidden md:flex flex-col gap-md pr-md">
            <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden shadow-lg">
              <img
                alt="Musician performing"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGmY7zqCFZu_YrRtzFZQEbE3O55PCHTXM9k4vq-kBWD_64YywnaFbnNUFSy3xKwZ0SirvOE2gcc4KhVCVKuYFuONvRn4YhibqOkbCUtfp2YY6g6_t3BpohjesEEE-rOhmIatvTKvyUHQNiGD6Dxc_SBNDx6YomBRxRKYkwwmr40io0xZqdrtozDN0oNc242VoMBoc137hwvKnpNRAHeR3iXtFCagGCC8K9864qtqNjTtEOSPin8RMWPaMBGHrRvA7EIbAxvRRWu6Q"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent flex flex-col justify-end p-md">
                <p className="text-headline-md font-headline-md text-white">
                  Share your complete offering.
                </p>
              </div>
            </div>
            <div className="p-md rounded-xl bg-primary-container/5 border border-primary-container/10">
              <p className="text-body-md font-body-md text-on-surface-variant italic">
                "Your first package represents the heart of your craft. Set clear expectations to
                build immediate trust with your future clients."
              </p>
            </div>
          </div>

          {/* Form Side */}
          <div>
            {/* Mobile Step */}
            <div className="md:hidden mb-gutter">
              <span className="text-label-mono font-label-mono text-primary bg-primary-container/10 px-3 py-1 rounded-full">
                Step 2 of 4
              </span>
            </div>

            <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-primary-container/10 p-md md:p-lg">
              <div className="mb-lg">
                <h1 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg text-on-surface mb-2">
                  Create your first package
                </h1>
                <p className="text-body-md font-body-md text-on-surface-variant">
                  This is what clients will book from you. You can add more packages later.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-gutter">
                {/* Package Name */}
                <div className="flex flex-col gap-xs">
                  <label
                    htmlFor="packageName"
                    className="text-label-mono font-label-mono text-on-surface-variant"
                  >
                    Package Name *
                  </label>
                  <input
                    type="text"
                    id="packageName"
                    name="packageName"
                    value={formData.packageName}
                    onChange={handleInputChange}
                    placeholder="e.g. 30-minute Session"
                    className="w-full"
                    required
                  />
                </div>

                {/* Price */}
                <div className="grid grid-cols-2 gap-gutter">
                  <div className="flex flex-col gap-xs">
                    <label
                      htmlFor="price"
                      className="text-label-mono font-label-mono text-on-surface-variant"
                    >
                      Price *
                    </label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="100000"
                      className="w-full"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-xs">
                    <label
                      htmlFor="currency"
                      className="text-label-mono font-label-mono text-on-surface-variant"
                    >
                      Currency
                    </label>
                    <select id="currency" name="currency" value={formData.currency} onChange={handleInputChange} className="w-full">
                      <option value="UGX">UGX (Uganda)</option>
                      <option value="KES">KES (Kenya)</option>
                      <option value="USD">USD</option>
                      <option value="ZAR">ZAR (South Africa)</option>
                    </select>
                  </div>
                </div>

                {/* Duration */}
                <div className="flex flex-col gap-xs">
                  <label
                    htmlFor="duration"
                    className="text-label-mono font-label-mono text-on-surface-variant"
                  >
                    Duration
                  </label>
                  <select
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="w-full"
                  >
                    <option value="30 min">30 minutes</option>
                    <option value="1 hour">1 hour</option>
                    <option value="2 hours">2 hours</option>
                    <option value="4 hours">4 hours</option>
                    <option value="Full Day">Full Day</option>
                    <option value="Negotiable">Negotiable</option>
                  </select>
                </div>

                {/* Description */}
                <div className="flex flex-col gap-xs">
                  <label
                    htmlFor="description"
                    className="text-label-mono font-label-mono text-on-surface-variant"
                  >
                    What's included? *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe what clients get for this package..."
                    className="w-full resize-none"
                    rows={4}
                    required
                  ></textarea>
                </div>

                {/* Navigation */}
                <div className="pt-base flex justify-between gap-sm">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-lg py-3 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-low transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-primary text-on-primary text-body-md font-body-md px-lg py-3 rounded-lg shadow-sm hover:shadow-md transition-all"
                  >
                    <span>Continue</span>
                    <span>→</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
