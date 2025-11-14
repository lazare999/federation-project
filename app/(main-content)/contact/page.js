'use client';

import ContactContainer from '@/components/contact/contact-container/contactContainer';
import classes from '@/styles/contact/contact-page/contactPage.module.css';
import { useTranslation } from 'react-i18next';

export const metadata = {
  title: 'Contact | Georgian Equestrian Federation',
  description:
    'Contact the Georgian Equestrian Federation for inquiries about horses, events, membership, and equestrian activities in Georgia.',
  keywords: [
    'georgian equestrian federation contact',
    'contact equestrian federation georgia',
    'horse federation georgia',
  ],
  openGraph: {
    title: 'Contact Georgian Equestrian Federation',
    description:
      'Get in touch with the Georgian Equestrian Federation for all equestrian-related questions.',
    url: 'https://georgianequestrianfederation.ge/contact',
    type: 'website',
  },
};

export default function Contact() {
  const { t } = useTranslation('contact');

  return (
    <div className={classes.container}>
      <h1 className={classes.title}>{t('page.title')}</h1>
      <ContactContainer />
    </div>
  );
}
