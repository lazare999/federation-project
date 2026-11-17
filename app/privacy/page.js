import LegalPage from '@/components/legal/LegalPage';

export const metadata = {
  title: 'Privacy Policy | Georgian Equestrian Federation',
  description:
    'How the Georgian Equestrian Federation collects, uses and protects personal data.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return <LegalPage doc="privacy" />;
}
