#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = { subcommand: null, files: [], help: false, dryRun: false, out: null, fix: false, lang: 'en', to: null, style: 'executive', length: 'medium', intent: null, format: 'markdown' };
  let i = 0;
  while (i < argv.length) {
    const a = argv[i];
    if (a === '--help' || a === '-h') { args.help = true; }
    else if (a === '--dry-run') { args.dryRun = true; }
    else if (a === '--fix') { args.fix = true; }
    else if (a === '--lang') { args.lang = argv[++i]; }
    else if (a === '--to') { args.to = argv[++i]; }
    else if (a === '--style') { args.style = argv[++i]; }
    else if (a === '--length') { args.length = argv[++i]; }
    else if (a === '--intent') { args.intent = argv[++i]; }
    else if (a === '--format') { args.format = argv[++i]; }
    else if (a === '--out') { args.out = argv[++i]; }
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
skillpack content-craft — Proofread, translate, summarize, and repurpose content

SUBCOMMANDS
  skillpack content-craft proofread <files...> [--fix] [--lang en]
  skillpack content-craft translate <file> --to es,fr,ar [--out ./i18n/]
  skillpack content-craft summarize <file> [--style executive] [--length short|medium|long]
  skillpack content-craft repurpose <file> --to "twitter,linkedin,newsletter"
  skillpack content-craft actions <file> [--out actions.md]
  skillpack content-craft brief <dir> [--format markdown] [--length 500]
  skillpack content-craft reply <file> --intent "your intent"

OPTIONS
  --out <path>       Output file or directory
  --fix              Fix issues in place (proofread)
  --dry-run          Preview output
  --help, -h         Show this help
`);
}

function proofread(text, fix) {
  const issues = [];
  const rules = [
    { pattern: /\bteh\b/gi, msg: 'Possible typo: "teh" → "the"', fix: 'the' },
    { pattern: /\brecieve\b/gi, msg: 'Spelling: "recieve" → "receive"', fix: 'receive' },
    { pattern: /\boccured\b/gi, msg: 'Spelling: "occured" → "occurred"', fix: 'occurred' },
    { pattern: /\bseperate\b/gi, msg: 'Spelling: "seperate" → "separate"', fix: 'separate' },
    { pattern: /\bdefinately\b/gi, msg: 'Spelling: "definately" → "definitely"', fix: 'definitely' },
    { pattern: /\bmore\s+important\s+than\b/gi, msg: 'Style: Consider "more important than" (adjective form)', fix: null },
    { pattern: /\bi\s+/g, msg: 'Style: Capitalize "I"', fix: 'I ' },
    { pattern: /\s{2,}/g, msg: 'Extra whitespace', fix: ' ' },
    { pattern: /[.!?,;:]\S/g, (match) => `Missing space after punctuation: "${match}"`, fix: null },
  ];

  let result = text;
  for (const rule of rules) {
    const matches = result.matchAll(rule.pattern);
    for (const match of matches) {
      issues.push({ line: result.substring(0, match.index).split('\n').length, message: typeof rule.msg === 'function' ? rule.msg(match[0]) : rule.msg, fix: rule.fix });
      if (fix && rule.fix) {
        result = result.replace(rule.pattern, rule.fix);
      }
    }
  }

  return { issues, result };
}

function summarize(text, style, length) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const maxSentences = length === 'short' ? 3 : length === 'long' ? 10 : 5;

  const scored = sentences.map(s => ({
    text: s.trim(),
    score: s.split(' ').reduce((acc, word) => {
      if (word.length > 5) acc += 2;
      if (/^[A-Z]/.test(word)) acc += 1;
      if (/\b(key|important|main|primary|result|conclusion|finding)\b/i.test(word)) acc += 3;
      return acc;
    }, 0)
  }));

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, maxSentences);

  if (style === 'executive') {
    return `## Executive Summary\n\n${top.map(s => s.text + '.').join('\n\n')}`;
  }
  return top.map(s => s.text + '.').join('\n\n');
}

function extractActions(text) {
  const actionPatterns = [
    /(?:TODO|ACTION|FOLLOW[- ]?UP|TASK):\s*(.+)/gi,
    /(?:need to|should|must|have to|will)\s+(.+?)(?:\.|,|$)/gi,
    /\[(?:\s*[- ]*\s*)\]\s*(.+)/gi,
    /- \[ \]\s*(.+)/gi,
  ];

  const actions = new Set();
  for (const pattern of actionPatterns) {
    for (const match of text.matchAll(pattern)) {
      actions.add(match[1].trim());
    }
  }

  return Array.from(actions).map((a, i) => `${i + 1}. ${a}`).join('\n');
}

function createBrief(text, length) {
  const words = text.split(/\s+/);
  const maxWords = parseInt(length) || 500;
  const keyPhrases = text.match(/\b[A-Z][a-z]+ (?:[A-Z][a-z]+ )*(?:is|are|was|were|has|have|will|can|should)\b/g) || [];

  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const brief = sentences.slice(0, Math.ceil(maxWords / 20)).join('. ');

  return `# Executive Brief\n\n${brief}\n\n---\n*Key themes: ${keyPhrases.slice(0, 5).join(', ') || 'N/A'}*`;
}

