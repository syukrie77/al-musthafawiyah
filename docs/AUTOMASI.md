# Panduan Otomasi — Al-Musthafawiyah

Pipeline otomasi website ini memungkinkan website "pintar" yang:

1. **Generate artikel/berita** secara otomatis (konten islami/pesantren)
2. **Generate cover/gambar** secara otomatis
3. **Deploy** otomatis (Netlify) via git push
4. **Posting** otomatis ke Facebook & Instagram

## 1. Prasyarat

### Environment Variables

Salin `.env.example` ke `.env` lalu isi:

```bash
FB_PAGE_ID=...
FB_PAGE_ACCESS_TOKEN=...
IG_USER_ID=...
IG_ACCESS_TOKEN=...
SITE_URL=https://almusthafawiyah.sch.id
```

> **Cara dapat token:** [Facebook Graph API Explorer](https://developers.facebook.com/tools/explorer/).
> Instagram harus akun **Business/Creator** yang terhubung ke Facebook Page.

## 2. Generate Artikel

```bash
npm run blog:new                         # 1 artikel acak
npm run blog:new:tahfidz                 # kategori Tahfidz & Al-Qur'an
npm run blog:new:kitab                   # kategori Kitab Kuning
npm run blog:new:bahasa                  # kategori Bahasa Arab & Inggris
npm run blog:new:islami                  # kategori Artikel Islami

# atau manual:
node scripts/generate-blog.mjs --count 3
node scripts/generate-blog.mjs --topic "tahfidz"
node scripts/generate-blog.mjs --dry-run
```

## 3. Generate OG Image / Cover

```bash
npm run og:image
node scripts/make-og-image.mjs
```

Menghasilkan `public/images/og-default.svg/png/jpg` dengan tema hijau islami + emas.

## 4. Posting ke Sosmed

```bash
npm run social:post -- --slug <slug-artikel>
node scripts/post-social.mjs --slug <slug> --image <url-cover>
```

## 5. Pipeline Lengkap

```bash
npm run automate                # generate + commit + push + post sosmed
npm run automate -- --count 2   # 2 artikel
npm run automate -- --skip-social
npm run automate:dry            # preview tanpa tulis
```

## 6. Penjadwalan Otomatis (Cron)

Pasang cron di server/GitHub Actions agar berjalan terjadwal, misal setiap hari:

```bash
0 6 * * * cd /path/to/project && node scripts/automate.mjs >> automate.log 2>&1
```

## Alur Arsitektur

```
generate-blog.mjs  →  src/content/blog/*.md  →  git push  →  Netlify deploy
       ↓
make-og-image.mjs  →  public/images/og-*.{png,jpg}
       ↓
post-social.mjs    →  Facebook Fanpage + Instagram
```
