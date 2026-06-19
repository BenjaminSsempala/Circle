export const dynamic = 'force-dynamic';
import { requireArtistOwnership } from '@/lib/supabase/server';
import { err } from '@/lib/api';
import { getExportData } from '@/lib/services/exports';
import { EPKPDF } from '@/lib/exports/EPKPDF';
import { imageToBase64 } from '@/lib/utils/imageToBase64';
import { renderToBuffer } from '@react-pdf/renderer';
import { DEFAULT_EPK, type EPKFillable } from '@/lib/exports/exportTypes';

export async function POST(
  request: Request,
  { params }: { params: { slug: string } },
) {
  const auth = await requireArtistOwnership(params.slug);
  if (auth.error) return err(auth.error, auth.status);

  let body: { epkData?: Partial<EPKFillable> } = {};
  try { body = await request.json(); } catch { /* use defaults */ }

  const fillable: EPKFillable = { ...DEFAULT_EPK, ...(body.epkData ?? {}) };

  const data = await getExportData(params.slug);
  if (!data) return err('Not found', 404);

  // Save fillable data back to artist record (non-blocking)
  try {
    const supabaseAnon = (await import('@supabase/supabase-js')).createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    await supabaseAnon
      .from('artists')
      .update({ epk_data: fillable })
      .eq('slug', params.slug);
  } catch { /* non-fatal */ }

  const featureUrl  = String(data.artist.profile_photo ?? data.artist.feature_media ?? '');
  // Filter works by excluded_work_ids then fetch their thumbnails
  const filteredWorks = data.works.filter(
    (w) => !fillable.excluded_work_ids?.includes(w.id)
  ).slice(0, 3);
  const workUrls = filteredWorks.map((w) => {
    const ytId = w.media_url?.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
    return ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : (w.thumbnail_url ?? '');
  });
  // Replace data.works with filtered set so the PDF component uses the right subset
  const filteredData = { ...data, works: filteredWorks };

  const [photoDataUrl, ...workDataUrls] = await Promise.all([
    imageToBase64(featureUrl),
    ...workUrls.map((u) => imageToBase64(u)),
  ]);

  let blob: Blob;
  try {
    const buf = await renderToBuffer(
      <EPKPDF data={filteredData} fillable={fillable} photoDataUrl={photoDataUrl} workDataUrls={workDataUrls} />,
    );
    const ab = new ArrayBuffer(buf.length);
    new Uint8Array(ab).set(buf);
    blob = new Blob([ab], { type: 'application/pdf' });
  } catch (e) {
    console.error('[epk] render error:', e);
    return err('PDF generation failed', 500);
  }

  return new Response(blob, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${String(data.artist.name ?? params.slug)}-epk.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
