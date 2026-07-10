import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { createBooking } from '@/lib/services/bookings';

// ─── Types ────────────────────────────────────────────────────────────────────

export type GigPost = {
  id: string;
  audience_id: string;
  title: string;
  discipline: string[];
  slot_duration: string;
  budget: number;
  currency: string;
  technical_requirements: string | null;
  description: string | null;
  gig_date: string | null;
  venue: string | null;
  visibility: 'public' | 'targeted';
  status: 'open' | 'filled' | 'cancelled' | 'expired';
  selected_artist_id: string | null;
  selected_booking_id: string | null;
  created_at: string;
  updated_at: string;
};

export type GigApplication = {
  id: string;
  gig_post_id: string;
  artist_id: string;
  referenced_package_id: string | null;
  message: string;
  status: 'pending' | 'selected' | 'declined';
  applied_at: string;
};

// ─── createGigPost ────────────────────────────────────────────────────────────

export async function createGigPost(
  audienceId: string,
  input: {
    title: string;
    discipline: string[];
    slot_duration: string;
    budget: number;
    currency?: string;
    technical_requirements?: string;
    description?: string;
    gig_date?: string;
    venue?: string;
    visibility?: 'public' | 'targeted';
  },
): Promise<{ ok: true; gigPost: GigPost } | { ok: false; error: string }> {
  if (!input.title?.trim()) return { ok: false, error: 'Title is required' };
  if (!input.discipline || input.discipline.length === 0) return { ok: false, error: 'At least one discipline is required' };
  if (!input.slot_duration?.trim()) return { ok: false, error: 'Slot duration is required' };
  if (!input.budget || input.budget <= 0) return { ok: false, error: 'Budget must be greater than 0' };

  const { data, error } = await (await createClient())
    .from('gig_posts')
    .insert({
      audience_id: audienceId,
      title: input.title.trim(),
      discipline: input.discipline,
      slot_duration: input.slot_duration,
      budget: input.budget,
      currency: input.currency ?? 'UGX',
      technical_requirements: input.technical_requirements?.trim() || null,
      description: input.description?.trim() || null,
      gig_date: input.gig_date || null,
      venue: input.venue?.trim() || null,
      visibility: input.visibility ?? 'public',
      status: 'open',
    })
    .select()
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? 'Failed to create gig post' };

  return { ok: true, gigPost: data as GigPost };
}

// ─── applyToGig ───────────────────────────────────────────────────────────────

export async function applyToGig(
  artistUserId: string,
  gigPostId: string,
  input: { message: string; referencedPackageId?: string },
): Promise<{ ok: true; application: GigApplication } | { ok: false; error: string }> {
  if (!input.message?.trim()) return { ok: false, error: 'Message is required' };
  if (input.message.length > 300) return { ok: false, error: 'Message must be 300 characters or fewer' };

  // Lookup artist using service client to bypass RLS
  const svc = createServiceClient();

  const { data: artist } = await svc
    .from('artists')
    .select('id')
    .eq('user_id', artistUserId)
    .maybeSingle();

  if (!artist) return { ok: false, error: 'Artist profile not found' };

  // Fetch gig post
  const { data: gig } = await svc
    .from('gig_posts')
    .select('*')
    .eq('id', gigPostId)
    .maybeSingle();

  if (!gig) return { ok: false, error: 'Gig not found' };
  if (gig.status !== 'open') return { ok: false, error: 'This gig is no longer accepting applications' };

  // For targeted gigs, check invitation
  if (gig.visibility === 'targeted') {
    const { data: invitation } = await svc
      .from('gig_invitations')
      .select('id')
      .eq('gig_post_id', gigPostId)
      .eq('artist_id', artist.id)
      .maybeSingle();

    if (!invitation) return { ok: false, error: 'You have not been invited to this gig' };
  }

  // Check for duplicate application
  const { data: existing } = await svc
    .from('gig_applications')
    .select('id')
    .eq('gig_post_id', gigPostId)
    .eq('artist_id', artist.id)
    .maybeSingle();

  if (existing) return { ok: false, error: 'You have already applied to this gig' };

  // Verify referenced package belongs to this artist
  if (input.referencedPackageId) {
    const { data: pkg } = await svc
      .from('packages')
      .select('id')
      .eq('id', input.referencedPackageId)
      .eq('artist_id', artist.id)
      .maybeSingle();

    if (!pkg) return { ok: false, error: 'Package not found or does not belong to you' };
  }

  const { data, error } = await svc
    .from('gig_applications')
    .insert({
      gig_post_id: gigPostId,
      artist_id: artist.id,
      referenced_package_id: input.referencedPackageId ?? null,
      message: input.message.trim(),
      status: 'pending',
    })
    .select()
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? 'Failed to submit application' };

  return { ok: true, application: data as GigApplication };
}

// ─── selectGigApplicant ───────────────────────────────────────────────────────

