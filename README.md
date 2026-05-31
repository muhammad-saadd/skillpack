# skillpack

**⚡ One command replaces an afternoon of clicking**

[![npm version](https://img.shields.io/npm/v/skillpack.svg)](https://www.npmjs.com/package/skillpack)
[![license](https://img.shields.io/npm/l/skillpack.svg)](https://github.com/muhammad-saadd/skillpack/blob/main/LICENSE)
[![CI](https://github.com/muhammad-saadd/skillpack/actions/workflows/ci.yml/badge.svg)](https://github.com/muhammad-saadd/skillpack/actions/workflows/ci.yml)
AI-powered terminal skills that eliminate multi-click professional workflows. Extract data from PDFs, wrangle CSVs, scaffold code, generate infrastructure configs, process content, batch rename files, parse invoices, and manage resumes — all from a single command. Works with Claude Code, OpenCode, Codex CLI, and any MCP-compatible AI tool.

**Zero dependencies.** Pure POSIX shell scripts — works on any Linux/macOS system.

## The problem with professional workflows

Every professional task requires context switching between 5+ apps. A single invoice processing workflow might involve: Adobe Acrobat → Excel → Google Sheets → email → Slack. That's 45 minutes of clicking for something a terminal can do in 5 seconds.

| Task | Old way | skillpack |
|------|---------|-----------|
| Parse 50 invoices | Open each PDF → copy data → paste into Excel (2 hours) | `skillpack finance-extract invoice invoices/ --batch` |
| Convert CSV to JSON | Open in Excel → Save As → fix formatting (15 min) | `skillpack data-wrangle data.csv --to json` |
| Generate K8s from compose | Google "docker-compose to k8s" → copy-paste YAML (1 hour) | `skillpack infra-gen k8s docker-compose.yml` |
| Rename 200 photos | Right-click each → Rename → type new name (45 min) | `skillpack file-ops rename photos/ --pattern "{date}-{seq}-{name}"` |
| Parse resumes for hiring | Open each PDF → copy info → build spreadsheet (3 hours) | `skillpack people-ops resume resumes/ --batch` |

## Install in 30 seconds

```bash
# via npm
npm install -g skillpack

# or via curl
curl -fsSL https://raw.githubusercontent.com/muhammad-saadd/skillpack/main/install.sh | bash

# or clone and symlink
git clone https://github.com/muhammad-saadd/skillpack ~/.local/share/skillpack
ln -s ~/.local/share/skillpack/bin/skillpack ~/.local/bin/skillpack
```

## 60-second quickstart

```bash
# Extract text from a PDF
skillpack doc-extract report.pdf --format markdown

# Clean and deduplicate a CSV
skillpack data-wrangle sales.csv --clean --dedup --to json

# Generate a favicon set from a logo
skillpack file-ops favicon logo.svg --out public/
```

## Skills

### doc-extract — Document Data Extraction

Extract text, tables, and structured data from PDFs, DOCX files, and images. Supports OCR, schema-based extraction (invoices, resumes, contracts), and batch processing.

```bash
skillpack doc-extract invoice.pdf --format json --schema invoice
skillpack doc-extract resume.pdf --format json --schema resume
skillpack doc-extract *.pdf --format csv --out ./extracted/
```

**Output:**
```json
{
  "vendor": "Acme Corp",
  "invoice_number": "INV-2024-001",
  "total": 542.50
}
```

### data-wrangle — CSV/JSON/XLSX Automation

Clean, convert, merge, and validate tabular data. Generate SQL from natural language descriptions.

```bash
skillpack data-wrangle sales.csv --clean --fix-encoding --dedup
skillpack data-wrangle jan.csv feb.csv --merge --key "order_id"
skillpack data-wrangle "total revenue by region from sales.csv" --sql
```

**Output:**
```sql
SELECT SUM(revenue)
FROM sales
GROUP BY region
```

### code-scaffold — Project & Code Generation

Generate unit tests, project scaffolds, READMEs, .env.example files, API docs, changelogs, and TypeScript types.

```bash
skillpack code-scaffold --new my-api --stack "node express typescript"
skillpack code-scaffold tests src/utils.ts --framework vitest
skillpack code-scaffold types api-response.json --out src/types/api.ts
```

**Output:**
```
Created directory: my-api/src
Created file: my-api/package.json
Created file: my-api/tsconfig.json
Created file: my-api/src/index.ts
```

### infra-gen — Infrastructure as Code

Generate Kubernetes manifests, CI/CD pipelines, nginx/Apache configs, and Terraform templates from plain English.

```bash
skillpack infra-gen k8s docker-compose.yml --namespace production
skillpack infra-gen ci . --provider github-actions
skillpack infra-gen terraform "AWS: VPC + ECS + RDS + S3"
```

**Output:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: production
```

### content-craft — Content Processing

Proofread, translate, summarize, repurpose content, extract action items, and draft replies.

```bash
skillpack content-craft proofread docs/ --fix
skillpack content-craft summarize paper.pdf --style executive
skillpack content-craft actions meeting-notes.md --out actions.md
```

**Output:**
```markdown
## Executive Summary

This paper presents a novel approach to container orchestration...
```

### file-ops — Batch File Operations

Batch rename files, resize/convert images, generate favicon sets, and convert design tokens to CSS.

```bash
skillpack file-ops rename photos/ --pattern "{date}-{seq}-{name}"
skillpack file-ops images hero.png --to webp,avif --sizes "1x,2x,3x"
skillpack file-ops tokens design-tokens.json --out src/styles/tokens.css
```

**Output:**
```css
:root {
  --color-primary: #3B82F6;
  --spacing-md: 16px;
  --font-size-base: 16px;
}
```

### finance-extract — Financial Data Extraction

Extract and categorize data from bank statements, invoices, and receipts into structured reports.

```bash
skillpack finance-extract statement bank.pdf --bank chase --categorize
skillpack finance-extract invoice invoices/ --batch --out data.csv
skillpack finance-extract report receipts/ --period "2024-Q4"
```

**Output:**
```csv
date,description,amount,category
01/15/2024,STARBUCKS,4.95,meals
01/16/2024,AMAZON.COM,89.99,office
```

### people-ops — Resume & HR Automation

Parse resumes to structured JSON, generate job descriptions, create onboarding checklists.

```bash
skillpack people-ops resume candidate.pdf --format json
skillpack people-ops jd --role "Senior Engineer" --level senior
skillpack people-ops onboard --role "Frontend Dev" --start "2025-02-01"
```

**Output:**
```markdown
# Onboarding Checklist — Frontend Dev

**Start Date:** 2025-02-01

## Week 1: Getting Started

### Day 1 — First Day
- [ ] Welcome meeting with manager
- [ ] Team introductions
```

## Works with your AI CLI tool

| Tool | Support | Notes |
|------|---------|-------|
| Claude Code | ✅ Full | SKILL.md + MCP native |
| OpenCode | ✅ Full | Drop skills/ folder into config path |
| Codex CLI (OpenAI) | ✅ Full | index.sh scripts work standalone |
| Aider | ✅ Partial | Use as standalone scripts |
| Cursor | ✅ Partial | Run from terminal panel |
| Any terminal | ✅ Always | npm global install works everywhere |

## How it works

Each skill has two parts:

1. **SKILL.md** — AI context file that tells your AI CLI what the skill does, when to use it, and how to call it
2. **index.sh** — Standalone POSIX shell script that handles file I/O, argument parsing, and output formatting

```
User runs: skillpack doc-extract invoice.pdf --format json
                    │
                    ▼
          ┌─────────────────┐
          │  SKILL.md read   │  ← AI CLI reads context
          │  by AI model     │
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │  index.sh        │  ← Shell script executes
          │  executes        │    (pdftotext, awk, sed, jq)
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │  Output to       │  ← Structured data returned
          │  stdout/file     │
          └─────────────────┘
```

## FAQ

**Does this send my files to the cloud?**
No. All skills run locally on your machine. No data is sent anywhere unless you explicitly configure an external API.

**Does it require an API key?**
No. All skills work standalone without any API keys. Some AI-enhanced features (translation, smart replies) work better with an AI CLI tool.

**Can I use this without an AI CLI tool?**
Yes. Every skill's `index.sh` is a standalone POSIX shell script. Install with `npm install -g skillpack` or just clone the repo and run the scripts directly.

**How do I add my own skill?**
See [CONTRIBUTING.md](.github/CONTRIBUTING.md). The short version: create a directory with `SKILL.md` + `index.sh` + `README.md` following the existing patterns.

**Can I use only specific skills without installing everything?**
Yes. Each skill is independent. Clone the repo and use only the skills you need, or install globally and only call the ones you want.

## Contributing

See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for how to add a new skill. Adding a skill takes ~30 minutes if you follow the template.

## License

MIT

<!--
  Keywords: claude code skills, opencode skills, codex cli automation, ai terminal tools,
  pdf to markdown cli, csv automation, code scaffolding ai, infrastructure generator,
  content automation cli, batch file processing, invoice parser cli, resume parser,
  developer productivity tools, ai workflow automation, mcp skills, skillpack
-->
