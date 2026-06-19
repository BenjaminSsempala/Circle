import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';
import { generateSlug } from '@/lib/utils/slug';

// Deduplicate across layout + page in the same server render
export const getArtistByUserIdCached = cache(async (userId: string) => {
  return getArtistByUserId(userId);
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type Work = {
  id: string;
  order?: number;
  title: string;
  category: string;
  type: 'video' | 'audio' | 'image' | 'document';
  provider: 'youtube' | 'tiktok' | 'spotify' | 'soundcloud' | 'instagram' | 'cloudinary';
  media_url: string;
  thumbnail_url: string;
  metadata: { year?: number; description?: string };
};

// ─── Read ────────────────────────────────────────────────────────────────────

// Normalise raw DB row to always have display_name (works both pre- and post-migration).
// Before migration the column is still called `name`; after it becomes `display_name`.
function normaliseArtist<T>(raw: T): T & { display_name: string; name: string } {
  const r = raw as Record<string, unknown>;
  const display_name = (r.display_name ?? '') as string;
  return Object.assign({}, raw, { display_name, name: display_name });
}

export async function getArtistBySlug(slug: string) {
  const supabase = await createClient();

  const { data: artist, error } = await supabase
    .from('artists')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) return { ok: false as const, error: error.message };
  if (!artist) return { ok: false as const, error: 'Not found' };

  const [{ data: packages }, { data: profile }] = await Promise.all([
    (await createClient())
      .from('packages')
      .select('*')
      .eq('artist_id', artist.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true }),
    (await createClient())
      .from('profiles')
      .select('email')
      .eq('id', artist.user_id)
      .maybeSingle(),
  ]);

  const normalised = normaliseArtist({ ...artist, account_email: profile?.email ?? null });
  return { ok: true as const, artist: normalised, packages: packages ?? [] };
}

export async function getArtistByUserId(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('artists')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, artist: data ? normaliseArtist(data) : null };
}

// ─── Upsert artist profile (Step 1) ─────────────────────────────────────────

export async function upsertArtistProfile(
  userId: string,
  data: {
    displayName: string;
    legalName: string;
    tagline?: string;
    artForm: string;
    otherArtForm?: string;
    tags?: string[];
    city: string;
    country: string;
    bio?: string;
    profilePhotoUrl?: string;
    customSlug?: string;
  }
) {
  const supabase = await createClient();

  const primaryArtForm =
    data.artForm === 'other' ? (data.otherArtForm || '').trim() : data.artForm;

  // Check if artist row already exists for this user
  const { data: existing } = await supabase
    .from('artists')
    .select('id, slug')
    .eq('user_id', userId)
    .maybeSingle();

  const payload: Record<string, unknown> = {
    display_name: data.displayName,
    legal_name: data.legalName,
    art_forms: primaryArtForm ? [primaryArtForm] : [],
    tags: data.tags ?? [],
    city: data.city,
    country: data.country,
    bio: data.bio ?? '',
  };
  if (data.tagline !== undefined) payload.tagline = data.tagline;

  if (data.profilePhotoUrl) {
    payload.profile_photo = data.profilePhotoUrl;
  }

  if (existing) {
    // UPDATE existing row
    const { data: updated, error } = await supabase
      .from('artists')
      .update(payload)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, artist: updated };
  }

  // INSERT — use custom slug if provided and valid, otherwise auto-generate
  let slug = data.customSlug?.trim() || generateSlug(data.displayName);

  const { data: slugConflict } = await supabase
    .from('artists')
    .select('slug')
    .eq('slug', slug)
    .maybeSingle();

  if (slugConflict) {
    slug = `${slug}-${Math.floor(Math.random() * 9000) + 1000}`;
  }

  const { data: created, error } = await supabase
    .from('artists')
    .insert({ user_id: userId, slug, ...payload })
    .select()
    .single();

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, artist: created };
}

// ─── Create package (Step 2) ─────────────────────────────────────────────────

export async function createPackage(
  artistId: string,
  data: {
    name: string;
    description: string;
    price: number;
    currency: string;
    duration: string;
    logisticsInclusive: boolean;
    productType?: 'service' | 'digital' | 'merchandise';
    autoAccept?: boolean;
    contractRequired?: boolean;
  }
) {
  const supabase = await createClient();

  const { data: pkg, error } = await supabase
    .from('packages')
    .insert({
      artist_id: artistId,
      name: data.name,
      description: data.description,
      price: data.price,
      currency: data.currency || 'UGX',
      duration: data.duration,
      logistics_inclusive: data.logisticsInclusive,
      tier: 'standard',
      product_type: data.productType ?? 'service',
      auto_accept: data.autoAccept ?? false,
      contract_required: data.contractRequired ?? true,
    })
    .select()
    .single();

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, package: pkg };
}

// ─── Patch artist profile (dashboard edits) ──────────────────────────────────

