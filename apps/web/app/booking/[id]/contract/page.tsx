import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getBooking } from '@/lib/services/bookings';
import { Lbl, Btn } from '@/app/components/booking/ui';
import { ContractDocument } from '@/app/components/booking/ContractDocument';
import { ClauseEditor } from '@/app/components/booking/ClauseEditor';
import { SignedCopyUpload } from '@/app/components/booking/SignedCopyUpload';
import { ContractStatusBanner } from '@/app/components/booking/ContractStatusBanner';
import { TemplateTypeSelector } from '@/app/components/booking/TemplateTypeSelector';
import { selectTemplate } from '@/lib/services/contracts';

export default async function ContractPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?redirect=/booking/${params.id}/contract`);

  const result = await getBooking(params.id, user.id);
  if (!result.ok) return notFound();

  const { booking, contract, role } = result;
  if (!contract) return notFound();

  const canUploadArtist = !contract.artist_signed_url && (booking.state === 'CONTRACT_SENT' || booking.state === 'AUDIENCE_UPLOADED');
  const canUploadAudience = !contract.audience_signed_url && (booking.state === 'CONTRACT_SENT' || booking.state === 'AUDIENCE_UPLOADED');

  return (
    <div className="bg-[#fcf9f8] min-h-screen text-[#1c1b1b] font-sans">
      <nav className="bg-white shadow-sm sticky top-0 z-10 w-full border-b border-primary/10">
        <div className="flex justify-between items-center w-full px-4 md:px-10 h-16 max-w-3xl mx-auto">
          <Link href="/" className="text-lg font-bold text-primary">Engero</Link>
          <Link href={`/booking/${booking.id}`} className="text-xs font-mono uppercase tracking-[0.2em] text-primary border border-primary px-4 py-2 rounded-lg hover:bg-primary hover:text-white transition-colors">
            Back to booking
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 md:px-10 py-10 flex flex-col gap-6">
        <ContractStatusBanner state={booking.state} role={role} />

        {role === 'artist' && booking.state === 'CONTRACT_DRAFT' && (() => {
          const pkg = (booking as unknown as { packages: { id: string; name: string; description: string | null; duration: string | null; product_type: 'service' | 'digital' | 'merchandise'; cancellation_terms: import('@/lib/services/contracts').CancellationTerms | null } | null }).packages;
          const autoType = pkg ? selectTemplate(pkg) ?? contract.template_type : contract.template_type;
          return (
            <>
              <TemplateTypeSelector
                bookingId={booking.id}
                currentType={contract.template_type}
                autoSelectedType={autoType}
              />
              <ClauseEditor bookingId={booking.id} initialClauses={contract.custom_clauses ?? []} />
            </>
          );
        })()}

        <ContractDocument contract={contract} />

        {contract.generated_pdf_url && (
          <a href={`/api/bookings/${booking.id}/contract/pdf`} target="_blank" rel="noreferrer">
            <Btn variant="tealOutline" full>Download contract PDF</Btn>
          </a>
        )}

        {(['CONTRACT_SENT', 'AUDIENCE_UPLOADED', 'CONTRACT_SIGNED', 'CONFIRMING', 'COMPLETED', 'AUTO_RELEASED'] as const).includes(booking.state as never) && (
          <div className="rounded-xl border border-primary/10 bg-white p-6">
            <Lbl>Signed copies</Lbl>
            <div className="flex gap-4 mt-2">
              <SignedCopyUpload
                bookingId={booking.id}
                role="artist"
                label="Artist signature"
                signedUrl={contract.artist_signed_url}
                canUpload={role === 'artist' && canUploadArtist}
              />
              <SignedCopyUpload
                bookingId={booking.id}
                role="audience"
                label="Client signature"
                signedUrl={contract.audience_signed_url}
                canUpload={role === 'audience' && canUploadAudience}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
