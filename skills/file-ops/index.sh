#!/bin/sh
set -e

SUBCOMMAND=""
OUT=""
DRY_RUN=""
PATTERN=""
FIND=""
REPLACE=""
RESIZE=""
TO=""
QUALITY="80"
SIZES="1x"
FORMATS="all"
FILES=""

print_help() {
  cat <<'EOF'
skillpack file-ops — Batch rename, image ops, favicons, and design tokens

SUBCOMMANDS
  skillpack file-ops rename <files...> [--pattern "{date}-{seq}-{name}"] [--find "X"] [--replace "Y"]
  skillpack file-ops images <files...> [--resize 1200x630] [--to webp,avif] [--quality 85]
  skillpack file-ops favicon <source> [--out public/]
  skillpack file-ops tokens <json-file> [--out tokens.css]

OPTIONS
  --out <dir>        Output directory
  --dry-run          Preview without making changes
  --help, -h         Show this help
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --help|-h) print_help; exit 0 ;;
    --dry-run) DRY_RUN=1; shift ;;
    --out) OUT="$2"; shift 2 ;;
    --pattern) PATTERN="$2"; shift 2 ;;
    --find) FIND="$2"; shift 2 ;;
    --replace) REPLACE="$2"; shift 2 ;;
    --resize) RESIZE="$2"; shift 2 ;;
    --to) TO="$2"; shift 2 ;;
    --quality) QUALITY="$2"; shift 2 ;;
    --sizes) SIZES="$2"; shift 2 ;;
    --formats) FORMATS="$2"; shift 2 ;;
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

rename_files() {
  local seq=1
  
  for file in $FILES; do
    [ -z "$file" ] && continue
    [ ! -e "$file" ] && continue
    
    ext="${file##*.}"
    name=$(basename "$file" ".$ext")
    date=$(stat -c '%y' "$file" 2>/dev/null | cut -d' ' -f1 || date -r "$file" '+%Y-%m-%d' 2>/dev/null || echo "2024-01-01")
    
    newname="$name"
    [ -n "$FIND" ] && [ -n "$REPLACE" ] && newname=$(echo "$name" | sed "s/$FIND/$REPLACE/g")
    
    if [ -n "$PATTERN" ]; then
      newname=$(echo "$PATTERN" | awk -v name="$newname" -v dt="$date" -v seq="$(printf '%03d' $seq)" -v ext="$ext" '{
        gsub(/{name}/, name); gsub(/{date}/, dt); gsub(/{seq}/, seq); gsub(/{ext}/, ext); print
      }')
    fi
    
    dir=$(dirname "$file")
    newpath="$dir/$newname.$ext"
    
    if [ "$DRY_RUN" = "1" ]; then
      echo "$file → $newpath"
    else
      mv "$file" "$newpath"
      echo "Renamed: $file → $newpath"
    fi
    seq=$((seq + 1))
  done
}

process_images() {
  if ! command -v convert >/dev/null 2>&1; then
    echo "Error: ImageMagick not found. Install it:" >&2
    echo "  sudo apt install imagemagick  # Debian/Ubuntu" >&2
    echo "  brew install imagemagick       # macOS" >&2
    exit 1
  fi
  
  local formats=$(echo "$TO" | tr ',' ' ')
  [ -z "$formats" ] && formats="webp"
  local size_list=$(echo "$SIZES" | tr ',' ' ')
  [ -z "$size_list" ] && size_list="1x"
  
  for file in $FILES; do
    [ ! -f "$file" ] && continue
    ext="${file##*.}"
    base=$(basename "$file" ".$ext")
    
    case "$ext" in
      jpg|jpeg|png|webp|avif|tiff) ;;
      *) echo "Skipped (unsupported): $file"; continue ;;
    esac
    
    for fmt in $formats; do
      for size in $size_list; do
        suffix=""
        [ "$size" != "1x" ] && suffix="@$size"
        
        outfile="${OUT:-.}/$base$suffix.$fmt"
        
        if [ "$DRY_RUN" = "1" ]; then
          echo "Would convert: $file → $outfile"
        else
          mkdir -p "$(dirname "$outfile")"
          convert "$file" -quality "$QUALITY" "$outfile" 2>/dev/null
          echo "Created: $outfile"
        fi
      done
    done
  done
}

generate_favicons() {
  local source="$1"
  
  if ! command -v convert >/dev/null 2>&1; then
    echo "Error: ImageMagick required for favicon generation" >&2
    exit 1
  fi
  
  local outdir="${OUT:-favicon}"
  mkdir -p "$outdir"
  
  for size in 16 32 48 64 128 192 256 512; do
    outfile="$outdir/favicon-${size}x${size}.png"
    if [ "$DRY_RUN" = "1" ]; then
      echo "Would create: $outfile"
    else
      convert "$source" -resize "${size}x${size}" "$outfile" 2>/dev/null
      echo "Created: $outfile"
    fi
  done
}

convert_tokens() {
  local json_file="$1"
  
  if ! command -v jq >/dev/null 2>&1; then
    echo "Error: jq required for token conversion" >&2
    echo "  sudo apt install jq  # Debian/Ubuntu" >&2
    echo "  brew install jq      # macOS" >&2
    exit 1
  fi
  
  echo ":root {"
  jq -r 'to_entries[] | 
    if (.value | type) == "object" then 
      .value | to_entries[] | "  --\(.key): \(.value);"
    else 
      "  --\(.key): \(.value);"
    end' "$json_file" 2>/dev/null || \
  jq -r 'to_entries[] | "  --\(.key): \(.value);"' "$json_file"
  echo "}"
}

case "$SUBCOMMAND" in
  rename)
    rename_files
    ;;
  images)
    process_images
    ;;
  favicon)
    source=$(echo "$FILES" | awk '{print $1}')
    [ -z "$source" ] || [ ! -f "$source" ] && echo "Error: Source file not found." >&2 && exit 1
    generate_favicons "$source"
    ;;
  tokens)
    file=$(echo "$FILES" | awk '{print $1}')
    [ -z "$file" ] || [ ! -f "$file" ] && echo "Error: JSON file not found." >&2 && exit 1
    output=$(convert_tokens "$file")
    if [ "$DRY_RUN" = "1" ]; then
      echo "[dry-run] Would output CSS" >&2
      echo "$output"
    elif [ -n "$OUT" ]; then
      mkdir -p "$(dirname "$OUT")"
      echo "$output" > "$OUT"
      echo "Written to $OUT" >&2
    else
      echo "$output"
    fi
    ;;
  *)
    [ -z "$SUBCOMMAND" ] && print_help && exit 0
    echo "Error: Unknown subcommand \"$SUBCOMMAND\"" >&2
    exit 1
    ;;
esac
