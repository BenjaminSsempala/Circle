import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeChain, makeMockClient } from '@/lib/test-utils/supabase';

/**
 * GAP: availableOn filter in getRankedArtists() is not extractable to a pure function
 * without refactoring the DB queries; covered by integration test only.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: vi.fn() }));
vi.mock('@/lib/services/notifications', () => ({
  notifyBookingEvent: vi.fn().mockResolvedValue(undefined),
}));

import { createServiceClient } from '@/lib/supabase/service';
import { createBooking } from '@/lib/services/bookings';

const mockCreateServiceClient = createServiceClient as unknown as ReturnType<typeof vi.fn>;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const GIG_DATE = '2026-12-01';
const TODAY = '2026-06-19'; // frozen time

const audienceInput = { id: 'audience-1', name: 'Test Audience', email: 'test@test.com' };
const bookingInput = {
  packageId: 'pkg-1',
  productType: 'service' as const,
  gigDate: GIG_DATE,
};

const packageRow = {
  id: 'pkg-1',
  artist_id: 'artist-1',
  name: 'Live Show',
  price: 100000,
  currency: 'UGX',
  is_active: true,
  auto_accept: false,
  contract_required: true,
};

const artistRow = {
  id: 'artist-1',
  user_id: 'artist-user-1',
  display_name: 'Test Artist',
  social_links: {},
  profile_photo: null,
};

const createdBooking = {
  id: 'bk-new-1',
  artist_id: 'artist-1',
  audience_id: 'audience-1',
  package_id: 'pkg-1',
  state: 'REQUESTED',
  product_type: 'service',
  gig_date: GIG_DATE,
  price: 100000,
  currency: 'UGX',
  audience_name: 'Test Audience',
  audience_email: 'test@test.com',
};

/**
 * Sets up the mock chain for createBooking up to the availability check.
 * Call sequence:
 *   1. packages lookup (pkg found)
 *   2. artists lookup (artist found)
 *   3. availability lookup (blackout check) → blackoutResult
 *   4+ subsequent calls (booking insert, events, etc.)
 */
function setupCreateBookingMocks(blackoutResult: unknown, bookingInsertResult: unknown) {
  let callCount = 0;
  mockCreateServiceClient.mockImplementation(() => {
    callCount++;
    if (callCount === 1) {
      // packages lookup
      return makeMockClient({ packages: makeChain({ data: packageRow, error: null }) });
    }
    if (callCount === 2) {
      // artists lookup
      return makeMockClient({ artists: makeChain({ data: artistRow, error: null }) });
    }
    if (callCount === 3) {
      // availability (blackout check)
      return makeMockClient({ availability: makeChain({ data: blackoutResult, error: null }) });
    }
    // bookings insert, events, availability upsert, etc.
    return makeMockClient({
      bookings: makeChain(bookingInsertResult),
      booking_events: makeChain({ data: {}, error: null }),
      availability: makeChain({ data: {}, error: null }),
    });
  });
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('createBooking — availability checks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(`${TODAY}T00:00:00Z`));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('rejects booking when artist has a blackout on the gig date', async () => {
    setupCreateBookingMocks({ id: 'blackout-1' }, { data: createdBooking, error: null });
    const result = await createBooking(audienceInput, bookingInput);
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/unavailable/i);
  });

  it('allows booking when no blackout exists on the gig date', async () => {
    setupCreateBookingMocks(null, { data: createdBooking, error: null });
    const result = await createBooking(audienceInput, bookingInput);
    expect(result.ok).toBe(true);
  });

  it('rejects booking when gigDate is today (not in future)', async () => {
    // The blackout check is never reached; createBooking rejects date <= today
    const sameDay = {
      ...bookingInput,
      gigDate: TODAY, // same as "today" in frozen time
    };
    // We still need the pkg and artist lookups to succeed
    let callCount = 0;
    mockCreateServiceClient.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeMockClient({ packages: makeChain({ data: packageRow, error: null }) });
      return makeMockClient({ artists: makeChain({ data: artistRow, error: null }) });
    });
    const result = await createBooking(audienceInput, sameDay);
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/future/i);
  });

  it('rejects booking when gigDate is in the past', async () => {
    const pastInput = { ...bookingInput, gigDate: '2026-01-01' };
    let callCount = 0;
    mockCreateServiceClient.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeMockClient({ packages: makeChain({ data: packageRow, error: null }) });
      return makeMockClient({ artists: makeChain({ data: artistRow, error: null }) });
    });
    const result = await createBooking(audienceInput, pastInput);
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/future/i);
  });

  it('rejects when package is not found', async () => {
    mockCreateServiceClient.mockReturnValue(
      makeMockClient({ packages: makeChain({ data: null, error: null }) }),
    );
    const result = await createBooking(audienceInput, bookingInput);
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/Package not found/);
  });

  it('rejects when artist is not found', async () => {
    let callCount = 0;
    mockCreateServiceClient.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeMockClient({ packages: makeChain({ data: packageRow, error: null }) });
      return makeMockClient({ artists: makeChain({ data: null, error: null }) });
    });
    const result = await createBooking(audienceInput, bookingInput);
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/Artist not found/);
  });

  it('rejects digital booking without deliveryDate', async () => {
    let callCount = 0;
    mockCreateServiceClient.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeMockClient({ packages: makeChain({ data: { ...packageRow }, error: null }) });
      return makeMockClient({ artists: makeChain({ data: artistRow, error: null }) });
    });
    const result = await createBooking(audienceInput, {
      packageId: 'pkg-1',
      productType: 'digital',
      // no deliveryDate
    });
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/deliveryDate/i);
  });
});
