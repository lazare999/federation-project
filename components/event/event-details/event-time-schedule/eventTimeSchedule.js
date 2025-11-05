'use client';

import styles from '@/styles/events/event-time-schedule/eventTimeSchedule.module.css';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from 'react-modal';
import StartList from '../start-list-modal/startList';

// accessibility
if (typeof window !== 'undefined') {
  Modal.setAppElement('body');
}

export default function EventTimeSchedule({ event, onShowResultsTab }) {
  const { t } = useTranslation('events');
  const [modalIsOpen, setIsOpen] = useState(false);
  const [selectedComp, setSelectedComp] = useState(null);
  const [scrollPending, setScrollPending] = useState(false); // flag to scroll after tab switch

  function openModal(comp) {
    setSelectedComp(comp);
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
    setSelectedComp(null);
  }

  function scrollToResults() {
    const resultsElement = document.getElementById('results-section');
    if (resultsElement) {
      const header = document.querySelector('header'); // your fixed header selector
      const yOffset = header ? -header.offsetHeight : -80; // use header height if available
      const y =
        resultsElement.getBoundingClientRect().top +
        window.pageYOffset +
        yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  // useEffect to scroll after tab switch
  useEffect(() => {
    if (scrollPending) {
      scrollToResults();
      setScrollPending(false);
    }
  }, [scrollPending]);

  if (!event || !event.competitions?.length) {
    return <div>{t('timeSchedule.noCompetitions')}</div>;
  }

  function handleResultsClick(compId) {
    if (onShowResultsTab) onShowResultsTab(compId);
  }

  return (
    <div className={styles.scheduleContainer}>
      {event.competitions.map((comp) => {
        const dateObj = new Date(comp.date);
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = dateObj
          .toLocaleString('en-US', { month: 'short' })
          .toUpperCase();

        const hasResults = comp.results?.length > 0;

        return (
          <div key={comp.id} className={styles.scheduleItem}>
            <div className={styles.dateBox}>
              <div className={styles.dateNumber}>{day}</div>
              <div className={styles.dateMonth}>{month}</div>
            </div>

            <div className={styles.detailsBox}>
              <h3 className={styles.eventTitle}>{comp.name}</h3>
              <p className={styles.eventPresenter}>
                {t('timeSchedule.presentedBy')}
              </p>
            </div>

            <div className={styles.linksBox}>
              {/* Start List */}
              <Link
                href="#"
                className={styles.startListLink}
                onClick={(e) => {
                  e.preventDefault();
                  openModal(comp);
                }}
              >
                <span>{t('timeSchedule.startList')}</span> →
              </Link>

              {/* Results */}
              <Link
                href="#"
                className={`${styles.resultsLink} ${
                  !hasResults ? styles.disabledLink : ''
                }`}
                aria-disabled={!hasResults}
                onClick={(e) => {
                  e.preventDefault();
                  if (hasResults) handleResultsClick(comp.id);
                }}
              >
                <span>{t('timeSchedule.results')}</span> →
              </Link>
            </div>
          </div>
        );
      })}

      {/* Modal for Start List */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Start List Modal"
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            transform: 'translate(-50%, -50%)',
            padding: '2rem',
            borderRadius: '12px',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
          },
          overlay: {
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 1000,
          },
        }}
      >
        {selectedComp && <StartList competition={selectedComp} />}
        <button onClick={closeModal} className={styles.closeButton}>
          ×
        </button>
      </Modal>
    </div>
  );
}
