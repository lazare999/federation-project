'use client';

import ContactContainer from '@/components/contact/contact-container/contactContainer';
import { LEGAL_ENTITY } from '@/lib/constants/legal';
import classes from '@/styles/contact/contact-page/contactPage.module.css';
import { useTranslation } from 'react-i18next';

export default function Contact() {
  const { t } = useTranslation('contact');
  const { t: tLegal, i18n } = useTranslation('legal');
  const isKa = (i18n.language || '').startsWith('ka');

  return (
    <div className={classes.container}>
      <h1 className={classes.title}>{t('page.title')}</h1>

      <address className={classes.details}>
        <p>
          <span>{tLegal('entity.phone')}:</span>{' '}
          <a href={`tel:${LEGAL_ENTITY.phone.replace(/\s+/g, '')}`}>
            {LEGAL_ENTITY.phone}
          </a>
        </p>
        <p>
          <span>{tLegal('entity.email')}:</span>{' '}
          <a href={`mailto:${LEGAL_ENTITY.email}`}>{LEGAL_ENTITY.email}</a>
        </p>
        <p>
          <span>{tLegal('entity.address')}:</span>{' '}
          {isKa ? LEGAL_ENTITY.addressKa : LEGAL_ENTITY.addressEn}
        </p>
      </address>

      <ContactContainer />
    </div>
  );
}