export async function selectGigApplicant(
  audienceId: string,
  gigPostId: string,
  applicationId: string,
): Promise<{ ok: true; booking: unknown } | { ok: false; error: string }> {
  const svc = createServiceClient();

  // 1. Validate gig post belongs to audienceId and is open
  const { data: gig } = await svc
    .from('gig_posts')
    .select('*')
    .eq('id', gigPostId)
    .eq('audience_id', audienceId)
    .maybeSingle();

  if (!gig) return { ok: false, error: 'Gig not found or not owned by you' };
  if (gig.status !== 'open') return { ok: false, error: 'Gig is not open' };

  // 2. Fetch the application, validate it belongs to this gig
  const { data: application } = await svc
    .from('gig_applications')
    .select('*')
    .eq('id', applicationId)
    .eq('gig_post_id', gigPostId)
    .maybeSingle();

  if (!application) return { ok: false, error: 'Application not found' };

  // 3. Fetch the applying artist record
  const { data: artist } = await svc
    .from('artists')
    .select('*')
    .eq('id', application.artist_id)
    .maybeSingle();

  if (!artist) return { ok: false, error: 'Artist not found' };

  // 4. Create a package row (gig_post source, is_active=false so it never shows publicly)
  const { data: pkg, error: pkgError } = await svc
    .from('packages')
    .insert({
      artist_id: artist.id,
      name: gig.title,
      description: gig.description ?? null,
      duration: gig.slot_duration,
      price: gig.budget,
      currency: gig.currency ?? 'UGX',
      tier: 'standard',
      logistics_inclusive: false,
      is_active: false,
      source: 'gig_post',
    })
    .select()
    .single();

  if (pkgError || !pkg) return { ok: false, error: pkgError?.message ?? 'Failed to create package' };

  // 5. Get audience profile for createBooking
  const { data: profile } = await svc
    .from('profiles')
    .select('display_name, email')
    .eq('id', audienceId)
    .maybeSingle();

  const audienceEmail = profile?.email ?? '';
  const audienceName = profile?.display_name || audienceEmail;

  // 6. Call createBooking — uses service client internally, so it will find is_active=false package
  // We need to bypass the is_active check. createBooking requires is_active=true.
  // Instead, insert the booking directly via service client.
  const { data: booking, error: bookingError } = await svc
    .from('bookings')
    .insert({
      artist_id: artist.id,
      audience_id: audienceId,
      package_id: pkg.id,
      product_type: 'service',
      gig_date: gig.gig_date ?? null,
      gig_time: null,
      venue: gig.venue ?? null,
      delivery_date: null,
      special_requirements: null,
      audience_notes: null,
      price: gig.budget,
      currency: gig.currency ?? 'UGX',
      audience_name: audienceName,
      audience_email: audienceEmail,
      brand_terms: null,
      state: 'REQUESTED',
    })
    .select()
    .single();

  if (bookingError || !booking) return { ok: false, error: bookingError?.message ?? 'Failed to create booking' };

  // Insert booking event
  await svc.from('booking_events').insert({
    booking_id: booking.id,
    from_state: null,
    to_state: 'REQUESTED',
    actor_id: audienceId,
    note: `Selected from gig application: ${gig.title}`,
  });

  // 7. Update booking with gig_post_id
  await svc
    .from('bookings')
    .update({ gig_post_id: gigPostId })
    .eq('id', booking.id);

  // 8. Update gig_posts: status='filled', selected_artist_id, selected_booking_id
  await svc
    .from('gig_posts')
    .update({
      status: 'filled',
      selected_artist_id: artist.id,
      selected_booking_id: booking.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', gigPostId);

  // 9. Update selected application: status='selected'
  await svc
    .from('gig_applications')
    .update({ status: 'selected' })
    .eq('id', applicationId);

  // 10. Update all other applications for this gig_post_id: status='declined'
  await svc
    .from('gig_applications')
    .update({ status: 'declined' })
    .eq('gig_post_id', gigPostId)
    .neq('id', applicationId);

  return { ok: true, booking };
}

// ─── listGigsForArtist ────────────────────────────────────────────────────────

export async function listGigsForArtist(
  artistId: string,
  filters?: {
    discipline?: string[];
    budgetMin?: number;
    budgetMax?: number;
    dateFrom?: string;
    dateTo?: string;
  },
): Promise<(GigPost & { alreadyApplied: boolean })[]> {
  const svc = createServiceClient();

  // Fetch open public gigs
  let query = svc
    .from('gig_posts')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  if (filters?.budgetMin) query = query.gte('budget', filters.budgetMin);
  if (filters?.budgetMax) query = query.lte('budget', filters.budgetMax);
  if (filters?.dateFrom) query = query.gte('gig_date', filters.dateFrom);
  if (filters?.dateTo) query = query.lte('gig_date', filters.dateTo);

  const { data: gigs } = await query;
  if (!gigs) return [];

  // Fetch targeted gigs this artist is invited to
  const { data: invitations } = await svc
    .from('gig_invitations')
    .select('gig_post_id')
    .eq('artist_id', artistId);

  const invitedGigIds = new Set((invitations ?? []).map((i: { gig_post_id: string }) => i.gig_post_id));

  // Filter: public gigs OR targeted gigs with invitation
  let filtered = (gigs as GigPost[]).filter(
    (g) => g.visibility === 'public' || invitedGigIds.has(g.id),
  );

  // Apply discipline filter in JS (array overlap)
  if (filters?.discipline && filters.discipline.length > 0) {
    const disciplineSet = new Set(filters.discipline.map((d) => d.toLowerCase()));
    filtered = filtered.filter((g) =>
      g.discipline.some((d) => disciplineSet.has(d.toLowerCase())),
    );
  }

  // Fetch this artist's applications to mark alreadyApplied
  const { data: applications } = await svc
    .from('gig_applications')
    .select('gig_post_id')
    .eq('artist_id', artistId);

  const appliedSet = new Set((applications ?? []).map((a: { gig_post_id: string }) => a.gig_post_id));

  return filtered.map((g) => ({ ...g, alreadyApplied: appliedSet.has(g.id) }));
}
