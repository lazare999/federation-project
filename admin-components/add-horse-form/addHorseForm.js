'use client';

// import { addHorse } from '@/actions/horse-action/horseAction';
import Dropzone from '@/admin-components/add-images/Dropzone';
import { useState } from 'react';

import classes from '@/styles/admin/admin-horse-form/adminHorseForm.module.css';

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

  const [buttonText, setButtonText] = useState('Submit Horse');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setIsSubmitting(true);
    setButtonText('Submitting...');

    try {
      const result = await addHorse(formData);
      console.log('Horse submitted successfully:', result);

      setButtonText('Submitted Successfully!');

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

      // Immediately reset button text
      setButtonText('Submit Horse');
    } catch (error) {
      console.error('Error submitting horse:', error);
      setButtonText('Submit Horse');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={classes.container}>
        {/* English Section */}
        <div>
          <h2>English Content</h2>
          <div className={classes.inputContainer}>
            <label>Horse Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className={classes.inputContainer}>
            <label>Birth Year</label>
            <input
              type="number"
              name="birthYear"
              value={formData.birthYear}
              onChange={handleChange}
              max={new Date().getFullYear()}
              required
            />
          </div>

          <div className={classes.inputContainer}>
            <label>Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
            >
              <option value="">Select gender</option>
              <option value="Mare">Mare</option>
              <option value="Stallion">Stallion</option>
              <option value="Gelding">Gelding</option>
            </select>
          </div>

          <div className={classes.inputContainer}>
            <label>Color</label>
            <input
              type="text"
              name="color"
              value={formData.color}
              onChange={handleChange}
              required
            />
          </div>

          <div className={classes.inputContainer}>
            <label>Studbook</label>
            <input
              type="text"
              name="studbook"
              value={formData.studbook}
              onChange={handleChange}
              required
            />
          </div>

          <div className={classes.inputContainer}>
            <label>Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select a category</option>
              <option value="SHOW HORSES">SHOW HORSES</option>
              <option value="SCHOOL HORSES">SCHOOL HORSES</option>
              <option value="RETIRED HORSES">RETIRED HORSES</option>
            </select>
          </div>
        </div>

        {/* Georgian Section */}
        <div>
          <h2>Georgian Content</h2>
          <div className={classes.inputContainer}>
            <label>სახელი (Name)</label>
            <input
              type="text"
              name="geo.name"
              value={formData.geo.name}
              onChange={handleChange}
            />
          </div>

          <div className={classes.inputContainer}>
            <label>სქესი (Gender)</label>
            <select
              name="geo.gender"
              value={formData.geo.gender}
              onChange={handleChange}
            >
              <option value="">აირჩიეთ სქესი</option>
              <option value="ფაშატი">ფაშატი</option>
              <option value="ულაყი">ულაყი</option>
              <option value="იაბო">იაბო</option>
            </select>
          </div>

          <div className={classes.inputContainer}>
            <label>ფერი (Color)</label>
            <input
              type="text"
              name="geo.color"
              value={formData.geo.color}
              onChange={handleChange}
            />
          </div>

          <div className={classes.inputContainer}>
            <label>კატეგორია (Category)</label>
            <select
              name="geo.category"
              value={formData.geo.category}
              onChange={handleChange}
            >
              <option value="">აირჩიეთ კატეგორია</option>
              <option value="საჩვენებელი ცხენები">სპორტული ცხენები</option>
              <option value="სასწავლო ცხენები">სასწავლო ცხენები</option>
              <option value="პენსიაზე გასული ცხენები">
                პენსიაზე გასული ცხენები
              </option>
            </select>
          </div>
        </div>
      </div>

      <Dropzone
        name="images"
        label="Upload Horse Images"
        onDrop={handleDrop}
        required
      />

      <button type="submit" disabled={isSubmitting} className={classes.button}>
        {buttonText}
      </button>
    </form>
  );
}
