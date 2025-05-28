'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import Sidebar from '../sidebar/sidebar';
import logo from '@/public/logos/federation-logo-black.png';

import classes from '@/styles/header/header.module.css';

export default function Header() {
  const { t, i18n } = useTranslation('common'); // use common namespace
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  const [scrolled, setScrolled] = useState(!isHomePage);
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setScrolled(!isHomePage);
  }, [pathname, isHomePage]);

  useEffect(() => {
    if (!isHomePage) return;

    const handleScroll = () => {
      const currentY = window.scrollY;

      setScrolled(currentY > window.innerHeight * 0.9);

      if (currentY > window.innerHeight) {
        setHidden(currentY > lastScrollY);
      } else {
        setHidden(false);
      }

      setLastScrollY(currentY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isHomePage]);

  const headerClasses = `${classes.container} ${scrolled ? classes.scrolled : ''} ${
    hidden ? classes.hidden : ''
  } ${!isHomePage ? classes.nonHomeHeader : ''}`;

  const imageClasses = `${scrolled ? classes.imageVisible : classes.imageHidden}`;

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <>
      <header className={headerClasses}>
        <Link href="/" passHref>
          <Image
            src={logo}
            alt={t('header.logoAlt')}
            width={150}
            height={150}
            className={`${imageClasses} ${classes.logoImage}`}
            priority
          />
        </Link>

        <div className={classes.navContainer}>
          <h2>{t('header.contact')}</h2>

          <div className={classes.languageSwitcher}>
            <button onClick={() => changeLanguage('en')} aria-label={t('header.languageEnglish')}>
              {t('header.languageEnglish')}
            </button>
            <span>/</span>
            <button onClick={() => changeLanguage('ka')} aria-label={t('header.languageGeorgian')}>
              {t('header.languageGeorgian')}
            </button>
          </div>

          {!isMenuOpen && (
            <button
              onClick={() => setIsMenuOpen(true)}
              className={`${classes.burgerButton} ${scrolled ? classes.burgerScrolled : ''}`}
              aria-label={t('header.openMenu')}
            >
              ☰
            </button>
          )}
        </div>
      </header>

      <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
    </>
  );
}
