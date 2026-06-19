import { Document, Page, View, Text, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import type { Contract } from '@/lib/services/contracts';
import type { Booking } from '@/lib/services/bookings';
import { buildContractSections, type ContractSection } from '@/lib/contracts/templates';

const TEAL  = '#005440';
const TEXT  = '#1c1b1b';
const MUTED = '#6f7a74';
const BORDER = 'rgba(0,84,64,0.13)';

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', backgroundColor: '#fcf9f8', paddingHorizontal: 48, paddingVertical: 44, fontSize: 9, color: TEXT, lineHeight: 1.45 },

  titleBar: { borderBottomWidth: 1.5, borderBottomColor: TEAL, paddingBottom: 12, marginBottom: 16 },
  brandLine: { fontSize: 7.5, color: MUTED, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
  docTitle: { fontFamily: 'Helvetica-Bold', fontSize: 14, color: TEAL, letterSpacing: 0.5 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  metaLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: MUTED, letterSpacing: 1.2, textTransform: 'uppercase' },
  metaValue: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: TEXT, marginTop: 2 },

  betweenBlock: { marginBottom: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  betweenLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: MUTED, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 6 },
  betweenText: { fontSize: 8.5, color: TEXT, lineHeight: 1.5 },

  section: { marginBottom: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 6, borderBottomWidth: 0.5, borderBottomColor: BORDER, paddingBottom: 3 },
  sectionNum: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: TEAL, width: 20 },
  sectionTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: TEAL, letterSpacing: 1.2, textTransform: 'uppercase', flex: 1 },

  para: { fontSize: 8.5, lineHeight: 1.5, marginBottom: 5 },
  infoLine: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: TEXT, lineHeight: 1.5 },
  quotedPara: { fontSize: 8.5, lineHeight: 1.5, color: MUTED, fontStyle: 'italic', marginBottom: 5 },

  itemRow: { flexDirection: 'row', marginBottom: 3, paddingLeft: 4 },
  itemLetter: { width: 18, fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: TEAL },
  itemText: { flex: 1, fontSize: 8.5, lineHeight: 1.5 },

  bulletRow: { flexDirection: 'row', marginBottom: 2, paddingLeft: 4 },
  bulletDot: { width: 12, fontSize: 8.5, color: TEAL },
  bulletText: { flex: 1, fontSize: 8.5, lineHeight: 1.5 },

  additionalBlock: { marginBottom: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: BORDER },
  additionalLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: MUTED, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 6 },

  sigSection: { marginTop: 20, paddingTop: 14, borderTopWidth: 1.5, borderTopColor: TEAL },
  sigLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: MUTED, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 8 },
  sigRow: { flexDirection: 'row', gap: 20, marginBottom: 6 },
  sigBlock: { flex: 1, borderWidth: 0.5, borderColor: BORDER, borderRadius: 3, padding: 10, minHeight: 70 },
  sigPartyLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: TEAL, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 },
  sigLine: { fontSize: 8.5, color: TEXT, marginBottom: 4 },
  sigUnderline: { borderBottomWidth: 0.5, borderBottomColor: BORDER, marginTop: 12, marginBottom: 3 },

  footer: { marginTop: 16, textAlign: 'center' },
  footerText: { fontSize: 7, color: MUTED, letterSpacing: 0.8, textTransform: 'uppercase' },
});

