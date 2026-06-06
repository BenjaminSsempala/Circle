export const dynamic = 'force-dynamic';

import { requireArtistOwnership } from '@/lib/supabase/server';
import { err } from '@/lib/api';
import { getExportData } from '@/lib/services/exports';
import { RateCardPDF } from '@/lib/exports/RateCardPDF';
import { imageToBase64 } from '@/lib/utils/imageToBase64';
import { renderToBuffer } from '@react-pdf/renderer';
import { ImageResponse } from 'next/server';
import { DEFAULT_RATE_CARD, type RateCardFillable } from '@/lib/exports/exportTypes';

// ─── Rate Card Image (1080×1080) inline JSX ──────────────────────────────────

async function loadFont(family: string, weight: 400 | 700): Promise<ArrayBuffer> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`,
    { headers: { 'User-Agent': 'Mozilla/5.0' } },
  ).then((r) => r.text());
  const match = css.match(/src: url\((.+?)\) format/);
  if (!match) throw new Error('Font not found');
  return fetch(match[1]).then((r) => r.arrayBuffer());
}

function RateCardImage({
  name, tagline, artForms, city, profileUrl, packages, stats, socialLinks, bgData,
}: {
  name: string; tagline: string; artForms: string[]; city: string; profileUrl: string;
  packages: { name: string; price: number; currency: string }[];
  stats: { value: string; label: string }[];
  socialLinks: Record<string, string>;
  bgData: string | null;
}) {
  const topPkgs = packages.slice(0, 4);
  const topStats = stats.filter((s) => s.value && s.label).slice(0, 4);
  const socialLabels: Record<string, string> = {
    instagram: 'Instagram', youtube: 'YouTube', spotify: 'Spotify',
    tiktok: 'TikTok', twitter: 'X', website: 'Website',
  };
  const socials = Object.entries(socialLinks).filter(([, v]) => v?.trim()).slice(0, 4);

  return (
    <div style={{
      width: 1080, height: 1080, display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(145deg,#0f1a14 0%,#1b2c21 50%,#0a1f16 100%)',
      fontFamily: 'Playfair', position: 'relative', overflow: 'hidden',
    }}>
      {/* Teal accent glow */}
      <div style={{
        position: 'absolute', bottom: -120, right: -120,
        width: 400, height: 400, borderRadius: 200,
        background: 'radial-gradient(circle,rgba(15,110,86,0.35) 0%,transparent 70%)',
      }} />

      {/* The Circle badge */}
      <div style={{
        position: 'absolute', top: 48, right: 56,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#84d6b9' }} />
        <span style={{ fontSize: 22, color: 'rgba(255,255,255,0.5)', fontFamily: 'Playfair' }}>
          The Circle
        </span>
      </div>

      {/* Content */}
      <div style={{ display: 'flex', flexDirection: 'column', padding: '72px 72px 0', flex: 1 }}>

        {/* Name + tagline */}
        <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 74, fontWeight: 700, color: '#ffffff', letterSpacing: '-2px', lineHeight: 1.05, marginBottom: 12 }}>
            {name}
          </div>
          {tagline && (
            <div style={{ fontSize: 26, color: 'rgba(255,255,255,0.55)', fontStyle: 'italic', marginBottom: 16 }}>
              "{tagline}"
            </div>
          )}
          {/* Art form chips */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {artForms.slice(0, 3).map((f) => (
              <span key={f} style={{
                fontSize: 18, color: '#84d6b9', fontWeight: 600,
                background: 'rgba(132,214,185,0.1)',
                border: '1px solid rgba(132,214,185,0.3)',
                borderRadius: 4, padding: '5px 14px',
                textTransform: 'uppercase', letterSpacing: '1px',
              }}>
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Teal rule */}
        <div style={{ width: 48, height: 2, backgroundColor: '#0f6e56', borderRadius: 1, marginBottom: 32 }} />

        {/* Two-column mid section */}
        <div style={{ display: 'flex', gap: 40, flex: 1 }}>

          {/* Left: Packages */}
          <div style={{ flex: '0 0 55%', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 14, color: '#0f6e56', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 4 }}>
              Packages
            </div>
            {topPkgs.map((pkg) => (
              <div key={pkg.name} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, padding: '14px 18px',
              }}>
                <span style={{ fontSize: 22, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
                  {pkg.name}
                </span>
                <span style={{ fontSize: 20, color: '#84d6b9', fontWeight: 700 }}>
                  {pkg.currency} {Number(pkg.price).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {/* Right: Stats — no Fragment, Satori doesn't support <> */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topStats.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 14, color: '#0f6e56', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 4 }}>
                  Highlights
                </div>
                {topStats.map((stat, i) => (
                  <div key={i} style={{
                    display: 'flex', flexDirection: 'column',
                    background: 'rgba(15,110,86,0.12)',
                    border: '1px solid rgba(15,110,86,0.25)',
                    borderRadius: 8, padding: '12px 16px',
                  }}>
                    <div style={{ fontSize: 32, color: '#84d6b9', fontWeight: 700, lineHeight: 1 }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 72px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        marginTop: 24,
      }}>
        <div style={{ display: 'flex', gap: 16 }}>
          {socials.map(([p]) => (
            <span key={p} style={{ fontSize: 18, color: 'rgba(255,255,255,0.35)' }}>
              {socialLabels[p] ?? p}
            </span>
          ))}
        </div>
        <span style={{ fontFamily: 'Playfair', fontSize: 22, color: '#0f6e56', fontWeight: 700 }}>
          {profileUrl}
        </span>
      </div>
    </div>
  );
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(
  request: Request,
  { params }: { params: { slug: string } },
) {
  const auth = await requireArtistOwnership(params.slug);
  if (auth.error) return err(auth.error, auth.status);

  let body: { rcData?: Partial<RateCardFillable>; format?: 'pdf' | 'image' } = {};
  try { body = await request.json(); } catch { /* defaults */ }

  const fillable: RateCardFillable = { ...DEFAULT_RATE_CARD, ...(body.rcData ?? {}) };
  const format = body.format ?? 'pdf';

  const data = await getExportData(params.slug);
  if (!data) return err('Not found', 404);

  // Persist fillable data (non-blocking)
  try {
    const { createClient: anonClient } = await import('@supabase/supabase-js');
    await anonClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
      .from('artists')
      .update({ rate_card_data: fillable })
      .eq('slug', params.slug);
  } catch { /* non-fatal */ }

  const { artist, packages, socialLinks } = data;
  const name      = String(artist.name ?? '');
  const slug      = String(artist.slug ?? '');
  const profileUrl = `thecircle.co/${slug}`;

  // ── PNG Image ──────────────────────────────────────────────────────────────
  if (format === 'image') {
    let fontPlayfair: ArrayBuffer = new ArrayBuffer(0);
    try { fontPlayfair = await loadFont('Playfair Display', 700); } catch { /* fallback */ }

    let imgBuf: ArrayBuffer;
    try {
      const imageResp = new ImageResponse(
        RateCardImage({
          name,
          tagline: String(artist.tagline ?? ''),
          artForms: Array.isArray(artist.art_forms) ? (artist.art_forms as string[]) : [],
          city: String(artist.city ?? ''),
          profileUrl,
          packages: packages.filter((p) => !fillable.excluded_package_ids?.includes(p.id)).map((p) => ({ name: p.name, price: p.price, currency: p.currency })),
          stats: fillable.stats,
          socialLinks,
          bgData: null,
        }),
        {
          width: 1080, height: 1080,
          fonts: fontPlayfair.byteLength
            ? [{ name: 'Playfair', data: fontPlayfair, weight: 700, style: 'normal' }]
            : [],
        },
      );
      imgBuf = await imageResp.arrayBuffer();
    } catch (e) {
      console.error('[rate-card image] render error:', e);
      return err('Image generation failed', 500);
    }

    return new Response(imgBuf, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${name}-rate-card.png"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  // ── PDF ─────────────────────────────────────────────────────────────────────
  const photoDataUrl = await imageToBase64(String(artist.profile_photo ?? ''));

  let blob: Blob;
  try {
    const buf = await renderToBuffer(
      <RateCardPDF data={data} fillable={fillable} photoDataUrl={photoDataUrl} />,
    );
    const ab = new ArrayBuffer(buf.length);
    new Uint8Array(ab).set(buf);
    blob = new Blob([ab], { type: 'application/pdf' });
  } catch (e) {
    console.error('[rate-card] render error:', e);
    return err('PDF generation failed', 500);
  }

  return new Response(blob, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${name}-rate-card.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
