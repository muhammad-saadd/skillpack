#!/bin/sh
set -e

FORMAT="markdown"
OUT=""
DRY_RUN=""
SCHEMA=""
EXTRACT=""
OCR=""
FILES=""

print_help() {
  cat <<'EOF'
skillpack doc-extract — Extract structured data from documents

USAGE
  skillpack doc-extract <files...> [options]

OPTIONS
  --format <fmt>    Output format: markdown, csv, json, txt (default: markdown)
  --out <dir>       Output directory (default: stdout)
  --schema <name>   Schema preset: invoice, resume, contract, receipt, general
  --extract <type>  Extract specific elements: tables, clauses, metadata
  --ocr             Enable OCR for scanned documents/images
  --dry-run         Preview output without writing files
  --help, -h        Show this help
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --help|-h) print_help; exit 0 ;;
    --dry-run) DRY_RUN=1; shift ;;
    --ocr) OCR=1; shift ;;
    --format) FORMAT="$2"; shift 2 ;;
    --out) OUT="$2"; shift 2 ;;
    --schema) SCHEMA="$2"; shift 2 ;;
    --extract) EXTRACT="$2"; shift 2 ;;
    -*) echo "Unknown option: $1" >&2; exit 1 ;;
    *) FILES="$FILES $1"; shift ;;
  esac
done

if [ -z "$FILES" ]; then
  echo "Error: No input files specified." >&2
  echo "Run skillpack doc-extract --help for usage." >&2
  exit 1
fi

extract_pdf() {
  local file="$1"
  if command -v pdftotext >/dev/null 2>&1; then
    pdftotext -layout "$file" -
  else
    echo "Error: pdftotext not found. Install poppler-utils:" >&2
    echo "  sudo apt install poppler-utils  # Debian/Ubuntu" >&2
    echo "  brew install poppler             # macOS" >&2
    exit 1
  fi
}

extract_docx() {
  local file="$1"
  if command -v docx2txt >/dev/null 2>&1; then
    docx2txt "$file" -
  elif command -v pandoc >/dev/null 2>&1; then
    pandoc -t plain "$file"
  else
    echo "Error: No DOCX parser found. Install docx2txt or pandoc:" >&2
    echo "  sudo apt install docx2txt  # Debian/Ubuntu" >&2
    echo "  brew install pandoc        # macOS" >&2
    exit 1
  fi
}

extract_image() {
  local file="$1"
  if [ "$OCR" = "1" ] && command -v tesseract >/dev/null 2>&1; then
    tesseract "$file" stdout 2>/dev/null
  else
    echo "[OCR not available. Use with Claude Code/OpenCode for OCR on: $file]"
  fi
}

apply_schema() {
  local text="$1"
  local schema="$2"
  case "$schema" in
    invoice)
      echo "$text" | awk '
        /[Vv]endor|[Ff]rom|[Cc]ompany/ { print "vendor: " $0 }
        /[Ii]nvoice.*(number|#)/ { print "invoice_number: " $0 }
        /[Dd]ate/ { print "date: " $0 }
        /[Tt]otal|[Aa]mount.*[Dd]ue/ { print "total: " $0 }
        /[Tt]ax/ { print "tax: " $0 }
      '
      ;;
    resume)
      echo "$text" | awk '
        NR==1 { print "name: " $0 }
        /@/ { print "email: " $0 }
        /[0-9]{3}[-.][0-9]{3}[-.][0-9]{4}/ { print "phone: " $0 }
        /[Ss]kills|[Tt]echnologies/ { print "skills_section: " $0 }
        /[Ee]xperience|[Ww]ork/ { print "experience_section: " $0 }
        /[Ee]ducation|[Uu]niversity/ { print "education_section: " $0 }
      '
      ;;
    *)
      echo "schema: ${schema:-general}"
      echo "---"
      echo "$text"
      ;;
  esac
}

apply_extract() {
  local text="$1"
  local type="$2"
  case "$type" in
    tables)
      echo "$text" | awk '/\t/ || /  / { print }'
      ;;
    clauses)
      echo "$text" | awk '/^[0-9]+\./ || /^\([a-z]\)/ { if (buf) print "---"; buf=1 } { if (buf) print } !/^[0-9]+\./ && !/^\([a-z]\)/ && !buf { print }'
      ;;
    metadata)
      echo "$text" | head -20
      ;;
    *)
      echo "$text"
      ;;
  esac
}

for file in $FILES; do
  if [ ! -f "$file" ]; then
    echo "Error: File not found: $file" >&2
    exit 1
  fi

  ext="${file##*.}"
  case "$ext" in
    pdf)  text=$(extract_pdf "$file") ;;
    docx) text=$(extract_docx "$file") ;;
    png|jpg|jpeg|tiff|bmp) text=$(extract_image "$file") ;;
    txt)  text=$(cat "$file") ;;
    *)    echo "Error: Unsupported file type: $ext" >&2; exit 1 ;;
  esac

  [ -n "$SCHEMA" ] && text=$(apply_schema "$text" "$SCHEMA")
  [ -n "$EXTRACT" ] && text=$(apply_extract "$text" "$EXTRACT")

  base=$(basename "$file" ".$ext")
  case "$FORMAT" in
    json)  escaped=$(echo "$text" | sed 's/\\/\\\\/g; s/"/\\"/g; s/\t/\\t/g' | tr '\n' ' ')
           output=$(printf '{"file":"%s","content":"%s"}' "$file" "$escaped") ;;
    csv)   output=$(echo "$text" | awk -F'\t+' '{ row=""; for(i=1;i<=NF;i++) { gsub(/^ +| +$/,"",$i); row=row sep "\"" $i "\""; sep="," } print row }') ;;
    txt)   output="$text" ;;
    *)     output="$text" ;;
  esac

  if [ "$DRY_RUN" = "1" ]; then
    echo "[dry-run] Would output from: $file" >&2
    echo "$output"
  elif [ -n "$OUT" ]; then
    mkdir -p "$OUT"
    outfile="$OUT/$base.$FORMAT"
    echo "$output" > "$outfile"
    echo "Written to $outfile" >&2
  else
    echo "$output"
  fi
done
