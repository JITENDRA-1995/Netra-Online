import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const lines = envContent.split('\n');
let supabaseUrl = '';
let supabaseAnonKey = '';

for (const line of lines) {
  if (line.startsWith('VITE_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].trim();
  }
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
    supabaseAnonKey = line.split('=')[1].trim();
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Credentials not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to convert base64 to Buffer and upload
async function uploadBase64(base64Str, prefix, idx) {
  const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 string format');
  }

  const contentType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');
  
  // Determine file extension
  let ext = 'jpg';
  if (contentType.includes('png')) ext = 'png';
  else if (contentType.includes('gif')) ext = 'gif';
  else if (contentType.includes('mp4')) ext = 'mp4';
  else if (contentType.includes('webm')) ext = 'webm';
  else if (contentType.includes('ogg')) ext = 'ogg';
  else if (contentType.includes('quicktime') || contentType.includes('mov')) ext = 'mov';

  const fileName = `${prefix}_migrated_${Date.now()}_${idx}.${ext}`;
  const filePath = `migrated/${fileName}`;

  console.log(`Uploading base64 file to storage: ${filePath} (${contentType}, size: ${buffer.length} bytes)...`);

  const { data, error } = await supabase.storage
    .from('studio-vault')
    .upload(filePath, buffer, {
      contentType,
      upsert: true
    });

  if (error) {
    throw error;
  }

  const { data: urlData } = supabase.storage
    .from('studio-vault')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

async function run() {
  console.log('Fetching settings@netra.graphics row...');
  const { data: current, error: getErr } = await supabase
    .from('clients')
    .select('*')
    .eq('email', 'settings@netra.graphics')
    .maybeSingle();

  if (getErr) {
    console.error('Error fetching settings:', getErr);
    return;
  }

  if (!current) {
    console.log('No settings row found in clients table.');
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(current.address);
  } catch (parseErr) {
    console.error('Failed to parse address column:', parseErr);
    return;
  }

  let migratedCount = 0;

  // Migrate Services slideshows
  if (parsed.services) {
    for (const s of parsed.services) {
      if (s.slideshow) {
        for (let i = 0; i < s.slideshow.length; i++) {
          const slide = s.slideshow[i];
          if (slide.url && slide.url.startsWith('data:')) {
            console.log(`Found base64 slide in Service: "${s.title}"`);
            try {
              const publicUrl = await uploadBase64(slide.url, `service_${s.id}`, i);
              slide.url = publicUrl;
              migratedCount++;
            } catch (err) {
              console.error(`Failed to migrate service slide ${i + 1} for ${s.title}:`, err);
            }
          }
        }
      }
    }
  }

  // Migrate Vision slot photos
  if (parsed.vision) {
    for (let slotIdx = 0; slotIdx < parsed.vision.length; slotIdx++) {
      const slot = parsed.vision[slotIdx];
      if (slot.photos) {
        for (let i = 0; i < slot.photos.length; i++) {
          const photo = slot.photos[i];
          if (photo.url && photo.url.startsWith('data:')) {
            console.log(`Found base64 photo in Vision Slot ${slotIdx + 1}`);
            try {
              const publicUrl = await uploadBase64(photo.url, `vision_slot_${slotIdx + 1}`, i);
              photo.url = publicUrl;
              migratedCount++;
            } catch (err) {
              console.error(`Failed to migrate vision photo ${i + 1} for slot ${slotIdx + 1}:`, err);
            }
          }
        }
      }
    }
  }

  if (migratedCount > 0) {
    console.log(`\nSuccessfully migrated ${migratedCount} base64 assets to storage.`);
    const payload = {
      address: JSON.stringify(parsed)
    };

    console.log('Updating database settings row with cleaned URLs...');
    const { data: updatedData, error: updateErr } = await supabase
      .from('clients')
      .update(payload)
      .eq('email', 'settings@netra.graphics')
      .select();

    if (updateErr) {
      console.error('FAILED TO UPDATE DATABASE SETTINGS ROW:', updateErr);
    } else {
      console.log('DATABASE SETTINGS ROW UPDATED SUCCESSFULLY!');
      console.log('New data payload length:', payload.address.length);
    }
  } else {
    console.log('\nNo base64 assets found to migrate. Everything is clean!');
  }
}

run();
