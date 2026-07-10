import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeChain, makeMockClient, makeSequentialClient } from '@/lib/test-utils/supabase';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: vi.fn() }));
vi.mock('@/lib/services/bookings', () => ({
  createBooking: vi.fn().mockResolvedValue({ ok: true, booking: { id: 'bk-001' }, artistContact: {} }),
}));
vi.mock('@/lib/services/notifications', () => ({
  notifyBookingEvent: vi.fn().mockResolvedValue(undefined),
}));

import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@/lib/supabase/server';
import { selectGigApplicant, applyToGig, createGigPost } from '@/lib/services/gigs';

const mockCreateServiceClient = createServiceClient as unknown as ReturnType<typeof vi.fn>;
const mockCreateClient = createClient as unknown as ReturnType<typeof vi.fn>;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const AUDIENCE_ID = 'audience-001';
const GIG_ID = 'gig-001';
const APPLICATION_ID = 'app-001';
const ARTIST_ID = 'artist-001';

function makeGig(overrides: Record<string, unknown> = {}) {
  return {
    id: GIG_ID,
    audience_id: AUDIENCE_ID,
    title: 'Wedding Singer',
    discipline: ['music'],
    slot_duration: '2 hours',
    budget: 200000,
    currency: 'UGX',
    technical_requirements: null,
    description: 'Wedding ceremony',
    gig_date: '2026-12-20',
    venue: 'Hotel Africana',
    visibility: 'public',
    status: 'open',
    selected_artist_id: null,
    selected_booking_id: null,
    created_at: '2026-06-19T00:00:00Z',
    updated_at: '2026-06-19T00:00:00Z',
    ...overrides,
  };
}

function makeApplication() {
  return {
    id: APPLICATION_ID,
    gig_post_id: GIG_ID,
    artist_id: ARTIST_ID,
    referenced_package_id: null,
    message: 'I would love to perform!',
    status: 'pending',
    applied_at: '2026-06-19T00:00:00Z',
  };
}

function makeArtist() {
  return {
    id: ARTIST_ID,
    user_id: 'artist-user-001',
    display_name: 'Naira Music',
    legal_name: 'Naira Full Name',
    social_links: {},
    profile_photo: null,
    city: 'Kampala',
    country: 'Uganda',
  };
}

function makePackage() {
  return {
    id: 'pkg-gig-001',
    artist_id: ARTIST_ID,
    name: 'Wedding Singer',
    description: 'Wedding ceremony',
    duration: '2 hours',
    price: 200000,
    currency: 'UGX',
    tier: 'standard',
    logistics_inclusive: false,
    is_active: false,
    source: 'gig_post',
  };
}

function makeBookingRow() {
  return {
    id: 'bk-gig-001',
    artist_id: ARTIST_ID,
    audience_id: AUDIENCE_ID,
    package_id: 'pkg-gig-001',
    state: 'REQUESTED',
  };
}

// ─── selectGigApplicant ───────────────────────────────────────────────────────

describe('selectGigApplicant', () => {
  beforeEach(() => vi.clearAllMocks());

  /**
   * NOTE — GAP: selectGigApplicant bypasses is_active check by inserting bookings directly.
   * This means it can create a booking from an inactive package, unlike createBooking.
   *
   * selectGigApplicant calls createServiceClient() ONCE and reuses svc for all queries.
   * We use makeSequentialClient so each from(table) call gets the right response.
   */
  function setupSelectApplicantMocks(options: {
    gigOverride?: Record<string, unknown>;
    noGig?: boolean;
    noApplication?: boolean;
    noArtist?: boolean;
  } = {}) {
    const gigData = options.noGig ? null : makeGig(options.gigOverride ?? {});
    const applicationData = options.noApplication ? null : makeApplication();
    const artistData = options.noArtist ? null : makeArtist();
    const profileData = { display_name: 'Event Corp', email: 'events@corp.com' };
    const bookingData = makeBookingRow();

    const client = makeSequentialClient({
      gig_posts: [
        { data: gigData, error: null },   // lookup
        { data: {}, error: null },         // update status=filled
      ],
      gig_applications: [
        { data: applicationData, error: null }, // lookup application
        { data: {}, error: null },               // update selected
        { data: {}, error: null },               // update declined others
      ],
      artists: [{ data: artistData, error: null }],
      packages: [{ data: makePackage(), error: null }],
      profiles: [{ data: profileData, error: null }],
      bookings: [
        { data: bookingData, error: null }, // insert
        { data: {}, error: null },           // update gig_post_id
      ],
      booking_events: [{ data: {}, error: null }],
    });

    mockCreateServiceClient.mockReturnValue(client);
  }

  it('returns ok:false when gig is not found or not owned by audience', async () => {
    setupSelectApplicantMocks({ noGig: true });
    const result = await selectGigApplicant(AUDIENCE_ID, GIG_ID, APPLICATION_ID);
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/not found/i);
  });

  it('returns ok:false when gig is not open', async () => {
    setupSelectApplicantMocks({ gigOverride: { status: 'filled' } });
    const result = await selectGigApplicant(AUDIENCE_ID, GIG_ID, APPLICATION_ID);
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/not open/i);
  });

  it('returns ok:false when application is not found', async () => {
    setupSelectApplicantMocks({ noApplication: true });
    const result = await selectGigApplicant(AUDIENCE_ID, GIG_ID, APPLICATION_ID);
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/Application not found/);
  });

  it('returns ok:false when artist is not found', async () => {
    setupSelectApplicantMocks({ noArtist: true });
    const result = await selectGigApplicant(AUDIENCE_ID, GIG_ID, APPLICATION_ID);
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/Artist not found/);
  });

  it('returns ok:true and creates booking directly (bypassing is_active check)', async () => {
    setupSelectApplicantMocks();
    const result = await selectGigApplicant(AUDIENCE_ID, GIG_ID, APPLICATION_ID);
    // GAP: selectGigApplicant bypasses createBooking's is_active=true check.
    // This is intentional by design but differs from createBooking behaviour.
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.booking).toBeDefined();
    }
  });
});

