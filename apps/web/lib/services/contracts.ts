import { createServiceClient } from '@/lib/supabase/service';
import type { Booking, BrandTerms } from '@/lib/services/bookings';
import { renderContractPDF } from '@/lib/exports/ContractPDF';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ContractTemplateType =
  | 'performance' | 'workshop' | 'digital_delivery'
  | 'brand_collaboration' | 'mentorship';

export interface CancellationTerms {
  within_48_hours_refund_pct: number;
  within_7_days_refund_pct: number;
  more_than_7_days_refund_pct: number;
}

export interface ContractPackage {
  id: string;
  name: string;
  description: string | null;
  duration: string | null;
  product_type: 'service' | 'digital' | 'merchandise';
  cancellation_terms: CancellationTerms | null;
}

export interface ContractContent {
  parties: {
    artist: { name: string; city: string | null; country: string | null };
    audience: { name: string; email: string };
  };
  service: {
    packageName: string;
    description: string | null;
    duration: string | null;
    productType: string;
    templateType: ContractTemplateType;
  };
  schedule: {
    gigDate?: string | null;
    gigTime?: string | null;
    venue?: string | null;
    deliveryDate?: string | null;
  };
  compensation: {
    price: number;
    currency: string;
    logisticsInclusive: boolean;
    cancellationTerms: CancellationTerms;
  };
  specialRequirements: string | null;
  brandTerms: BrandTerms | null;
  artistObligations?: string;
  generatedAt: string;
}

export interface Contract {
  id: string;
  booking_id: string;
  template_type: ContractTemplateType;
  content: ContractContent;
  custom_clauses: string[];
  reference_number: string;
  generated_pdf_url: string | null;
  artist_signed_url: string | null;
  audience_signed_url: string | null;
  created_at: string;
  updated_at: string;
}

const DEFAULT_CANCELLATION_TERMS: CancellationTerms = {
  within_48_hours_refund_pct: 50,
  within_7_days_refund_pct: 0,
  more_than_7_days_refund_pct: 100,
};

const ARTIST_OBLIGATIONS: Record<ContractTemplateType, string> = {
  performance: 'Artist agrees to arrive 30 minutes prior to the agreed time, deliver the full agreed performance, and conduct themselves professionally throughout the engagement.',
  workshop: 'Artist agrees to prepare all materials in advance, facilitate the full agreed session duration, and provide participants with a session summary upon completion.',
  digital_delivery: 'Artist agrees to deliver the agreed work by the specified delivery date. One round of revisions is included. Artist retains all intellectual property rights unless otherwise agreed.',
  brand_collaboration: 'Artist retains all intellectual property rights to original work created. Usage rights are limited to the scope agreed in this contract. Artist agrees to maintain confidentiality regarding campaign details until the agreed launch date.',
  mentorship: 'Artist agrees to be available for the full agreed session duration, provide constructive feedback, and respond to follow-up questions within 48 hours of the session.',
};

// ─── Template selection ──────────────────────────────────────────────────────

export function selectTemplate(pkg: ContractPackage): ContractTemplateType | null {
  if (pkg.product_type === 'merchandise') return null;
  if (pkg.product_type === 'digital') return 'digital_delivery';

  const haystack = `${pkg.name} ${pkg.description ?? ''}`.toLowerCase();
  if (/brand|collaborat|campaign|commercial/.test(haystack)) return 'brand_collaboration';
  if (/workshop|class|teach|training|masterclass/.test(haystack)) return 'workshop';
  if (/mentor|coaching|guidance|career/.test(haystack)) return 'mentorship';
  return 'performance';
}

// ─── Reference number ────────────────────────────────────────────────────────

async function generateReferenceNumber(): Promise<string> {
  const year = new Date().getFullYear();

  const { count } = await createServiceClient()
    .from('contracts')
    .select('id', { count: 'exact', head: true })
    .like('reference_number', `TCC-${year}-%`);

  const next = (count ?? 0) + 1;
  return `TCC-${year}-${String(next).padStart(5, '0')}`;
}

// ─── Generate contract ────────────────────────────────────────────────────────

export async function generateContract(
  bookingId: string,
) {
  const { data: booking } = await createServiceClient()
    .from('bookings')
    .select('*, packages(*), artists(*)')
    .eq('id', bookingId)
    .maybeSingle();

  if (!booking) return { ok: false, error: 'Booking not found' };

  const pkg = (booking as unknown as { packages: ContractPackage }).packages;
  const artist = (booking as unknown as { artists: { name: string; city: string | null; country: string | null } }).artists;

  const templateType = selectTemplate(pkg);
  if (!templateType) return { ok: false, error: 'No contract required for merchandise bookings' };

  const referenceNumber = await generateReferenceNumber();

  const content: ContractContent = {
    parties: {
      artist: { name: artist.name, city: artist.city, country: artist.country },
      audience: { name: booking.audience_name ?? '', email: booking.audience_email ?? '' },
    },
    service: {
      packageName: pkg.name,
      description: pkg.description,
      duration: pkg.duration,
      productType: booking.product_type,
      templateType,
    },
    schedule: {
      gigDate: booking.gig_date,
      gigTime: booking.gig_time,
      venue: booking.venue,
      deliveryDate: booking.delivery_date,
    },
    compensation: {
      price: booking.price,
      currency: booking.currency,
      logisticsInclusive: !!(pkg as unknown as { logistics_inclusive?: boolean }).logistics_inclusive,
      cancellationTerms: pkg.cancellation_terms ?? DEFAULT_CANCELLATION_TERMS,
    },
    specialRequirements: booking.special_requirements,
    brandTerms: (booking as unknown as { brand_terms?: BrandTerms }).brand_terms ?? null,
    generatedAt: new Date().toISOString(),
  };

  const { data: contract, error } = await createServiceClient()
    .from('contracts')
    .insert({
      booking_id: bookingId,
      template_type: templateType,
      content,
      custom_clauses: [],
      reference_number: referenceNumber,
    })
    .select()
    .single();

  if (error || !contract) return { ok: false, error: error?.message ?? 'Failed to create contract' };

  const pdfUrl = await generateContractPDF(contract as Contract, booking as unknown as Booking, artist, {
    name: booking.audience_name ?? '',
    email: booking.audience_email ?? '',
  });

  if (pdfUrl) {
    await createServiceClient().from('contracts').update({ generated_pdf_url: pdfUrl }).eq('id', contract.id);
    contract.generated_pdf_url = pdfUrl;
  }

  return { ok: true as const, contract: contract as Contract };
}

