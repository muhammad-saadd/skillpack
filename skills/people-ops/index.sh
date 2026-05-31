#!/bin/sh
set -e

SUBCOMMAND=""
OUT=""
DRY_RUN=""
FORMAT="json"
BATCH=""
ROLE=""
TEAM=""
LEVEL=""
STACK=""
REMOTE=""
START=""
FILES=""

print_help() {
  cat <<'EOF'
skillpack people-ops — Resume parser, job descriptions, onboarding checklists

SUBCOMMANDS
  skillpack people-ops resume <file|dir> [--batch] [--format json|csv]
  skillpack people-ops jd --role "Role" [--team "Team"] [--level junior|mid|senior] [--stack "tech"] [--remote]
  skillpack people-ops onboard --role "Role" [--start "2025-02-01"]

OPTIONS
  --out <path>       Output file
  --format <fmt>     Output format: json, csv
  --batch            Process multiple files
  --dry-run          Preview output
  --help, -h         Show this help
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --help|-h) print_help; exit 0 ;;
    --dry-run) DRY_RUN=1; shift ;;
    --batch) BATCH=1; shift ;;
    --remote) REMOTE=1; shift ;;
    --out) OUT="$2"; shift 2 ;;
    --format) FORMAT="$2"; shift 2 ;;
    --role) ROLE="$2"; shift 2 ;;
    --team) TEAM="$2"; shift 2 ;;
    --level) LEVEL="$2"; shift 2 ;;
    --stack) STACK="$2"; shift 2 ;;
    --start) START="$2"; shift 2 ;;
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

parse_resume() {
  local file="$1"
  local text=""
  
  ext="${file##*.}"
  case "$ext" in
    pdf)
      if command -v pdftotext >/dev/null 2>&1; then
        text=$(pdftotext -layout "$file" - 2>/dev/null)
      else
        echo "Error: pdftotext required for PDF resumes" >&2
        exit 1
      fi
      ;;
    docx)
      if command -v docx2txt >/dev/null 2>&1; then
        text=$(docx2txt "$file" - 2>/dev/null)
      elif command -v pandoc >/dev/null 2>&1; then
        text=$(pandoc -t plain "$file" 2>/dev/null)
      else
        echo "Error: docx2txt or pandoc required for DOCX resumes" >&2
        exit 1
      fi
      ;;
    txt) text=$(cat "$file") ;;
    *)   echo "Error: Unsupported file type: $ext" >&2; return 1 ;;
  esac
  
  # Extract fields
  local name=$(echo "$text" | head -1 | sed 's/^[[:space:]]*//')
  local email=$(echo "$text" | grep -oE '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}' | head -1)
  local phone=$(echo "$text" | grep -oE '(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}' | head -1)
  local skills=$(echo "$text" | grep -iA5 'skills\|technologies' | grep -oE '[A-Z][a-z]+ [A-Z][a-z]+' | head -5 | tr '\n' ',' | sed 's/,$//')
  
  cat <<JSON
{
  "name": "${name:-Unknown}",
  "email": "${email:-}",
  "phone": "${phone:-}",
  "skills": "${skills:-}",
  "source_file": "$(basename "$file")"
}
JSON
}

generate_jd() {
  local role="${ROLE:-Software Engineer}"
  local team="${TEAM:-Engineering}"
  local level="${LEVEL:-mid}"
  local stack="${STACK:-Node.js, React, PostgreSQL}"
  
  cat <<JD
# ${role}

**Team:** ${team}
**Level:** $(echo "$level" | sed 's/./\U&/')
**Location:** $([ "$REMOTE" = "1" ] && echo "Remote" || echo "On-site")

## About the Role

We are looking for a ${role} to join our ${team} team.

## Responsibilities

- Design and implement new features and improvements
- Write clean, maintainable, and well-tested code
- Collaborate with cross-functional teams
- Participate in code reviews
- Troubleshoot and debug production issues

## Requirements

- Proficiency in ${stack}
- Strong understanding of software engineering principles
- Experience with version control (Git)
- Excellent problem-solving and communication skills

## Nice to Have

- Experience with cloud platforms (AWS, GCP, Azure)
- Knowledge of CI/CD pipelines
- Contributed to open source projects

## Benefits

- Competitive salary and equity
- Health, dental, and vision insurance
- Flexible PTO
$([ "$REMOTE" = "1" ] && echo "- Remote-friendly culture")

---

*We are an equal opportunity employer.*
JD
}

