import { ImageResponse } from 'next/server';
import { requireArtistOwnership } from '@/lib/supabase/server';
import { getExportData } from '@/lib/services/exports';

// Node runtime — needs Buffer + full fetch API for image loading and font fetching
export const runtime = 'nodejs';

const W = 1080;
const H = 1920;

async function loadFont(family: string, weight: 400 | 500 | 700): Promise<ArrayBuffer> {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`;
  const css = await fetch(cssUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then((r) => r.text());
  const match = css.match(/src: url\((.+?)\) format/);
  if (!match) throw new Error(`Font URL not found for ${family}`);
  return fetch(match[1]).then((r) => r.arrayBuffer());
}

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } },
) {
  const auth = await requireArtistOwnership(params.slug);
  if (auth.error) return new Response(auth.error, { status: auth.status });

  const data = await getExportData(params.slug);
  if (!data) return new Response('Not found', { status: 404 });

  const { artist, packages } = data;
  const name     = String(artist.name ?? '');
  const slug     = String(artist.slug ?? '');
  const bio      = String(artist.bio ?? '');
  const city     = String(artist.city ?? '');
  const artForms: string[] = Array.isArray(artist.art_forms) ? (artist.art_forms as string[]) : [];

  const tagline    = bio ? bio.split(/[.\n]/)[0].trim().slice(0, 100) : null;
  const profileUrl = `thecircle.co/${slug}`;
  const cheapest   = packages.reduce<(typeof packages)[0] | null>(
    (m, p) => (!m || p.price < m.price ? p : m), null,
  );
  const priceLine  = cheapest
    ? `From ${cheapest.currency} ${Number(cheapest.price).toLocaleString()}`
    : null;

  // Background image
  const bgUrl = String(artist.feature_media ?? artist.profile_photo ?? '');
  let bgData: string | null = null;
  if (bgUrl) {
    try {
      const res = await fetch(bgUrl, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const buf = await res.arrayBuffer();
        bgData = `data:${res.headers.get('content-type') ?? 'image/jpeg'};base64,${Buffer.from(buf).toString('base64')}`;
      }
    } catch { /* use gradient fallback */ }
  }

  // Fonts — fall back gracefully if Google Fonts is unreachable
  let fontPlayfair: ArrayBuffer = new ArrayBuffer(0);
  let fontMono: ArrayBuffer = new ArrayBuffer(0);
  try {
    [fontPlayfair, fontMono] = await Promise.all([
      loadFont('Playfair Display', 700),
      loadFont('DM Mono', 500),
    ]);
  } catch { /* fonts stay empty — satori falls back to system sans */ }

  return new ImageResponse(
    (
      <div
        style={{
          width: W, height: H,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background */}
        {bgData ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" src={bgData}
               style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(145deg,#003d2e 0%,#005440 50%,#007a5e 100%)',
          }} />
        )}

        {/* Dark gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom,rgba(0,0,0,0.1) 0%,rgba(0,0,0,0.05) 25%,rgba(0,0,0,0.55) 60%,rgba(0,0,0,0.9) 100%)',
        }} />

        {/* Wordmark — top right */}
        <div style={{
          position: 'absolute', top: 60, right: 64,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#84d6b9' }} />
          <span style={{
            fontFamily: 'Playfair', fontSize: 28, fontWeight: 700,
            color: '#ffffff', letterSpacing: '-0.5px',
          }}>
            The Circle
          </span>
        </div>

        {/* Content — lower third */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '72px 72px 96px',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Art form chips */}
          {artForms.length > 0 && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              {artForms.slice(0, 3).map((f) => (
                <span key={f} style={{
                  background: 'rgba(255,255,255,0.10)',
                  border: '1.5px solid rgba(132,214,185,0.45)',
                  borderRadius: 6,
                  padding: '8px 20px',
                  fontSize: 22,
                  fontWeight: 600,
                  color: '#84d6b9',
                  fontFamily: 'DM Mono',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                }}>
                  {f}
                </span>
              ))}
            </div>
          )}

          {/* Name */}
          <div style={{
            fontFamily: 'Playfair', fontSize: 92, fontWeight: 700,
            color: '#ffffff', letterSpacing: '-2px', lineHeight: 1.05, marginBottom: 20,
          }}>
            {name}
          </div>

          {/* Tagline */}
          {tagline && (
            <div style={{
              fontSize: 32, color: 'rgba(255,255,255,0.7)',
              lineHeight: 1.4, marginBottom: 28, maxWidth: 840, fontStyle: 'italic',
            }}>
              {tagline}
            </div>
          )}

          {/* Teal rule */}
          <div style={{ width: 52, height: 3, backgroundColor: '#0f6e56', borderRadius: 2, marginBottom: 28 }} />

          {/* City + price */}
          {(city || priceLine) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 32 }}>
              {city && (
                <span style={{ fontSize: 26, color: 'rgba(255,255,255,0.5)' }}>📍 {city}</span>
              )}
              {city && priceLine && (
                <span style={{ fontSize: 22, color: 'rgba(255,255,255,0.25)' }}>·</span>
              )}
              {priceLine && (
                <span style={{ fontFamily: 'DM Mono', fontSize: 26, color: '#84d6b9' }}>
                  {priceLine}
                </span>
              )}
            </div>
          )}

          {/* Profile URL pill */}
          <div style={{
            fontFamily: 'DM Mono', fontSize: 28, color: '#84d6b9',
            letterSpacing: '0.5px',
            background: 'rgba(0,84,64,0.4)',
            border: '1.5px solid rgba(15,110,86,0.6)',
            borderRadius: 8,
            padding: '14px 28px',
            alignSelf: 'flex-start',
          }}>
            {profileUrl}
          </div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      fonts: [
        { name: 'Playfair', data: fontPlayfair, weight: 700, style: 'normal' },
        { name: 'DM Mono',  data: fontMono,     weight: 500, style: 'normal' },
      ],
    },
  );
}
