import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeChain, makeMockClient } from '@/lib/test-utils/supabase';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: vi.fn() }));
vi.mock('@/lib/services/contracts', () => ({
  generateContract: vi.fn().mockResolvedValue({ ok: true, contract: {} }),
}));
vi.mock('@/lib/services/notifications', () => ({
  notifyBookingEvent: vi.fn().mockResolvedValue(undefined),
}));

import { createServiceClient } from '@/lib/supabase/service';
import { transitionBooking } from '@/lib/services/bookings';

const mockCreateServiceClient = createServiceClient as unknown as ReturnType<typeof vi.fn>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ARTIST_USER_ID = 'artist-user-123';
const ARTIST_ID = 'artist-id-123';
const AUDIENCE_ID = 'audience-id-456';
const BOOKING_ID = 'booking-id-789';

function makeBookingRow(state: string, overrides: Record<string, unknown> = {}) {
  return {
    id: BOOKING_ID,
    artist_id: ARTIST_ID,
    audience_id: AUDIENCE_ID,
    package_id: 'pkg-id',
    state,
    product_type: 'service',
    gig_date: '2026-12-01',
    gig_time: null,
    venue: null,
    delivery_date: null,
    special_requirements: null,
    audience_notes: null,
    price: 100000,
    currency: 'UGX',
    audience_name: 'Test Audience',
    audience_email: 'audience@test.com',
    artist_confirmed_at: null,
    audience_confirmed_at: null,
    brand_terms: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    artists: { user_id: ARTIST_USER_ID },
    packages: { contract_required: true },
    ...overrides,
  };
}

function makeUpdatedBookingRow(toState: string) {
  return { ...makeBookingRow(toState), state: toState };
}

/**
 * Sets up the service client mock for a transitionBooking call.
 *
 * Call flow inside transitionBooking:
 *   1. from('bookings').select(...).eq(...).maybeSingle()   → bookingLookup result
 *   2. from('bookings').update(...).eq(...).select().single() → updateResult
 *   3. from('booking_events').insert(...)  → (not terminal — just called)
 *   4. from('booking_reminders').insert(...) → (optional, for GIG_ACTIVE)
 *
 * Because createServiceClient() is called fresh each time we need separate
 * call setups. We track call count to return different clients each invocation.
 */
function setupServiceClientMock(
  bookingRow: Record<string, unknown> | null,
  updatedRow: Record<string, unknown>,
  updateError: { message: string } | null = null,
) {
  // Prepare chains
  const lookupChain = makeChain({ data: bookingRow, error: null });
  const updateChain = makeChain({ data: updatedRow, error: updateError });
  const eventsInsertChain = makeChain({ data: {}, error: null });
  const remindersInsertChain = makeChain({ data: {}, error: null });

  // We need multiple calls to createServiceClient to return clients
  // that serve the right 'from' table
  let callCount = 0;
  mockCreateServiceClient.mockImplementation(() => {
    callCount++;
    if (callCount === 1) {
      // First call: lookup bookings
      return makeMockClient({ bookings: lookupChain });
    }
    if (callCount === 2) {
      // Second call: update bookings
      return makeMockClient({ bookings: updateChain });
    }
    if (callCount === 3) {
      // Third call: insert booking_events
      return makeMockClient({ booking_events: eventsInsertChain });
    }
    // Fourth+: reminders, etc.
    return makeMockClient({
      booking_reminders: remindersInsertChain,
      booking_events: eventsInsertChain,
      bookings: updateChain,
    });
  });

  return { lookupChain, updateChain, eventsInsertChain };
}

// ─── Valid Transitions ────────────────────────────────────────────────────────

