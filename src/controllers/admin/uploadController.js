const multer = require('multer');

// Configure Multer (memory storage so we can stream to Supabase)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

exports.uploadMiddleware = upload.single('image');

// Lazy-initialize Supabase client so env vars are loaded first
let supabase = null;
const getSupabase = () => {
  if (!supabase) {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
    );
  }
  return supabase;
};

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Determine the folder based on the request (default to 'general')
    const folder = req.body.folder || 'general';
    
    // Process image with sharp: compress and convert to webp
    const sharp = require('sharp');
    const webpBuffer = await sharp(req.file.buffer)
      .webp({ quality: 80 })
      .toBuffer();
    
    // Create a unique filename
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
    const filePath = `${folder}/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await getSupabase().storage
      .from('tas_media')
      .upload(filePath, webpBuffer, {
        contentType: 'image/webp',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return res.status(500).json({ error: 'Failed to upload image to storage' });
    }

    res.json({
      result: 'success',
      fileName: fileName,
      url: `${process.env.APP_URL}/api/media/${filePath}`
    });

  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Internal server error during upload' });
  }
};
