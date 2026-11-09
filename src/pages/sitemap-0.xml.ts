import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE_URL } from '../lib/seo';

const staticRoutes = [
  { path: '/', priority: 1.0, freq: 'daily' },
  { path: '/tentang', priority: 0.8, freq: 'weekly' },
  { path: '/pendidikan', priority: 0.8, freq: 'weekly' },
  { path: '/ppdb', priority: 0.9, freq: 'weekly' },
  { path: '/blog', priority: 0.8, freq: 'daily' },
  { path: '/faq', priority: 0.6, freq: 'monthly' },
  { path: '/kontak', priority: 0.5, freq: 'monthly' },
];

export const GET: APIRoute = async () => {
  const posts = await getCollection('blog');

  const urls = [
    ...staticRoutes.map((r) => ({
      loc: `${SITE_URL}${r.path}/`,
      priority: r.priority,
      changefreq: r.freq,
    })),
    ...posts.map((post) => ({
      loc: `${SITE_URL}/blog/${post.slug}/`,
      priority: 0.7,
      changefreq: 'weekly',
      lastmod: post.data.date.toISOString().split('T')[0],
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