// ─── applyToGig ───────────────────────────────────────────────────────────────

describe('applyToGig', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns ok:false when message is empty', async () => {
    const result = await applyToGig('artist-user-1', 'gig-1', { message: '' });
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/Message is required/);
  });

  it('returns ok:false when message exceeds 300 characters', async () => {
    const result = await applyToGig('artist-user-1', 'gig-1', { message: 'a'.repeat(301) });
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/300 characters/);
  });

  it('returns ok:false when artist profile not found', async () => {
    const artistChain = makeChain({ data: null, error: null });
    mockCreateServiceClient.mockReturnValue(makeMockClient({ artists: artistChain }));
    const result = await applyToGig('no-such-user', 'gig-1', { message: 'Hello!' });
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/Artist profile not found/);
  });

  // applyToGig calls createServiceClient() ONCE — use makeSequentialClient for per-table dispatch

  it('returns ok:false when gig is not found', async () => {
    mockCreateServiceClient.mockReturnValue(makeSequentialClient({
      artists: [{ data: { id: ARTIST_ID }, error: null }],
      gig_posts: [{ data: null, error: null }],
    }));
    const result = await applyToGig('artist-user-1', 'nonexistent-gig', { message: 'Hello!' });
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/Gig not found/);
  });

  it('returns ok:false when gig is not open', async () => {
    mockCreateServiceClient.mockReturnValue(makeSequentialClient({
      artists: [{ data: { id: ARTIST_ID }, error: null }],
      gig_posts: [{ data: makeGig({ status: 'filled' }), error: null }],
    }));
    const result = await applyToGig('artist-user-1', GIG_ID, { message: 'Please!' });
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/no longer accepting/);
  });

  it('returns ok:false when already applied to gig', async () => {
    mockCreateServiceClient.mockReturnValue(makeSequentialClient({
      artists: [{ data: { id: ARTIST_ID }, error: null }],
      gig_posts: [{ data: makeGig(), error: null }],
      gig_applications: [{ data: { id: 'existing-app' }, error: null }], // existing check
    }));
    const result = await applyToGig('artist-user-1', GIG_ID, { message: 'Please hire me!' });
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/already applied/);
  });

  it('returns ok:true on successful application', async () => {
    const appData = makeApplication();
    mockCreateServiceClient.mockReturnValue(makeSequentialClient({
      artists: [{ data: { id: ARTIST_ID }, error: null }],
      gig_posts: [{ data: makeGig(), error: null }],
      gig_applications: [
        { data: null, error: null },       // no existing (duplicate check)
        { data: appData, error: null },    // insert result
      ],
    }));
    const result = await applyToGig('artist-user-1', GIG_ID, { message: 'Please hire me!' });
    expect(result.ok).toBe(true);
  });
});

// ─── createGigPost ────────────────────────────────────────────────────────────

describe('createGigPost', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns ok:false when title is empty', async () => {
    const client = { from: vi.fn(), auth: {} };
    mockCreateClient.mockResolvedValue(client);
    const result = await createGigPost(AUDIENCE_ID, {
      title: '  ', discipline: ['music'], slot_duration: '1hr', budget: 100,
    });
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/Title is required/);
  });

  it('returns ok:false when no disciplines provided', async () => {
    const client = { from: vi.fn(), auth: {} };
    mockCreateClient.mockResolvedValue(client);
    const result = await createGigPost(AUDIENCE_ID, {
      title: 'My Gig', discipline: [], slot_duration: '1hr', budget: 100,
    });
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/discipline/i);
  });

  it('returns ok:false when budget is zero or negative', async () => {
    const client = { from: vi.fn(), auth: {} };
    mockCreateClient.mockResolvedValue(client);
    const result = await createGigPost(AUDIENCE_ID, {
      title: 'My Gig', discipline: ['music'], slot_duration: '1hr', budget: 0,
    });
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/Budget/);
  });

  it('returns ok:true when all required fields are present', async () => {
    const gigData = makeGig();
    const gigChain = makeChain({ data: gigData, error: null });
    const client = { from: vi.fn().mockReturnValue(gigChain), auth: {} };
    mockCreateClient.mockResolvedValue(client);
    const result = await createGigPost(AUDIENCE_ID, {
      title: 'Wedding Singer', discipline: ['music'], slot_duration: '2 hours', budget: 200000,
    });
    expect(result.ok).toBe(true);
  });
});
