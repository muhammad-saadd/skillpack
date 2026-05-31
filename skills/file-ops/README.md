# file-ops

Batch rename files, resize/convert images, generate favicon sets, and convert design tokens to CSS.

## What it replaces

The old way: Open each image in Photoshop → Image Size → Save for Web → repeat 50 times. Or: manually rename 200 vacation photos one by one. Or: use an online favicon generator → upload logo → wait → download → realize sizes are wrong.

**skillpack replaces all of that with one command.**

## Installation

```bash
npm install -g skillpack
```

## Usage Examples

### Batch rename photos by date
```bash
skillpack file-ops rename photos/ --pattern "{date}-{seq}-{name}" --dry-run
```

**Output:**
```
photos/IMG_1234.jpg → photos/2024-01-15-001-IMG_1234.jpg
photos/IMG_1235.jpg → photos/2024-01-15-002-IMG_1235.jpg
```

### Find and replace in filenames
```bash
skillpack file-ops rename *.jpg --find "IMG_" --replace "vacation-2024-"
```

### Resize and convert images to WebP
```bash
skillpack file-ops images assets/ --resize 1200x630 --to webp --quality 85
```

### Generate multi-size images
```bash
skillpack file-ops images hero.png --to avif,webp,png --sizes "1x,2x,3x"
```

### Generate favicon set from logo
```bash
skillpack file-ops favicon logo.svg --out public/ --formats all
```

**Output:**
```
public/favicon-16x16.png
public/favicon-32x32.png
public/favicon-48x48.png
public/favicon-192x192.png
public/favicon-512x512.png
public/favicon-192.webp
```

### Convert design tokens to CSS
```bash
skillpack file-ops tokens design-tokens.json --out src/styles/tokens.css
```

**Output:**
```css
:root {
  --color-primary: #3B82F6;
  --color-secondary: #10B981;
  --spacing-md: 16px;
  --font-size-base: 16px;
}
```

## Supported Image Formats

| Input | Output |
|-------|--------|
| JPEG, PNG, TIFF, WebP | WebP, AVIF, PNG, JPEG |

## Why this beats the old way

- **Batch operations** — process hundreds of files at once
- **No Photoshop needed** — works with command line
- **Modern formats** — WebP and AVIF for faster websites
- **Favicon sets** — generate all sizes from one image
- **Design system integration** — Figma tokens → CSS in seconds
- **Dry-run mode** — preview changes before committing
