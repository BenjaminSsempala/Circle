export const dynamic = 'force-dynamic';
import { ImageResponse } from 'next/server';
import { requireArtistOwnership } from '@/lib/supabase/server';
import { getExportData } from '@/lib/services/exports';

export const runtime = 'nodejs';

const W = 1080;
const H = 1920;
// Scale factor from the 390×760 design prototype to 1080×1920
const S = W / 390;

import { loadFontCached as loadFont } from '@/lib/utils/fontCache';

async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    if (!buf.byteLength) return null;
    const mime = res.headers.get('content-type') ?? 'image/jpeg';
    return `data:${mime};base64,${Buffer.from(buf).toString('base64')}`;
  } catch {
    return null;
  }
}

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } },
) {
  const auth = await requireArtistOwnership(params.slug);
  if (auth.error) return new Response(auth.error, { status: auth.status });

  const data = await getExportData(params.slug);
  if (!data) return new Response('Not found', { status: 404 });

  const { artist, packages, socialLinks } = data;

  const name       = String(artist.name ?? '');
  const slug       = String(artist.slug ?? '');
  const tagline    = String(artist.tagline ?? '');
  const city       = String(artist.city ?? '');
  const country    = String(artist.country ?? '');
  const artForms   = (Array.isArray(artist.art_forms) ? artist.art_forms : []) as string[];
  const discipline = artForms[0] ?? '';
  const location   = [city, country].filter(Boolean).join(', ');
  const profileUrl = `engero.art/${slug}`;
  const handle     = `/${slug}`;

  const cheapest = packages.reduce<typeof packages[0] | null>(
    (m, p) => (!m || p.price < m.price ? p : m), null,
  );

  // Stats: use saved rate card stats if available, otherwise derive
  type StatEntry = { value: string; label: string };
  const savedStats = (artist.rate_card_data as { stats?: StatEntry[] } | null)?.stats ?? [];
  const stats: { v: string; l: string }[] = savedStats
    .filter((s: StatEntry) => s.value?.trim() && s.label?.trim())
    .slice(0, 3)
    .map((s: StatEntry) => ({ v: s.value, l: s.label }));

  // Active socials with extracted handles
  function handleFromUrl(url: string, platform: string): string {
    if (!url) return '';
    try {
      const u = new URL(url.startsWith('http') ? url : `https://${url}`);
      const path = u.pathname.replace(/^\//, '').replace(/\/$/, '');
      if (platform === 'spotify') return path.split('/').pop() ?? path;
      return path.replace('@', '').split('/')[0];
    } catch { return url.replace(/^https?:\/\/[^/]+\//, '').replace('@', ''); }
  }
  const SOCIAL_KEYS = ['instagram', 'twitter', 'spotify', 'youtube', 'tiktok'] as const;
  const activeSocials = SOCIAL_KEYS
    .filter((k) => socialLinks[k]?.trim())
    .slice(0, 4)
    .map((k) => ({ key: k, handle: `@${handleFromUrl(socialLinks[k], k)}` }));

  // Load in parallel
  const bgUrl = String(artist.profile_photo ?? artist.feature_media ?? '');
  const [bgData, fontJakarta, fontMono] = await Promise.all([
    bgUrl ? fetchImageAsDataUrl(bgUrl) : Promise.resolve(null),
    loadFont('Plus Jakarta Sans', 800),
    loadFont('JetBrains Mono', 500),
  ]);

  // Only pass fonts that loaded: empty ArrayBuffers crash ImageResponse
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fonts: any[] = [];
  if (fontJakarta) fonts.push({ name: 'Jakarta', data: fontJakarta, weight: 800, style: 'normal' });
  if (fontMono)    fonts.push({ name: 'Mono',    data: fontMono,    weight: 500, style: 'normal' });

  const TEAL  = '#005440';
  const AMBER = '#feb56b';
  const sans  = fontJakarta ? 'Jakarta' : 'sans-serif';
  const mono  = fontMono    ? 'Mono'    : 'monospace';

  // Social icon SVG paths: use <g> not fragments; Satori doesn't support <>
  function socialPath(type: string, color: string) {
    const s = { stroke: color, strokeWidth: '2.4', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
    if (type === 'instagram') return (
      <g>
        <rect x="3" y="3" width="18" height="18" rx="5" {...s} />
        <circle cx="12" cy="12" r="4.5" {...s} />
        <circle cx="17.2" cy="6.8" r="1.4" fill={color} stroke="none" />
      </g>
    );
    if (type === 'twitter')  return <g><path d="M17.5 3h3l-6.5 7.5 7.5 10.5H17l-4-5.4-4.6 5.4H5l6.8-7.8L4.5 3h5l3.5 4.8z" fill={color} /></g>;
    if (type === 'spotify')  return (
      <g>
        <circle cx="12" cy="12" r="9.5" {...s} />
        <path d="M7.5 9.8c3-.9 6.5-.9 9 0M7 12.5c3-.8 7-.8 10 0M8 15.2c2.5-.6 5.5-.6 8 0" strokeWidth="2" stroke={color} strokeLinecap="round" fill="none" />
      </g>
    );
    if (type === 'youtube')  return (
      <g>
        <rect x="2.5" y="5.5" width="19" height="13" rx="3.5" {...s} />
        <path d="M10 9.5l6 2.5-6 2.5z" fill={color} stroke="none" />
      </g>
    );
    if (type === 'tiktok')   return <g><path d="M19 6.5a4.5 4.5 0 01-4.5-4.5H12v12A2.5 2.5 0 019.5 16a2.5 2.5 0 010-5V8.5a5 5 0 00-5 5 5 5 0 005 5 5 5 0 005-5V8a7.5 7.5 0 004.5 1.5V7" stroke={color} strokeWidth="2.4" fill="none" strokeLinecap="round" /></g>;
    return <g />;
  }

  const p = (n: number) => Math.round(n * S);

  try { return new ImageResponse(
    (
      <div style={{ width: W, height: H, display: 'flex', position: 'relative', overflow: 'hidden', fontFamily: sans }}>

        {/* ── Background photo ── */}
        {bgData ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" src={bgData} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
        ) : (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(145deg,#003d2e 0%,#005440 50%,#00956e 100%)' }} />
        )}

        {/* ── Gradient overlay ── */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(to top, rgba(4,8,6,0.98) 0%, rgba(4,8,6,0.86) 28%, rgba(4,8,6,0.38) 52%, rgba(4,8,6,0.05) 70%, transparent 82%)',
          display: 'flex',
        }} />

        {/* ── Top bar ── */}
        <div style={{ position: 'absolute', top: p(22), left: p(24), right: p(22), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Location pill */}
          {location ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: p(5), background: 'rgba(4,8,6,0.45)', borderRadius: p(20), padding: `${p(5)}px ${p(11)}px` }}>
              <svg width={p(10)} height={p(10)} viewBox="0 0 24 24" fill="none">
                <path d="M12 2a7 7 0 017 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 017-7z" stroke="rgba(255,255,255,0.65)" strokeWidth="2.5" />
                <circle cx="12" cy="9" r="2.5" stroke="rgba(255,255,255,0.65)" strokeWidth="2.5" />
              </svg>
              <span style={{ fontFamily: mono, fontSize: p(9.5), color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em', display: 'flex' }}>{location}</span>
            </div>
          ) : <div />}
          {/* Circle branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: p(6), background: 'rgba(4,8,6,0.45)', borderRadius: p(20), padding: `${p(5)}px ${p(12)}px ${p(5)}px ${p(9)}px`, border: '1px solid rgba(255,255,255,0.08)' }}>
            <svg width={p(10)} height={p(12)} viewBox="0 0 10 12" fill="none">
              <path d="M5 0C5 3.5 3 4.8 3 7A2 2 0 007 7C7 4.8 5 3.5 5 0z" fill="rgba(255,255,255,0.8)" opacity="0.75" />
              <circle cx="5" cy="10" r="1.5" fill="rgba(255,255,255,0.8)" opacity="0.75" />
            </svg>
            <span style={{ fontFamily: mono, fontSize: p(10), color: 'rgba(255,255,255,0.65)', letterSpacing: '0.18em', display: 'flex' }}>engero</span>
          </div>
        </div>

        {/* ── Bottom content ── */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: `0 ${p(26)}px ${p(26)}px`, display: 'flex', flexDirection: 'column' }}>

          {/* Discipline chip */}
          {discipline && (
            <div style={{ display: 'flex', alignSelf: 'flex-start', border: `1px solid rgba(254,181,107,0.5)`, borderRadius: p(20), padding: `${p(3)}px ${p(13)}px`, marginBottom: p(12), background: 'rgba(254,181,107,0.08)' }}>
              <span style={{ fontFamily: mono, fontSize: p(9.5), color: AMBER, letterSpacing: '0.22em', textTransform: 'uppercase', display: 'flex' }}>{discipline}</span>
            </div>
          )}

          {/* Name */}
          <div style={{ fontSize: p(42), fontWeight: 800, color: '#fff', lineHeight: 1.0, letterSpacing: '-0.03em', marginBottom: p(6), display: 'flex' }}>
            {name}
          </div>

          {/* Tagline */}
          {tagline && (
            <div style={{ fontSize: p(13), color: 'rgba(255,255,255,0.52)', fontWeight: 500, marginBottom: p(18), fontStyle: 'italic', lineHeight: 1.45, display: 'flex' }}>
              {tagline}
            </div>
          )}

          {/* Flame rule */}
          <div style={{ display: 'flex', alignItems: 'center', gap: p(8), margin: `0 0 ${p(18)}px` }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.13)' }} />
            <svg width={p(10)} height={p(13)} viewBox="0 0 10 13" fill="none">
              <path d="M5 0.5C5 3.8 3 5.2 3 7.5A2 2 0 007 7.5C7 5.2 5 3.8 5 0.5z" fill="rgba(255,255,255,0.4)" />
              <circle cx="5" cy="10.5" r="1.5" fill="rgba(255,255,255,0.4)" />
            </svg>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.13)' }} />
          </div>

          {/* Stats */}
          {stats.length > 0 && (
            <div style={{ display: 'flex', marginBottom: p(18) }}>
              {stats.map((s, i) => (
                <div key={i} style={{ flex: 1, paddingLeft: i > 0 ? p(18) : 0, borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.1)' : 'none', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: p(22), fontWeight: 800, color: '#fff', lineHeight: 1, fontFamily: sans, display: 'flex' }}>{s.v}</div>
                  <div style={{ fontSize: p(8.5), color: 'rgba(255,255,255,0.35)', fontFamily: mono, letterSpacing: '0.13em', textTransform: 'uppercase', marginTop: p(3), display: 'flex' }}>{s.l}</div>
                </div>
              ))}
            </div>
          )}

          {/* Social chips: icon + handle */}
          {activeSocials.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: p(7), marginBottom: p(20) }}>
              {activeSocials.map(({ key, handle }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: p(5), border: '1px solid rgba(255,255,255,0.2)', borderRadius: p(20), padding: `${p(4)}px ${p(11)}px ${p(4)}px ${p(8)}px`, background: 'rgba(255,255,255,0.06)' }}>
                  <svg width={p(13)} height={p(13)} viewBox="0 0 24 24" style={{ display: 'block', flexShrink: 0 }}>
                    {socialPath(key, 'rgba(255,255,255,0.65)')}
                  </svg>
                  <span style={{ fontFamily: mono, fontSize: p(9), color: 'rgba(255,255,255,0.7)', letterSpacing: '0.04em', display: 'flex' }}>{handle}</span>
                </div>
              ))}
            </div>
          )}

          {/* Footer row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: p(14), borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            {cheapest ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontFamily: mono, fontSize: p(8.5), color: 'rgba(255,255,255,0.28)', letterSpacing: '0.14em', marginBottom: p(2), display: 'flex' }}>FROM</div>
                <div style={{ fontSize: p(19), fontWeight: 800, color: AMBER, fontFamily: sans, display: 'flex' }}>{`${cheapest.currency} ${Number(cheapest.price).toLocaleString()}`}</div>
              </div>
            ) : <div />}
            <div style={{ display: 'flex', alignItems: 'center', gap: p(5) }}>
              <svg width={p(8)} height={p(9.6)} viewBox="0 0 10 12" fill="none">
                <path d="M5 0C5 3.5 3 4.8 3 7A2 2 0 007 7C7 4.8 5 3.5 5 0z" fill="rgba(255,255,255,0.25)" opacity="0.75" />
                <circle cx="5" cy="10" r="1.5" fill="rgba(255,255,255,0.25)" opacity="0.75" />
              </svg>
              <span style={{ fontFamily: mono, fontSize: p(9.5), color: 'rgba(255,255,255,0.28)', letterSpacing: '0.06em' }}>{`engero.art${handle}`}</span>
            </div>
          </div>
        </div>
      </div>
    ),
    { width: W, height: H, fonts },
  ); } catch (e) {
    console.error('[share-card] ImageResponse error:', e);
    return new Response(String(e instanceof Error ? e.message : e), { status: 500 });
  }
}
