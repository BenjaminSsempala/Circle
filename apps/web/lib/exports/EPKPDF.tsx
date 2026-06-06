import {
  Document, Page, View, Text, Image, Link, StyleSheet, Svg, Path, Circle, Line, Rect,
} from '@react-pdf/renderer';
import type { ExportData } from '@/lib/services/exports';
import type { EPKFillable } from './exportTypes';
import { getYouTubeId } from './exportTypes';

// ─── Tokens ──────────────────────────────────────────────────────────────────

const TEAL    = '#005440';
const AMBER   = '#feb56b';
const BG      = '#fcf9f8';
const TEXT    = '#1c1b1b';
const MUTED   = '#6f7a74';
const TEAL_DIM = 'rgba(0,84,64,0.10)';

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page:      { fontFamily: 'Helvetica', backgroundColor: BG, paddingTop: 70, paddingBottom: 70 },
  pageHeader:{ position: 'absolute', top: 0, left: 0, right: 0, height: 32, backgroundColor: BG },
  topBar:    { height: 4, backgroundColor: TEAL },
  body:      { paddingHorizontal: 40, flexDirection: 'column', gap: 0 },

  // Identity
  identity:  { flexDirection: 'row', gap: 18, alignItems: 'flex-start', marginBottom: 14 },
  photoCircle: { width: 76, height: 76, borderRadius: 38, overflow: 'hidden', backgroundColor: 'rgba(0,84,64,0.12)', border: '2 solid rgba(0,84,64,0.18)', flexShrink: 0 },
  identRight: { flex: 1, paddingTop: 2 },
  identTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  name:      { fontFamily: 'Helvetica-Bold', fontSize: 26, color: TEXT, lineHeight: 1.05, letterSpacing: -0.6, marginBottom: 4 },
  tagline:   { fontSize: 10.5, color: AMBER, fontFamily: 'Helvetica-Bold', marginBottom: 6 },
  metaRow:   { flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  location:  { fontSize: 7.5, fontFamily: 'Helvetica', color: MUTED, letterSpacing: 0.8 },
  discipline:{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: TEAL, letterSpacing: 1.2, border: '1 solid rgba(0,84,64,0.3)', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 2, textTransform: 'uppercase' },
  circleWm:  { flexDirection: 'row', alignItems: 'center', gap: 3, opacity: 0.6 },
  wmText:    { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: TEAL, letterSpacing: 1.8, textTransform: 'uppercase' },

  // Bio
  bio:       { fontSize: 9.5, color: '#3a4540', lineHeight: 1.72, marginBottom: 10 },

  // Divider
  hr:        { borderTopWidth: 1, borderTopColor: TEAL_DIM, marginVertical: 12 },

  // Section label
  secLabel:  { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: TEAL, letterSpacing: 2.2, textTransform: 'uppercase', marginBottom: 7 },

  // Tags + stats row
  tagsStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: TEAL_DIM },
  tagsWrap:  { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  tag:       { fontSize: 8, fontFamily: 'Helvetica-Bold', color: TEAL, border: '1 solid rgba(0,84,64,0.28)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  statsRow:  { flexDirection: 'row', gap: 0, flexShrink: 0, marginLeft: 10 },
  statBlock: { paddingLeft: 14, textAlign: 'right' },
  statVal:   { fontFamily: 'Helvetica-Bold', fontSize: 17, color: TEAL, lineHeight: 1 },
  statLbl:   { fontSize: 6.5, color: MUTED, fontFamily: 'Helvetica-Bold', letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 1 },

  // Experience
  expEntry:  { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 4 },
  expYear:   { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: TEAL, minWidth: 32 },
  expRole:   { fontFamily: 'Helvetica-Bold', fontSize: 9, color: TEXT, flex: 1 },
  expOrg:    { fontSize: 8.5, color: MUTED },

  // Work cards
  worksRow:  { flexDirection: 'row', gap: 9, marginBottom: 12 },
  workCard:  { flex: 1, borderRadius: 7, overflow: 'hidden', border: `1 solid ${TEAL_DIM}`, backgroundColor: '#fff' },
  workThumb: { height: 66, objectFit: 'cover' },
  workThumbBlank: { height: 66, backgroundColor: 'rgba(0,84,64,0.06)', alignItems: 'center', justifyContent: 'center' },
  workInfo:  { padding: '7 9 8' },
  workTitle: { fontFamily: 'Helvetica-Bold', fontSize: 8.5, color: TEXT, lineHeight: 1.35, marginBottom: 2 },
  workPlat:  { fontSize: 7.5, color: AMBER, fontFamily: 'Helvetica-Bold', letterSpacing: 0.4 },

  // Packages
  pkgRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 },
  pkgName:   { fontFamily: 'Helvetica-Bold', fontSize: 9.5, color: TEXT },
  pkgDur:    { fontSize: 7.5, color: MUTED, fontFamily: 'Helvetica', marginLeft: 6 },
  pkgPrice:  { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: TEAL },

  // Socials + Contact row
  twoCol:    { flexDirection: 'row', gap: 28, marginBottom: 10 },
  col:       { flex: 1 },
  socialChip:{ flexDirection: 'row', alignItems: 'center', gap: 5, border: `1 solid rgba(0,84,64,0.28)`, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: 'rgba(0,84,64,0.02)', marginRight: 5, marginBottom: 5 },
  socialHandle: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: TEAL },
  socialsWrap: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 7 },
  contactRow: { flexDirection: 'row', gap: 14, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: TEAL_DIM },
  contactLbl: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: MUTED, letterSpacing: 1.4, textTransform: 'uppercase', minWidth: 36 },
  contactVal: { fontSize: 9, color: TEXT, lineHeight: 1.4 },

  // Footer
  footer:    {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 40, paddingTop: 10, paddingBottom: 12,
    borderTopWidth: 1, borderTopColor: '#bec9c3',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: BG,
  },
  footerLine:{ flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerRule:{ flex: 1, height: 1, backgroundColor: TEAL, opacity: 0.18 },
  footerWm:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, opacity: 0.28, marginTop: 5 },
  footerTxt: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: TEAL, letterSpacing: 2, textTransform: 'uppercase' },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtPrice(p: number, c: string) { return `${c} ${Number(p).toLocaleString()}`; }
