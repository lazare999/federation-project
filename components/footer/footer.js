'use client';

import classes from '@/styles/footer/footer.module.css';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation('footer');

  return (
    <div className={classes.footerContainer}>
      <div>
        <h1 className={classes.title}>{t('title')}</h1>

        <div className={classes.address}>
          <p>{t('address.line1')}</p>
          <p>{t('address.line2')}</p>
        </div>

        <div className={classes.contact}>
          <p>
            <span>{t('contact.phoneLabel')}</span>593301414
          </p>
          <p>
            <span>{t('contact.emailLabel')}</span>RUSOPITSKHELAURI@GMAIL.COM
          </p>
        </div>

        <div className={classes.follow}>
          <h2>{t('follow.title')}</h2>

          <div className={classes.icons}>
            <a
              href="https://www.instagram.com/equestrian_sport_federation/"
              target="_blank"
              rel="noopener noreferrer"
              className={classes.icon}
            >
              <div className={classes.imageWrapper}>
                <Image
                  src="/social-icons/instagram-icon.png"
                  alt="Instagram icon"
                  fill
                  className={classes.image}
                />
              </div>
            </a>

            <a
              href="https://www.facebook.com/profile.php?id=100076841857599"
              target="_blank"
              rel="noopener noreferrer"
              className={classes.icon}
            >
              <div className={classes.imageWrapper}>
                <Image
                  src="/social-icons/facebook-icon.png"
                  alt="Facebook icon"
                  fill
                  className={classes.image}
                />
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
