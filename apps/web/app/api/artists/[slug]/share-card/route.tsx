import { ImageResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const W = 1080;
const H = 1920;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

async function getFont(weight: 400 | 700) {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Inter:wght@${weight}&display=swap`,
    { headers: { 'User-Agent': 'Mozilla/5.0' } },
  ).then((r) => r.text());
  const url = css.match(/src: url\((.+?)\) format/)?.[1];
  if (!url) throw new Error('Font URL not found');
  return fetch(url).then((r) => r.arrayBuffer());
}

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } },
) {
  const { slug } = params;

  const { data: artist } = await supabase
    .from('artists')
    .select('name, art_forms, bio, profile_photo, city, country')
    .eq('slug', slug)
    .maybeSingle();

  if (!artist) {
    return new Response('Not found', { status: 404 });
  }

  const profileUrl = `thecircle.co/${slug}`;
  const name = artist.name ?? '';
  const artForms: string[] = Array.isArray(artist.art_forms) ? artist.art_forms : [];
  const tagline = artist.bio
    ? artist.bio.split(/[.\n]/)[0].trim().slice(0, 120)
    : `${artForms[0] ?? 'Artist'} · ${artist.city ?? ''}`;
  const location = [artist.city, artist.country].filter(Boolean).join(', ');

  // Fetch photo as ArrayBuffer if available
  let photoData: ArrayBuffer | null = null;
  if (artist.profile_photo) {
    try {
      photoData = await fetch(artist.profile_photo).then((r) => r.arrayBuffer());
    } catch { /* skip */ }
  }

  const [fontRegular, fontBold] = await Promise.all([getFont(400), getFont(700)]);

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(160deg, #003d2e 0%, #005440 40%, #00704a 100%)',
          fontFamily: 'Inter',
          padding: '120px 80px',
          position: 'relative',
        }}
      >
        {/* Subtle grid texture overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(circle at 80% 20%, rgba(254,181,107,0.12) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(0,112,74,0.3) 0%, transparent 50%)',
          }}
        />

        {/* Circle wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', zIndex: 1 }}>
          <span style={{ color: '#feb56b', fontSize: 52, fontWeight: 700, letterSpacing: '-1px' }}>
            Circle
          </span>
        </div>

        {/* Centre: photo + name + info */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 48,
            zIndex: 1,
          }}
        >
          {/* Photo */}
          <div
            style={{
              width: 340,
              height: 340,
              borderRadius: 170,
              overflow: 'hidden',
              border: '6px solid rgba(254,181,107,0.5)',
              background: 'rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {photoData ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`data:image/jpeg;base64,${Buffer.from(photoData).toString('base64')}`}
                width={340}
                height={340}
                style={{ objectFit: 'cover' }}
                alt={name}
              />
            ) : (
              <span style={{ fontSize: 120, color: 'rgba(255,255,255,0.3)' }}>♪</span>
            )}
          </div>

          {/* Name */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <span
              style={{
                color: '#ffffff',
                fontSize: 88,
                fontWeight: 700,
                letterSpacing: '-2px',
                textAlign: 'center',
                lineHeight: 1.1,
              }}
            >
              {name}
            </span>

            {/* Art form tags */}
            {artForms.length > 0 && (
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
                {artForms.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    style={{
                      background: 'rgba(254,181,107,0.15)',
                      border: '1px solid rgba(254,181,107,0.4)',
                      color: '#feb56b',
                      fontSize: 32,
                      fontWeight: 600,
                      padding: '10px 28px',
                      borderRadius: 40,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Tagline */}
            {tagline && (
              <span
                style={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 36,
                  textAlign: 'center',
                  maxWidth: 800,
                  lineHeight: 1.4,
                }}
              >
                {tagline}
              </span>
            )}

            {/* Location */}
            {location && (
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 30 }}>
                📍 {location}
              </span>
            )}
          </div>
        </div>

        {/* Bottom: profile URL */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, zIndex: 1 }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 28 }}>Book me at</span>
          <span
            style={{
              color: '#feb56b',
              fontSize: 42,
              fontWeight: 700,
              letterSpacing: '-0.5px',
            }}
          >
            {profileUrl}
          </span>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      fonts: [
        { name: 'Inter', data: fontRegular, weight: 400 },
        { name: 'Inter', data: fontBold, weight: 700 },
      ],
    },
  );
}
