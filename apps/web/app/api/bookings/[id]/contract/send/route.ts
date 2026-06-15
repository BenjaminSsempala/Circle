export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { ok, err } from '@/lib/api';
import { transitionBooking } from '@/lib/services/bookings';
import { generateContractPDF, type Contract } from '@/lib/services/contracts';

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return err('Unauthorized', 401);

  // Re-render the PDF so any custom clauses added since generation are included
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, artists(name, city, country)')
    .eq('id', params.id)
    .maybeSingle();

  const { data: contract } = await supabase
    .from('contracts')
    .select('*')
    .eq('booking_id', params.id)
    .maybeSingle();

  if (booking && contract) {
    const artist = (booking as unknown as { artists: { name: string; city: string | null; country: string | null } }).artists;
    const pdfUrl = await generateContractPDF(contract as Contract, booking, artist, {
      name: booking.audience_name ?? '',
      email: booking.audience_email ?? '',
    });
    if (pdfUrl) {
      await supabase.from('contracts').update({ generated_pdf_url: pdfUrl }).eq('id', contract.id);
    }
  }

  const result = await transitionBooking(params.id, 'CONTRACT_SENT', user.id);
  if (!result.ok) return err(result.error, 400);
  return ok({ booking: result.booking });
}
