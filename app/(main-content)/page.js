'use client';

import { useRef } from 'react';
import Image from 'next/image';

import logo from '@/public/logos/federation-logo-white.png';

import classes from '@/styles/home-page/homePage.module.css';

export default function Home() {
  const scrollRef = useRef(null);

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
        {/* <h1 className={classes.title}>federation</h1> */}
       <Image
  src={logo}
  alt="federation logo"
  width={300}
  height={300}
  className={classes.logoImage}
/>
        {/* Arrow and scroll text at bottom */}
        <div className={classes.bottomScrollSection} onClick={handleScroll}>
          <span className={classes.arrow}>&#8595;</span>
          <h2 className={classes.scrollText}>SCROLL</h2>
        </div>
      </div>
      <div ref={scrollRef} className={classes.content}>
        <h1>Lazare Osiashvili</h1>
        <h1>Lazare Osiashvili</h1>
        <h1>Lazare Osiashvili</h1>
        <h1>Lazare Osiashvili</h1>
        <h1>Lazare Osiashvili</h1>
      </div>
    </div>
  );
}