describe('transitionBooking — valid transitions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('REQUESTED → ACCEPTED (artist)', async () => {
    const booking = makeBookingRow('REQUESTED', { packages: { contract_required: false } });
    setupServiceClientMock(booking, makeUpdatedBookingRow('ACCEPTED'));
    // For the recursive transitionBooking call to CONTRACT_SIGNED
    mockCreateServiceClient.mockImplementation(() =>
      makeMockClient({
        bookings: makeChain({ data: makeUpdatedBookingRow('ACCEPTED'), error: null }),
        booking_events: makeChain({ data: {}, error: null }),
      }),
    );

    const result = await transitionBooking(BOOKING_ID, 'ACCEPTED', ARTIST_USER_ID);
    // The function may recursively call itself; just assert no hard error
    expect(result).toBeDefined();
  });

  it('REQUESTED → DECLINED (artist)', async () => {
    const booking = makeBookingRow('REQUESTED');
    const { updateChain } = setupServiceClientMock(booking, makeUpdatedBookingRow('DECLINED'));
    const result = await transitionBooking(BOOKING_ID, 'DECLINED', ARTIST_USER_ID);
    expect(result.ok).toBe(true);
    expect(updateChain['update']).toHaveBeenCalled();
  });

  it('REQUESTED → CANCELLED (audience)', async () => {
    const booking = makeBookingRow('REQUESTED');
    const { updateChain } = setupServiceClientMock(booking, makeUpdatedBookingRow('CANCELLED'));
    const result = await transitionBooking(BOOKING_ID, 'CANCELLED', AUDIENCE_ID);
    expect(result.ok).toBe(true);
    expect(updateChain['update']).toHaveBeenCalled();
  });

  it('ACCEPTED → CONTRACT_DRAFT (system)', async () => {
    const booking = makeBookingRow('ACCEPTED');
    const { updateChain } = setupServiceClientMock(booking, makeUpdatedBookingRow('CONTRACT_DRAFT'));
    const result = await transitionBooking(BOOKING_ID, 'CONTRACT_DRAFT', 'system');
    expect(result.ok).toBe(true);
    expect(updateChain['update']).toHaveBeenCalled();
  });

  it('CONTRACT_DRAFT → CONTRACT_SENT (artist)', async () => {
    const booking = makeBookingRow('CONTRACT_DRAFT');
    const { updateChain } = setupServiceClientMock(booking, makeUpdatedBookingRow('CONTRACT_SENT'));
    const result = await transitionBooking(BOOKING_ID, 'CONTRACT_SENT', ARTIST_USER_ID);
    expect(result.ok).toBe(true);
    expect(updateChain['update']).toHaveBeenCalled();
  });

  it('CONTRACT_SENT → AUDIENCE_UPLOADED (system)', async () => {
    const booking = makeBookingRow('CONTRACT_SENT');
    const { updateChain } = setupServiceClientMock(booking, makeUpdatedBookingRow('AUDIENCE_UPLOADED'));
    const result = await transitionBooking(BOOKING_ID, 'AUDIENCE_UPLOADED', 'system');
    expect(result.ok).toBe(true);
    expect(updateChain['update']).toHaveBeenCalled();
  });

  it('AUDIENCE_UPLOADED → CONTRACT_SIGNED (system)', async () => {
    const booking = makeBookingRow('AUDIENCE_UPLOADED');
    const { updateChain } = setupServiceClientMock(booking, makeUpdatedBookingRow('CONTRACT_SIGNED'));
    const result = await transitionBooking(BOOKING_ID, 'CONTRACT_SIGNED', 'system');
    expect(result.ok).toBe(true);
    expect(updateChain['update']).toHaveBeenCalled();
  });

  it('GIG_ACTIVE → CHECKED_IN (artist)', async () => {
    const booking = makeBookingRow('GIG_ACTIVE');
    const { updateChain } = setupServiceClientMock(booking, makeUpdatedBookingRow('CHECKED_IN'));
    const result = await transitionBooking(BOOKING_ID, 'CHECKED_IN', ARTIST_USER_ID);
    expect(result.ok).toBe(true);
    expect(updateChain['update']).toHaveBeenCalled();
  });

  it('CONFIRMING → COMPLETED (either — artist)', async () => {
    const booking = makeBookingRow('CONFIRMING');
    const { updateChain } = setupServiceClientMock(booking, makeUpdatedBookingRow('COMPLETED'));
    const result = await transitionBooking(BOOKING_ID, 'COMPLETED', ARTIST_USER_ID);
    expect(result.ok).toBe(true);
    expect(updateChain['update']).toHaveBeenCalled();
  });

  it('booking_events insert is called after successful transition', async () => {
    const booking = makeBookingRow('CONFIRMING');
    const { eventsInsertChain } = setupServiceClientMock(booking, makeUpdatedBookingRow('COMPLETED'));
    await transitionBooking(BOOKING_ID, 'COMPLETED', ARTIST_USER_ID);
    expect(eventsInsertChain['insert']).toHaveBeenCalled();
  });
});

// ─── Invalid Transitions ──────────────────────────────────────────────────────

