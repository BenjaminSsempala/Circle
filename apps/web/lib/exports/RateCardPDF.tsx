import {
  Document, Page, View, Text, Image, Link, StyleSheet, Svg, Path, Circle,
} from '@react-pdf/renderer';
import type { ExportData } from '@/lib/services/exports';
import type { RateCardFillable } from './exportTypes';

// ─── Tokens ──────────────────────────────────────────────────────────────────

const TEAL     = '#005440';
const AMBER    = '#feb56b';
const BG       = '#fcf9f8';
const TEXT     = '#1c1b1b';
const MUTED    = '#6f7a74';
const TEAL_DIM = 'rgba(0,84,64,0.10)';

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', backgroundColor: BG },

  // Teal header
  header: { backgroundColor: TEAL, padding: '28 32 22', position: 'relative', overflow: 'hidden' },
  photoWrap: { width: 72, height: 72, borderRadius: 36, overflow: 'hidden', border: '2.5 solid rgba(255,255,255,0.3)', alignSelf: 'center', marginBottom: 14 },
  name: { fontFamily: 'Helvetica-Bold', fontSize: 22, color: '#fff', textAlign: 'center', lineHeight: 1.1, letterSpacing: -0.4, marginBottom: 5 },
  tagline: { fontSize: 10.5, color: AMBER, textAlign: 'center', fontFamily: 'Helvetica-Bold', marginBottom: 18 },
  statsRow: { flexDirection: 'row', justifyContent: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', paddingTop: 14 },
  statCell: { flex: 1, textAlign: 'center', paddingHorizontal: 8 },
  statVal: { fontFamily: 'Helvetica-Bold', fontSize: 18, color: '#fff', lineHeight: 1 },
  statLbl: { fontSize: 7.5, color: AMBER, fontFamily: 'Helvetica-Bold', letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 3 },

  // Body
  body: { flex: 1, padding: '8 32 20', flexDirection: 'column' },
  rcLabel: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: TEAL, letterSpacing: 2.2, textTransform: 'uppercase' },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  location: { fontSize: 8, fontFamily: 'Helvetica', color: MUTED, letterSpacing: 0.8 },

  // Flame rule
  flameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flameLine: { flex: 1, height: 1, backgroundColor: TEAL, opacity: 0.18 },

  // Packages
  pkgRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11 },
  pkgName: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: TEXT },
  pkgMeta: { fontSize: 8.5, color: MUTED, marginTop: 2 },
  pkgPrice: { fontFamily: 'Helvetica-Bold', fontSize: 12, color: TEAL, lineHeight: 1 },

  // Divider
  div: { height: 1, backgroundColor: TEAL_DIM },

  // Socials
  socialsWrap: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 7, marginTop: 10 },
  socialChip: { flexDirection: 'row', alignItems: 'center', gap: 5, border: '1 solid rgba(0,84,64,0.25)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: 'rgba(0,84,64,0.03)' },
  socialHandle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: TEAL },

  // Footer watermark
  footerWm: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 12, opacity: 0.28 },
  footerTxt: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: TEAL, letterSpacing: 1.8, textTransform: 'uppercase' },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtPrice(p: number, c: string) { return `${c} ${Number(p).toLocaleString()}`; }

function FlameSvg({ size = 9, color = TEAL }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 10 12">
      <Path d="M5 0C5 3.5 3 4.8 3 7A2 2 0 007 7C7 4.8 5 3.5 5 0z" fill={color} fillOpacity={0.65} />
      <Circle cx={5} cy={10} r={1.5} fill={color} fillOpacity={0.65} />
    </Svg>
  );
}

const SOCIAL_PATHS: Record<string, string> = {
  instagram: 'M3 3h18v18H3z M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z M17.2 5.8a1.1 1.1 0 100 2.2 1.1 1.1 0 000-2.2z',
  twitter:   'M17.5 3h3l-6.5 7.5 7.5 10.5H17l-4-5.4-4.6 5.4H5l6.8-7.8L4.5 3h5l3.5 4.8z',
  spotify:   'M12 2.5A9.5 9.5 0 1012 21.5 9.5 9.5 0 0012 2.5z M7.5 9.8c3-.9 6.5-.9 9 0 M7 12.5c3-.8 7-.8 10 0 M8 15.2c2.5-.6 5.5-.6 8 0',
  youtube:   'M21.5 7.5a2 2 0 00-2-2h-15a2 2 0 00-2 2v9a2 2 0 002 2h15a2 2 0 002-2z M10 9.5l6 2.5-6 2.5z',
  linkedin:  'M2.5 2.5h19v19h-19z M7.5 10.5v6.5 M7.5 7.5a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4z M11.5 10.5v6.5 M11.5 14c0-2.5 8-2.5 8 0v3',
  tiktok:    'M19 6.5a4.5 4.5 0 01-4.5-4.5H12v12A2.5 2.5 0 019.5 16 2.5 2.5 0 0112 13.5V11a5 5 0 10-4.5 7.5 5 5 0 005-5V8a7.5 7.5 0 004.5 1.5V7',
};

