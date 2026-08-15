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
      return NextResponse.json({ photos: [...new Set(data.map(d => d.image_url))] });
    }

    if (type === 'face') {
      const { data, error } = await supabase.rpc('match_face', {
        query_embedding: embedding,
        // Set to 0.46 for strict filtering (filters out non-matching strangers)
        match_threshold: 0.46,
        match_count: 30
      });

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      // Optional: console.log distances to see exact match scores in your terminal/Vercel logs
      console.log('Match results with distances:', data);

      // Return unique matching photos
      const uniquePhotos = [...new Set(data.map(d => d.image_url))];
      return NextResponse.json({ photos: uniquePhotos });
    }

    return NextResponse.json({ error: 'Invalid search type' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}