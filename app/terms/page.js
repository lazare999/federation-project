import LegalPage from '@/components/legal/LegalPage';

export const metadata = {
  title: 'Terms of Service | Georgian Equestrian Federation',
  description:
    'Terms of Service of the Georgian Equestrian Federation: services, prices in GEL, payment, delivery and refund policy.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return <LegalPage doc="terms" />;
}
