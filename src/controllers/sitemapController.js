const prisma = require('../config/db');

/**
 * Escapes characters that are invalid in XML syntax
 */
function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Encodes URL pathname safely while preserving slashes
 */
function cleanUrl(domain, path) {
  const cleanPath = path
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');
  return escapeXml(`${domain.replace(/\/+$/, '')}/${cleanPath.replace(/^\/+/, '')}`);
}

/**
 * Formats a Date object or date string to W3C Datetime (YYYY-MM-DD)
 */
function formatDate(date) {
  if (!date) return new Date().toISOString().split('T')[0];
  try {
    return new Date(date).toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Generates dynamic sitemap.xml for Google Search Console
 * GET /api/sitemap.xml or GET /sitemap.xml
 */
exports.getSitemap = async (req, res) => {
  try {
    const domain = process.env.CANONICAL_DOMAIN || 'https://tas.com.np';

    // Fetch all active content from database in parallel
    const [products, categories, blogs, solutions] = await Promise.all([
      prisma.product.findMany({
        where: { status: 1 },
        select: { slug: true, updated_at: true, created_at: true },
        orderBy: { id: 'desc' }
      }),
      prisma.category.findMany({
        where: { status: 1 },
        select: { slug: true, updated_at: true, created_at: true },
        orderBy: { id: 'desc' }
      }),
      prisma.blog.findMany({
        where: { status: 1 },
        select: { slug: true, updated_at: true, created_at: true },
        orderBy: { id: 'desc' }
      }),
      prisma.solution.findMany({
        where: { status: 1 },
        select: { slug: true, updated_at: true, created_at: true },
        orderBy: { id: 'desc' }
      })
    ]);

    // Static core public pages
    const staticPages = [
      { path: '', changefreq: 'daily', priority: '1.0' },
      { path: 'about-us', changefreq: 'monthly', priority: '0.8' },
      { path: 'associations', changefreq: 'monthly', priority: '0.7' },
      { path: 'sister-concern', changefreq: 'monthly', priority: '0.7' },
      { path: 'services', changefreq: 'weekly', priority: '0.9' },
      { path: 'solutions', changefreq: 'weekly', priority: '0.9' },
      { path: 'blogs', changefreq: 'daily', priority: '0.9' },
      { path: 'faqs', changefreq: 'monthly', priority: '0.7' },
      { path: 'references', changefreq: 'monthly', priority: '0.7' },
      { path: 'contact-us', changefreq: 'monthly', priority: '0.8' },
      { path: 'privacy-policy', changefreq: 'yearly', priority: '0.3' },
      { path: 'terms-and-condition', changefreq: 'yearly', priority: '0.3' }
    ];

    const today = new Date().toISOString().split('T')[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // 1. Static Pages
    for (const page of staticPages) {
      xml += `  <url>\n`;
      xml += `    <loc>${cleanUrl(domain, page.path)}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    // 2. Categories (routed via /product/:slug)
    // Keep track of visited slugs to avoid duplicate <loc> tags
    const visitedSlugs = new Set();

    for (const cat of categories) {
      if (!cat.slug || visitedSlugs.has(`product/${cat.slug}`)) continue;
      visitedSlugs.add(`product/${cat.slug}`);
      const lastmod = formatDate(cat.updated_at || cat.created_at);
      xml += `  <url>\n`;
      xml += `    <loc>${cleanUrl(domain, `product/${cat.slug}`)}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.85</priority>\n`;
      xml += `  </url>\n`;
    }

    // 3. Products (routed via /product/:slug)
    for (const prod of products) {
      if (!prod.slug || visitedSlugs.has(`product/${prod.slug}`)) continue;
      visitedSlugs.add(`product/${prod.slug}`);
      const lastmod = formatDate(prod.updated_at || prod.created_at);
      xml += `  <url>\n`;
      xml += `    <loc>${cleanUrl(domain, `product/${prod.slug}`)}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.9</priority>\n`;
      xml += `  </url>\n`;
    }

    // 4. Solutions (routed via /solutions/:slug)
    for (const sol of solutions) {
      if (!sol.slug || visitedSlugs.has(`solutions/${sol.slug}`)) continue;
      visitedSlugs.add(`solutions/${sol.slug}`);
      const lastmod = formatDate(sol.updated_at || sol.created_at);
      xml += `  <url>\n`;
      xml += `    <loc>${cleanUrl(domain, `solutions/${sol.slug}`)}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    }

    // 5. Blogs (routed via /blogs/:slug)
    for (const blog of blogs) {
      if (!blog.slug || visitedSlugs.has(`blogs/${blog.slug}`)) continue;
      visitedSlugs.add(`blogs/${blog.slug}`);
      const lastmod = formatDate(blog.updated_at || blog.created_at);
      xml += `  <url>\n`;
      xml += `    <loc>${cleanUrl(domain, `blogs/${blog.slug}`)}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>monthly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    return res.status(200).send(xml);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).set('Content-Type', 'text/plain').send('Error generating sitemap');
  }
};
