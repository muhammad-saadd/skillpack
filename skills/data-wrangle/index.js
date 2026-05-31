#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

function parseArgs(argv) {
  const args = { files: [], help: false, dryRun: false, format: null, to: null, out: null, clean: false, dedup: false, fixEncoding: false, merge: false, key: null, validate: false, report: null, sql: false };
  let i = 0;
  while (i < argv.length) {
    const a = argv[i];
    if (a === '--help' || a === '-h') { args.help = true; }
    else if (a === '--dry-run') { args.dryRun = true; }
    else if (a === '--clean') { args.clean = true; }
    else if (a === '--dedup') { args.dedup = true; }
    else if (a === '--fix-encoding') { args.fixEncoding = true; }
    else if (a === '--merge') { args.merge = true; }
    else if (a === '--validate') { args.validate = true; }
    else if (a === '--sql') { args.sql = true; }
    else if (a === '--to') { args.to = argv[++i]; }
    else if (a === '--out') { args.out = argv[++i]; }
    else if (a === '--key') { args.key = argv[++i]; }
    else if (a === '--report') { args.report = argv[++i]; }
    else if (!a.startsWith('-')) { args.files.push(a); }
    i++;
  }
  return args;
}

function printHelp() {
  console.log(`
skillpack data-wrangle — Clean, convert, merge, and validate tabular data

USAGE
  skillpack data-wrangle <files...> [options]

OPTIONS
  --to <fmt>         Convert to: csv, json, xlsx, markdown
  --out <dir>        Output directory (default: stdout)
  --clean            Remove empty rows and normalize whitespace
  --dedup            Remove duplicate rows
  --fix-encoding     Fix common encoding issues (mojibake, broken UTF-8)
  --merge            Merge multiple files (requires --key)
  --key <column>     Column key for merge operations
  --validate         Validate data and produce a report
  --report <file>    Write validation report to this file
  --sql              Generate SQL from natural language query
  --dry-run          Preview output without writing files
  --help, -h         Show this help
`);
}

function readCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const result = Papa.parse(content, { header: true, skipEmptyLines: true });
  return { data: result.data, errors: result.errors, fields: result.meta.fields };
}

function readJSON(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);
  if (!Array.isArray(data)) return { data: [data], errors: [], fields: Object.keys(data[0] || {}) };
  return { data, errors: [], fields: Object.keys(data[0] || {}) };
}

function readXLSX(filePath) {
  const XLSX = require('xlsx');
  const wb = XLSX.readFile(filePath);
  const sheetName = wb.SheetNames[0];
  const data = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
  return { data, errors: [], fields: Object.keys(data[0] || {}) };
}

function readFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.csv': return readCSV(filePath);
    case '.json': return readJSON(filePath);
    case '.xlsx': case '.xls': return readXLSX(filePath);
    default: throw new Error(`Unsupported file type: ${ext}`);
  }
}

function cleanData(rows) {
  return rows
    .filter(row => Object.values(row).some(v => v !== null && v !== undefined && String(v).trim() !== ''))
    .map(row => {
      const cleaned = {};
      for (const [k, v] of Object.entries(row)) {
        cleaned[k] = typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : v;
      }
      return cleaned;
    });
}

function dedupRows(rows, key) {
  if (key) {
    const seen = new Set();
    return rows.filter(row => {
      const val = row[key];
      if (seen.has(val)) return false;
      seen.add(val);
      return true;
    });
  }
  const seen = new Set();
  return rows.filter(row => {
    const sig = JSON.stringify(row);
    if (seen.has(sig)) return false;
    seen.add(sig);
    return true;
  });
}

function fixEncoding(text) {
  return text
    .replace(/Ã©/g, 'é').replace(/Ã¨/g, 'è').replace(/Ã /g, 'à')
    .replace(/Ã¶/g, 'ö').replace(/Ã¼/g, 'ü').replace(/Ã¤/g, 'ä')
    .replace(/â€™/g, "'").replace(/â€œ/g, '"').replace(/â€\x9d/g, '"')
    .replace(/â€"/g, '—').replace(/â€"/g, '–').replace(/Ã¦/g, 'æ')
    .replace(/Ã¸/g, 'ø').replace(/Ã¥/g, 'å').replace(/ÃŸ/g, 'ß');
}

function mergeFiles(files, key) {
  const allData = [];
  for (const f of files) {
    const { data } = readFile(f);
    allData.push(...data);
  }
  if (key) {
    const map = new Map();
    for (const row of allData) {
      map.set(row[key], { ...map.get(row[key]), ...row });
    }
    return Array.from(map.values());
  }
  return allData;
}

