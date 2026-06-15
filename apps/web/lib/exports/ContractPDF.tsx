import { Document, Page, View, Text, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import type { Contract } from '@/lib/services/contracts';
import type { Booking } from '@/lib/services/bookings';

const TEAL  = '#005440';
const TEXT  = '#1c1b1b';
const MUTED = '#6f7a74';
const BORDER = 'rgba(0,84,64,0.13)';

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', backgroundColor: '#fcf9f8', padding: '36 40', fontSize: 9.5, color: TEXT },

  header: { borderBottomWidth: 1.5, borderBottomColor: TEAL, paddingBottom: 14, marginBottom: 18 },
  title: { fontFamily: 'Helvetica-Bold', fontSize: 16, color: TEAL, letterSpacing: 1.5, textTransform: 'uppercase' },
  brand: { fontSize: 9, color: MUTED, marginTop: 2 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  metaLabel: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: MUTED, letterSpacing: 1.2, textTransform: 'uppercase' },
  metaValue: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: TEXT, marginTop: 2 },

  section: { marginBottom: 12 },
  sectionLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: TEAL, letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: 5, borderBottomWidth: 0.5, borderBottomColor: BORDER, paddingBottom: 3 },
  body: { fontSize: 9.5, lineHeight: 1.5, color: TEXT },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  rowLabel: { fontSize: 9, color: MUTED },
  rowValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: TEXT },

  inset: { backgroundColor: 'rgba(0,84,64,0.05)', borderRadius: 4, padding: 10, marginTop: 4 },

  clauseRow: { flexDirection: 'row', marginBottom: 4 },
  clauseNum: { width: 16, fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: TEAL },
  clauseText: { flex: 1, fontSize: 9.5, lineHeight: 1.5 },

  sigRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 28, gap: 20 },
  sigBox: { flex: 1, borderWidth: 1, borderStyle: 'dashed', borderColor: BORDER, borderRadius: 4, height: 70, justifyContent: 'flex-end', padding: 8 },
  sigLabel: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: MUTED, letterSpacing: 1.2, textTransform: 'uppercase' },
  sigName: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: TEXT, marginTop: 8 },

  footer: { marginTop: 24, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: BORDER, textAlign: 'center' },
  footerText: { fontSize: 7.5, color: MUTED, letterSpacing: 1, textTransform: 'uppercase' },
});

