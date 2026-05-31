# data-wrangle

Clean, convert, merge, and validate CSV, JSON, and XLSX files. Generate SQL from plain English.

## What it replaces

The old way: Open Excel → manually delete empty rows → Save As CSV → open another CSV → copy columns → paste into the first → realize encoding is broken → Google "fix UTF-8 CSV" → give up and hire a freelancer on Fiverr for $20.

**skillpack replaces all of that with one command.**

## Installation

```bash
npm install -g skillpack
```

## Usage Examples

### Clean and deduplicate a CSV
```bash
skillpack data-wrangle sales.csv --clean --dedup
```

**Output:**
```
Cleaned 847 rows → 623 unique rows (removed 224 duplicates, 13 empty rows)
```

### Convert JSON to CSV
```bash
skillpack data-wrangle data.json --to csv --out ./converted/
```

### Merge multiple CSV files
```bash
skillpack data-wrangle jan.csv feb.csv mar.csv --merge --key "order_id" --to csv
```

### Validate data and generate report
```bash
skillpack data-wrangle users.csv --validate --report validation.md
```

**Output:**
```json
{
  "valid": false,
  "total_rows": 1500,
  "fields": 12,
  "issues": [
    { "type": "empty_values", "column": "email", "count": 45, "percentage": "3.0" }
  ]
}
```

### Generate SQL from natural language
```bash
skillpack data-wrangle "show me total revenue by region from sales.csv" --sql
```

**Output:**
```sql
SELECT SUM(revenue)
FROM sales
GROUP BY region
```

### Batch convert Excel files to CSV
```bash
skillpack data-wrangle *.xlsx --to csv --out ./csv/
```

## Supported Operations

| Operation | Flag | Description |
|-----------|------|-------------|
| Clean | `--clean` | Remove empty rows, normalize whitespace |
| Deduplicate | `--dedup` | Remove duplicate rows |
| Fix encoding | `--fix-encoding` | Fix mojibake and broken UTF-8 |
| Merge | `--merge --key <col>` | Combine files by key column |
| Validate | `--validate` | Check for issues, generate report |
| SQL gen | `--sql` | Generate SQL from natural language |
| Convert | `--to <fmt>` | Convert between CSV/JSON/XLSX/Markdown |

## Why this beats the old way

- **No Excel license needed** — works with open formats
- **Batch operations** — process hundreds of files at once
- **Merge by key** — like SQL JOIN, but for flat files
- **Validation reports** — know exactly what's wrong with your data
- **Encoding fixes** — handles mojibake from copy-paste and imports
- **Pipeable** — output goes to stdout, chain with other tools
