#!/usr/bin/env bash
# ============================================================================
#  abyn.xyz — Graceful Production Update Script
#  Downloads or uses a local build zip, atomically swaps it into place,
#  and restarts the server — preserving .env, kv.sqlite, and bin/.
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
err()  { echo -e " ${RED}✗${RESET}  $*" >&2; }
step() { echo -e "\n${BOLD}${CYAN}──  $*${RESET}"; }
info() { echo -e " ${DIM}·${RESET}  $*"; }

# ── Spinner ───────────────────────────────────────────────────────────────────
SPINNER_PID=""
spinner_start() {
  local msg="$1"
  local frames=("⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏")
  local i=0
  while true; do
    printf "\r    ${CYAN}%s${RESET}  %s" "${frames[$((i % ${#frames[@]}))]}" "$msg"
    i=$((i + 1))
    sleep 0.1
  done
}

spinner_stop() {
  [ -n "$SPINNER_PID" ] && { kill "$SPINNER_PID" 2>/dev/null; wait "$SPINNER_PID" 2>/dev/null || true; }
  SPINNER_PID=""
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
STAGE_DIR="$DEPLOY_DIR/stage_new"
BACKUP_DIR="$DEPLOY_DIR/backup_old"
DEFAULT_RELEASE_URL="https://github.com/abyn365/abyndotxyz/releases/download/latest/abyndotxyz-build.zip"

# ── Help ──────────────────────────────────────────────────────────────────────
show_help() {
  echo ""
  echo -e "${BOLD}Usage:${RESET} $0 [options]"
  echo ""
  echo -e "${BOLD}Options:${RESET}"
  echo -e "  ${CYAN}-u, --url <url>${RESET}      URL to download the build zip from"
  echo -e "  ${CYAN}-f, --file <path>${RESET}    Local path to the build zip"
  echo -e "  ${CYAN}-h, --help${RESET}           Show this message"
  echo ""
  echo -e "${DIM}If neither -u nor -f is provided, defaults to the latest GitHub release:${RESET}"
  echo -e "  ${DIM}${DEFAULT_RELEASE_URL}${RESET}"
  echo ""
}

# ── Banner ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${CYAN}  abyn.xyz  •  Graceful Update${RESET}  ${DIM}$(date '+%Y-%m-%d %H:%M:%S')${RESET}"
echo -e "${DIM}  ──────────────────────────────────────────${RESET}"

# ── Arg parsing ───────────────────────────────────────────────────────────────
ZIP_URL=""
ZIP_PATH=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -u|--url)  ZIP_URL="$2"; shift 2 ;;
    -f|--file) ZIP_PATH="$2"; shift 2 ;;
    -h|--help) show_help; exit 0 ;;
    *) err "Unknown option: $1"; show_help; exit 1 ;;
  esac
done

if [ -z "$ZIP_URL" ] && [ -z "$ZIP_PATH" ]; then
  info "No build source specified — using latest GitHub release"
  ZIP_URL="$DEFAULT_RELEASE_URL"
fi

echo ""

# ── Step 1: Download ──────────────────────────────────────────────────────────
step "Step 1/4 — Fetching build artifact"
cd "$DEPLOY_DIR"

if [ -n "$ZIP_URL" ]; then
  ZIP_PATH="/tmp/abyndotxyz-build-latest.zip"
  run_with_spinner "Downloading build from URL" curl -fsSL "$ZIP_URL" -o "$ZIP_PATH"
else
  if [ ! -f "$ZIP_PATH" ]; then
    err "Local file not found: $ZIP_PATH"
    exit 1
  fi
  ok "Using local file: $ZIP_PATH"
fi

# ── Step 2: Stage ─────────────────────────────────────────────────────────────
step "Step 2/4 — Staging new build"
run_with_spinner "Extracting build archive" \
  bash -c "rm -rf '${STAGE_DIR}' && mkdir -p '${STAGE_DIR}' && unzip -q '${ZIP_PATH}' -d '${STAGE_DIR}'"

if [ ! -f "${STAGE_DIR}/server.js" ]; then
  err "Invalid build: ${STAGE_DIR}/server.js not found. Aborting."
  rm -rf "$STAGE_DIR"
  exit 1
fi
ok "Build staged and validated"

# ── Step 3: Backup + swap ─────────────────────────────────────────────────────
step "Step 3/4 — Swapping into production"

# Log what will be preserved before touching anything
echo ""
echo -e "  ${DIM}Checking preserved files...${RESET}"
PRESERVED=()
for pf in ".env" "kv.sqlite" "kv.sqlite-wal" "kv.sqlite-shm" "bin"; do
  if [ -e "${DEPLOY_DIR}/${pf}" ]; then
    PRESERVED+=("$pf")
  fi
done

# Backup current files (excluding preserved items + staging dirs)
run_with_spinner "Creating backup of current deployment" \
  bash -c "rm -rf '${BACKUP_DIR}' && mkdir -p '${BACKUP_DIR}'"

shopt -s extglob dotglob
for item in !(.env|kv.sqlite*|bin|stage_new|backup_old); do
  [ -e "$item" ] && mv "$item" "$BACKUP_DIR/"
done

# Move new build into place
run_with_spinner "Activating new build" \
  bash -c "shopt -s dotglob && mv '${STAGE_DIR}'/* '${DEPLOY_DIR}/' && rm -rf '${STAGE_DIR}'"
shopt -u extglob dotglob

# Restore executable bits on deploy scripts
for script in start.sh update.sh setup.sh; do
  [ -f "${DEPLOY_DIR}/${script}" ] && chmod +x "${DEPLOY_DIR}/${script}"
done

# ── Preservation report ───────────────────────────────────────────────────────
echo ""
echo -e "  ${BOLD}Preserved across this update:${RESET}"
for pf in "${PRESERVED[@]}"; do
  ok "${pf}"
done
if [ ${#PRESERVED[@]} -eq 0 ]; then
  warn "No preserved files found (first deploy?)"
fi

# Sanity check: .env must still exist
if [ ! -f "${DEPLOY_DIR}/.env" ]; then
  warn ".env not found after swap — this is unexpected. Check ${BACKUP_DIR}/"
fi

# Clean up downloaded zip
[ -n "$ZIP_URL" ] && rm -f "$ZIP_PATH"

# ── Step 4: Restart ───────────────────────────────────────────────────────────
step "Step 4/4 — Restarting service"

if systemctl is-active --quiet abyndotxyz 2>/dev/null; then
  run_with_spinner "Restarting systemd service (abyndotxyz)" sudo systemctl restart abyndotxyz
  ok "Service is running — logs: journalctl -u abyndotxyz -f"
elif command -v pm2 &>/dev/null && pm2 describe abyndotxyz &>/dev/null 2>&1; then
  run_with_spinner "Restarting PM2 process (abyndotxyz)" pm2 restart abyndotxyz
  ok "PM2 process restarted"
else
  warn "No active systemd or PM2 process detected"
  warn "Start manually: sudo systemctl start abyndotxyz  or  pm2 start ${DEPLOY_DIR}/ecosystem.config.js"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}  ╔══════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${GREEN}  ║  Update complete!                                        ║${RESET}"
echo -e "${BOLD}${GREEN}  ╚══════════════════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "  ${DIM}Backup stored at: ${BACKUP_DIR}${RESET}"
echo ""
