'use client';

import ContactContainer from '@/components/contact/contact-container/contactContainer';
import classes from '@/styles/contact/contact-page/contactPage.module.css';
import { useTranslation } from 'react-i18next';

export default function Contact() {
  const { t } = useTranslation('contact');

  return (
    <div className={classes.container}>
      <h1 className={classes.title}>{t('page.title')}</h1>
      <ContactContainer />
    </div>
  );
}
