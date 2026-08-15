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
      setStatus('Loading facial recognition models...');
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
    setStatus('Searching by BIB number...');
    setPhotos([]);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'bib', bib: bib.trim() }),
      });
      const json = await res.json();
      const items = (json.photos || []).map(url => ({ url, confidence: null }));
      setPhotos(items);
      setStatus(items.length ? `Found ${items.length} photo(s)` : 'No photos found for this BIB.');
    } catch (err) {
      console.error(err);
      setStatus('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const searchSelfie = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !window.faceapi || !modelReady) return;

    setLoading(true);
    setStatus('Analyzing face...');
    setPhotos([]);

    try {
      const img = await window.faceapi.bufferToImage(file);
      
      const options = new window.faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });
      const detection = await window.faceapi
        .detectSingleFace(img, options)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setStatus('No clear face detected in the photo. Try another front-facing selfie.');
        setLoading(false);
        return;
      }

      setStatus('Matching face across database photos...');
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'face',
          embedding: Array.from(detection.descriptor),
        }),
      });

      const json = await res.json();
      const results = json.results || [];
      setPhotos(results);
      setStatus(results.length ? `Found ${results.length} matching photo(s)` : 'No matching photos found.');
    } catch (err) {
      console.error(err);
      setStatus('Face search failed. Please try again.');
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

      <main style={{ maxWidth: '850px', margin: '40px auto', padding: '0 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '8px' }}>Find Your Race & Event Photos</h1>
        <p style={{ textAlign: 'center', color: modelReady ? '#16a34a' : '#64748b', margin: '0 0 24px 0', fontSize: '15px' }}>
          <strong>Status:</strong> {status}
        </p>

        {/* BIB Search */}
        <form onSubmit={searchBib} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Enter Bib Number"
            value={bib}
            onChange={(e) => setBib(e.target.value)}
            style={{ flex: 1, padding: '12px 16px', fontSize: '16px', borderRadius: '8px', border: '1px solid #d1d5db' }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '12px 24px', cursor: loading ? 'not-allowed' : 'pointer', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600 }}
          >
            {loading ? 'Searching...' : 'Search Bib'}
          </button>
        </form>

        {/* Selfie Upload */}
        <div style={{ padding: '24px', border: '2px dashed #cbd5e1', borderRadius: '12px', textAlign: 'center', marginBottom: '32px', backgroundColor: '#f8fafc' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 600, fontSize: '16px', color: '#334155' }}>
            Or Upload a Selfie / Face Photo:
          </label>
          <input
            type="file"
            accept="image/*"
            disabled={!modelReady || loading}
            onChange={searchSelfie}
            style={{ fontSize: '15px', cursor: !modelReady || loading ? 'not-allowed' : 'pointer' }}
          />
        </div>

        {/* Results Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
          {photos.map((item, i) => (
            <div key={i} style={{ borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', backgroundColor: '#fff', border: '1px solid #e2e8f0' }}>
              <img src={item.url} alt={`Match ${i + 1}`} style={{ width: '100%', height: '240px', objectFit: 'cover', display: 'block' }} />
              {item.confidence && (
                <div style={{ padding: '8px 12px', fontSize: '13px', color: '#0f766e', backgroundColor: '#f0fdfa', fontWeight: 600, textAlign: 'center' }}>
                  Match Confidence: {item.confidence}%
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}