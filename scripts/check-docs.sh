#!/usr/bin/env bash
# ================================================================
# docs consistency checker — thermal-software
# ================================================================
# Checks:
#   1. Broken relative markdown links  (all docs/)
#   2. IMPLEMENTATION_STATUS.md claims vs actual filesystem
#   3. Orphan docs (files not linked from anywhere)
#   4. Stale "Last Updated" dates (> 6 months)
#
# INDEX_SCOPES and backend file lists are generated dynamically.
# Exit code: 0 = clean, 1 = issues found
# ================================================================

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DOCS_ROOT="$REPO_ROOT/docs"
STALE_MONTHS=6

# Directories excluded from all scans
EXCLUDE_PATHS=("legacy" "node_modules" ".git" "dist" "coverage" "tmp")

# ── colour helpers ────────────────────────────────────────────────
if [[ -t 1 ]]; then
  C_RED='\033[31m' C_YEL='\033[33m' C_GRN='\033[32m'
  C_BOLD='\033[1m' C_DIM='\033[2m'  C_RST='\033[0m'
else
  C_RED='' C_YEL='' C_GRN='' C_BOLD='' C_DIM='' C_RST=''
fi

_red()    { printf "${C_RED}%s${C_RST}"  "$1"; }
_yellow() { printf "${C_YEL}%s${C_RST}"  "$1"; }
_green()  { printf "${C_GRN}%s${C_RST}"  "$1"; }
_bold()   { printf "${C_BOLD}%s${C_RST}" "$1"; }
_dim()    { printf "${C_DIM}%s${C_RST}"  "$1"; }

# ── issue / warning collectors ────────────────────────────────────
ISSUE_FILE=$(mktemp)
WARN_FILE=$(mktemp)
trap 'rm -f "$ISSUE_FILE" "$WARN_FILE"' EXIT

issue() { printf '%s\t%s\n' "$1" "$2" >> "$ISSUE_FILE"; }
warn()  { printf '%s\t%s\n' "$1" "$2" >> "$WARN_FILE";  }

# ── helpers ───────────────────────────────────────────────────────

# All .md files in the project (excludes legacy/, node_modules/, .git/, etc.)
find_all_md() {
  local args=("$REPO_ROOT" -name "*.md")
  for ex in "${EXCLUDE_PATHS[@]}"; do
    args+=(-not -path "*/${ex}/*")
  done
  find "${args[@]}" | sort
}

# .md files inside docs/ only (for orphan check)
find_docs_md() {
  local args=("$DOCS_ROOT" -name "*.md")
  for ex in "${EXCLUDE_PATHS[@]}"; do
    args+=(-not -path "*/${ex}/*")
  done
  find "${args[@]}" | sort
}

# Extract all markdown link targets [text](target) from a file
extract_links() {
  grep -oP '\[[^\]]*\]\(\K[^)]+' "$1" 2>/dev/null || true
}

# Count lines in a file matching field-1 == category (tab-separated)
count_category() {
  local file="$1" cat="$2"
  awk -F'\t' -v c="$cat" '$1 == c' "$file" 2>/dev/null | wc -l | tr -d ' '
}

total_lines() {
  wc -l < "$1" 2>/dev/null | tr -d ' '
}

