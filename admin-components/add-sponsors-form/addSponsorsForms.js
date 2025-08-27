'use client';

import { useState } from 'react';
import Dropzone from '../add-images/Dropzone';
// import { addSponsor } from '@/actions/sponsor-actions/sponsorActions';

export default function AddSponsorsForm() {
  const [formData, setFormData] = useState({
    name: '',
    link: '',
    image: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFormData((prev) => ({
        ...prev,
        image: acceptedFiles[0], // Only allow one image
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addSponsor(formData);
      console.log('Sponsor submitted successfully');
      // Reset form
      setFormData({
        name: '',
        link: '',
        image: null,
      });
    } catch (error) {
      console.error('Error submitting sponsor:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Add Sponsor</h2>

      <div>
        <label>Sponsor Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>Website Link</label>
        <input
          type="url"
          name="link"
          value={formData.link}
          onChange={handleChange}
          required
        />
      </div>

      <Dropzone
        name="image"
        label="Upload Sponsor Logo"
        onDrop={handleDrop}
        required
      />

      <button type="submit">Submit Sponsor</button>
    </form>
  );
}
