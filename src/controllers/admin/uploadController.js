const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const { saveToDiskCache, deleteFromStorage, cleanSupabaseOrphans } = require('../../utils/mediaService');

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'application/pdf'
];

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB max
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
        return res.status(400).json({ error: 'File size exceeds maximum allowed limit of 10MB' });
      }
      return res.status(400).json({ error: err.message || 'File upload error' });
    }
    next();
  });
};

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

const SIZING_PRESETS = {
  brands: { width: 400, height: 400, quality: 85 },
  associates: { width: 400, height: 400, quality: 85 },
  categories: { width: 600, height: 600, quality: 80 },
  testimonials: { width: 400, height: 400, quality: 80 },
  products: { width: 1200, height: 1200, quality: 80 },
  solutions: { width: 1200, height: 1200, quality: 80 },
  blogs: { width: 1200, height: 800, quality: 80 },
  services: { width: 800, height: 600, quality: 80 },
  concerns: { width: 600, height: 400, quality: 80 },
  banners: { width: 1600, height: 900, quality: 80 },
  general: { width: 1200, height: 1200, quality: 80 }
};

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const folder = req.body.folder || 'general';
    const isPdf = req.file.mimetype === 'application/pdf';
    const isSvg = req.file.mimetype === 'image/svg+xml';
    let fileBuffer;
    let fileName;
    let contentType;

    if (isPdf) {
      fileBuffer = req.file.buffer;
      const originalExt = req.file.originalname ? path.extname(req.file.originalname) || '.pdf' : '.pdf';
      fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${originalExt}`;
      contentType = 'application/pdf';
    } else if (isSvg) {
      fileBuffer = req.file.buffer;
      fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.svg`;
      contentType = 'image/svg+xml';
    } else {
      // Process image with sharp: enforce context-aware dimension presets, strip EXIF, convert to WebP
      const preset = SIZING_PRESETS[folder] || SIZING_PRESETS.general;
      fileBuffer = await sharp(req.file.buffer)
        .rotate() // Auto-orient based on EXIF and strip metadata
        .resize({
          width: preset.width,
          height: preset.height,
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: preset.quality, effort: 4 })
        .toBuffer();
      fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
      contentType = 'image/webp';
    }
    
    // 1. Immediately pre-cache to Render local SSD disk cache
    saveToDiskCache(fileName, fileBuffer);

    // 2. Upload to Supabase Storage tas_media bucket
    const filePath = `${folder}/${fileName}`;
    const { error } = await getSupabase().storage
      .from('tas_media')
      .upload(filePath, fileBuffer, {
        contentType,
        upsert: true
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return res.status(500).json({ error: 'Failed to upload file to storage' });
    }

    let baseUrl = (process.env.APP_URL || '').trim().replace(/\/+$/, '');
    if (baseUrl && !baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = baseUrl.includes('localhost') ? `http://${baseUrl}` : `https://${baseUrl}`;
    }

    res.json({
      result: 'success',
      fileName: fileName,
      url: `${baseUrl}/api/media/${filePath}`
    });

  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Internal server error during upload' });
  }
};

/**
 * POST /api/upload/cleanup-orphans
 */
exports.cleanupOrphans = async (req, res) => {
  try {
    const report = await cleanSupabaseOrphans();
    return res.json({
      result: 'success',
      message: `Orphan cleanup complete: purged ${report.purgedCount} orphaned file(s)`,
      data: report
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to cleanup orphan files' });
  }
};
