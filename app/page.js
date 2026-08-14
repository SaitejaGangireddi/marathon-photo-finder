'use client';
import { useState, useEffect } from 'react';
import * as faceapi from '@vladmandic/face-api';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

export default function App() {
  const [bib, setBib] = useState('');
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Loading AI models...');

  useEffect(() => {
    const init = async () => {
      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      setStatus('Ready to search');
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
      alert('No clear face detected in the uploaded selfie.');
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
    
      Find Your Marathon Photos
      Status: {status}

      
         setBib(e.target.value)}
          style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
        />
        Search Bib
      

      
        Or Upload a Selfie:
        
      

      {loading && Processing search...}

      
        {photos.map((src, i) => (
          
        ))}
      
      {photos.length === 0 && !loading && No photos found yet.}
    
  );
}
