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
    artFormCategory: '',
    packageName: '',
    description: '',
    price: '',
    currency: 'UGX',
    duration: '1 hour',
    logisticsChoice: 'inclusive',
    logisticsNote: '',
  });

  const setFormValue = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'logisticsChoice' && value !== 'other' ? { logisticsNote: '' } : {}),
    }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormValue(name, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.artFormCategory || !formData.packageName || !formData.price || !formData.description) {
      alert('Please fill all required fields');
      return;
    }

    if (formData.logisticsChoice === 'other' && !formData.logisticsNote.trim()) {
      alert('Please provide logistics details when selecting Other.');
      return;
    }

    // Store in session
    sessionStorage.setItem(
      'onboarding_package',
      JSON.stringify({
        ...formData,
        logisticsInclusive: formData.logisticsChoice === 'inclusive',
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
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-[0.95fr_1.05fr] gap-gutter">
          {/* Visual Side */}
          <div className="hidden md:flex flex-col gap-md pr-md items-center">
            <div className="relative w-full max-w-[480px] aspect-[4/5] rounded-xl overflow-hidden shadow-lg">
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
          <div className="mx-auto w-full max-w-[560px]">
            {/* Mobile Step */}
            <div className="md:hidden mb-gutter">
              <span className="text-label-mono font-label-mono text-primary bg-primary-container/10 px-3 py-1 rounded-full">
                Step 2 of 4
              </span>
            </div>

            <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-primary-container/10 p-md md:p-lg">
              <div className="mb-lg">
                <p className="text-3xl md:text-4xl font-semibold text-ink mb-3">
                  Your Signature Product
                </p>
                <p className="text-body-md font-body-md text-on-surface-variant max-w-xl">
                  Define your core service. This single, comprehensive package will be your primary feature on ArtHearth.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-gutter">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                  {/* Art Form Category */}
                  <div className="flex flex-col gap-xs">
                    <label
                      htmlFor="artFormCategory"
                      className="text-label-mono font-label-mono text-on-surface-variant"
                    >
                      Art Form Category
                    </label>
                    <select
                      id="artFormCategory"
                      name="artFormCategory"
                      value={formData.artFormCategory}
                      onChange={handleInputChange}
                      className="w-full"
                      required
                    >
                      <option value="">Select Category</option>
                      <option value="poet">Poet</option>
                      <option value="musician">Musician</option>
                      <option value="visual">Visual Artist</option>
                      <option value="dancer">Dancer</option>
                      <option value="digital">Digital Media</option>
                      <option value="theater">Theater</option>
                      <option value="spoken-word">Spoken Word Artist</option>
                      <option value="author">Author</option>
                      <option value="cinematographer">Cinematographer</option>
                      <option value="story-teller">Story Teller</option>
                    </select>
                  </div>
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
                      placeholder="e.g. Signature Performance"
                      className="w-full"
                      required
                    />
                  </div>
                </div>

                {/* Price + Duration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                  <div className="flex flex-col gap-xs">
                    <label
                      htmlFor="price"
                      className="text-label-mono font-label-mono text-on-surface-variant"
                    >
                      Price (UGX) *
                    </label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      className="w-full"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-xs">
                    <label
                      htmlFor="duration"
                      className="text-label-mono font-label-mono text-on-surface-variant"
                    >
                      Duration / Unit
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
                      <option value="Per Piece">Per Piece</option>
                      <option value="Negotiable">Negotiable</option>
                    </select>
                  </div>
                </div>

                {/* Logistics */}
                <div className="flex flex-col gap-xs">
                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <label className="text-label-mono font-label-mono text-on-surface-variant">
                        Logistics
                      </label>
                      <span className="text-[10px] uppercase tracking-wider text-on-surface-variant">
                        Transport & Accommodation
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1">
                      Toggle whether transport is included in this package.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'inclusive', label: 'Inclusive' },
                      { value: 'exclusive', label: 'Exclusive' },
                      { value: 'other', label: 'Other' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormValue('logisticsChoice', option.value)}
                        className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${formData.logisticsChoice === option.value ? 'border-primary bg-primary text-white' : 'border-outline-variant bg-surface text-on-surface'}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {formData.logisticsChoice === 'other' && (
                    <div className="flex flex-col gap-xs pt-3">
                      <label
                        htmlFor="logisticsNote"
                        className="text-label-mono font-label-mono text-on-surface-variant"
                      >
                        Logistics details *
                      </label>
                      <input
                        type="text"
                        id="logisticsNote"
                        name="logisticsNote"
                        value={formData.logisticsNote}
                        onChange={handleInputChange}
                        placeholder="Describe any other requirements or coordination"
                        className="w-full"
                        required
                      />
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="flex flex-col gap-xs">
                  <label
                    htmlFor="description"
                    className="text-label-mono font-label-mono text-on-surface-variant"
                  >
                    Package Inclusions
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="e.g. Sound system, Setup, Post-processing, 2 Revisions (comma separated)"
                    className="w-full resize-none min-h-[140px]"
                    rows={4}
                    required
                  ></textarea>
                </div>

                {/* Navigation */}
                <div className="pt-base flex flex-col gap-3">
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-primary text-white text-body-md font-semibold px-6 py-4 shadow-lg hover:shadow-primary/30 transition-all"
                  >
                    Continue to Gallery
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/onboarding/socials')}
                    className="text-sm text-on-surface-variant hover:text-primary transition-colors"
                  >
                    I'll complete this later
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
