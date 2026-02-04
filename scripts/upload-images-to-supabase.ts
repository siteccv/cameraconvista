import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

interface ImageToUpload {
  filePath: string;
  categorySlug: string;
  altIt: string;
  altEn: string;
}

const imagesToUpload: ImageToUpload[] = [
  { filePath: './LOGOS/logo_ccv.png', categorySlug: 'logo', altIt: 'Logo Camera con Vista', altEn: 'Camera con Vista Logo' },
  { filePath: './LOGOS/Logo_ccv_2_optimized_1770126702818.png', categorySlug: 'logo', altIt: 'Logo Camera con Vista Ottimizzato', altEn: 'Camera con Vista Logo Optimized' },
  { filePath: './LOGOS/icona_ccv.png', categorySlug: 'logo', altIt: 'Icona Camera con Vista', altEn: 'Camera con Vista Icon' },
  { filePath: './client/public/favicon.png', categorySlug: 'logo', altIt: 'Favicon', altEn: 'Favicon' },
  { filePath: './attached_assets/logo_ccv.png', categorySlug: 'logo', altIt: 'Logo CCV Assets', altEn: 'CCV Logo Assets' },
];

async function getCategories() {
  const { data, error } = await supabase.from('media_categories').select('*');
  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  return data || [];
}

async function getCategoryIdBySlug(slug: string, categories: any[]): Promise<number | null> {
  const cat = categories.find(c => c.slug === slug);
  return cat ? cat.id : null;
}

async function uploadImage(image: ImageToUpload, categories: any[]) {
  const { filePath, categorySlug, altIt, altEn } = image;
  
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}, skipping...`);
    return null;
  }

  const fileBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  const ext = path.extname(fileName).toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml'
  };
  
  const mimeType = mimeTypes[ext] || 'application/octet-stream';
  const timestamp = Date.now();
  const storagePath = `public/${timestamp}-${fileName}`;

  console.log(`Uploading ${fileName} to ${storagePath}...`);
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('media-public')
    .upload(storagePath, fileBuffer, {
      contentType: mimeType,
      upsert: true
    });

  if (uploadError) {
    console.error(`Upload error for ${fileName}:`, uploadError);
    return null;
  }

  const { data: urlData } = supabase.storage.from('media-public').getPublicUrl(storagePath);
  const publicUrl = urlData.publicUrl;
  
  console.log(`Uploaded! URL: ${publicUrl}`);

  const mediaRecord = {
    filename: fileName,
    url: publicUrl,
    alt_it: altIt,
    alt_en: altEn,
    mime_type: mimeType,
    size: fileBuffer.length,
    category: categorySlug,
    created_at: new Date().toISOString()
  };

  const { data: insertData, error: insertError } = await supabase
    .from('media')
    .insert(mediaRecord)
    .select()
    .single();

  if (insertError) {
    console.error(`Insert error for ${fileName}:`, insertError);
    return null;
  }

  console.log(`Media record created: ID ${insertData.id}`);
  return insertData;
}

async function main() {
  console.log('Starting image upload to Supabase...\n');
  
  const categories = await getCategories();
  console.log('Categories found:', categories.map(c => c.slug).join(', '));
  console.log('');

  for (const image of imagesToUpload) {
    await uploadImage(image, categories);
    console.log('');
  }

  console.log('Upload complete!');
}

main().catch(console.error);
