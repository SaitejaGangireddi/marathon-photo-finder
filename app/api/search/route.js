import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { type, bib, embedding } = await req.json();

    if (type === 'bib') {
      const { data, error } = await supabase
        .from('event_photos')
        .select('image_url')
        .contains('bib_numbers', [bib]);

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ results: [...new Set(data.map(d => d.image_url))].map(url => ({ url })) });
    }

    if (type === 'face') {
      const { data, error } = await supabase.rpc('match_face', {
        query_embedding: embedding,
        // 0.46 Euclidean distance: strictly matches exact person and rejects strangers/family
        match_threshold: 0.46,
        match_count: 50
      });

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      // Calculate true calibrated confidence: 0 distance = 100%, 0.50 distance = 0%
      const photoMap = new Map();
      (data || []).forEach(item => {
        const rawScore = Math.max(0, Math.round((1 - (item.distance / 0.50)) * 100));
        if (!photoMap.has(item.image_url) || photoMap.get(item.image_url) < rawScore) {
          photoMap.set(item.image_url, rawScore);
        }
      });

      const uniqueResults = Array.from(photoMap.entries()).map(([url, confidence]) => ({
        url,
        confidence
      }));

      return NextResponse.json({ results: uniqueResults });
    }

    return NextResponse.json({ error: 'Invalid search type' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}