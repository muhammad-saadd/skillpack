---
name: finance-extract
version: 1.0.0
description: Extract structured data from bank statements, invoices, and receipts into categorized reports
inputs: [pdf, csv, xlsx]
outputs: [csv, json, xlsx]
tools: [bash, read_file, write_file]
---

## What this skill does
Extracts and categorizes expenses from bank statement PDFs/CSVs, parses invoice PDFs into structured data (vendor, amount, line items, dates, tax), batch processes receipt folders into expense reports, and generates financial transaction summaries with auto-detected categories.

## Trigger phrases
- parse bank statement
- extract invoice data
- process receipts
- categorize expenses
- create expense report
- parse financial transactions
- extract vendor information
- batch process invoices
- bank statement to csv
- receipt scanner
- expense tracking
- financial data extraction
- invoice to json

## Usage
```bash
skillpack finance-extract statement bank-statement.pdf --bank chase --out expenses.csv
skillpack finance-extract invoice invoice.pdf --format json
skillpack finance-extract invoice invoices/ --batch --out invoices-data.csv
skillpack finance-extract report receipts/ --period "2024-Q4" --out expense-report.xlsx
skillpack finance-extract statement *.pdf --categorize --out spending-2024.xlsx
```

## Steps
1. Parse subcommand (statement, invoice, report)
2. For statement: parse bank statement PDF/CSV, extract transactions
3. For invoice: extract vendor, amount, line items, dates, tax
4. For report: batch process receipts, categorize, generate summary
5. Apply category detection based on merchant/description keywords
6. Format output and write to --out or stdout

## Output
Structured financial data in CSV, JSON, or XLSX format with categorized transactions.
