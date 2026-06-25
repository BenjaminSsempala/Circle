'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import '../../auth/auth.css';

export default function ArtistOnboardingPage() {
  const router = useRouter();
  const { user, loading, session } = useAuth();

  const [formData, setFormData] = useState({
    displayName: '',
    legalName: '',
    tagline: '',
    tags: '',
    artForm: '',
    otherArtForm: '',
    city: '',
    country: '',
    bio: '',
  });
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [slug, setSlug] = useState('');
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const slugTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived tag chips from the comma-separated input
  const tags = formData.tags
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading) return;

    if (!session && !user) {
      router.push('/auth/signup');
      return;
    }
    if (session && user && !user.role) {
      router.push('/auth/signup?step=role');
      return;
    }
    if (user?.role === 'organiser') {
      router.push('/onboarding/organiser');
      return;
    }
    if (user?.onboarding_complete) {
      router.push('/dashboard');
      return;
    }
  }, [user, session, loading, router]);

  // ── Resume: pre-fill form from DB if artist row already exists ────────────
  useEffect(() => {
    if (loading || !user) return;
    if (user.role && user.role !== 'artist') return;

    fetch('/api/onboarding/artist')
      .then((r) => r.json())
      .then(({ artist }) => {
        if (!artist) {
          // No artist row yet — pre-fill display_name from profile only
          if (user.display_name ?? user.full_name) {
            setFormData((prev) => ({ ...prev, displayName: user.display_name ?? user.full_name }));
          }
          return;
        }
        setFormData((prev) => ({
          ...prev,
          displayName: artist.display_name || (user.display_name ?? user.full_name) || '',
          legalName: artist.legal_name || '',
          tagline: artist.tagline || '',
          artForm: artist.art_forms?.[0] || '',
          tags: Array.isArray(artist.tags) ? artist.tags.join(', ') : '',
          city: artist.city || '',
          country: artist.country || '',
          bio: artist.bio || '',
        }));
        if (artist.profile_photo) {
          setProfilePhotoUrl(artist.profile_photo);
          setPhotoPreview(artist.profile_photo);
        }
        if (artist.bio) {
          setWordCount(
            artist.bio.trim().split(/\s+/).filter((w: string) => w.length > 0).length
          );
        }
      })
      .catch(() => {
        // Silent — just don't pre-fill
      });
  }, [loading, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Photo upload ──────────────────────────────────────────────────────────
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview immediately
    setPhotoPreview(URL.createObjectURL(file));

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) {
      setApiError('Image upload is not configured yet. Continue without a photo or add Cloudinary env vars.');
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', uploadPreset);
      fd.append('folder', 'circle/profiles');
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (data.secure_url) {
        setProfilePhotoUrl(data.secure_url);
      } else {
        setApiError('Upload failed. You can continue and add a photo later.');
      }
    } catch {
      setApiError('Upload failed. You can continue and add a photo later.');
    } finally {
      setUploading(false);
    }
  };

  // ── Form handlers ─────────────────────────────────────────────────────────
  function toSlug(name: string) {
    return name.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').replace(/^-+|-+$/g, '');
  }

  function checkSlug(value: string) {
    if (!value) { setSlugStatus('idle'); return; }
    setSlugStatus('checking');
    if (slugTimer.current) clearTimeout(slugTimer.current);
    slugTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/artists/check-slug?slug=${encodeURIComponent(value)}`);
        const data = await res.json();
        setSlugStatus(data.available ? 'available' : 'taken');
      } catch { setSlugStatus('idle'); }
    }, 400);
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSlug(val);
    checkSlug(val);
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'artForm' && value !== 'other' ? { otherArtForm: '' } : {}),
    }));
    if (name === 'bio') {
      setWordCount(value.trim().split(/\s+/).filter((w) => w.length > 0).length);
    }
    // Auto-generate slug from display name if the user hasn't manually edited it
    if (name === 'displayName') {
      const generated = toSlug(value);
      setSlug(generated);
      checkSlug(generated);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError('');

    if (!formData.displayName || !formData.legalName || !formData.artForm || !formData.city || !formData.country) {
      setApiError('Please fill all required fields.');
      return;
    }
    if (formData.artForm === 'other' && !formData.otherArtForm.trim()) {
      setApiError('Please describe your art form when selecting Other.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/onboarding/artist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: formData.displayName,
          legalName: formData.legalName,
          tagline: formData.tagline || undefined,
          artForm: formData.artForm,
          otherArtForm: formData.otherArtForm,
          tags: tags,
          city: formData.city,
          country: formData.country,
          bio: formData.bio,
          profilePhotoUrl: profilePhotoUrl || undefined,
          customSlug: slug || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setApiError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      // Also keep sessionStorage for the package page to reference artForm
      sessionStorage.setItem(
        'onboarding_artist_data',
        JSON.stringify({ ...formData, step: 1, artistId: data.artist?.id })
      );

      router.push('/onboarding/package');
    } catch {
      setApiError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-body-lg font-body-lg text-on-surface-variant animate-pulse">
            Authenticating...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md px-margin-mobile md:px-margin-desktop py-4 flex justify-between items-center border-b border-primary-container/10">
        <div className="text-headline-md font-headline-md text-primary tracking-tight">Engero</div>
        <div className="hidden md:flex items-center gap-base">
          <span className="text-label-mono font-label-mono text-primary bg-primary-container/10 px-3 py-1 rounded-full">
            Step 1 of 3
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
              Step 1 of 3
            </span>
          </div>

          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-primary-container/10 p-md md:p-lg">
            <div className="mb-lg text-center md:text-left">
              <h1 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg text-on-surface mb-2">
                Artist Profile
              </h1>
              <p className="text-body-md font-body-md text-on-surface-variant">
                Tell us who you are. This information will help us build your professional portfolio
                and personal webpage.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-gutter">
              {/* Error banner */}
              {apiError && (
                <div className="rounded-lg bg-error/10 border border-error/20 px-4 py-3 text-sm text-error">
                  {apiError}
                </div>
              )}

              {/* Profile photo */}
              <div className="flex flex-col items-center gap-3 pb-2">
                <label htmlFor="photo-upload" className="cursor-pointer group relative">
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-outline-variant group-hover:border-primary transition-colors overflow-hidden flex items-center justify-center bg-surface-container">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-on-surface-variant group-hover:text-primary transition-colors">
                        <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                        </svg>
                      </div>
                    )}
                    {/* Overlay on hover */}
                    {photoPreview && (
                      <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {uploading && (
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handlePhotoChange}
                  disabled={uploading}
                />
                <span className="text-xs text-on-surface-variant">
                  {uploading ? 'Uploading...' : photoPreview ? 'Click photo to change' : 'Add profile photo'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                {/* Display Name */}
                <div className="flex flex-col gap-xs">
                  <label
                    htmlFor="displayName"
                    className="text-label-mono font-label-mono text-on-surface-variant uppercase tracking-wider text-xs"
                  >
                    Display Name *
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    placeholder="Amani Okafor"
                    className="w-full"
                    required
                  />
                  <p className="text-caption font-caption text-on-surface-variant">
                    Shown on your profile and across Engero.
                  </p>
                </div>

                {/* Legal Name */}
                <div className="flex flex-col gap-xs">
                  <label
                    htmlFor="legalName"
                    className="text-label-mono font-label-mono text-on-surface-variant uppercase tracking-wider text-xs flex items-center gap-1.5"
                  >
                    Legal Name *
                    <svg className="w-3 h-3 text-on-surface-variant/60 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </label>
                  <input
                    type="text"
                    id="legalName"
                    name="legalName"
                    value={formData.legalName}
                    onChange={handleInputChange}
                    placeholder="Your full legal name"
                    className="w-full"
                    required
                  />
                  <p className="text-caption font-caption text-on-surface-variant">
                    Your full legal name, used only on booking agreements. Never shown publicly.
                  </p>
                </div>

                {/* Profile link / slug */}
                <div className="flex flex-col gap-xs">
                  <label
                    htmlFor="slug"
                    className="text-label-mono font-label-mono text-on-surface-variant uppercase tracking-wider text-xs"
                  >
                    Your Circle link
                  </label>
                  <div className="flex items-center border border-outline-variant/40 rounded-lg overflow-hidden focus-within:border-primary bg-surface">
                    <span className="px-3 py-2.5 bg-surface-container text-on-surface-variant text-sm border-r border-outline-variant/30 whitespace-nowrap">
                      circle.co/
                    </span>
                    <input
                      type="text"
                      id="slug"
                      value={slug}
                      onChange={handleSlugChange}
                      placeholder="your-name"
                      className="flex-1 px-3 py-2.5 text-sm text-on-surface bg-surface focus:outline-none"
                    />
                    <span className="px-3 py-2.5 shrink-0">
                      {slugStatus === 'checking' && (
                        <span className="text-on-surface-variant text-xs">…</span>
                      )}
                      {slugStatus === 'available' && (
                        <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
                          ✓ Available
                        </span>
                      )}
                      {slugStatus === 'taken' && (
                        <span className="inline-flex items-center gap-1 bg-error/10 text-error text-xs font-semibold px-2 py-0.5 rounded-full">
                          ✗ Taken
                        </span>
                      )}
                    </span>
                  </div>
                  <p className="text-caption font-caption text-on-surface-variant">
                    This is your permanent booking link — you can change it later.
                  </p>
                </div>

                {/* Profile Tags */}
                <div className="flex flex-col gap-xs">
                  <label
                    htmlFor="tags"
                    className="text-label-mono font-label-mono text-on-surface-variant uppercase tracking-wider text-xs"
                  >
                    Profile Tags
                  </label>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {tags.map((tag, index) => (
                        <span
                          key={`${tag}-${index}`}
                          className="inline-flex items-center rounded-full border border-primary-container/20 bg-primary-container/10 px-3 py-1 text-xs font-medium text-primary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                {/* Primary Art Form */}
                <div className="flex flex-col gap-xs">
                  <label
                    htmlFor="artForm"
                    className="text-label-mono font-label-mono text-on-surface-variant uppercase tracking-wider text-xs"
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
                    <option value="digital">Videographer</option>
                    <option value="theater">Actor</option>
                    <option value="spoken-word">Spoken Word Artist</option>
                    <option value="author">Author</option>
                    <option value="cinematographer">Cinematographer</option>
                    <option value="story-teller">Story Teller</option>
                    <option value="other">Other</option>
                  </select>
                  {formData.artForm === 'other' && (
                    <div className="flex flex-col gap-xs pt-4">
                      <label
                        htmlFor="otherArtForm"
                        className="text-label-mono font-label-mono text-on-surface-variant uppercase tracking-wider text-xs"
                      >
                        Other art form *
                      </label>
                      <input
                        type="text"
                        id="otherArtForm"
                        name="otherArtForm"
                        value={formData.otherArtForm}
                        onChange={handleInputChange}
                        placeholder="Tell us your craft"
                        className="w-full"
                        required
                      />
                    </div>
                  )}
                </div>

                {/* City */}
                <div className="flex flex-col gap-xs">
                  <label
                    htmlFor="city"
                    className="text-label-mono font-label-mono text-on-surface-variant uppercase tracking-wider text-xs"
                  >
                    City *
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Kampala"
                    className="w-full"
                    required
                  />
                </div>

                {/* Country */}
                <div className="flex flex-col gap-xs">
                  <label
                    htmlFor="country"
                    className="text-label-mono font-label-mono text-on-surface-variant uppercase tracking-wider text-xs"
                  >
                    Country *
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    placeholder="Uganda"
                    className="w-full"
                    required
                  />
                </div>
              </div>

              {/* Tagline */}
              <div className="flex flex-col gap-xs">
                <label
                  htmlFor="tagline"
                  className="text-label-mono font-label-mono text-on-surface-variant uppercase tracking-wider text-xs"
                >
                  Tagline <span className="normal-case font-normal opacity-60">— one line, optional</span>
                </label>
                <input
                  type="text"
                  id="tagline"
                  name="tagline"
                  value={formData.tagline}
                  onChange={handleInputChange}
                  placeholder="e.g. Spoken word poet blending tradition and technology"
                  className="w-full"
                  maxLength={120}
                />
                <p className="text-caption font-caption text-on-surface-variant">
                  Shown under your name on your profile.
                </p>
              </div>

              {/* Bio Section */}
              <div className="flex flex-col gap-xs">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="bio"
                    className="text-label-mono font-label-mono text-on-surface-variant uppercase tracking-wider text-xs"
                  >
                    Your Bio
                  </label>
                  <span
                    className={`text-label-mono font-label-mono text-[10px] ${
                      wordCount > 300 ? 'text-error' : 'text-on-surface-variant'
                    }`}
                  >
                    {wordCount}/300 words recommended
                  </span>
                </div>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="A brief introduction to who you are and your artistic journey. This will be showcased on your profile, so make it resonate with your audience."
                  className="w-full resize-none min-h-[100px]"
                  rows={3}
                />
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
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 bg-primary text-white text-body-md font-semibold px-12 py-3 rounded-lg shadow-lg hover:shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue</span>
                      <span className="text-xl">→</span>
                    </>
                  )}
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