# ════════════════════════════════════════════════════════════════
# 1. BROKEN LINKS
# ════════════════════════════════════════════════════════════════
check_links() {
  local label="Broken links"
  while IFS= read -r md_file; do
    local dir
    dir="$(dirname "$md_file")"
    while IFS= read -r link; do
      # skip external
      [[ "$link" =~ ^https?:// || "$link" =~ ^mailto: ]] && continue
      local target="${link%%#*}"
      [[ -z "$target" ]] && continue
      local resolved
      resolved="$(realpath -m "$dir/$target" 2>/dev/null)" || continue
      if [[ ! -e "$resolved" ]]; then
        issue "$label" "${md_file#"$REPO_ROOT"/}  →  $link"
      fi
    done < <(extract_links "$md_file")
  done < <(find_all_md)
}

# ════════════════════════════════════════════════════════════════
# 2. IMPLEMENTATION_STATUS.md vs filesystem  (dynamic)
#    Collects ALL .ts filenames under backend/ at runtime —
#    no hardcoded BACKEND_PATHS needed.
# ════════════════════════════════════════════════════════════════
check_implementation_status() {
  local label="Status vs filesystem"
  local status_file="$DOCS_ROOT/migration/IMPLEMENTATION_STATUS.md"

  if [[ ! -f "$status_file" ]]; then
    issue "$label" "IMPLEMENTATION_STATUS.md not found"
    return
  fi

  # ── dynamic backend file index ──
  declare -A ts_index=()
  while IFS= read -r f; do
    ts_index["$(basename "$f")"]=1
  done < <(find "$REPO_ROOT/backend" -name "*.ts" -not -path "*/.git/*" 2>/dev/null)

  # Extract filenames from checkbox lines:  - [x] `filename.ts`  or  - [ ] filename.ts
  local seen=""
  while IFS= read -r filename; do
    [[ "$filename" =~ \.(ts|js)$ ]] || continue
    # deduplicate
    [[ "$seen" == *"|${filename}|"* ]] && continue
    seen+="|${filename}|"
    if [[ -z "${ts_index[$filename]+x}" ]]; then
      issue "$label" "Listed in IMPLEMENTATION_STATUS but not on disk: $filename"
    fi
  done < <(grep -oP '- \[[ x]\] `?\K[a-zA-Z0-9._-]+\.[a-z]+' "$status_file" 2>/dev/null || true)
}

# ════════════════════════════════════════════════════════════════
# 3. ORPHAN DOCS  (dynamic — no hardcoded INDEX_SCOPES)
#
#    INDEX_SCOPES are derived at runtime:
#      • Every subdirectory of docs/ is a scope.
#      • Its "index files" = README.md / INDEX.md / ALGORITHMS_INDEX.md
#        found either in that dir or its parent.
#      • A file is orphaned if it is NOT linked from ANY .md in docs/.
# ════════════════════════════════════════════════════════════════
check_orphans() {
  local label="Orphan docs"

  # Build global set: every resolved path that is a link target in any project .md
  declare -A all_linked=()
  while IFS= read -r md_file; do
    local dir
    dir="$(dirname "$md_file")"
    while IFS= read -r link; do
      [[ "$link" =~ ^https?:// || "$link" =~ ^mailto: ]] && continue
      local target="${link%%#*}"
      [[ -z "$target" ]] && continue
      local resolved
      resolved="$(realpath -m "$dir/$target" 2>/dev/null)" || continue
      all_linked["$resolved"]=1
      # also register parent dir (handles  `dir/`  style links)
      all_linked["$(dirname "$resolved")"]=1
    done < <(extract_links "$md_file")
  done < <(find_all_md)

  # Index file names — never reported as orphans
  local -a INDEX_NAMES=("README.md" "INDEX.md" "ALGORITHMS_INDEX.md" "MIGRATION_INDEX.md")

  # Check every .md that lives inside a sub-directory of docs/
  # (-mindepth 2 = at least docs/<subdir>/file.md)
  while IFS= read -r md_file; do
    local base
    base="$(basename "$md_file")"

    # skip known index files
    local skip=0
    for idx in "${INDEX_NAMES[@]}"; do
      [[ "$base" == "$idx" ]] && skip=1 && break
    done
    [[ $skip -eq 1 ]] && continue

    local resolved
    resolved="$(realpath "$md_file")"
    if [[ -z "${all_linked[$resolved]+x}" ]]; then
      warn "$label" "Not linked from any doc: ${md_file#"$REPO_ROOT"/}"
    fi
  done < <(find_all_md)
}

# ════════════════════════════════════════════════════════════════
# RUNNER HELPERS
# ════════════════════════════════════════════════════════════════
month_to_num() {
  case "${1,,}" in
    january)   echo 1  ;; february)  echo 2  ;; march)     echo 3  ;;
    april)     echo 4  ;; may)       echo 5  ;; june)      echo 6  ;;
    july)      echo 7  ;; august)    echo 8  ;; september) echo 9  ;;
    october)   echo 10 ;; november)  echo 11 ;; december)  echo 12 ;;
    *) echo 0 ;;
  esac
}