function fmtDate() { return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); }

// Inline flame SVG shapes for @react-pdf
function FlameSvg({ size = 9, color = TEAL }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 10 12">
      <Path d="M5 0C5 3.5 3 4.8 3 7A2 2 0 007 7C7 4.8 5 3.5 5 0z" fill={color} fillOpacity={0.65} />
      <Circle cx={5} cy={10} r={1.5} fill={color} fillOpacity={0.65} />
    </Svg>
  );
}

// Social icon paths (simplified for react-pdf SVG)
const SOCIAL_PATHS: Record<string, string> = {
  instagram: 'M3 3h18v18H3z M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z M17.2 5.8a1.1 1.1 0 100 2.2 1.1 1.1 0 000-2.2z',
  twitter:   'M17.5 3h3l-6.5 7.5 7.5 10.5H17l-4-5.4-4.6 5.4H5l6.8-7.8L4.5 3h5l3.5 4.8z',
  spotify:   'M12 2.5A9.5 9.5 0 1012 21.5 9.5 9.5 0 0012 2.5z M7.5 9.8c3-.9 6.5-.9 9 0 M7 12.5c3-.8 7-.8 10 0 M8 15.2c2.5-.6 5.5-.6 8 0',
  youtube:   'M21.5 7.5a2 2 0 00-2-2h-15a2 2 0 00-2 2v9a2 2 0 002 2h15a2 2 0 002-2z M10 9.5l6 2.5-6 2.5z',
  linkedin:  'M2.5 2.5h19v19h-19z M7.5 10.5v6.5 M7.5 7.5a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4z M11.5 10.5v6.5 M11.5 14c0-2.5 8-2.5 8 0v3',
  tiktok:    'M19 6.5a4.5 4.5 0 01-4.5-4.5H12v12A2.5 2.5 0 019.5 16 2.5 2.5 0 0112 13.5V11a5 5 0 10-4.5 7.5 5 5 0 005-5V8a7.5 7.5 0 004.5 1.5V7',
};

