export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { ok, err } from '@/lib/api';
import { uploadSignedCopy } from '@/lib/services/contracts';

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return err('Unauthorized', 401);

  let formData: FormData;
  try { formData = await request.formData(); } catch { return err('Invalid form data'); }

  const file = formData.get('file');
  const role = formData.get('role');

  if (!(file instanceof Blob)) return err('file is required');
  if (role !== 'artist' && role !== 'audience') return err('role must be "artist" or "audience"');

  const { data: contract } = await supabase
    .from('contracts')
    .select('id')
    .eq('booking_id', params.id)
    .maybeSingle();

  if (!contract) return err('Contract not found', 404);

  const result = await uploadSignedCopy(contract.id, user.id, file, role);
  if (!result.ok) return err(result.error, 400);

  const { data: updatedContract } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', contract.id)
    .maybeSingle();

  return ok({ contract: updatedContract });
}
