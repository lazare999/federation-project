'use client';

import styles from '@/styles/sponsors/sponsors-contact/sponsorsContact.module.css';
import { useState } from 'react';

export default function SponsorsContact() {
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    message: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/send-sponsor-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (result.success) {
        alert('Email sent successfully!');
        setFormData({ companyName: '', email: '', message: '' });
      } else {
        alert('Failed to send email. Please try again.');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('An error occurred.');
    }
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.heading}>Become a Sponsor</h3>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          type="text"
          name="companyName"
          value={formData.companyName}
          onChange={handleChange}
          placeholder="Company Name"
          className={styles.input}
        />
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          className={styles.input}
        />
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder="Message"
          className={styles.textarea}
          rows={5}
        />
        <button type="submit" className={styles.button}>
          Send
        </button>
      </form>
    </div>
  );
}
