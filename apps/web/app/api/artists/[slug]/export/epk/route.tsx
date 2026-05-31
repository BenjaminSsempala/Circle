import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { renderToBuffer, Document, Page, View, Text, Image, Link, StyleSheet, Font } from '@react-pdf/renderer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const PRIMARY = '#005440';
const SECONDARY = '#feb56b';
const GREY = '#64748b';
const LIGHT_BG = '#f8faf9';
const BORDER = '#e2e8f0';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    paddingTop: 0,
    paddingBottom: 40,
  },
  header: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 48,
    paddingTop: 40,
    paddingBottom: 40,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 32,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    objectFit: 'cover',
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    gap: 6,
  },
  wordmark: {
    fontSize: 11,
    color: SECONDARY,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  artistName: {
    fontSize: 28,
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1.2,
  },
  artistMeta: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tag: {
    backgroundColor: 'rgba(254,181,107,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(254,181,107,0.4)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 9,
    color: SECONDARY,
    fontFamily: 'Helvetica-Bold',
  },
  body: {
    paddingHorizontal: 48,
    paddingTop: 32,
    gap: 0,
  },
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingBottom: 6,
    marginBottom: 12,
  },
  bioText: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 1.7,
  },
  packageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: 12,
  },
  packageName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
    flex: 1,
  },
  packagePrice: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY,
    textAlign: 'right',
    minWidth: 100,
  },
  packageDuration: {
    fontSize: 9,
    color: GREY,
    marginTop: 2,
  },
  packageDesc: {
    fontSize: 9,
    color: GREY,
    marginTop: 3,
    lineHeight: 1.5,
  },
  socialRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  socialChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: LIGHT_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  socialText: {
    fontSize: 9,
    color: PRIMARY,
    fontFamily: 'Helvetica-Bold',
  },
  footer: {
    marginTop: 'auto',
    paddingHorizontal: 48,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 9,
    color: GREY,
  },
  bookingLink: {
    fontSize: 10,
    color: PRIMARY,
    fontFamily: 'Helvetica-Bold',
  },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(price: number, currency: string) {
  return `${currency} ${Number(price).toLocaleString()}`;
}

const SOCIAL_LABELS: Record<string, string> = {
  youtube: 'YouTube', spotify: 'Spotify', tiktok: 'TikTok',
  instagram: 'Instagram', soundcloud: 'SoundCloud', linkedin: 'LinkedIn', twitter: 'X / Twitter',
};

// ─── Document ─────────────────────────────────────────────────────────────────

function EPKDocument({
  artist,
  packages,
  slug,
}: {
  artist: Record<string, unknown>;
  packages: Record<string, unknown>[];
  slug: string;
}) {
  const name = String(artist.name ?? '');
  const bio = String(artist.bio ?? '');
  const artForms: string[] = Array.isArray(artist.art_forms) ? artist.art_forms.map(String) : [];
  const tags: string[] = Array.isArray(artist.tags) ? artist.tags.map(String) : [];
  const city = String(artist.city ?? '');
  const country = String(artist.country ?? '');
  const profilePhoto = artist.profile_photo ? String(artist.profile_photo) : null;
  const socialLinks = (artist.social_links && typeof artist.social_links === 'object')
    ? artist.social_links as Record<string, string>
    : {};
  const location = [city, country].filter(Boolean).join(', ');
  const profileUrl = `thecircle.co/${slug}`;
  const allTags = [...artForms, ...tags].slice(0, 8);

  return (
    <Document title={`${name} — EPK`} author="Circle">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {profilePhoto ? (
            <Image src={profilePhoto} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder} />
          )}
          <View style={styles.headerText}>
            <Text style={styles.wordmark}>Circle · Electronic Press Kit</Text>
            <Text style={styles.artistName}>{name}</Text>
            {location ? <Text style={styles.artistMeta}>{location}</Text> : null}
            {allTags.length > 0 && (
              <View style={styles.tagRow}>
                {allTags.map((t) => (
                  <View key={t} style={styles.tag}>
                    <Text style={styles.tagText}>{t}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.body}>
          {/* Bio */}
          {bio ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>About</Text>
              <Text style={styles.bioText}>{bio}</Text>
            </View>
          ) : null}

          {/* Packages */}
          {packages.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Booking Packages</Text>
              {packages.map((pkg) => (
                <View key={String(pkg.id)} style={styles.packageRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.packageName}>{String(pkg.name)}</Text>
                    {pkg.duration ? <Text style={styles.packageDuration}>{String(pkg.duration)}</Text> : null}
                    {pkg.description ? <Text style={styles.packageDesc}>{String(pkg.description)}</Text> : null}
                    {pkg.logistics_inclusive ? (
                      <Text style={[styles.packageDesc, { color: PRIMARY, marginTop: 4 }]}>✓ Transport included</Text>
                    ) : null}
                  </View>
                  <Text style={styles.packagePrice}>
                    {formatPrice(Number(pkg.price), String(pkg.currency))}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Social links */}
          {Object.keys(socialLinks).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Online Presence</Text>
              <View style={styles.socialRow}>
                {Object.entries(socialLinks)
                  .filter(([, url]) => url?.trim())
                  .map(([platform, url]) => (
                    <Link key={platform} src={url} style={styles.socialChip}>
                      <Text style={styles.socialText}>{SOCIAL_LABELS[platform] ?? platform}</Text>
                    </Link>
                  ))}
              </View>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated via Circle · {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
          <Text style={styles.bookingLink}>{profileUrl}</Text>
        </View>
      </Page>
    </Document>
  );
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } },
) {
  const { slug } = params;

  const [artistRes, pkgRes] = await Promise.all([
    supabase.from('artists').select('*').eq('slug', slug).maybeSingle(),
    supabase.from('packages').select('*').eq('is_active', true),
  ]);

  if (!artistRes.data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const artist = artistRes.data;
  const packages = (pkgRes.data ?? []).filter(
    (p: Record<string, unknown>) => p.artist_id === artist.id,
  );

  let blob: Blob;
  try {
    const buf = await renderToBuffer(
      <EPKDocument artist={artist} packages={packages} slug={slug} />,
    );
    const ab = new ArrayBuffer(buf.length);
    new Uint8Array(ab).set(buf);
    blob = new Blob([ab], { type: 'application/pdf' });
  } catch (err) {
    console.error('EPK render error:', err);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }

  return new Response(blob, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${slug}-epk.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
