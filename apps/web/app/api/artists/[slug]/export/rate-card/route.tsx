import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { renderToBuffer, Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import QRCode from 'qrcode';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const PRIMARY = '#005440';
const SECONDARY = '#feb56b';
const GREY = '#64748b';
const BORDER = '#e2e8f0';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    paddingBottom: 48,
  },
  header: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 48,
    paddingVertical: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  wordmark: {
    fontSize: 10,
    color: SECONDARY,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  artistName: {
    fontSize: 26,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  qr: {
    width: 80,
    height: 80,
    backgroundColor: '#ffffff',
    padding: 4,
    borderRadius: 6,
  },
  body: {
    paddingHorizontal: 48,
    paddingTop: 36,
  },
  sectionLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingBottom: 6,
  },
  packageCard: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  packageCardFeatured: {
    borderColor: PRIMARY,
    backgroundColor: '#f0faf7',
  },
  packageLeft: {
    flex: 1,
    gap: 4,
  },
  packageName: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
  },
  packageDuration: {
    fontSize: 9,
    color: GREY,
  },
  packageDesc: {
    fontSize: 9,
    color: '#475569',
    lineHeight: 1.5,
    marginTop: 4,
  },
  logisticsText: {
    fontSize: 8,
    color: PRIMARY,
    fontFamily: 'Helvetica-Bold',
    marginTop: 4,
  },
  priceBlock: {
    alignItems: 'flex-end',
    gap: 4,
    minWidth: 110,
  },
  price: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY,
  },
  perLabel: {
    fontSize: 9,
    color: GREY,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 14,
  },
  footerText: {
    fontSize: 9,
    color: GREY,
  },
  footerUrl: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY,
  },
});

function formatPrice(price: number, currency: string) {
  return `${currency} ${Number(price).toLocaleString()}`;
}

// ─── Document ─────────────────────────────────────────────────────────────────

function RateCardDocument({
  artist,
  packages,
  slug,
  qrDataUrl,
}: {
  artist: Record<string, unknown>;
  packages: Record<string, unknown>[];
  slug: string;
  qrDataUrl: string;
}) {
  const name = String(artist.name ?? '');
  const artForms: string[] = Array.isArray(artist.art_forms) ? artist.art_forms.map(String) : [];
  const profileUrl = `thecircle.co/${slug}`;
  const artFormLabel = artForms.join(' · ');

  return (
    <Document title={`${name} — Rate Card`} author="Circle">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.wordmark}>Circle · Rate Card</Text>
            <Text style={styles.artistName}>{name}</Text>
            {artFormLabel ? <Text style={styles.subtitle}>{artFormLabel}</Text> : null}
          </View>
          <Image src={qrDataUrl} style={styles.qr} />
        </View>

        {/* Packages */}
        <View style={styles.body}>
          <Text style={styles.sectionLabel}>Booking Packages</Text>

          {packages.map((pkg, i) => (
            <View
              key={String(pkg.id)}
              style={[styles.packageCard, i === 0 ? styles.packageCardFeatured : {}]}
            >
              <View style={styles.packageLeft}>
                <Text style={styles.packageName}>{String(pkg.name)}</Text>
                {pkg.duration ? <Text style={styles.packageDuration}>{String(pkg.duration)}</Text> : null}
                {pkg.description ? <Text style={styles.packageDesc}>{String(pkg.description)}</Text> : null}
                {pkg.logistics_inclusive ? (
                  <Text style={styles.logisticsText}>✓ Transport included</Text>
                ) : (
                  <Text style={[styles.logisticsText, { color: GREY }]}>✗ Transport not included</Text>
                )}
              </View>
              <View style={styles.priceBlock}>
                <Text style={styles.price}>
                  {formatPrice(Number(pkg.price), String(pkg.currency))}
                </Text>
                {pkg.duration ? (
                  <Text style={styles.perLabel}>/ {String(pkg.duration).toLowerCase()}</Text>
                ) : null}
              </View>
            </View>
          ))}

          {packages.length === 0 && (
            <Text style={{ fontSize: 11, color: GREY }}>No packages listed yet.</Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Valid as of {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long' })} · Prices may vary
          </Text>
          <Text style={styles.footerUrl}>{profileUrl}</Text>
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
    supabase.from('packages').select('*').eq('is_active', true).order('created_at', { ascending: true }),
  ]);

  if (!artistRes.data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const artist = artistRes.data;
  const packages = (pkgRes.data ?? []).filter(
    (p: Record<string, unknown>) => p.artist_id === artist.id,
  );

  const qrDataUrl = await QRCode.toDataURL(`https://thecircle.co/${slug}`, {
    width: 200,
    margin: 1,
    color: { dark: '#005440', light: '#ffffff' },
  });

  let blob: Blob;
  try {
    const buf = await renderToBuffer(
      <RateCardDocument
        artist={artist}
        packages={packages}
        slug={slug}
        qrDataUrl={qrDataUrl}
      />,
    );
    const ab = new ArrayBuffer(buf.length);
    new Uint8Array(ab).set(buf);
    blob = new Blob([ab], { type: 'application/pdf' });
  } catch (err) {
    console.error('Rate card render error:', err);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }

  return new Response(blob, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${slug}-rate-card.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
