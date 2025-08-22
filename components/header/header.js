'use client';

import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import logo from '@/public/logos/federation-logo-black.png';
import Sidebar from '../sidebar/sidebar';

import classes from '@/styles/header/header.module.css';
import LanguageSwitcher from '../language-switcher/languageSwitcher';

export default function Header() {
  const { t, i18n } = useTranslation('common');
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  const [scrolled, setScrolled] = useState(!isHomePage);
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    setScrolled(!isHomePage);
  }, [pathname, isHomePage]);

  const isDetailsPage =
    pathname.startsWith('/events/') || pathname.startsWith('/news/');

  useEffect(() => {
    // Always show solid header on non-home pages
    if (!isHomePage) {
      setScrolled(true);
      setHidden(false);
      return;
    }

    let lastY = 0;
    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > window.innerHeight * 0.8);

      if (currentY > window.innerHeight) {
        setHidden(currentY > lastY);
      } else {
        setHidden(false);
      }

      lastY = currentY;
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname, isHomePage]);

  const headerClasses = `${classes.container} ${
    scrolled ? classes.scrolled : ''
  } ${hidden ? classes.hidden : ''} ${
    !isHomePage ? classes.nonHomeHeader : ''
  }`;

  const imageClasses = `${
    scrolled ? classes.imageVisible : classes.imageHidden
  }`;

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
          <Link href="/contact" passHref>
            <h2>{t('header.contact')}</h2>
          </Link>

          <LanguageSwitcher />

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
