#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function parseArgs(argv) {
  const args = { subcommand: null, files: [], help: false, dryRun: false, out: null, framework: 'vitest', stack: null, new: null, update: false, since: null, format: 'openapi', source: null };
  let i = 0;
  while (i < argv.length) {
    const a = argv[i];
    if (a === '--help' || a === '-h') { args.help = true; }
    else if (a === '--dry-run') { args.dryRun = true; }
    else if (a === '--update') { args.update = true; }
    else if (a === '--new') { args.new = argv[++i]; }
    else if (a === '--out') { args.out = argv[++i]; }
    else if (a === '--framework') { args.framework = argv[++i]; }
    else if (a === '--stack') { args.stack = argv[++i]; }
    else if (a === '--since') { args.since = argv[++i]; }
    else if (a === '--format') { args.format = argv[++i]; }
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
skillpack code-scaffold — Generate tests, project scaffolds, docs, and boilerplate

SUBCOMMANDS
  skillpack code-scaffold --new <name> --stack "node express typescript"
  skillpack code-scaffold tests <file> [--framework vitest|jest|mocha]
  skillpack code-scaffold readme <dir> [--update]
  skillpack code-scaffold env <file>
  skillpack code-scaffold api-docs <dir> [--format openapi] [--out docs/api.yml]
  skillpack code-scaffold changelog [--since v1.0.0] [--out CHANGELOG.md]
  skillpack code-scaffold types <json-file> [--out types.ts]

OPTIONS
  --out <path>       Output file or directory
  --dry-run          Preview output without writing files
  --help, -h         Show this help
`);
}

function generateProject(name, stack) {
  const stacks = {
    'node express typescript': {
      dirs: ['src', 'src/routes', 'src/middleware', 'src/types', 'tests'],
      files: {
        'package.json': JSON.stringify({ name, version: '1.0.0', scripts: { build: 'tsc', dev: 'ts-node src/index.ts', test: 'vitest' }, dependencies: { express: '^4.18.0' }, devDependencies: { typescript: '^5.3.0', vitest: '^1.0.0', '@types/express': '^4.17.0', 'ts-node': '^10.9.0' } }, null, 2),
        'tsconfig.json': JSON.stringify({ compilerOptions: { target: 'ES2022', module: 'commonjs', outDir: './dist', rootDir: './src', strict: true, esModuleInterop: true } }, null, 2),
        '.gitignore': 'node_modules/\ndist/\n.env\n*.log',
        'src/index.ts': `import express from 'express';\n\nconst app = express();\nconst PORT = process.env.PORT || 3000;\n\napp.get('/', (req, res) => {\n  res.json({ status: 'ok' });\n});\n\napp.listen(PORT, () => {\n  console.log(\`Server running on port \${PORT}\`);\n});\n`,
        'README.md': `# ${name}\n\n## Setup\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n## Scripts\n\n- \`npm run build\` — Compile TypeScript\n- \`npm run dev\` — Start dev server\n- \`npm test\` — Run tests\n`,
      }
    },
    'default': {
      dirs: ['src', 'tests'],
      files: {
        'package.json': JSON.stringify({ name, version: '1.0.0', scripts: { test: 'node --test' } }, null, 2),
        '.gitignore': 'node_modules/\n.env\n*.log',
        'README.md': `# ${name}\n\n## Setup\n\n\`\`\`bash\nnpm install\n\`\`\`\n`,
      }
    }
  };

  const s = stacks[stack] || stacks['node express typescript'];
  const results = [];

  for (const dir of s.dirs) {
    const dirPath = path.join(process.cwd(), name, dir);
    fs.mkdirSync(dirPath, { recursive: true });
    results.push(`Created directory: ${name}/${dir}`);
  }

  for (const [file, content] of Object.entries(s.files)) {
    const filePath = path.join(process.cwd(), name, file);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
    results.push(`Created file: ${name}/${file}`);
  }

  return results;
}

function generateTests(sourceFile, framework) {
  const content = fs.readFileSync(sourceFile, 'utf-8');
  const funcMatches = content.match(/(?:function|const|let|var|exports\.)\s+(\w+)/g) || [];
  const funcs = funcMatches.map(m => m.replace(/^(?:function|const|let|var|exports\.)\s+/, '')).slice(0, 10);

  const imports = framework === 'vitest' ? "import { describe, it, expect } from 'vitest';" : framework === 'jest' ? '' : "const assert = require('assert');";
  const describe = framework === 'mocha' ? 'describe' : 'describe';
  const itFn = framework === 'mocha' ? 'it' : 'it';
  const expect = framework === 'vitest' || framework === 'jest' ? 'expect' : 'assert';

  const testCases = funcs.map(f => `  ${itFn}('${f} should work correctly', () => {\n    // TODO: Add test logic for ${f}\n    expect(true).toBe(true);\n  });`).join('\n\n');

  return `${imports}\n\ndescribe('${path.basename(sourceFile, path.extname(sourceFile))}', () => {\n${testCases || "  it('should be tested', () => {\n    expect(true).toBe(true);\n  });"}\n});\n`;
}

