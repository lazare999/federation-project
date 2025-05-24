'use client';

import Link from 'next/link';
import Image from 'next/image';

import logo from '@/public/logos/federation-logo-white.png';

import classes from '@/styles/sidebar/sidebar.module.css';

export default function Sidebar({ isMenuOpen, setIsMenuOpen }) {
  return (
    <>
      {isMenuOpen && (
        <div
  className={`${classes.backdrop} ${
    isMenuOpen ? classes.backdropVisible : ''
  }`}
  onClick={() => setIsMenuOpen(false)}
><Image src={logo} alt='federation logo' width={100} height={100} className={classes.logoInBackdrop}/></div>
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
            ×
          </button>
        </div>
        <div className={classes.sidebarLinks}>
          <Link href="/" onClick={() => setIsMenuOpen(false)}>
            HOME
          </Link>
          <Link href="/events" onClick={() => setIsMenuOpen(false)}>
            EVENTS
            <p>PREVIOUS / UPCOMING</p>
          </Link>
          <Link href="/horses" onClick={() => setIsMenuOpen(false)}>
            HORSES
            <p>SHOWHORSES / SCHOOLHORSES / RETIREDHORSES</p>
          </Link>
          <Link href="/gallery" onClick={() => setIsMenuOpen(false)}>
            GALLERY
          </Link>
          <Link href="/standings" onClick={() => setIsMenuOpen(false)}>
            STANDINGS
          </Link>
          <Link href="/rules" onClick={() => setIsMenuOpen(false)}>
            RULES & REGULATIONS
          </Link>
          <Link href="/sponsors" onClick={() => setIsMenuOpen(false)}>
            SPONSORS
          </Link>
          <Link href="/news" onClick={() => setIsMenuOpen(false)}>
            NEWS
          </Link>
          <Link href="/contact" onClick={() => setIsMenuOpen(false)}>
            CONTAC
          </Link>
        </div>
      </div>
    </>
  );
}
