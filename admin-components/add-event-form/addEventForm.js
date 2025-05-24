"use client";

import React, { useState } from "react";
import { addEvent } from "@/actions/event-actions/eventActions";

import Dropzone from "@/admin-components/add-images/Dropzone";

export default function AddEventForm() {
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    images: [],
  });

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
  try {
    const result = await addEvent(formData);
    console.log("Event submitted successfully:", result);
    // Optionally reset form or show a success message
  } catch (error) {
    console.error("Error submitting event:", error);
  }
};
  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Event Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div>
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

        <button type="submit">Submit Event</button>
      </form>
    </div>
  );
}
