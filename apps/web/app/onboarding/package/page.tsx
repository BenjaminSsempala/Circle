'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import '../../auth/auth.css';

export default function PackageOnboardingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // ── All hooks declared unconditionally at the top ─────────────────────────
  const [formData, setFormData] = useState({
    packageName: '',
    description: '',
    price: '',
    currency: 'UGX',
    duration: '1 hour',
    logisticsChoice: 'inclusive',
    logisticsNote: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/auth/signup'); return; }
    if (user.onboarding_complete) { router.push('/dashboard'); return; }
    if (user.role === 'organiser') { router.push('/onboarding/organiser'); return; }
  }, [user, loading, router]);

  // ── Form helpers ──────────────────────────────────────────────────────────
  const setFormValue = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'logisticsChoice' && value !== 'other' ? { logisticsNote: '' } : {}),
    }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setFormValue(e.target.name, e.target.value);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError('');

    if (!formData.packageName || !formData.price || !formData.description) {
      setApiError('Please fill all required fields.');
      return;
    }
    if (formData.logisticsChoice === 'other' && !formData.logisticsNote.trim()) {
      setApiError('Please provide logistics details when selecting Other.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/onboarding/package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageName: formData.packageName,
          description: formData.description,
          price: formData.price,
          currency: formData.currency,
          duration: formData.duration,
          logisticsInclusive: formData.logisticsChoice === 'inclusive',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setApiError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      router.push('/onboarding/socials');
    } catch {
      setApiError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    // Artist chose to add packages later — skip to socials
    router.push('/onboarding/socials');
  };

  // ── Render guards ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-body-lg font-body-lg text-on-surface-variant">Loading...</div>
      </div>
    );
  }

  if (!user || user.onboarding_complete || (user.role && user.role !== 'artist')) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md px-margin-mobile md:px-margin-desktop py-4 flex justify-between items-center border-b border-primary-container/10">
        <div className="flex items-center gap-xs">
          <span className="text-headline-md font-headline-md tracking-tight text-primary">Circle</span>
        </div>
        <div className="hidden md:flex items-center gap-sm">
          <span className="text-label-mono font-label-mono text-on-surface-variant">Step 2 of 3</span>
          <div className="flex gap-1">
            <div className="h-1.5 w-6 rounded-full bg-primary-container" />
            <div className="h-1.5 w-6 rounded-full bg-primary-container" />
            <div className="h-1.5 w-6 rounded-full bg-surface-variant" />
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
                Step 2 of 3
              </span>
            </div>

            <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-primary-container/10 p-md md:p-lg">
              <div className="mb-lg">
                <p className="text-3xl md:text-4xl font-semibold text-ink mb-3">
                  Your Signature Product
                </p>
                <p className="text-body-md font-body-md text-on-surface-variant max-w-xl">
                  Define your core service. This single, comprehensive package will be the first
                  thing clients see on your profile.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-gutter">
                {/* Error banner */}
                {apiError && (
                  <div className="rounded-lg bg-error/10 border border-error/20 px-4 py-3 text-sm text-error">
                    {apiError}
                  </div>
                )}

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
                    placeholder="e.g. Signature Performance"
                    className="w-full"
                    required
                  />
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
                      placeholder="0"
                      min="0"
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
                        Transport &amp; Accommodation
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
                        className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                          formData.logisticsChoice === option.value
                            ? 'border-primary bg-primary text-white'
                            : 'border-outline-variant bg-surface text-on-surface'
                        }`}
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
                        placeholder="Describe any other transport or accommodation requirements"
                        className="w-full"
                        required
                      />
                    </div>
                  )}
                </div>

                {/* Description / Inclusions */}
                <div className="flex flex-col gap-xs">
                  <label
                    htmlFor="description"
                    className="text-label-mono font-label-mono text-on-surface-variant"
                  >
                    What&apos;s included *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="e.g. Sound system, Stage setup, Post-processing, 2 Revisions"
                    className="w-full resize-none min-h-[140px]"
                    rows={4}
                    required
                  />
                </div>

                {/* Navigation */}
                <div className="pt-base flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-xl bg-primary text-white text-body-md font-semibold px-6 py-4 shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      'Continue to Socials'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="text-sm text-on-surface-variant hover:text-primary transition-colors"
                  >
                    I&apos;ll complete this later
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
