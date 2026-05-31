#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

function parseArgs(argv) {
  const args = { subcommand: null, files: [], help: false, dryRun: false, out: null, format: 'json', bank: 'generic', batch: false, period: null, categorize: false };
  let i = 0;
  while (i < argv.length) {
    const a = argv[i];
    if (a === '--help' || a === '-h') { args.help = true; }
    else if (a === '--dry-run') { args.dryRun = true; }
    else if (a === '--batch') { args.batch = true; }
    else if (a === '--categorize') { args.categorize = true; }
    else if (a === '--out') { args.out = argv[++i]; }
    else if (a === '--format') { args.format = argv[++i]; }
    else if (a === '--bank') { args.bank = argv[++i]; }
    else if (a === '--period') { args.period = argv[++i]; }
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
skillpack finance-extract — Extract data from bank statements, invoices, and receipts

SUBCOMMANDS
  skillpack finance-extract statement <files...> [--bank chase|bofa|wells-fargo|hsbc|generic] [--categorize] [--out expenses.csv]
  skillpack finance-extract invoice <file|dir> [--batch] [--format json|csv] [--out data.csv]
  skillpack finance-extract report <dir> [--period "2024-Q4"] [--out expense-report.xlsx]

OPTIONS
  --out <path>       Output file
  --format <fmt>     Output format: csv, json, xlsx
  --bank <name>      Bank preset for statement parsing
  --batch            Process multiple files
  --period <p>       Filter by period (e.g., 2024-Q4)
  --categorize       Auto-categorize transactions
  --dry-run          Preview output
  --help, -h         Show this help
`);
}

const CATEGORIES = {
  travel: ['airline', 'hotel', 'uber', 'lyft', 'taxi', 'parking', 'toll', 'rental car', 'airbnb'],
  meals: ['restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonald', 'doordash', 'ubereats', 'grubhub', 'food'],
  software: ['github', 'aws', 'google cloud', 'azure', 'stripe', 'shopify', 'slack', 'notion', 'figma', 'adobe'],
  office: ['office depot', 'staples', 'amazon', 'walmart', 'target', 'costco'],
  utilities: ['electric', 'gas', 'water', 'internet', 'phone', 'verizon', 'att', 'comcast'],
  payroll: ['payroll', 'salary', 'wages', 'bonus', 'commission'],
  other: [],
};

function categorizeTransaction(description) {
  const desc = description.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    if (keywords.some(kw => desc.includes(kw))) {
      return category;
    }
  }
  return 'other';
}

function parseBankStatement(content, bank) {
  const lines = content.split('\n').filter(l => l.trim());
  const transactions = [];

  for (const line of lines) {
    const dateMatch = line.match(/(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/);
    const amountMatch = line.match(/\$?([\d,]+\.?\d*)/);

    if (dateMatch && amountMatch) {
      const description = line.replace(dateMatch[0], '').replace(amountMatch[0], '').trim();
      transactions.push({
        date: dateMatch[1],
        description,
        amount: parseFloat(amountMatch[1].replace(/,/g, '')),
        bank,
        category: 'other',
      });
    }
  }

  return transactions;
}

function parseInvoice(content) {
  const result = {
    vendor: '',
    invoice_number: '',
    date: '',
    due_date: '',
    subtotal: 0,
    tax: 0,
    total: 0,
    line_items: [],
  };

  const vendorMatch = content.match(/(?:from|vendor|bill\s*from|company):\s*(.+)/i);
  if (vendorMatch) result.vendor = vendorMatch[1].trim();

  const invoiceMatch = content.match(/(?:invoice|inv)[\s#]*(\w+)/i);
  if (invoiceMatch) result.invoice_number = invoiceMatch[1];

  const dateMatch = content.match(/(?:date|invoice\s*date):\s*(.+)/i);
  if (dateMatch) result.date = dateMatch[1].trim();

  const dueMatch = content.match(/(?:due\s*date|payment\s*due):\s*(.+)/i);
  if (dueMatch) result.due_date = dueMatch[1].trim();

  const totalMatch = content.match(/(?:total|amount\s*due|balance\s*due):\s*\$?([\d,]+\.?\d*)/i);
  if (totalMatch) result.total = parseFloat(totalMatch[1].replace(/,/g, ''));

  const taxMatch = content.match(/(?:tax|vat|hst|gst):\s*\$?([\d,]+\.?\d*)/i);
  if (taxMatch) result.tax = parseFloat(taxMatch[1].replace(/,/g, ''));

  const subtotalMatch = content.match(/(?:subtotal|sub\s*total):\s*\$?([\d,]+\.?\d*)/i);
  if (subtotalMatch) result.subtotal = parseFloat(subtotalMatch[1].replace(/,/g, ''));

  return result;
}

function writeOutput(content, args, filename) {
  if (args.dryRun) {
    process.stderr.write('[dry-run] Would write output:\n');
    process.stdout.write(typeof content === 'string' ? content : JSON.stringify(content, null, 2));
    return;
  }
  if (args.out) {
    fs.mkdirSync(path.dirname(args.out), { recursive: true });
    if (args.format === 'xlsx' || args.out.endsWith('.xlsx')) {
      const XLSX = require('xlsx');
      const ws = XLSX.utils.json_to_sheet(Array.isArray(content) ? content : [content]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');
      XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
      fs.writeFileSync(args.out, XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }));
    } else if (args.format === 'csv' || args.out.endsWith('.csv')) {
      const csv = Papa.unparse(Array.isArray(content) ? content : [content]);
      fs.writeFileSync(args.out, csv);
    } else {
      fs.writeFileSync(args.out, JSON.stringify(content, null, 2));
    }
    process.stderr.write(`Written to ${args.out}\n`);
  } else {
    const output = Array.isArray(content) ? content : [content];
    if (args.format === 'csv') {
      process.stdout.write(Papa.unparse(output));
    } else {
      process.stdout.write(JSON.stringify(output, null, 2));
    }
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { printHelp(); process.exit(0); }
  if (!args.subcommand) { printHelp(); process.exit(0); }

  switch (args.subcommand) {
    case 'statement': {
      const files = [];
      for (const f of args.files) {
        const glob = require('glob');
        const matches = glob.sync(f);
        files.push(...matches);
      }

      if (files.length === 0) { console.error('Error: No files found.'); process.exit(1); }

      let allTransactions = [];
      for (const file of files) {
        if (!fs.existsSync(file)) { console.error(`Error: File not found: ${file}`); process.exit(1); }
        const content = fs.readFileSync(file, 'utf-8');
        const transactions = parseBankStatement(content, args.bank);
        allTransactions.push(...transactions);
      }

      if (args.categorize) {
        allTransactions = allTransactions.map(t => ({ ...t, category: categorizeTransaction(t.description) }));
      }

      writeOutput(allTransactions, args, 'expenses.csv');
      break;
    }
    case 'invoice': {
      const file = args.files[0];
      if (!file || !fs.existsSync(file)) { console.error('Error: File not found.'); process.exit(1); }

      if (args.batch || fs.statSync(file).isDirectory()) {
        const files = fs.readdirSync(file).filter(f => f.endsWith('.pdf') || f.endsWith('.txt'));
        const invoices = [];
        for (const f of files) {
          const content = fs.readFileSync(path.join(file, f), 'utf-8');
          invoices.push(parseInvoice(content));
        }
        writeOutput(invoices, args, 'invoices-data.csv');
      } else {
        const content = fs.readFileSync(file, 'utf-8');
        const invoice = parseInvoice(content);
        writeOutput(invoice, args, 'invoice-data.json');
      }
      break;
    }
    case 'report': {
      const dir = args.files[0] || '.';
      if (!fs.existsSync(dir)) { console.error('Error: Directory not found.'); process.exit(1); }

      const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf') || f.endsWith('.csv'));
      let allTransactions = [];

      for (const f of files) {
        const content = fs.readFileSync(path.join(dir, f), 'utf-8');
        const transactions = parseBankStatement(content, 'generic');
        allTransactions.push(...transactions);
      }

      if (args.period) {
        const [year, quarter] = args.period.split('-');
        const qStart = (parseInt(quarter.replace('Q', '')) - 1) * 3 + 1;
        allTransactions = allTransactions.filter(t => {
          const [m, y] = t.date.split('/');
          return parseInt(y) === parseInt(year) && parseInt(m) >= qStart && parseInt(m) < qStart + 3;
        });
      }

      if (args.categorize) {
        allTransactions = allTransactions.map(t => ({ ...t, category: categorizeTransaction(t.description) }));
      }

      const summary = allTransactions.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

      writeOutput({ transactions: allTransactions, summary }, args, 'expense-report.xlsx');
      break;
    }
    default:
      console.error(`Error: Unknown subcommand "${args.subcommand}"`);
      process.exit(1);
  }
}

main();
