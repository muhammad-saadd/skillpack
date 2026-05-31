#!/bin/sh
set -e

SUBCOMMAND=""
OUT=""
DRY_RUN=""
FORMAT="json"
BANK="generic"
BATCH=""
PERIOD=""
CATEGORIZE=""
FILES=""

print_help() {
  cat <<'EOF'
skillpack finance-extract — Extract data from bank statements, invoices, and receipts

SUBCOMMANDS
  skillpack finance-extract statement <files...> [--bank chase|bofa|generic] [--categorize]
  skillpack finance-extract invoice <file|dir> [--batch] [--format json|csv]
  skillpack finance-extract report <dir> [--period "2024-Q4"] [--categorize]

OPTIONS
  --out <path>       Output file
  --format <fmt>     Output format: csv, json
  --bank <name>      Bank preset for statement parsing
  --batch            Process multiple files
  --period <p>       Filter by period (e.g., 2024-Q4)
  --categorize       Auto-categorize transactions
  --dry-run          Preview output
  --help, -h         Show this help
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --help|-h) print_help; exit 0 ;;
    --dry-run) DRY_RUN=1; shift ;;
    --batch) BATCH=1; shift ;;
    --categorize) CATEGORIZE=1; shift ;;
    --out) OUT="$2"; shift 2 ;;
    --format) FORMAT="$2"; shift 2 ;;
    --bank) BANK="$2"; shift 2 ;;
    --period) PERIOD="$2"; shift 2 ;;
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

categorize() {
  local desc=$(echo "$1" | tr '[:upper:]' '[:lower:]')
  case "$desc" in
    *airline*|*hotel*|*uber*|*lyft*|*taxi*|*parking*|*airbnb*) echo "travel" ;;
    *restaurant*|*cafe*|*coffee*|*starbucks*|*mcdonald*|*doordash*|*ubereats*) echo "meals" ;;
    *github*|*aws*|*google*|*azure*|*stripe*|*shopify*|*slack*|*notion*|*figma*|*adobe*) echo "software" ;;
    *office*|*staples*|*amazon*|*walmart*|*target*|*costco*) echo "office" ;;
    *electric*|*gas*|*water*|*internet*|*phone*|*verizon*|*att*|*comcast*) echo "utilities" ;;
    *payroll*|*salary*|*wages*|*bonus*) echo "payroll" ;;
    *) echo "other" ;;
  esac
}

parse_statement() {
  local file="$1"
  
  if ! command -v pdftotext >/dev/null 2>&1; then
    echo "Error: pdftotext required. Install poppler-utils." >&2
    exit 1
  fi
  
  pdftotext -layout "$file" - 2>/dev/null | awk '
    /[0-9]{1,2}\/[0-9]{1,2}/ {
      match($0, /([0-9]{1,2}\/[0-9]{1,2}(\/[0-9]{2,4})?)/, date)
      match($0, /\$?([0-9,]+\.?[0-9]*)/, amt)
      if (date[1] && amt[1]) {
        desc = $0
        gsub(date[1], "", desc)
        gsub(amt[1], "", desc)
        gsub(/^[[:space:]]+|[[:space:]]+$/, "", desc)
        gsub(/,/, "", amt[1])
        printf "{\"date\":\"%s\",\"description\":\"%s\",\"amount\":%s}", date[1], desc, amt[1]
        print ""
      }
    }
  '
}

parse_invoice() {
  local file="$1"
  local text=$(cat "$file" 2>/dev/null || pdftotext -layout "$file" - 2>/dev/null)
  
  local vendor=$(echo "$text" | grep -iE 'vendor|from|company' | head -1 | sed 's/.*://;s/^[[:space:]]*//')
  local invoice_num=$(echo "$text" | grep -iE 'invoice.*(number|#)' | head -1 | grep -oE '[0-9]+')
  local date=$(echo "$text" | grep -iE 'date' | head -1 | sed 's/.*://;s/^[[:space:]]*//')
  local total=$(echo "$text" | grep -iE 'total|amount.*due' | head -1 | grep -oE '[0-9,]+\.[0-9]+')
  local tax=$(echo "$text" | grep -iE 'tax|vat' | head -1 | grep -oE '[0-9,]+\.[0-9]+')
  
  cat <<JSON
{
  "vendor": "${vendor:-Unknown}",
  "invoice_number": "${invoice_num:-}",
  "date": "${date:-}",
  "total": ${total:-0},
  "tax": ${tax:-0}
}
JSON
}

for file in $FILES; do
  [ ! -f "$file" ] && [ ! -d "$file" ] && echo "Error: File not found: $file" >&2 && exit 1
done

case "$SUBCOMMAND" in
  statement)
    all_transactions="[]"
    for file in $FILES; do
      transactions=$(parse_statement "$file")
      
      if [ "$CATEGORIZE" = "1" ]; then
        transactions=$(echo "$transactions" | while read -r line; do
          desc=$(echo "$line" | grep -oE '"description":"[^"]*"' | sed 's/"description":"//;s/"//')
          cat=$(categorize "$desc")
          echo "$line" | sed "s/}$/,\"category\":\"$cat\"}/"
        done)
      fi
      
      all_transactions="$all_transactions
$transactions"
    done
    
    if [ "$FORMAT" = "csv" ]; then
      echo "date,description,amount,category"
      echo "$all_transactions" | grep -oE '\{[^}]+\}' | while read -r json; do
        date=$(echo "$json" | grep -oE '"date":"[^"]*"' | cut -d'"' -f4)
        desc=$(echo "$json" | grep -oE '"description":"[^"]*"' | cut -d'"' -f4)
        amount=$(echo "$json" | grep -oE '"amount":[0-9.]+' | cut -d: -f2)
        cat=$(echo "$json" | grep -oE '"category":"[^"]*"' | cut -d'"' -f4)
        echo "$date,$desc,$amount,$cat"
      done
    else
      echo "$all_transactions" | grep -oE '\{[^}]+\}' | awk 'BEGIN{print "["} {if(NR>1)printf ",%s",$0; else print $0} END{print "]"}'
    fi
    ;;
  invoice)
    file=$(echo "$FILES" | awk '{print $1}')
    
    if [ -d "$file" ] || [ "$BATCH" = "1" ]; then
      dir="$file"
      [ -f "$file" ] && dir=$(dirname "$file")
      echo "["
      first=1
      for f in "$dir"/*; do
        [ -f "$f" ] || continue
        case "$f" in *.pdf|*.txt) ;; *) continue ;; esac
        [ "$first" = "0" ] && echo ","
        parse_invoice "$f" | tr -d '\n'
        first=0
      done
      echo "]"
    else
      parse_invoice "$file"
    fi
    ;;
  report)
    dir=$(echo "$FILES" | awk '{print $1}')
    [ -z "$dir" ] && dir="."
    
    echo "{"
    echo "  \"transactions\": ["
    first=1
    for f in "$dir"/*; do
      [ -f "$f" ] || continue
      case "$f" in *.pdf|*.csv) ;; *) continue ;; esac
      transactions=$(parse_statement "$f" 2>/dev/null)
      [ -z "$transactions" ] && continue
      [ "$first" = "0" ] && echo ","
      echo "$transactions" | grep -oE '\{[^}]+\}' | tr -d '\n'
      first=0
    done
    echo "]"
    echo "}"
    ;;
  *)
    [ -z "$SUBCOMMAND" ] && print_help && exit 0
    echo "Error: Unknown subcommand \"$SUBCOMMAND\"" >&2
    exit 1
    ;;
esac
