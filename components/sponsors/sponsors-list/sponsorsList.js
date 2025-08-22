'use client';

import { getSponsors } from '@/actions/sponsor-actions/sponsorActions';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ContactContainer from '@/components/contact/contact-container/contactContainer';
import Loader from '@/components/loader/loader';
import classes from '@/styles/sponsors/sponsors-list/sponsorsList.module.css';

export default function SponsorsList() {
  const { t } = useTranslation('sponsors');
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        const sponsorsFromDB = await getSponsors();
        setSponsors(sponsorsFromDB);
      } catch (error) {
        console.error(t('error'), error);
      } finally {
        setLoading(false);
      }
    };

    fetchSponsors();
  }, [t]);

  if (loading) return <Loader message={t('loading')} />;

  return (
    <section className={classes.container}>
      <h2 className={classes.heading}>{t('page.title')}</h2>
      <div className={classes.underline}></div>
      <div className={classes.grid}>
        {sponsors.map((sponsor) => (
          <a
            key={sponsor.id}
            href={sponsor.link}
            target="_blank"
            rel="noopener noreferrer"
            className={classes.card}
          >
            <img src={sponsor.image} alt={sponsor.name} />
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
