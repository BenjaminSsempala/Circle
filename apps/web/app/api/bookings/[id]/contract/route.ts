export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { ok, err } from '@/lib/api';
import { getBooking } from '@/lib/services/bookings';
import { generateContractPDF, type ContractTemplateType, type Contract } from '@/lib/services/contracts';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return err('Unauthorized', 401);

  const result = await getBooking(params.id, user.id);
  if (!result.ok) return err(result.error, result.error === 'Forbidden' ? 403 : 404);
  if (!result.contract) return err('Contract not found', 404);

  return ok({ contract: result.contract, role: result.role });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return err('Unauthorized', 401);

  const result = await getBooking(params.id, user.id);
  if (!result.ok) return err(result.error, result.error === 'Forbidden' ? 403 : 404);
  if (result.role !== 'artist') return err('Only the artist can change the contract type', 403);
  if (result.booking.state !== 'CONTRACT_DRAFT') return err('Contract type can only be changed while in draft', 400);
  if (!result.contract) return err('Contract not found', 404);

  let body: { templateType?: ContractTemplateType };
  try { body = await req.json(); } catch { return err('Invalid JSON'); }

  const { templateType } = body;
  const validTypes: ContractTemplateType[] = ['performance', 'workshop', 'digital_delivery', 'brand_collaboration', 'mentorship'];
  if (!templateType || !validTypes.includes(templateType)) return err('Invalid template type', 400);

  const contract = result.contract as Contract;
  const updatedContent = {
    ...contract.content,
    service: { ...contract.content.service, templateType },
  };

  const { data: updated, error } = await createServiceClient()
    .from('contracts')
    .update({ template_type: templateType, content: updatedContent, generated_pdf_url: null })
    .eq('id', contract.id)
    .select()
    .single();

  if (error || !updated) return err(error?.message ?? 'Failed to update contract', 500);

  const { booking } = result;
  const { data: artistData } = await createServiceClient()
    .from('artists')
    .select('name, city, country')
    .eq('id', booking.artist_id)
    .maybeSingle();

  const artist = artistData ?? { name: '', city: null, country: null };
  const audience = { name: booking.audience_name ?? '', email: booking.audience_email ?? '' };

  const pdfUrl = await generateContractPDF(updated as Contract, booking, artist, audience);
  if (pdfUrl) {
    await createServiceClient().from('contracts').update({ generated_pdf_url: pdfUrl }).eq('id', contract.id);
    updated.generated_pdf_url = pdfUrl;
  }

  return ok({ contract: updated });
}
