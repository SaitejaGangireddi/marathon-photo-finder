'use client';

import { useState } from 'react';
import Script from 'next/script';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

export default function Home() {
  const [bib, setBib] = useState('');
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [status, setStatus] = useState('Loading AI Models...');

  const initFaceApi = async () => {
    try {
      if (!window.faceapi) return;
      setStatus('Loading models...');
      await Promise.all([
        window.faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setModelReady(true);
      setStatus('Ready to search');
    } catch (e) {
      console.error(e);
      setStatus('Error loading AI models. Please refresh.');
    }
  };

  const searchBib = async (e) => {
    e?.preventDefault();
    if (!bib.trim()) return;
    setLoading(true);
    setStatus('Searching by BIB...');
    setPhotos([]);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'bib', bib: bib.trim() }),
      });
      const json = await res.json();
      setPhotos(json.photos || []);
      setStatus(json.photos?.length ? `Found ${json.photos.length} photo(s)` : 'No photos found.');
    } catch (err) {
      console.error(err);
      setStatus('Search failed.');
    } finally {
      setLoading(false);
    }
  };

  const searchSelfie = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !window.faceapi || !modelReady) return;

    setLoading(true);
    setStatus('Detecting face...');
    setPhotos([]);

    try {
      const img = await window.faceapi.bufferToImage(file);
      const detection = await window.faceapi
        .detectSingleFace(img, new window.faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setStatus('No face found in uploaded selfie. Try another photo.');
        setLoading(false);
        return;
      }

      setStatus('Searching database for matches...');
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'face',
          embedding: Array.from(detection.descriptor),
        }),
      });

      const json = await res.json();
      setPhotos(json.photos || []);
      setStatus(json.photos?.length ? `Found ${json.photos.length} photo(s)` : 'No matching photos found.');
    } catch (err) {
      console.error(err);
      setStatus('Search failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.js"
        onLoad={initFaceApi}
      />

      <main style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ textAlign: 'center' }}>Photo Finder MVP</h1>
        <p style={{ textAlign: 'center', color: modelReady ? '#16a34a' : '#64748b' }}>
          <strong>Status:</strong> {status}
        </p>

        {/* BIB Search Form */}
        <form onSubmit={searchBib} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Enter Bib Number"
            value={bib}
            onChange={(e) => setBib(e.target.value)}
            style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '16px' }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}
          >
            {loading ? 'Searching...' : 'Search Bib'}
          </button>
        </form>

        {/* Selfie Upload */}
        <div style={{ padding: '20px', border: '2px dashed #cbd5e1', borderRadius: '8px', textAlign: 'center', marginBottom: '30px' }}>
          <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Upload Selfie:</p>
          <input
            type="file"
            accept="image/*"
            disabled={!modelReady || loading}
            onChange={searchSelfie}
          />
        </div>

        {/* Results Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
          {photos.map((url, i) => (
            <div key={i} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              <img src={url} alt={`Match ${i + 1}`} style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }} />
            </div>
          ))}
        </div>
      </main>
    </>
  );
}