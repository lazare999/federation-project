'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import backgroundImg from '@/public/home-page-background/home-page-background.jpg';
import logo from '@/public/logos/federation-logo-white.png';

import classes from '@/styles/home-page/homePage.module.css';
import Sponsors from './sponsors/page';

export default function Home() {
  const sponsorsRef = useRef(null);
  const { t } = useTranslation('common');

  const handleScroll = () => {
    if (sponsorsRef.current) {
      const yOffset = -100; // Adjust for any sticky header or spacing
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

      <div className={classes.content}>
        {[...Array(5)].map((_, i) => (
          <h1 key={i}>{t('home.title')}</h1>
        ))}
      </div>
    </div>
  );
}
