#!/bin/sh
set -e

SUBCOMMAND=""
OUT=""
DRY_RUN=""
FIX=""
LANG="en"
TO=""
STYLE="executive"
LENGTH="medium"
INTENT=""
FILES=""

print_help() {
  cat <<'EOF'
skillpack content-craft — Proofread, translate, summarize, and repurpose content

SUBCOMMANDS
  skillpack content-craft proofread <files...> [--fix]
  skillpack content-craft summarize <file> [--style executive] [--length short|medium|long]
  skillpack content-craft repurpose <file> --to "twitter,linkedin,newsletter"
  skillpack content-craft actions <file>
  skillpack content-craft brief <dir> [--length 500]
  skillpack content-craft reply <file> --intent "your intent"

OPTIONS
  --out <path>       Output file
  --fix              Fix issues in place (proofread)
  --dry-run          Preview output
  --help, -h         Show this help
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --help|-h) print_help; exit 0 ;;
    --dry-run) DRY_RUN=1; shift ;;
    --fix) FIX=1; shift ;;
    --lang) LANG="$2"; shift 2 ;;
    --to) TO="$2"; shift 2 ;;
    --style) STYLE="$2"; shift 2 ;;
    --length) LENGTH="$2"; shift 2 ;;
    --intent) INTENT="$2"; shift 2 ;;
    --out) OUT="$2"; shift 2 ;;
    -*) echo "Unknown option: $1" >&2; exit 1 ;;
    *)
      if [ -z "$SUBCOMMAND" ]; then
        SUBCOMMAND="$1"
      else
        FILES="$FILES $1"
      fi
      shift
      ;;
  esac
done

proofread() {
  local file="$1"
  local text=$(cat "$file")
  local issues=0
  
  echo "Proofreading: $file" >&2
  
  # Check common typos
  for pair in "teh:the" "recieve:receive" "occured:occurred" "seperate:separate" "definately:definitely"; do
    wrong=$(echo "$pair" | cut -d: -f1)
    right=$(echo "$pair" | cut -d: -f2)
    count=$(echo "$text" | grep -oiF "$wrong" | wc -l)
    if [ "$count" -gt 0 ]; then
      echo "  Found $count occurrences of \"$wrong\" → \"$right\"" >&2
      issues=$((issues + count))
      [ "$FIX" = "1" ] && text=$(echo "$text" | awk -v old="$wrong" -v new="$right" '{gsub(old, new); print}')
    fi
  done
  
  # Check extra whitespace
  ws_count=$(echo "$text" | grep -c '  ')
  if [ "$ws_count" -gt 0 ]; then
    echo "  Found $ws_count lines with extra whitespace" >&2
    issues=$((issues + ws_count))
    [ "$FIX" = "1" ] && text=$(echo "$text" | sed 's/  */ /g')
  fi
  
  [ "$issues" -eq 0 ] && echo "  No issues found." >&2
  
  echo "$text"
}

summarize() {
  local file="$1"
  local text=$(cat "$file")
  
  # Extract key sentences (lines with important words)
  echo "$text" | awk '
    BEGIN { count=0; max=5 }
    /[Kk]ey|[Ii]mportant|[Mm]ain|[Rr]esult|[Cc]onclusion|[Ff]inding/ || length > 100 {
      if (count < max) { print; count++ }
    }
    END { if (count == 0) print NR " lines processed, no key sentences found" > "/dev/stderr" }
  '
}

extract_actions() {
  local file="$1"
  local text=$(cat "$file")
  
  echo "$text" | grep -iE 'TODO:|ACTION:|FOLLOW-UP:|TASK:|need to|should|must|have to' | \
    sed 's/^[[:space:]]*//' | \
    awk '{ printf "%d. %s\n", NR, $0 }'
}

create_brief() {
  local dir="$1"
  local text=""
  
  if [ -d "$dir" ]; then
    for f in "$dir"/*.md "$dir"/*.txt; do
      [ -f "$f" ] && text="$text $(cat "$f")"
    done
  else
    text=$(cat "$dir")
  fi
  
  echo "# Executive Brief"
  echo ""
  echo "$text" | awk 'NR<=10 && length>20 { print }'
}

repurpose() {
  local file="$1"
  local targets="$2"
  local text=$(cat "$file")
  
  echo "$targets" | tr ',' '\n' | while read -r target; do
    case "$target" in
      twitter|thread)
        echo "## Twitter Thread"
        echo ""
        echo "$text" | awk 'NR<=5 && length>20 { printf "%d/ %s.\n\n", NR, $0 }'
        ;;
      linkedin)
        echo "## LinkedIn Post"
        echo ""
        echo "$text" | awk 'NR==1 && length>20 { print; next } NR>1 && NR<=4 && length>20 { print }'
        echo ""
        echo "What are your thoughts?"
        ;;
      newsletter)
        echo "## Newsletter"
        echo ""
        echo "$text" | awk 'NR<=8 && length>20 { print }'
        ;;
    esac
    echo ""
    echo "---"
    echo ""
  done
}

draft_reply() {
  local file="$1"
  local intent="$2"
  local text=$(cat "$file")
  
  echo "[Draft reply requires AI CLI. Use with Claude Code/OpenCode.]"
  echo ""
  echo "Intent: $intent"
  echo ""
  echo "Original thread excerpt:"
  echo "$text" | head -10
}

for file in $FILES; do
  [ ! -f "$file" ] && echo "Error: File not found: $file" >&2 && exit 1
done

case "$SUBCOMMAND" in
  proofread)
    file=$(echo "$FILES" | awk '{print $1}')
    output=$(proofread "$file")
    ;;
  summarize)
    file=$(echo "$FILES" | awk '{print $1}')
    output=$(summarize "$file")
    ;;
  actions)
    file=$(echo "$FILES" | awk '{print $1}')
    output=$(extract_actions "$file")
    [ -z "$output" ] && output="No action items found."
    ;;
  brief)
    dir=$(echo "$FILES" | awk '{print $1}')
    [ -z "$dir" ] && dir="."
    output=$(create_brief "$dir")
    ;;
  repurpose)
    file=$(echo "$FILES" | awk '{print $1}')
    output=$(repurpose "$file" "$TO")
    ;;
  reply)
    file=$(echo "$FILES" | awk '{print $1}')
    output=$(draft_reply "$file" "$INTENT")
    ;;
  *)
    [ -z "$SUBCOMMAND" ] && print_help && exit 0
    echo "Error: Unknown subcommand \"$SUBCOMMAND\"" >&2
    exit 1
    ;;
esac

if [ "$DRY_RUN" = "1" ]; then
  echo "[dry-run] Would output:" >&2
  echo "$output"
elif [ -n "$OUT" ]; then
  echo "$output" > "$OUT"
  echo "Written to $OUT" >&2
else
  echo "$output"
fi
