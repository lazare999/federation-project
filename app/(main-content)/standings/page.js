'use client';

import classes from '@/styles/standings/standing-page/standingsPage.module.css';
import { useTranslation } from 'react-i18next';

export default function Standings() {
  const { t } = useTranslation('standings');

  return (
    <div className={classes.placeholder}>
      <h2 className={classes.message}>{t('comingSoon')}</h2>

      {/* <div className={classes.container}>
        <h2 className={classes.title}>STANDINGS</h2>
        <div className={classes.dropdownWrapper}>
          <select className={classes.select}>
            <option>SEASON 2024</option>
            <option>SEASON 2023</option>
          </select>
        </div>
        <StandingsTable /> 
      </div> */}
    </div>
  );
}