function validateData(rows, fields) {
  const issues = [];
  const emptyCols = {};
  for (const f of fields) {
    emptyCols[f] = 0;
  }
  for (let i = 0; i < rows.length; i++) {
    for (const f of fields) {
      const val = rows[i][f];
      if (val === null || val === undefined || String(val).trim() === '') {
        emptyCols[f]++;
      }
    }
  }
  for (const [col, count] of Object.entries(emptyCols)) {
    if (count > 0) {
      issues.push({ type: 'empty_values', column: col, count, percentage: ((count / rows.length) * 100).toFixed(1) });
    }
  }
  const sigs = new Map();
  for (let i = 0; i < rows.length; i++) {
    const sig = JSON.stringify(rows[i]);
    if (sigs.has(sig)) {
      issues.push({ type: 'duplicate', row: i + 1, first_seen: sigs.get(sig) + 1 });
    } else {
      sigs.set(sig, i);
    }
  }
  return { valid: issues.length === 0, total_rows: rows.length, fields: fields.length, issues };
}

function generateSQL(description) {
  const desc = description.toLowerCase();
  let sql = 'SELECT ';
  if (desc.includes('total') || desc.includes('sum')) {
    const match = desc.match(/total\s+(\w+)/i);
    const col = match ? match[1] : '*';
    sql += `SUM(${col})`;
  } else if (desc.includes('count') || desc.includes('how many')) {
    sql += 'COUNT(*)';
  } else if (desc.includes('average') || desc.includes('avg')) {
    const match = desc.match(/average\s+(\w+)/i);
    const col = match ? match[1] : '*';
    sql += `AVG(${col})`;
  } else {
    sql += '*';
  }

  const fromMatch = desc.match(/from\s+(\w+)/i);
  const table = fromMatch ? fromMatch[1] : 'table_name';
  sql += `\nFROM ${table}`;

  const byMatch = desc.match(/by\s+(\w+)/i);
  if (byMatch) {
    sql += `\nGROUP BY ${byMatch[1]}`;
  }

  const whereMatch = desc.match(/where\s+(.+?)(?:\s+group|\s+order|\s+limit|$)/i);
  if (whereMatch) {
    sql += `\nWHERE ${whereMatch[1]}`;
  }

  return sql;
}

function formatAsMarkdown(rows, fields) {
  if (!rows.length) return '';
  const header = '| ' + fields.join(' | ') + ' |';
  const sep = '| ' + fields.map(() => '---').join(' | ') + ' |';
  const body = rows.map(r => '| ' + fields.map(f => String(r[f] ?? '')).join(' | ') + ' |').join('\n');
  return `${header}\n${sep}\n${body}`;
}

function writeOutput(content, args, ext) {
  if (args.dryRun) {
    process.stderr.write('[dry-run] Would write output:\n');
    process.stdout.write(content);
    return;
  }
  if (args.out) {
    fs.mkdirSync(args.out, { recursive: true });
    const base = args.files[0] ? path.basename(args.files[0], path.extname(args.files[0])) : 'output';
    const outPath = path.join(args.out, base + '.' + ext);
    fs.writeFileSync(outPath, content);
    process.stderr.write(`Written to ${outPath}\n`);
  } else {
    process.stdout.write(content);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { printHelp(); process.exit(0); }
  if (args.files.length === 0) { console.error('Error: No input files specified.'); process.exit(1); }

  for (const f of args.files) {
    if (!fs.existsSync(f)) { console.error(`Error: File not found: ${f}`); process.exit(1); }
  }

  let rows, fields;

  if (args.merge) {
    const merged = mergeFiles(args.files, args.key);
    rows = merged;
    fields = Object.keys(merged[0] || {});
  } else {
    const first = readFile(args.files[0]);
    rows = first.data;
    fields = first.fields;
  }

  if (args.fixEncoding) {
    rows = rows.map(row => {
      const fixed = {};
      for (const [k, v] of Object.entries(row)) {
        fixed[k] = typeof v === 'string' ? fixEncoding(v) : v;
      }
      return fixed;
    });
  }

  if (args.clean) { rows = cleanData(rows); }
  if (args.dedup) { rows = dedupRows(rows, args.key); }

  if (args.sql) {
    const query = generateSQL(args.files[0]);
    process.stdout.write(query + '\n');
    process.exit(0);
  }

  if (args.validate) {
    const report = validateData(rows, fields);
    const reportStr = JSON.stringify(report, null, 2);
    if (args.report) {
      fs.writeFileSync(args.report, reportStr);
      process.stderr.write(`Validation report written to ${args.report}\n`);
    } else {
      process.stdout.write(reportStr + '\n');
    }
    process.exit(0);
  }

  const targetFormat = args.to || path.extname(args.files[0]).slice(1);
  let content;

  switch (targetFormat) {
    case 'json':
      content = JSON.stringify(rows, null, 2);
      writeOutput(content, args, 'json');
      break;
    case 'csv':
      content = Papa.unparse(rows);
      writeOutput(content, args, 'csv');
      break;
    case 'xlsx':
      const XLSX = require('xlsx');
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      if (args.out) {
        fs.mkdirSync(args.out, { recursive: true });
        const outPath = path.join(args.out, 'output.xlsx');
        fs.writeFileSync(outPath, buf);
        process.stderr.write(`Written to ${outPath}\n`);
      } else {
        process.stdout.write(buf);
      }
      break;
    case 'markdown':
    default:
      content = formatAsMarkdown(rows, fields);
      writeOutput(content, args, 'md');
      break;
  }
}

main();
