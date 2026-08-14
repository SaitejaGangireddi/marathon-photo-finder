'use client';
import { useState, useEffect } from 'react';
import * as faceapi from '@vladmandic/face-api';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

export default function Home() {
  const [bib, setBib] = useState('');
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Loading AI models...');

  useEffect(() => {
    const init = async () => {
      try {
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        setStatus('Ready to search');
      } catch (e) {
        setStatus('Error loading AI models. Please refresh.');
      }
    };
    init();
  }, []);

  const searchBib = async () => {
    if (!bib.trim()) return;
    setLoading(true);
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'bib', bib: bib.trim() })
    });
    const json = await res.json();
    setPhotos(json.photos || []);
    setLoading(false);
  };

  const searchSelfie = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    setStatus('Scanning face...');

    const img = await faceapi.bufferToImage(file);
    const result = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

    if (!result) {
      alert('No clear face detected in the selfie.');
      setLoading(false);
      setStatus('Ready');
      return;
    }

    setStatus('Searching photo database...');
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'face', embedding: Array.from(result.descriptor) })
    });
    const json = await res.json();
    setPhotos(json.photos || []);
    setLoading(false);
    setStatus('Ready');
  };

  return (
    <main style={{ maxWidth: '640px', margin: '40px auto', padding: '16px', fontFamily: 'system-ui, sans-serif' }}>
      <h2>Find Your Marathon Photos</h2>
      <p style={{ color: '#666', fontSize: '14px' }}>Status: {status}</p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          placeholder="Enter Bib Number"
          value={bib}
          onChange={(e) => setBib(e.target.value)}
          style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
        />
        <button onClick={searchBib} style={{ padding: '10px 16px', cursor: 'pointer' }}>Search Bib</button>
      </div>

      <div style={{ padding: '16px', border: '2px dashed #ccc', borderRadius: '8px', textAlign: 'center', marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Or Upload a Selfie:</label>
        <input type="file" accept="image/*" onChange={searchSelfie} />
      </div>

      {loading && <p>Processing search...</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
        {photos.map((src, i) => (
          <img key={i} src={src} alt="Runner" style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '6px' }} />
        ))}
      </div>
      {photos.length === 0 && !loading && <p style={{ color: '#888' }}>No photos found yet.</p>}
    </main>
  );
}
