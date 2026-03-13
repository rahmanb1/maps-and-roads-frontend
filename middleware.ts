const BACKEND = 'https://maps-and-roads-backend-production.up.railway.app/api';

const BOT_AGENTS = [
  'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
  'yandexbot', 'facebot', 'twitterbot', 'linkedinbot', 'whatsapp',
  'telegrambot', 'applebot', 'petalbot',
];

function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BOT_AGENTS.some((bot) => ua.includes(bot));
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n/g, ' ')
    .trim();
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const ua = req.headers.get('user-agent') || '';
  const { pathname } = url;

  const postMatch = pathname.match(/^\/posts\/(\d+)$/);

  if (!isBot(ua) || !postMatch) {
    return new Response(null, { status: 200 });
  }

  const postId = postMatch[1];

  try {
    const res = await fetch(`${BACKEND}/posts/${postId}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) return new Response(null, { status: 200 });

    const post = await res.json();

    const title = escapeHtml(post.title || 'Maps & Roads');
    const rawDesc = stripMarkdown(post.content || '');
    const description = escapeHtml(rawDesc.slice(0, 155));
    const imageUrl = post.imageUrl?.startsWith('http')
      ? post.imageUrl
      : post.imageUrl
        ? `https://maps-and-roads-backend-production.up.railway.app${post.imageUrl}`
        : 'https://mapsandroads.az/logo.png';
    const canonicalUrl = `https://mapsandroads.az/posts/${postId}`;
    const author = escapeHtml(post.username || '');
    const publishedAt = post.createdAt ? new Date(post.createdAt).toISOString() : '';

    const html = `<!DOCTYPE html>
<html lang="az">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — Maps &amp; Roads</title>
  <meta name="description" content="${description}" />
  <meta name="author" content="${author}" />
  <link rel="canonical" href="${canonicalUrl}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Maps &amp; Roads" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:locale" content="az_AZ" />
  ${author ? `<meta property="article:author" content="${author}" />` : ''}
  ${publishedAt ? `<meta property="article:published_time" content="${publishedAt}" />` : ''}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${imageUrl}" />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": ${JSON.stringify(post.title || '')},
    "description": ${JSON.stringify(rawDesc.slice(0, 155))},
    "image": "${imageUrl}",
    "url": "${canonicalUrl}",
    "author": {"@type": "Person", "name": ${JSON.stringify(post.username || '')}},
    "publisher": {"@type": "Organization", "name": "Maps & Roads", "url": "https://mapsandroads.az"}
    ${publishedAt ? `,"datePublished": "${publishedAt}"` : ''}
    ${post.updatedAt ? `,"dateModified": "${new Date(post.updatedAt).toISOString()}"` : ''}
    ${post.location ? `,"contentLocation": {"@type": "Place", "name": ${JSON.stringify(post.location)}}` : ''}
  }
  </script>
</head>
<body>
  <h1>${title}</h1>
  <p>${description}</p>
  ${author ? `<p>Müəllif: ${author}</p>` : ''}
  ${post.location ? `<p>Məkan: ${escapeHtml(post.location)}</p>` : ''}
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch {
    return new Response(null, { status: 200 });
  }
}

export const config = {
  runtime: 'edge',
  matcher: ['/posts/:id*'],
};