function renderBody(body: string): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  const paragraphs = body.split('\n\n');

  paragraphs.forEach((para, pIdx) => {
    if (!para.trim()) return;

    if (/^\([a-z]\)/.test(para.trim())) {
      const letter = para.slice(0, 3);
      const rest = para.slice(4).trim();
      elements.push(
        <View key={pIdx} style={s.itemRow}>
          <Text style={s.itemLetter}>{letter}</Text>
          <Text style={s.itemText}>{rest}</Text>
        </View>
      );
      return;
    }

    if (para.includes('\n')) {
      const lines = para.split('\n');
      const allBullets = lines.filter(l => l.trim()).every(l => l.startsWith('- '));
      if (allBullets) {
        lines.forEach((line, lIdx) => {
          if (!line.trim()) return;
          elements.push(
            <View key={`${pIdx}-${lIdx}`} style={s.bulletRow}>
              <Text style={s.bulletDot}>–</Text>
              <Text style={s.bulletText}>{line.slice(2)}</Text>
            </View>
          );
        });
        return;
      }
      lines.forEach((line, lIdx) => {
        if (!line.trim()) return;
        const isKV = /^[A-Z][a-zA-Z ]+: /.test(line);
        elements.push(
          <Text key={`${pIdx}-${lIdx}`} style={isKV ? s.infoLine : s.para}>{line}</Text>
        );
      });
      return;
    }

    if (para.startsWith('"') && para.endsWith('"')) {
      elements.push(<Text key={pIdx} style={s.quotedPara}>{para}</Text>);
      return;
    }

    elements.push(<Text key={pIdx} style={s.para}>{para}</Text>);
  });

  return elements;
}

function SectionBlock({ section }: { section: ContractSection }) {
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionNum}>{section.number}.</Text>
        <Text style={s.sectionTitle}>{section.title}</Text>
      </View>
      {renderBody(section.body)}
    </View>
  );
}

export function ContractPDF({
  contract,
}: {
  contract: Contract;
  booking: Booking;
  artist: { name: string; city: string | null; country: string | null };
  audience: { name: string; email: string };
}) {
  const rendered = buildContractSections(contract);

  return (
    <Document title={`Contract ${rendered.reference}`} author="The Circle">
      <Page size="A4" style={s.page}>
        <View style={s.titleBar}>
          <Text style={s.brandLine}>The Circle · Booking Agreement</Text>
          <Text style={s.docTitle}>{rendered.typeTitle}</Text>
          <View style={s.metaRow}>
            <View><Text style={s.metaLabel}>Reference</Text><Text style={s.metaValue}>{rendered.reference}</Text></View>
            <View><Text style={s.metaLabel}>Date</Text><Text style={s.metaValue}>{rendered.dateGenerated}</Text></View>
          </View>
        </View>

        <View style={s.betweenBlock}>
          <Text style={s.betweenLabel}>Between</Text>
          <Text style={s.betweenText}>{rendered.between}</Text>
        </View>

        {rendered.sections.map((section) => (
          <SectionBlock key={section.number} section={section} />
        ))}

        {rendered.customClauses.length > 0 && (
          <View style={s.additionalBlock}>
            <Text style={s.additionalLabel}>Additional Terms</Text>
            <Text style={s.para}>The following additional terms have been proposed by the Artist and form part of this Agreement upon signature by both parties:</Text>
            {rendered.customClauses.map((clause, i) => (
              <View key={i} style={s.itemRow}>
                <Text style={s.itemLetter}>{i + 1}.</Text>
                <Text style={s.itemText}>{clause}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={s.sigSection}>
          <Text style={s.sigLabel}>Signatures</Text>
          <Text style={s.para}>By signing this Agreement, both parties confirm that they have read, understood, and agreed to all terms set out herein.</Text>
          <View style={s.sigRow}>
            <View style={s.sigBlock}>
              <Text style={s.sigPartyLabel}>Artist</Text>
              <Text style={s.sigLine}>Name: {rendered.signatureBlock.artistName}</Text>
              {rendered.signatureBlock.artistLocation ? <Text style={s.sigLine}>Location: {rendered.signatureBlock.artistLocation}</Text> : null}
              <View style={s.sigUnderline} />
              <Text style={{ fontSize: 7.5, color: MUTED }}>Signature / Date</Text>
            </View>
            <View style={s.sigBlock}>
              <Text style={s.sigPartyLabel}>Client</Text>
              <Text style={s.sigLine}>Name: {rendered.signatureBlock.audienceName}</Text>
              <View style={s.sigUnderline} />
              <Text style={{ fontSize: 7.5, color: MUTED }}>Signature / Date</Text>
            </View>
          </View>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>Facilitated by The Circle — thecircle.co · {rendered.reference}</Text>
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
  return renderToBuffer(
    <ContractPDF contract={contract} booking={booking} artist={artist} audience={audience} />
  );
}
