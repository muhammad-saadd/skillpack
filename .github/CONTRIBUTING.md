# Contributing to skillpack

Thanks for your interest in contributing! This guide will help you add new skills or improve existing ones.

## Adding a New Skill

### 1. Create the skill directory

```
skills/
  your-skill-name/
    SKILL.md      # AI context file (required)
    index.js      # Implementation (required)
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

### 3. index.js interface

Every skill's `index.js` MUST:

- Be runnable as `node skills/your-skill/index.js [args]`
- Accept `--help`, `--dry-run`, `--out <dir>`, `--format <fmt>`
- Accept input as positional args (file path, glob, or stdin via `-`)
- Print progress to stderr, results to stdout (pipeable)
- Exit 0 on success, 1 on error with a clear message
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

## Testing Requirements

Every skill needs at least one test:
- Create a `test/` directory in the skill folder
- Add fixture files (sample inputs)
- Write tests using Node.js built-in `node:test`
- Tests should verify core functionality

## PR Checklist

- [ ] SKILL.md has valid frontmatter
- [ ] index.js handles `--help`, `--dry-run`, `--out`, `--format`
- [ ] README.md includes all required sections
- [ ] At least one test passes
- [ ] No secrets or API keys in code
- [ ] All files have proper `.gitignore` entries if needed

## Development Setup

```bash
git clone https://github.com/muhammad-saadd/skillpack.git
cd skillpack
npm install
skillpack --help
```

## Questions?

Open an issue at https://github.com/muhammad-saadd/skillpack/issues
