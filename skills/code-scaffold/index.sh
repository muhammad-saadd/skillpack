#!/bin/sh
set -e

SUBCOMMAND=""
OUT=""
DRY_RUN=""
FRAMEWORK="vitest"
STACK=""
NEW_NAME=""
UPDATE=""
SINCE=""
FILES=""

print_help() {
  cat <<'EOF'
skillpack code-scaffold — Generate tests, project scaffolds, docs, and boilerplate

SUBCOMMANDS
  skillpack code-scaffold --new <name> --stack "node express typescript"
  skillpack code-scaffold tests <file> [--framework vitest|jest]
  skillpack code-scaffold readme <dir>
  skillpack code-scaffold env <file>
  skillpack code-scaffold changelog [--since v1.0.0]

OPTIONS
  --out <path>       Output file or directory
  --dry-run          Preview output
  --help, -h         Show this help
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --help|-h) print_help; exit 0 ;;
    --dry-run) DRY_RUN=1; shift ;;
    --update) UPDATE=1; shift ;;
    --new) NEW_NAME="$2"; shift 2 ;;
    --out) OUT="$2"; shift 2 ;;
    --framework) FRAMEWORK="$2"; shift 2 ;;
    --stack) STACK="$2"; shift 2 ;;
    --since) SINCE="$2"; shift 2 ;;
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

generate_project() {
  local name="$1"
  mkdir -p "$name/src" "$name/tests"
  
  cat > "$name/package.json" <<PKGJSON
{
  "name": "$name",
  "version": "1.0.0",
  "scripts": {
    "build": "tsc",
    "dev": "ts-node src/index.ts",
    "test": "vitest"
  },
  "dependencies": {
    "express": "^4.18.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  }
}
PKGJSON

  cat > "$name/tsconfig.json" <<'TSCONFIG'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true
  }
}
TSCONFIG

  cat > "$name/.gitignore" <<'GITIGNORE'
node_modules/
dist/
.env
*.log
GITIGNORE

  cat > "$name/src/index.ts" <<'SRCINDEX'
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
SRCINDEX

  cat > "$name/README.md" <<README
# $name

## Setup

\`\`\`bash
npm install
npm run dev
\`\`\`

## Scripts

- \`npm run build\` — Compile TypeScript
- \`npm run dev\` — Start dev server
- \`npm test\` — Run tests
README

  echo "Created project: $name/"
  echo "  $name/package.json"
  echo "  $name/tsconfig.json"
  echo "  $name/.gitignore"
  echo "  $name/src/index.ts"
  echo "  $name/README.md"
}

generate_tests() {
  local file="$1"
  local base=$(basename "$file" | sed 's/\.[^.]*$//')
  
  if [ "$FRAMEWORK" = "vitest" ]; then
    imports="import { describe, it, expect } from 'vitest';"
  else
    imports=""
  fi
  
  # Extract function/const names
  funcs=$(grep -oE '(function|const|let|var) +[a-zA-Z_][a-zA-Z0-9_]*' "$file" 2>/dev/null | awk '{print $2}' | head -5)
  
  tests=""
  for fn in $funcs; do
    tests="${tests}
  it('${fn} should work correctly', () => {
    // TODO: Add test logic for ${fn}
    expect(true).toBe(true);
  });"
  done
  
  if [ -z "$tests" ]; then
    tests="
  it('should be tested', () => {
    expect(true).toBe(true);
  });"
  fi
  
  cat <<TESTS
$imports

describe('$base', () =>$tests
});
TESTS
}

generate_readme() {
  local dir="$1"
  echo "# $(basename "$dir")"
  echo ""
  
  if [ -f "$dir/package.json" ]; then
    if grep -q '"description"' "$dir/package.json" 2>/dev/null; then
      grep '"description"' "$dir/package.json" | sed 's/.*"description": *"//;s/".*//'
      echo ""
    fi
  fi
  
  echo "## Structure"
  echo ""
  echo "\`\`\`"
  ls -1 "$dir" 2>/dev/null | sed 's/^/  /'
  echo "\`\`\`"
}

generate_env_example() {
  local file="$1"
  sed 's/=.*/=/' "$file"
}

generate_changelog() {
  local since="$1"
  echo "# Changelog"
  echo ""
  echo "## Recent Changes"
  echo ""
  git log ${since:+$since..}HEAD --pretty=format:"- %s (%h)" --no-merges 2>/dev/null || echo "No git history found."
  echo ""
}

if [ -n "$NEW_NAME" ]; then
  generate_project "$NEW_NAME"
  exit 0
fi

case "$SUBCOMMAND" in
  tests)
    file=$(echo "$FILES" | awk '{print $1}')
    [ -z "$file" ] || [ ! -f "$file" ] && echo "Error: Source file not found." >&2 && exit 1
    test_content=$(generate_tests "$file")
    out_file="${OUT:-$(echo "$file" | sed 's/\.[^.]*$/.test./')}"
    if [ "$DRY_RUN" = "1" ]; then
      echo "[dry-run] Would write test to: $out_file" >&2
      echo "$test_content"
    elif [ -n "$OUT" ]; then
      echo "$test_content" > "$OUT"
      echo "Written to $OUT" >&2
    else
      echo "$test_content"
    fi
    ;;
  readme)
    dir=$(echo "$FILES" | awk '{print $1}')
    [ -z "$dir" ] && dir="."
    [ ! -d "$dir" ] && echo "Error: Directory not found." >&2 && exit 1
    readme=$(generate_readme "$dir")
    if [ "$DRY_RUN" = "1" ]; then
      echo "[dry-run] Would write README" >&2
      echo "$readme"
    elif [ -n "$OUT" ]; then
      echo "$readme" > "$OUT"
      echo "Written to $OUT" >&2
    else
      echo "$readme"
    fi
    ;;
  env)
    file=$(echo "$FILES" | awk '{print $1}')
    [ -z "$file" ] || [ ! -f "$file" ] && echo "Error: .env file not found." >&2 && exit 1
    example=$(generate_env_example "$file")
    if [ "$DRY_RUN" = "1" ]; then
      echo "[dry-run] Would write .env.example" >&2
      echo "$example"
    elif [ -n "$OUT" ]; then
      echo "$example" > "$OUT"
      echo "Written to $OUT" >&2
    else
      echo "$example"
    fi
    ;;
  changelog)
    changelog=$(generate_changelog "$SINCE")
    if [ "$DRY_RUN" = "1" ]; then
      echo "[dry-run] Would write CHANGELOG.md" >&2
      echo "$changelog"
    elif [ -n "$OUT" ]; then
      echo "$changelog" > "$OUT"
      echo "Written to $OUT" >&2
    else
      echo "$changelog"
    fi
    ;;
  *)
    [ -z "$SUBCOMMAND" ] && print_help && exit 0
    echo "Error: Unknown subcommand \"$SUBCOMMAND\"" >&2
    exit 1
    ;;
esac
