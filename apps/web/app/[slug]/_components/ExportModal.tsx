'use client';

import { useState, useRef, useEffect } from 'react';
import {
  DEFAULT_EPK, DEFAULT_RATE_CARD, STAT_TEMPLATES, SOCIAL_PLATFORMS,
  getYouTubeId, detectPlatform, extractHandleFromUrl,
  type EPKFillable, type RateCardFillable, type WorkEntry, type ExperienceEntry,
} from '@/lib/exports/exportTypes';

export type ExportModalMode = 'epk' | 'rate-card';

// ─── Design tokens (mirror epk-doc.jsx) ──────────────────────────────────────

const TEAL = '#005440';
const AMBER = '#feb56b';
const BG = '#fcf9f8';
const TEXT = '#1c1b1b';
const MUTED = '#6f7a74';
const TEAL_DIM = 'rgba(0,84,64,0.10)';
const SANS = "'Plus Jakarta Sans', sans-serif";
const MONO = "'JetBrains Mono', monospace";

// ─── Shared SVG atoms ─────────────────────────────────────────────────────────

function FlameRule({ color = TEAL, margin = '12px 0' }: { color?: string; margin?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin }}>
      <div style={{ flex: 1, height: 1, background: color, opacity: 0.18 }} />
      <svg width="10" height="13" viewBox="0 0 10 13" fill="none">
        <path d="M5 0.5C5 3.8 3 5.2 3 7.5A2 2 0 007 7.5C7 5.2 5 3.8 5 0.5z" fill={color} opacity="0.5" />
        <circle cx="5" cy="10.5" r="1.5" fill={color} opacity="0.5" />
      </svg>
      <div style={{ flex: 1, height: 1, background: color, opacity: 0.18 }} />
    </div>
  );
}

function FlameIcon({ size = 13, color = TEAL }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 10 12" fill="none" style={{ display: 'block' }}>
      <path d="M5 0C5 3.5 3 4.8 3 7A2 2 0 007 7C7 4.8 5 3.5 5 0z" fill={color} opacity="0.65" />
      <circle cx="5" cy="10" r="1.5" fill={color} opacity="0.65" />
    </svg>
  );
}

