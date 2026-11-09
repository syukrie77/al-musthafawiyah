#!/usr/bin/env node
/**
 * Full Automation Pipeline untuk Pondok Pesantren Al-Musthafawiyah
 *
 * Menjalankan:
 *   1. Generate artikel blog baru (AI)
 *   2. Build Astro
 *   3. Deploy ke webroot Nginx (mockup1.aretanet.com / server ini)
 *   4. Auto-post ke Facebook Fanpage & Instagram (jika token diisi)
 *
 * Penggunaan:
 *   node scripts/automate.mjs                       # full pipeline (1 artikel)
 *   node scripts/automate.mjs --count 2             # 2 artikel
 *   node scripts/automate.mjs --category "Teknologi AI"
 *   node scripts/automate.mjs --skip-social         # tanpa posting sosmed
 *   node scripts/automate.mjs --dry-run             # generate preview saja
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

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

const WEBROOT = ENV.WEBROOT || '/var/www/mockup1.aretanet.com';

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { count: 1, category: null, skipSocial: false, dryRun: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--count') opts.count = parseInt(args[i + 1], 10) || 1;
    if (args[i] === '--category') opts.category = args[i + 1];
    if (args[i] === '--skip-social') opts.skipSocial = true;
    if (args[i] === '--dry-run') opts.dryRun = true;
  }
  return opts;
}

function run(cmd, opts = {}) {
  return execSync(cmd, { cwd: ROOT, stdio: opts.inherit ? 'inherit' : 'pipe', ...opts }).toString();
}

function main() {
  const opts = parseArgs();

  console.log('🤖 Al-Musthafawiyah Automation Pipeline');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // ── Step 1: Generate ──────────────────────────────────────
  console.log(`\n📝 Step 1: Generate ${opts.count} artikel blog (AI)...`);
  const genArgs = ['node', 'scripts/generate-blog.mjs', '--count', String(opts.count)];
  if (opts.category) genArgs.push('--category', opts.category);
  if (opts.dryRun) genArgs.push('--dry-run');
  run(genArgs.join(' '), { inherit: true });

  if (opts.dryRun) {
    console.log('\n🏁 DRY RUN selesai. Tidak ada file yang ditulis/deploy.');
    return;
  }

  // ── Step 2: Build ─────────────────────────────────────────
  console.log('\n📦 Step 2: Build Astro...');
  run('npm run build', { inherit: true });

  // ── Step 3: Deploy ────────────────────────────────────────
  console.log(`\n🚀 Step 3: Deploy ke ${WEBROOT}...`);
  try {
    run(`sudo mkdir -p ${WEBROOT}`);
    run(`sudo rsync -a --delete ${ROOT}/dist/ ${WEBROOT}/`);
    run(`sudo chown -R www-data:www-data ${WEBROOT}`);
    run(`sudo find ${WEBROOT} -type d -exec chmod 755 {} \\;`);
    run(`sudo find ${WEBROOT} -type f -exec chmod 644 {} \\;`);
    console.log('✅ Deploy selesai');
  } catch (err) {
    console.error('⚠️  Deploy error:', err.message);
  }

  // ── Step 4: Social ────────────────────────────────────────
  if (opts.skipSocial) {
    console.log('\n⏭  Step 4: Social media posting dilewati (--skip-social)');
  } else {
    console.log('\n📱 Step 4: Post ke sosmed...');
    const blogDir = path.join(ROOT, 'src/content/blog');
    const slugs = fs.readdirSync(blogDir).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''));
    // Posting artikel terbaru (diurutkan berdasarkan mtime)
    const recent = slugs
      .map((s) => ({ s, mtime: fs.statSync(path.join(blogDir, s + '.md')).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, opts.count);

    for (const { s } of recent) {
      try {
        run(`node scripts/post-social.mjs --slug ${s}`, { inherit: true });
      } catch (err) {
        console.error(`⚠️  Gagal post ${s}: ${err.message}`);
      }
    }
  }

  console.log('\n🏁 Al-Musthafawiyah Automation Pipeline selesai!');
}

main();
