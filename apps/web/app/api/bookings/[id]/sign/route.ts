export const dynamic = 'force-dynamic';
import { ok } from '@/lib/api';

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  return ok({ ok: true, data: { message: 'coming soon', id: params.id } });
}
