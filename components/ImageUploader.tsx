/* eslint-disable @next/next/no-img-element */
import React, { useRef } from 'react';
import { ImageUploaderProps } from '../types';
import { validateImageFile } from '../utils/imageUtils';

const ImageUploader: React.FC<ImageUploaderProps> = ({
  uploadedImage,
  isLoading,
  onFileChange,
  onRemoveImage
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate the file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      alert(validation.message);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Pass the file to the parent component
    onFileChange(file);
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemoveImage();
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="image-upload-container">
      <div
        className="upload-area"
        onClick={handleUploadClick}
      >
        {uploadedImage ? (
          <>
            <img
              src={uploadedImage}
              alt="Yüklenen görsel"
              className="uploaded-image"
            />
            <button
              className="remove-image-btn"
              onClick={handleRemoveClick}
              disabled={isLoading}
            >
              ✕
            </button>
          </>
        ) : (
          <div className="upload-placeholder">
            <span>Görsel Yükle (Opsiyonel)</span>
            <p>veya buraya sürükle bırak</p>
          </div>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          style={{ display: 'none' }}
          disabled={isLoading}
        />
      </div>
    </div>
  );
};

export default ImageUploader;