import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { notifyBookingEvent } from '@/lib/services/notifications';
import { generateContract } from '@/lib/services/contracts';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ProductType = 'service' | 'digital' | 'merchandise';

export interface BrandTerms {
  deliverables: string;
  usage_purpose: string;
  usage_territory: string;
  usage_duration: string;
  usage_channels: string;
  exclusivity: boolean;
  exclusivity_period: string | null;
  exclusivity_exclusions: string | null;
  credit_line: string;
}

export type BookingState =
  | 'REQUESTED' | 'ACCEPTED' | 'DECLINED'
  | 'CONTRACT_DRAFT' | 'CONTRACT_SENT'
  | 'AUDIENCE_UPLOADED' | 'CONTRACT_SIGNED'
  | 'PAYMENT_PENDING' | 'PAYMENT_HELD'
  | 'GIG_ACTIVE' | 'CHECKED_IN' | 'CONFIRMING'
  | 'COMPLETED' | 'AUTO_RELEASED'
  | 'DISPUTED' | 'CANCELLED' | 'REFUNDED';

export interface Booking {
  id: string;
  artist_id: string;
  audience_id: string;
  package_id: string;
  state: BookingState;
  product_type: ProductType;
  gig_date: string | null;
  gig_time: string | null;
  venue: string | null;
  delivery_date: string | null;
  special_requirements: string | null;
  audience_notes: string | null;
  price: number;
  currency: string;
  audience_name: string | null;
  audience_email: string | null;
  artist_confirmed_at: string | null;
  audience_confirmed_at: string | null;
  brand_terms: BrandTerms | null;
  created_at: string;
  updated_at: string;
}

export interface BookingEvent {
  id: string;
  booking_id: string;
  from_state: BookingState | null;
  to_state: BookingState;
  actor_id: string | null;
  note: string | null;
  created_at: string;
}

export interface ArtistContact {
  name: string;
  photo: string | null;
  email: string | null;
  whatsapp: string | null;
}

export interface CreateBookingInput {
  packageId: string;
  productType: ProductType;
  gigDate?: string;
  gigTime?: string;
  venue?: string;
  deliveryDate?: string;
  specialRequirements?: string;
  audienceNotes?: string;
  brandTerms?: BrandTerms;
}

type Actor = 'artist' | 'audience' | 'either' | 'system';

const TRANSITIONS: Record<BookingState, { to: BookingState; actor: Actor }[]> = {
  REQUESTED:         [{ to: 'ACCEPTED', actor: 'artist' }, { to: 'DECLINED', actor: 'artist' }, { to: 'CANCELLED', actor: 'audience' }],
  ACCEPTED:          [{ to: 'CONTRACT_DRAFT', actor: 'system' }, { to: 'CONTRACT_SIGNED', actor: 'system' }],
  DECLINED:          [],
  CONTRACT_DRAFT:    [{ to: 'CONTRACT_SENT', actor: 'artist' }],
  CONTRACT_SENT:     [{ to: 'AUDIENCE_UPLOADED', actor: 'system' }],
  AUDIENCE_UPLOADED: [{ to: 'CONTRACT_SIGNED', actor: 'system' }],
  CONTRACT_SIGNED:   [{ to: 'PAYMENT_PENDING', actor: 'system' }, { to: 'CANCELLED', actor: 'either' }, { to: 'CONFIRMING', actor: 'either' }],
  PAYMENT_PENDING:   [{ to: 'PAYMENT_HELD', actor: 'system' }],
  PAYMENT_HELD:      [{ to: 'GIG_ACTIVE', actor: 'system' }, { to: 'CANCELLED', actor: 'either' }],
  GIG_ACTIVE:        [{ to: 'CHECKED_IN', actor: 'artist' }, { to: 'CONFIRMING', actor: 'system' }],
  CHECKED_IN:        [{ to: 'CONFIRMING', actor: 'system' }],
  CONFIRMING:        [{ to: 'COMPLETED', actor: 'either' }, { to: 'AUTO_RELEASED', actor: 'system' }, { to: 'DISPUTED', actor: 'either' }],
  COMPLETED:         [],
  AUTO_RELEASED:     [],
  DISPUTED:          [],
  CANCELLED:         [],
  REFUNDED:          [],
};

// ─── State machine ───────────────────────────────────────────────────────────

