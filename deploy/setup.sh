#!/usr/bin/env bash
# ============================================================================
#  abyn.xyz — VPS Setup Script
#  Prepares a fresh Ubuntu/Debian server to run the portfolio.
#  Run once on a brand-new machine. Re-running is safe (idempotent).
# ============================================================================

set -euo pipefail

# ── ANSI helpers ─────────────────────────────────────────────────────────────
BOLD="\033[1m"
DIM="\033[2m"
GREEN="\033[32m"
YELLOW="\033[33m"
RED="\033[31m"
CYAN="\033[36m"
RESET="\033[0m"

ok()   { echo -e " ${GREEN}✓${RESET}  $*"; }
warn() { echo -e " ${YELLOW}⚠${RESET}  $*"; }
err()  { echo -e " ${RED}✗${RESET}  $*"; }
step() { echo -e "\n${BOLD}${CYAN}──  $*${RESET}"; }

# ── Spinner ───────────────────────────────────────────────────────────────────
spinner_start() {
  local msg="$1"
  local frames=("⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏")
  local i=0
  printf "    "
  while true; do
    printf "\r    ${CYAN}%s${RESET}  %s" "${frames[$((i % ${#frames[@]}))]}" "$msg"
    i=$((i + 1))
    sleep 0.1
  done
}

spinner_stop() {
  kill "$SPINNER_PID" 2>/dev/null || true
  wait "$SPINNER_PID" 2>/dev/null || true
  printf "\r\033[K"
}

run_with_spinner() {
  local msg="$1"; shift
  spinner_start "$msg" &
  SPINNER_PID=$!
  "$@" &>/dev/null
  local exit_code=$?
  spinner_stop
  if [ $exit_code -eq 0 ]; then
    ok "$msg"
  else
    err "$msg (exit code $exit_code)"
    exit $exit_code
  fi
}

# ── Config ────────────────────────────────────────────────────────────────────
DEPLOY_DIR="/var/www/abyndotxyz"
BIN_DIR="$DEPLOY_DIR/bin"
RAW_BASE="https://raw.githubusercontent.com/abyn365/abyndotxyz/main/deploy"
YT_DLP_URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp"

# ── Banner ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${CYAN}   ██████╗ ██████╗ ██╗   ██╗███╗   ██╗"
echo -e "  ██╔══██╗██╔══██╗╚██╗ ██╔╝████╗  ██║"
echo -e "  ███████║██████╔╝ ╚████╔╝ ██╔██╗ ██║"
echo -e "  ██╔══██║██╔══██╗  ╚██╔╝  ██║╚██╗██║"
echo -e "  ██║  ██║██████╔╝   ██║   ██║ ╚████║"
echo -e "  ╚═╝  ╚═╝╚═════╝    ╚═╝   ╚═╝  ╚═══╝${RESET}"
echo ""
echo -e "${DIM}  abyn.xyz — VPS Setup  •  Fresh install script${RESET}"
echo -e "${DIM}  Deployment target: ${DEPLOY_DIR}${RESET}"
echo ""

# ── Step 1: System dependencies ──────────────────────────────────────────────
step "Step 1/5 — System dependencies"
if command -v apt &>/dev/null; then
  run_with_spinner "Updating package lists" sudo apt-get update -qq
  run_with_spinner "Installing curl, unzip, python3, ffmpeg" \
    sudo apt-get install -y -qq curl unzip python3 ffmpeg
else
  warn "apt not found — skipping system package install (non-Debian OS?)"
fi

# ── Step 2: Bun runtime ───────────────────────────────────────────────────────
step "Step 2/5 — Bun runtime"
if command -v bun &>/dev/null; then
  ok "Bun already installed: $(bun --version)"
else
  run_with_spinner "Installing Bun via official installer" \
    bash -c 'curl -fsSL https://bun.sh/install | bash'
  # Make bun available in this session
  export BUN_INSTALL="${HOME}/.bun"
  export PATH="${BUN_INSTALL}/bin:${PATH}"
  if command -v bun &>/dev/null; then
    ok "Bun installed: $(bun --version)"
  else
    warn "Bun installed but not yet in PATH — open a new shell or run: source ~/.bashrc"
  fi
fi

# Symlink bun globally so systemd can find it
BUN_BIN=$(command -v bun 2>/dev/null || echo "${HOME}/.bun/bin/bun")
if [ -f "$BUN_BIN" ] && [ ! -f "/usr/local/bin/bun" ]; then
  run_with_spinner "Symlinking bun to /usr/local/bin/bun" \
    sudo ln -sf "$BUN_BIN" /usr/local/bin/bun
fi

# ── Step 3: Deployment directory ─────────────────────────────────────────────
step "Step 3/5 — Deployment directory"
run_with_spinner "Creating ${DEPLOY_DIR}" \
  bash -c "sudo mkdir -p '${BIN_DIR}' && sudo chown -R '${USER}:${USER}' '${DEPLOY_DIR}'"
ok "Directory ready: ${DEPLOY_DIR}"

# ── Step 4: Download assets ───────────────────────────────────────────────────
step "Step 4/5 — Downloading assets"

# yt-dlp
run_with_spinner "Downloading yt-dlp binary" \
  curl -fsSL "$YT_DLP_URL" -o "${BIN_DIR}/yt-dlp"
chmod +x "${BIN_DIR}/yt-dlp"
ok "yt-dlp $(${BIN_DIR}/yt-dlp --version 2>/dev/null || echo 'installed')"

