#!/usr/bin/env bash
# Deploy Al-Musthafawiyah (almusthafawiyah.sch.id) — build Astro lalu sync ke webroot Nginx
# Jalankan: bash deploy/deploy.sh

set -euo pipefail

# ── Config ─────────────────────────────────────────────────
REPO_DIR="${REPO_DIR:-/home/ubuntu/.openclaw/workspace/almusthafawiyah-site}"
WEBROOT="${WEBROOT:-/var/www/almusthafawiyah.sch.id}"
DOMAIN="${DOMAIN:-almusthafawiyah.sch.id}"
NGINX_CONF_SRC="${NGINX_CONF_SRC:-$REPO_DIR/deploy/nginx-almusthafawiyah.sch.id.conf}"

# ── Warna ───────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}[deploy]${NC} $*"; }
warn() { echo -e "${YELLOW}[deploy]${NC} $*"; }
err()  { echo -e "${RED}[deploy]${NC} $*" >&2; }

if [ ! -d "$REPO_DIR" ]; then
    err "Repo tidak ditemukan: $REPO_DIR"
    exit 1
fi

cd "$REPO_DIR"
log "Repo: $REPO_DIR"
log "Webroot: $WEBROOT"
log "Domain: $DOMAIN"

# ── 1. Build ───────────────────────────────────────────────
log "Building Astro..."
npm run build 2>&1 | tail -5

if [ ! -d "$REPO_DIR/dist" ]; then
    err "Build gagal — folder dist/ tidak ada"
    exit 1
fi

# ── 2. Backup webroot lama ────────────────────────────────
if [ -d "$WEBROOT" ] && [ -n "$(ls -A "$WEBROOT" 2>/dev/null)" ]; then
    BACKUP_DIR="${WEBROOT}.backup.$(date +%Y%m%d-%H%M%S)"
    warn "Backup webroot lama → $BACKUP_DIR"
    sudo cp -r "$WEBROOT" "$BACKUP_DIR" 2>/dev/null || true
fi

# ── 3. Sync ke webroot ────────────────────────────────────
log "Sync dist/ → $WEBROOT/"
sudo mkdir -p "$WEBROOT"
sudo rsync -a --delete "$REPO_DIR/dist/" "$WEBROOT/"
log "✅ Sync selesai"

# ── 4. Permission ─────────────────────────────────────────
sudo chown -R www-data:www-data "$WEBROOT" 2>/dev/null || true
sudo find "$WEBROOT" -type d -exec chmod 755 {} \; 2>/dev/null || true
sudo find "$WEBROOT" -type f -exec chmod 644 {} \; 2>/dev/null || true

# ── 5. Nginx config ───────────────────────────────────────
if [ -f "$NGINX_CONF_SRC" ]; then
    log "Pasang config Nginx untuk $DOMAIN..."
    sudo cp "$NGINX_CONF_SRC" "/etc/nginx/sites-available/$DOMAIN"
    sudo ln -sf "/etc/nginx/sites-available/$DOMAIN" "/etc/nginx/sites-enabled/$DOMAIN"
fi

# ── 6. Reload Nginx ───────────────────────────────────────
if command -v nginx >/dev/null 2>&1 || [ -x /usr/sbin/nginx ]; then
    if sudo nginx -t 2>/dev/null; then
        sudo systemctl reload nginx 2>/dev/null || sudo nginx -s reload 2>/dev/null || true
        log "✅ Nginx di-reload"
    else
        warn "Konfigurasi Nginx tidak valid — skip reload"
    fi
fi

# ── 7. Ringkasan ──────────────────────────────────────────
COUNT_ARTICLE=$(find "$REPO_DIR/src/content/blog" -name '*.md' | wc -l | tr -d ' ')
COUNT_DIST=$(find "$WEBROOT" -type f | wc -l | tr -d ' ')

log ""
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "🎉 Deploy berhasil!"
log "  • Artikel blog : $COUNT_ARTICLE"
log "  • File di-dist  : $COUNT_DIST"
log "  • Webroot       : $WEBROOT"
log "  • URL           : http://$DOMAIN/"
log "  • Waktu         : $(date '+%Y-%m-%d %H:%M:%S %Z')"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