function SocialSvgIcon({ platform, size = 11, color = TEAL }: { platform: string; size?: number; color?: string }) {
  const path = SOCIAL_PATHS[platform];
  if (!path) return null;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={path} stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Document ─────────────────────────────────────────────────────────────────

export function EPKPDF({
  data, fillable, photoDataUrl, workDataUrls,
}: {
  data: ExportData;
  fillable: EPKFillable;
  photoDataUrl: string | null;
  workDataUrls: (string | null)[];
}) {
  const { artist, packages, works, socialLinks } = data;
  const name      = String(artist.name ?? '');
  const slug      = String(artist.slug ?? '');
  const bio       = fillable.bio?.trim() || String(artist.bio ?? '');
  const tagline   = String(artist.tagline ?? '');
  const city      = String(artist.city ?? '');
  const country   = String(artist.country ?? '');
  const artForms: string[] = Array.isArray(artist.art_forms) ? artist.art_forms as string[] : [];
  const tags: string[]     = Array.isArray(artist.tags) ? artist.tags as string[] : [];
  const discipline = artForms[0] ?? '';
  const location   = [city, country].filter(Boolean).join(', ');
  const profileUrl = `thecircle.co/${slug}`;

  // Works — use profile selected_works filtered by excluded_work_ids
  const filteredWorks = works.filter((w) => !fillable.excluded_work_ids?.includes(w.id)).slice(0, 3);

  // Socials
  const activeSocials = Object.entries(fillable.active_socials)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .filter((k) => fillable.social_handles[k]?.trim() || socialLinks[k]?.trim());

  // Experience
  const experience = fillable.experience.filter((e) => e.role.trim() || e.org.trim());

  // Contact
  const contactRows: [string, string][] = [
    ['Name', fillable.contact_name],
    ['Email', fillable.contact_email],
    ['Phone', fillable.contact_phone],
  ].filter(([, v]) => v.trim()) as [string, string][];

  return (
    <Document title={`${name} – EPK`} author="The Circle">
      <Page size="A4" style={s.page}>

        {/* Page header — fixed flow element: repeats on every page and reserves 32px of space */}
        <View style={s.pageHeader} fixed>
          <View style={s.topBar} />
        </View>

        <View style={s.body}>

          {/* ── Identity ── */}
          <View style={s.identity}>
            <View style={s.photoCircle}>
              {photoDataUrl
                ? <Image src={photoDataUrl} style={{ width: 76, height: 76, objectFit: 'cover', objectPosition: 'top' }} />
                : <View style={{ width: 76, height: 76, backgroundColor: 'rgba(0,84,64,0.12)', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 26, color: TEAL, fontFamily: 'Helvetica-Bold' }}>{name.charAt(0)}</Text>
                  </View>
              }
            </View>
            <View style={s.identRight}>
              <View style={s.identTop}>
                <View>
                  <Text style={s.name}>{name}</Text>
                  {tagline ? <Text style={s.tagline}>{tagline}</Text> : null}
                </View>
                <View style={s.circleWm}>
                  <FlameSvg size={9} color={TEAL} />
                  <Text style={s.wmText}>The Circle</Text>
                </View>
              </View>
              <View style={s.metaRow}>
                {location ? <Text style={s.location}>{location}</Text> : null}
                {discipline ? <Text style={s.discipline}>{discipline}</Text> : null}
              </View>
            </View>
          </View>

          {/* ── Bio ── */}
          {bio ? <Text style={s.bio}>{bio}</Text> : null}

          {/* ── Tags + divider ── */}
          {tags.length > 0 && (
            <View style={s.tagsStats}>
              <View style={s.tagsWrap}>
                {tags.slice(0, 6).map((t) => (
                  <View key={t} style={{ ...s.tag, marginRight: 4, marginBottom: 3 }}>
                    <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: TEAL }}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Experience ── */}
          {experience.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <Text style={s.secLabel}>Experience</Text>
              {experience.slice(0, 5).map((e, i) => (
                <View key={i} style={s.expEntry}>
                  {e.year ? <Text style={s.expYear}>{e.year}</Text> : null}
                  <View style={{ flex: 1 }}>
                    <Text style={s.expRole}>{e.role}{e.org ? <Text style={s.expOrg}> · {e.org}</Text> : null}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ── Selected Work ── */}
          {filteredWorks.length > 0 && (
            <View wrap={false} style={{ marginBottom: 12 }}>
              <Text style={s.secLabel}>Selected Work</Text>
              <View style={s.worksRow}>
                {filteredWorks.map((w, i) => {
                  const ytId = getYouTubeId(w.media_url || '');
                  const thumbUrl = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null;
                  const thumbData = workDataUrls[i];
                  return (
                    <Link key={w.id} src={w.media_url || '#'} style={{ ...s.workCard, textDecoration: 'none' }}>
                      {thumbData || thumbUrl ? (
                        <Image src={(thumbData || thumbUrl)!} style={s.workThumb} />
                      ) : (
                        <View style={s.workThumbBlank}>
                          <Text style={{ fontSize: 16, color: TEAL, opacity: 0.3 }}>▶</Text>
                        </View>
                      )}
                      <View style={s.workInfo}>
                        <Text style={s.workTitle}>{w.title || 'Untitled'}</Text>
                        <Text style={s.workPlat}>{w.provider}</Text>
                      </View>
                    </Link>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── Technical Requirements ── */}
          {fillable.technical_requirements?.trim() && (
            <View style={{ marginBottom: 12 }}>
              <Text style={s.secLabel}>Technical Requirements</Text>
              <Text style={{ fontSize: 8.5, color: MUTED, lineHeight: 1.65, marginTop: 4 }}>
                {fillable.technical_requirements}
              </Text>
            </View>
          )}

          {/* ── Packages ── */}
          {packages.filter((p) => !fillable.excluded_package_ids?.includes(p.id)).length > 0 && (
            <View wrap={false} style={{ marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: TEAL_DIM }}>
              <Text style={s.secLabel}>Packages</Text>
              {packages.filter((p) => !fillable.excluded_package_ids?.includes(p.id)).slice(0, 4).map((p) => (
                <View key={p.id} style={[s.pkgRow, { alignItems: 'flex-start' }]}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'baseline' }}>
                      <Text style={s.pkgName}>{p.name}</Text>
                      {p.duration ? <Text style={s.pkgDur}>{p.duration}</Text> : null}
                    </View>
                    {(p as { description?: string | null }).description ? (
                      <Text style={{ fontSize: 8, color: MUTED, lineHeight: 1.4, marginTop: 1 }}>
                        {(p as { description?: string | null }).description}
                      </Text>
                    ) : null}
                    {typeof (p as { logistics_inclusive?: boolean }).logistics_inclusive === 'boolean' && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        {/* Colored dot indicator — Helvetica doesn't reliably render ✓ */}
                        <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: (p as { logistics_inclusive?: boolean }).logistics_inclusive ? TEAL : '#e0e0e0', justifyContent: 'center', alignItems: 'center' }}>
                          {(p as { logistics_inclusive?: boolean }).logistics_inclusive && (
                            <View style={{ width: 3, height: 1.5, backgroundColor: '#fff', borderRadius: 1 }} />
                          )}
                        </View>
                        <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: (p as { logistics_inclusive?: boolean }).logistics_inclusive ? TEAL : MUTED }}>
                          {(p as { logistics_inclusive?: boolean }).logistics_inclusive ? 'Transport included' : 'Transport not included'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={s.pkgPrice}>{fmtPrice(p.price, p.currency)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── Socials + Contact ── */}
          {(activeSocials.length > 0 || contactRows.length > 0) && (
            <View wrap={false} style={s.twoCol}>
              {activeSocials.length > 0 && (
                <View style={s.col}>
                  <Text style={s.secLabel}>Socials</Text>
                  <View style={s.socialsWrap}>
                    {activeSocials.map((platform) => {
                      const handle = fillable.social_handles[platform] || socialLinks[platform] || platform;
                      const displayHandle = handle.startsWith('@') ? handle : `@${handle}`;
                      return (
                        <View key={platform} style={{ ...s.socialChip }}>
                          <SocialSvgIcon platform={platform} size={11} color={TEAL} />
                          <Text style={s.socialHandle}>{displayHandle}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
              {contactRows.length > 0 && (
                <View style={s.col}>
                  <Text style={s.secLabel}>Contact</Text>
                  <View style={{ marginTop: 7 }}>
                    {contactRows.map(([k, v], i) => (
                      <View key={k} style={{ ...s.contactRow, borderBottomWidth: i < contactRows.length - 1 ? 1 : 0 }}>
                        <Text style={s.contactLbl}>{k}</Text>
                        <Text style={s.contactVal}>{v}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

        </View>

        {/* ── Footer — direct child of Page so absolute positioning is unambiguous ── */}
        <View style={s.footer} fixed>
          <View style={s.footerLine}>
            <View style={s.footerRule} />
            <Svg width={10} height={13} viewBox="0 0 10 13">
              <Path d="M5 0.5C5 3.8 3 5.2 3 7.5A2 2 0 007 7.5C7 5.2 5 3.8 5 0.5z" fill={TEAL} fillOpacity={0.5} />
              <Circle cx={5} cy={10.5} r={1.5} fill={TEAL} fillOpacity={0.5} />
            </Svg>
            <View style={s.footerRule} />
          </View>
          <View style={s.footerWm}>
            <FlameSvg size={8} color={TEAL} />
            <Text style={s.footerTxt}>circle · {profileUrl} · electronic press kit</Text>
          </View>
        </View>

      </Page>
    </Document>
  );
}
