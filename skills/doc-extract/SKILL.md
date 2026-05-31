---
name: doc-extract
version: 1.0.0
description: Extract structured data from PDFs, DOCX, and images into markdown, CSV, JSON, or plain text
inputs: [pdf, docx, png, jpg, jpeg, tiff, bmp]
outputs: [markdown, csv, json, txt]
tools: [bash, read_file, write_file]
---

## What this skill does
Extracts text, tables, metadata, and structured data from PDF, DOCX, and scanned image files. Supports OCR for scanned documents, schema-based extraction (invoices, resumes, contracts, receipts), and batch processing of multiple files.

## Trigger phrases
- extract text from PDF
- convert PDF to markdown
- parse invoice PDF
- extract tables from document
- OCR scanned document
- convert DOCX to markdown
- extract resume data
- parse contract clauses
- extract metadata from PDF
- batch extract from PDFs
- PDF to JSON
- PDF to CSV
- extract images from PDF
- read scanned document

## Usage
```bash
skillpack doc-extract invoice.pdf --format json --schema invoice
skillpack doc-extract contract.pdf --extract clauses --flag risky-terms
skillpack doc-extract resume.pdf --format json --schema resume
skillpack doc-extract scanned.pdf --ocr --format markdown
skillpack doc-extract report.docx --format markdown
skillpack doc-extract *.pdf --format csv --out ./extracted/
```

## Steps
1. Detect input file type (PDF, DOCX, image) from extension and content
2. Route to appropriate parser (pdf-parse for PDFs, mammoth for DOCX, sharp for images)
3. If --ocr is set and input is an image, perform OCR text extraction
4. If --schema is specified, apply structured extraction template
5. If --extract is specified, extract only the requested elements (tables, clauses, metadata, etc.)
6. Format output according to --format flag
7. Write to --out directory or stdout

## Output
Structured data in the requested format (markdown, CSV, JSON, or plain text). When using --schema, output follows the schema template with labeled fields.
