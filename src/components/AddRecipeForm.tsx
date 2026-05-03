'use client';

import React, { useState } from 'react';
import styles from './AddRecipeForm.module.css';

interface AddRecipeFormProps {
  onRecipeAdded: () => void;
}

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        const MAX_DIMENSION = 2000;
        
        if (width > height && width > MAX_DIMENSION) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else if (height > MAX_DIMENSION) {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Vercel payload limit is 4.5MB. Aim for ~3.5MB base64 length max.
        const MAX_B64_LENGTH = 3.5 * 1024 * 1024;
        let quality = 0.85;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        
        while (dataUrl.length > MAX_B64_LENGTH && quality > 0.1) {
          quality -= 0.15;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function AddRecipeForm({ onRecipeAdded }: AddRecipeFormProps) {
  const [activeTab, setActiveTab] = useState<'url' | 'image'>('image');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ingest/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      if (data.success) {
        setUrl('');
        onRecipeAdded();
      } else {
        setError(data.error || 'Failed to add recipe');
      }
    } catch (err) {
      setError('An error occurred while adding the recipe');
    } finally {
      setLoading(false);
    }
  };

  const processFile = async (file?: File) => {
    if (!file) return;

    setImageFile(file);
    setLoading(true);
    setError(null);

    try {
      const base64Image = await compressImage(file);
      setImagePreview(base64Image);
      
      const res = await fetch('/api/ingest/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: base64Image,
          mimeType: 'image/jpeg'
        }),
      });

      const data = await res.json();
      if (data.success) {
        setImageFile(null);
        setImagePreview(null);
        onRecipeAdded();
      } else {
        setError(data.error || 'Failed to process image');
        setImagePreview(null);
      }
    } catch (err) {
      setError('An error occurred while processing image');
      setImagePreview(null);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    processFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'image' ? styles.tabSelected : ''}`}
          onClick={() => setActiveTab('image')}
        >
          From Image
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'url' ? styles.tabSelected : ''}`}
          onClick={() => setActiveTab('url')}
        >
          From URL
        </button>
      </div>

      {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}

      {activeTab === 'url' ? (
        <form onSubmit={handleUrlSubmit} className={styles.inputGroup}>
          <input
            type="url"
            placeholder="https://example.com/recipe"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={styles.input}
            disabled={loading}
            required
          />
          <button type="submit" className={styles.button} disabled={loading || !url}>
            {loading ? 'Adding...' : 'Add'}
          </button>
        </form>
      ) : (
        <div>
          <label 
            className={styles.imageUploadArea}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageChange} 
              className={styles.fileInput}
              disabled={loading}
            />
            <div>
              {loading ? 'Processing Image...' : 'Click or Drag to Upload Recipe Image'}
            </div>
          </label>
        </div>
      )}
      
      {loading && (
        <div className={styles.loadingText}>
          <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <style>{`.spinner{transform-origin:center;animation:spinner 0.75s infinite linear}@keyframes spinner{100%{transform:rotate(360deg)}}`}</style>
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="36 12" className="spinner"/>
          </svg>
          <span>Analyzing recipe with Gemini...</span>
        </div>
      )}
    </div>
  );
}
