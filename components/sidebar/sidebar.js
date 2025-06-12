'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import logo from '@/public/logos/federation-logo-white.png';
import classes from '@/styles/sidebar/sidebar.module.css';

export default function Sidebar({ isMenuOpen, setIsMenuOpen }) {
  const { t } = useTranslation('sidebar'); // loading the sidebar namespace

  return (
    <>
      {isMenuOpen && (
        <div
          className={`${classes.backdrop} ${
            isMenuOpen ? classes.backdropVisible : ''
          }`}
          onClick={() => setIsMenuOpen(false)}
        >
          <Image
            src={logo}
            alt="federation logo"
            width={100}
            height={100}
            className={classes.logoInBackdrop}
          />
        </div>
      )}

      <div
        className={`${classes.sidebar} ${
          isMenuOpen ? classes.sidebarOpen : ''
        }`}
      >
        <div className={classes.sidebarHeader}>
          <button
            onClick={() => setIsMenuOpen(false)}
            className={classes.closeButton}
            aria-label="Close menu"
          >
            <span>&#10005;</span>
          </button>
        </div>

        <div className={classes.sidebarLinks}>
          <Link href="/" onClick={() => setIsMenuOpen(false)}>
            {t('home')}
          </Link>

          <Link href="/events" onClick={() => setIsMenuOpen(false)}>
            {t('events')}
            <p>{t('eventsSub')}</p>
          </Link>

          <Link href="/horses" onClick={() => setIsMenuOpen(false)}>
            {t('horses')}
            <p>{t('horsesSub')}</p>
          </Link>

          <Link href="/gallery" onClick={() => setIsMenuOpen(false)}>
            {t('gallery')}
          </Link>
          <Link href="/standings" onClick={() => setIsMenuOpen(false)}>
            {t('standings')}
          </Link>
          <Link href="/rules" onClick={() => setIsMenuOpen(false)}>
            {t('rules')}
          </Link>
          <Link href="/sponsors" onClick={() => setIsMenuOpen(false)}>
            {t('sponsors')}
          </Link>
          <Link href="/news" onClick={() => setIsMenuOpen(false)}>
            {t('news')}
          </Link>
          <Link href="/contact" onClick={() => setIsMenuOpen(false)}>
            {t('contact')}
          </Link>
        </div>
      </div>
    </>
  );
}
