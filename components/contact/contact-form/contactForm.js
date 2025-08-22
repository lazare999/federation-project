'use client';

import classes from '@/styles/contact/contact-form/contactForm.module.css';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function ContactForm() {
  const { t } = useTranslation('contact');

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
  });
  const [status, setStatus] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(t('form.status.sending'));

    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setStatus(t('form.status.success'));
      setForm({ name: '', phone: '', email: '', message: '' });
    } else {
      setStatus(t('form.status.error'));
    }
  };

  return (
    <form className={classes.form} onSubmit={handleSubmit}>
      <div className={classes.formGroup}>
        <label htmlFor="name">{t('form.name')}</label>
        <input
          id="name"
          type="text"
          value={form.name}
          onChange={handleChange}
          required
        />
      </div>

      <div className={classes.formGroup}>
        <label htmlFor="phone">{t('form.phone')}</label>
        <input
          id="phone"
          type="text"
          value={form.phone}
          onChange={handleChange}
        />
      </div>

      <div className={classes.formGroup}>
        <label htmlFor="email">{t('form.email')}</label>
        <input
          id="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className={classes.formGroup}>
        <label htmlFor="message">{t('form.message')}</label>
        <textarea
          id="message"
          value={form.message}
          onChange={handleChange}
          required
        />
      </div>

      <button type="submit">{t('form.submit')}</button>
      {status && <p>{status}</p>}
    </form>
  );
}
