import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log('Cleaning up duplicate files from Supabase Storage...\n');
  
  const { data: files, error } = await supabase.storage
    .from('media-public')
    .list('public', { limit: 100 });

  if (error) {
    console.error('Error listing files:', error);
    return;
  }

  console.log(`Found ${files?.length || 0} files in storage`);

  const { data: mediaRecords } = await supabase.from('media').select('url');
  const registeredUrls = new Set(mediaRecords?.map(m => m.url) || []);

  console.log(`Found ${registeredUrls.size} registered media records\n`);

  const orphanFiles: string[] = [];
  
  for (const file of files || []) {
    const fullPath = `public/${file.name}`;
    const { data: urlData } = supabase.storage.from('media-public').getPublicUrl(fullPath);
    
    if (!registeredUrls.has(urlData.publicUrl)) {
      orphanFiles.push(fullPath);
      console.log(`Orphan file found: ${file.name}`);
    }
  }

  if (orphanFiles.length === 0) {
    console.log('\nNo orphan files to clean up!');
    return;
  }

  console.log(`\nDeleting ${orphanFiles.length} orphan files...`);
  
  const { error: deleteError } = await supabase.storage
    .from('media-public')
    .remove(orphanFiles);

  if (deleteError) {
    console.error('Error deleting files:', deleteError);
  } else {
    console.log('Cleanup complete!');
  }
}

main().catch(console.error);
