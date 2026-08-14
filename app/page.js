'use client';

import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [status, setStatus] = useState('Loading AI Models...');
  const [isModelReady, setIsModelReady] = useState(false);
  const [bibInput, setBibInput] = useState('');
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        if (typeof window !== 'undefined' && window.faceapi) {
          const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
          await window.faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
          await window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
          await window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
          setIsModelReady(true);
          setStatus('Ready');
        } else {
          setTimeout(loadModels, 500);
        }
      } catch (err) {
        setStatus('Error loading AI models. Please refresh.');
      }
    };
    loadModels();
  }, []);

  const handleBibSearch = async (e) => {
    e.preventDefault();
    if (!bibInput.trim()) return;

    setLoading(true);
    setStatus('Searching by BIB number...');
    setPhotos([]);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'bib', bib: bibInput.trim() }),
      });
      const data = await res.json();
      setPhotos(data.photos || []);
      setStatus(data.photos?.length ? `Found ${data.photos.length} photos` : 'No photos found');
    } catch (err) {
      setStatus('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelfieUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !isModelReady) return;

    setLoading(true);
    setStatus('Scanning face from photo...');
    setPhotos([]);

    try {
      const img = await window.faceapi.bufferToImage(file);
      const detection = await window.faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setStatus('No clear face detected in the uploaded photo. Please try a clearer selfie.');
        setLoading(false);
        return;
      }

      setStatus('Matching against event photos...');
      const embedding = Array.from(detection.descriptor);

      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'face', embedding }),
      });

      const data = await res.json();
      setPhotos(data.photos || []);
      setStatus(data.photos?.length ? `Found ${data.photos.length} photos` : 'No matching photos found');
    } catch (err) {
      setStatus('Error processing selfie. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px' }}>Find Your Marathon Photos</h1>
      <p style={{ color: '#64748b', marginBottom: '24px' }}>Status: <strong>{status}</strong></p>

      <form onSubmit={handleBibSearch} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Enter Bib Number"
          value={bibInput}
          onChange={(e) => setBibInput(e.target.value)}
          style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ padding: '12px 24px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
        >
          Search Bib
        </button>
      </form>

      <div style={{ border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '24px', textAlign: 'center', backgroundColor: '#fff', marginBottom: '32px' }}>
        <p style={{ margin: '0 0 12px 0', fontWeight: '600' }}>Or Upload a Selfie:</p>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleSelfieUpload}
          disabled={!isModelReady || loading}
          style={{ cursor: 'pointer' }}
        />
      </div>

      {photos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
          {photos.map((url, idx) => (
            <div key={idx} style={{ borderRadius: '12px', overflow: 'hidden', backgroundColor: '#fff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
              <img
                src={url}
                alt="Matched marathon runner"
                style={{ width: '100%', height: '260px', objectFit: 'cover', display: 'block' }}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
