'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import logo from '@/public/logos/federation-logo-black.png';
import Sidebar from '../sidebar/sidebar';
import classes from '@/styles/header/header.module.css';

export default function Header() {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  const [scrolled, setScrolled] = useState(!isHomePage); // default state based on route
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Reset scroll state when route changes
  useEffect(() => {
    setScrolled(!isHomePage); // reset scroll based on new route
  }, [pathname]);

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

  const headerClasses = `${classes.container} ${scrolled ? classes.scrolled : ''} ${hidden ? classes.hidden : ''} ${!isHomePage ? classes.nonHomeHeader : ''}`;

  const imageClasses = `${scrolled ? classes.imageVisible : classes.imageHidden}`;

  return (
    <>
      <div className={headerClasses}>
       <Image
  src={logo}
  alt="Logo"
  width={150}
  height={150}
  className={`${imageClasses} ${classes.logoImage}`}
  priority
/>
        <div className={classes.navContainer}>
          <h2>contact</h2>
          <h5>EN/GEO</h5>
          {!isMenuOpen && (
            <button
              onClick={() => setIsMenuOpen(true)}
              className={`${classes.burgerButton} ${scrolled ? classes.burgerScrolled : ''}`}
              aria-label="Open menu"
            >
              ☰
            </button>
          )}
        </div>
      </div>

      <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
    </>
  );
}
