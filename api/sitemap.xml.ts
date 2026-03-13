import type { VercelRequest, VercelResponse } from '@vercel/node';

const BACKEND = 'https://maps-and-roads-backend-production.up.railway.app/api';
const SITE_URL = 'https://mapsandroads.az';

interface Post {
  id: number;
  updatedAt?: string;
  createdAt?: string;
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    // Bütün postları yüklə (böyük saytlar üçün pagination əlavə etmək olar)
    let allPosts: Post[] = [];
    let page = 0;
    let hasNext = true;

    while (hasNext) {
      const r = await fetch(`${BACKEND}/posts?page=${page}&size=100`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) break;
      const data = await r.json();
      allPosts = allPosts.concat(data.posts || []);
      hasNext = data.hasNext || false;
      page++;
      if (page > 50) break; // max 5000 post
    }

    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/map', priority: '0.8', changefreq: 'weekly' },
    ];

    const postEntries = allPosts
      .map((post) => {
        const lastmod = post.updatedAt || post.createdAt
          ? new Date(post.updatedAt || post.createdAt!).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];
        return `  <url>
    <loc>${SITE_URL}/posts/${post.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
      })
      .join('\n');

    const staticEntries = staticPages
      .map(
        (p) => `  <url>
    <loc>${SITE_URL}${p.url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
      )
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries}
${postEntries}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).send(xml);
  } catch {
    res.status(500).send('Sitemap generasiya xətası');
  }
}
