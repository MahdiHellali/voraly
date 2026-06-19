# Voraly deployment

Production stack for a single OVH VPS (2 vCore / 4 GB RAM): Caddy (TLS + reverse
proxy) → Next.js `web` app + self-hosted `n8n`, all on one Docker network. Only
Caddy is publicly exposed (ports 80/443); `web` and `n8n` are internal-only.

Domains: `voraly.net` / `www.voraly.net` (site), `n8n.voraly.net` (n8n editor),
`stats.voraly.net` (Matomo analytics).
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

## Matomo (stats.voraly.net) — install & hardening runbook

Matomo (`matomo` + `matomo-db`) is internal-only; Caddy proxies `stats.voraly.net`
to `matomo:80`. The public setup wizard is dangerous if left open, so it is locked
behind Caddy basic auth during install (security review).

1. **Fill the Matomo vars** in `.env.production`:
   `MATOMO_DOMAIN`, `MATOMO_DB_PASSWORD`, `MATOMO_DB_ROOT_PASSWORD`,
   `MATOMO_SETUP_USER`, `MATOMO_SETUP_HASH`. Generate the hash:
   ```bash
   docker run --rm caddy:2-alpine caddy hash-password --plaintext 'a-strong-pass'
   ```

2. **Cloudflare**: A record `stats` → `152.228.128.234`. Keep SSL/TLS mode on
   **Full (strict)** so the HSTS header and Caddy's Let's Encrypt cert are honored.

3. **Deploy**: `bash deploy.sh`. Browse `https://stats.voraly.net` — the browser
   asks for the basic-auth user/pass, then Matomo's installer runs. Complete it
   (it writes `config.ini.php` into the `matomo_data` volume).

4. **Harden `config.ini.php`** (the installer does NOT set these). Append under
   `[General]` inside the container, then restart it:
   ```ini
   [General]
   trusted_hosts[] = "stats.voraly.net"
   assume_secure_protocol = 1
   force_ssl = 1
   proxy_client_headers[] = "HTTP_X_FORWARDED_FOR"
   proxy_host_headers[] = "HTTP_X_FORWARDED_HOST"
   ; Real visitor IP behind Cloudflare (otherwise all visitors look like Cloudflare):
   proxy_client_headers[] = "HTTP_CF_CONNECTING_IP"
   ```
   `docker compose --env-file .env.production restart matomo`

5. **Go public**: only after steps 3–4, remove the `basic_auth { ... }` block from
   the `stats.voraly.net` site in `Caddyfile`, then `bash deploy.sh`. Visitor
   tracking (matomo.php / matomo.js) needs to be publicly reachable.

## Notes

- On 4 GB RAM the Next.js build relies on the swapfile. If a build is OOM-killed,
  stop n8n first (`docker compose --env-file .env.production stop n8n`), re-run
  `deploy.sh`, then start n8n again.
- The real `.env.production` is **gitignored** — keep a copy somewhere safe.
