import { buildContractSections } from '@/lib/contracts/templates';
import type { Contract } from '@/lib/services/contracts';

function SectionBody({ body }: { body: string }) {
  const paragraphs = body.split('\n\n');
  return (
    <div className="flex flex-col gap-2">
      {paragraphs.map((para, i) => {
        if (!para.trim()) return null;

        if (/^\([a-z]\)/.test(para.trim())) {
          return (
            <div key={i} className="flex gap-2 pl-3">
              <span className="font-mono text-xs text-primary flex-shrink-0 w-6">{para.slice(0, 3)}</span>
              <span className="text-sm leading-relaxed">{para.slice(4).trim()}</span>
            </div>
          );
        }

        if (para.includes('\n')) {
          const lines = para.split('\n');
          const allBullets = lines.filter(l => l.trim()).every(l => l.startsWith('- '));
          if (allBullets) {
            return (
              <ul key={i} className="flex flex-col gap-1 pl-3">
                {lines.filter(l => l.trim()).map((line, li) => (
                  <li key={li} className="flex gap-2 text-sm leading-relaxed">
                    <span className="text-primary flex-shrink-0">–</span>
                    <span>{line.slice(2)}</span>
                  </li>
                ))}
              </ul>
            );
          }
          return (
            <div key={i} className="rounded-lg bg-[#f5f3f0] border border-primary/[0.08] px-3 py-2.5 flex flex-col gap-0.5">
              {lines.map((line, li) => {
                if (!line.trim()) return null;
                const isKV = /^[A-Z][a-zA-Z ]+: /.test(line);
                return (
                  <div key={li} className={`text-sm leading-relaxed ${isKV ? 'font-medium' : 'text-on-surface-variant'}`}>
                    {line}
                  </div>
                );
              })}
            </div>
          );
        }

        if (para.startsWith('"') && para.endsWith('"')) {
          return (
            <p key={i} className="text-sm leading-relaxed text-on-surface-variant italic pl-3 border-l-2 border-primary/20">
              {para}
            </p>
          );
        }

        return <p key={i} className="text-sm leading-relaxed">{para}</p>;
      })}
    </div>
  );
}

export function ContractDocument({ contract }: { contract: Contract }) {
  const rendered = buildContractSections(contract);

  return (
    <div className="rounded-xl border border-primary/10 bg-white overflow-hidden">
      {/* Document header */}
      <div className="px-6 py-5 border-b border-primary/10 bg-primary/[0.02]">
        <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-primary mb-1.5">Engero · Booking Agreement</div>
        <h2 className="font-bold text-lg text-on-surface">{rendered.typeTitle}</h2>
        <div className="flex gap-6 mt-2">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-on-surface-variant">Reference</div>
            <div className="font-mono text-xs font-bold text-primary mt-0.5">{rendered.reference}</div>
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-on-surface-variant">Date</div>
            <div className="text-xs font-medium mt-0.5">{rendered.dateGenerated}</div>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 flex flex-col gap-6">
        {/* Between parties */}
        <div className="pb-5 border-b border-primary/[0.08]">
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-on-surface-variant mb-3">Between</div>
          <div className="text-sm leading-relaxed whitespace-pre-line text-on-surface">
            {rendered.between}
          </div>
        </div>

        {/* Numbered sections */}
        {rendered.sections.map((section) => (
          <div key={section.number} className="pb-5 border-b border-primary/[0.08] last:border-0 last:pb-0">
            <div className="flex items-baseline gap-2 mb-3">
              <span className="font-mono text-[9px] text-primary font-bold w-5 flex-shrink-0">{section.number}.</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary font-bold">{section.title}</span>
            </div>
            <SectionBody body={section.body} />
          </div>
        ))}

        {/* Additional terms (custom clauses) */}
        {rendered.customClauses.length > 0 && (
          <div className="pt-5 border-t border-primary/20">
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary font-bold mb-3">Additional Terms</div>
            <p className="text-sm leading-relaxed mb-3">The following additional terms have been proposed by the Artist and form part of this Agreement upon signature by both parties:</p>
            <ol className="flex flex-col gap-2">
              {rendered.customClauses.map((clause, i) => (
                <li key={i} className="flex gap-2 text-sm leading-relaxed">
                  <span className="font-mono text-primary font-bold flex-shrink-0 w-5">{i + 1}.</span>
                  <span>{clause}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Signatures */}
        <div className="pt-5 border-t-2 border-primary">
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-on-surface-variant mb-3">Signatures</div>
          <p className="text-sm leading-relaxed mb-5">By signing this Agreement, both parties confirm that they have read, understood, and agreed to all terms set out herein.</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-primary/15 p-4">
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary mb-3">Artist</div>
              <div className="text-sm font-medium mb-0.5">Name: {rendered.signatureBlock.artistName}</div>
              {rendered.signatureBlock.artistLocation && (
                <div className="text-sm text-on-surface-variant mb-4">Location: {rendered.signatureBlock.artistLocation}</div>
              )}
              <div className="border-b border-primary/20 mt-8 mb-1" />
              <div className="font-mono text-[9px] text-on-surface-variant">Signature / Date</div>
            </div>
            <div className="rounded-lg border border-primary/15 p-4">
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary mb-3">Client</div>
              <div className="text-sm font-medium mb-4">Name: {rendered.signatureBlock.audienceName}</div>
              <div className="border-b border-primary/20 mt-8 mb-1" />
              <div className="font-mono text-[9px] text-on-surface-variant">Signature / Date</div>
            </div>
          </div>
          <div className="mt-4 text-center font-mono text-[9px] text-on-surface-variant tracking-wider uppercase">
            Facilitated by Engero · engero.art · {rendered.reference}
          </div>
        </div>
      </div>
    </div>
  );
}
