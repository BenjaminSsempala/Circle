'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '../../auth/auth.css';

export default function ArtistOnboardingPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    tags: '',
    artForm: '',
    city: '',
    bio: '',
  });
  const [wordCount, setWordCount] = useState(0);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'bio') {
      setWordCount(value.split(/\s+/).filter((w) => w.length > 0).length);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.artForm || !formData.city) {
      alert('Please fill all required fields');
      return;
    }

    // Store in session
    sessionStorage.setItem(
      'onboarding_artist',
      JSON.stringify({
        ...formData,
        step: 1,
      })
    );

    // Frontend flag - skip API wait
    if (true) {
      router.push('/onboarding/package');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md px-margin-mobile md:px-margin-desktop py-4 flex justify-between items-center border-b border-primary-container/10">
        <div className="text-headline-md font-headline-md text-primary tracking-tight">Circle</div>
        <div className="hidden md:flex items-center gap-base">
          <span className="text-label-mono font-label-mono text-primary bg-primary-container/10 px-3 py-1 rounded-full">
            Step 1 of 4
          </span>
        </div>
        <button
          onClick={() => router.push('/auth/signup')}
          className="text-on-surface-variant hover:text-primary transition-colors"
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

          {/* Onboarding Card */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-primary-container/10 p-md md:p-lg">
            <div className="mb-lg text-center md:text-left">
              <h1 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg text-on-surface mb-2">
                Claim your space
              </h1>
              <p className="text-body-md font-body-md text-on-surface-variant">
                Tell us who you are. This information will help us build your profile
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-gutter">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                {/* Full Name */}
                <div className="flex flex-col gap-xs">
                  <label
                    htmlFor="fullName"
                    className="text-label-mono font-label-mono text-on-surface-variant"
                  >
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
                  <label
                    htmlFor="tags"
                    className="text-label-mono font-label-mono text-on-surface-variant"
                  >
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
                  <label
                    htmlFor="artForm"
                    className="text-label-mono font-label-mono text-on-surface-variant"
                  >
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
                  <label
                    htmlFor="city"
                    className="text-label-mono font-label-mono text-on-surface-variant"
                  >
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

              {/* Bio */}
              <div className="flex flex-col gap-xs">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="bio"
                    className="text-label-mono font-label-mono text-on-surface-variant"
                  >
                    Your story, Bio or description
                  </label>
                  <span className="text-label-mono font-label-mono text-caption text-on-surface-variant">
                    {wordCount}/12 words
                  </span>
                </div>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  maxLength={150}
                  placeholder="Bridging ancestral rhythms with modern jazz through the strings of an nyatiti."
                  className="w-full resize-none"
                  rows={2}
                ></textarea>
                <p className="text-caption font-caption text-on-surface-variant italic mt-1">
                  Make it resonant. This will be your primary greeting to the community.
                </p>
              </div>

              {/* Navigation Actions */}
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

          {/* Trust Indicator */}
          <div className="mt-gutter flex flex-col md:flex-row items-center justify-between gap-base opacity-60">
            <div className="flex items-center gap-2">
              <span className="text-[20px]">✓</span>
              <span className="text-caption font-caption">Your data stays within the Circle.</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