export async function patchArtistProfile(
  userId: string,
  fields: Partial<{
    display_name: string;
    legal_name: string;
    tagline: string;
    bio: string;
    tags: string[];
    city: string;
    country: string;
    profile_photo: string;
    art_forms: string[];
    social_links: Record<string, string>;
  }>
) {
  const supabase = await createClient();
  const patch = { ...fields };
  const { error } = await supabase
    .from('artists')
    .update(patch)
    .eq('user_id', userId);

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

// ─── Upsert package (add or edit) ────────────────────────────────────────────

export async function upsertPackage(
  artistId: string,
  data: {
    id?: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    duration: string;
    logisticsInclusive: boolean;
    isActive?: boolean;
    productType?: 'service' | 'digital' | 'merchandise';
    autoAccept?: boolean;
    contractRequired?: boolean;
  }
) {
  const supabase = await createClient();

  const payload: Record<string, unknown> = {
    name: data.name,
    description: data.description,
    price: data.price,
    currency: data.currency,
    duration: data.duration,
    logistics_inclusive: data.logisticsInclusive,
  };
  if (data.isActive !== undefined) payload.is_active = data.isActive;
  if (data.productType !== undefined) payload.product_type = data.productType;
  if (data.autoAccept !== undefined) payload.auto_accept = data.autoAccept;
  if (data.contractRequired !== undefined) payload.contract_required = data.contractRequired;

  if (data.id) {
    const { data: pkg, error } = await supabase
      .from('packages')
      .update(payload)
      .eq('id', data.id)
      .eq('artist_id', artistId)
      .select()
      .single();

    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, package: pkg };
  }

  const { data: pkg, error } = await supabase
    .from('packages')
    .insert({ artist_id: artistId, tier: 'standard', is_active: true, ...payload })
    .select()
    .single();

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, package: pkg };
}

// ─── Selected Works ───────────────────────────────────────────────────────────

async function getWorks(userId: string): Promise<{ artistId: string; works: Work[] } | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('artists')
    .select('id, selected_works')
    .eq('user_id', userId)
    .maybeSingle();
  if (!data) return null;
  return {
    artistId: data.id,
    works: Array.isArray(data.selected_works) ? (data.selected_works as Work[]) : [],
  };
}

export async function addWork(userId: string, work: Omit<Work, 'id'>) {
  const supabase = await createClient();
  const ctx = await getWorks(userId);
  if (!ctx) return { ok: false as const, error: 'Artist not found' };
  if (ctx.works.length >= 6) return { ok: false as const, error: 'Maximum of 6 works allowed' };

  const newWork: Work = { ...work, id: crypto.randomUUID(), order: ctx.works.length };
  const { error } = await supabase
    .from('artists')
    .update({ selected_works: [...ctx.works, newWork] })
    .eq('user_id', userId);

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, work: newWork };
}

export async function updateWork(userId: string, workId: string, updates: Partial<Omit<Work, 'id'>>) {
  const supabase = await createClient();
  const ctx = await getWorks(userId);
  if (!ctx) return { ok: false as const, error: 'Artist not found' };

  const updated = ctx.works.map((w) => (w.id === workId ? { ...w, ...updates } : w));
  const { error } = await supabase
    .from('artists')
    .update({ selected_works: updated })
    .eq('user_id', userId);

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

export async function deleteWork(userId: string, workId: string) {
  const supabase = await createClient();
  const ctx = await getWorks(userId);
  if (!ctx) return { ok: false as const, error: 'Artist not found' };

  const filtered = ctx.works.filter((w) => w.id !== workId);
  const { error } = await supabase
    .from('artists')
    .update({ selected_works: filtered })
    .eq('user_id', userId);

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

export async function reorderWorks(userId: string, orderedIds: string[]) {
  const supabase = await createClient();
  const ctx = await getWorks(userId);
  if (!ctx) return { ok: false as const, error: 'Artist not found' };

  const workMap = new Map(ctx.works.map((w) => [w.id, w]));
  const reordered = orderedIds
    .filter((id) => workMap.has(id))
    .map((id, i) => ({ ...workMap.get(id)!, order: i }));
  const remaining = ctx.works
    .filter((w) => !orderedIds.includes(w.id))
    .map((w, i) => ({ ...w, order: reordered.length + i }));

  const { error } = await supabase
    .from('artists')
    .update({ selected_works: [...reordered, ...remaining] })
    .eq('user_id', userId);

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

// ─── Delete package ───────────────────────────────────────────────────────────

export async function deletePackage(packageId: string, artistId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('packages')
    .delete()
    .eq('id', packageId)
    .eq('artist_id', artistId);

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

// ─── Update social links (Step 3) ────────────────────────────────────────────

export async function updateSocialLinks(
  userId: string,
  socialLinks: Record<string, string>
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('artists')
    .update({ social_links: socialLinks })
    .eq('user_id', userId);

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

// ─── Complete onboarding (Step 4) ────────────────────────────────────────────

export async function completeOnboarding(userId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_complete: true })
    .eq('id', userId);

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

// ─── Update slug + record old slug in history ─────────────────────────────────

export async function updateArtistSlug(userId: string, newSlug: string) {
  const supabase = await createClient();

  const { data: artist, error: fetchError } = await supabase
    .from('artists')
    .select('id, slug')
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError || !artist) return { ok: false as const, error: 'Artist not found' };
  if (artist.slug === newSlug) return { ok: true as const };

  const { data: conflict } = await supabase
    .from('artists')
    .select('id')
    .eq('slug', newSlug)
    .maybeSingle();

  if (conflict) return { ok: false as const, error: 'Slug already taken' };

  await supabase
    .from('slug_history')
    .upsert({ artist_id: artist.id, old_slug: artist.slug }, { onConflict: 'old_slug' });

  const { error: updateError } = await supabase
    .from('artists')
    .update({ slug: newSlug })
    .eq('id', artist.id);

  if (updateError) return { ok: false as const, error: updateError.message };
  return { ok: true as const };
}

// ─── Look up slug history for 301 redirects ───────────────────────────────────

export async function getRedirectSlug(oldSlug: string): Promise<string | null> {
  const supabase = await createClient();

  const { data: history } = await supabase
    .from('slug_history')
    .select('artist_id')
    .eq('old_slug', oldSlug)
    .maybeSingle();

  if (!history) return null;

  const { data: artist } = await supabase
    .from('artists')
    .select('slug')
    .eq('id', history.artist_id)
    .maybeSingle();

  return artist?.slug ?? null;
}
