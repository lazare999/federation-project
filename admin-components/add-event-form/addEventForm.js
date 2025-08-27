'use client';

// import { addEvent } from '@/actions/event-actions/eventActions';
import { useState } from 'react';

import Dropzone from '@/admin-components/add-images/Dropzone';

import classes from '@/styles/admin/admin-event-form/adminEventForm.module.css';

export default function AddEventForm() {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    images: [],
  });

  const [buttonText, setButtonText] = useState('Submit Event');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDrop = (acceptedFiles) => {
    setFormData((prev) => ({
      ...prev,
      images: acceptedFiles,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setButtonText('Submitting...');

    try {
      const result = await addEvent(formData);
      console.log('Event submitted successfully:', result);

      setButtonText('Submitted Successfully!');
      setFormData({ title: '', date: '', images: [] });

      // ✅ Immediately reset back to default state
      setButtonText('Submit Event');
    } catch (error) {
      console.error('Error submitting event:', error);
      setButtonText('Submit Event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className={classes.inputContainer}>
          <label>Event Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className={classes.inputContainer}>
          <label>Event Date</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        <Dropzone
          name="images"
          label="Upload Event Images"
          onDrop={handleDrop}
          required
        />

        <button
          type="submit"
          className={classes.button}
          disabled={isSubmitting}
        >
          {buttonText}
        </button>
      </form>
    </div>
  );
}
