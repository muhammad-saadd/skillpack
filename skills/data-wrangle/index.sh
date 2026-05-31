#!/bin/sh
set -e

TO=""
OUT=""
DRY_RUN=""
CLEAN=""
DEDUP=""
FIX_ENCODING=""
MERGE=""
KEY=""
VALIDATE=""
REPORT=""
SQL=""
SQL_FLAG=""
FILES=""

print_help() {
  cat <<'EOF'
skillpack data-wrangle — Clean, convert, merge, and validate tabular data

USAGE
  skillpack data-wrangle <files...> [options]

OPTIONS
  --to <fmt>         Convert to: csv, json, markdown
  --out <dir>        Output directory (default: stdout)
  --clean            Remove empty rows and normalize whitespace
  --dedup            Remove duplicate rows
  --fix-encoding     Fix common encoding issues (mojibake)
  --merge            Merge multiple files (requires --key)
  --key <column>     Column key for merge operations
  --validate         Validate data and produce a report
  --report <file>    Write validation report to this file
  --sql              Generate SQL from natural language query
  --dry-run          Preview output without writing files
  --help, -h         Show this help
EOF
}

fix_encoding() {
  sed 's/Ã©/é/g; s/Ã¨/è/g; s/Ã /à/g; s/Ã¶/ö/g; s/Ã¼/ü/g; s/Ã¤/ä/g; s/â€™/'"'"'/g; s/â€œ/"/g; s/â€\x9d/"/g; s/â€"/—/g; s/â€"/–/g'
}

csv_clean() {
  awk -F',' 'NF > 0 && $0 !~ /^[[:space:]]*$/' | sed 's/[[:space:]]\+/ /g; s/^ //; s/ $//'
}

csv_dedup() {
  if [ -n "$KEY" ]; then
    awk -F',' -v key="$KEY" 'NR==1{for(i=1;i<=NF;i++)if($i==key)k=i;next} !seen[$k]++' 
  else
    awk '!seen[$0]++'
  fi
}

generate_sql() {
  desc="$1"
  echo "$desc" | awk '{
    # Convert to lowercase
    for(i=1;i<=NF;i++) $i=tolower($i)
    
    if ($0 ~ /total|sum/) {
      printf "SELECT SUM(column_name)\n"
    } else if ($0 ~ /count|how many/) {
      printf "SELECT COUNT(*)\n"
    } else if ($0 ~ /average|avg/) {
      printf "SELECT AVG(*)\n"
    } else {
      printf "SELECT *\n"
    }
    
    # Find table name after "from"
    for(i=1;i<=NF;i++) {
      if ($i == "from" && i < NF) printf "FROM %s\n", $(i+1)
    }
    
    # Find group by
    for(i=1;i<=NF;i++) {
      if ($i == "by" && i < NF) printf "GROUP BY %s\n", $(i+1)
    }
  }'
}

validate_csv() {
  local file="$1"
  local total=$(wc -l < "$file")
  local issues=0
  
  header=$(head -1 "$file")
  ncols=$(echo "$header" | awk -F',' '{print NF}')
  
  echo "Validation Report"
  echo "================="
  echo "File: $file"
  echo "Total rows: $((total - 1))"
  echo "Columns: $ncols"
  echo ""
  
  echo "Empty values per column:"
  echo "$header" | tr ',' '\n' | while read -r col; do
    empty=$(awk -F',' -v col="$col" 'NR==1{for(i=1;i<=NF;i++)if($i==col)k=i;next}k && $k == ""{count++}END{print count+0}' "$file")
    if [ "$empty" -gt 0 ]; then
      echo "  $col: $empty empty values"
    fi
  done
  
  dups=$(tail -n +2 "$file" | sort | uniq -d | wc -l)
  if [ "$dups" -gt 0 ]; then
    echo ""
    echo "Duplicate rows: $dups"
  fi
}

while [ $# -gt 0 ]; do
  case "$1" in
    --help|-h) print_help; exit 0 ;;
    --dry-run) DRY_RUN=1; shift ;;
    --clean) CLEAN=1; shift ;;
    --dedup) DEDUP=1; shift ;;
    --fix-encoding) FIX_ENCODING=1; shift ;;
    --merge) MERGE=1; shift ;;
    --validate) VALIDATE=1; shift ;;
    --sql)
      SQL_FLAG="1"
      if [ $# -ge 2 ]; then SQL="$2"; shift 2; else SQL=""; shift; fi
      ;;
    --to) TO="$2"; shift 2 ;;
    --out) OUT="$2"; shift 2 ;;
    --key) KEY="$2"; shift 2 ;;
    --report) REPORT="$2"; shift 2 ;;
    -*) echo "Unknown option: $1" >&2; exit 1 ;;
    *) FILES="$FILES $1"; shift ;;
  esac
done

# Handle SQL generation
if [ -n "$SQL" ] || { [ "$SQL_FLAG" = "1" ] && [ -n "$FILES" ]; }; then
  if [ -z "$SQL" ]; then
    # Use the entire FILES string as the query
    SQL="$FILES"
  fi
  generate_sql "$SQL"
  exit 0
fi

if [ -z "$FILES" ]; then
  echo "Error: No input files specified." >&2
  exit 1
fi

for file in $FILES; do
  [ ! -f "$file" ] && echo "Error: File not found: $file" >&2 && exit 1
  
  ext="${file##*.}"
  
  if [ "$VALIDATE" = "1" ]; then
    report=$(validate_csv "$file")
    echo "$report"
    [ -n "$REPORT" ] && echo "$report" > "$REPORT" && echo "Report written to $REPORT" >&2
    exit 0
  fi
  
  content=$(cat "$file")
  
  [ "$FIX_ENCODING" = "1" ] && content=$(echo "$content" | fix_encoding)
  [ "$CLEAN" = "1" ] && content=$(echo "$content" | csv_clean)
  [ "$DEDUP" = "1" ] && content=$(echo "$content" | csv_dedup)
  
  target="${TO:-$ext}"
  
  case "$target" in
    csv)  output="$content" ;;
    json)
      output=$(echo "$content" | awk -F',' 'NR==1{for(i=1;i<=NF;i++)h[i]=$i;next} {printf "{"; for(i=1;i<=NF;i++){printf "\"%s\":\"%s\"", h[i], $i; if(i<NF)printf ","}; printf "}\n"}')
      output="[$output]"
      ;;
    markdown|md)
      output=$(echo "$content" | awk -F',' 'NR==1{for(i=1;i<=NF;i++){printf "| %s ", $i}; printf "|\n"; for(i=1;i<=NF;i++)printf "| --- "; printf "|\n"; next} {for(i=1;i<=NF;i++){printf "| %s ", $i}; printf "|\n"}')
      ;;
    *) output="$content" ;;
  esac
  
  if [ "$DRY_RUN" = "1" ]; then
    echo "[dry-run] Would output from: $file" >&2
    echo "$output"
  elif [ -n "$OUT" ]; then
    mkdir -p "$OUT"
    base=$(basename "$file" ".$ext")
    outfile="$OUT/$base.$target"
    echo "$output" > "$outfile"
    echo "Written to $outfile" >&2
  else
    echo "$output"
  fi
done
