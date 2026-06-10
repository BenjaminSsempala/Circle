export const dynamic = 'force-dynamic';
import { ok, err } from '@/lib/api';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  return ok({ ok: true, data: { message: 'coming soon', id: params.id } });
}
