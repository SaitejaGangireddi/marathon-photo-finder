'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';

export default function Home() {
  const [modelLoaded, setModelLoaded] = useState(false);
  const [status, setStatus] = useState('Loading AI Models...');
  const [bibInput, setBibInput] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Initialize face-api models
  const initFaceApi = async () => {
    try {
      if (!window.faceapi) {
        setStatus('Failed to load Face API script.');
        return;
      }
      
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
      
      setStatus('Loading neural network weights...');
      await Promise.all([
        window.faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);

      setModelLoaded(true);
      setStatus('Ready');
    } catch (err) {
      console.error(err);
      setStatus(`Error loading models: ${err.message || 'Check connection'}`);
    }
  };

  // Search by Bib Number
  const handleBibSearch = async (e) => {
    e.preventDefault();
    if (!bibInput.trim()) return;

    setSearching(true);
    setStatus('Searching by BIB...');
    setResults([]);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'bib', bib: bibInput.trim() })
      });
      const data = await res.json();
      setResults(data.photos || []);
      setStatus(data.photos?.length ? `Found ${data.photos.length} photos` : 'No photos found');
    } catch (err) {
      setStatus('Search failed');
    } finally {
      setSearching(false);
    }
  };

  // Search by Uploaded Selfie
  const handleSelfieUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSearching(true);
    setStatus('Analyzing selfie face...');
    setResults([]);

    try {
      const img = await window.faceapi.bufferToImage(file);
      const detection = await window.faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setStatus('No face detected in selfie. Please try a clearer photo.');
        setSearching(false);
        return;
      }

      setStatus('Matching race photos...');
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'face',
          embedding: Array.from(detection.descriptor)
        })
      });

      const data = await res.json();
      setResults(data.photos || []);
      setStatus(data.photos?.length ? `Found ${data.photos.length} photos` : 'No photos found');
    } catch (err) {
      console.error(err);
      setStatus('Face search failed');
    } finally {
      setSearching(false);
    }
  };

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.js"
        onLoad={initFaceApi}
      />

      <main style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px', fontFamily: 'sans-serif' }}>
        <h1 style={{ textAlign: 'center' }}>Find Your Marathon Photos</h1>
        <p style={{ textAlign: 'center', color: modelLoaded ? '#16a34a' : '#64748b' }}>
          <strong>Status:</strong> {status}
        </p>

        <form onSubmit={handleBibSearch} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Enter Bib Number"
            value={bibInput}
            onChange={(e) => setBibInput(e.target.value)}
            style={{ flex: 1, padding: '12px', fontSize: '16px', borderRadius: '6px', border: '1px solid #ccc' }}
          />
          <button
            type="submit"
            disabled={searching}
            style={{ padding: '12px 24px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {searching ? 'Searching...' : 'Search Bib'}
          </button>
        </form>

        <div style={{ textAlign: 'center', margin: '30px 0', border: '2px dashed #cbd5e1', padding: '24px', borderRadius: '8px' }}>
          <p style={{ margin: '0 0 12px 0', fontWeight: 'bold' }}>Or Upload a Selfie:</p>
          <input
            type="file"
            accept="image/*"
            disabled={!modelLoaded || searching}
            onChange={handleSelfieUpload}
            style={{ fontSize: '15px' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px', marginTop: '30px' }}>
          {results.map((url, idx) => (
            <div key={idx} style={{ borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <img src={url} alt={`Match ${idx + 1}`} style={{ width: '100%', height: '240px', objectFit: 'cover', display: 'block' }} />
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
