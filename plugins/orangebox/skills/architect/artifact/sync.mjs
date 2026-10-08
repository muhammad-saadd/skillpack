// Copy an `Artifact read` (path: "index.html") back over the run's diagram.html.
// Strips claude.ai's skeleton and Mermaid runtime so the local copy is the page as authored (~10 KB, not ~14 KB).
// usage: node sync.mjs <saved index.html> <run>/diagram.html   → prints "rev N updated" or "rev N unchanged"
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const [saved, local] = process.argv.slice(2);
let page = readFileSync(saved, 'utf8').replace(/\r/g, '');
page = page.replace(/^[\s\S]*?<body>\n?/, '');
const rt = page.indexOf('<!--claude-mermaid-runtime-begin');
if (rt >= 0) page = page.slice(0, rt);
page = page.replace(/\s*<\/body>\s*<\/html>\s*$/, '').replace(/\n+$/, '');
const rev = s => Number((/<main data-rev="(\d+)"/.exec(s) || [])[1]) || 0;
const was = existsSync(local) ? rev(readFileSync(local, 'utf8')) : 0, now = rev(page);
if (!now) { console.log('not a diagram page'); process.exit(1); }
if (now > was) { writeFileSync(local, page); console.log('rev ' + now + ' updated'); }
else console.log('rev ' + was + ' unchanged');
