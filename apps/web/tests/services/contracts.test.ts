import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeChain, makeMockClient } from '@/lib/test-utils/supabase';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/lib/supabase/service', () => ({ createServiceClient: vi.fn() }));
vi.mock('@/lib/exports/ContractPDF', () => ({
  renderContractPDF: vi.fn().mockResolvedValue(Buffer.from('fake-pdf')),
}));

import { createServiceClient } from '@/lib/supabase/service';
import { selectTemplate, generateContract } from '@/lib/services/contracts';
import type { ContractPackage } from '@/lib/services/contracts';

const mockCreateServiceClient = createServiceClient as unknown as ReturnType<typeof vi.fn>;

// ─── selectTemplate ───────────────────────────────────────────────────────────

describe('selectTemplate', () => {
  it('returns null for merchandise', () => {
    const pkg: ContractPackage = {
      id: '1', name: 'merch', description: null, duration: null,
      product_type: 'merchandise', cancellation_terms: null,
    };
    expect(selectTemplate(pkg)).toBeNull();
  });

  it('returns digital_delivery for digital product type', () => {
    const pkg: ContractPackage = {
      id: '1', name: 'beats', description: null, duration: null,
      product_type: 'digital', cancellation_terms: null,
    };
    expect(selectTemplate(pkg)).toBe('digital_delivery');
  });

  it('returns brand_collaboration for package with "brand" in name', () => {
    const pkg: ContractPackage = {
      id: '1', name: 'Brand Deal Package', description: null, duration: null,
      product_type: 'service', cancellation_terms: null,
    };
    expect(selectTemplate(pkg)).toBe('brand_collaboration');
  });

  it('returns brand_collaboration for package with "campaign" in description', () => {
    const pkg: ContractPackage = {
      id: '1', name: 'Performance', description: 'commercial campaign shoot', duration: null,
      product_type: 'service', cancellation_terms: null,
    };
    expect(selectTemplate(pkg)).toBe('brand_collaboration');
  });

  it('returns workshop for package with "workshop" in name', () => {
    const pkg: ContractPackage = {
      id: '1', name: 'Dance Workshop', description: null, duration: null,
      product_type: 'service', cancellation_terms: null,
    };
    expect(selectTemplate(pkg)).toBe('workshop');
  });

  it('returns workshop for package with "masterclass" in description', () => {
    const pkg: ContractPackage = {
      id: '1', name: 'Session', description: 'masterclass for beginners', duration: null,
      product_type: 'service', cancellation_terms: null,
    };
    expect(selectTemplate(pkg)).toBe('workshop');
  });

  it('returns mentorship for package with "mentor" in name', () => {
    const pkg: ContractPackage = {
      id: '1', name: 'Mentorship Program', description: null, duration: null,
      product_type: 'service', cancellation_terms: null,
    };
    expect(selectTemplate(pkg)).toBe('mentorship');
  });

  it('returns mentorship for package with "coaching" in description', () => {
    const pkg: ContractPackage = {
      id: '1', name: 'Artist Development', description: 'career coaching and guidance', duration: null,
      product_type: 'service', cancellation_terms: null,
    };
    expect(selectTemplate(pkg)).toBe('mentorship');
  });

  it('returns performance as default for generic service package', () => {
    const pkg: ContractPackage = {
      id: '1', name: 'Live Performance', description: 'Standard gig', duration: '2 hours',
      product_type: 'service', cancellation_terms: null,
    };
    expect(selectTemplate(pkg)).toBe('performance');
  });
});

// ─── generateContract ─────────────────────────────────────────────────────────