generate_onboarding() {
  local role="${role:-Engineer}"
  local start_date="${start:-$(date -d '+7 days' '+%Y-%m-%d' 2>/dev/null || date -v+7d '+%Y-%m-%d' 2>/dev/null || echo 'TBD')}"
  
  cat <<ONBOARD
# Onboarding Checklist — ${role}

**Start Date:** ${start_date}

## Week 1: Getting Started

### Day 1 — First Day
- [ ] Welcome meeting with manager
- [ ] Team introductions
- [ ] Set up workstation and development environment
- [ ] Get access to required tools (GitHub, Slack, Jira, etc.)
- [ ] Review company handbook and policies
- [ ] Lunch with team

### Day 2-3 — Setup & Orientation
- [ ] Complete IT security training
- [ ] Set up local development environment
- [ ] Clone repositories and run the project locally
- [ ] Review codebase architecture and documentation
- [ ] Pair with a team member on a small task

### Day 4-5 — First Tasks
- [ ] Complete first small PR (bug fix or documentation)
- [ ] Attend team standups
- [ ] Review team processes and workflows

## Week 2: Deep Dive
- [ ] Review ${role}-specific documentation
- [ ] Complete onboarding project/task
- [ ] Attend all relevant team meetings

## Week 3: Integration
- [ ] Take on first real task/ticket
- [ ] Participate in code reviews
- [ ] Learn monitoring and alerting setup

## Week 4: Independence
- [ ] Complete first feature or significant task
- [ ] Provide feedback on onboarding experience
- [ ] Set initial 30-60-90 day goals with manager

## 30-Day Check-in
- [ ] Review progress with manager

## 60-Day Check-in
- [ ] Discuss career growth and development

## 90-Day Check-in
- [ ] Performance review with manager

---

*Welcome to the team!*
ONBOARD
}

case "$SUBCOMMAND" in
  resume)
    for file in $FILES; do
      [ ! -f "$file" ] && echo "Error: File not found: $file" >&2 && exit 1
    done
    
    if [ "$FORMAT" = "csv" ]; then
      echo "name,email,phone,skills,source_file"
      for file in $FILES; do
        parse_resume "$file" | awk -F'"' '{
          for(i=1;i<=NF;i++){
            if($i=="name") name=$(i+2)
            if($i=="email") email=$(i+2)
            if($i=="phone") phone=$(i+2)
            if($i=="skills") skills=$(i+2)
          }
        } {printf "%s,%s,%s,%s\n", name, email, phone, skills}'
      done
    else
      echo "["
      first=1
      for file in $FILES; do
        [ "$first" = "0" ] && echo ","
        parse_resume "$file" | tr -d '\n'
        first=0
      done
      echo "]"
    fi
    ;;
  jd)
    output=$(generate_jd)
    ;;
  onboard)
    output=$(generate_onboarding)
    ;;
  *)
    [ -z "$SUBCOMMAND" ] && print_help && exit 0
    echo "Error: Unknown subcommand \"$SUBCOMMAND\"" >&2
    exit 1
    ;;
esac

if [ "$SUBCOMMAND" != "resume" ]; then
  if [ "$DRY_RUN" = "1" ]; then
    echo "[dry-run] Would output:" >&2
    echo "$output"
  elif [ -n "$OUT" ]; then
    echo "$output" > "$OUT"
    echo "Written to $OUT" >&2
  else
    echo "$output"
  fi
fi