// ─── Generate contract PDF ────────────────────────────────────────────────────

export async function generateContractPDF(
  contract: Contract,
  booking: Booking,
  artist: { name: string; city: string | null; country: string | null },
  audience: { name: string; email: string },
): Promise<string | null> {
  const pdfBuffer = await renderContractPDF(contract, booking, artist, audience);

  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloud || !preset) return null;

  const ab = new ArrayBuffer(pdfBuffer.length);
  new Uint8Array(ab).set(pdfBuffer);

  const form = new FormData();
  form.append('file', new Blob([ab], { type: 'application/pdf' }), 'contract.pdf');
  form.append('upload_preset', preset);
  form.append('folder', `circle/contracts/${contract.reference_number}`);
  form.append('public_id', 'contract');

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/raw/upload`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.secure_url as string) ?? null;
  } catch {
    return null;
  }
}

// ─── Update custom clauses ─────────────────────────────────────────────────────

export async function updateCustomClauses(
  bookingId: string,
  artistUserId: string,
  clauses: string[],
) {
  if (clauses.length > 3) return { ok: false, error: 'Maximum of 3 custom clauses allowed' };

  const { data: booking } = await createServiceClient()
    .from('bookings')
    .select('id, state, artists!inner(user_id)')
    .eq('id', bookingId)
    .maybeSingle();

  if (!booking) return { ok: false, error: 'Booking not found' };
  const artist = (booking as unknown as { artists: { user_id: string } }).artists;
  if (artist.user_id !== artistUserId) return { ok: false, error: 'Forbidden' };
  if (booking.state !== 'CONTRACT_DRAFT') return { ok: false, error: 'Contract can only be edited while in draft' };

  const { data: contract, error } = await createServiceClient()
    .from('contracts')
    .update({ custom_clauses: clauses })
    .eq('booking_id', bookingId)
    .select()
    .single();

  if (error || !contract) return { ok: false, error: error?.message ?? 'Failed to update clauses' };
  return { ok: true as const, contract: contract as Contract };
}

// ─── Upload signed copy ─────────────────────────────────────────────────────────

export async function uploadSignedCopy(
  contractId: string,
  uploaderUserId: string,
  file: Blob,
  role: 'artist' | 'audience',
) {
  const { data: contract } = await createServiceClient()
    .from('contracts')
    .select('*, bookings!inner(id, state, audience_id, artists!inner(user_id))')
    .eq('id', contractId)
    .maybeSingle();

  if (!contract) return { ok: false, error: 'Contract not found' };

  const booking = (contract as unknown as { bookings: { id: string; state: string; audience_id: string; artists: { user_id: string } } }).bookings;

  if (role === 'artist' && booking.artists.user_id !== uploaderUserId) {
    return { ok: false, error: 'Only the artist can upload the artist-signed copy' };
  }
  if (role === 'audience' && booking.audience_id !== uploaderUserId) {
    return { ok: false, error: 'Only the audience can upload their signed copy' };
  }

  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloud || !preset) return { ok: false, error: 'Upload not configured' };

  const isPdf = file.type === 'application/pdf';
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', preset);
  form.append('folder', `circle/contracts/${(contract as unknown as Contract).reference_number}`);
  form.append('public_id', `${role}-signed`);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/${isPdf ? 'raw' : 'image'}/upload`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) return { ok: false, error: 'Upload failed' };
  const data = await res.json();
  const url = data.secure_url as string;

  const updateField = role === 'artist' ? 'artist_signed_url' : 'audience_signed_url';
  const { data: updatedContract, error } = await createServiceClient()
    .from('contracts')
    .update({ [updateField]: url })
    .eq('id', contractId)
    .select()
    .single();

  if (error || !updatedContract) return { ok: false, error: error?.message ?? 'Failed to record upload' };

  const bothSigned = !!updatedContract.artist_signed_url && !!updatedContract.audience_signed_url;

  if (role === 'audience' && booking.state === 'CONTRACT_SENT') {
    const { transitionBooking } = await import('@/lib/services/bookings');
    await transitionBooking(booking.id, 'AUDIENCE_UPLOADED', 'system');
  }

  if (bothSigned && booking.state === 'AUDIENCE_UPLOADED') {
    const { transitionBooking } = await import('@/lib/services/bookings');
    await transitionBooking(booking.id, 'CONTRACT_SIGNED', 'system');
  }

  return { ok: true as const };
}
