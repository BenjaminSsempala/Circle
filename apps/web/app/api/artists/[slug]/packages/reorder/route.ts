export const dynamic = 'force-dynamic';
import { ok } from '@/lib/api';

export async function PATCH(
  _req: Request,
  { params }: { params: { slug: string } },
) {
  return ok({ ok: true, data: { message: 'coming soon', slug: params.slug } });
}
