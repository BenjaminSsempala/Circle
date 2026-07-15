// Template_Library — hardcoded, cloneable package structures grouped by discipline.
// Bracketed [placeholders] for the artist to replace; price always empty; contract
// defaults follow the product-type rule. Static data, no DB access.
// Feature: package-inspiration-templates

import type { TemplateGroup } from './art-forms';
import { getTemplateGroup } from './art-forms';

export interface PackageTemplate {
  id: string; // stable slug id, e.g. 'musician-live-set'
  name: string;
  description: string; // bracketed [placeholders] (Req 1.7)
  duration: string; // duration hint
  productType: 'service' | 'digital' | 'merchandise'; // Req 1.8
  contractRequired: boolean; // defaulted by product type (Req 2.1–2.3)
  autoAccept: boolean;
  price: ''; // always empty (Req 1.6)
  templateGroup: TemplateGroup;
}

// Contract default by product type (Req 2.1–2.3): service → true, digital/merchandise → false.
function contractDefault(productType: PackageTemplate['productType']): boolean {
  return productType === 'service';
}

// Helper to construct a template while enforcing the invariants (empty price, contract default).
function t(
  input: Omit<PackageTemplate, 'price' | 'contractRequired'> & { contractRequired?: boolean },
): PackageTemplate {
  return {
    ...input,
    price: '',
    contractRequired: input.contractRequired ?? contractDefault(input.productType),
    autoAccept: input.autoAccept ?? false,
  };
}

