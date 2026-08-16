'use client';

import { getSponsors } from '@/actions/sponsor-actions/sponsorActions';
import ContactContainer from '@/components/contact/contact-container/contactContainer';
import Loader from '@/components/loader/loader';
import classes from '@/styles/sponsors/sponsors-list/sponsorsList.module.css';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function SponsorsList() {
  const { t, i18n } = useTranslation('sponsors');
  const [showForm, setShowForm] = useState(false);

  const {
    data: sponsors = [],
    isLoading,
  } = useQuery({
    queryKey: ['sponsors', i18n.language],
    queryFn: getSponsors,
  });

  if (isLoading) return <Loader message={t('loading')} />;

  return (
    <section className={classes.container}>
      <h2 className={classes.heading}>{t('page.title')}</h2>
      <div className={classes.underline}></div>

      <div className={classes.grid}>
        {sponsors?.map((sponsor, index) => (
          <a
            key={sponsor.id}
            href={sponsor.link}
            target="_blank"
            rel="noopener noreferrer"
            className={classes.card}
          >
            <Image
              src={sponsor.image}
              alt={sponsor.name || 'Sponsor'}
              width={300}
              height={200}
              className={classes.image}
              unoptimized
              priority={index < 3}
            />
          </a>
        ))}
      </div>

      <div className={classes.buttonWrapper}>
        <button
          className={classes.joinButton}
          onClick={() => setShowForm((prev) => !prev)}
        >
          {t('page.joinButton')}
        </button>
      </div>

      {showForm && (
        <div className={classes.formWrapper}>
          <ContactContainer />
        </div>
      )}
    </section>
  );
}
