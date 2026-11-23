const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const prisma = require('../config/db');

const CACHE_DIR = process.env.MEDIA_CACHE_DIR || path.join(os.tmpdir(), 'tas_media_cache');
if (!fs.existsSync(CACHE_DIR)) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  } catch (err) {
    console.warn('[TasMedia] Could not initialize cache directory:', err.message);
  }
}

let supabase = null;
function getSupabase() {
  if (!supabase && process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY)) {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
    );
  }
  return supabase;
}

const MIME_MAP = {
  webp: 'image/webp',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  svg: 'image/svg+xml',
  gif: 'image/gif',
  pdf: 'application/pdf',
  ico: 'image/x-icon'
};

function getMime(filename) {
  const ext = (filename || '').split('.').pop().toLowerCase();
  return MIME_MAP[ext] || 'application/octet-stream';
}

function generateETag(buffer) {
  const hash = crypto.createHash('md5').update(buffer).digest('hex');
  return `"${buffer.length.toString(16)}-${hash.substring(0, 16)}"`;
}

function getFromDiskCache(filename) {
  const cachePath = path.join(CACHE_DIR, filename);
  if (fs.existsSync(cachePath)) {
    try {
      return fs.readFileSync(cachePath);
    } catch {
      return null;
    }
  }
  return null;
}

function saveToDiskCache(filename, buffer) {
  const cachePath = path.join(CACHE_DIR, filename);
  try {
    fs.writeFileSync(cachePath, buffer);
  } catch (err) {
    console.warn('[TasMedia] Disk cache write failed:', err.message);
  }
}

function removeFromDiskCache(filename) {
  const cachePath = path.join(CACHE_DIR, filename);
  if (fs.existsSync(cachePath)) {
    try {
      fs.unlinkSync(cachePath);
    } catch {}
  }
}

function serveMediaResponse(req, res, filename, buffer, cacheHit = false) {
  const etag = generateETag(buffer);
  res.setHeader('Content-Type', getMime(filename));
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('ETag', etag);
  res.setHeader('X-Media-Cache', cacheHit ? 'HIT-DISK' : 'MISS-SUPABASE');

  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end();
  }

  return res.send(buffer);
}

/**
 * Handle incoming media streaming requests with Render /tmp/ SSD caching & HTTP 304 conditional revalidation
 */
