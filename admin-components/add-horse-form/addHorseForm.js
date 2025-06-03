'use client';

import React, { useState } from 'react';
import { addHorse } from '@/actions/horse-action/horseAction';
import Dropzone from '@/admin-components/add-images/Dropzone';
import classes from '@/styles/horses/horse-filter/hroseFilter.module.css';

export default function AddHorseForm() {
  const [formData, setFormData] = useState({
    name: '',
    birthYear: '',
    gender: '',
    color: '',
    studbook: '',
    category: '',
    images: [],
    geo: {
      name: '',
      gender: '',
      color: '',
      category: '',
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('geo.')) {
      const geoField = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        geo: {
          ...prev.geo,
          [geoField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleDrop = (acceptedFiles) => {
    setFormData((prev) => ({
      ...prev,
      images: acceptedFiles,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await addHorse(formData);
      console.log('Horse submitted successfully:', result);
      // Reset form
      setFormData({
        name: '',
        birthYear: '',
        gender: '',
        color: '',
        studbook: '',
        category: '',
        images: [],
        geo: {
          name: '',
          gender: '',
          color: '',
          category: '',
        },
      });
    } catch (error) {
      console.error('Error submitting horse:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>English Content</h2>
      <div>
        <label>Horse Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>Birth Year</label>
        <input
          type="number"
          name="birthYear"
          value={formData.birthYear}
          onChange={handleChange}
          min="1900"
          max={new Date().getFullYear()}
          required
        />
      </div>

      <div>
        <label>Gender</label>
        <select
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          className={classes.select}
          required
        >
          <option value="">Select gender</option>
          <option value="Mare">Mare</option>
          <option value="Stallion">Stallion</option>
          <option value="Gelding">Gelding</option>
        </select>
      </div>

      <div>
        <label>Color</label>
        <input
          type="text"
          name="color"
          value={formData.color}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>Studbook</label>
        <input
          type="text"
          name="studbook"
          value={formData.studbook}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>Category</label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className={classes.select}
          required
        >
          <option value="">Select a category</option>
          <option value="SHOW HORSES">SHOW HORSES</option>
          <option value="SCHOOL HORSES">SCHOOL HORSES</option>
          <option value="RETIRED HORSES">RETIRED HORSES</option>
        </select>
      </div>

      <h2>Georgian Content</h2>
      <div>
        <label>სახელი (Name)</label>
        <input
          type="text"
          name="geo.name"
          value={formData.geo.name}
          onChange={handleChange}
        />
      </div>

      <div>
        <label>სქესი (Gender)</label>
        <select
          name="geo.gender"
          value={formData.geo.gender}
          onChange={handleChange}
          className={classes.select}
        >
          <option value="">აირჩიეთ სქესი</option>
          <option value="ფაშატი">ფაშატი</option>
          <option value="ულაყი">ულაყი</option>
          <option value="იაბო">იაბო</option>
        </select>
      </div>

      <div>
        <label>ფერი (Color)</label>
        <input
          type="text"
          name="geo.color"
          value={formData.geo.color}
          onChange={handleChange}
        />
      </div>

      <div>
        <label>კატეგორია (Category)</label>
        <select
          name="geo.category"
          value={formData.geo.category}
          onChange={handleChange}
          className={classes.select}
        >
          <option value="">აირჩიეთ კატეგორია</option>
          <option value="საჩვენებელი ცხენები">სპორტული ცხენები</option>
          <option value="სასწავლო ცხენები">სასწავლო ცხენები</option>
          <option value="პენსიაზე გასული ცხენები">პენსიაზე გასული ცხენები</option>
        </select>
      </div>

      <Dropzone
        name="images"
        label="Upload Horse Images"
        onDrop={handleDrop}
        required
      />

      <button type="submit">Submit Horse</button>
    </form>
  );
}