check_stale_dates() {
  local label="Stale dates"
  local today_year today_month
  today_year="$(date +%Y)"
  today_month="$(date +%-m)"

  while IFS= read -r md_file; do
    # only scan the first 40 lines for the header
    local raw
    raw="$(head -40 "$md_file" | \
      grep -iP '\*?\*?[Ll]ast [Uu]pdated[*:\s]+' | \
      grep -ioP '(january|february|march|april|may|june|july|august|september|october|november|december)\s+[0-9]{4}' | \
      head -1)" || true
    [[ -z "$raw" ]] && continue

    local month_name year month_num
    month_name="$(awk '{print $1}' <<< "$raw")"
    year="$(awk '{print $2}' <<< "$raw")"
    month_num="$(month_to_num "$month_name")"
    [[ "$month_num" -eq 0 || -z "$year" ]] && continue

    local months_old=$(( (today_year - year) * 12 + (today_month - month_num) ))
    if (( months_old > STALE_MONTHS )); then
      warn "$label" "${md_file#"$REPO_ROOT"/}  (last updated: $raw, ${months_old} months ago)"
    fi
  done < <(find "$DOCS_ROOT" -mindepth 2 -name "*.md" | sort)
}
# ════════════════════════════════════════════════════════════════
run_check() {
  local name="$1" fn="$2"
  printf "  Checking %s… " "$name"
  "$fn"
  local ni nw
  ni="$(count_category "$ISSUE_FILE" "$name")"
  nw="$(count_category "$WARN_FILE"  "$name")"
  if   (( ni > 0 )); then printf "$(_red   '✗')\n"
  elif (( nw > 0 )); then printf "$(_yellow '⚠')\n"
  else                    printf "$(_green  '✓')\n"
  fi
}

print_file_grouped() {
  # tab-separated: category \t message
  local file="$1"
  local last_cat=""
  while IFS=$'\t' read -r cat msg; do
    if [[ "$cat" != "$last_cat" ]]; then
      printf "\n  $(_bold "$cat")\n"
      last_cat="$cat"
    fi
    printf "    %s %s\n" "$2" "$msg"
  done < "$file"
}

# ════════════════════════════════════════════════════════════════
# MAIN
# ════════════════════════════════════════════════════════════════
if [[ "${1:-}" == "--links-only" ]]; then
  printf "\n$(_bold '🔗  Broken Link Check')\n"
  printf "$(_dim "    scope: all project .md (excl. legacy/)")\n\n"
  check_links
  n="$(total_lines "$ISSUE_FILE")"
  if (( n > 0 )); then
    printf "$(_bold "$(_red "❌  $n broken link(s):")")\n"
    while IFS=$'\t' read -r _ msg; do
      printf "    $(_red '✗') %s\n" "$msg"
    done < "$ISSUE_FILE"
    printf '\n'
    exit 1
  fi
  printf "$(_bold "$(_green '✅  No broken links.')")\n\n"
  exit 0
fi

printf "\n$(_bold '📋  Documentation Consistency Check')\n"
printf "$(_dim "    repo:  $REPO_ROOT")\n"
printf "$(_dim "    scope: all .md files (excl. legacy/, node_modules/)")\n\n"

run_check "Broken links"         check_links
run_check "Status vs filesystem" check_implementation_status
run_check "Orphan docs"          check_orphans
run_check "Stale dates"          check_stale_dates

printf '\n'

# ── report issues (errors) ────────────────────────────────────────
n_issues="$(total_lines "$ISSUE_FILE")"
n_warns="$(total_lines "$WARN_FILE")"

if (( n_issues > 0 )); then
  printf "$(_bold "$(_red "❌  $n_issues issue(s) found:")")\n"
  print_file_grouped "$ISSUE_FILE" "$(_red '✗')"
else
  printf "$(_bold "$(_green '✅  No issues found.')")\n"
fi

# ── report warnings ───────────────────────────────────────────────
if (( n_warns > 0 )); then
  printf "\n$(_bold "$(_yellow "⚠   $n_warns warning(s):")")\n"
  print_file_grouped "$WARN_FILE" "$(_yellow '!')"
fi

printf '\n'
(( n_issues > 0 )) && exit 1
exit 0

