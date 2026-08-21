const multer = require('multer');

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'application/pdf'
];

// Configure Multer with strict 5MB size limit and MIME validation
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type '${file.mimetype}'. Allowed: JPEG, PNG, WebP, SVG, and PDF.`));
    }
  }
});

const singleUpload = upload.single('image');

exports.uploadMiddleware = (req, res, next) => {
  singleUpload(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size exceeds maximum allowed limit of 5MB' });
      }
      return res.status(400).json({ error: err.message || 'File upload error' });
    }
    next();
  });
};

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
    
    const isPdf = req.file.mimetype === 'application/pdf';
    const isSvg = req.file.mimetype === 'image/svg+xml';
    let fileBuffer;
    let fileName;
    let contentType;

    if (isPdf) {
      fileBuffer = req.file.buffer;
      const originalExt = req.file.originalname ? require('path').extname(req.file.originalname) || '.pdf' : '.pdf';
      fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${originalExt}`;
      contentType = 'application/pdf';
    } else if (isSvg) {
      fileBuffer = req.file.buffer;
      fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.svg`;
      contentType = 'image/svg+xml';
    } else {
      // Process image with sharp: compress and convert to webp
      const sharp = require('sharp');
      fileBuffer = await sharp(req.file.buffer)
        .webp({ quality: 80 })
        .toBuffer();
      fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
      contentType = 'image/webp';
    }
    
    const filePath = `${folder}/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await getSupabase().storage
      .from('tas_media')
      .upload(filePath, fileBuffer, {
        contentType,
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return res.status(500).json({ error: 'Failed to upload file to storage' });
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
