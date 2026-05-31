# Contributing to skillpack

Thanks for your interest in contributing! This guide will help you add new skills or improve existing ones.

## Adding a New Skill

### 1. Create the skill directory

```
skills/
  your-skill-name/
    SKILL.md      # AI context file (required)
    index.sh      # POSIX shell implementation (required)
    README.md     # Documentation (required)
```

### 2. SKILL.md contract

Every skill MUST have a `SKILL.md` with this frontmatter:

```markdown
---
name: your-skill-name
version: 1.0.0
description: One line description under 120 chars
inputs: [list of input types]
outputs: [list of output formats]
tools: [bash, read_file, write_file]
---
```

Follow with sections: What this skill does, Trigger phrases (10-15), Usage examples, Steps, Output.

### 3. index.sh interface

Every skill's `index.sh` MUST:

- Start with `#!/bin/sh` and `set -e`
- Be runnable as `skills/your-skill/index.sh [args]`
- Accept `--help`, `--dry-run`, `--out <dir>`, `--format <fmt>`
- Accept input as positional args (file path, glob)
- Print progress to stderr, results to stdout (pipeable)
- Exit 0 on success, 1 on error with a clear message
- Use only POSIX shell + standard Unix tools (awk, sed, grep, jq, etc.)
- Handle errors gracefully with actionable messages

### 4. README.md template

Each skill README must include:
- What it does (2 sentences)
- What it replaces (the old painful way)
- Installation
- 5+ usage examples with real flags
- Output sample
- "Why this beats the old way" section

## Naming Conventions

- Skill names: `lowercase-with-hyphens` (e.g., `doc-extract`, `data-wrangle`)
- Directory names match skill names exactly
- SKILL.md `name` field matches directory name

## External Tool Requirements

Some skills require external tools. List them in your skill's README:

| Tool | Required by | Install |
|------|-------------|---------|
| `pdftotext` | doc-extract, finance-extract | `sudo apt install poppler-utils` |
| `jq` | data-wrangle, file-ops | `sudo apt install jq` |
| `imagemagick` | file-ops | `sudo apt install imagemagick` |
| `docx2txt` or `pandoc` | doc-extract, people-ops | `sudo apt install docx2txt` |

## Testing Requirements

Every skill needs at least one test:
- Create a `test/` directory in the skill folder
- Add fixture files (sample inputs)
- Write a test script that exercises the skill
- Tests should verify core functionality

## PR Checklist

- [ ] SKILL.md has valid frontmatter
- [ ] index.sh starts with `#!/bin/sh` and `set -e`
- [ ] index.sh handles `--help`, `--dry-run`, `--out`, `--format`
- [ ] README.md includes all required sections
- [ ] External tool dependencies are documented
- [ ] No secrets or API keys in code

## Development Setup

```bash
git clone https://github.com/muhammad-saadd/skillpack.git
cd skillpack
./bin/skillpack --help
```

## Questions?

Open an issue at https://github.com/muhammad-saadd/skillpack/issues
