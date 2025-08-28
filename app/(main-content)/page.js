'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import backgroundImg from '@/public/home-page-background/home-page-background.jpg';
import logo from '@/public/logos/federation-logo-white.png';

import EventCarousel from '@/components/event/event-carousel/eventCarousel';
import HorseCarousel from '@/components/horses/horse-carousel/horseCarousel';
import NewsCarousel from '@/components/news/news-carousel/newsCarousel';
import classes from '@/styles/home-page/homePage.module.css';
import Sponsors from './sponsors/page';

export default function Home() {
  const sponsorsRef = useRef(null);
  const { t } = useTranslation('common');

  const handleScroll = () => {
    if (sponsorsRef.current) {
      const yOffset = -120;
      const y =
        sponsorsRef.current.getBoundingClientRect().top +
        window.pageYOffset +
        yOffset;

      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className={classes.container}>
      <div className={classes.imgContainer}>
        <Image
          src={backgroundImg}
          alt="Background"
          fill
          priority
          className={classes.backgroundImage}
        />
        <div className={classes.overlay} />
        <div className={classes.foreground}>
          <Image
            src={logo}
            alt={t('home.logoAlt')}
            className={classes.logoImage}
          />
          <div className={classes.bottomScrollSection} onClick={handleScroll}>
            <span className={classes.arrow}>&#8595;</span>
            <h2 className={classes.scrollText}>{t('home.scrollText')}</h2>
          </div>
        </div>
      </div>

      <div ref={sponsorsRef}>
        <Sponsors />
      </div>

      <Link href="/horses">
        <h1 className={classes.title}>{t('home.horses')}</h1>
      </Link>
      <HorseCarousel />

      <Link href="/events">
        <h1 className={classes.title}>{t('home.events')}</h1>
      </Link>
      <EventCarousel />

      <Link href="/news">
        <h1 className={classes.newsTitle}>{t('home.news')}</h1>
      </Link>
      <NewsCarousel />
    </div>
  );
}
