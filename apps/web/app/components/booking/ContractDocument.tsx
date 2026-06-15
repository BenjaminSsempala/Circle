import { Lbl, Rule } from './ui';
import type { Contract, ContractTemplateType } from '@/lib/services/contracts';

const TEMPLATE_TITLES: Record<ContractTemplateType, string> = {
  performance: 'Performance Agreement',
  workshop: 'Workshop Agreement',
  digital_delivery: 'Digital Delivery Agreement',
  brand_collaboration: 'Brand Collaboration Agreement',
  mentorship: 'Mentorship Agreement',
};

function fmtPrice(price: number, currency: string) {
  return `${currency} ${Number(price).toLocaleString()}`;
}

function fmtDate(date?: string | null) {
  if (!date) return null;
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function Section({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary mb-1.5">
        {number}. {title}
      </div>
      <div className="font-sans text-sm text-on-surface leading-relaxed">{children}</div>
    </div>
  );
}

export function ContractDocument({ contract }: { contract: Contract }) {
  const { content, custom_clauses } = contract;
  const { parties, service, schedule, compensation, specialRequirements, artistObligations } = content;

  const hasSpecialRequirements = !!specialRequirements;
  let sectionNum = 5;
  const specialReqNum = hasSpecialRequirements ? ++sectionNum : null;
  const obligationsNum = ++sectionNum;
  const clausesNum = custom_clauses?.length ? ++sectionNum : null;

  return (
    <div className="rounded-xl border border-primary/10 bg-white p-6">
      <div className="text-center mb-5">
        <Lbl className="mb-1">{TEMPLATE_TITLES[content.service.templateType]}</Lbl>
        <div className="font-sans font-bold text-lg text-on-surface">The Circle · thecircle.co</div>
        <div className="font-mono text-[10px] text-on-surface-variant mt-1">
          REF {contract.reference_number} · {fmtDate(content.generatedAt.slice(0, 10))}
        </div>
      </div>

      <Rule />

      <Section number={1} title="Parties">
        <div className="flex flex-col gap-1">
          <div><span className="font-bold">Artist:</span> {parties.artist.name}{(parties.artist.city || parties.artist.country) ? ` (${[parties.artist.city, parties.artist.country].filter(Boolean).join(', ')})` : ''}</div>
          <div><span className="font-bold">Audience:</span> {parties.audience.name} ({parties.audience.email})</div>
        </div>
      </Section>

      <Section number={2} title="Service Description">
        <div className="flex flex-col gap-1">
          <div className="font-bold">{service.packageName}</div>
          {service.description && <div>{service.description}</div>}
          {service.duration && <div className="text-on-surface-variant text-xs">Duration: {service.duration}</div>}
        </div>
      </Section>

      <Section number={3} title={service.productType === 'digital' ? 'Delivery' : 'Date and Venue'}>
        {service.productType === 'digital' ? (
          <div>Delivery date: {fmtDate(schedule.deliveryDate) ?? 'To be confirmed'}</div>
        ) : (
          <div className="flex flex-col gap-1">
            <div>Date: {fmtDate(schedule.gigDate) ?? 'To be confirmed'}{schedule.gigTime ? ` at ${schedule.gigTime}` : ''}</div>
            <div>Venue: {schedule.venue ?? 'To be confirmed'}</div>
          </div>
        )}
      </Section>

      <Section number={4} title="Compensation">
        <div className="flex flex-col gap-1">
          <div className="font-bold text-primary">{fmtPrice(compensation.price, compensation.currency)}</div>
          <div className="text-on-surface-variant text-xs">
            Transport / logistics: {compensation.logisticsInclusive ? 'Included' : 'Not included'}
          </div>
        </div>
      </Section>

      <Section number={5} title="Cancellation Terms">
        <ul className="flex flex-col gap-1 list-none">
          <li>More than 7 days before: {compensation.cancellationTerms.more_than_7_days_refund_pct}% refund</li>
          <li>Within 7 days: {compensation.cancellationTerms.within_7_days_refund_pct}% refund</li>
          <li>Within 48 hours: {compensation.cancellationTerms.within_48_hours_refund_pct}% refund</li>
        </ul>
      </Section>

      {hasSpecialRequirements && specialReqNum && (
        <Section number={specialReqNum} title="Special Requirements">
          <div className="rounded-lg bg-[#fcf9f8] border border-primary/10 px-3 py-2.5 whitespace-pre-wrap">
            {specialRequirements}
          </div>
        </Section>
      )}

      <Section number={obligationsNum} title="Artist Obligations">
        <div className="whitespace-pre-wrap">{artistObligations}</div>
      </Section>

      {clausesNum && custom_clauses?.length > 0 && (
        <Section number={clausesNum} title="Additional Clauses">
          <ol className="flex flex-col gap-1.5 list-decimal pl-4">
            {custom_clauses.map((clause, i) => <li key={i}>{clause}</li>)}
          </ol>
        </Section>
      )}
    </div>
  );
}
