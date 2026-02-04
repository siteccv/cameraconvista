import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

interface ImageToMigrate {
  originalUrl: string;
  name: string;
  category: string;
  altIt: string;
  altEn: string;
}

const imagesToMigrate: ImageToMigrate[] = [
  // Hero images
  { originalUrl: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", name: "hero-home-cocktails.jpg", category: "hero", altIt: "Hero Home - Cocktails", altEn: "Home Hero - Cocktails" },
  { originalUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", name: "hero-menu-ristorante.jpg", category: "hero", altIt: "Hero Menu - Ristorante", altEn: "Menu Hero - Restaurant" },
  { originalUrl: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", name: "hero-carta-vini.jpg", category: "hero", altIt: "Hero Carta Vini", altEn: "Wine List Hero" },
  { originalUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", name: "hero-eventi.jpg", category: "events", altIt: "Hero Eventi", altEn: "Events Hero" },
  { originalUrl: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", name: "hero-eventi-privati.jpg", category: "events", altIt: "Hero Eventi Privati", altEn: "Private Events Hero" },
  { originalUrl: "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", name: "hero-contatti.jpg", category: "hero", altIt: "Hero Contatti", altEn: "Contacts Hero" },
  { originalUrl: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", name: "hero-galleria.jpg", category: "gallery", altIt: "Hero Galleria", altEn: "Gallery Hero" },
  
  // Gallery covers
  { originalUrl: "https://images.unsplash.com/photo-1560624052-449f5ddf0c31?w=800", name: "gallery-locale.jpg", category: "gallery", altIt: "Gallery Il Locale", altEn: "Gallery The Venue" },
  { originalUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800", name: "gallery-cucina.jpg", category: "gallery", altIt: "Gallery La Cucina", altEn: "Gallery The Kitchen" },
  { originalUrl: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800", name: "gallery-cocktails.jpg", category: "cocktails", altIt: "Gallery Cocktails", altEn: "Gallery Cocktails" },
  { originalUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800", name: "gallery-eventi.jpg", category: "events", altIt: "Gallery Eventi", altEn: "Gallery Events" },
  
  // Home page secondary images
  { originalUrl: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80", name: "home-cocktail-card.jpg", category: "cocktails", altIt: "Cocktail Bar Card", altEn: "Cocktail Bar Card" },
  { originalUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80", name: "home-ristorante-card.jpg", category: "menu", altIt: "Ristorante Card", altEn: "Restaurant Card" },
  { originalUrl: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80", name: "home-eventi-card.jpg", category: "events", altIt: "Eventi Card", altEn: "Events Card" },
  { originalUrl: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", name: "home-gallery-preview.jpg", category: "gallery", altIt: "Anteprima Galleria", altEn: "Gallery Preview" },
  
  // Eventi privati secondary images
  { originalUrl: "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", name: "eventi-privati-cena.jpg", category: "events", altIt: "Cena Privata", altEn: "Private Dinner" },
  { originalUrl: "https://images.unsplash.com/photo-1560624052-449f5ddf0c31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", name: "eventi-privati-locale.jpg", category: "events", altIt: "Locale Esclusivo", altEn: "Exclusive Venue" },
];

const uploadedUrls: Map<string, string> = new Map();

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    console.log(`  Downloading from ${url.substring(0, 60)}...`);
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`  Failed to download: ${response.status}`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error(`  Download error:`, error);
    return null;
  }
}

async function uploadImage(image: ImageToMigrate): Promise<string | null> {
  const { originalUrl, name, category, altIt, altEn } = image;
  
  const baseUrl = originalUrl.split('?')[0];
  if (uploadedUrls.has(baseUrl)) {
    console.log(`  Already uploaded: ${name} -> using cached URL`);
    return uploadedUrls.get(baseUrl)!;
  }

  const imageBuffer = await downloadImage(originalUrl);
  if (!imageBuffer) return null;

  const timestamp = Date.now();
  const storagePath = `public/${timestamp}-${name}`;
  const mimeType = name.endsWith('.png') ? 'image/png' : 'image/jpeg';

  console.log(`  Uploading to Supabase: ${storagePath}...`);
  
  const { error: uploadError } = await supabase.storage
    .from('media-public')
    .upload(storagePath, imageBuffer, {
      contentType: mimeType,
      upsert: true
    });

  if (uploadError) {
    console.error(`  Upload error:`, uploadError);
    return null;
  }

  const { data: urlData } = supabase.storage.from('media-public').getPublicUrl(storagePath);
  const publicUrl = urlData.publicUrl;
  
  uploadedUrls.set(baseUrl, publicUrl);

  const mediaRecord = {
    filename: name,
    url: publicUrl,
    alt_it: altIt,
    alt_en: altEn,
    mime_type: mimeType,
    size: imageBuffer.length,
    category: category,
    created_at: new Date().toISOString()
  };

  const { error: insertError } = await supabase.from('media').insert(mediaRecord);
  if (insertError) {
    console.error(`  Media insert error:`, insertError);
  }

  console.log(`  SUCCESS: ${publicUrl}`);
  return publicUrl;
}

async function main() {
  console.log('=== Migrating all site images to Supabase ===\n');
  
  let successCount = 0;
  let failCount = 0;

  for (const image of imagesToMigrate) {
    console.log(`\nProcessing: ${image.name}`);
    const result = await uploadImage(image);
    if (result) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log(`\n=== Migration Complete ===`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  
  console.log('\n=== URL Mapping for code updates ===');
  uploadedUrls.forEach((newUrl, oldUrl) => {
    console.log(`${oldUrl.substring(0, 50)}... -> ${newUrl}`);
  });
}

main().catch(console.error);
