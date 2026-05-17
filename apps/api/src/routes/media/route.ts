import { NextRequest } from 'next/server';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { ok, err, requireArtistOwnership } from '../../lib/response';
import { uploadMedia } from '../../lib/cloudinary';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized } = await requireArtistOwnership(req, params.id);
  if (!authorized) return err('Unauthorized', 401);

  const contentType = req.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    const form     = await req.formData();
    const file     = form.get('file') as File | null;
    const title    = (form.get('title') as string) ?? '';
    const caption  = (form.get('caption') as string) ?? '';
    const credit   = (form.get('credit') as string) ?? '';

    if (!file) return err('No file provided', 422);
    if (!file.type.startsWith('image/')) return err('Only images can be uploaded directly', 422);

    const buffer = Buffer.from(await file.arrayBuffer());
    const { url } = await uploadMedia(buffer, { folder: `circle/artists/${params.id}/photos`, resourceType: 'image' });

    const { data: existing } = await supabase
      .from('media_items')
      .select('order')
      .eq('artist_id', params.id)
      .order('order', { ascending: false })
      .limit(1)
      .single();

    const nextOrder = ((existing?.order ?? 0) as number) + 1;

    const { data, error } = await supabase
      .from('media_items')
      .insert({ artist_id: params.id, type: 'image', source: 'uploaded', url, title, caption, credit, featured: false, order: nextOrder })
      .select()
      .single();

    if (error) return err('Failed to save media item', 500);
    return ok(data, 201);
  }

  const PlatformMediaSchema = z.object({
    type:      z.enum(['video', 'audio', 'written']),
    source:    z.enum(['youtube', 'tiktok', 'instagram', 'spotify', 'soundcloud']),
    url:       z.string().url(),
    title:     z.string().min(1).max(200),
    thumbnail: z.string().url().optional(),
    duration:  z.number().int().positive().optional(),
    excerpt:   z.string().max(500).optional(),
    featured:  z.boolean().optional(),
  });

  const body   = await req.json();
  const parsed = PlatformMediaSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message, 422);

  const d = parsed.data;

  const { data: existing } = await supabase
    .from('media_items')
    .select('order')
    .eq('artist_id', params.id)
    .order('order', { ascending: false })
    .limit(1)
    .single();

  const nextOrder = ((existing?.order ?? 0) as number) + 1;

  const { data, error } = await supabase
    .from('media_items')
    .insert({ artist_id: params.id, type: d.type, source: d.source, url: d.url, title: d.title, thumbnail: d.thumbnail, duration: d.duration, excerpt: d.excerpt, featured: d.featured ?? false, order: nextOrder })
    .select()
    .single();

  if (error) return err('Failed to save media item', 500);
  return ok(data, 201);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string; mediaId: string } }) {
  const { authorized } = await requireArtistOwnership(req, params.id);
  if (!authorized) return err('Unauthorized', 401);

  const { error } = await supabase.from('media_items').delete().eq('id', params.mediaId).eq('artist_id', params.id);
  if (error) return err('Failed to delete media item', 500);
  return ok({ deleted: true });
}

export async function reorder(req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized } = await requireArtistOwnership(req, params.id);
  if (!authorized) return err('Unauthorized', 401);

  const { order } = await req.json() as { order: { id: string; order: number }[] };
  if (!Array.isArray(order)) return err('Invalid payload', 422);

  const updates = order.map(({ id, order: o }) => supabase.from('media_items').update({ order: o }).eq('id', id).eq('artist_id', params.id));
  await Promise.all(updates);
  return ok({ reordered: true });
}
