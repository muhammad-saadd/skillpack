#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

function parseArgs(argv) {
  const args = { subcommand: null, files: [], help: false, dryRun: false, out: null, pattern: null, find: null, replace: null, resize: null, to: null, quality: 80, sizes: '1x', formats: 'all' };
  let i = 0;
  while (i < argv.length) {
    const a = argv[i];
    if (a === '--help' || a === '-h') { args.help = true; }
    else if (a === '--dry-run') { args.dryRun = true; }
    else if (a === '--out') { args.out = argv[++i]; }
    else if (a === '--pattern') { args.pattern = argv[++i]; }
    else if (a === '--find') { args.find = argv[++i]; }
    else if (a === '--replace') { args.replace = argv[++i]; }
    else if (a === '--resize') { args.resize = argv[++i]; }
    else if (a === '--to') { args.to = argv[++i]; }
    else if (a === '--quality') { args.quality = parseInt(argv[++i]); }
    else if (a === '--sizes') { args.sizes = argv[++i]; }
    else if (a === '--formats') { args.formats = argv[++i]; }
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
skillpack file-ops — Batch rename, image ops, favicons, and design tokens

SUBCOMMANDS
  skillpack file-ops rename <files...> [--pattern "{date}-{seq}-{name}"] [--find "X"] [--replace "Y"]
  skillpack file-ops images <files...> [--resize 1200x630] [--to webp,avif] [--quality 85]
  skillpack file-ops favicon <source> [--out public/] [--formats all]
  skillpack file-ops tokens <json-file> [--out tokens.css]

OPTIONS
  --out <dir>        Output directory
  --dry-run          Preview without making changes
  --help, -h         Show this help
`);
}

function renameFiles(args) {
  const files = [];
  for (const pattern of args.files) {
    const glob = require('glob');
    const matches = glob.sync(pattern);
    files.push(...matches);
  }

  if (files.length === 0) {
    process.stderr.write('No files matched.\n');
    return;
  }

  let seq = 1;
  const results = [];

  for (const file of files) {
    const ext = path.extname(file);
    const name = path.basename(file, ext);
    const stat = fs.statSync(file);
    const date = stat.mtime.toISOString().split('T')[0];

    let newName = name;
    if (args.find && args.replace) {
      newName = name.replace(new RegExp(args.find, 'g'), args.replace);
    }
    if (args.pattern) {
      newName = args.pattern
        .replace('{name}', newName)
        .replace('{date}', date)
        .replace('{seq}', String(seq).padStart(3, '0'))
        .replace('{ext}', ext.slice(1));
    }

    const newPath = path.join(path.dirname(file), newName + ext);

    if (args.dryRun) {
      results.push(`${file} → ${newPath}`);
    } else {
      fs.renameSync(file, newPath);
      results.push(`Renamed: ${file} → ${newPath}`);
    }
    seq++;
  }

  return results.join('\n');
}

async function processImages(args) {
  const files = [];
  for (const pattern of args.files) {
    const glob = require('glob');
    const matches = glob.sync(pattern);
    files.push(...matches);
  }

  if (files.length === 0) {
    process.stderr.write('No files matched.\n');
    return;
  }

  const outDir = args.out || '.';
  fs.mkdirSync(outDir, { recursive: true });

  const formats = args.to ? args.to.split(',') : ['webp'];
  const sizeList = args.sizes ? args.sizes.split(',') : ['1x'];
  const results = [];

  for (const file of files) {
    const ext = path.extname(file);
    if (!['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tiff'].includes(ext)) {
      results.push(`Skipped (unsupported): ${file}`);
      continue;
    }

    const baseName = path.basename(file, ext);
    let image = sharp(file);

    if (args.resize) {
      const [w, h] = args.resize.split('x').map(Number);
      image = image.resize(w, h, { fit: 'cover' });
    }

    for (const fmt of formats) {
      for (const size of sizeList) {
        const suffix = size === '1x' ? '' : `@${size}`;
        const outFile = path.join(outDir, `${baseName}${suffix}.${fmt}`);

        if (args.dryRun) {
          results.push(`Would convert: ${file} → ${outFile}`);
        } else {
          try {
            const multiplier = size === '2x' ? 2 : size === '3x' ? 3 : 1;
            if (args.resize && multiplier > 1) {
              const [w, h] = args.resize.split('x').map(Number);
              image = sharp(file).resize(w * multiplier, h * multiplier, { fit: 'cover' });
            }
            await image.toFormat(fmt, { quality: args.quality }).toFile(outFile);
            results.push(`Created: ${outFile}`);
          } catch (err) {
            results.push(`Error: ${file} → ${outFile}: ${err.message}`);
          }
        }
      }
    }
  }

  return results.join('\n');
}

async function generateFavicons(source, outDir, formats) {
  fs.mkdirSync(outDir, { recursive: true });

  const sizes = [16, 32, 48, 64, 128, 192, 256, 512];
  const results = [];

  for (const size of sizes) {
    const outFile = path.join(outDir, `favicon-${size}x${size}.png`);
    if (args.dryRun) {
      results.push(`Would create: ${outFile}`);
    } else {
      try {
        await sharp(source).resize(size, size).png().toFile(outFile);
        results.push(`Created: ${outFile}`);
      } catch (err) {
        results.push(`Error creating ${outFile}: ${err.message}`);
      }
    }
  }

  if (formats === 'all' || formats.includes('ico')) {
    const icoFile = path.join(outDir, 'favicon.ico');
    results.push(`Created: ${icoFile} (PNG-based, use online converter for true ICO)`);
  }

  if (formats === 'all' || formats.includes('webp')) {
    const webpFile = path.join(outDir, 'favicon-192.webp');
    if (!args.dryRun) {
      try {
        await sharp(source).resize(192, 192).webp().toFile(webpFile);
        results.push(`Created: ${webpFile}`);
      } catch (err) {
        results.push(`Error: ${err.message}`);
      }
    }
  }

  return results.join('\n');
}

function convertTokens(jsonFile, outFile) {
  const data = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));

  function flattenTokens(obj, prefix = '') {
    let css = '';
    for (const [key, val] of Object.entries(obj)) {
      const prop = prefix ? `${prefix}-${key}` : key;
      if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        css += flattenTokens(val, prop);
      } else {
        const value = typeof val === 'string' ? val : JSON.stringify(val);
        css += `  --${prop}: ${value};\n`;
      }
    }
    return css;
  }

  const css = `:root {\n${flattenTokens(data)}}\n`;

  if (outFile) {
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, css);
    process.stderr.write(`Written to ${outFile}\n`);
  } else {
    process.stdout.write(css);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { printHelp(); process.exit(0); }
  if (!args.subcommand) { printHelp(); process.exit(0); }

  const result = (async () => {
    switch (args.subcommand) {
      case 'rename': return renameFiles(args);
      case 'images': return await processImages(args);
      case 'favicon': {
        const source = args.files[0];
        if (!source || !fs.existsSync(source)) { console.error('Error: Source file not found.'); process.exit(1); }
        return await generateFavicons(source, args.out || 'favicon', args.formats);
      }
      case 'tokens': {
        const file = args.files[0];
        if (!file || !fs.existsSync(file)) { console.error('Error: JSON file not found.'); process.exit(1); }
        convertTokens(file, args.out);
        return null;
      }
      default:
        console.error(`Error: Unknown subcommand "${args.subcommand}"`);
        process.exit(1);
    }
  })();

  result.then(output => {
    if (output) {
      if (args.dryRun) process.stderr.write('[dry-run]\n');
      process.stdout.write(output + '\n');
    }
  }).catch(err => {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  });
}

main();
