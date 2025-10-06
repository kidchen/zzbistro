import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imagePath } = await request.json();

    if (!imagePath) {
      return NextResponse.json({ error: 'Missing imagePath' }, { status: 400 });
    }

    // For private buckets, download the file and return it as a data URL
    const { data, error } = await supabaseAdmin.storage
      .from('recipe-images')
      .download(imagePath);

    if (error) {
      console.error('Download error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'No data returned' }, { status: 500 });
    }

    // Convert blob to base64 data URL
    const arrayBuffer = await data.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = data.type || 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return NextResponse.json({ signedUrl: dataUrl });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to get image' }, { status: 500 });
  }
}
