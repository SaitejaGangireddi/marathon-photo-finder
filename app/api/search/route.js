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
        match_threshold: 0.51, // The balance point for group photos vs false positives
        match_count: 50
      });

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      
      // Return distinct photos
      const uniquePhotos = [...new Set(data.map(d => d.image_url))];
      return NextResponse.json({ photos: uniquePhotos });
    }

    return NextResponse.json({ error: 'Invalid search type' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
