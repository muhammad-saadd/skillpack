---
name: data-wrangle
version: 1.0.0
description: Clean, convert, merge, validate CSV/JSON/XLSX files and generate SQL from plain English
inputs: [csv, json, xlsx]
outputs: [csv, json, xlsx, markdown]
tools: [bash, read_file, write_file]
---

## What this skill does
Cleans, normalizes, deduplicates, and validates tabular data in CSV, JSON, and XLSX formats. Converts between formats, merges multiple files by key column, fixes encoding issues, and generates SQL queries from plain English descriptions.

## Trigger phrases
- clean CSV data
- convert CSV to JSON
- merge CSV files
- deduplicate data
- validate CSV
- fix encoding in CSV
- convert Excel to CSV
- SQL from natural language
- normalize data columns
- combine multiple CSVs
- data cleanup
- format spreadsheet
- split CSV by column
- summarize data

## Usage
```bash
skillpack data-wrangle sales.csv --clean --fix-encoding --dedup
skillpack data-wrangle orders.json --to csv
skillpack data-wrangle jan.csv feb.csv mar.csv --merge --key "order_id"
skillpack data-wrangle users.csv --validate --report validation-report.md
skillpack data-wrangle "show me total revenue by region from sales.csv" --sql
skillpack data-wrangle *.xlsx --to csv --out ./converted/
```

## Steps
1. Detect input file format from extension
2. Parse file using appropriate parser (papaparse for CSV, JSON.parse for JSON, xlsx for Excel)
3. Apply requested operations in order: clean → fix-encoding → dedup → merge → validate
4. If --sql is set, generate SQL query from the natural language description
5. Convert to target format if --to is specified
6. Output results to --out directory or stdout

## Output
Cleaned, validated, or converted data in the requested format. When using --validate, produces a report of issues found.