export async function transitionBooking(
  bookingId: string,
  toState: BookingState,
  actorId: string,
  note?: string,
) {
  const { data: booking } = await createServiceClient()
    .from('bookings')
    .select('*, artists!inner(user_id), packages(contract_required)')
    .eq('id', bookingId)
    .maybeSingle();

  if (!booking) return { ok: false, error: 'Booking not found' };

  const fromState = booking.state as BookingState;
  const allowed = TRANSITIONS[fromState]?.find((t) => t.to === toState);
  if (!allowed) return { ok: false, error: `Cannot transition from ${fromState} to ${toState}` };

  const artistUserId = (booking as unknown as { artists: { user_id: string } }).artists.user_id;
  const isArtist = actorId === artistUserId;
  const isAudience = actorId === booking.audience_id;

  if (allowed.actor === 'artist' && !isArtist) return { ok: false, error: 'Only the artist can perform this action' };
  if (allowed.actor === 'audience' && !isAudience) return { ok: false, error: 'Only the audience can perform this action' };
  if (allowed.actor === 'either' && !isArtist && !isAudience) return { ok: false, error: 'Not authorised for this booking' };
  if (allowed.actor === 'system' && actorId !== 'system' && !isArtist && !isAudience) return { ok: false, error: 'Not authorised for this booking' };

  const { data: updated, error } = await createServiceClient()
    .from('bookings')
    .update({ state: toState })
    .eq('id', bookingId)
    .select()
    .single();

  if (error || !updated) return { ok: false, error: error?.message ?? 'Failed to update booking' };

  await createServiceClient().from('booking_events').insert({
    booking_id: bookingId,
    from_state: fromState,
    to_state: toState,
    actor_id: actorId === 'system' ? null : actorId,
    note: note ?? null,
  });

  const event: BookingEvent = {
    id: '', booking_id: bookingId, from_state: fromState, to_state: toState,
    actor_id: actorId === 'system' ? null : actorId, note: note ?? null,
    created_at: new Date().toISOString(),
  };

  await notifyBookingEvent(event, updated as Booking);

  if (toState === 'GIG_ACTIVE') {
    await scheduleReminders(updated as Booking);
  }

  if (toState === 'ACCEPTED') {
    const contractRequired = (booking as unknown as { packages: { contract_required: boolean } | null }).packages?.contract_required ?? true;
    if (contractRequired) {
      const draftResult = await transitionBooking(bookingId, 'CONTRACT_DRAFT', 'system');
      if (draftResult.ok) {
        await generateContract(bookingId);
        return draftResult;
      }
    } else {
      // No contract needed — lock in immediately
      return transitionBooking(bookingId, 'CONTRACT_SIGNED', 'system');
    }
  }

  return { ok: true as const, booking: updated as Booking };
}

// ─── Confirm completion (CONFIRMING -> COMPLETED, both parties) ─────────────

export async function confirmCompletion(
  bookingId: string,
  actorId: string,
) {
  const { data: booking } = await createServiceClient()
    .from('bookings')
    .select('*, artists!inner(user_id)')
    .eq('id', bookingId)
    .maybeSingle();

  if (!booking) return { ok: false, error: 'Booking not found' };
  if (booking.state !== 'CONFIRMING' && booking.state !== 'CONTRACT_SIGNED') {
    return { ok: false, error: `Cannot confirm completion from ${booking.state}` };
  }

  const artistUserId = (booking as unknown as { artists: { user_id: string } }).artists.user_id;
  const isArtist = actorId === artistUserId;
  const isAudience = actorId === booking.audience_id;
  if (!isArtist && !isAudience) return { ok: false, error: 'Not authorised for this booking' };

  // First party to confirm triggers the CONFIRMING transition
  if (booking.state === 'CONTRACT_SIGNED') {
    const transition = await transitionBooking(bookingId, 'CONFIRMING', actorId);
    if (!transition.ok) return transition;
  }

  const field = isArtist ? 'artist_confirmed_at' : 'audience_confirmed_at';
  const { data: updated, error } = await createServiceClient()
    .from('bookings')
    .update({ [field]: new Date().toISOString() })
    .eq('id', bookingId)
    .select()
    .single();

  if (error || !updated) return { ok: false, error: error?.message ?? 'Failed to record confirmation' };

  const bothConfirmed = !!updated.artist_confirmed_at && !!updated.audience_confirmed_at;
  if (bothConfirmed) {
    return transitionBooking(bookingId, 'COMPLETED', actorId);
  }

  return { ok: true as const, booking: updated as Booking };
}

async function scheduleReminders(booking: Booking) {
  const referenceDate = booking.gig_date ?? booking.delivery_date;
  if (!referenceDate) return;

  const ref = new Date(`${referenceDate}T00:00:00Z`);
  const reminders: { booking_id: string; send_at: string; type: string }[] = [];

  if (booking.product_type === 'service' && booking.gig_date) {
    const oneWeekBefore = new Date(ref);
    oneWeekBefore.setUTCDate(oneWeekBefore.getUTCDate() - 7);
    reminders.push({ booking_id: booking.id, send_at: oneWeekBefore.toISOString(), type: 'rehearsal_1_week' });

    const oneDayBefore = new Date(ref);
    oneDayBefore.setUTCDate(oneDayBefore.getUTCDate() - 1);
    reminders.push({ booking_id: booking.id, send_at: oneDayBefore.toISOString(), type: 'logistics_1_day' });
  }

  const audienceOneDayBefore = new Date(ref);
  audienceOneDayBefore.setUTCDate(audienceOneDayBefore.getUTCDate() - 1);
  reminders.push({ booking_id: booking.id, send_at: audienceOneDayBefore.toISOString(), type: 'audience_1_day' });

  if (reminders.length > 0) {
    await createServiceClient().from('booking_reminders').insert(reminders);
  }
}

