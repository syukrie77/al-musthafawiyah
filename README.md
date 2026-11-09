# Pondok Pesantren Al-Musthafawiyah — Website Pintar

Website resmi Pondok Pesantren Al-Musthafawiyah yang dibangun dengan **Astro JS + TailwindCSS + MDX**, dengan arsitektur *agentic AI* ala Sekolah AI / AI Boarding School.

## ✨ Fitur

- **SEO dengan AI** — schema.org (EducationalOrganization, WebSite, BlogPosting, FAQPage, Event, BreadcrumbList), sitemap otomatis, RSS, Open Graph, Twitter Card, robots.txt, llms.txt.
- **Auto-blog terjadwal** — artikel/berita dibuat otomatis oleh AI (konten + topik islami/pesantren).
- **Auto-cover AI** — gambar OG & cover dibuat programatik (hijau islami + emas).
- **Auto-post sosmed** — integrasi Facebook Fanpage & Instagram via Graph API v21.0.
- **WhatsApp AI widget** — chatbot intent-based untuk PPDB & informasi pesantren.
- **Decap CMS** — manajemen konten (opsional).

## 🛠️ Teknologi

- [Astro 4](https://astro.build) — framework statis yang cepat
- [TailwindCSS 3](https://tailwindcss.com) — styling
- MDX — konten blog
- `@astrojs/sitemap`, `@astrojs/tailwind`, `@tailwindcss/typography`, `sharp`

## 🎨 Tema

- Hijau islami `#1a6b3c` + emas `#c9a84c`
- Font: **Poppins** (body) + **Amiri** (judul/serif)

## 📁 Struktur

```
src/
  components/   # Header (top bar + lang + dropdown), Footer, WhatsAppChat, dll
  content/      # Blog MDX (auto-generated)
  data/         # site.json, agenda.json, knowledge.json
  layouts/      # Layout.astro
  lib/          # seo.ts (schema builders)
  pages/        # index, tentang, pendidikan, ppdb, blog, faq, kontak, 404, rss, sitemap
scripts/
  generate-blog.mjs   # auto-generate artikel
  make-og-image.mjs   # generate OG/cover
  post-social.mjs     # post ke FB & IG
  automate.mjs        # pipeline lengkap
```

## 🚀 Menjalankan

```bash
npm install
npm run dev          # dev server
npm run build        # build produksi
```

## 🤖 Otomasi

Lihat [docs/AUTOMASI.md](docs/AUTOMASI.md) untuk detail lengkap pipeline otomasi.
