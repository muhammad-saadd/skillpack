#!/usr/bin/env node

'use strict';

const path = require('path');
const fs = require('fs');

const SKILLS_DIR = path.join(__dirname, '..', 'skills');

const SKILL_META = {
  'doc-extract':    { category: 'Documents',      desc: 'PDF/DOCX/image → markdown, CSV, JSON, plain text' },
  'data-wrangle':   { category: 'Data',            desc: 'Clean, convert, merge, validate CSV/JSON/XLSX; SQL from English' },
  'code-scaffold':  { category: 'Development',     desc: 'Tests, README, .env.example, API docs, changelog, TS types' },
  'infra-gen':      { category: 'Infrastructure',  desc: 'k8s manifests, CI/CD YAML, nginx config, Terraform from plain English' },
  'content-craft':  { category: 'Content & Writing', desc: 'Proofread, translate, summarize, blog→social, notes→brief' },
  'file-ops':       { category: 'Files & Assets',  desc: 'Batch rename, image resize/convert, favicon sets, design tokens→CSS' },
  'finance-extract':{ category: 'Finance',         desc: 'Bank statements, invoices, expense reports → structured data' },
  'people-ops':     { category: 'People & HR',     desc: 'Resume→JSON, job descriptions, onboarding checklists' },
};

const VERSION = '1.0.0';

function printHelp() {
  const lines = [
    '',
    '\x1b[33m⚡ skillpack — AI-powered terminal skills\x1b[0m',
    '',
    '\x1b[1mUSAGE\x1b[0m',
    '  skillpack <skill> [options] [input]',
    '',
    '\x1b[1mSKILLS\x1b[0m',
  ];

  const categories = {};
  for (const [name, meta] of Object.entries(SKILL_META)) {
    if (!categories[meta.category]) categories[meta.category] = [];
    categories[meta.category].push({ name, desc: meta.desc });
  }

  for (const [cat, skills] of Object.entries(categories)) {
    lines.push(`  \x1b[36m${cat}\x1b[0m`);
    for (const s of skills) {
      lines.push(`    ${s.name.padEnd(17)}${s.desc}`);
    }
    lines.push('');
  }

  lines.push('\x1b[1mFLAGS\x1b[0m');
  lines.push('  --help, -h       Show help for a skill');
  lines.push('  --version, -v    Print version');
  lines.push('  --dry-run        Preview output without writing files');
  lines.push('  --out <dir>      Output directory (default: current dir)');
  lines.push('  --format <fmt>   Output format: markdown | csv | json | txt (skill-dependent)');
  lines.push('');

  console.log(lines.join('\n'));
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printHelp();
    process.exit(0);
  }

  if (args.includes('--version') || args.includes('-v')) {
    console.log(`skillpack v${VERSION}`);
    process.exit(0);
  }

  const skillName = args[0];
  const skillDir = path.join(SKILLS_DIR, skillName);
  const skillFile = path.join(skillDir, 'index.js');

  if (!fs.existsSync(skillDir) || !fs.existsSync(skillFile)) {
    console.error(`\x1b[31mError: Unknown skill "${skillName}"\x1b[0m`);
    console.error(`Run \x1b[33mskillpack --help\x1b[0m to see available skills.`);
    process.exit(1);
  }

  // Pass remaining args to the skill
  process.argv = [process.argv[0], process.argv[1], ...args.slice(1)];

  try {
    require(skillFile);
  } catch (err) {
    console.error(`\x1b[31mError in skill "${skillName}": ${err.message}\x1b[0m`);
    process.exit(1);
  }
}

main();
