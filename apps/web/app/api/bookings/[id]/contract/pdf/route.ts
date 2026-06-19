export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { err } from '@/lib/api';
import { getBooking } from '@/lib/services/bookings';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return err('Unauthorized', 401);

  const result = await getBooking(params.id, user.id);
  if (!result.ok) return err(result.error, result.error === 'Forbidden' ? 403 : 404);
  if (!result.contract?.generated_pdf_url) return err('Contract PDF not found', 404);

  const upstream = await fetch(result.contract.generated_pdf_url);
  if (!upstream.ok || !upstream.body) return err('Failed to fetch contract PDF', 502);

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="contract-${result.contract.reference_number}.pdf"`,
    },
  });
}
