# finance-extract

Extract structured data from bank statements, invoices, and receipts into categorized reports.

## What it replaces

The old way: Open bank statement PDF → manually copy each transaction into Excel → categorize each one → calculate totals → realize you missed 20 transactions → start over. Or: hire a bookkeeper for $50/hour to do the same thing.

**skillpack replaces all of that with one command.**

## Installation

```bash
# via curl (auto-installs dependencies)
curl -fsSL https://raw.githubusercontent.com/muhammad-saadd/skillpack/main/install.sh | bash

# or clone directly
git clone https://github.com/muhammad-saadd/skillpack ~/.local/share/skillpack
ln -s ~/.local/share/skillpack/bin/skillpack ~/.local/bin/skillpack
```

## Usage Examples

### Parse a bank statement to CSV
```bash
skillpack finance-extract statement bank-statement.pdf --bank chase --out expenses.csv --categorize
```

**Output:**
```csv
date,description,amount,bank,category
01/15/2024,STARBUCKS #12345,4.95,chase,meals
01/16/2024,AMAZON.COM,89.99,chase,office
01/17/2024,UBER *TRIP,23.50,chase,travel
```

### Parse an invoice to JSON
```bash
skillpack finance-extract invoice invoice.pdf --format json
```

**Output:**
```json
{
  "vendor": "Acme Corp",
  "invoice_number": "INV-2024-001",
  "date": "2024-01-15",
  "due_date": "2024-02-15",
  "subtotal": 500.00,
  "tax": 42.50,
  "total": 542.50
}
```

### Batch process invoices
```bash
skillpack finance-extract invoice invoices/ --batch --out invoices-data.csv
```

### Generate quarterly expense report
```bash
skillpack finance-extract report receipts/ --period "2024-Q4" --out expense-report.xlsx --categorize
```

### Process multiple statements
```bash
skillpack finance-extract statement *.pdf --categorize --out spending-2024.xlsx
```

## Supported Bank Presets

| Bank | Format Support |
|------|---------------|
| Chase | ✅ Full |
| Bank of America | ✅ Full |
| Wells Fargo | ✅ Full |
| HSBC | ✅ Full |
| Generic | ✅ Basic pattern matching |

## Auto-Categories

| Category | Detected Keywords |
|----------|-------------------|
| Travel | airline, hotel, uber, lyft, taxi, parking |
| Meals | restaurant, cafe, coffee, starbucks, doordash |
| Software | github, aws, google cloud, slack, notion |
| Office | office depot, staples, amazon, walmart |
| Utilities | electric, gas, water, internet, phone |
| Payroll | payroll, salary, wages, bonus |

## Why this beats the old way

- **No manual data entry** — parse PDFs automatically
- **Auto-categorization** — transactions sorted by type
- **Batch processing** — handle hundreds of receipts at once
- **Multiple formats** — export to CSV, JSON, or Excel
- **Period filtering** — focus on specific quarters or months
- **Tax-ready** — categorized expenses for easy tax filing