export const TEMPLATE_LIBRARY: PackageTemplate[] = [
  // ── musician ─────────────────────────────────────────────────────────────
  t({
    id: 'musician-live-set',
    name: 'Solo Live Set',
    description:
      'A [X]-minute live performance including [equipment/setlist details]. Travel within [area] included. Best for [weddings, corporate events, private parties].',
    duration: '1 hour',
    productType: 'service',
    autoAccept: false,
    templateGroup: 'musician',
  }),
  t({
    id: 'musician-studio-session',
    name: 'Studio / Collaboration Session',
    description:
      'A recording or collaboration session covering [X] hours of studio time and [X] takes, with a mixed reference track delivered. Best for [fellow artists, producers].',
    duration: '2 hours',
    productType: 'service',
    autoAccept: false,
    templateGroup: 'musician',
  }),
  t({
    id: 'musician-custom-song',
    name: 'Custom Song / Shoutout',
    description:
      'A personalized [song type] recording delivered as [format] within [X] days. Best for [gifts, brands, special occasions].',
    duration: 'Per Piece',
    productType: 'digital',
    autoAccept: false,
    templateGroup: 'musician',
  }),

  // ── poet / spoken-word ─────────────────────────────────────────────────────
  t({
    id: 'poet-performance',
    name: 'Spoken Word Feature',
    description:
      'A [X]-minute spoken-word set of [number] original pieces themed around [theme]. Includes a pre-event theme consultation. Best for [launches, weddings, gatherings].',
    duration: '30 min',
    productType: 'service',
    autoAccept: false,
    templateGroup: 'poet',
  }),
  t({
    id: 'poet-commission',
    name: 'Commissioned Poem',
    description:
      'A bespoke poem written for your occasion. Includes a brief interview, [X] revisions, and a beautifully formatted digital copy delivered in [X] days. Best for [anniversaries, tributes, gifts].',
    duration: 'Per Piece',
    productType: 'digital',
    autoAccept: false,
    templateGroup: 'poet',
  }),
  t({
    id: 'poet-workshop',
    name: 'Writing Workshop',
    description:
      'An interactive writing/performance workshop for [group size] participants. Includes prompts, guided exercises, and feedback. Best for [schools, community groups].',
    duration: '2 hours',
    productType: 'service',
    autoAccept: false,
    templateGroup: 'poet',
  }),

  // ── visual ─────────────────────────────────────────────────────────────────
  t({
    id: 'visual-commission',
    name: 'Custom Commission',
    description:
      'An original [medium] piece sized [dimensions], delivered in [X] weeks with [number] revisions. Best for [gifts, collectors, brand campaigns].',
    duration: 'Negotiable',
    productType: 'service',
    autoAccept: false,
    templateGroup: 'visual',
  }),
  t({
    id: 'visual-live',
    name: 'Live Art',
    description:
      'Live art created in real time at your event over [X] hours. Includes materials, setup, and the finished piece to take home. Best for [weddings, launches, festivals].',
    duration: '3 hours',
    productType: 'service',
    autoAccept: false,
    templateGroup: 'visual',
  }),
  t({
    id: 'visual-print',
    name: 'Art Print',
    description: 'A [size] print of [artwork], [framed/unframed]. [Pickup/shipping details]. Contact to arrange.',
    duration: 'Per Piece',
    productType: 'merchandise',
    autoAccept: false,
    templateGroup: 'visual',
  }),

  // ── dancer ─────────────────────────────────────────────────────────────────
  t({
    id: 'dancer-performance',
    name: 'Event Performance',
    description:
      'A choreographed performance for your event featuring [X] dancers. Includes costume and music coordination. Best for [ceremonies, launches, festivals].',
    duration: '30 min',
    productType: 'service',
    autoAccept: false,
    templateGroup: 'dancer',
  }),
  t({
    id: 'dancer-workshop',
    name: 'Choreography / Class',
    description:
      'Custom choreography or a group class for [group size]. Includes routine design and [X] rehearsal sessions. Best for [events, teams, schools].',
    duration: '2 hours',
    productType: 'service',
    autoAccept: false,
    templateGroup: 'dancer',
  }),

  // ── videographer / cinematographer ───────────────────────────────────────────
  t({
    id: 'videographer-event',
    name: 'Event Coverage',
    description:
      'Full-event videography with a [length] highlight reel delivered in [X] days. Includes [X] hours of coverage. Best for [weddings, concerts, corporate events].',
    duration: 'Full Day',
    productType: 'service',
    autoAccept: false,
    templateGroup: 'videographer',
  }),
  t({
    id: 'videographer-content-shoot',
    name: 'Content Shoot',
    description:
      'A directed shoot for your brand or project. Includes pre-production planning, [X] edited deliverables, and color grading. Best for [brands, artists, creators].',
    duration: '4 hours',
    productType: 'service',
    autoAccept: false,
    templateGroup: 'videographer',
  }),
  t({
    id: 'videographer-edit',
    name: 'Video Edit',
    description:
      'Professional editing of your footage with [X] rounds of revisions and final delivery in [X] days. Best for [creators, businesses].',
    duration: 'Per Piece',
    productType: 'digital',
    autoAccept: false,
    templateGroup: 'videographer',
  }),

  // ── actor ────────────────────────────────────────────────────────────────────
  t({
    id: 'actor-performance',
    name: 'Performance Booking',
    description:
      'A live acting performance or dramatic reading. Includes script familiarization and one rehearsal. Best for [events, productions, campaigns].',
    duration: '1 hour',
    productType: 'service',
    autoAccept: false,
    templateGroup: 'actor',
  }),
  t({
    id: 'actor-voiceover',
    name: 'Voiceover / Video Message',
    description:
      'A recorded voiceover or personalized video with [X] revisions, delivered in [X] days. Best for [ads, narration, shoutouts].',
    duration: 'Per Piece',
    productType: 'digital',
    autoAccept: false,
    templateGroup: 'actor',
  }),

  // ── author ────────────────────────────────────────────────────────────────────
  t({
    id: 'author-speaking',
    name: 'Speaking Engagement',
    description:
      'A talk, reading, or panel appearance including a Q&A and [signed copies, if applicable]. Best for [launches, festivals, schools].',
    duration: '1 hour',
    productType: 'service',
    autoAccept: false,
    templateGroup: 'author',
  }),
  t({
    id: 'author-commission',
    name: 'Writing Commission',
    description:
      'Custom written work to your brief ([short story, article, script]) with [X] revisions, delivered in [X] days.',
    duration: 'Per Piece',
    productType: 'digital',
    autoAccept: false,
    templateGroup: 'author',
  }),

  // ── story-teller ─────────────────────────────────────────────────────────────
  t({
    id: 'story-teller-live',
    name: 'Live Storytelling',
    description:
      'An immersive storytelling session tailored to your audience featuring [X] stories. Includes theme consultation. Best for [cultural events, schools, gatherings].',
    duration: '45 min',
    productType: 'service',
    autoAccept: false,
    templateGroup: 'story-teller',
  }),
  t({
    id: 'story-teller-recorded',
    name: 'Recorded Story / Narration',
    description: 'A recorded story or narration delivered as [audio/video] with [X] revisions, delivered in [X] days.',
    duration: 'Per Piece',
    productType: 'digital',
    autoAccept: false,
    templateGroup: 'story-teller',
  }),

  // ── generic (fallback for any unmatched / free-text / unknown art form) ────────
  t({
    id: 'generic-session',
    name: 'Signature Service',
    description:
      'Your core offering. [Describe what the client gets, what is included, and who it is best for.]',
    duration: '1 hour',
    productType: 'service',
    autoAccept: false,
    templateGroup: 'generic',
  }),
  t({
    id: 'generic-commission',
    name: 'Custom Commission',
    description:
      'A bespoke piece created to a client brief with [X] revisions, delivered in [X] days.',
    duration: 'Per Piece',
    productType: 'digital',
    autoAccept: false,
    templateGroup: 'generic',
  }),
  t({
    id: 'generic-workshop',
    name: 'Workshop / Session',
    description:
      'A teaching or collaborative session. [Describe format, group size, and what participants gain.]',
    duration: '2 hours',
    productType: 'service',
    autoAccept: false,
    templateGroup: 'generic',
  }),
];

export function getTemplatesForGroup(group: TemplateGroup): PackageTemplate[] {
  return TEMPLATE_LIBRARY.filter((tpl) => tpl.templateGroup === group);
}

export function getTemplatesForArtForm(artFormValue: string | null | undefined): PackageTemplate[] {
  return getTemplatesForGroup(getTemplateGroup(artFormValue));
}

export function getTemplateById(id: string): PackageTemplate | undefined {
  return TEMPLATE_LIBRARY.find((tpl) => tpl.id === id);
}
