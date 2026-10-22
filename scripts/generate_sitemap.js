const fs = require('fs');
const path = require('path');
const prisma = require('../src/config/db');

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function cleanUrl(domain, urlPath) {
  const cleanPath = urlPath
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');
  return escapeXml(`${domain.replace(/\/+$/, '')}/${cleanPath.replace(/^\/+/, '')}`);
}

function formatDate(date) {
  if (!date) return new Date().toISOString().split('T')[0];
  try {
    return new Date(date).toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

async function generateStaticSitemap() {
  console.log('Generating sitemap.xml...');
  const domain = 'https://tas.com.np';

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

  for (const page of staticPages) {
    xml += `  <url>\n`;
    xml += `    <loc>${cleanUrl(domain, page.path)}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += `  </url>\n`;
  }

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

  const frontendPublic = path.resolve(__dirname, '../../tas-frontend/public/sitemap.xml');
  const backendPublic = path.resolve(__dirname, '../public/sitemap.xml');

  fs.writeFileSync(frontendPublic, xml, 'utf8');
  console.log(`Saved static sitemap to: ${frontendPublic}`);

  fs.writeFileSync(backendPublic, xml, 'utf8');
  console.log(`Saved static sitemap to: ${backendPublic}`);

  console.log(`Successfully generated sitemap with ${visitedSlugs.size + staticPages.length} URLs!`);
  process.exit(0);
}

generateStaticSitemap().catch(err => {
  console.error('Sitemap generator error:', err);
  process.exit(1);
});