function SocialIcon({ type, size = 16, color = TEAL }: { type: string; size?: number; color?: string }) {
  const s = { stroke: color, strokeWidth: '1.8', fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const icons: Record<string, React.ReactNode> = {
    instagram: <><rect x="3" y="3" width="18" height="18" rx="5" {...s} /><circle cx="12" cy="12" r="4.5" {...s} /><circle cx="17.2" cy="6.8" r="1.1" fill={color} /></>,
    twitter:   <path d="M17.5 3h3l-6.5 7.5 7.5 10.5H17l-4-5.4-4.6 5.4H5l6.8-7.8L4.5 3h5l3.5 4.8z" fill={color} />,
    spotify:   <><circle cx="12" cy="12" r="9.5" {...s} /><path d="M7.5 9.8c3-.9 6.5-.9 9 0M7 12.5c3-.8 7-.8 10 0M8 15.2c2.5-.6 5.5-.6 8 0" strokeWidth="1.6" stroke={color} strokeLinecap="round" fill="none" /></>,
    youtube:   <><rect x="2.5" y="5.5" width="19" height="13" rx="3.5" {...s} /><path d="M10 9.5l6 2.5-6 2.5z" fill={color} /></>,
    linkedin:  <><rect x="2.5" y="2.5" width="19" height="19" rx="3.5" {...s} /><line x1="7.5" y1="10.5" x2="7.5" y2="17" stroke={color} strokeWidth="1.8" /><circle cx="7.5" cy="7.5" r="1.2" fill={color} /><path d="M11.5 10.5v6.5M11.5 13.5c0-2.2 7.5-2.2 7.5 0V17" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" /></>,
    tiktok:    <path d="M19 6.5a4.5 4.5 0 01-4.5-4.5H12v12A2.5 2.5 0 019.5 16a2.5 2.5 0 010-5V8.5a5 5 0 00-5 5 5 5 0 005 5 5 5 0 005-5V8a7.5 7.5 0 004.5 1.5V7" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', flexShrink: 0 }}>
      {icons[type] ?? null}
    </svg>
  );
}

// ─── Work card (HTML preview) ─────────────────────────────────────────────────

function PlatformIcon({ platform, size = 12 }: { platform: string; size?: number }) {
  const color = TEAL;
  const icons: Record<string, React.ReactNode> = {
    youtube:    <><rect x="2.5" y="5.5" width="19" height="13" rx="3.5" stroke={color} strokeWidth="1.8" fill="none"/><path d="M10 9.5l6 2.5-6 2.5z" fill={color}/></>,
    spotify:    <><circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="1.8" fill="none"/><path d="M7.5 9.8c3-.9 6.5-.9 9 0M7 12.5c3-.8 7-.8 10 0M8 15.2c2.5-.6 5.5-.6 8 0" strokeWidth="1.6" stroke={color} strokeLinecap="round" fill="none"/></>,
    soundcloud: <path d="M2 14a1 1 0 001 1h14a2 2 0 000-4 4 4 0 00-6.5-3A5 5 0 002 14z" stroke={color} strokeWidth="1.6" fill="none"/>,
    vimeo:      <><circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="1.8" fill="none"/><path d="M8 9c3 0 5 2 4.5 6C16 12 17 9 15.5 9c-1 0-2 1.5-2 1.5S12 8 8 9z" fill={color} opacity="0.7"/></>,
    instagram:  <><rect x="4" y="4" width="16" height="16" rx="4" stroke={color} strokeWidth="1.8" fill="none"/><circle cx="12" cy="12" r="3.5" stroke={color} strokeWidth="1.8" fill="none"/><circle cx="16.5" cy="7.5" r="1" fill={color}/></>,
    tiktok:     <path d="M19 6.5a4.5 4.5 0 01-4.5-4.5H12v12A2.5 2.5 0 019.5 16a2.5 2.5 0 010-5V8.5a5 5 0 105 5V8a7.5 7.5 0 004.5 1.5V7" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round"/>,
    link:       <><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', flexShrink: 0 }}>
      {icons[platform] ?? icons.link}
    </svg>
  );
}

function WorkCardPreview({ work }: { work: ExportWork | WorkEntry }) {
  const url = 'media_url' in work ? work.media_url : (work as WorkEntry).url;
  const ytId = getYouTubeId(url || '');
  const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`
    : ('thumbnail_url' in work && work.thumbnail_url) ? work.thumbnail_url : null;
  const platform = ('provider' in work ? work.provider : (work as WorkEntry).platform) || detectPlatform(url) || 'link';

  return (
    <a href={url || '#'} target="_blank" rel="noopener noreferrer"
      style={{ flex: 1, minWidth: 0, borderRadius: 7, overflow: 'hidden', border: `1px solid ${TEAL_DIM}`, background: '#fff', textDecoration: 'none', display: 'block', cursor: url ? 'pointer' : 'default' }}>
      <div style={{ height: 74, background: 'rgba(0,84,64,0.06)', overflow: 'hidden', position: 'relative' }}>
        {thumb
          ? <img src={thumb} alt={work.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke={TEAL} strokeWidth="1.5" opacity="0.3" />
                <path d="M10 8.5l6 3.5-6 3.5z" fill={TEAL} opacity="0.3" />
              </svg>
            </div>
        }
        {ytId && (
          <div style={{ position: 'absolute', bottom: 5, right: 6, background: 'rgba(0,0,0,0.55)', borderRadius: 4, width: 18, height: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="8" height="8" viewBox="0 0 8 8"><path d="M2 1.5l5 2.5-5 2.5z" fill="#fff" /></svg>
          </div>
        )}
      </div>
      <div style={{ padding: '7px 9px 8px' }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: TEXT, lineHeight: 1.35, fontFamily: SANS, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>
          {work.title || 'Untitled'}
        </div>
        <div style={{ marginTop: 4 }}>
          <PlatformIcon platform={platform} size={11} />
        </div>
      </div>
    </a>
  );
}

// ─── EPK Live HTML Preview ────────────────────────────────────────────────────

function EPKPreview({
  epkData, artistName, artistPhoto, artistTagline, artistBio,
  artForms, artistTags, artistCity, artistCountry, packages, selectedWorks,
}: {
  epkData: EPKFillable;
  artistName: string;
  artistPhoto: string | null;
  artistTagline: string | null;
  artistBio: string | null;
  artForms: string[];
  artistTags: string[] | null;
  artistCity: string | null;
  artistCountry: string | null;
  packages: ExportPackage[];
  selectedWorks: ExportWork[];
}) {
  // Works: use profile's selectedWorks filtered by excluded_work_ids
  const works = selectedWorks
    .filter((w) => !epkData.excluded_work_ids.includes(w.id))
    .slice(0, 3);
  const location = [artistCity, artistCountry].filter(Boolean).join(', ');
  const activeSocials = SOCIAL_PLATFORMS.filter((p) => epkData.active_socials[p]);
  const discipline = artForms[0] ?? '';
  const contactRows: [string, string][] = [
    ['Name', epkData.contact_name],
    ['Email', epkData.contact_email],
    ['Phone', epkData.contact_phone],
  ].filter(([, v]) => v.trim()) as [string, string][];

  return (
    <div style={{ width: 595, minHeight: 842, background: BG, fontFamily: SANS, display: 'flex', flexDirection: 'column' }}>
      {/* Top teal bar */}
      <div style={{ height: 4, background: TEAL, flexShrink: 0 }} />

      <div style={{ flex: 1, padding: '28px 40px 20px', display: 'flex', flexDirection: 'column' }}>

        {/* Identity */}
        <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', marginBottom: 14 }}>
          <div style={{ width: 76, height: 76, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(0,84,64,0.18)', flexShrink: 0 }}>
            {artistPhoto
              ? <img src={artistPhoto} alt={artistName} style={{ width: 76, height: 76, objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
              : <div style={{ width: 76, height: 76, background: 'rgba(0,84,64,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 28, color: TEAL, fontWeight: 800 }}>{artistName.charAt(0)}</span>
                </div>
            }
          </div>
          <div style={{ flex: 1, paddingTop: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: 29, fontWeight: 800, color: TEXT, lineHeight: 1.05, letterSpacing: '-0.025em', margin: '0 0 4px', fontFamily: SANS }}>{artistName}</h1>
                <p style={{ fontSize: 11, color: AMBER, fontWeight: 600, margin: '0 0 6px', fontFamily: SANS }}>{artistTagline}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingTop: 3 }}>
                <FlameIcon size={10} color={TEAL} />
                <span style={{ fontSize: 7, fontFamily: MONO, color: TEAL, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.6 }}>Engero</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              {location && (
                <span style={{ fontSize: 7.5, fontFamily: MONO, color: MUTED, letterSpacing: '0.08em' }}>{location}</span>
              )}
              {discipline && (
                <span style={{ fontSize: 7.5, fontFamily: MONO, color: TEAL, letterSpacing: '0.12em', border: '1px solid rgba(0,84,64,0.3)', borderRadius: 20, padding: '2px 9px', textTransform: 'uppercase' as const }}>
                  {discipline}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bio: uses editable version from form, fully shown */}
        <p style={{ fontSize: 9.5, color: '#3a4540', lineHeight: 1.7, margin: '0 0 10px' }}>
          {epkData.bio || artistBio}
        </p>

        {/* Tags + stats row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${TEAL_DIM}` }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {(artistTags ?? []).slice(0, 5).map((t) => (
              <span key={t} style={{ fontSize: 8, fontFamily: MONO, border: '1px solid rgba(0,84,64,0.28)', color: TEAL, borderRadius: 20, padding: '2px 8px' }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Experience */}
        {epkData.experience.some((e) => e.role.trim() || e.org.trim()) && (
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 7.5, fontFamily: MONO, color: TEAL, letterSpacing: '0.22em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 6 }}>Experience</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {epkData.experience.filter((e) => e.role.trim() || e.org.trim()).slice(0, 4).map((e, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                  {e.year && <span style={{ fontSize: 7.5, fontFamily: MONO, color: TEAL, minWidth: 32, flexShrink: 0 }}>{e.year}</span>}
                  <div>
                    <span style={{ fontSize: 9, fontWeight: 700, color: TEXT }}>{e.role}</span>
                    {e.org && <span style={{ fontSize: 8.5, color: MUTED, marginLeft: 6 }}>· {e.org}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Work */}
        {works.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 7.5, fontFamily: MONO, color: TEAL, letterSpacing: '0.22em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 7 }}>Selected Work</span>
            <div style={{ display: 'flex', gap: 9 }}>
              {works.map((w, i) => <WorkCardPreview key={i} work={w} />)}
            </div>
          </div>
        )}

        {/* Packages */}
        {packages.filter((p) => !epkData.excluded_package_ids.includes(p.id)).length > 0 && (
          <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${TEAL_DIM}` }}>
            <span style={{ fontSize: 7.5, fontFamily: MONO, color: TEAL, letterSpacing: '0.22em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 7 }}>Packages</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {packages.filter((p) => !epkData.excluded_package_ids.includes(p.id)).slice(0, 4).map((p) => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 7, alignItems: 'baseline' }}>
                      <span style={{ fontSize: 9.5, fontWeight: 700, color: TEXT, fontFamily: SANS }}>{p.name}</span>
                      {p.duration && <span style={{ fontSize: 7.5, color: MUTED, fontFamily: MONO }}>{p.duration}</span>}
                    </div>
                    {p.description && (
                      <span style={{ fontSize: 8, color: MUTED, lineHeight: 1.4, display: 'block', marginTop: 1 }}>{p.description}</span>
                    )}
                    {p.logistics_inclusive !== undefined && (
                      <span style={{ fontSize: 7.5, color: p.logistics_inclusive ? TEAL : MUTED, fontFamily: MONO }}>
                        {p.logistics_inclusive ? '✓ Transport incl.' : '✗ Transport excl.'}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 9.5, fontFamily: MONO, fontWeight: 700, color: TEAL, flexShrink: 0 }}>
                    {p.currency} {p.price.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Technical Requirements */}
        {epkData.technical_requirements?.trim() && (
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 7.5, fontFamily: MONO, color: TEAL, letterSpacing: '0.22em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 6 }}>Technical Requirements</span>
            <p style={{ fontSize: 8.5, color: MUTED, lineHeight: 1.65, whiteSpace: 'pre-line' as const }}>{epkData.technical_requirements}</p>
          </div>
        )}

        {/* Socials + Contact */}
        <div style={{ display: 'flex', gap: 28, marginBottom: 10 }}>
          {activeSocials.length > 0 && (
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 7.5, fontFamily: MONO, color: TEAL, letterSpacing: '0.22em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 7 }}>Socials</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {activeSocials.map((s) => {
                  const handle = epkData.social_handles[s] || s;
                  const href = `https://${s}.com/${handle.replace('@', '')}`;
                  return (
                    <a key={s} href={href} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, border: '1px solid rgba(0,84,64,0.28)', borderRadius: 20, padding: '3px 9px 3px 7px', background: 'rgba(0,84,64,0.03)', textDecoration: 'none', cursor: 'pointer' }}>
                      <SocialIcon type={s} size={11} color={TEAL} />
                      <span style={{ fontSize: 8, fontFamily: MONO, color: TEAL }}>
                        {handle.startsWith('@') ? handle : `@${handle}`}
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
          {contactRows.length > 0 && (
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 7.5, fontFamily: MONO, color: TEAL, letterSpacing: '0.22em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 7 }}>Contact</span>
              <div>
                {contactRows.map(([k, v], i) => (
                  <div key={k} style={{ display: 'flex', gap: 14, padding: '4px 0', borderBottom: i < contactRows.length - 1 ? `1px solid ${TEAL_DIM}` : 'none' }}>
                    <span style={{ fontSize: 7.5, fontFamily: MONO, color: MUTED, letterSpacing: '0.14em', textTransform: 'uppercase' as const, minWidth: 36 }}>{k}</span>
                    <span style={{ fontSize: 9, color: TEXT, lineHeight: 1.4 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 'auto' }}>
          <FlameRule margin="5px 0 6px" />
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5, opacity: 0.3 }}>
            <FlameIcon size={9} color={TEAL} />
            <span style={{ fontSize: 7, fontFamily: MONO, color: TEAL, letterSpacing: '0.2em', textTransform: 'uppercase' as const }}>engero · engero.art · electronic press kit</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Rate Card Live HTML Preview ──────────────────────────────────────────────

function RateCardPreview({
  rcData, artistName, artistPhoto, artistTagline, artistLocation,
  packages,
}: {
  rcData: RateCardFillable;
  artistName: string;
  artistPhoto: string | null;
  artistTagline: string | null;
  artistLocation: string;
  packages: { id: string; name: string; price: number; currency: string; duration?: string | null; description?: string | null }[];
}) {
  const activeSocials = SOCIAL_PLATFORMS.filter((p) => rcData.active_socials[p]);
  const visiblePackages = packages.filter((p) => !rcData.excluded_package_ids?.includes(p.id));

  return (
    <div style={{ width: 420, height: 595, background: BG, fontFamily: SANS, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      {/* Teal header */}
      <div style={{ background: TEAL, padding: '28px 32px 22px', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.06 }} aria-hidden="true">
          <defs>
            <pattern id="dot-rc" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="#fff" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-rc)" />
        </svg>
        {/* Photo */}
        <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', border: '2.5px solid rgba(255,255,255,0.3)', margin: '0 auto 14px', position: 'relative' }}>
          {artistPhoto
            ? <img src={artistPhoto} alt={artistName} style={{ width: 72, height: 72, objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
            : <div style={{ width: 72, height: 72, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 26, color: '#fff', fontWeight: 800 }}>{artistName.charAt(0)}</span>
              </div>
          }
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.1, letterSpacing: '-0.02em', margin: '0 0 5px', fontFamily: SANS }}>{artistName}</h1>
        <p style={{ fontSize: 10.5, color: AMBER, textAlign: 'center', fontWeight: 600, margin: '0 0 18px', fontFamily: SANS }}>{artistTagline}</p>
        {rcData.stats.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 0, borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 14 }}>
            {rcData.stats.slice(0, 3).map((s, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.15)' : 'none', padding: '0 8px' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1, fontFamily: SANS }}>{s.value}</div>
                <div style={{ fontSize: 7.5, color: AMBER, fontFamily: MONO, letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Curved divider */}
      <div style={{ position: 'relative', height: 20, flexShrink: 0, background: BG }}>
        <svg style={{ position: 'absolute', top: 0, left: 0, right: 0, width: '100%', height: 20 }} viewBox="0 0 420 20" preserveAspectRatio="none">
          <path d="M0 0 Q210 24 420 0 L420 20 L0 20 Z" fill={TEAL} />
        </svg>
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: '4px 32px 20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 7.5, fontFamily: MONO, color: TEAL, letterSpacing: '0.22em', textTransform: 'uppercase' as const }}>Rate Card</span>
          {artistLocation && <span style={{ fontSize: 8, fontFamily: MONO, color: MUTED }}>{artistLocation}</span>}
        </div>
        <FlameRule margin="0 0 14px" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
          {visiblePackages.slice(0, 4).map((p, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < Math.min(visiblePackages.length, 4) - 1 ? `1px solid ${TEAL_DIM}` : 'none' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: TEXT, fontFamily: SANS }}>{p.name}</div>
                {(p.duration || p.description) && (
                  <div style={{ fontSize: 8.5, color: MUTED, marginTop: 2, fontFamily: SANS }}>
                    {[p.duration, p.description].filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: TEAL, fontFamily: SANS, lineHeight: 1 }}>
                  {p.currency} {p.price.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
        {activeSocials.length > 0 && (
          <div>
            <div style={{ height: 1, background: TEAL_DIM, marginBottom: 12 }} />
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 7 }}>
              {activeSocials.map((s) => (
                <div key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, border: '1px solid rgba(0,84,64,0.25)', borderRadius: 20, padding: '3px 9px 3px 7px', background: 'rgba(0,84,64,0.03)' }}>
                  <SocialIcon type={s} size={12} color={TEAL} />
                  <span style={{ fontSize: 8, fontFamily: MONO, color: TEAL }}>
                    {((rcData.social_handles[s] || s)).replace(/^@?/, '@')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Contact */}
        {(rcData.contact_name || rcData.contact_email || rcData.contact_phone) && (
          <div style={{ marginTop: 10 }}>
            <div style={{ height: 1, background: TEAL_DIM, marginBottom: 8 }} />
            {[
              ['Name', rcData.contact_name],
              ['Email', rcData.contact_email],
              ['Phone', rcData.contact_phone],
            ].filter(([, v]) => v).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: 14, padding: '3px 0' }}>
                <span style={{ fontSize: 7.5, fontFamily: MONO, color: MUTED, letterSpacing: '0.14em', textTransform: 'uppercase' as const, minWidth: 36 }}>{k}</span>
                <span style={{ fontSize: 9, color: TEXT }}>{v}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 12, opacity: 0.3 }}>
          <FlameIcon size={9} color={TEAL} />
          <span style={{ fontSize: 7.5, fontFamily: MONO, color: TEAL, letterSpacing: '0.18em', textTransform: 'uppercase' as const }}>circle</span>
        </div>
      </div>
    </div>
  );
}

// ─── Scaled preview wrapper ───────────────────────────────────────────────────

function ScaledPreview({ docW, docH, children }: { docW: number; docH: number; children: React.ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.72);

  useEffect(() => {
    if (!outerRef.current) return;
    const update = () => {
      if (!outerRef.current) return;
      const aw = outerRef.current.offsetWidth - 16;
      setScale(Math.min(0.9, aw / docW));
    };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(outerRef.current);
    return () => obs.disconnect();
  }, [docW]);

  return (
    <div ref={outerRef} style={{ width: '100%' }}>
      <div style={{ position: 'relative', paddingBottom: 24 }}>
        <div style={{
          transform: `scale(${scale})`, transformOrigin: 'top left',
          width: docW,
          boxShadow: '0 8px 40px rgba(0,84,64,0.15)', borderRadius: 3,
          display: 'inline-block',
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Form atoms ───────────────────────────────────────────────────────────────

const iCls = 'w-full px-3 py-2 bg-surface border border-outline-variant/40 rounded-lg text-sm text-on-surface focus:border-primary focus:outline-none transition-all placeholder:text-on-surface-variant/40';
const lCls = 'block text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.14em] mb-1';

function SocialsForm({ active, handles, onActive, onHandle }: {
  active: Record<string, boolean>;
  handles: Record<string, string>;
  onActive: (v: Record<string, boolean>) => void;
  onHandle: (v: Record<string, string>) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className={lCls}>Socials</span>
      {SOCIAL_PLATFORMS.map((s) => (
        <div key={s} className={`flex items-center gap-2 rounded-lg border transition-colors ${active[s] ? 'border-primary/30 bg-primary/5' : 'border-outline-variant/20'}`}>
          <label className="flex items-center gap-2 pl-3 py-2 cursor-pointer shrink-0">
            <input type="checkbox" checked={!!active[s]} onChange={(e) => onActive({ ...active, [s]: e.target.checked })}
              className="rounded border-outline-variant text-primary focus:ring-primary" />
            <span className="text-[10px] font-mono text-on-surface capitalize w-16">{s}</span>
          </label>
          <div className="flex-1 relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-on-surface-variant/40">@</span>
            <input disabled={!active[s]} placeholder={active[s] ? `yourhandle` : '-'}
              value={handles[s] || ''} onChange={(e) => onHandle({ ...handles, [s]: e.target.value })}
              className="w-full pl-5 pr-3 py-2 bg-transparent border-0 text-[11px] font-mono focus:outline-none disabled:text-on-surface-variant/30 text-on-surface" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── EPK Form ─────────────────────────────────────────────────────────────────

function EPKForm({ data, onChange, artistName, artistTagline, artistBio, artistPhoto, packages, selectedWorks }: {
  data: EPKFillable;
  onChange: (d: EPKFillable) => void;
  artistName: string;
  artistTagline: string | null;
  artistBio: string | null;
  artistPhoto: string | null;
  packages: ExportPackage[];
  selectedWorks: ExportWork[];
}) {
  function set<K extends keyof EPKFillable>(k: K, v: EPKFillable[K]) { onChange({ ...data, [k]: v }); }

  function updExp(i: number, k: keyof ExperienceEntry, v: string) {
    const next = [...data.experience];
    next[i] = { ...next[i], [k]: v };
    set('experience', next);
  }

  return (
    <div className="flex flex-col gap-5 pb-8">



      {/* Bio: editable */}
      <div>
        <span className={lCls}>Bio <span className="normal-case font-normal text-on-surface-variant/50">- editable</span></span>
        <textarea
          value={data.bio}
          onChange={(e) => set('bio', e.target.value)}
          rows={8}
          className={iCls + ' resize-y text-xs mt-1'}
          placeholder="Write or refine your artist bio for this press kit…"
        />
        <p className="text-[10px] text-on-surface-variant/50 mt-1">
          Changes here only affect the export, not your profile.
        </p>
      </div>

      {/* Experience */}
      <div>
        <span className={lCls}>Experience & Credits</span>
        <div className="flex flex-col gap-2 mt-1.5">
          {data.experience.map((e, i) => (
            <div key={i} className="relative group bg-surface-container/50 rounded-lg p-3 border border-outline-variant/30">
              <div className="grid grid-cols-[72px_1fr] gap-2">
                <input placeholder="Year" value={e.year} onChange={(ev) => updExp(i, 'year', ev.target.value)} className={iCls + ' text-xs text-center'} />
                <input placeholder="Role / Project" value={e.role} onChange={(ev) => updExp(i, 'role', ev.target.value)} className={iCls + ' text-xs'} />
                <input placeholder="Venue / Client" value={e.org} onChange={(ev) => updExp(i, 'org', ev.target.value)} className={iCls + ' col-span-2 text-xs'} />
              </div>
              {data.experience.length > 1 && (
                <button onClick={() => set('experience', data.experience.filter((_, j) => j !== i))}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-error transition-all text-xs">✕</button>
              )}
            </div>
          ))}
        </div>
        <button onClick={() => set('experience', [...data.experience, { year: '', role: '', org: '', description: '' }])}
          className="mt-2 text-xs text-primary font-semibold hover:opacity-75 transition-opacity">+ Add credit</button>
      </div>

      {/* Selected Work: checkboxes from profile */}
      {packages.length >= 0 && (
        <div>
          <span className={lCls}>Selected Work <span className="normal-case font-normal text-on-surface-variant/50">- uncheck to exclude</span></span>
          {packages.length === 0 && selectedWorks.length === 0 && (
            <p className="text-[10px] text-on-surface-variant mt-1">No works on your profile yet.</p>
          )}
          <div className="flex flex-col gap-2 mt-1.5">
            {selectedWorks.map((w) => {
              const excluded = data.excluded_work_ids.includes(w.id);
              const ytId = getYouTubeId(w.media_url || '');
              const thumb = ytId
                ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`
                : w.thumbnail_url ?? null;
              return (
                <label key={w.id} className={`flex items-center gap-3 rounded-lg border p-2.5 cursor-pointer transition-colors ${excluded ? 'opacity-40 border-outline-variant/20' : 'border-outline-variant/30 bg-surface-container/30'}`}>
                  <input type="checkbox" checked={!excluded}
                    onChange={(e) => {
                      const ids = e.target.checked
                        ? data.excluded_work_ids.filter((id) => id !== w.id)
                        : [...data.excluded_work_ids, w.id];
                      set('excluded_work_ids', ids);
                    }}
                    className="rounded border-outline-variant text-primary focus:ring-primary shrink-0" />
                  {thumb && (
                    <img src={thumb} alt={w.title} className="w-14 h-9 object-cover rounded shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-on-surface truncate">{w.title}</p>
                    <p className="text-[10px] text-on-surface-variant font-mono">{w.provider}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Technical requirements */}
      <div>
        <span className={lCls}>Technical Requirements</span>
        <p className="text-[10px] text-on-surface-variant mb-1.5">e.g. microphone types, sound systems, stage lighting</p>
        <textarea value={data.technical_requirements} onChange={(e) => set('technical_requirements', e.target.value)}
          rows={4} className={iCls + ' resize-none text-xs'} />
      </div>

      {/* Packages: toggle which to include */}
      {packages.length > 0 && (
        <div>
          <span className={lCls}>Packages <span className="normal-case font-normal text-on-surface-variant/50">- uncheck to exclude</span></span>
          <div className="flex flex-col gap-2 mt-1.5">
            {packages.map((p) => {
              const excluded = data.excluded_package_ids.includes(p.id);
              return (
                <label key={p.id} className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${excluded ? 'opacity-40 border-outline-variant/20' : 'border-outline-variant/30 bg-surface-container/30'}`}>
                  <input type="checkbox" checked={!excluded}
                    onChange={(e) => {
                      const ids = e.target.checked
                        ? data.excluded_package_ids.filter((id) => id !== p.id)
                        : [...data.excluded_package_ids, p.id];
                      set('excluded_package_ids', ids);
                    }}
                    className="mt-0.5 rounded border-outline-variant text-primary focus:ring-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 justify-between">
                      <span className="text-sm font-semibold text-on-surface">{p.name}</span>
                      <span className="text-xs font-mono font-bold text-primary shrink-0">{p.currency} {p.price.toLocaleString()}</span>
                    </div>
                    {p.duration && <span className="text-[10px] font-mono text-on-surface-variant">{p.duration}</span>}
                    {p.description && <p className="text-[11px] text-on-surface-variant mt-0.5 line-clamp-2">{p.description}</p>}
                    {p.logistics_inclusive !== undefined && (
                      <span className={`text-[10px] font-mono mt-0.5 block ${p.logistics_inclusive ? 'text-primary' : 'text-on-surface-variant'}`}>
                        {p.logistics_inclusive ? '✓ Transport included' : '✗ Transport not included'}
                      </span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Socials */}
      <SocialsForm active={data.active_socials} handles={data.social_handles}
        onActive={(v) => set('active_socials', v)} onHandle={(v) => set('social_handles', v)} />

      {/* Contact */}
      <div className="flex flex-col gap-2">
        <span className={lCls}>Contact Info</span>
        {[
          { k: 'contact_name' as const, ph: 'Full name' },
          { k: 'contact_email' as const, ph: 'Email' },
          { k: 'contact_phone' as const, ph: 'Phone' },
        ].map(({ k, ph }) => (
          <input key={k} placeholder={ph} value={data[k]} onChange={(e) => set(k, e.target.value)} className={iCls + ' text-xs'} />
        ))}
      </div>
    </div>
  );
}

// ─── Rate Card Form ───────────────────────────────────────────────────────────

function RateCardForm({ data, onChange, artistName, artistTagline, artistPhoto, packages }: {
  data: RateCardFillable;
  onChange: (d: RateCardFillable) => void;
  artistName: string;
  artistTagline: string | null;
  artistPhoto: string | null;
  packages: ExportPackage[];
}) {
  function set<K extends keyof RateCardFillable>(k: K, v: RateCardFillable[K]) { onChange({ ...data, [k]: v }); }

  function addTemplate(label: string) {
    if (data.stats.some((s) => s.label.toLowerCase() === label.toLowerCase())) return;
    set('stats', [...data.stats, { value: '', label }]);
  }

  return (
    <div className="flex flex-col gap-5 pb-8">

      {/* Stats */}
      <div>
        <span className={lCls}>Stats</span>
        <p className="text-[10px] text-on-surface-variant font-mono mb-2">Fill in the blanks: <em>_ shows performed, _ books written…</em></p>
        <div className="flex flex-wrap gap-2 mb-3">
          {STAT_TEMPLATES.map((t) => {
            const added = data.stats.some((s) => s.label.toLowerCase() === t.toLowerCase());
            return (
              <button key={t} type="button" onClick={() => !added && addTemplate(t)}
                className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${added ? 'bg-primary/10 border-primary/30 text-primary cursor-default' : 'border-outline-variant/40 text-on-surface-variant hover:bg-surface-container'}`}>
                {added ? '✓ ' : '+ '}{t}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-2">
          {data.stats.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={s.value} placeholder="150+"
                onChange={(e) => { const ns = [...data.stats]; ns[i] = { ...s, value: e.target.value }; set('stats', ns); }}
                className={iCls + ' w-20 text-center font-bold text-xs'} />
              <input value={s.label} placeholder="Shows performed"
                onChange={(e) => { const ns = [...data.stats]; ns[i] = { ...s, label: e.target.value }; set('stats', ns); }}
                className={iCls + ' flex-1 text-xs'} />
              <button onClick={() => set('stats', data.stats.filter((_, j) => j !== i))} className="text-error text-sm shrink-0 hover:opacity-70">✕</button>
            </div>
          ))}
          <button onClick={() => set('stats', [...data.stats, { value: '', label: '' }])} className="text-xs text-primary font-semibold hover:opacity-75 self-start">+ Custom stat</button>
        </div>
      </div>

      {/* Packages: toggle which to include */}
      {packages.length > 0 && (
        <div>
          <span className={lCls}>Packages <span className="normal-case font-normal text-on-surface-variant/50">- uncheck to exclude</span></span>
          <div className="flex flex-col gap-2 mt-1.5">
            {packages.map((p) => {
              const excluded = (data.excluded_package_ids ?? []).includes(p.id);
              return (
                <label key={p.id} className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${excluded ? 'opacity-40 border-outline-variant/20' : 'border-outline-variant/30 bg-surface-container/30'}`}>
                  <input type="checkbox" checked={!excluded}
                    onChange={(e) => {
                      const ids = e.target.checked
                        ? (data.excluded_package_ids ?? []).filter((id) => id !== p.id)
                        : [...(data.excluded_package_ids ?? []), p.id];
                      set('excluded_package_ids', ids);
                    }}
                    className="mt-0.5 rounded border-outline-variant text-primary focus:ring-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 justify-between">
                      <span className="text-sm font-semibold text-on-surface">{p.name}</span>
                      <span className="text-xs font-mono font-bold text-primary shrink-0">{p.currency} {p.price.toLocaleString()}</span>
                    </div>
                    {p.duration && <span className="text-[10px] font-mono text-on-surface-variant">{p.duration}</span>}
                    {p.description && <p className="text-[11px] text-on-surface-variant mt-0.5 line-clamp-2">{p.description}</p>}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Socials */}
      <SocialsForm active={data.active_socials} handles={data.social_handles}
        onActive={(v) => set('active_socials', v)} onHandle={(v) => set('social_handles', v)} />

      {/* Contact */}
      <div className="flex flex-col gap-2">
        <span className={lCls}>Contact Info</span>
        {[
          { k: 'contact_name' as const, ph: 'Full name' },
          { k: 'contact_email' as const, ph: 'Email' },
          { k: 'contact_phone' as const, ph: 'Phone' },
        ].map(({ k, ph }) => (
          <input key={k} placeholder={ph} value={data[k]} onChange={(e) => set(k, e.target.value)} className={iCls + ' text-xs'} />
        ))}
      </div>
    </div>
  );
}

// ─── Main ExportModal ─────────────────────────────────────────────────────────

export type ExportPackage = {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration?: string | null;
  description?: string | null;
  logistics_inclusive?: boolean;
};

export type ExportWork = {
  id: string;
  title: string;
  media_url: string;
  thumbnail_url?: string | null;
  provider: string;
};

interface Props {
  mode: ExportModalMode;
  slug: string;
  artistName: string;
  hasPhoto: boolean;
  hasBio: boolean;
  hasTagline: boolean;
  artistPhoto: string | null;
  artistTagline: string | null;
  artistBio: string | null;
  artistCity: string | null;
  artistCountry: string | null;
  artForms: string[];
  artistTags: string[] | null;
  socialLinks: Record<string, string>;
  selectedWorks: ExportWork[];
  packages: ExportPackage[];
  savedEPK: EPKFillable | null;
  savedRC: RateCardFillable | null;
  onClose: () => void;
}

export function ExportModal({
  mode, slug, artistName, artistPhoto, artistTagline, artistBio,
  artistCity, artistCountry, artForms, artistTags,
  socialLinks, selectedWorks, packages, savedEPK, savedRC, onClose,
}: Props) {
  const [tab, setTab] = useState<'epk' | 'rate-card'>(mode);

  const [epkData, setEpkData] = useState<EPKFillable>(() => {
    const base: EPKFillable = { ...DEFAULT_EPK, ...(savedEPK ?? {}) };

    // Auto-populate socials from profile if never saved before
    const hasAnySocial = Object.values(base.active_socials).some(Boolean);
    if (!hasAnySocial) {
      const active: Record<string, boolean> = { ...DEFAULT_EPK.active_socials };
      const handles: Record<string, string> = {};
      for (const [platform, url] of Object.entries(socialLinks)) {
        if (url?.trim()) {
          active[platform] = true;
          handles[platform] = extractHandleFromUrl(url, platform);
        }
      }
      base.active_socials = active;
      base.social_handles = handles;
    }

    // Auto-populate bio from profile if not yet set
    if (!base.bio && artistBio) base.bio = artistBio;

    // Works are now drawn from selectedWorks prop filtered by excluded_work_ids
    // No init needed: the profile works show as checkboxes by default (all included)

    return base;
  });

  const [rcData, setRcData] = useState<RateCardFillable>(() => {
    const base: RateCardFillable = { ...DEFAULT_RATE_CARD, ...(savedRC ?? {}) };

    // Auto-populate socials from profile if never saved
    const hasAnySocial = Object.values(base.active_socials).some(Boolean);
    if (!hasAnySocial) {
      const active: Record<string, boolean> = { ...DEFAULT_RATE_CARD.active_socials };
      const handles: Record<string, string> = {};
      for (const [platform, url] of Object.entries(socialLinks)) {
        if (url?.trim()) {
          active[platform] = true;
          handles[platform] = extractHandleFromUrl(url, platform);
        }
      }
      base.active_socials = active;
      base.social_handles = handles;
    }

    return base;
  });

  const [status, setStatus] = useState<'idle' | 'saving' | 'generating' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [format, setFormat] = useState<'pdf' | 'image'>('pdf');
  const [genStep, setGenStep] = useState(0);

  const busy = status === 'saving' || status === 'generating';

  const EPK_STEPS  = ['Saving preferences…', 'Fetching your photos…', 'Laying out your EPK…', 'Rendering PDF…'];
  const RC_STEPS   = ['Saving preferences…', 'Building your rate card…', 'Rendering…'];
  const genSteps   = tab === 'epk' ? EPK_STEPS : RC_STEPS;

  useEffect(() => {
    if (status !== 'generating') { setGenStep(0); return; }
    const interval = setInterval(() => setGenStep((s) => Math.min(s + 1, genSteps.length - 1)), 2200);
    return () => clearInterval(interval);
  }, [status, genSteps.length]);
  const location = [artistCity, artistCountry].filter(Boolean).join(', ');

  async function handleGenerate() {
    setStatus('saving');
    setErrorMsg('');
    try {
      await fetch('/api/artists/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tab === 'epk' ? { epk_data: epkData } : { rate_card_data: rcData }),
      });
    } catch { /* non-fatal */ }

    setStatus('generating');
    try {
      const url = tab === 'epk' ? `/api/artists/${slug}/export/epk` : `/api/artists/${slug}/export/rate-card`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tab === 'epk' ? { epkData } : { rcData, format }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? 'Generation failed');
      }
      const blob = await res.blob();
      const ext = tab === 'rate-card' && format === 'image' ? 'png' : 'pdf';
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `${artistName.replace(/\s+/g, '-').toLowerCase()}-${tab}.${ext}`;
      a.click();
      URL.revokeObjectURL(objectUrl);
      setStatus('done');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Generation failed');
      setStatus('error');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-on-surface/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-surface w-full max-w-[1120px] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col" style={{ height: '92vh', maxHeight: 900 }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30 shrink-0">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                <svg className="w-4 h-4 text-on-primary" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C12 7 9 9 9 13a3 3 0 006 0c0-4-3-6-3-11z" opacity="0.8" />
                  <circle cx="12" cy="19" r="2" opacity="0.8" />
                </svg>
              </div>
              <span className="font-bold text-primary text-base">Exports</span>
            </div>
            {/* Tab toggle */}
            <div className="flex gap-1 bg-surface-container rounded-full p-1">
              {[{ k: 'epk' as const, label: 'Press Kit (EPK)' }, { k: 'rate-card' as const, label: 'Rate Card' }].map((t) => (
                <button key={t.k} onClick={() => setTab(t.k)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${tab === t.k ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Format toggle (rate card only) */}
            {tab === 'rate-card' && (
              <div className="flex gap-1 bg-surface-container rounded-full p-1">
                {(['pdf', 'image'] as const).map((f) => (
                  <button key={f} onClick={() => setFormat(f)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${format === f ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant'}`}>
                    {f === 'pdf' ? 'PDF' : 'Image'}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={handleGenerate} disabled={busy}
              className="flex items-center gap-2 bg-secondary-container text-on-secondary-container font-semibold text-sm px-4 py-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {busy && <svg className="w-3.5 h-3.5 animate-spin shrink-0" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
              {status === 'saving' ? 'Saving…' : status === 'generating' ? genSteps[genStep] : status === 'done' ? '✓ Downloaded' : `Download ${tab === 'epk' ? 'EPK' : format === 'image' ? 'Image' : 'PDF'}`}
            </button>
            <button onClick={onClose} className="text-on-surface-variant hover:text-primary transition-colors p-1 text-xl">✕</button>
          </div>
        </div>

        {errorMsg && (
          <div className="px-6 py-2 bg-error/5 border-b border-error/20 text-error text-sm">{errorMsg}</div>
        )}

        {/* Body: form left, preview right */}
        <div className="flex flex-1 min-h-0">
          {/* Form */}
          <div className="w-[360px] shrink-0 border-r border-outline-variant/30 overflow-y-auto px-5 py-5">
            {/* Auto-fetched summary chips */}
            <div className="mb-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-on-surface-variant/50 mb-2">Auto-filled from your profile</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Photo', ok: !!artistPhoto },
                  { label: 'Name', ok: true },
                  { label: 'Tagline', ok: !!artistTagline },
                  { label: 'Bio', ok: !!artistBio },
                  { label: `${packages.length} package${packages.length !== 1 ? 's' : ''}`, ok: packages.length > 0 },
                  { label: `${selectedWorks.length} work${selectedWorks.length !== 1 ? 's' : ''}`, ok: selectedWorks.length > 0 },
                ].map(({ label, ok }) => (
                  <span key={label} className={`inline-flex items-center gap-1 text-[10px] font-medium px-2.5 py-0.5 rounded-full ${ok ? 'bg-primary/8 text-primary' : 'bg-surface-container text-on-surface-variant/40 line-through'}`}>
                    {ok ? '✓' : '○'} {label}
                  </span>
                ))}
              </div>
            </div>

            {tab === 'epk'
              ? <EPKForm data={epkData} onChange={setEpkData} artistName={artistName} artistTagline={artistTagline} artistBio={artistBio} artistPhoto={artistPhoto} packages={packages} selectedWorks={selectedWorks} />
              : <RateCardForm data={rcData} onChange={setRcData} artistName={artistName} artistTagline={artistTagline} artistPhoto={artistPhoto} packages={packages} />
            }
          </div>

          {/* Preview */}
          <div className="flex-1 bg-surface-container/30 overflow-y-auto p-6">
            <p className={lCls + ' mb-3'}>Live preview</p>
            {tab === 'epk' ? (
              <>
                <p className="text-[10px] text-on-surface-variant/50 font-mono mb-3 uppercase tracking-wide">A4 · Single page</p>
                <ScaledPreview docW={595} docH={842}>
                  <EPKPreview
                    epkData={epkData}
                    artistName={artistName}
                    artistPhoto={artistPhoto}
                    artistTagline={artistTagline}
                    artistBio={artistBio}
                    artForms={artForms}
                    artistTags={artistTags}
                    artistCity={artistCity}
                    artistCountry={artistCountry}
                    packages={packages}
                    selectedWorks={selectedWorks}
                  />
                </ScaledPreview>
              </>
            ) : (
              <>
                <p className="text-[10px] text-on-surface-variant/50 font-mono mb-3 uppercase tracking-wide">A5 portrait · {format === 'image' ? '1080×1080 PNG' : 'PDF'}</p>
                <ScaledPreview docW={420} docH={595}>
                  <RateCardPreview
                    rcData={rcData}
                    artistName={artistName}
                    artistPhoto={artistPhoto}
                    artistTagline={artistTagline}
                    artistLocation={location}
                    packages={packages}
                  />
                </ScaledPreview>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
