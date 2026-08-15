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

      if (error) {
        console.error('BIB Search Error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ photos: [...new Set(data.map(d => d.image_url))] });
    }

    if (type === 'face') {
      if (!embedding || !Array.isArray(embedding) || embedding.length !== 128) {
        return NextResponse.json({ error: 'Invalid 128-d face embedding provided' }, { status: 400 });
      }

      const { data, error } = await supabase.rpc('match_face', {
        query_embedding: embedding,
        match_threshold: 0.55, // MVP calibrated threshold for web face-api to dlib
        match_count: 50
      });

      if (error) {
        console.error('Supabase RPC Error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      console.log('Detected Face Matches from DB:', data);

      const uniquePhotos = [...new Set((data || []).map(d => d.image_url))];
      return NextResponse.json({ photos: uniquePhotos });
    }

    return NextResponse.json({ error: 'Invalid search type' }, { status: 400 });
  } catch (err) {
    console.error('API Route Exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}