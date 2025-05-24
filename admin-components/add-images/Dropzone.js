"use client";

import React from "react";
import { useDropzone } from "react-dropzone";
import classes from "@/styles/admin/admin-add-images/adminAddImages.module.css";

function Dropzone(props) {
  const { required, name, label, open, onDrop, ...rest } = props;

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (incomingFiles) => {
      onDrop(incomingFiles);
    },
  });

  return (
    <div className={classes.dropzoneContainer}>
      <label className={classes.label}>{label}</label>
      <div {...getRootProps({ className: classes.dropzone })} {...rest}>
        <input
          type="file"
          name={name}
          required={required}
          style={{ opacity: 0 }}
          {...getInputProps()}
        />
        <p className={classes.text}>Drag and drop files here, or click to select files</p>
        <button type="button" className={classes.button} onClick={open}>
          Open File Dialog
        </button>
      </div>
    </div>
  );
}

export default Dropzone;
