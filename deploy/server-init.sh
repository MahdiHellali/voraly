#!/usr/bin/env bash
#
# Voraly VPS bootstrap + hardening script.
# Idempotent: safe to re-run. Run as root (or via sudo) on a fresh Ubuntu host.
#
#   sudo bash server-init.sh
#
# It does NOT touch /etc/ssh/sshd_config password settings — disabling password
# auth is handled separately/manually to avoid accidental SSH lockout.

set -euo pipefail

echo "==> Voraly server-init starting"

# ---------------------------------------------------------------------------
# 1. Swap. 4 GB RAM is tight for a Next.js build, so add a 4 GB swapfile.
# ---------------------------------------------------------------------------
if [ ! -f /swapfile ]; then
  echo "==> Creating 4 GB swapfile at /swapfile"
  # fallocate is fast; fall back to dd if the filesystem doesn't support it.
  fallocate -l 4G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=4096
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
else
  echo "==> /swapfile already exists, skipping creation"
  # Make sure it's actually on.
  swapon --show | grep -q '/swapfile' || swapon /swapfile
fi

# Persist swap across reboots.
if ! grep -q '^/swapfile ' /etc/fstab; then
  echo "/swapfile none swap sw 0 0" >> /etc/fstab
fi

# Prefer RAM, only swap when needed.
if ! grep -q '^vm.swappiness=10' /etc/sysctl.conf; then
  echo "vm.swappiness=10" >> /etc/sysctl.conf
fi
sysctl vm.swappiness=10

# ---------------------------------------------------------------------------
# 2. System packages.
# ---------------------------------------------------------------------------
echo "==> Updating and upgrading system packages"
export DEBIAN_FRONTEND=noninteractive
apt update
apt -y upgrade

echo "==> Installing base packages"
apt -y install ca-certificates curl ufw fail2ban unattended-upgrades

# ---------------------------------------------------------------------------
# 3. Firewall (ufw). Deny all inbound except SSH + HTTP + HTTPS.
# ---------------------------------------------------------------------------
echo "==> Configuring ufw"
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ---------------------------------------------------------------------------
# 4. fail2ban (brute-force protection for sshd) + unattended-upgrades.
# ---------------------------------------------------------------------------
echo "==> Enabling fail2ban (sshd jail) and unattended-upgrades"
systemctl enable --now fail2ban
systemctl enable --now unattended-upgrades

# ---------------------------------------------------------------------------
# 5. Docker (official convenience script) + compose plugin.
# ---------------------------------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  echo "==> Installing Docker via get.docker.com"
  curl -fsSL https://get.docker.com | sh
else
  echo "==> Docker already installed, skipping"
fi

# Let the `ubuntu` user run docker without sudo.
if id ubuntu >/dev/null 2>&1; then
  usermod -aG docker ubuntu
fi

systemctl enable --now docker

# ---------------------------------------------------------------------------
# 6. Summary.
# ---------------------------------------------------------------------------
echo ""
echo "==================== server-init complete ===================="
echo " Swap:     $(swapon --show --noheadings | awk '{print $1, $3}' | tr '\n' ' ')"
echo " Firewall: $(ufw status | head -n1)"
echo " fail2ban: $(systemctl is-active fail2ban)"
echo " upgrades: $(systemctl is-active unattended-upgrades)"
echo " Docker:   $(docker --version 2>/dev/null || echo 'not found')"
echo "=============================================================="
echo " Next: log out/in (or 'newgrp docker') so the docker group applies,"
echo "       set deploy/.env.production, point DNS, then run deploy.sh"
