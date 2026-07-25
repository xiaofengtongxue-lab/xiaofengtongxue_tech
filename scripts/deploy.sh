#!/usr/bin/env bash

set -Eeuo pipefail

CANONICAL_SITE="${SITE_URL:-https://www.xiaofengtongxue.com}"
GITHUB_TARGET="${GITHUB_PAGES_TARGET:-https://tutorial.xiaofengtongxue.com}"
GITHUB_BASE="${GITHUB_PAGES_BASE:-/}"
GIT_REMOTE="${DEPLOY_GIT_REMOTE:-origin}"
GIT_BRANCH="${DEPLOY_BRANCH:-main}"
GITHUB_WORKFLOW="${DEPLOY_GITHUB_WORKFLOW:-deploy.yml}"
WAIT_FOR_GITHUB="${DEPLOY_WAIT_GITHUB:-1}"
DEPLOY_HOST="${DEPLOY_HOST:-43.138.176.186}"
DEPLOY_USER="${DEPLOY_USER:-ubuntu}"
DEPLOY_ROOT="${DEPLOY_ROOT:-/var/www/programmer-xiaofeng-blog}"
DRY_RUN=0
RESTORE_DEFAULT_BUILD=0
TEMP_DIR=""
USE_SSHPASS=0
SSH_PASSWORD=""
SSH_OPTIONS=(-o StrictHostKeyChecking=accept-new -o ConnectTimeout=12)

usage() {
  cat <<'EOF'
Usage: npm run deploy -- [--dry-run]

Publishes the current committed main branch to GitHub Pages and the production
server. The command refuses tracked or deployable untracked changes so both
targets always receive the same Git commit.

Options:
  --dry-run  Build, verify and package without pushing or changing the server
  --help     Show this help

SSH environment:
  DEPLOY_SSH_KEY   Optional private key path
  DEPLOY_PASSWORD  Optional password used through sshpass; SSH Key is preferred
EOF
}

log() {
  printf '\n[%s] %s\n' "$(date '+%H:%M:%S')" "$*"
}

fail() {
  printf '\nDeployment failed: %s\n' "$*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "Required command is missing: $1"
}

normalize_base() {
  local value="$1"
  [[ "$value" == /* ]] || value="/$value"
  [[ "$value" == */ ]] || value="$value/"
  printf '%s' "$value"
}

hash_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  else
    shasum -a 256 "$1" | awk '{print $1}'
  fi
}

build_github_pages() {
  SITE_URL="$CANONICAL_SITE" VITEPRESS_BASE="$GITHUB_BASE" npm run docs:build
  SITE_URL="$CANONICAL_SITE" VITEPRESS_BASE="$GITHUB_BASE" npm run docs:check
}

build_production() {
  SITE_URL="$CANONICAL_SITE" VITEPRESS_BASE=/ npm run docs:build
  SITE_URL="$CANONICAL_SITE" VITEPRESS_BASE=/ npm run docs:check
}

artifact_flag() {
  local pattern="$1"
  local file="$2"
  if grep -Fq "$pattern" "$file"; then
    printf 'true'
  else
    printf 'false'
  fi
}

assert_clean_worktree() {
  git diff --quiet 2>/dev/null || fail "Tracked files have unstaged changes; commit them before deployment"
  git diff --cached --quiet 2>/dev/null || fail "The index has staged changes; commit them before deployment"

  local untracked_deployable
  untracked_deployable="$(git ls-files --others --exclude-standard -- .github deploy docs scripts package.json package-lock.json)"
  [[ -z "$untracked_deployable" ]] || fail "Deployable files are untracked; commit them first:\n$untracked_deployable"
}

run_ssh() {
  if [[ "$USE_SSHPASS" == 1 ]]; then
    SSHPASS="$SSH_PASSWORD" sshpass -e ssh "${SSH_OPTIONS[@]}" "${DEPLOY_USER}@${DEPLOY_HOST}" "$@"
  else
    ssh "${SSH_OPTIONS[@]}" "${DEPLOY_USER}@${DEPLOY_HOST}" "$@"
  fi
}

