<!--
SEO KEYWORDS (hidden):
claude code skills, opencode skills, codex cli, mcp skills, ai agent skills,
ai terminal tools, pdf to markdown cli, pdf to json, csv to json cli,
batch file rename, code scaffolding cli, infrastructure as code generator,
kubernetes manifest generator, terraform generator, resume parser cli,
invoice parser, bank statement parser, design tokens to css, favicon generator,
image optimization cli, content summarization, ai workflow automation,
developer productivity tools, posix shell, no node dependencies,
muhammad saad, skillpack
-->

<div align="center">

# ⚡ skillpack

### One command replaces an afternoon of clicking

**AI-powered terminal skills that turn multi-click professional workflows into a single command.**

Extract data from PDFs · Wrangle CSVs · Scaffold code · Generate infrastructure configs ·
Process content · Batch-rename files · Parse invoices · Manage resumes

Works with **Claude Code**, **OpenCode**, **Codex CLI**, and any MCP-compatible AI agent.

<br />

[![version](https://img.shields.io/badge/version-1.0.3-blue.svg)](https://github.com/muhammad-saadd/skillpack/releases)
[![license](https://img.shields.io/github/license/muhammad-saadd/skillpack.svg)](./LICENSE)
[![CI](https://img.shields.io/badge/CI-passing-brightgreen.svg)](https://github.com/muhammad-saadd/skillpack/actions)
[![shell](https://img.shields.io/badge/shell-POSIX--compliant-success.svg)](https://pubs.opengroup.org/onlinepubs/9699919799/)
[![node](https://img.shields.io/badge/node-not_required-lightgrey.svg)](#-zero-dependencies)
[![platforms](https://img.shields.io/badge/platforms-linux%20%7C%20macOS%20%7C%20WSL-blue.svg)](#-cross-platform)
[![downloads](https://img.shields.io/github/stars/muhammad-saadd/skillpack?style=social)](https://github.com/muhammad-saadd/skillpack/stargazers)

<br />

```bash
curl -fsSL https://raw.githubusercontent.com/muhammad-saadd/skillpack/main/install.sh | bash
```

<br />

[Features](#-what-it-does) ·
[Install](#-install-in-30-seconds) ·
[Quickstart](#-60-second-quickstart) ·
[Skills](#-the-8-skills) ·
[How it Works](#-how-it-works) ·
[Contributing](#-contributing)

</div>

---

## 🎯 What it does

`skillpack` is a curated collection of **8 battle-tested terminal skills** that automate the boring, repetitive, click-heavy tasks that fill a professional's day. Each skill is a tiny POSIX shell script — no Node.js, no Python, no Docker — just `awk`, `sed`, `jq`, and a handful of system tools.

Every skill ships as two files:

| File | Purpose |
|------|---------|
| `SKILL.md` | A machine-readable context file your AI CLI reads to understand **what the skill does, when to trigger it, and how to call it**. |
| `index.sh` | A standalone POSIX shell script that does the actual work — file I/O, parsing, transformation, output. Runs with or without an AI agent. |

This means the same skill works **three ways**:
1. **Standalone** — `skillpack doc-extract invoice.pdf` from any terminal.
2. **AI-driven** — Claude Code / OpenCode / Codex reads the `SKILL.md`, understands intent, and calls `index.sh` for you.
3. **Piped** — `cat invoice.pdf | skillpack doc-extract --format json` from a shell pipeline.

---

## 💡 The problem

Every professional task requires **context switching between 5+ apps**. A single invoice processing workflow might look like:

> Adobe Acrobat → Excel → Google Sheets → email → Slack

That's **45 minutes of clicking** for something a terminal can do in **5 seconds**.

| Task | Old way | With skillpack |
|------|---------|----------------|
| Parse 50 invoices | Open each PDF → copy data → paste into Excel (**2 hours**) | `skillpack finance-extract invoice invoices/ --batch` |
| Convert CSV to JSON | Open in Excel → Save As → fix formatting (**15 min**) | `skillpack data-wrangle data.csv --to json` |
| Generate K8s from Compose | Google "docker-compose to k8s" → copy-paste YAML (**1 hour**) | `skillpack infra-gen k8s docker-compose.yml` |
| Rename 200 photos | Right-click each → Rename → type new name (**45 min**) | `skillpack file-ops rename photos/ --pattern "{date}-{seq}-{name}"` |
| Parse resumes for hiring | Open each PDF → copy info → build spreadsheet (**3 hours**) | `skillpack people-ops resume resumes/ --batch` |
| Generate favicon set from logo | Open Sketch/Figma → export 6 sizes (**20 min**) | `skillpack file-ops favicon logo.svg --out public/` |
| Summarize a 50-page paper | Read the whole thing (**90 min**) | `skillpack content-craft summarize paper.pdf --style executive` |
| Create a job description | Open Google Docs → write from scratch (**30 min**) | `skillpack people-ops jd --role "Senior Engineer"` |

---

## 📦 Install in 30 seconds

### Option 1 — curl installer (recommended)

The curl installer auto-detects your package manager and installs both `skillpack` and its system dependencies:

```bash
curl -fsSL https://raw.githubusercontent.com/muhammad-saadd/skillpack/main/install.sh | bash
```

It handles: `apt` (Debian/Ubuntu) · `dnf`/`yum` (Fedora/RHEL) · `pacman` (Arch) · `brew` (macOS) · `apk` (Alpine).

### Option 2 — clone + symlink

If you prefer to install the system tools yourself first:

```bash
# 1. Install system dependencies (pick your platform)
sudo apt install -y poppler-utils jq imagemagick docx2txt   # Debian/Ubuntu
brew install poppler jq imagemagick pandoc                 # macOS

# 2. Clone and symlink
git clone https://github.com/muhammad-saadd/skillpack.git ~/.local/share/skillpack
ln -s ~/.local/share/skillpack/bin/skillpack ~/.local/bin/skillpack

# 3. Make sure ~/.local/bin is on your PATH
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc   # or ~/.bashrc
```

### Option 3 — install via npm

```bash
npm install -g @muhammad-saadd/skillpack
```

### Verify

```bash
skillpack --version          # → skillpack v1.0.3
skillpack --help             # → lists all 8 skills
```

---

## ⚡ 60-second quickstart

```bash
# 1. Extract text from a PDF
skillpack doc-extract report.pdf --format markdown

# 2. Clean and deduplicate a CSV, then convert to JSON
skillpack data-wrangle sales.csv --clean --dedup --to json

# 3. Generate a favicon set from a logo
skillpack file-ops favicon logo.svg --out public/

# 4. Turn a docker-compose.yml into a Kubernetes manifest
skillpack infra-gen k8s docker-compose.yml --namespace production

# 5. Summarize a long paper
skillpack content-craft summarize paper.pdf --style executive
```

---

## 🧰 The 8 skills

### 1. `doc-extract` — Document data extraction

**What it does, step by step:**
1. Detects the input file type (PDF, DOCX, PNG, JPG, TIFF) from extension + magic bytes.
2. Routes to the right parser (`pdftotext` for PDFs, `docx2txt`/`pandoc` for DOCX, OCR for images).
3. If `--ocr` is set and the file is a scanned image, runs OCR text extraction.
4. If `--schema` is specified (e.g. `invoice`, `resume`, `contract`), applies a structured template.
5. If `--extract` is specified, returns only the requested elements (tables, clauses, metadata).
6. Formats output as `markdown`, `csv`, `json`, or `txt`.
7. Writes to `--out <dir>` or prints to stdout.

```bash
skillpack doc-extract invoice.pdf --format json --schema invoice
skillpack doc-extract resume.pdf --format json --schema resume
skillpack doc-extract *.pdf --format csv --out ./extracted/
skillpack doc-extract scanned.pdf --ocr --format markdown
```

**Output:**
```json
{ "vendor": "Acme Corp", "invoice_number": "INV-2024-001", "total": 542.50 }
```

---

### 2. `data-wrangle` — CSV / JSON / XLSX automation

**What it does, step by step:**
1. Detects input format (`.csv`, `.tsv`, `.json`, `.xlsx`).
2. Normalizes encoding (fixes UTF-8 mojibake, BOM, line endings).
3. Trims whitespace, normalizes date formats, infers column types.
4. Applies requested transforms: `--clean` → trim/normalize · `--dedup` → drop duplicates · `--merge` → join on key · `--validate` → schema check.
5. Optionally converts to a different format (`--to json|csv|tsv|sql`).
6. Optionally generates SQL from a natural-language description (`--sql "total revenue by region"`).
7. Writes to `--out` or stdout.

```bash
skillpack data-wrangle sales.csv --clean --fix-encoding --dedup
skillpack data-wrangle jan.csv feb.csv --merge --key "order_id"
skillpack data-wrangle "total revenue by region from sales.csv" --sql
```

**Output:**
```sql
SELECT SUM(revenue) FROM sales GROUP BY region;
```

---

### 3. `code-scaffold` — Project & code generation

**What it does, step by step:**
1. Parses the subcommand: `--new <name>` (project), `<file>` (test gen), or template (README, .env.example, etc.).
2. For `--new`: detects/uses `--stack` flag (e.g. `node express typescript`) and generates the full directory tree.
3. For test generation: reads the source file, detects function signatures, emits a test file in the chosen framework.
4. For template generation: writes a best-practice `README.md`, `.env.example`, API docs, `CHANGELOG.md`, or TypeScript types from JSON.
5. Skips files that already exist (unless `--force` is set).
6. Prints a summary of what was created.

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

---

### 4. `infra-gen` — Infrastructure as code

**What it does, step by step:**
1. Detects the subcommand: `k8s`, `ci`, `nginx`, `apache`, `terraform`.
2. For `k8s <compose-file>`: parses `docker-compose.yml`, maps services → Deployments, volumes → PVCs, ports → Services, env → ConfigMaps.
3. For `ci <dir>`: scans the project root for language markers (package.json, requirements.txt, go.mod, etc.) and generates a working CI pipeline.
4. For `terraform "<description>"`: emits a Terraform skeleton for the described architecture.
5. Applies the requested namespace, environment, or provider flags.
6. Writes one or more files to `--out` and prints what was generated.

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

---

### 5. `content-craft` — Content processing

**What it does, step by step:**
1. Accepts a file, a directory of files, or stdin.
2. Routes to the requested action: `proofread`, `summarize`, `translate`, `repurpose`, `actions`, `reply`.
3. For summarization, applies the chosen `--style` (`executive`, `bullet`, `eli5`, `tldr`).
4. For proofing, optionally applies fixes in place (`--fix`) or returns a diff.
5. For action-item extraction, scans meeting notes and emits a checkbox-style task list.
6. Writes the result to `--out` or stdout.

```bash
skillpack content-craft proofread docs/ --fix
skillpack content-craft summarize paper.pdf --style executive
skillpack content-craft actions meeting-notes.md --out actions.md
```

**Output:**
```markdown
## Executive Summary

This paper presents a novel approach to container orchestration…
```

---

### 6. `file-ops` — Batch file operations

**What it does, step by step:**
1. Accepts a subcommand: `rename`, `images`, `favicon`, `tokens`.
2. For `rename <dir> --pattern <tmpl>`: walks the directory, supports pattern tokens (`{date}`, `{seq}`, `{name}`, `{ext}`, counter padding).
3. For `images <file>`: converts to requested formats (`webp`, `avif`, `jpg`, `png`) and generates responsive sizes (`1x, 2x, 3x`).
4. For `favicon <logo.svg>`: emits a full favicon set (16, 32, 48, 64, 128, 192, 512) plus `manifest.json` and `apple-touch-icon`.
5. For `tokens <tokens.json>`: converts a design-token JSON into a ready-to-import CSS `:root { --… }` block.
6. Shows a dry-run by default; `--apply` to commit changes.

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

---

### 7. `finance-extract` — Financial data extraction

**What it does, step by step:**
1. Detects the financial document type: bank statement, invoice, or receipt.
2. Optionally uses `--bank` (chase, wells, hsbc, etc.) for parser-tuned extraction.
3. Extracts transactions, line items, totals, and metadata.
4. Applies `--categorize` to label each transaction (`meals`, `travel`, `office`, `software`, etc.).
5. Aggregates by `--period` (`2024-Q4`, `2025-01`, `last-month`, etc.) when requested.
6. Emits a CSV, JSON, or human-readable report.

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

---

### 8. `people-ops` — Resume & HR automation

**What it does, step by step:**
1. Accepts a subcommand: `resume`, `jd`, `onboard`.
2. For `resume <file>`: parses the PDF/DOCX into a structured JSON (`name`, `email`, `experience`, `education`, `skills`).
3. Supports batch mode: `resume resumes/*.pdf` builds a candidate spreadsheet.
4. For `jd --role "X" --level Y`: generates a complete job description with responsibilities, requirements, and interview questions.
5. For `onboard --role "X" --start YYYY-MM-DD`: builds a role-specific week-by-week onboarding checklist.
6. Writes JSON / Markdown to `--out` or stdout.

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

---

## 🤝 Works with your AI CLI tool

| Tool | Support | Notes |
|------|---------|-------|
| **Claude Code** | ✅ Full | `SKILL.md` + MCP native — drop `skills/` into your Claude config |
| **OpenCode** | ✅ Full | Drop `skills/` folder into your OpenCode config path |
| **Codex CLI** (OpenAI) | ✅ Full | `index.sh` scripts run standalone |
| **Aider** | ✅ Partial | Use as standalone scripts |
| **Cursor** | ✅ Partial | Run from the integrated terminal panel |
| **Any terminal** | ✅ Always | `curl` / clone install works everywhere |

---

## 🏗️ How it works

Each skill has two parts: a **machine-readable context file** (`SKILL.md`) and a **standalone shell script** (`index.sh`).

```
        You:  "Extract the invoice total from this PDF"
                                    │
                                    ▼
                  ┌──────────────────────────────────┐
                  │  AI CLI (Claude / OpenCode / …)  │
                  │  reads SKILL.md for context      │
                  └─────────────┬────────────────────┘
                                │
                                ▼
                  ┌──────────────────────────────────┐
                  │  AI calls: skillpack doc-extract │
                  │  invoice.pdf --format json       │
                  └─────────────┬────────────────────┘
                                │
                                ▼
                  ┌──────────────────────────────────┐
                  │  index.sh executes               │
                  │  (pdftotext → awk → sed → jq)    │
                  └─────────────┬────────────────────┘
                                │
                                ▼
                  ┌──────────────────────────────────┐
                  │  Structured output to stdout /   │
                  │  --out directory                 │
                  └──────────────────────────────────┘
```

**The whole pipeline is local.** No cloud calls, no telemetry, no API keys required for any skill.

---

## 🪶 Zero dependencies

- **No `node_modules`.** No `pip install`. No Docker.
- **Pure POSIX shell** — runs on any Linux, macOS, or WSL system out of the box.
- **Optional system tools** for full feature coverage: `pdftotext`, `jq`, `imagemagick`, `docx2txt`/`pandoc`. The curl installer adds them automatically.
- **No API keys** needed for any skill. AI CLI features (smart replies, better summaries) work *better* with an AI tool, but everything runs standalone.

---

## ❓ FAQ

**Does this send my files to the cloud?**
No. Every skill runs 100% locally. No data leaves your machine unless you wire up an external API yourself.

**Does it require an API key?**
No. All 8 skills work standalone. The skills become *smarter* when an AI CLI is connected (e.g. Claude Code reads `SKILL.md` for context), but none of them require it.

**Can I use it without an AI CLI tool?**
Yes. Every `index.sh` is a standalone POSIX shell script. You can install via `curl` and use only the CLI, or clone the repo and run any skill directly.

**How do I add my own skill?**
See [CONTRIBUTING.md](.github/CONTRIBUTING.md). The short version: create a folder under `skills/` with three files — `SKILL.md`, `index.sh`, `README.md` — following the existing patterns. Most skills take ~30 minutes to add.

**Can I install only specific skills?**
Yes. Each skill is independent. Clone the repo and copy only the skill folders you need into your own `skills/` directory, or install globally and call only the ones you want.

**Does it work on Windows?**
Yes via WSL. Native Windows support is on the roadmap — the scripts are POSIX-clean and most of them work under Git Bash, but WSL is the recommended path.

**How is this different from a Claude skill, an OpenCode skill, etc.?**
Most AI CLI skills are **prompts** — they tell the model what to do. `skillpack` skills are **prompts + execution** — the `index.sh` does the real work, so results are deterministic, fast, and reproducible. The AI only decides *what* to do; the shell does *how*.

---

## 🗺️ Roadmap

- [ ] Native Windows support (PowerShell wrappers)
- [ ] More skills: `git-ops`, `docker-debug`, `log-analyze`, `sql-migrate`
- [ ] Pluggable schema registry for `doc-extract`
- [ ] Interactive `skillpack init` wizard
- [ ] Skill marketplace (community-contributed skills)

Have an idea? [Open an issue](https://github.com/muhammad-saadd/skillpack/issues/new).

---

## 🤝 Contributing

We love contributions! Adding a new skill takes about **30 minutes** if you follow the template.

1. Read [CONTRIBUTING.md](.github/CONTRIBUTING.md).
2. Create `skills/<your-skill>/` with `SKILL.md`, `index.sh`, `README.md`.
3. Make sure `bash -n skills/<your-skill>/index.sh` passes (no syntax errors).
4. Open a PR.

See existing skills (e.g. [`skills/doc-extract/`](skills/doc-extract/)) for the canonical structure.

---

## 📝 License

[MIT](./LICENSE) © 2026 [Muhammad Saad](https://github.com/muhammad-saadd)

---

## ⭐ Show your support

If `skillpack` saved you an afternoon of clicking, consider giving it a ⭐ on GitHub — it helps other developers find it.

<br />

<div align="center">

**Built with ⚡ by [Muhammad Saad](https://github.com/muhammad-saadd) — because life is too short for multi-click workflows.**

</div>