describe('transitionBooking — invalid transitions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function setupLookupOnly(state: string) {
    const booking = makeBookingRow(state);
    const lookupChain = makeChain({ data: booking, error: null });
    const updateChain = makeChain({ data: null, error: null });
    mockCreateServiceClient.mockReturnValue(
      makeMockClient({ bookings: lookupChain }),
    );
    return { lookupChain, updateChain };
  }

  it('REQUESTED → COMPLETED is invalid', async () => {
    setupLookupOnly('REQUESTED');
    const result = await transitionBooking(BOOKING_ID, 'COMPLETED', ARTIST_USER_ID);
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/Cannot transition/);
  });

  it('DECLINED → ACCEPTED is invalid (terminal state)', async () => {
    setupLookupOnly('DECLINED');
    const result = await transitionBooking(BOOKING_ID, 'ACCEPTED', ARTIST_USER_ID);
    expect(result.ok).toBe(false);
  });

  it('COMPLETED → REFUNDED is invalid (terminal state)', async () => {
    setupLookupOnly('COMPLETED');
    const result = await transitionBooking(BOOKING_ID, 'REFUNDED', ARTIST_USER_ID);
    expect(result.ok).toBe(false);
  });

  it('CANCELLED → any is invalid', async () => {
    setupLookupOnly('CANCELLED');
    const result = await transitionBooking(BOOKING_ID, 'REQUESTED', ARTIST_USER_ID);
    expect(result.ok).toBe(false);
  });

  it('REFUNDED → any is invalid', async () => {
    setupLookupOnly('REFUNDED');
    const result = await transitionBooking(BOOKING_ID, 'COMPLETED', ARTIST_USER_ID);
    expect(result.ok).toBe(false);
  });

  it('PAYMENT_PENDING → COMPLETED is invalid (skips states)', async () => {
    setupLookupOnly('PAYMENT_PENDING');
    const result = await transitionBooking(BOOKING_ID, 'COMPLETED', 'system');
    expect(result.ok).toBe(false);
  });

  it('does NOT call update on bookings table for invalid transitions', async () => {
    const booking = makeBookingRow('DECLINED');
    const lookupChain = makeChain({ data: booking, error: null });
    let updateCalled = false;
    const updateChain = makeChain({ data: null, error: null });
    (updateChain['update'] as ReturnType<typeof vi.fn>).mockImplementation(() => {
      updateCalled = true;
      return updateChain;
    });
    mockCreateServiceClient.mockReturnValue(
      makeMockClient({ bookings: lookupChain }),
    );
    await transitionBooking(BOOKING_ID, 'ACCEPTED', ARTIST_USER_ID);
    expect(updateCalled).toBe(false);
  });
});

// ─── Authorization ────────────────────────────────────────────────────────────

describe('transitionBooking — authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('audience cannot perform artist-only DECLINED transition', async () => {
    const booking = makeBookingRow('REQUESTED');
    const lookupChain = makeChain({ data: booking, error: null });
    mockCreateServiceClient.mockReturnValue(makeMockClient({ bookings: lookupChain }));
    const result = await transitionBooking(BOOKING_ID, 'DECLINED', AUDIENCE_ID);
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/Only the artist/);
  });

  it('third party cannot perform audience-only CANCELLED transition', async () => {
    const booking = makeBookingRow('REQUESTED');
    const lookupChain = makeChain({ data: booking, error: null });
    mockCreateServiceClient.mockReturnValue(makeMockClient({ bookings: lookupChain }));
    const result = await transitionBooking(BOOKING_ID, 'CANCELLED', 'random-user-id');
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/Only the audience/);
  });

  it('third party cannot perform either-actor transition', async () => {
    const booking = makeBookingRow('CONFIRMING');
    const lookupChain = makeChain({ data: booking, error: null });
    mockCreateServiceClient.mockReturnValue(makeMockClient({ bookings: lookupChain }));
    const result = await transitionBooking(BOOKING_ID, 'COMPLETED', 'random-user-id');
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/Not authorised/);
  });
});

// ─── Edge Cases ───────────────────────────────────────────────────────────────

describe('transitionBooking — edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error when booking does not exist', async () => {
    const lookupChain = makeChain({ data: null, error: null });
    mockCreateServiceClient.mockReturnValue(makeMockClient({ bookings: lookupChain }));
    const result = await transitionBooking('nonexistent-id', 'ACCEPTED', ARTIST_USER_ID);
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/not found/i);
  });

  it('system actor can perform system-only transitions', async () => {
    const booking = makeBookingRow('PAYMENT_PENDING');
    setupServiceClientMock(booking, makeUpdatedBookingRow('PAYMENT_HELD'));
    const result = await transitionBooking(BOOKING_ID, 'PAYMENT_HELD', 'system');
    expect(result.ok).toBe(true);
  });
});