run_scp() {
  if [[ "$USE_SSHPASS" == 1 ]]; then
    SSHPASS="$SSH_PASSWORD" sshpass -e scp "${SSH_OPTIONS[@]}" "$@"
  else
    scp "${SSH_OPTIONS[@]}" "$@"
  fi
}

cleanup() {
  local status=$?
  trap - EXIT
  set +e

  if [[ "$RESTORE_DEFAULT_BUILD" == 1 ]]; then
    log "Restoring the local GitHub Pages build"
    build_github_pages >/dev/null 2>&1
  fi

  if [[ -n "$TEMP_DIR" && -d "$TEMP_DIR" ]]; then
    rm -rf -- "$TEMP_DIR"
  fi

  unset SSH_PASSWORD SSHPASS DEPLOY_PASSWORD
  exit "$status"
}

trap cleanup EXIT

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=1
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      fail "Unknown argument: $1"
      ;;
  esac
  shift
done

GITHUB_BASE="$(normalize_base "$GITHUB_BASE")"
CANONICAL_SITE="${CANONICAL_SITE%/}"
GITHUB_TARGET="${GITHUB_TARGET%/}"

[[ "$GIT_BRANCH" =~ ^[A-Za-z0-9._/-]+$ ]] || fail "Invalid branch: $GIT_BRANCH"
[[ "$GIT_REMOTE" =~ ^[A-Za-z0-9._-]+$ ]] || fail "Invalid Git remote: $GIT_REMOTE"
[[ "$DEPLOY_HOST" =~ ^[A-Za-z0-9.-]+$ ]] || fail "Invalid deploy host: $DEPLOY_HOST"
[[ "$DEPLOY_USER" =~ ^[A-Za-z0-9._-]+$ ]] || fail "Invalid deploy user: $DEPLOY_USER"
[[ "$DEPLOY_ROOT" == /* && "$DEPLOY_ROOT" != *" "* ]] || fail "DEPLOY_ROOT must be an absolute path without spaces"
[[ "$WAIT_FOR_GITHUB" == 0 || "$WAIT_FOR_GITHUB" == 1 ]] || fail "DEPLOY_WAIT_GITHUB must be 0 or 1"

require_command git
require_command npm
require_command node
require_command tar
require_command ssh
require_command scp
require_command grep

if [[ -n "${DEPLOY_SSH_KEY:-}" ]]; then
  [[ -f "$DEPLOY_SSH_KEY" ]] || fail "DEPLOY_SSH_KEY does not exist: $DEPLOY_SSH_KEY"
  SSH_OPTIONS+=(-i "$DEPLOY_SSH_KEY" -o IdentitiesOnly=yes)
fi

if [[ -n "${DEPLOY_PASSWORD:-}" ]]; then
  require_command sshpass
  SSH_PASSWORD="$DEPLOY_PASSWORD"
  unset DEPLOY_PASSWORD
  USE_SSHPASS=1
else
  SSH_OPTIONS+=(-o BatchMode=yes)
fi

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || fail "Run this command inside the repository"
[[ "$(git branch --show-current)" == "$GIT_BRANCH" ]] || fail "Current branch must be $GIT_BRANCH"
assert_clean_worktree

COMMIT_SHA="$(git rev-parse HEAD)"
SHORT_SHA="$(git rev-parse --short=8 HEAD)"
RELEASE_ID="$(date -u '+%Y%m%d-%H%M%S')-${SHORT_SHA}"
TEMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/xiaofeng-deploy.XXXXXX")"
ARCHIVE_PATH="$TEMP_DIR/${RELEASE_ID}.tar.gz"

if [[ "$DRY_RUN" == 0 ]]; then
  require_command gh
  gh auth status >/dev/null 2>&1 || fail "GitHub CLI is not authenticated"

  log "Checking GitHub and server access"
  git fetch "$GIT_REMOTE" "$GIT_BRANCH"
  run_ssh bash -s -- "$DEPLOY_ROOT" <<'REMOTE'
set -euo pipefail
deploy_root="$1"
sudo -n true
sudo -n nginx -t
sudo test -d "$deploy_root/releases"
sudo test -L "$deploy_root/current"
REMOTE
fi

log "Building and validating the GitHub Pages artifact"
build_github_pages
GITHUB_AGENTS_NOINDEX="$(artifact_flag 'noindex,follow' docs/.vitepress/dist/agents/index.html)"
GITHUB_AGENTS_SITEMAP="$(artifact_flag "${CANONICAL_SITE}/agents/" docs/.vitepress/dist/sitemap.xml)"

log "Building and validating the production artifact"
RESTORE_DEFAULT_BUILD=1
build_production
SERVER_INDEX_SHA="$(hash_file docs/.vitepress/dist/index.html)"
SERVER_AGENTS_NOINDEX="$(artifact_flag 'noindex,follow' docs/.vitepress/dist/agents/index.html)"
SERVER_AGENTS_SITEMAP="$(artifact_flag "${CANONICAL_SITE}/agents/" docs/.vitepress/dist/sitemap.xml)"

COPYFILE_DISABLE=1 tar -C docs/.vitepress/dist -czf "$ARCHIVE_PATH" .
ARCHIVE_SHA="$(hash_file "$ARCHIVE_PATH")"

log "Restoring and validating the default GitHub Pages artifact"
build_github_pages
RESTORE_DEFAULT_BUILD=0

assert_clean_worktree
[[ "$(git rev-parse HEAD)" == "$COMMIT_SHA" ]] || fail "HEAD changed while deployment artifacts were being built"

if [[ "$DRY_RUN" == 1 ]]; then
  log "Dry run passed for commit $COMMIT_SHA"
  printf 'Release: %s\nArchive SHA-256: %s\n' "$RELEASE_ID" "$ARCHIVE_SHA"
  exit 0
fi

git fetch "$GIT_REMOTE" "$GIT_BRANCH"
REMOTE_REF="refs/remotes/${GIT_REMOTE}/${GIT_BRANCH}"
if git show-ref --verify --quiet "$REMOTE_REF"; then
  git merge-base --is-ancestor "$REMOTE_REF" HEAD || fail "Remote $GIT_BRANCH contains commits that are not in local HEAD"
  REMOTE_SHA="$(git rev-parse "$REMOTE_REF")"
else
  REMOTE_SHA=""
fi

log "Publishing commit $SHORT_SHA to GitHub"
if [[ "$REMOTE_SHA" == "$COMMIT_SHA" ]]; then
  gh workflow run "$GITHUB_WORKFLOW" --ref "$GIT_BRANCH"
  GITHUB_EVENT=workflow_dispatch
else
  git push "$GIT_REMOTE" "HEAD:${GIT_BRANCH}"
  GITHUB_EVENT=push
fi

if [[ "$WAIT_FOR_GITHUB" == 1 ]]; then
  RUN_ID=""
  ATTEMPT=1
  while [[ "$ATTEMPT" -le 30 ]]; do
    RUN_ID="$(gh run list --workflow "$GITHUB_WORKFLOW" --branch "$GIT_BRANCH" --commit "$COMMIT_SHA" --event "$GITHUB_EVENT" --limit 1 --json databaseId --jq '.[0].databaseId // empty')"
    [[ -n "$RUN_ID" ]] && break
    sleep 2
    ATTEMPT=$((ATTEMPT + 1))
  done
  [[ -n "$RUN_ID" ]] || fail "Unable to find the GitHub Actions deployment run"
  gh run watch "$RUN_ID" --exit-status

  node scripts/verify-deployment.mjs \
    --target "$GITHUB_TARGET" \
    --base "$GITHUB_BASE" \
    --canonical "$CANONICAL_SITE" \
    --expect-agents-noindex "$GITHUB_AGENTS_NOINDEX" \
    --expect-agents-sitemap "$GITHUB_AGENTS_SITEMAP" \
    --retries 12 \
    --delay-ms 5000
else
  log "Skipping the GitHub Actions wait and Pages verification"
fi

log "Uploading release $RELEASE_ID to the production server"
REMOTE_ARCHIVE="/tmp/${RELEASE_ID}.tar.gz"
run_scp "$ARCHIVE_PATH" "${DEPLOY_USER}@${DEPLOY_HOST}:${REMOTE_ARCHIVE}"

SWITCH_OUTPUT="$(
  run_ssh bash -s -- "$RELEASE_ID" "$ARCHIVE_SHA" "$DEPLOY_ROOT" <<'REMOTE'
set -Eeuo pipefail
release_id="$1"
expected_sha="$2"
deploy_root="$3"
archive="/tmp/${release_id}.tar.gz"
release_dir="$deploy_root/releases/$release_id"
current_link="$deploy_root/current"
temp_link="$deploy_root/.current-$release_id"
previous_release="$(readlink -f "$current_link" 2>/dev/null || true)"
switched=0

rollback_on_error() {
  if [[ "$switched" == 1 && -n "$previous_release" ]]; then
    rollback_link="$deploy_root/.rollback-$release_id"
    sudo ln -s "$previous_release" "$rollback_link"
    sudo mv -Tf "$rollback_link" "$current_link"
    sudo systemctl reload nginx || true
  fi
}

trap rollback_on_error ERR

[[ "$(sha256sum "$archive" | awk '{print $1}')" == "$expected_sha" ]]
sudo test ! -e "$release_dir"
sudo mkdir -p "$release_dir"
sudo tar -xzf "$archive" -C "$release_dir"
sudo chown -R root:root "$release_dir"
sudo find "$release_dir" -type d -exec chmod 755 {} +
sudo find "$release_dir" -type f -exec chmod 644 {} +
sudo test -f "$release_dir/index.html"
sudo test -f "$release_dir/agents/index.html"
sudo test -f "$release_dir/sitemap.xml"
sudo nginx -t
sudo test ! -e "$temp_link"
sudo ln -s "$release_dir" "$temp_link"
sudo mv -Tf "$temp_link" "$current_link"
switched=1
sudo systemctl reload nginx
test "$(readlink -f "$current_link")" == "$release_dir"
rm -f "$archive"
trap - ERR

printf 'PREVIOUS_RELEASE=%s\n' "$previous_release"
printf 'ACTIVE_RELEASE=%s\n' "$release_dir"
REMOTE
)"

printf '%s\n' "$SWITCH_OUTPUT"
PREVIOUS_RELEASE="$(printf '%s\n' "$SWITCH_OUTPUT" | sed -n 's/^PREVIOUS_RELEASE=//p')"
ACTIVE_RELEASE="$(printf '%s\n' "$SWITCH_OUTPUT" | sed -n 's/^ACTIVE_RELEASE=//p')"
[[ -n "$ACTIVE_RELEASE" ]] || fail "The server did not report an active release"

if ! node scripts/verify-deployment.mjs \
  --target "$CANONICAL_SITE" \
  --base / \
  --canonical "$CANONICAL_SITE" \
  --expected-index-sha "$SERVER_INDEX_SHA" \
  --expect-agents-noindex "$SERVER_AGENTS_NOINDEX" \
  --expect-agents-sitemap "$SERVER_AGENTS_SITEMAP" \
  --check-redirects \
  --retries 6 \
  --delay-ms 3000; then
  if [[ -n "$PREVIOUS_RELEASE" ]]; then
    log "Production verification failed; rolling back to $PREVIOUS_RELEASE"
    run_ssh bash -s -- "$PREVIOUS_RELEASE" "$DEPLOY_ROOT" "$RELEASE_ID" <<'REMOTE'
set -euo pipefail
previous_release="$1"
deploy_root="$2"
release_id="$3"
current_link="$deploy_root/current"
temp_link="$deploy_root/.rollback-$release_id"
case "$previous_release" in
  "$deploy_root"/releases/*) ;;
  *) exit 1 ;;
esac
sudo test -d "$previous_release"
sudo nginx -t
sudo test ! -e "$temp_link"
sudo ln -s "$previous_release" "$temp_link"
sudo mv -Tf "$temp_link" "$current_link"
sudo systemctl reload nginx
test "$(readlink -f "$current_link")" == "$previous_release"
REMOTE
  fi
  fail "Production verification failed"
fi

log "Deployment completed"
printf 'Git commit: %s\nGitHub Pages: %s%s\nProduction: %s/\nServer release: %s\n' \
  "$COMMIT_SHA" "$GITHUB_TARGET" "$GITHUB_BASE" "$CANONICAL_SITE" "$ACTIVE_RELEASE"
