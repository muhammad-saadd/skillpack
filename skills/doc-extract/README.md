# doc-extract

Extract structured data from PDFs, DOCX files, and images into markdown, CSV, JSON, or plain text.

## What it replaces

The old way: open Adobe Acrobat ($23/mo) → export to Word → manually copy tables → format in Google Docs → convert to markdown. Or: upload to an online PDF converter → wait → download → discover formatting is broken. Or: hire a virtual assistant to manually type out invoice data.

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

### Extract a PDF to markdown
```bash
skillpack doc-extract report.pdf --format markdown
```

### Parse an invoice to structured JSON
```bash
skillpack doc-extract invoice.pdf --format json --schema invoice
```

**Output:**
```json
{
  "content": "...",
  "metadata": {
    "pages": 1,
    "info": { "Title": "Invoice #1234" }
  }
}
```

### Extract tables from a document
```bash
skillpack doc-extract report.pdf --extract tables --format csv --out ./tables/
```

### Convert a DOCX to markdown
```bash
skillpack doc-extract document.docx --format markdown
```

### Batch process multiple PDFs
```bash
skillpack doc-extract *.pdf --format json --out ./extracted/
```

### Extract contract clauses
```bash
skillpack doc-extract contract.pdf --extract clauses --format markdown
```

## Output Formats

| Format | Flag | Best for |
|--------|------|----------|
| Markdown | `--format markdown` | Documentation, READMEs |
| JSON | `--format json` | APIs, data pipelines |
| CSV | `--format csv` | Spreadsheets, databases |
| Text | `--format txt` | Plain text processing |

## Schema Presets

| Schema | Use case |
|--------|----------|
| `invoice` | Vendor, amount, tax, line items |
| `resume` | Name, contact, skills, experience |
| `contract` | Parties, terms, obligations |
| `receipt` | Store, items, total |
| `general` | Title, date, author, content |

## Why this beats the old way

- **No subscription fees** — runs locally, no cloud upload needed
- **No formatting loss** — preserves structure from PDF/DOCX
- **Batch processing** — handle hundreds of files in one command
- **Schema-aware** — extracts the fields you need, not just raw text
- **Pipeable** — output goes to stdout, chain with other tools
