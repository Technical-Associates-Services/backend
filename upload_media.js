const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SUPABASE_SERVICE_ROLE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

const IMAGES_DIR = path.join(__dirname, '..', 'tas-backend-OLD', 'public', 'frontend', 'images');

// Folders to migrate, mapped to their target bucket name
const folderMappings = [
  { bucket: 'associations', folders: ['associations'] },
  { bucket: 'banners', folders: ['banners'] },
  { bucket: 'blogs', folders: ['blogs'] },
  { bucket: 'brands', folders: ['brands'] },
  { bucket: 'catalogues', folders: ['catalogues', 'catalougues'] }, // Combining the typo folder
  { bucket: 'categories', folders: ['categories'] },
  { bucket: 'concerns', folders: ['concerns'] },
  { bucket: 'faqs', folders: ['faqs'] },
  { bucket: 'products', folders: ['products'] },
  { bucket: 'references', folders: ['references'] },
  { bucket: 'services', folders: ['services'] },
  { bucket: 'shops', folders: ['shops'] },
  { bucket: 'solutions', folders: ['solutions'] },
  { bucket: 'testimonials', folders: ['testimonials'] }
];

// Note: excluding 'galleries' per discussion unless explicitly requested.

function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const map = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf'
  };
  return map[ext] || 'application/octet-stream';
}

// Dry run mode flag
const DRY_RUN = false;

async function uploadToBucket(folderName, targetFolders) {
  console.log(`\nProcessing folder: ${folderName}`);
  const bucketName = 'tas_media';
  
  if (!DRY_RUN) {
    // Ensure tas_media bucket exists
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket(bucketName, {
      public: true
    });
    
    if (bucketError && bucketError.message !== 'The resource already exists' && !bucketError.message.includes('already exists')) {
      console.error(`Error creating bucket ${bucketName}:`, bucketError);
    }
  }
  
  for (const folderName of targetFolders) {
    const folderPath = path.join(IMAGES_DIR, folderName);
    
    if (!fs.existsSync(folderPath)) {
      console.warn(`Folder not found: ${folderPath}`);
      continue;
    }

    const files = fs.readdirSync(folderPath);
    console.log(`Found ${files.length} items to process from folder '${folderName}' to bucket '${bucketName}'`);

    for (const item of files) {
      const itemPath = path.join(folderPath, item);
      const stat = fs.statSync(itemPath);
      let fileBuffer = null;
      let targetFileName = item;
      let actualFilePath = itemPath;
      
      if (stat.isFile()) {
        if (!DRY_RUN) fileBuffer = fs.readFileSync(itemPath);
      } else if (stat.isDirectory()) {
        const innerFiles = fs.readdirSync(itemPath);
        if (innerFiles.length === 1) {
          const innerFile = innerFiles[0];
          actualFilePath = path.join(itemPath, innerFile);
          
          if (fs.statSync(actualFilePath).isFile()) {
            console.log(`[FIX] Directory masking as file found: ${item} -> using nested content ${innerFile}`);
            if (!DRY_RUN) fileBuffer = fs.readFileSync(actualFilePath);
          } else {
            console.warn(`- Skipped ${item}: Nested item is not a file`);
            continue;
          }
        } else {
          console.warn(`- Skipped ${item}: Directory does not contain exactly 1 file`);
          continue;
        }
      } else {
        continue;
      }
      
      const contentType = getContentType(targetFileName);
      const supabasePath = `${folderName}/${targetFileName}`;
      
      if (DRY_RUN) {
         console.log(`- WOULD UPLOAD: [Source: ${actualFilePath}] -> [Target: ${bucketName}/${supabasePath}] [${contentType}]`);
      } else {
        const { data, error } = await supabase.storage.from(bucketName).upload(supabasePath, fileBuffer, {
          upsert: true,
          contentType: contentType
        });
        
        if (error) {
          console.error(`- Failed to upload ${supabasePath} [${contentType}]:`, error.message);
        } else {
          console.log(`- Uploaded ${supabasePath} [${contentType}]`);
        }
      }
    }
  }
}

async function main() {
  console.log('Starting Supabase Media Migration...\n');
  
  for (const mapping of folderMappings) {
    await uploadToBucket(mapping.bucket, mapping.folders);
  }
  
  console.log('\nMedia migration complete!');
}

main();