async function handleMediaStreaming(req, res, folder, filename) {
  if (!filename || filename === 'null' || filename === 'undefined' || filename.includes('..')) {
    return res.status(404).send('Media not found');
  }

  // 1. FAST PATH: Check Render local SSD disk cache
  const cached = getFromDiskCache(filename);
  if (cached) {
    return serveMediaResponse(req, res, filename, cached, true);
  }

  // 2. Check local bundled files in public
  const localStatic = path.resolve('public/frontend/images', folder, filename);
  if (fs.existsSync(localStatic)) {
    try {
      const buffer = fs.readFileSync(localStatic);
      saveToDiskCache(filename, buffer);
      return serveMediaResponse(req, res, filename, buffer, false);
    } catch {}
  }

  // 3. COLD MISS: Download once from Supabase Storage tas_media bucket
  const client = getSupabase();
  if (!client) {
    return res.status(404).send('Storage provider not configured.');
  }

  try {
    const filePath = `${folder}/${filename}`;
    let { data, error } = await client.storage.from('tas_media').download(filePath);

    if (error || !data) {
      // Try root level
      const rootRes = await client.storage.from('tas_media').download(filename);
      if (!rootRes.error && rootRes.data) {
        data = rootRes.data;
        error = null;
      }
    }

    if (error || !data) {
      return res.status(404).send(`Media "${filename}" not found in storage.`);
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    saveToDiskCache(filename, buffer);

    return serveMediaResponse(req, res, filename, buffer, false);
  } catch (err) {
    console.error('[TasMedia] Error streaming file:', err.message);
    return res.status(500).send('Internal media serving error');
  }
}

/**
 * Purge single or multiple files from Supabase Storage and unlink disk cache
 */
async function deleteFromStorage(folder, filename) {
  if (!filename) return;
  const cleanFilename = filename.split('/').pop().split('?')[0];
  if (!cleanFilename) return;

  removeFromDiskCache(cleanFilename);

  const client = getSupabase();
  if (client) {
    try {
      await client.storage.from('tas_media').remove([`${folder}/${cleanFilename}`, cleanFilename]);
    } catch (err) {
      console.warn('[TasMedia] Storage delete warning:', err.message);
    }
  }
}

/**
 * Maintenance routine: Clean orphaned files across Supabase Storage
 */
async function cleanSupabaseOrphans() {
  console.log('[TasMedia] Running storage orphan audit...');
  const activeFiles = new Set();

  const registerActive = (val) => {
    if (!val || typeof val !== 'string') return;
    const clean = val.split('/').pop().split('?')[0].trim();
    if (clean && clean.length > 3) activeFiles.add(clean);
  };

  try {
    // 1. Categories
    const categories = await prisma.category.findMany({ select: { image: true, icon: true, pdf: true } });
    categories.forEach(c => {
      registerActive(c.image);
      registerActive(c.icon);
      registerActive(c.pdf);
    });

    // 2. Products
    const products = await prisma.product.findMany({ select: { image: true, download: true, additionals: true } });
    products.forEach(p => {
      registerActive(p.image);
      registerActive(p.download);
      if (p.additionals) {
        try {
          const parsed = typeof p.additionals === 'string' ? JSON.parse(p.additionals) : p.additionals;
          if (Array.isArray(parsed)) {
            parsed.forEach(item => registerActive(item.image));
          }
        } catch {}
      }
    });

    // 3. Product Gallery Images
    const images = await prisma.image.findMany({ select: { filename: true } });
    images.forEach(img => registerActive(img.filename));

    // 4. Banners
    const banners = await prisma.banner.findMany({ select: { image: true } });
    banners.forEach(b => registerActive(b.image));

    // 5. Blogs
    const blogs = await prisma.blog.findMany({ select: { image: true } });
    blogs.forEach(b => registerActive(b.image));

    // 6. Brands
    const brands = await prisma.brand.findMany({ select: { image: true } });
    brands.forEach(b => registerActive(b.image));

    // 7. Associations
    const associates = await prisma.association.findMany({ select: { image: true } });
    associates.forEach(a => registerActive(a.image));

    // 8. Services
    const services = await prisma.service.findMany({ select: { image: true } });
    services.forEach(s => registerActive(s.image));

    // 9. Concerns
    const concerns = await prisma.concern.findMany({ select: { image: true } });
    concerns.forEach(c => registerActive(c.image));

    // 10. Solutions
    const solutions = await prisma.solution.findMany({ select: { image: true } });
    solutions.forEach(s => registerActive(s.image));

    // 11. Testimonials
    const testimonials = await prisma.testimonial.findMany({ select: { image: true } });
    testimonials.forEach(t => registerActive(t.image));
  } catch (err) {
    console.error('[TasMedia] DB query error during orphan cleanup:', err);
    throw new Error('Database query failed during orphan audit');
  }

  const client = getSupabase();
  const report = {
    activeFilesFound: activeFiles.size,
    purgedCount: 0,
    purgedFiles: [],
    errors: []
  };

  if (!client) {
    report.errors.push('Supabase client not configured');
    return report;
  }

  const folders = ['categories', 'products', 'banners', 'blogs', 'brands', 'associates', 'services', 'concerns', 'solutions', 'testimonials', 'general'];
  for (const folder of folders) {
    try {
      const { data: files, error } = await client.storage.from('tas_media').list(folder, { limit: 1000 });
      if (error) continue;

      const orphans = (files || [])
        .filter(f => f.name && !f.name.startsWith('.') && !activeFiles.has(f.name))
        .map(f => `${folder}/${f.name}`);

      if (orphans.length > 0) {
        await client.storage.from('tas_media').remove(orphans);
        report.purgedCount += orphans.length;
        report.purgedFiles.push(...orphans);
        orphans.forEach(p => removeFromDiskCache(p.split('/').pop()));
      }
    } catch (err) {
      report.errors.push(`Error on ${folder}: ${err.message}`);
    }
  }

  return report;
}

module.exports = {
  CACHE_DIR,
  getFromDiskCache,
  saveToDiskCache,
  removeFromDiskCache,
  handleMediaStreaming,
  deleteFromStorage,
  cleanSupabaseOrphans
};
