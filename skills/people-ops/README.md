# people-ops

Parse resumes to structured JSON, generate job descriptions, create onboarding checklists.

## What it replaces

The old way: Open each resume PDF → manually copy name, email, skills into a spreadsheet → spend 3 hours formatting. Or: write job descriptions from scratch every time → forget key requirements → get wrong candidates. Or: create onboarding checklists from memory → miss critical steps.

**skillpack replaces all of that with one command.**

## Installation

```bash
# via curl (auto-installs dependencies)
curl -fsSL https://raw.githubusercontent.com/muhammad-saadd/skillpack/main/install.sh | bash

# or clone directly
git clone https://github.com/muhammad-saadd/skillpack ~/.local/share/skillpack
ln -s ~/.local/share/skillpack/bin/skillpack ~/.local/bin/skillpack
```

## Usage Examples

### Parse a resume to JSON
```bash
skillpack people-ops resume candidate.pdf --format json --out parsed-resume.json
```

**Output:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1 (555) 123-4567",
  "skills": ["JavaScript", "Python", "React", "Node.js"],
  "experience": [
    {
      "title": "Senior Developer at Acme Corp (2020-Present)",
      "description": "Led team of 5 engineers..."
    }
  ]
}
```

### Batch parse resumes
```bash
skillpack people-ops resume resumes/ --batch --out candidates.csv
```

### Generate a job description
```bash
skillpack people-ops jd --role "Senior Backend Engineer" --team "Payments" --level senior --stack "Go, PostgreSQL, Kubernetes"
```

**Output:**
```markdown
# Senior Backend Engineer

**Team:** Payments
**Level:** Senior
**Location:** On-site

## About the Role
We are looking for a senior Backend Engineer to join our Payments team...
```

### Generate onboarding checklist
```bash
skillpack people-ops onboard --role "Frontend Engineer" --start "2025-02-01" --out checklist.md
```

**Output:**
```markdown
# Onboarding Checklist — Frontend Engineer

**Start Date:** 2025-02-01

## Week 1: Getting Started

### Day 1 — First Day
- [ ] Welcome meeting with manager
- [ ] Team introductions
- [ ] Set up workstation and development environment
```

## Output Formats

| Format | Flag | Use case |
|--------|------|----------|
| JSON | `--format json` | APIs, databases |
| CSV | `--format csv` | Spreadsheets, ATS systems |
| Markdown | (default for jd/onboard) | Documentation |

## Why this beats the old way

- **Structured data** — no more copy-pasting into spreadsheets
- **Batch processing** — handle hundreds of resumes at once
- **Consistent JDs** — every job posting follows the same format
- **Complete onboarding** — never miss a critical step again
- **ATS-compatible** — CSV output works with applicant tracking systems
