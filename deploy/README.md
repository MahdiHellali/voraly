# Voraly deployment

Production stack for a single OVH VPS (2 vCore / 4 GB RAM): Caddy (TLS + reverse
proxy) → Next.js `web` app + self-hosted `n8n`, all on one Docker network. Only
Caddy is publicly exposed (ports 80/443); `web` and `n8n` are internal-only.

Domains: `voraly.net` / `www.voraly.net` (site), `n8n.voraly.net` (n8n editor).
Server IP: `152.228.128.234`.

## Order of operations

1. **Harden the server** (once, as root):
   ```bash
   sudo bash server-init.sh
   ```
   Sets up swap, firewall (ufw), fail2ban, unattended-upgrades, and Docker.
   Log out/in afterwards so the `docker` group membership applies.

2. **Configure secrets**:
   ```bash
   cp .env.production.example .env.production
   # edit .env.production with the real values
   ```
   The real `.env.production` is gitignored and must never be committed.

3. **Point DNS** at the server. Create A records:
   - `voraly.net` → `152.228.128.234`
   - `www.voraly.net` → `152.228.128.234`
   - `n8n.voraly.net` → `152.228.128.234`

   Caddy auto-provisions Let's Encrypt certificates once DNS resolves.

4. **Deploy**:
   ```bash
   bash deploy.sh
   ```

## Common operations

- **View logs**: `docker compose logs -f web` (or `caddy`, `n8n`)
- **Update / redeploy**: `bash deploy.sh` (pulls latest, rebuilds, restarts)
- **Stop the stack**: `docker compose --env-file .env.production down`

## Notes

- On 4 GB RAM the Next.js build relies on the swapfile. If a build is OOM-killed,
  stop n8n first (`docker compose --env-file .env.production stop n8n`), re-run
  `deploy.sh`, then start n8n again.
- The real `.env.production` is **gitignored** — keep a copy somewhere safe.
