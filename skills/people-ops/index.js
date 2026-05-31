#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Papa = require('papaparse');

function parseArgs(argv) {
  const args = { subcommand: null, files: [], help: false, dryRun: false, out: null, format: 'json', batch: false, role: null, team: null, level: null, stack: null, remote: false, start: null };
  let i = 0;
  while (i < argv.length) {
    const a = argv[i];
    if (a === '--help' || a === '-h') { args.help = true; }
    else if (a === '--dry-run') { args.dryRun = true; }
    else if (a === '--batch') { args.batch = true; }
    else if (a === '--remote') { args.remote = true; }
    else if (a === '--out') { args.out = argv[++i]; }
    else if (a === '--format') { args.format = argv[++i]; }
    else if (a === '--role') { args.role = argv[++i]; }
    else if (a === '--team') { args.team = argv[++i]; }
    else if (a === '--level') { args.level = argv[++i]; }
    else if (a === '--stack') { args.stack = argv[++i]; }
    else if (a === '--start') { args.start = argv[++i]; }
    else if (!a.startsWith('-')) {
      if (!args.subcommand) args.subcommand = a;
      else args.files.push(a);
    }
    i++;
  }
  return args;
}

function printHelp() {
  console.log(`
skillpack people-ops — Resume parser, job descriptions, onboarding checklists

SUBCOMMANDS
  skillpack people-ops resume <file|dir> [--batch] [--format json|csv] [--out output]
  skillpack people-ops jd --role "Role" [--team "Team"] [--level junior|mid|senior] [--stack "tech"] [--remote]
  skillpack people-ops onboard --role "Role" [--start "2025-02-01"] [--out checklist.md]

OPTIONS
  --out <path>       Output file
  --format <fmt>     Output format: json, csv
  --batch            Process multiple files
  --dry-run          Preview output
  --help, -h         Show this help
`);
}

function parseResumeText(text) {
  const result = {
    name: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
    skills: [],
    experience: [],
    education: [],
    certifications: [],
  };

  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  if (emailMatch) result.email = emailMatch[0];

  const phoneMatch = text.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) result.phone = phoneMatch[0].trim();

  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length > 0) result.name = lines[0].trim();

  const skillsMatch = text.match(/(?:skills|technologies|tech\s*stack)[:\s]*([\s\S]*?)(?:\n\n|\n(?=experience|education|work|projects))/i);
  if (skillsMatch) {
    result.skills = skillsMatch[1].split(/[,\n•·]+/).map(s => s.trim()).filter(Boolean);
  }

  const expMatch = text.match(/(?:experience|work\s*experience|employment)[:\s]*([\s\S]*?)(?=education|skills|projects|$)/i);
  if (expMatch) {
    const expLines = expMatch[1].split('\n').filter(l => l.trim());
    let currentExp = null;
    for (const line of expLines) {
      if (/^(?:at|·|-|\d{4})/i.test(line) || /\d{4}\s*[-–]\s*(?:present|current|\d{4})/i.test(line)) {
        if (currentExp) result.experience.push(currentExp);
        currentExp = { title: line.trim(), company: '', period: '', description: '' };
      } else if (currentExp) {
        currentExp.description += line.trim() + ' ';
      }
    }
    if (currentExp) result.experience.push(currentExp);
  }

  const eduMatch = text.match(/(?:education|academic)[:\s]*([\s\S]*?)(?=skills|experience|projects|$)/i);
  if (eduMatch) {
    const eduLines = eduMatch[1].split('\n').filter(l => l.trim());
    for (const line of eduLines) {
      if (/bachelor|master|phd|degree|university|college|bs|ba|ms|ma/i.test(line)) {
        result.education.push({ degree: line.trim() });
      }
    }
  }

  const summaryMatch = text.match(/(?:summary|profile|about)[:\s]*([\s\S]*?)(?=\n\n|\nskills|\nexperience)/i);
  if (summaryMatch) result.summary = summaryMatch[1].trim();

  return result;
}

async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf') {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  } else if (ext === '.docx') {
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } else if (ext === '.txt') {
    return fs.readFileSync(filePath, 'utf-8');
  }
  throw new Error(`Unsupported file type: ${ext}`);
}