describe('generateContract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(new Date('2026-06-19'));
    // No Cloudinary env → PDF upload is skipped, no fetch needed
    delete process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    delete process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  });

  function makeFullBooking() {
    return {
      id: 'booking-001',
      artist_id: 'artist-001',
      audience_id: 'audience-001',
      package_id: 'pkg-001',
      state: 'CONTRACT_DRAFT',
      product_type: 'service',
      gig_date: '2026-12-01',
      gig_time: '18:00',
      venue: 'Kampala Arts Centre',
      delivery_date: null,
      special_requirements: null,
      audience_notes: null,
      price: 500000,
      currency: 'UGX',
      audience_name: 'Event Corp',
      audience_email: 'events@corp.com',
      artist_confirmed_at: null,
      audience_confirmed_at: null,
      brand_terms: null,
      created_at: '2026-06-19T00:00:00Z',
      updated_at: '2026-06-19T00:00:00Z',
      packages: {
        id: 'pkg-001',
        name: 'Live Performance',
        description: 'One-hour show',
        duration: '1 hour',
        product_type: 'service',
        cancellation_terms: null,
      },
      artists: {
        id: 'artist-001',
        user_id: 'artist-user-001',
        display_name: 'Naira Marley',
        legal_name: 'Azeez Fashola',
        city: 'Kampala',
        country: 'Uganda',
      },
    };
  }

  function setupGenerateContractMocks(
    bookingRow: unknown,
    audienceProfile: unknown,
    contractInsertResult: unknown,
  ) {
    let callCount = 0;
    mockCreateServiceClient.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // Booking lookup
        return makeMockClient({ bookings: makeChain({ data: bookingRow, error: null }) });
      }
      if (callCount === 2) {
        // Reference number count
        return makeMockClient({ contracts: makeChain({ data: null, error: null, count: 0 }) });
      }
      if (callCount === 3) {
        // Audience profile lookup
        return makeMockClient({ profiles: makeChain({ data: audienceProfile, error: null }) });
      }
      // Contract insert
      return makeMockClient({ contracts: makeChain(contractInsertResult) });
    });
  }

  it('returns ok:false when booking is not found', async () => {
    mockCreateServiceClient.mockReturnValue(
      makeMockClient({ bookings: makeChain({ data: null, error: null }) }),
    );
    const result = await generateContract('nonexistent');
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/not found/i);
  });

  it('returns ok:false for merchandise booking (no template)', async () => {
    const booking = {
      ...makeFullBooking(),
      packages: { id: 'pkg-001', name: 'T-Shirt', description: null, duration: null, product_type: 'merchandise', cancellation_terms: null },
    };
    mockCreateServiceClient.mockReturnValue(
      makeMockClient({ bookings: makeChain({ data: booking, error: null }) }),
    );
    const result = await generateContract('booking-001');
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/merchandise/i);
  });

  it('generates contract and returns ok:true for valid service booking', async () => {
    const booking = makeFullBooking();
    const audienceProfile = { legal_name: 'Event Corporation Ltd', display_name: 'Event Corp' };
    const contractRow = {
      id: 'contract-001',
      booking_id: 'booking-001',
      template_type: 'performance',
      content: {},
      custom_clauses: [],
      reference_number: 'TCC-2026-00001',
      generated_pdf_url: null,
      artist_signed_url: null,
      audience_signed_url: null,
      created_at: '2026-06-19T00:00:00Z',
      updated_at: '2026-06-19T00:00:00Z',
    };

    setupGenerateContractMocks(booking, audienceProfile, { data: contractRow, error: null });

    const result = await generateContract('booking-001');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.contract.template_type).toBe('performance');
      expect(result.contract.reference_number).toBeDefined();
    }
  });

  it('reference number format is TCC-YYYY-NNNNN', async () => {
    vi.setSystemTime(new Date('2026-06-19'));
    const booking = makeFullBooking();
    const audienceProfile = { legal_name: null, display_name: 'Corp' };
    const contractRow = {
      id: 'c1', booking_id: 'booking-001', template_type: 'performance',
      content: {}, custom_clauses: [], reference_number: 'TCC-2026-00001',
      generated_pdf_url: null, artist_signed_url: null, audience_signed_url: null,
      created_at: '2026-06-19T00:00:00Z', updated_at: '2026-06-19T00:00:00Z',
    };
    setupGenerateContractMocks(booking, audienceProfile, { data: contractRow, error: null });
    const result = await generateContract('booking-001');
    if (result.ok) {
      expect(result.contract.reference_number).toMatch(/^TCC-2026-\d{5}$/);
    }
  });

  it('audience legal name falls back to display_name then booking audience_name', async () => {
    const booking = makeFullBooking();
    // No legal_name in profile
    const audienceProfile = { legal_name: null, display_name: 'My Display Name' };
    const contractRow = {
      id: 'c1', booking_id: 'booking-001', template_type: 'performance',
      content: { parties: { audience: { name: 'My Display Name', email: 'events@corp.com' } } },
      custom_clauses: [], reference_number: 'TCC-2026-00001',
      generated_pdf_url: null, artist_signed_url: null, audience_signed_url: null,
      created_at: '2026-06-19T00:00:00Z', updated_at: '2026-06-19T00:00:00Z',
    };
    setupGenerateContractMocks(booking, audienceProfile, { data: contractRow, error: null });
    const result = await generateContract('booking-001');
    expect(result.ok).toBe(true);
  });

  it('returns ok:false when contract insert fails', async () => {
    const booking = makeFullBooking();
    const audienceProfile = { legal_name: 'Corp Ltd', display_name: 'Corp' };
    let callCount = 0;
    mockCreateServiceClient.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeMockClient({ bookings: makeChain({ data: booking, error: null }) });
      if (callCount === 2) return makeMockClient({ contracts: makeChain({ data: null, error: null, count: 2 }) });
      if (callCount === 3) return makeMockClient({ profiles: makeChain({ data: audienceProfile, error: null }) });
      return makeMockClient({ contracts: makeChain({ data: null, error: { message: 'insert failed' } }) });
    });
    const result = await generateContract('booking-001');
    expect(result.ok).toBe(false);
  });
});
