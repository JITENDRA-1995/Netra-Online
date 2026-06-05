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

async function run() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('email', 'settings@netra.graphics')
    .maybeSingle();

  if (error) {
    console.error('Database query error:', error);
    return;
  }

  if (!data) {
    console.log('No settings row found in clients table!');
    return;
  }

  try {
    const parsed = JSON.parse(data.address);
    console.log('--- Services Summary ---');
    console.log('Total services:', parsed.services?.length || 0);
    let serviceSlidesCount = 0;
    let serviceVidsCount = 0;
    if (parsed.services) {
      parsed.services.forEach(s => {
        if (s.slideshow) {
          serviceSlidesCount += s.slideshow.length;
          s.slideshow.forEach(slide => {
            const isVid = slide.url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) || slide.url.includes("video") || slide.url.startsWith("data:video/");
            if (isVid) serviceVidsCount++;
            console.log(`Service Slide: "${slide.title}" | isVideo: ${!!isVid} | URL: ${slide.url.substring(0, 80)}...`);
          });
        }
      });
    }
    console.log(`Total Service slides: ${serviceSlidesCount} (Videos: ${serviceVidsCount})`);

    console.log('\n--- Vision Summary ---');
    let visionSlidesCount = 0;
    let visionVidsCount = 0;
    if (parsed.vision) {
      parsed.vision.forEach((slot, slotIdx) => {
        if (slot.photos) {
          visionSlidesCount += slot.photos.length;
          slot.photos.forEach(photo => {
            const isVid = photo.url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) || photo.url.includes("video") || photo.url.startsWith("data:video/");
            if (isVid) visionVidsCount++;
            console.log(`Vision Slide Slot ${slotIdx + 1}: "${photo.title}" | isVideo: ${!!isVid} | URL: ${photo.url.substring(0, 80)}...`);
          });
        }
      });
    }
    console.log(`Total Vision slides: ${visionSlidesCount} (Videos: ${visionVidsCount})`);
  } catch (parseErr) {
    console.error('Failed to parse address column:', parseErr);
  }
}

run();