function generateJD(args) {
  const role = args.role || 'Software Engineer';
  const team = args.team || 'Engineering';
  const level = args.level || 'mid';
  const stack = args.stack || 'Node.js, React, PostgreSQL';
  const remote = args.remote;

  return `# ${role}

**Team:** ${team}
**Level:** ${level.charAt(0).toUpperCase() + level.slice(1)}
**Location:** ${remote ? 'Remote' : 'On-site'}

## About the Role

We are looking for a ${level} ${role} to join our ${team} team. You will work on building and maintaining scalable software solutions that impact thousands of users.

## Responsibilities

- Design and implement new features and improvements
- Write clean, maintainable, and well-tested code
- Collaborate with cross-functional teams to deliver high-quality products
- Participate in code reviews and provide constructive feedback
- Troubleshoot and debug production issues
- Contribute to technical documentation

## Requirements

- ${level === 'senior' ? '5+' : level === 'junior' ? '0-2' : '3-5'} years of experience in software development
- Proficiency in ${stack}
- Strong understanding of software engineering principles
- Experience with version control (Git)
- Excellent problem-solving and communication skills

## Nice to Have

- Experience with cloud platforms (AWS, GCP, Azure)
- Knowledge of CI/CD pipelines
- Contributed to open source projects
${remote ? '- Experience working in remote teams' : ''}

## Benefits

- Competitive salary and equity
- Health, dental, and vision insurance
- Flexible PTO
${remote ? '- Remote-friendly culture' : '- Modern office with latest equipment'}
- Professional development budget

---

*We are an equal opportunity employer and value diversity.*
`;
}

function generateOnboarding(role, startDate) {
  const start = startDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return `# Onboarding Checklist — ${role}

**Start Date:** ${start}

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
- [ ] Set up 1:1 meetings with manager

## Week 2: Deep Dive
- [ ] Review ${role}-specific documentation
- [ ] Complete onboarding project/task
- [ ] Attend all relevant team meetings
- [ ] Set up development tools and IDE
- [ ] Review deployment and release process

## Week 3: Integration
- [ ] Take on first real task/ticket
- [ ] Participate in code reviews
- [ ] Learn monitoring and alerting setup
- [ ] Review incident response process

## Week 4: Independence
- [ ] Complete first feature or significant task
- [ ] Provide feedback on onboarding experience
- [ ] Set initial 30-60-90 day goals with manager
- [ ] Schedule check-in with skip-level manager

## 30-Day Check-in
- [ ] Review progress with manager
- [ ] Discuss any blockers or concerns
- [ ] Adjust goals if needed

## 60-Day Check-in
- [ ] Demonstrate contributions so far
- [ ] Discuss career growth and development
- [ ] Set longer-term goals

## 90-Day Check-in
- [ ] Performance review with manager
- [ ] Discuss probation period completion
- [ ] Set quarterly objectives

---

*Welcome to the team! Don't hesitate to ask questions.*
`;
}

function writeOutput(content, args, filename) {
  if (args.dryRun) {
    process.stderr.write('[dry-run] Would write output:\n');
    process.stdout.write(typeof content === 'string' ? content : JSON.stringify(content, null, 2));
    return;
  }
  if (args.out) {
    fs.mkdirSync(path.dirname(args.out), { recursive: true });
    if (args.format === 'csv' || args.out.endsWith('.csv')) {
      const data = Array.isArray(content) ? content : [content];
      fs.writeFileSync(args.out, Papa.unparse(data));
    } else {
      fs.writeFileSync(args.out, typeof content === 'string' ? content : JSON.stringify(content, null, 2));
    }
    process.stderr.write(`Written to ${args.out}\n`);
  } else {
    const output = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    process.stdout.write(output + '\n');
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { printHelp(); process.exit(0); }
  if (!args.subcommand) { printHelp(); process.exit(0); }

  switch (args.subcommand) {
    case 'resume': {
      const files = [];
      for (const f of args.files) {
        const stat = fs.statSync(f);
        if (stat.isDirectory()) {
          const dirFiles = fs.readdirSync(f).filter(df => df.endsWith('.pdf') || df.endsWith('.docx') || df.endsWith('.txt'));
          files.push(...dirFiles.map(df => path.join(f, df)));
        } else {
          const glob = require('glob');
          const matches = glob.sync(f);
          files.push(...matches);
        }
      }

      if (files.length === 0) { console.error('Error: No resume files found.'); process.exit(1); }

      const resumes = [];
      for (const file of files) {
        if (!fs.existsSync(file)) { console.error(`Error: File not found: ${file}`); continue; }
        try {
          const text = await extractText(file);
          const parsed = parseResumeText(text);
          parsed._source_file = path.basename(file);
          resumes.push(parsed);
        } catch (err) {
          console.error(`Error parsing ${file}: ${err.message}`);
        }
      }

      const output = resumes.length === 1 ? resumes[0] : resumes;
      writeOutput(output, args, 'resumes.json');
      break;
    }
    case 'jd': {
      const jd = generateJD(args);
      writeOutput(jd, args, 'job-description.md');
      break;
    }
    case 'onboard': {
      const checklist = generateOnboarding(args.role || 'Engineer', args.start);
      writeOutput(checklist, args, 'onboarding-checklist.md');
      break;
    }
    default:
      console.error(`Error: Unknown subcommand "${args.subcommand}"`);
      process.exit(1);
  }
}

main();
