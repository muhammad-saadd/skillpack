---
name: people-ops
version: 1.0.0
description: Parse resumes to JSON, generate job descriptions, create onboarding checklists
inputs: [pdf, docx, json]
outputs: [json, csv, md]
tools: [bash, read_file, write_file, pdftotext, jq, awk, sed]
---

## What this skill does
Parses resume PDFs/DOCX into structured JSON (name, contact, skills, experience, education), generates job descriptions from role inputs, and creates onboarding checklists for new hires.

## Trigger phrases
- parse resume
- extract resume data
- convert resume to json
- generate job description
- create job posting
- onboarding checklist
- new hire checklist
- resume to structured data
- batch parse resumes
- create jd from role
- hiring checklist
- onboarding plan
- resume parser

## Usage
```bash
skillpack people-ops resume candidate.pdf --format json --out parsed-resume.json
skillpack people-ops resume resumes/ --batch --out candidates.csv
skillpack people-ops jd --role "Senior Backend Engineer" --team "Payments" --level senior
skillpack people-ops jd --role "Product Designer" --stack "Figma, React" --remote
skillpack people-ops onboard --role "Frontend Engineer" --start "2025-02-01" --out checklist.md
```

## Steps
1. Parse subcommand (resume, jd, onboard)
2. For resume: extract text from PDF/DOCX, parse into structured fields
3. For jd: generate job description from role parameters
4. For onboard: generate onboarding checklist for the specified role
5. Format output and write to --out or stdout

## Output
Structured resume data (JSON/CSV), job description (markdown), or onboarding checklist (markdown).