// ─── Create booking ──────────────────────────────────────────────────────────

export async function createBooking(
  audience: { id: string; name: string; email: string },
  input: CreateBookingInput,
) {
  const audienceId = audience.id;

  const { data: pkg } = await createServiceClient()
    .from('packages')
    .select('*')
    .eq('id', input.packageId)
    .eq('is_active', true)
    .maybeSingle();

  if (!pkg) return { ok: false, error: 'Package not found' };

  const { data: artist } = await createServiceClient()
    .from('artists')
    .select('*')
    .eq('id', pkg.artist_id)
    .maybeSingle();

  if (!artist) return { ok: false, error: 'Artist not found' };

  if (input.productType === 'service') {
    if (!input.gigDate) return { ok: false, error: 'gigDate is required for service bookings' };

    const today = new Date().toISOString().slice(0, 10);
    if (input.gigDate <= today) return { ok: false, error: 'gigDate must be in the future' };

    const { data: blackout } = await createServiceClient()
      .from('availability')
      .select('id')
      .eq('artist_id', artist.id)
      .eq('date', input.gigDate)
      .eq('type', 'blackout')
      .maybeSingle();

    if (blackout) return { ok: false, error: 'Artist is unavailable on this date' };
  }

  if (input.productType === 'digital') {
    if (!input.deliveryDate) return { ok: false, error: 'deliveryDate is required for digital bookings' };

    const today = new Date().toISOString().slice(0, 10);
    if (input.deliveryDate <= today) return { ok: false, error: 'deliveryDate must be in the future' };
  }

  const { data: booking, error } = await createServiceClient()
    .from('bookings')
    .insert({
      artist_id: artist.id,
      audience_id: audienceId,
      package_id: pkg.id,
      product_type: input.productType,
      gig_date: input.gigDate ?? null,
      gig_time: input.gigTime || null,
      venue: input.venue ?? null,
      delivery_date: input.deliveryDate ?? null,
      special_requirements: input.specialRequirements ?? null,
      audience_notes: input.audienceNotes ?? null,
      price: pkg.price,
      currency: pkg.currency,
      audience_name: audience.name,
      audience_email: audience.email,
      brand_terms: input.brandTerms ?? null,
    })
    .select()
    .single();

  if (error || !booking) return { ok: false, error: error?.message ?? 'Failed to create booking' };

  if (input.productType === 'service' && input.gigDate) {
    await createServiceClient()
      .from('availability')
      .upsert({ artist_id: artist.id, date: input.gigDate, type: 'booked', booking_id: booking.id }, { onConflict: 'artist_id,date' });
  }

  await createServiceClient().from('booking_events').insert({
    booking_id: booking.id,
    from_state: null,
    to_state: 'REQUESTED',
    actor_id: audienceId,
    note: null,
  });

  await notifyBookingEvent(
    { id: '', booking_id: booking.id, from_state: null, to_state: 'REQUESTED', actor_id: audienceId, note: null, created_at: new Date().toISOString() },
    booking as Booking,
  );

  // Auto-accept: immediately transition on behalf of the artist
  if ((pkg as unknown as { auto_accept?: boolean }).auto_accept) {
    await transitionBooking(booking.id, 'ACCEPTED', artist.user_id);
  }

  const artistContact: ArtistContact = {
    name: artist.name,
    photo: artist.profile_photo ?? null,
    email: null,
    whatsapp: (artist.social_links as Record<string, string> | null)?.whatsapp ?? null,
  };

  return { ok: true as const, booking: booking as Booking, artistContact };
}

// ─── Read ────────────────────────────────────────────────────────────────────

export async function getBooking(bookingId: string, userId: string) {
  const supabase = await createClient();

  const { data: booking } = await supabase
    .from('bookings')
    .select('*, artists!inner(id, user_id, name, slug, profile_photo, city, country, art_forms, social_links), packages(id, name, description, duration)')
    .eq('id', bookingId)
    .maybeSingle();

  if (!booking) return { ok: false as const, error: 'Booking not found' };

  const artist = (booking as unknown as { artists: { user_id: string } }).artists;
  if (artist.user_id !== userId && booking.audience_id !== userId) {
    return { ok: false as const, error: 'Forbidden' };
  }

  const { data: events } = await (await createClient())
    .from('booking_events')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true });

  const { data: contract } = await (await createClient())
    .from('contracts')
    .select('*')
    .eq('booking_id', bookingId)
    .maybeSingle();

  return {
    ok: true as const,
    booking,
    events: events ?? [],
    contract: contract ?? null,
    role: artist.user_id === userId ? 'artist' as const : 'audience' as const,
  };
}

export async function listBookings(userId: string, role: 'artist' | 'audience') {
  const supabase = await createClient();

  let query = supabase
    .from('bookings')
    .select('*, artists!inner(id, user_id, name, slug, profile_photo), packages(id, name)')
    .order('created_at', { ascending: false });

  if (role === 'artist') {
    query = query.eq('artists.user_id', userId);
  } else {
    query = query.eq('audience_id', userId);
  }

  const { data, error } = await query;
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, bookings: data ?? [] };
}
