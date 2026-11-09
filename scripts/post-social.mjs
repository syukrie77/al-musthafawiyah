#!/usr/bin/env node
/**
 * Auto-Post Sosmed untuk Pondok Pesantren Al-Musthafawiyah
 *
 * Posting otomatis ke:
 *   - Facebook Fanpage (via Graph API)
 *   - Instagram Business/Creator (via Graph API)
 *
 * Setup:
 *   1. Buat file .env di root project (lihat .env.example)
 *   2. Isi FB_PAGE_ACCESS_TOKEN & FB_PAGE_ID
 *   3. Isi IG_USER_ID & IG_ACCESS_TOKEN (harus IG Business/Creator)
 *   4. Jalankan: node scripts/post-social.mjs --slug <artikel-slug>
 *
 * Dokumentasi API:
 *   - Facebook: https://developers.facebook.com/docs/graph-api/reference/v21.0/page/feed
 *   - Instagram: https://developers.facebook.com/docs/instagram-api/guides/content-publishing
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function loadEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return {};
  const env = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["'](.*)["']$/, '$1');
  }
  return env;
}

const ENV = loadEnv();

const CONFIG = {
  FB_PAGE_ID: ENV.FB_PAGE_ID || '',
  FB_PAGE_ACCESS_TOKEN: ENV.FB_PAGE_ACCESS_TOKEN || '',
  IG_USER_ID: ENV.IG_USER_ID || '',
  IG_ACCESS_TOKEN: ENV.IG_ACCESS_TOKEN || '',
  SITE_URL: ENV.SITE_URL || 'https://almusthafawiyah.sch.id',
};

const GRAPH = 'https://graph.facebook.com/v21.0';

function readArticle(slug) {
  const filePath = path.join(ROOT, 'src/content/blog', `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Artikel "${slug}" tidak ditemukan di ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) throw new Error(`Frontmatter tidak valid untuk ${slug}`);

  const fm = {};
  for (const line of fmMatch[1].split('\n')) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (m) fm[m[1]] = m[2].replace(/^["'](.*)["']$/, '$1');
  }
  return { frontmatter: fm, body: fmMatch[2] };
}

function buildFacebookMessage(article) {
  const { frontmatter: fm } = article;
  const url = `${CONFIG.SITE_URL}/blog/${fm.slug || article.slug}/`;

  return {
    message: [
      `📖 ${fm.title}`,
      ``,
      fm.description,
      ``,
      `Baca selengkapnya di website Al-Musthafawiyah 👇`,
      url,
      ``,
      `#Pesantren #AlMusthafawiyah #Tahfidz #AlQuran #KitabKuning #PendidikanIslam #Santri #Islam #Indonesia`,
    ].join('\n'),
    link: url,
  };
}

function buildInstagramCaption(article) {
  const { frontmatter: fm } = article;
  const url = `${CONFIG.SITE_URL}/blog/${fm.slug || article.slug}/`;
  return [
    `📖 ${fm.title}`,
    ``,
    fm.description,
    ``,
    `🔗 Link di bio!`,
    ``,
    `#Pesantren #AlMusthafawiyah #Tahfidz #AlQuran #KitabKuning #PendidikanIslam #Santri #Islam #Indonesia #Dakwah`,
  ].join('\n');
}

async function postToFacebook(article) {
  if (!CONFIG.FB_PAGE_ID || !CONFIG.FB_PAGE_ACCESS_TOKEN) {
    console.log('⚠️  Facebook: FB_PAGE_ID atau FB_PAGE_ACCESS_TOKEN belum diisi. Skip.');
    return { ok: false, reason: 'missing-config' };
  }

  const payload = buildFacebookMessage(article);

  const res = await fetch(`${GRAPH}/${CONFIG.FB_PAGE_ID}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: payload.message,
      link: payload.link,
      access_token: CONFIG.FB_PAGE_ACCESS_TOKEN,
    }),
  });

  const data = await res.json();
  if (data.error) {
    console.error('❌ Facebook error:', data.error.message);
    return { ok: false, reason: data.error.message };
  }

  console.log(`✅ Facebook: posted (id=${data.id})`);
  return { ok: true, id: data.id };
}

async function postToInstagram(article, imageUrl) {
  if (!CONFIG.IG_USER_ID || !CONFIG.IG_ACCESS_TOKEN) {
    console.log('⚠️  Instagram: IG_USER_ID atau IG_ACCESS_TOKEN belum diisi. Skip.');
    return { ok: false, reason: 'missing-config' };
  }

  if (!imageUrl) {
    console.log('⚠️  Instagram: butuh imageUrl. Skip.');
    return { ok: false, reason: 'no-image' };
  }

  const caption = buildInstagramCaption(article);

  const containerRes = await fetch(`${GRAPH}/${CONFIG.IG_USER_ID}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url: imageUrl,
      caption,
      access_token: CONFIG.IG_ACCESS_TOKEN,
    }),
  });

  const containerData = await containerRes.json();
  if (containerData.error) {
    console.error('❌ Instagram container error:', containerData.error.message);
    return { ok: false, reason: containerData.error.message };
  }

  const publishRes = await fetch(`${GRAPH}/${CONFIG.IG_USER_ID}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: containerData.id,
      access_token: CONFIG.IG_ACCESS_TOKEN,
    }),
  });

  const publishData = await publishRes.json();
  if (publishData.error) {
    console.error('❌ Instagram publish error:', publishData.error.message);
    return { ok: false, reason: publishData.error.message };
  }

  console.log(`✅ Instagram: published (id=${publishData.id})`);
  return { ok: true, id: publishData.id };
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { slug: null, image: null, fb: true, ig: true };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--slug') opts.slug = args[i + 1];
    if (args[i] === '--image') opts.image = args[i + 1];
    if (args[i] === '--no-fb') opts.fb = false;
    if (args[i] === '--no-ig') opts.ig = false;
  }
  return opts;
}

async function main() {
  const opts = parseArgs();
  if (!opts.slug) {
    console.error('❌ Gunakan: node scripts/post-social.mjs --slug <artikel-slug> [--image <url>]');
    process.exit(1);
  }

  const article = readArticle(opts.slug);
  article.slug = opts.slug;

  console.log(`\n📱 Posting sosmed untuk artikel: ${article.frontmatter.title}\n`);

  const results = {};

  if (opts.fb) {
    results.facebook = await postToFacebook(article);
  }

  if (opts.ig) {
    const cover = article.frontmatter.cover;
    const igImage = opts.image || (cover ? `${CONFIG.SITE_URL}${cover}` : null);
    results.instagram = await postToInstagram(article, igImage);
  }

  console.log('\n📊 Ringkasan:');
  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