function fmtPrice(p: number, c: string) {
  return `${c} ${Number(p).toLocaleString()}`;
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

const TEMPLATE_TITLES: Record<string, string> = {
  performance: 'Performance Agreement',
  workshop: 'Workshop Agreement',
  digital_delivery: 'Digital Delivery Agreement',
  brand_collaboration: 'Brand Collaboration Agreement',
  mentorship: 'Mentorship Agreement',
};

export function ContractPDF({
  contract, booking, artist, audience,
}: {
  contract: Contract;
  booking: Booking;
  artist: { name: string; city: string | null; country: string | null };
  audience: { name: string; email: string };
}) {
  const c = contract.content;
  const isService = c.service.productType === 'service';

  return (
    <Document title={`Contract ${contract.reference_number}`} author="The Circle">
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>{TEMPLATE_TITLES[contract.template_type] ?? 'Service Agreement'}</Text>
          <Text style={s.brand}>The Circle · thecircle.co</Text>
          <View style={s.metaRow}>
            <View>
              <Text style={s.metaLabel}>Reference</Text>
              <Text style={s.metaValue}>{contract.reference_number}</Text>
            </View>
            <View>
              <Text style={s.metaLabel}>Date</Text>
              <Text style={s.metaValue}>{fmtDate(c.generatedAt.slice(0, 10))}</Text>
            </View>
          </View>
        </View>

        {/* 1. Parties */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>1. Parties</Text>
          <View style={s.row}>
            <Text style={s.rowLabel}>Artist</Text>
            <Text style={s.rowValue}>
              {c.parties.artist.name}{[c.parties.artist.city, c.parties.artist.country].filter(Boolean).length > 0 ? ` — ${[c.parties.artist.city, c.parties.artist.country].filter(Boolean).join(', ')}` : ''}
            </Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Client</Text>
            <Text style={s.rowValue}>{c.parties.audience.name}{c.parties.audience.email ? ` — ${c.parties.audience.email}` : ''}</Text>
          </View>
        </View>

        {/* 2. Service description */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>2. Service Description</Text>
          <Text style={s.body}>{c.service.packageName}</Text>
          {c.service.description ? <Text style={{ ...s.body, color: MUTED, marginTop: 3 }}>{c.service.description}</Text> : null}
          {c.service.duration ? (
            <View style={{ ...s.row, marginTop: 5 }}>
              <Text style={s.rowLabel}>Duration</Text>
              <Text style={s.rowValue}>{c.service.duration}</Text>
            </View>
          ) : null}
        </View>

        {/* 3. Date and venue / delivery */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>{isService ? '3. Date and Venue' : '3. Delivery'}</Text>
          {isService ? (
            <>
              <View style={s.row}>
                <Text style={s.rowLabel}>Date</Text>
                <Text style={s.rowValue}>{fmtDate(c.schedule.gigDate)}</Text>
              </View>
              {c.schedule.gigTime ? (
                <View style={s.row}>
                  <Text style={s.rowLabel}>Time</Text>
                  <Text style={s.rowValue}>{c.schedule.gigTime}</Text>
                </View>
              ) : null}
              <View style={s.row}>
                <Text style={s.rowLabel}>Venue</Text>
                <Text style={s.rowValue}>{c.schedule.venue ?? '—'}</Text>
              </View>
            </>
          ) : (
            <View style={s.row}>
              <Text style={s.rowLabel}>Delivery date</Text>
              <Text style={s.rowValue}>{fmtDate(c.schedule.deliveryDate)}</Text>
            </View>
          )}
        </View>

        {/* 4. Compensation */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>4. Compensation</Text>
          <View style={s.row}>
            <Text style={s.rowLabel}>Total fee</Text>
            <Text style={s.rowValue}>{fmtPrice(c.compensation.price, c.compensation.currency)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Logistics</Text>
            <Text style={s.rowValue}>{c.compensation.logisticsInclusive ? 'Inclusive of fee' : 'Arranged separately'}</Text>
          </View>
        </View>

        {/* 5. Cancellation terms */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>5. Cancellation Terms</Text>
          <View style={s.row}>
            <Text style={s.rowLabel}>Cancelled within 48 hours of the agreed date</Text>
            <Text style={s.rowValue}>{c.compensation.cancellationTerms.within_48_hours_refund_pct}% refund</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Cancelled within 7 days of the agreed date</Text>
            <Text style={s.rowValue}>{c.compensation.cancellationTerms.within_7_days_refund_pct}% refund</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Cancelled more than 7 days before the agreed date</Text>
            <Text style={s.rowValue}>{c.compensation.cancellationTerms.more_than_7_days_refund_pct}% refund</Text>
          </View>
        </View>

        {/* 6. Special requirements */}
        {c.specialRequirements ? (
          <View style={s.section}>
            <Text style={s.sectionLabel}>6. Special Requirements</Text>
            <View style={s.inset}>
              <Text style={s.body}>{c.specialRequirements}</Text>
            </View>
          </View>
        ) : null}

        {/* 7. Artist obligations */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>{c.specialRequirements ? '7' : '6'}. Artist Obligations</Text>
          <Text style={s.body}>{c.artistObligations}</Text>
        </View>

        {/* 8. Custom clauses */}
        {contract.custom_clauses.length > 0 ? (
          <View style={s.section}>
            <Text style={s.sectionLabel}>{c.specialRequirements ? '8' : '7'}. Additional Clauses</Text>
            {contract.custom_clauses.map((clause, i) => (
              <View key={i} style={s.clauseRow}>
                <Text style={s.clauseNum}>{i + 1}.</Text>
                <Text style={s.clauseText}>{clause}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Signatures */}
        <View style={s.sigRow}>
          <View style={s.sigBox}>
            <Text style={s.sigLabel}>Signature — Artist</Text>
            <Text style={s.sigName}>{c.parties.artist.name}</Text>
          </View>
          <View style={s.sigBox}>
            <Text style={s.sigLabel}>Signature — Client</Text>
            <Text style={s.sigName}>{c.parties.audience.name}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>Facilitated by The Circle — thecircle.co</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderContractPDF(
  contract: Contract,
  booking: Booking,
  artist: { name: string; city: string | null; country: string | null },
  audience: { name: string; email: string },
): Promise<Buffer> {
  return renderToBuffer(<ContractPDF contract={contract} booking={booking} artist={artist} audience={audience} />);
}
