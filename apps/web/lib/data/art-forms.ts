// Canonical Art_Form_Registry — the single source of truth for art forms.
// Replaces the six duplicated definitions across the app and drives template routing.
// Feature: package-inspiration-templates

export type CategoryGroup = 'Music' | 'Visual' | 'Performance' | 'Digital' | 'Other';

export type TemplateGroup =
  | 'musician'
  | 'poet'
  | 'visual'
  | 'dancer'
  | 'videographer'
  | 'actor'
  | 'author'
  | 'story-teller'
  | 'generic';

export interface ArtFormEntry {
  value: string; // canonical stored value (Canonical_Slug for existing forms)
  label: string; // human-readable label
  group: CategoryGroup; // category for grouped selection
  templateGroup: TemplateGroup;
  showInFilters: boolean; // curated filter subset
  aliases?: string[]; // normalized alternates for matching (folds discover alias hack)
}

export const GENERIC_TEMPLATE_GROUP: TemplateGroup = 'generic';

// Order of category groups for grouped selection UI.
export const CATEGORY_ORDER: CategoryGroup[] = ['Music', 'Visual', 'Performance', 'Digital', 'Other'];

// The full registry. Canonical slugs preserved exactly; new forms added per Req 14.
// Aliases preserve legacy discover-filter groupings (e.g. cinematographer under the
// Videographer chip) that previously lived in DiscoverClient's ART_FORM_MAP.
export const ART_FORM_REGISTRY: ArtFormEntry[] = [
  // ── Music ──────────────────────────────────────────────────────────────────
  { value: 'musician', label: 'Musician', group: 'Music', templateGroup: 'musician', showInFilters: true },
  { value: 'singer', label: 'Singer/Vocalist', group: 'Music', templateGroup: 'musician', showInFilters: false, aliases: ['vocalist'] },
  { value: 'instrumentalist', label: 'Instrumentalist', group: 'Music', templateGroup: 'musician', showInFilters: false },
  { value: 'dj-producer', label: 'DJ/Producer', group: 'Music', templateGroup: 'musician', showInFilters: false, aliases: ['dj', 'producer'] },
  { value: 'band', label: 'Band', group: 'Music', templateGroup: 'musician', showInFilters: false },
  { value: 'choir', label: 'Choir/Group', group: 'Music', templateGroup: 'musician', showInFilters: false },

  // ── Visual ───────────────────────────────────────────────────────────────
  { value: 'visual', label: 'Visual Artist', group: 'Visual', templateGroup: 'visual', showInFilters: true, aliases: ['visual artist', 'visual_artist'] },
  { value: 'painter', label: 'Painter', group: 'Visual', templateGroup: 'visual', showInFilters: false },
  { value: 'illustrator', label: 'Illustrator', group: 'Visual', templateGroup: 'visual', showInFilters: false },
  { value: 'sculptor', label: 'Sculptor', group: 'Visual', templateGroup: 'visual', showInFilters: false },
  { value: 'photographer', label: 'Photographer', group: 'Visual', templateGroup: 'visual', showInFilters: false },
  { value: 'graphic-designer', label: 'Graphic Designer', group: 'Visual', templateGroup: 'visual', showInFilters: false, aliases: ['graphic design', 'designer'] },
  { value: 'tattoo-artist', label: 'Tattoo Artist', group: 'Visual', templateGroup: 'visual', showInFilters: false, aliases: ['tattoo'] },
  { value: 'fashion-designer', label: 'Fashion Designer', group: 'Visual', templateGroup: 'generic', showInFilters: false, aliases: ['fashion'] },
  { value: 'makeup-artist', label: 'Makeup Artist', group: 'Visual', templateGroup: 'generic', showInFilters: false, aliases: ['makeup', 'mua'] },

  // ── Performance ──────────────────────────────────────────────────────────────
  { value: 'poet', label: 'Poet', group: 'Performance', templateGroup: 'poet', showInFilters: true },
  { value: 'spoken-word', label: 'Spoken Word Artist', group: 'Performance', templateGroup: 'poet', showInFilters: true, aliases: ['spoken word', 'spoken_word', 'spoken word artist'] },
  { value: 'dancer', label: 'Dancer', group: 'Performance', templateGroup: 'dancer', showInFilters: true },
  { value: 'cultural-troupe', label: 'Cultural Troupe', group: 'Performance', templateGroup: 'dancer', showInFilters: false, aliases: ['troupe'] },
  { value: 'theater', label: 'Actor', group: 'Performance', templateGroup: 'actor', showInFilters: true, aliases: ['actor', 'theatre'] },
  { value: 'comedian', label: 'Comedian', group: 'Performance', templateGroup: 'generic', showInFilters: false, aliases: ['comedy'] },
  { value: 'mc-host', label: 'MC/Host', group: 'Performance', templateGroup: 'generic', showInFilters: false, aliases: ['mc', 'host', 'emcee'] },
  { value: 'story-teller', label: 'Story Teller', group: 'Performance', templateGroup: 'story-teller', showInFilters: false, aliases: ['storyteller'] },

  // ── Digital ────────────────────────────────────────────────────────────────
  { value: 'digital', label: 'Videographer', group: 'Digital', templateGroup: 'videographer', showInFilters: true, aliases: ['videographer', 'cinematographer', 'video'] },
  { value: 'cinematographer', label: 'Cinematographer', group: 'Digital', templateGroup: 'videographer', showInFilters: false },
  { value: 'content-creator', label: 'Content Creator/Influencer', group: 'Digital', templateGroup: 'generic', showInFilters: false, aliases: ['content creator', 'influencer'] },

  // ── Other ────────────────────────────────────────────────────────────────────
  { value: 'author', label: 'Author', group: 'Other', templateGroup: 'author', showInFilters: false, aliases: ['writer'] },
  { value: 'craftsperson', label: 'Craftsperson/Artisan', group: 'Other', templateGroup: 'generic', showInFilters: false, aliases: ['artisan', 'craft'] },
  { value: 'model', label: 'Model', group: 'Other', templateGroup: 'generic', showInFilters: false },
  { value: 'other', label: 'Other', group: 'Other', templateGroup: 'generic', showInFilters: false },
];