# Deploy scripts — prefer local repo copy, fall back to GitHub
if [ -f "$(dirname "$0")/update.sh" ]; then
  SCRIPTS_SRC="$(dirname "$0")"
  run_with_spinner "Copying deploy scripts from local repo" \
    bash -c "cp '${SCRIPTS_SRC}/update.sh' '${DEPLOY_DIR}/update.sh' && \
             cp '${SCRIPTS_SRC}/start.sh'  '${DEPLOY_DIR}/start.sh'  && \
             cp '${SCRIPTS_SRC}/ecosystem.config.js' '${DEPLOY_DIR}/ecosystem.config.js' && \
             cp '${SCRIPTS_SRC}/.env.example' '${DEPLOY_DIR}/.env.example'"
else
  run_with_spinner "Downloading deploy scripts from GitHub" \
    bash -c "curl -fsSL '${RAW_BASE}/update.sh'           -o '${DEPLOY_DIR}/update.sh' && \
             curl -fsSL '${RAW_BASE}/start.sh'            -o '${DEPLOY_DIR}/start.sh'  && \
             curl -fsSL '${RAW_BASE}/ecosystem.config.js' -o '${DEPLOY_DIR}/ecosystem.config.js' && \
             curl -fsSL '${RAW_BASE}/.env.example'        -o '${DEPLOY_DIR}/.env.example'"
fi

chmod +x "${DEPLOY_DIR}/update.sh" "${DEPLOY_DIR}/start.sh"

# ── Step 5: Configuration ─────────────────────────────────────────────────────
step "Step 5/5 — Configuration"

# .env
if [ ! -f "${DEPLOY_DIR}/.env" ]; then
  cp "${DEPLOY_DIR}/.env.example" "${DEPLOY_DIR}/.env"
  ok ".env created from template"
  echo ""
  echo -e "  ${YELLOW}${BOLD}┌─ ACTION REQUIRED ──────────────────────────────────────────┐${RESET}"
  echo -e "  ${YELLOW}${BOLD}│${RESET}  Open ${DEPLOY_DIR}/.env and fill in your API keys:          ${YELLOW}${BOLD}│${RESET}"
  echo -e "  ${YELLOW}${BOLD}│${RESET}  • SPOTIFY_CLIENT_ID / SECRET / REFRESH_TOKEN              ${YELLOW}${BOLD}│${RESET}"
  echo -e "  ${YELLOW}${BOLD}│${RESET}  • LASTFM_API_KEY / LASTFM_USERNAME                        ${YELLOW}${BOLD}│${RESET}"
  echo -e "  ${YELLOW}${BOLD}│${RESET}  • LOCATION_SECRET, GITHUB_TOKEN, etc.                     ${YELLOW}${BOLD}│${RESET}"
  echo -e "  ${YELLOW}${BOLD}└────────────────────────────────────────────────────────────┘${RESET}"
  echo ""
else
  ok ".env already exists — preserved"
fi

# Systemd service
SYSTEMD_SRC="${DEPLOY_DIR}/systemd.service"

# Download systemd service file if not present
if [ ! -f "$SYSTEMD_SRC" ]; then
  run_with_spinner "Downloading systemd service file" \
    curl -fsSL "${RAW_BASE}/systemd.service" -o "$SYSTEMD_SRC"
fi

# Patch ExecStart with resolved bun path
sed -i "s|ExecStart=.*|ExecStart=${BUN_BIN:-/usr/local/bin/bun} /var/www/abyndotxyz/server.js|" "$SYSTEMD_SRC" 2>/dev/null || true

if command -v systemctl &>/dev/null && [ -d "/etc/systemd/system" ]; then
  run_with_spinner "Installing systemd service" \
    sudo cp "$SYSTEMD_SRC" /etc/systemd/system/abyndotxyz.service
  run_with_spinner "Enabling systemd service" \
    bash -c "sudo systemctl daemon-reload && sudo systemctl enable abyndotxyz"

  if [ -f "${DEPLOY_DIR}/server.js" ]; then
    run_with_spinner "Starting service" sudo systemctl start abyndotxyz
    ok "Service started — check logs: journalctl -u abyndotxyz -f"
  else
    warn "server.js not yet deployed — run update.sh to deploy the first build"
    warn "Then start with: sudo systemctl start abyndotxyz"
  fi
else
  warn "systemd not available — start manually with: ${DEPLOY_DIR}/start.sh"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}  ╔══════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${GREEN}  ║  Setup complete!                                         ║${RESET}"
echo -e "${BOLD}${GREEN}  ╚══════════════════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "  ${BOLD}Deployment dir :${RESET} ${DEPLOY_DIR}"
echo -e "  ${BOLD}yt-dlp binary  :${RESET} ${BIN_DIR}/yt-dlp"
echo -e "  ${BOLD}Bun binary     :${RESET} $(command -v bun 2>/dev/null || echo '~/.bun/bin/bun')"
echo ""
echo -e "  ${BOLD}Next steps:${RESET}"
echo -e "  ${DIM}1.${RESET} Edit ${YELLOW}${DEPLOY_DIR}/.env${RESET} with your secrets"
echo -e "  ${DIM}2.${RESET} Run   ${CYAN}${DEPLOY_DIR}/update.sh${RESET}  to pull the first build"
echo -e "  ${DIM}3.${RESET} Check ${CYAN}sudo journalctl -u abyndotxyz -f${RESET}  for logs"
echo ""
