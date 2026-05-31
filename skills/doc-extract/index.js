#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

function parseArgs(argv) {
  const args = { files: [], help: false, dryRun: false, format: 'markdown', out: null, ocr: false, schema: null, extract: null, flag: null };
  let i = 0;
  while (i < argv.length) {
    const a = argv[i];
    if (a === '--help' || a === '-h') { args.help = true; }
    else if (a === '--dry-run') { args.dryRun = true; }
    else if (a === '--ocr') { args.ocr = true; }
    else if (a === '--format') { args.format = argv[++i] || 'markdown'; }
    else if (a === '--out') { args.out = argv[++i]; }
    else if (a === '--schema') { args.schema = argv[++i]; }
    else if (a === '--extract') { args.extract = argv[++i]; }
    else if (a === '--flag') { args.flag = argv[++i]; }
    else if (!a.startsWith('-')) { args.files.push(a); }
    i++;
  }
  return args;
}

function printHelp() {
  console.log(`
skillpack doc-extract — Extract structured data from documents

USAGE
  skillpack doc-extract <files...> [options]

OPTIONS
  --format <fmt>    Output format: markdown, csv, json, txt (default: markdown)
  --out <dir>       Output directory (default: stdout)
  --schema <name>   Schema preset: invoice, resume, contract, receipt, general
  --extract <type>  Extract specific elements: tables, clauses, citations, metadata, images
  --flag <type>     Flag specific content (e.g., risky-terms)
  --ocr             Enable OCR for scanned documents/images
  --dry-run         Preview output without writing files
  --help, -h        Show this help
`);
}

function formatAsMarkdown(text, meta) {
  let out = '';
  if (meta && meta.title) out += `# ${meta.title}\n\n`;
  out += text;
  return out;
}

function formatAsJSON(text, meta) {
  return JSON.stringify({ content: text, metadata: meta || {} }, null, 2);
}

function formatAsCSV(text) {
  const lines = text.split('\n').filter(l => l.trim());
  const rows = lines.map(l => {
    const cells = l.split(/\t+| {2,}/).map(c => c.trim());
    return cells.map(c => `"${c.replace(/"/g, '""')}"`).join(',');
  });
  return rows.join('\n');
}

function formatAsTXT(text) {
  return text;
}

async function extractPDF(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return { text: data.text, meta: { pages: data.numpages, info: data.info } };
}

async function extractDOCX(filePath) {
  const buffer = fs.readFileSync(filePath);
  const result = await mammoth.extractRawText({ buffer });
  return { text: result.value, meta: { messages: result.messages } };
}

function detectFileType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf') return 'pdf';
  if (ext === '.docx') return 'docx';
  if (['.png', '.jpg', '.jpeg', '.tiff', '.bmp'].includes(ext)) return 'image';
  return 'unknown';
}

function applySchema(text, schema) {
  const schemas = {
    invoice: { fields: ['vendor', 'date', 'amount', 'tax', 'total', 'line_items', 'payment_terms'] },
    resume: { fields: ['name', 'contact', 'summary', 'experience', 'education', 'skills', 'certifications'] },
    contract: { fields: ['parties', 'effective_date', 'terms', 'obligations', 'termination', 'signatures'] },
    receipt: { fields: ['store', 'date', 'items', 'subtotal', 'tax', 'total', 'payment_method'] },
    general: { fields: ['title', 'date', 'author', 'content', 'summary'] },
  };
  const s = schemas[schema] || schemas.general;
  return { schema: schema || 'general', fields: s.fields, raw_text: text };
}

function applyExtract(text, extractType) {
  const result = { type: extractType, content: '' };
  switch (extractType) {
    case 'tables':
      result.content = text.split('\n').filter(l => l.includes('\t') || l.includes('  ')).join('\n');
      break;
    case 'clauses':
      result.content = text.split(/\n(?=\d+\.|\([a-z]\)|[A-Z][a-z]+\.)/).filter(Boolean).join('\n---\n');
      break;
    case 'citations':
      result.content = text.split('\n').filter(l => /\[\d+\]|doi:|arxiv:|http/i.test(l)).join('\n');
      break;
    case 'metadata':
      result.content = text.split('\n').slice(0, 20).join('\n');
      break;
    default:
      result.content = text;
  }
  return result;
}

function formatOutput(text, meta, format) {
  switch (format) {
    case 'json': return formatAsJSON(text, meta);
    case 'csv': return formatAsCSV(text);
    case 'txt': return formatAsTXT(text);
    case 'markdown':
    default: return formatAsMarkdown(text, meta);
  }
}

function writeOutput(content, args) {
  if (args.dryRun) {
    process.stderr.write('[dry-run] Would write output:\n');
    process.stdout.write(content);
    return;
  }
  if (args.out) {
    fs.mkdirSync(args.out, { recursive: true });
    const base = args.files[0] ? path.basename(args.files[0], path.extname(args.files[0])) : 'output';
    const ext = args.format === 'json' ? '.json' : args.format === 'csv' ? '.csv' : args.format === 'txt' ? '.txt' : '.md';
    const outPath = path.join(args.out, base + ext);
    fs.writeFileSync(outPath, content);
    process.stderr.write(`Written to ${outPath}\n`);
  } else {
    process.stdout.write(content);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) { printHelp(); process.exit(0); }

  if (args.files.length === 0) {
    console.error('Error: No input files specified. Use --help for usage.');
    process.exit(1);
  }

  for (const file of args.files) {
    if (!fs.existsSync(file)) {
      console.error(`Error: File not found: ${file}`);
      process.exit(1);
    }

    const fileType = detectFileType(file);
    let result;

    try {
      switch (fileType) {
        case 'pdf':
          result = await extractPDF(file);
          break;
        case 'docx':
          result = await extractDOCX(file);
          break;
        case 'image':
          result = { text: `[OCR not available in standalone mode. Use with Claude Code/OpenCode for OCR on: ${file}]`, meta: { type: 'image', file } };
          break;
        default:
          console.error(`Error: Unsupported file type: ${file}`);
          process.exit(1);
      }
    } catch (err) {
      console.error(`Error processing ${file}: ${err.message}`);
      process.exit(1);
    }

    let { text, meta } = result;

    if (args.schema) {
      text = JSON.stringify(applySchema(text, args.schema), null, 2);
    }

    if (args.extract) {
      const extracted = applyExtract(text, args.extract);
      text = JSON.stringify(extracted, null, 2);
    }

    const output = formatOutput(text, meta, args.format);
    writeOutput(output, args);
  }
}

main();