function SocialSvgIcon({ platform, size = 12, color = TEAL }: { platform: string; size?: number; color?: string }) {
  const path = SOCIAL_PATHS[platform];
  if (!path) return null;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={path} stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Document ─────────────────────────────────────────────────────────────────

export function RateCardPDF({
  data, fillable, photoDataUrl,
}: {
  data: ExportData;
  fillable: RateCardFillable;
  photoDataUrl: string | null;
}) {
  const { artist, packages: allPackages, socialLinks } = data;
  const name      = String(artist.name ?? '');
  const slug      = String(artist.slug ?? '');
  const tagline   = String(artist.tagline ?? '');
  const city      = String(artist.city ?? '');
  const country   = String(artist.country ?? '');
  const location  = [city, country].filter(Boolean).join(', ');
  const profileUrl = `thecircle.co/${slug}`;
  const stats = fillable.stats.filter((s) => s.value.trim() && s.label.trim());
  const packages = allPackages.filter((p) => !fillable.excluded_package_ids?.includes(p.id));

  const activeSocials = Object.entries(fillable.active_socials)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .filter((k) => fillable.social_handles[k]?.trim() || socialLinks[k]?.trim());

  return (
    <Document title={`${name} – Rate Card`} author="The Circle">
      <Page size="A5" style={s.page}>

        {/* ── Dark teal header ── */}
        <View style={s.header}>
          {/* Photo circle */}
          <View style={s.photoWrap}>
            {photoDataUrl
              ? <Image src={photoDataUrl} style={{ width: 72, height: 72, objectFit: 'cover', objectPosition: 'top' }} />
              : <View style={{ width: 72, height: 72, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 24, color: '#fff', fontFamily: 'Helvetica-Bold' }}>{name.charAt(0)}</Text>
                </View>
            }
          </View>

          <Text style={s.name}>{name}</Text>
          {tagline ? <Text style={s.tagline}>{tagline}</Text> : null}

          {/* Stats row */}
          {stats.length > 0 && (
            <View style={s.statsRow}>
              {stats.slice(0, 3).map((st, i) => (
                <View key={i} style={{ ...s.statCell, borderRightWidth: i < Math.min(stats.length, 3) - 1 ? 1 : 0, borderRightColor: 'rgba(255,255,255,0.15)' }}>
                  <Text style={s.statVal}>{st.value}</Text>
                  <Text style={s.statLbl}>{st.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Curved divider (simplified as thin wave via SVG) ── */}
        <Svg width={420} height={18} viewBox="0 0 420 18">
          <Path d="M0 0 Q210 22 420 0 L420 18 L0 18 Z" fill={TEAL} />
        </Svg>

        {/* ── Body ── */}
        <View style={s.body}>
          {/* Header row */}
          <View style={s.labelRow}>
            <Text style={s.rcLabel}>Rate Card</Text>
            {location ? <Text style={s.location}>{location}</Text> : null}
          </View>

          {/* Flame rule */}
          <View style={{ ...s.flameRow, marginBottom: 14 }}>
            <View style={s.flameLine} />
            <Svg width={10} height={13} viewBox="0 0 10 13">
              <Path d="M5 0.5C5 3.8 3 5.2 3 7.5A2 2 0 007 7.5C7 5.2 5 3.8 5 0.5z" fill={TEAL} fillOpacity={0.5} />
              <Circle cx={5} cy={10.5} r={1.5} fill={TEAL} fillOpacity={0.5} />
            </Svg>
            <View style={s.flameLine} />
          </View>

          {/* Packages */}
          <View style={{ flex: 1 }}>
            {packages.slice(0, 5).map((pkg, i) => (
              <View key={pkg.id}>
                <View style={s.pkgRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.pkgName}>{pkg.name}</Text>
                    {(pkg.duration || pkg.description) && (
                      <Text style={s.pkgMeta}>{[pkg.duration, pkg.description].filter(Boolean).join(' · ')}</Text>
                    )}
                  </View>
                  <View style={{ textAlign: 'right', flexShrink: 0, paddingLeft: 12 }}>
                    <Text style={s.pkgPrice}>{fmtPrice(pkg.price, pkg.currency)}</Text>
                  </View>
                </View>
                {i < Math.min(packages.length, 5) - 1 && <View style={s.div} />}
              </View>
            ))}
          </View>

          {/* Socials @handle chips */}
          {activeSocials.length > 0 && (
            <View>
              <View style={{ height: 1, backgroundColor: TEAL_DIM, marginBottom: 12, marginTop: 8 }} />
              <View style={s.socialsWrap}>
                {activeSocials.map((platform) => {
                  const handle = fillable.social_handles[platform] || socialLinks[platform] || platform;
                  const displayHandle = handle.startsWith('@') ? handle : `@${handle}`;
                  return (
                    <View key={platform} style={s.socialChip}>
                      <SocialSvgIcon platform={platform} size={12} color={TEAL} />
                      <Text style={s.socialHandle}>{displayHandle}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Contact */}
          {(fillable.contact_name || fillable.contact_email || fillable.contact_phone) && (
            <View style={{ marginTop: 10 }}>
              <View style={{ height: 1, backgroundColor: TEAL_DIM, marginBottom: 8 }} />
              {[
                ['Name', fillable.contact_name],
                ['Email', fillable.contact_email],
                ['Phone', fillable.contact_phone],
              ].filter(([, v]) => v).map(([k, v]) => (
                <View key={k} style={{ flexDirection: 'row', gap: 14, paddingVertical: 3 }}>
                  <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: MUTED, letterSpacing: 1.4, textTransform: 'uppercase', minWidth: 36 }}>{k}</Text>
                  <Text style={{ fontSize: 9, color: TEXT }}>{v}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Footer watermark */}
          <View style={s.footerWm}>
            <FlameSvg size={9} color={TEAL} />
            <Text style={s.footerTxt}>circle · {profileUrl}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
