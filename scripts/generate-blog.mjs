#!/usr/bin/env node
/**
 * AI Blog Generator untuk Pondok Pesantren Al-Musthafawiyah
 *
 * Menulis artikel blog berkualitas pakai AI (OpenAI-compatible endpoint),
 * bertema pendidikan Islam & teknologi AI, dengan dukungan cover (GDrive/URL).
 *
 * Penggunaan:
 *   node scripts/generate-blog.mjs                        # 1 artikel (tema acak)
 *   node scripts/generate-blog.mjs --count 3              # 3 artikel
 *   node scripts/generate-blog.mjs --topic "AI dalam pendidikan pesantren"
 *   node scripts/generate-blog.mjs --category "Teknologi AI"
 *   node scripts/generate-blog.mjs --cover "/images/xxx.jpg"   # cover manual/URL
 *   node scripts/generate-blog.mjs --dry-run              # preview tanpa tulis
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'src/content/blog');

// ── Env ─────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(ROOT, '.env');
  const env = { ...process.env };
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["'](.*)["']$/, '$1').trim();
    }
  }
  return env;
}
const ENV = loadEnv();

const AI_BASE_URL = ENV.AI_BASE_URL || 'https://ai.sumopod.com/v1';
const AI_API_KEY = ENV.AI_API_KEY || '';
const AI_MODEL = ENV.AI_MODEL || 'deepseek-v4.1-flash:netra';

// ── Pool topik: Pendidikan & Teknologi AI ───────────────────
const TOPICS = [
  // Pendidikan Islam & Pesantren
  { slug: 'peran-pesantren-di-era-digital', title: 'Peran Pesantren di Era Digital', category: 'Pendidikan' },
  { slug: 'metode-belajar-efektif-untuk-santri', title: 'Metode Belajar Efektif untuk Santri', category: 'Pendidikan' },
  { slug: 'integrasi-ilmu-agama-dan-ilmu-umum', title: 'Integrasi Ilmu Agama dan Ilmu Umum', category: 'Pendidikan' },
  { slug: 'pendidikan-karakter-generasi-qurani', title: 'Pendidikan Karakter Generasi Qur\'ani', category: 'Pendidikan' },
  { slug: 'kurikulum-pesantren-modern', title: 'Kurikulum Pesantren Modern', category: 'Pendidikan' },
  { slug: 'peran-guru-di-era-digital', title: 'Peran Guru di Era Digital', category: 'Pendidikan' },
  { slug: 'belajar-bahasa-arab-dengan-cara-menyenangkan', title: 'Belajar Bahasa Arab dengan Cara Menyenangkan', category: 'Pendidikan' },
  { slug: 'pendidikan-karakter-melalui-tahfidz', title: 'Pendidikan Karakter melalui Tahfidz Al-Qur\'an', category: 'Pendidikan' },

  // Teknologi & AI
  { slug: 'ai-dalam-pendidikan-pesantren', title: 'AI dalam Pendidikan Pesantren', category: 'Teknologi AI' },
  { slug: 'memanfaatkan-ai-untuk-belajar-islam', title: 'Memanfaatkan AI untuk Belajar Islam', category: 'Teknologi AI' },
  { slug: 'etika-penggunaan-ai-dalam-pendidikan', title: 'Etika Penggunaan AI dalam Pendidikan', category: 'Teknologi AI' },
  { slug: 'chatgpt-dan-media-pembelajaran-islami', title: 'ChatGPT dan Media Pembelajaran Islami', category: 'Teknologi AI' },
  { slug: 'teknologi-ai-untuk-menghafal-alquran', title: 'Teknologi AI untuk Menghafal Al-Qur\'an', category: 'Teknologi AI' },
  { slug: 'era-industri-40-dan-pendidikan-islam', title: 'Era Industri 4.0 dan Pendidikan Islam', category: 'Teknologi AI' },
  { slug: 'literasi-digital-untuk-santri', title: 'Literasi Digital untuk Santri', category: 'Teknologi AI' },
  { slug: 'tantangan-dan-peluang-ai-untuk-umat', title: 'Tantangan dan Peluang AI untuk Umat', category: 'Teknologi AI' },
];

// ── AI article writer ───────────────────────────────────────
async function generateWithAI(topic) {
  if (!AI_API_KEY) {
    throw new Error('AI_API_KEY belum diisi di .env');
  }

  const systemPrompt = [
    'Kamu adalah penulis konten profesional untuk Pondok Pesantren Al-Musthafawiyah.',
    'Tulis artikel blog dalam Bahasa Indonesia yang informatif, hangat, islami, dan SEO-friendly.',
    'Gunakan gaya yang santun, jelas, dan sesuai nilai-nilai pesantren.',
    'JANGAN gunakan markdown code fence. Struktur artikel harus pakai markdown berikut:',
    '- Awali dengan kalimat pembuka (tanpa judul besar, karena judul sudah ada di frontmatter).',
    '- Gunakan ## untuk sub-judul bagian.',
    '- Gunakan bullet (-) atau nomor (1.) untuk poin.',
    '- Boleh pakai blockquote (>) untuk kutipan ayat/hadis.',
    '- Akhiri dengan paragraf kesimpulan + ajakan ke PPDB.',
    'Artikel harus 500-900 kata, unik, bukan template, dan relevan dengan judul.',
  ].join('\n');

  const userPrompt = [
    `Judul artikel: "${topic.title}"`,
    `Kategori: ${topic.category}`,
    `Topik ini berkaitan dengan pendidikan Islam/pesantren dan teknologi AI.`,
    `Tulis artikel lengkap dengan judul di atas. Mulai langsung dari kalimat pembuka (tanpa mengulang judul sebagai heading H1).`,
  ].join('\n');

  const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 2000,
      temperature: 0.75,
    }),
  });

  if (!res.ok) {
    throw new Error(`AI request gagal (HTTP ${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('AI tidak mengembalikan konten (mungkin reasoning model). Cek AI_MODEL.');
  }
  return content;
}

// ── Slug helper ─────────────────────────────────────────────
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// ── Build markdown article ──────────────────────────────────
function buildMarkdown(topic, body, cover) {
  const today = new Date().toISOString().split('T')[0];
  const coverLine = cover ? `cover: "${cover}"` : '';
  const fm = [
    '---',
    `title: "${topic.title.replace(/"/g, '\\"')}"`,
    `description: "Artikel tentang ${topic.title.toLowerCase()} — perspektif pendidikan Islam dan teknologi AI dari Pondok Pesantren Al-Musthafawiyah."`,
    `date: ${today}`,
    `author: "Tim Redaksi Al-Musthafawiyah"`,
    `seoTitle: "${topic.title.replace(/"/g, '\\"')} | Al-Musthafawiyah"`,
    `seoDescription: "${topic.title}. Kajian pendidikan Islam dan teknologi AI dari Pondok Pesantren Al-Musthafawiyah."`,
    coverLine,
    '---',
    '',
    body.trim(),
    '',
  ].filter((l) => l !== '' || true).join('\n');

  return fm + '\n';
}

// ── Pick unused topic ───────────────────────────────────────
function pickUnusedTopic(category) {
  const existing = new Set(
    fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''))
  );
  const pool = category ? TOPICS.filter((t) => t.category === category) : TOPICS;
  const unused = pool.filter((t) => !existing.has(t.slug));
  if (unused.length === 0) return null;
  return unused[Math.floor(Math.random() * unused.length)];
}

// ── CLI ─────────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { count: 1, topic: null, category: null, cover: null, dryRun: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--count') opts.count = parseInt(args[i + 1], 10) || 1;
    if (args[i] === '--topic') opts.topic = args[i + 1];
    if (args[i] === '--category') opts.category = args[i + 1];
    if (args[i] === '--cover') opts.cover = args[i + 1];
    if (args[i] === '--dry-run') opts.dryRun = true;
  }
  return opts;
}

function findTopic(query) {
  return TOPICS.find(
    (t) => t.slug === slugify(query) || t.title.toLowerCase().includes(query.toLowerCase())
  );
}

async function main() {
  const opts = parseArgs();
  let generated = 0;

  const topicsToWrite = [];
  if (opts.topic) {
    const t = findTopic(opts.topic);
    if (!t) {
      console.error(`❌ Topik "${opts.topic}" tidak ditemukan.`);
      process.exit(1);
    }
    topicsToWrite.push(t);
  } else {
    for (let i = 0; i < opts.count; i++) {
      const t = pickUnusedTopic(opts.category);
      if (!t) {
        console.log('⚠️  Semua topik sudah dipakai. Tambahkan topik baru.');
        break;
      }
      topicsToWrite.push(t);
    }
  }

  for (const topic of topicsToWrite) {
    console.log(`\n🤖 Menulis artikel: "${topic.title}" (${topic.category})...`);

    let body;
    if (opts.dryRun && !AI_API_KEY) {
      body = '_(DRY RUN tanpa AI — isi placeholder)_';
    } else {
      body = await generateWithAI(topic);
    }

    const md = buildMarkdown(topic, body, opts.cover);

    if (opts.dryRun) {
      console.log('─── PREVIEW (dry-run) ───');
      console.log(md.slice(0, 600) + '...');
      generated++;
      continue;
    }

    fs.mkdirSync(BLOG_DIR, { recursive: true });
    const filePath = path.join(BLOG_DIR, `${topic.slug}.md`);
    fs.writeFileSync(filePath, md, 'utf8');
    console.log(`✅ Ditulis: ${filePath}`);
    generated++;
  }

  console.log(`\n🎉 Selesai! ${generated} artikel dihasilkan.`);
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
