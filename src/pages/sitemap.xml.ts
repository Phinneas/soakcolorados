import { getCollection } from 'astro:content';

export const prerender = true;

export async function GET() {
  const posts = await getCollection('blog');
  const site = 'https://www.washingtonhotsprings.com';

  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'weekly' },
    { url: '/blog', priority: '0.9', changefreq: 'daily' },
    { url: '/washington-hot-springs-map', priority: '0.9', changefreq: 'weekly' },
    { url: '/trip-planner', priority: '0.8', changefreq: 'monthly' },
  ];

  const postEntries = posts
    .sort((a, b) => new Date(b.data.publishedDate).valueOf() - new Date(a.data.publishedDate).valueOf())
    .map((post) => ({
      url: `/blog/${post.slug}`,
      lastmod: post.data.updatedDate ?? post.data.publishedDate,
      priority: '0.7',
      changefreq: 'monthly',
    }));

  const allEntries = [
    ...staticPages.map((p) => `
  <url>
    <loc>${site}${p.url}</loc>
    <priority>${p.priority}</priority>
    <changefreq>${p.changefreq}</changefreq>
  </url>`),
    ...postEntries.map((p) => `
  <url>
    <loc>${site}${p.url}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <priority>${p.priority}</priority>
    <changefreq>${p.changefreq}</changefreq>
  </url>`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allEntries.join('')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
