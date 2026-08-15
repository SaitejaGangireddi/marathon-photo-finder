import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tfncwwpspdjndxjutgki.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmbmN3d3BzcGRqbmR4anV0Z2tpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njc3MzkyOCwiZXhwIjoyMTAyMzQ5OTI4fQ.5izcthsJq6cCbG0N0zCtqXARRLE-ezwzeBKp5jIf09c';

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    const body = await req.json().catch(() => ({}));
    const { embedding } = body;

    // Vector similarity search if embedding array is present
    if (embedding && Array.isArray(embedding) && embedding.length === 512) {
      const { data, error } = await supabase.rpc('match_face_photos', {
        query_embedding: embedding,
        match_threshold: 0.35,
        match_count: 50,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ photos: data || [] });
    }

    // Default: Fetch latest indexed photos
    const { data: photos, error: photoErr } = await supabase
      .from('photos')
      .select('id, image_url')
      .limit(30);

    if (photoErr) {
      return NextResponse.json({ error: photoErr.message }, { status: 500 });
    }

    return NextResponse.json({ photos: photos || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
