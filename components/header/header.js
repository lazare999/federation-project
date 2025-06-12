'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import logo from '@/public/logos/federation-logo-black.png';
import Sidebar from '../sidebar/sidebar';

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

      setScrolled(currentY > window.innerHeight * 0.8);

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

  const headerClasses = `${classes.container} ${
    scrolled ? classes.scrolled : ''
  } ${hidden ? classes.hidden : ''} ${
    !isHomePage ? classes.nonHomeHeader : ''
  }`;

  const imageClasses = `${
    scrolled ? classes.imageVisible : classes.imageHidden
  }`;

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
            className={`${imageClasses} ${classes.logoImage}`}
            priority
          />
        </Link>

        <div className={classes.navContainer}>
          <h2>{t('header.contact')}</h2>

          <div className={classes.languageSwitcher}>
            <h2
              onClick={() => changeLanguage('en')}
              className={i18n.language === 'en' ? classes.activeLang : ''}
            >
              {t('header.languageEnglish')}
            </h2>
            <span>/</span>
            <h2
              onClick={() => changeLanguage('ka')}
              className={i18n.language === 'ka' ? classes.activeLang : ''}
            >
              {t('header.languageGeorgian')}
            </h2>
          </div>

          {!isMenuOpen && (
            <button
              onClick={() => setIsMenuOpen(true)}
              className={`${classes.burgerButton} ${
                scrolled ? classes.burgerScrolled : ''
              }`}
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