// Value → label map (Req 13.4).
export const ART_FORM_LABELS: Record<string, string> = Object.fromEntries(
  ART_FORM_REGISTRY.map((e) => [e.value, e.label]),
);

// Normalize a raw string for matching: lowercase, collapse -/_/spaces to single space, trim.
function normalize(s: string): string {
  return s.toLowerCase().replace(/[-_\s]+/g, ' ').trim();
}

// Resolve a raw value/label/alias to a registry entry.
// Priority: exact value match > exact label match > alias match. This ensures a value
// that is also listed as another entry's alias (e.g. "cinematographer") resolves to its
// own entry first.
function findEntry(raw: string | null | undefined): ArtFormEntry | undefined {
  if (!raw) return undefined;
  const n = normalize(raw);
  if (!n) return undefined;

  const byValue = ART_FORM_REGISTRY.find((e) => normalize(e.value) === n);
  if (byValue) return byValue;

  const byLabel = ART_FORM_REGISTRY.find((e) => normalize(e.label) === n);
  if (byLabel) return byLabel;

  const byAlias = ART_FORM_REGISTRY.find((e) => (e.aliases ?? []).some((a) => normalize(a) === n));
  if (byAlias) return byAlias;

  return undefined;
}

// Returns the human-readable label for a value, or the input unchanged if unknown (Req 13.5).
export function getLabel(value: string): string {
  return ART_FORM_LABELS[value] ?? value;
}

// Template routing (Template_Router, Req 3, 15.4). Falls back to the generic group for
// empty / null / undefined / free-text "Other" / any unknown value.
export function getTemplateGroup(value: string | null | undefined): TemplateGroup {
  const entry = findEntry(value);
  return entry ? entry.templateGroup : GENERIC_TEMPLATE_GROUP;
}

// True when a stored art-form value refers to the same art form as `target`
// (which may itself be a value, label, or alias). Replaces DiscoverClient's ART_FORM_MAP
// (Req 16.5). Also returns true when either side matches the other's value/label/alias set.
export function artFormMatches(storedValue: string, target: string): boolean {
  const nStored = normalize(storedValue);
  const nTarget = normalize(target);
  if (!nStored || !nTarget) return false;
  if (nStored === nTarget) return true;

  const targetEntry = findEntry(target);
  if (targetEntry) {
    const forms = [targetEntry.value, targetEntry.label, ...(targetEntry.aliases ?? [])].map(normalize);
    if (forms.includes(nStored)) return true;
  }

  const storedEntry = findEntry(storedValue);
  if (storedEntry) {
    const forms = [storedEntry.value, storedEntry.label, ...(storedEntry.aliases ?? [])].map(normalize);
    if (forms.includes(nTarget)) return true;
  }

  // If neither resolves to a known entry, fall back to a normalized includes comparison.
  if (!targetEntry && !storedEntry) {
    return nStored.includes(nTarget) || nTarget.includes(nStored);
  }

  return false;
}

// Curated subset shown in filter UIs (Req 16.6). Callers prepend their own 'All' chip.
export function getFilterOptions(): ArtFormEntry[] {
  return ART_FORM_REGISTRY.filter((e) => e.showInFilters);
}

// Registry entries grouped by category, in CATEGORY_ORDER (Req 15.1).
export function getGroupedOptions(): { group: CategoryGroup; entries: ArtFormEntry[] }[] {
  return CATEGORY_ORDER.map((group) => ({
    group,
    entries: ART_FORM_REGISTRY.filter((e) => e.group === group),
  })).filter((g) => g.entries.length > 0);
}
