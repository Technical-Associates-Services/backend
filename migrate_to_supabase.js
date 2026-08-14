const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function uploadFolder(folderName) {
  const folderPath = path.join(__dirname, 'public', 'frontend', 'images', folderName);
  if (!fs.existsSync(folderPath)) return;
  
  const files = fs.readdirSync(folderPath);
  console.log(`Found ${files.length} files in ${folderName}`);
  
  for (const file of files) {
    const filePath = path.join(folderPath, file);
    if (fs.statSync(filePath).isDirectory()) continue;
    
    const fileBuffer = fs.readFileSync(filePath);
    let contentType = 'image/jpeg';
    if (file.endsWith('.png')) contentType = 'image/png';
    if (file.endsWith('.webp')) contentType = 'image/webp';
    if (file.endsWith('.svg')) contentType = 'image/svg+xml';
    if (file.endsWith('.gif')) contentType = 'image/gif';
    
    const supabasePath = `${folderName}/${file}`;
    
    // Check if exists
    const { data: existing } = await supabase.storage.from('tas_media').list(folderName, { search: file });
    if (existing && existing.length > 0 && existing.find(e => e.name === file)) {
      console.log(`Skipping ${supabasePath} - already exists`);
      continue;
    }
    
    const { error } = await supabase.storage.from('tas_media').upload(supabasePath, fileBuffer, {
      contentType,
      upsert: true
    });
    
    if (error) {
      console.error(`Failed to upload ${supabasePath}:`, error);
    } else {
      console.log(`Uploaded ${supabasePath}`);
    }
  }
}

async function main() {
  const baseDir = path.join(__dirname, 'public', 'frontend', 'images');
  if (!fs.existsSync(baseDir)) {
    console.log("No images folder found");
    return;
  }
  
  const folders = fs.readdirSync(baseDir);
  for (const folder of folders) {
    if (fs.statSync(path.join(baseDir, folder)).isDirectory()) {
      await uploadFolder(folder);
    }
  }
  console.log("Migration complete!");
}

main();