function generateReadme(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = entries.filter(e => e.isFile()).map(e => e.name);
  const dirs = entries.filter(e => e.isDirectory()).map(e => e.name);

  const hasPackage = files.includes('package.json');
  const hasTsConfig = files.includes('tsconfig.json');
  const hasTests = dirs.includes('tests') || dirs.includes('test') || dirs.includes('__tests__');

  let readme = `# ${path.basename(dir)}\n\n`;
  if (hasPackage) {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf-8'));
      readme += `${pkg.description || ''}\n\n`;
      if (pkg.scripts) {
        readme += `## Scripts\n\n`;
        for (const [cmd, script] of Object.entries(pkg.scripts)) {
          readme += `- \`npm run ${cmd}\` — ${script}\n`;
        }
        readme += '\n';
      }
    } catch (e) {}
  }

  readme += `## Structure\n\n\`\`\`\n`;
  readme += `${path.basename(dir)}/\n`;
  for (const d of dirs) readme += `  ${d}/\n`;
  for (const f of files) readme += `  ${f}\n`;
  readme += '```\n';

  return readme;
}

function generateEnvExample(envFile) {
  const content = fs.readFileSync(envFile, 'utf-8');
  return content.split('\n').map(line => {
    if (line.trim().startsWith('#') || line.trim() === '') return line;
    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) return line;
    const key = line.substring(0, eqIndex);
    return `${key}=`;
  }).join('\n');
}

function generateChangelog(since) {
  try {
    const log = execSync(`git log ${since ? since + '..' : ''}HEAD --pretty=format:"- %s (%h)" --no-merges`, { encoding: 'utf-8' });
    return `# Changelog\n\n## Recent Changes\n\n${log || 'No changes found.'}\n`;
  } catch (e) {
    return `# Changelog\n\nNo git history found.\n`;
  }
}

function generateTypes(jsonFile) {
  const data = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
  const sample = Array.isArray(data) ? data[0] : data;

  function jsonToTS(obj, indent = 0) {
    const pad = '  '.repeat(indent);
    let lines = [];
    for (const [key, val] of Object.entries(obj)) {
      if (val === null) lines.push(`${pad}${key}: null;`);
      else if (typeof val === 'string') lines.push(`${pad}${key}: string;`);
      else if (typeof val === 'number') lines.push(`${pad}${key}: number;`);
      else if (typeof val === 'boolean') lines.push(`${pad}${key}: boolean;`);
      else if (Array.isArray(val)) {
        if (val.length > 0 && typeof val[0] === 'object') {
          lines.push(`${pad}${key}: ${jsonToTS(val[0], indent + 1)}[];`);
        } else {
          lines.push(`${pad}${key}: ${typeof val[0] || 'any'}[];`);
        }
      } else if (typeof val === 'object') {
        lines.push(`${pad}${key}: ${jsonToTS(val, indent + 1)}`);
      }
    }
    return `{\n${lines.join('\n')}\n${pad}}`;
  }

  const typeName = path.basename(jsonFile, path.extname(jsonFile)).replace(/[^a-zA-Z0-9]/g, '');
  return `export interface ${typeName.charAt(0).toUpperCase() + typeName.slice(1)} ${jsonToTS(sample)}\n`;
}

function writeOutput(content, args, filename) {
  if (args.dryRun) {
    process.stderr.write('[dry-run] Would write output:\n');
    process.stdout.write(content);
    return;
  }
  if (args.out) {
    fs.mkdirSync(path.dirname(args.out), { recursive: true });
    fs.writeFileSync(args.out, content);
    process.stderr.write(`Written to ${args.out}\n`);
  } else {
    process.stdout.write(content);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { printHelp(); process.exit(0); }

  if (args.new) {
    const results = generateProject(args.new, args.stack);
    results.forEach(r => process.stderr.write(r + '\n'));
    process.exit(0);
  }

  if (!args.subcommand) { printHelp(); process.exit(0); }

  switch (args.subcommand) {
    case 'tests': {
      const file = args.files[0];
      if (!file || !fs.existsSync(file)) { console.error('Error: Source file not found.'); process.exit(1); }
      const testContent = generateTests(file, args.framework);
      const outFile = args.out || file.replace(/\.[^.]+$/, `.test${path.extname(file)}`);
      writeOutput(testContent, { ...args, out: outFile }, path.basename(outFile));
      break;
    }
    case 'readme': {
      const dir = args.files[0] || '.';
      if (!fs.existsSync(dir)) { console.error('Error: Directory not found.'); process.exit(1); }
      const readme = generateReadme(dir);
      writeOutput(readme, args, 'README.md');
      break;
    }
    case 'env': {
      const file = args.files[0];
      if (!file || !fs.existsSync(file)) { console.error('Error: .env file not found.'); process.exit(1); }
      const example = generateEnvExample(file);
      writeOutput(example, args, '.env.example');
      break;
    }
    case 'api-docs': {
      process.stdout.write('{ "openapi": "3.0.0", "info": { "title": "API", "version": "1.0.0" }, "paths": {} }\n');
      break;
    }
    case 'changelog': {
      const changelog = generateChangelog(args.since);
      writeOutput(changelog, args, 'CHANGELOG.md');
      break;
    }
    case 'types': {
      const file = args.files[0];
      if (!file || !fs.existsSync(file)) { console.error('Error: JSON file not found.'); process.exit(1); }
      const types = generateTypes(file);
      writeOutput(types, args, 'types.ts');
      break;
    }
    default:
      console.error(`Error: Unknown subcommand "${args.subcommand}"`);
      process.exit(1);
  }
}

main();