function repurpose(text, targets) {
  const targetList = targets.split(',').map(t => t.trim().toLowerCase());
  const results = {};

  for (const target of targetList) {
    switch (target) {
      case 'twitter':
      case 'thread': {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
        const thread = sentences.slice(0, 5).map((s, i) => `${i + 1}/ ${s.trim()}.`).join('\n\n');
        results.twitter = thread;
        break;
      }
      case 'linkedin': {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
        results.linkedin = `${sentences[0]?.trim()}.\n\n${sentences.slice(1, 4).map(s => s.trim() + '.').join('\n\n')}\n\nWhat are your thoughts?`;
        break;
      }
      case 'newsletter': {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
        results.newsletter = `## ${sentences[0]?.trim()}\n\n${sentences.slice(1, 8).map(s => s.trim() + '.').join('\n\n')}`;
        break;
      }
      default:
        results[target] = `[Repurposing to ${target} requires AI CLI. Use with Claude Code/OpenCode.]`;
    }
  }

  return results;
}

function draftReply(text, intent) {
  return `[Draft reply requires AI CLI. Use with Claude Code/OpenCode for intelligent reply generation.]\n\nIntent: ${intent}\n\nOriginal thread excerpt:\n${text.substring(0, 500)}...`;
}

function writeOutput(content, args, filename) {
  if (args.dryRun) {
    process.stderr.write('[dry-run] Would write output:\n');
    process.stdout.write(content);
    return;
  }
  if (args.out) {
    fs.mkdirSync(path.dirname(args.out), { recursive: true });
    fs.writeFileSync(args.out, content);
    process.stderr.write(`Written to ${args.out}\n`);
  } else {
    process.stdout.write(content);
  }
}

function readFileContent(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf') {
    return `[PDF content requires parsing. Use skillpack doc-extract to convert ${filePath} to text first.]`;
  }
  return fs.readFileSync(filePath, 'utf-8');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { printHelp(); process.exit(0); }
  if (!args.subcommand) { printHelp(); process.exit(0); }

  const file = args.files[0];
  if (file && !fs.existsSync(file)) { console.error(`Error: File not found: ${file}`); process.exit(1); }

  switch (args.subcommand) {
    case 'proofread': {
      const text = file ? readFileContent(file) : '';
      const { issues, result } = proofread(text, args.fix);
      if (issues.length === 0) {
        process.stderr.write('No issues found.\n');
      } else {
        process.stderr.write(`Found ${issues.length} issues:\n`);
        for (const issue of issues) {
          process.stderr.write(`  Line ${issue.line}: ${issue.message}${issue.fix ? ` → "${issue.fix}"` : ''}\n`);
        }
      }
      writeOutput(args.fix ? result : text, args, file ? path.basename(file) : 'output.txt');
      break;
    }
    case 'translate': {
      const content = file ? readFileContent(file) : '';
      const output = `[Translation requires AI CLI. Use with Claude Code/OpenCode.]\n\nTo translate to: ${args.to}\n\n${content}`;
      writeOutput(output, args, file ? `translated-${path.basename(file)}` : 'translated.txt');
      break;
    }
    case 'summarize': {
      const text = file ? readFileContent(file) : '';
      const summary = summarize(text, args.style, args.length);
      writeOutput(summary, args, file ? `summary-${path.basename(file)}` : 'summary.txt');
      break;
    }
    case 'repurpose': {
      const text = file ? readFileContent(file) : '';
      const results = repurpose(text, args.to || 'twitter');
      const output = Object.entries(results).map(([k, v]) => `## ${k.charAt(0).toUpperCase() + k.slice(1)}\n\n${v}`).join('\n\n---\n\n');
      writeOutput(output, args, file ? `repurposed-${path.basename(file)}` : 'repurposed.txt');
      break;
    }
    case 'actions': {
      const text = file ? readFileContent(file) : '';
      const actions = extractActions(text);
      writeOutput(actions || 'No action items found.', args, 'actions.md');
      break;
    }
    case 'brief': {
      const dir = file || '.';
      let text = '';
      if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.md') || f.endsWith('.txt'));
        text = files.map(f => fs.readFileSync(path.join(dir, f), 'utf-8')).join('\n\n');
      } else {
        text = readFileContent(dir);
      }
      const brief = createBrief(text, args.length);
      writeOutput(brief, args, 'brief.md');
      break;
    }
    case 'reply': {
      const text = file ? readFileContent(file) : '';
      const reply = draftReply(text, args.intent || 'respond appropriately');
      writeOutput(reply, args, 'reply.txt');
      break;
    }
    default:
      console.error(`Error: Unknown subcommand "${args.subcommand}"`);
      process.exit(1);
  }
}

main();
