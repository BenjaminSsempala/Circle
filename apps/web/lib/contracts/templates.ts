import type { Contract, ContractContent, ContractTemplateType } from '@/lib/services/contracts';
import type { BrandTerms } from '@/lib/services/bookings';

export interface ContractSection {
  number: number;
  title: string;
  body: string; // paragraphs separated by \n\n; lettered items like "(a) text" each their own paragraph
}

export interface RenderedContract {
  typeTitle: string;
  reference: string;
  dateGenerated: string;
  between: string;
  sections: ContractSection[];
  customClauses: string[];
  signatureBlock: {
    artistName: string;
    artistLocation: string;
    audienceName: string;
    reference: string;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string | null | undefined): string {
  if (!d) return 'To be confirmed';
  return new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

const TITLES: Record<ContractTemplateType, string> = {
  performance: 'Performance Agreement',
  workshop: 'Workshop Agreement',
  digital_delivery: 'Digital Delivery Agreement',
  brand_collaboration: 'Brand Collaboration Agreement',
  mentorship: 'Mentorship Agreement',
};

// ─── Shared clause builders ───────────────────────────────────────────────────

function compensationSection(c: ContractContent, n: number): ContractSection {
  const { price, currency, logisticsInclusive, cancellationTerms } = c.compensation;
  const logisticsLine = logisticsInclusive
    ? 'The agreed fee is inclusive of transport where applicable.'
    : 'The agreed fee is exclusive of transport, which shall be arranged and covered separately by the Client unless otherwise agreed in writing.';

  const { within_48_hours_refund_pct: h48, within_7_days_refund_pct: d7, more_than_7_days_refund_pct: d7p } = cancellationTerms;

  return {
    number: n,
    title: 'COMPENSATION',
    body: [
      `The Client agrees to pay the Artist the sum of ${currency} ${Number(price).toLocaleString()} for the services described in this Agreement.`,
      `Payment shall be made directly between the parties in the manner agreed prior to or at the time of booking, which may include mobile money transfer, cash, bank transfer, or any other method mutually agreed in writing. The Artist and Client are responsible for arranging and confirming payment between themselves.`,
      logisticsLine,
    ].join('\n\n'),
  };
}

function cancellationSection(c: ContractContent, n: number): ContractSection {
  const { within_48_hours_refund_pct: h48, within_7_days_refund_pct: d7, more_than_7_days_refund_pct: d7p } = c.compensation.cancellationTerms;
  return {
    number: n,
    title: 'CANCELLATION AND REFUNDS',
    body: [
      'Either party may cancel this Agreement subject to the following terms:',
      `Cancellation by the Client:\n- More than 7 days prior to the agreed date: ${d7p}% of the fee shall be refunded to the Client.\n- Between 48 hours and 7 days prior to the agreed date: ${d7}% of the fee shall be refunded to the Client.\n- Within 48 hours of the agreed date: ${h48}% of the fee shall be refunded to the Client.`,
      `Cancellation by the Artist:\nIn the event that the Artist is unable to fulfil this Agreement, the Artist shall notify the Client as soon as reasonably practicable. The Client shall be entitled to a full refund of any amounts paid. The Artist shall not be liable for any consequential losses arising from such cancellation.`,
      'All refunds should be processed within seven (7) business days of the cancellation being confirmed.',
    ].join('\n\n'),
  };
}

function ipSection(n: number): ContractSection {
  return {
    number: n,
    title: 'INTELLECTUAL PROPERTY',
    body: [
      'All intellectual property rights in any original work created or performed by the Artist under this Agreement, including but not limited to literary works, musical compositions, choreography, visual art, and spoken word performances, shall remain the exclusive property of the Artist.',
      'No transfer of intellectual property rights is effected by this Agreement unless explicitly stated in a separate written addendum signed by both parties.',
      "The Client is granted a limited, non-exclusive, non-transferable licence to enjoy the performance or deliverable for personal or internal purposes as described in this Agreement. Commercial exploitation, redistribution, or sublicensing of the Artist's work requires a separate written agreement.",
    ].join('\n\n'),
  };
}

function forceMajeureSection(n: number): ContractSection {
  return {
    number: n,
    title: 'FORCE MAJEURE',
    body: [
      'Neither party shall be in breach of this Agreement, nor liable for any failure or delay in performance, where such failure or delay results from events beyond the reasonable control of that party, including but not limited to acts of God, natural disasters, civil unrest, government-imposed restrictions, or public health emergencies.',
      'In such circumstances, the affected party shall notify the other as soon as practicable, and the parties shall in good faith attempt to reschedule the services to a mutually convenient date.',
    ].join('\n\n'),
  };
}

function governingLawSection(c: ContractContent, n: number): ContractSection {
  const { city, country } = c.parties.artist;
  const jurisdiction = [city, country].filter(Boolean).join(', ') || 'the applicable jurisdiction';
  const governingLaw = country || 'the applicable jurisdiction';
  return {
    number: n,
    title: 'GOVERNING LAW AND JURISDICTION',
    body: `This Agreement shall be governed by and construed in accordance with the laws of ${governingLaw}. Any disputes arising under or in connection with this Agreement shall be subject to the jurisdiction of the courts of ${jurisdiction}.`,
  };
}

function entireAgreementSection(n: number): ContractSection {
  return {
    number: n,
    title: 'ENTIRE AGREEMENT',
    body: [
      "This Agreement constitutes the entire agreement between the parties with respect to its subject matter and supersedes all prior negotiations, representations, or agreements. Any amendments to this Agreement must be made in writing and agreed to by both parties.",
      "This Agreement has been facilitated by Engero platform (engero.art). Engero is not a party to this Agreement and assumes no liability for the performance or non-performance of either party's obligations hereunder.",
    ].join('\n\n'),
  };
}

function sharedSections(c: ContractContent, startNum: number): ContractSection[] {
  return [
    compensationSection(c, startNum),
    cancellationSection(c, startNum + 1),
    ipSection(startNum + 2),
    forceMajeureSection(startNum + 3),
    governingLawSection(c, startNum + 4),
    entireAgreementSection(startNum + 5),
  ];
}

// ─── Type 1: Performance Agreement ───────────────────────────────────────────

function performanceSections(c: ContractContent): ContractSection[] {
  const { schedule, service, specialRequirements } = c;
  const special = specialRequirements || 'None specified';
  return [
    {
      number: 1,
      title: 'SERVICES',
      body: [
        'The Artist agrees to provide the following performance services:',
        `Performance: ${service.packageName}\nDescription: ${service.description ?? 'As per Artist profile'}\nDuration: ${service.duration ?? 'As agreed'}\nDate: ${fmtDate(schedule.gigDate)}\nTime: ${schedule.gigTime ?? 'As agreed'}\nVenue: ${schedule.venue ?? 'To be confirmed'}`,
        `Additional requirements or context provided by the Client:\n"${special}"`,
      ].join('\n\n'),
    },
    {
      number: 2,
      title: 'ARTIST OBLIGATIONS',
      body: [
        'The Artist agrees to:',
        '(a) Arrive at the venue no less than thirty (30) minutes prior to the agreed performance time to allow for preparation and sound checks where applicable;',
        "(b) Deliver the performance for the agreed duration in a professional manner consistent with the standard described in the Artist's profile on Engero platform;",
        '(c) Conduct themselves professionally throughout the engagement, including in interactions with the Client, guests, and venue staff;',
        '(d) Communicate any significant changes to the agreed set, format, or logistics to the Client no less than 48 hours in advance where possible.',
      ].join('\n\n'),
    },
    {
      number: 3,
      title: 'CLIENT OBLIGATIONS',
      body: [
        'The Client agrees to:',
        '(a) Ensure the venue is accessible, safe, and suitable for the agreed performance;',
        '(b) Provide any agreed technical requirements including sound equipment, microphone, stage area, and lighting as communicated with the Artist prior to the event;',
        "(c) Ensure that the audience and venue conduct is conducive to the performance. The Artist reserves the right to discontinue the performance if the conduct of the audience or event poses a risk to their safety or dignity.",
      ].join('\n\n'),
    },
    {
      number: 4,
      title: 'TECHNICAL REQUIREMENTS',
      body: [
        `The following technical requirements are agreed between the parties:\n${special}`,
        'Where no specific technical requirements have been stated, the Client shall ensure that a functioning sound system and microphone are available at the venue, and that a clear performance space of not less than 3 metres by 3 metres is designated for the Artist.',
      ].join('\n\n'),
    },
    {
      number: 5,
      title: 'RECORDING AND PHOTOGRAPHY',
      body: [
        "No recording, filming, or live streaming of the Artist's performance is permitted without the prior consent of the Artist.\nPhotography for personal, non-commercial use is permitted unless the Artist has expressly stated otherwise.",
        "Where the Artist consents to recording, all intellectual property rights in any recording shall remain with the Artist as set out in the Intellectual Property clause of this Agreement.",
      ].join('\n\n'),
    },
  ];
}

// ─── Type 2: Workshop Agreement ───────────────────────────────────────────────

function workshopSections(c: ContractContent): ContractSection[] {
  const { schedule, service, specialRequirements } = c;
  const special = specialRequirements || 'None specified';
  return [
    {
      number: 1,
      title: 'SERVICES',
      body: [
        'The Artist agrees to facilitate the following workshop:',
        `Workshop: ${service.packageName}\nDescription: ${service.description ?? 'As per Artist profile'}\nDuration: ${service.duration ?? 'As agreed'}\nDate: ${fmtDate(schedule.gigDate)}\nTime: ${schedule.gigTime ?? 'As agreed'}\nVenue: ${schedule.venue ?? 'To be confirmed'}`,
        `Additional context provided by the Client:\n"${special}"`,
      ].join('\n\n'),
    },
    {
      number: 2,
      title: 'ARTIST OBLIGATIONS',
      body: [
        'The Artist agrees to:',
        '(a) Prepare all workshop materials, activities, and resources in advance of the agreed session date;',
        '(b) Facilitate the full agreed session duration in a structured, professional, and engaging manner;',
        '(c) Arrive at the venue no less than thirty (30) minutes prior to the session start time to prepare the space and materials;',
        "(d) Deliver a written session summary or key takeaways document to the Client within forty-eight (48) hours of the workshop's conclusion;",
        '(e) Be responsive to participant questions and contributions throughout the session.',
      ].join('\n\n'),
    },
    {
      number: 3,
      title: 'CLIENT OBLIGATIONS',
      body: [
        'The Client agrees to:',
        '(a) Provide a suitable space for the session, equipped with any agreed materials such as seating, writing materials, projection equipment, or internet access where required;',
        "(b) Ensure that the number of participants does not exceed any maximum agreed with the Artist. Where a participant count has been agreed, the Client shall notify the Artist of significant changes no less than 48 hours prior to the session;",
        '(c) Inform participants of the session objectives and any preparation required in advance.',
      ].join('\n\n'),
    },
    {
      number: 4,
      title: 'PARTICIPANT COUNT',
      body: 'No specific participant count has been agreed. The Artist reserves the right to adjust the session format where the number of participants significantly exceeds what is reasonable for the agreed duration and format.',
    },
    {
      number: 5,
      title: 'RESCHEDULING',
      body: "Either party may request to reschedule the session with no less than seventy-two (72) hours' notice. One (1) reschedule is permitted at no additional cost. Subsequent rescheduling requests may be subject to a rescheduling fee to be agreed between the parties.",
    },
    {
      number: 6,
      title: 'RECORDING',
      body: 'No recording of the workshop session is permitted without the prior written consent of the Artist and all participants. Where consent is obtained, any recordings shall be used for personal reference only and shall not be shared publicly or used for commercial purposes.',
    },
  ];
}

// ─── Type 3: Digital Delivery Agreement ──────────────────────────────────────

function digitalDeliverySections(c: ContractContent): ContractSection[] {
  const { schedule, service, specialRequirements } = c;
  const special = specialRequirements || 'None specified';
  return [
    {
      number: 1,
      title: 'DELIVERABLE',
      body: [
        'The Artist agrees to create and deliver the following:',
        `Work: ${service.packageName}\nDescription: ${service.description ?? 'As per Artist profile'}\nFormat: ${service.duration ?? 'As agreed'}\nDelivery Date: ${fmtDate(schedule.deliveryDate)}`,
        `Specific requirements provided by the Client:\n"${special}"`,
      ].join('\n\n'),
    },
    {
      number: 2,
      title: 'ARTIST OBLIGATIONS',
      body: [
        'The Artist agrees to:',
        '(a) Create the deliverable described above in accordance with the requirements communicated by the Client at the time of booking;',
        '(b) Deliver the completed work to the Client by the agreed Delivery Date via Engero platform or such other method as agreed between the parties;',
        '(c) Notify the Client no less than forty-eight (48) hours in advance if the Delivery Date cannot be met, and propose a revised delivery timeline;',
        "(d) Incorporate one (1) round of reasonable revisions at no additional charge, where the Client's revision request is consistent with the original brief and does not constitute a fundamental change to the agreed deliverable.",
      ].join('\n\n'),
    },
    {
      number: 3,
      title: 'REVISION PROCESS',
      body: [
        'The Client shall review the delivered work within seven (7) days of delivery. If the Client requests revisions within this period, the Artist shall incorporate one (1) round of reasonable revisions.',
        'A revision request shall be considered reasonable where it:\n(a) Is consistent with the original brief and requirements;\n(b) Does not require the Artist to substantially recreate the work from the beginning;\n(c) Is submitted as a single consolidated request rather than multiple sequential requests.',
        'Additional revision rounds beyond the one (1) included may be agreed between the parties at an additional fee.',
        'Where the Client has not communicated within seven (7) days of delivery, the work shall be deemed accepted.',
      ].join('\n\n'),
    },
    {
      number: 4,
      title: 'USAGE RIGHTS',
      body: [
        'The Client is granted a limited, personal, non-commercial licence to use the delivered work for the purpose described in this Agreement.',
        'Where the Client intends to use the work for commercial purposes, including but not limited to brand campaigns, marketing materials, public broadcasts, or commercial resale, a separate written agreement governing commercial usage rights shall be required.',
      ].join('\n\n'),
    },
    {
      number: 5,
      title: 'DELIVERY FORMAT',
      body: "The Artist shall deliver the work in a widely accessible digital format appropriate to the type of work, as agreed between the parties.",
    },
  ];
}

// ─── Type 4: Brand Collaboration Agreement ───────────────────────────────────

function brandCollaborationSections(c: ContractContent): ContractSection[] {
  const { schedule, service, specialRequirements } = c;
  const special = specialRequirements || 'None specified';
  const bt = c.brandTerms as BrandTerms | null | undefined;
  const TBA = '[To be agreed between parties]';

  const deliverables = bt?.deliverables || TBA;
  const usagePurpose = bt?.usage_purpose || TBA;
  const usageTerritory = bt?.usage_territory || TBA;
  const usageDuration = bt?.usage_duration || TBA;
  const usageChannels = bt?.usage_channels || TBA;
  const exclusivityAgreed = bt?.exclusivity ?? false;
  const exclusivityPeriod = bt?.exclusivity_period || TBA;
  const exclusivityExclusions = bt?.exclusivity_exclusions || TBA;
  const creditLine = bt?.credit_line || c.parties.artist.name;
  const dueDate = fmtDate(schedule.deliveryDate) !== 'To be confirmed' ? fmtDate(schedule.deliveryDate) : fmtDate(schedule.gigDate);

  return [
    {
      number: 1,
      title: 'PROJECT DESCRIPTION',
      body: [
        'The Artist agrees to undertake the following brand collaboration:',
        `Project: ${service.packageName}\nDescription: ${service.description ?? 'As per Artist profile'}\nProject Duration: ${service.duration ?? 'As agreed'}\nDeliverables Due: ${dueDate}`,
        `Specific brief and requirements:\n"${special}"`,
      ].join('\n\n'),
    },
    {
      number: 2,
      title: 'DELIVERABLES',
      body: [
        `The following deliverables are agreed between the parties:\n\n${deliverables}`,
        'The Artist shall deliver all agreed deliverables by the dates specified above or as otherwise agreed in writing between the parties.',
      ].join('\n\n'),
    },
    {
      number: 3,
      title: 'ARTIST OBLIGATIONS',
      body: [
        'The Artist agrees to:',
        "(a) Create and deliver all agreed deliverables to the standard described in this Agreement and consistent with the Artist's public portfolio;",
        "(b) Maintain confidentiality regarding the campaign details, creative brief, and any proprietary information shared by the Client, as set out in the Confidentiality clause;",
        "(c) Credit the Client appropriately where the Artist shares or publishes any content produced under this Agreement, unless the Client has requested otherwise;",
        "(d) Communicate proactively with the Client regarding the creative process, timelines, and any anticipated challenges.",
      ].join('\n\n'),
    },
    {
      number: 4,
      title: 'CLIENT OBLIGATIONS',
      body: [
        'The Client agrees to:',
        "(a) Provide the Artist with all necessary information, assets, brand guidelines, and approvals in a timely manner to enable the Artist to fulfil their obligations;",
        "(b) Credit the Artist appropriately in all published materials featuring the Artist's work, using the name and handle agreed between the parties;",
        "(c) Limit the use of the Artist's work to the scope, territory, and duration agreed in this Agreement.",
      ].join('\n\n'),
    },
    {
      number: 5,
      title: 'INTELLECTUAL PROPERTY AND USAGE RIGHTS',
      body: [
        "All intellectual property rights in the work created by the Artist under this Agreement shall remain with the Artist.",
        `The Client is granted a limited licence to use the work as follows:\n\nPurpose: ${usagePurpose}\nTerritory: ${usageTerritory}\nDuration: ${usageDuration}\nChannels: ${usageChannels}`,
        "Any use of the Artist's work beyond the scope described above requires a separate written agreement and may be subject to additional fees.",
      ].join('\n\n'),
    },
    {
      number: 6,
      title: 'EXCLUSIVITY',
      body: exclusivityAgreed
        ? [
            `The Artist agrees not to undertake similar work for direct competitors of the Client within the following period: ${exclusivityPeriod}.`,
            `The following categories of work are excluded from this exclusivity clause:\n${exclusivityExclusions}`,
          ].join('\n\n')
        : 'No exclusivity is granted under this Agreement. The Artist remains free to work with other clients, including competitors of the Client, unless otherwise agreed in writing.',
    },
    {
      number: 7,
      title: 'CONFIDENTIALITY',
      body: [
        'Both parties agree to maintain the confidentiality of all non-public information shared during the course of this Agreement, including but not limited to creative briefs, campaign strategies, financial terms, and proprietary business information.',
        'This obligation of confidentiality shall remain in force for a period of two (2) years from the date of this Agreement, or until the information enters the public domain through no fault of either party.',
      ].join('\n\n'),
    },
    {
      number: 8,
      title: 'APPROVAL AND REVISION PROCESS',
      body: [
        'The Client shall review each deliverable within five (5) business days of receipt and provide either approval or a single consolidated set of revision notes.',
        'The Artist shall incorporate one (1) round of reasonable revisions per deliverable at no additional charge. Additional revision rounds may be agreed at an additional fee.',
        'Where the Client has not responded within five (5) business days, the deliverable shall be deemed approved.',
      ].join('\n\n'),
    },
    {
      number: 9,
      title: 'CREDIT AND ATTRIBUTION',
      body: [
        `The Client agrees that all published materials featuring the Artist's work shall credit the Artist as follows:\n\n"${creditLine}"`,
        'Failure to provide agreed credit shall constitute a material breach of this Agreement.',
      ].join('\n\n'),
    },
  ];
}

// ─── Type 5: Mentorship Agreement ────────────────────────────────────────────

function mentorshipSections(c: ContractContent): ContractSection[] {
  const { schedule, service, specialRequirements } = c;
  const special = specialRequirements || 'None specified';
  return [
    {
      number: 1,
      title: 'SERVICES',
      body: [
        'The Artist agrees to provide the following mentorship services:',
        `Programme: ${service.packageName}\nDescription: ${service.description ?? 'As per Artist profile'}\nSession Duration: ${service.duration ?? 'As agreed'}\nDate: ${fmtDate(schedule.gigDate)}\nTime: ${schedule.gigTime ?? 'As agreed'}\nVenue: ${schedule.venue ?? 'To be confirmed'}`,
        `Context provided by the Client:\n"${special}"`,
      ].join('\n\n'),
    },
    {
      number: 2,
      title: 'ARTIST OBLIGATIONS',
      body: [
        'The Artist agrees to:',
        '(a) Be available and prepared for the full agreed session duration at the agreed date and time;',
        '(b) Provide constructive, honest, and professional feedback and guidance during the session;',
        "(c) Respond to reasonable follow-up questions submitted by the Client within forty-eight (48) hours of the session's conclusion;",
        '(d) Maintain confidentiality regarding any personal or professional information shared by the Client during the session.',
      ].join('\n\n'),
    },
    {
      number: 3,
      title: 'CLIENT OBLIGATIONS',
      body: [
        'The Client agrees to:',
        '(a) Arrive or be available promptly at the agreed session time;',
        '(b) Prepare any materials, questions, or work samples they wish to discuss prior to the session to make effective use of the agreed time;',
        "(c) Maintain confidentiality regarding any information shared by the Artist during the session that is not publicly available.",
      ].join('\n\n'),
    },
    {
      number: 4,
      title: 'RESCHEDULING',
      body: "Either party may request to reschedule the session with no less than twenty-four (24) hours' notice. Where a rescheduling request is made with less than twenty-four (24) hours' notice without reasonable cause, the requesting party acknowledges that this may result in a forfeiture of the session fee.",
    },
    {
      number: 5,
      title: 'RECORDING',
      body: "No recording of the mentorship session is permitted without the prior written consent of both parties. Where recording is agreed, the recording is for the Client's personal reference only and shall not be shared publicly.",
    },
    {
      number: 6,
      title: 'NO GUARANTEE OF OUTCOMES',
      body: "The Artist shall provide guidance and feedback to the best of their professional ability. However, the Artist makes no guarantee of specific outcomes, results, or career progression arising from the mentorship engagement. The Client acknowledges that results depend on their own effort, application, and circumstances.",
    },
    {
      number: 7,
      title: 'CONFIDENTIALITY',
      body: "Both parties agree to maintain confidentiality regarding all personal and professional information shared during the session. This obligation applies equally to the Artist in relation to the Client's work and to the Client in relation to any proprietary methods, processes, or information shared by the Artist.",
    },
  ];
}

// ─── Main builder ─────────────────────────────────────────────────────────────

export function buildContractSections(contract: Contract): RenderedContract {
  const { content: c, template_type, reference_number, custom_clauses } = contract;

  const typeTitle = TITLES[template_type] ?? 'Service Agreement';
  const dateGenerated = fmtDate(c.generatedAt.slice(0, 10));

  const between = [
    `${c.parties.artist.name}, a creative professional based in ${[c.parties.artist.city, c.parties.artist.country].filter(Boolean).join(', ')}`,
    '(hereinafter referred to as "the Artist")',
    '',
    'AND',
    '',
    `${c.parties.audience.name} (${c.parties.audience.email})`,
    '(hereinafter referred to as "the Client")',
    '',
    'This Agreement is facilitated by Engero platform (engero.art) and constitutes a binding agreement between the Artist and the Client upon signature by both parties.',
  ].join('\n');

  let typeSections: ContractSection[];
  switch (template_type) {
    case 'performance':        typeSections = performanceSections(c); break;
    case 'workshop':           typeSections = workshopSections(c); break;
    case 'digital_delivery':   typeSections = digitalDeliverySections(c); break;
    case 'brand_collaboration': typeSections = brandCollaborationSections(c); break;
    case 'mentorship':         typeSections = mentorshipSections(c); break;
    default:                   typeSections = performanceSections(c);
  }

  const shared = sharedSections(c, typeSections.length + 1);

  return {
    typeTitle,
    reference: reference_number,
    dateGenerated,
    between,
    sections: [...typeSections, ...shared],
    customClauses: custom_clauses ?? [],
    signatureBlock: {
      artistName: c.parties.artist.name,
      artistLocation: [c.parties.artist.city, c.parties.artist.country].filter(Boolean).join(', '),
      audienceName: c.parties.audience.name,
      reference: reference_number,
    },
  };
}
