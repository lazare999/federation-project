'use client';

import { getSponsors } from '@/actions/sponsor-actions/sponsorActions';
import Loader from '@/components/loader/loader';
import classes from '@/styles/sponsors/sponsors-list/sponsorsList.module.css';
import { useEffect, useState } from 'react';

export default function SponsorsList() {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        const sponsorsFromDB = await getSponsors();
        setSponsors(sponsorsFromDB);
      } catch (error) {
        console.error('Failed to fetch sponsors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSponsors();
  }, []);

  if (loading) return <Loader />;

  return (
    <section className={classes.container}>
      <h2 className={classes.heading}>PARTNERS</h2>
      <div className={classes.underline}></div>
      <div className={classes.grid}>
        {sponsors.map((sponsor) => (
          <a
            key={sponsor.$id}
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
        <button className={classes.joinButton}>JOIN OUR FAMILY</button>
      </div>
    </section>
  );
}
