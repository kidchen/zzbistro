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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const recipeId = formData.get('recipeId') as string;
    const familyId = formData.get('familyId') as string;

    if (!file || !recipeId || !familyId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Upload to Supabase using family-based path
    const filePath = `${familyId}/${recipeId}.jpg`;
    
    
    const { error } = await supabaseAdmin.storage
      .from('recipe-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Upload error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get signed URL for immediate use
    const { data: signedData } = await supabaseAdmin.storage
      .from('recipe-images')
      .createSignedUrl(filePath, 86400);

    return NextResponse.json({
      imagePath: filePath,
      imageUrl: signedData?.signedUrl || ''
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
