'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { LEGAL_ENTITY, LEGAL_UPDATED_AT } from '@/lib/constants/legal';
import { formatLongDate } from '@/lib/utils/formatDisplayDate';
import classes from '@/styles/legal/legal.module.css';

/**
 * Renders a legal document (Terms / Privacy) from the `legal` namespace:
 * <doc>.title, <doc>.intro and <doc>.sections[{ heading, paragraphs[], items[] }].
 * Company details are interpolated from LEGAL_ENTITY.
 */
export default function LegalPage({ doc }) {
  const { t, i18n } = useTranslation('legal');
  const isKa = (i18n.language || '').startsWith('ka');

  const vars = {
    legalName: isKa ? LEGAL_ENTITY.legalNameKa : LEGAL_ENTITY.legalNameEn,
    idCode: LEGAL_ENTITY.idCode,
    address: isKa ? LEGAL_ENTITY.addressKa : LEGAL_ENTITY.addressEn,
    phone: LEGAL_ENTITY.phone,
    email: LEGAL_ENTITY.email,
    website: LEGAL_ENTITY.website,
  };

  const sections = t(`${doc}.sections`, { returnObjects: true, ...vars });
  const list = Array.isArray(sections) ? sections : [];

  return (
    <div className={classes.page}>
      <article className={classes.document}>
        <h1 className={classes.title}>{t(`${doc}.title`)}</h1>
        <p className={classes.updated}>
          {t('updated', {
            date: formatLongDate(LEGAL_UPDATED_AT, isKa ? 'ka' : 'en'),
          })}
        </p>

        <p className={classes.intro}>{t(`${doc}.intro`, vars)}</p>

        <section className={classes.entity} aria-label={t('entity.title')}>
          <h2 className={classes.entityTitle}>{t('entity.title')}</h2>
          <dl className={classes.entityList}>
            <dt>{t('entity.name')}</dt>
            <dd>{vars.legalName}</dd>
            <dt>{t('entity.idCode')}</dt>
            <dd>{vars.idCode}</dd>
            <dt>{t('entity.address')}</dt>
            <dd>{vars.address}</dd>
            <dt>{t('entity.phone')}</dt>
            <dd>
              <a href={`tel:${vars.phone.replace(/\s+/g, '')}`}>{vars.phone}</a>
            </dd>
            <dt>{t('entity.email')}</dt>
            <dd>
              <a href={`mailto:${vars.email}`}>{vars.email}</a>
            </dd>
          </dl>
        </section>

        {list.map((section, index) => (
          <section key={section.heading} className={classes.section}>
            <h2 className={classes.heading}>
              {index + 1}. {section.heading}
            </h2>
            {(section.paragraphs || []).map((text) => (
              <p key={text} className={classes.paragraph}>
                {text}
              </p>
            ))}
            {section.items?.length ? (
              <ul className={classes.list}>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        <p className={classes.crossLink}>
          {doc === 'terms' ? (
            <Link href="/privacy/">{t('privacy.title')}</Link>
          ) : (
            <Link href="/terms/">{t('terms.title')}</Link>
          )}
        </p>
      </article>
    </div>
  );
}
