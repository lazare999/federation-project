'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

import logo from '@/public/logos/federation-logo-white.png';

import classes from '@/styles/home-page/homePage.module.css';

export default function Home() {
  const scrollRef = useRef(null);
  const { t } = useTranslation('common');

  const handleScroll = () => {
    if (scrollRef.current) {
      window.scrollTo({
        top: scrollRef.current.offsetTop,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className={classes.container}>
      <div className={classes.imgContainer}>
        <Image
          src={logo}
          alt={t('home.logoAlt')}
          width={300}
          height={300}
          className={classes.logoImage}
        />

        <div className={classes.bottomScrollSection} onClick={handleScroll}>
          <span className={classes.arrow}>&#8595;</span>
          <h2 className={classes.scrollText}>{t('home.scrollText')}</h2>
        </div>
      </div>
      <div ref={scrollRef} className={classes.content}>
        {[...Array(5)].map((_, i) => (
          <h1 key={i}>{t('home.title')}</h1>
        ))}
      </div>
    </div>
  );
}
