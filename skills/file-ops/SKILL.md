---
name: file-ops
version: 1.0.0
description: Batch rename files, resize/convert images, generate favicon sets, convert design tokens to CSS
inputs: [jpg, png, webp, avif, svg, json]
outputs: [jpg, png, webp, avif, svg, css]
tools: [bash, read_file, write_file]
---

## What this skill does
Batch renames files by pattern/regex/date/content, bulk resizes and converts images between formats (WebP, AVIF, PNG, JPEG), generates complete favicon sets from one source image, and converts design token JSON (Figma export) to CSS custom properties.

## Trigger phrases
- batch rename files
- rename photos by date
- bulk image resize
- convert images to webp
- generate favicon set
- convert design tokens to CSS
- resize images for web
- create favicon from logo
- batch format conversion
- rename files with pattern
- image optimization
- favicon generator
- design tokens export

## Usage
```bash
skillpack file-ops rename photos/ --pattern "{date}-{seq}-{name}" --dry-run
skillpack file-ops rename *.jpg --find "IMG_" --replace "vacation-2024-"
skillpack file-ops images assets/ --resize 1200x630 --to webp --quality 85
skillpack file-ops images hero.png --to avif,webp,png --sizes "1x,2x,3x"
skillpack file-ops favicon logo.svg --out public/ --formats all
skillpack file-ops tokens design-tokens.json --out src/styles/tokens.css
```

## Steps
1. Parse subcommand and arguments
2. For rename: scan files, apply pattern transformations, rename
3. For images: process each image with sharp for resize/convert
4. For favicon: generate multiple sizes and formats from source
5. For tokens: parse JSON, convert to CSS custom properties
6. Write output to --out directory

## Output
Renamed files, converted images, favicon sets, or CSS files.
