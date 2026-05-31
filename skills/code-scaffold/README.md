# code-scaffold

Generate unit tests, project scaffolds, READMEs, .env.example files, API docs, changelogs, and TypeScript types.

## What it replaces

The old way: Spend 2 hours setting up a new project (create folders, write config files, set up TypeScript, add ESLint, write README). Or: manually write unit tests for every function. Or: forget what changed since the last release and write a changelog from memory.

**skillpack replaces all of that with one command.**

## Installation

```bash
npm install -g skillpack
```

## Usage Examples

### Scaffold a new project
```bash
skillpack code-scaffold --new my-api --stack "node express postgres typescript"
```

**Output:**
```
Created directory: my-api/src
Created directory: my-api/src/routes
Created directory: my-api/src/middleware
Created directory: my-api/src/types
Created directory: my-api/tests
Created file: my-api/package.json
Created file: my-api/tsconfig.json
Created file: my-api/.gitignore
Created file: my-api/src/index.ts
Created file: my-api/README.md
```

### Generate unit tests
```bash
skillpack code-scaffold tests src/utils.ts --framework vitest
```

### Generate README from repo structure
```bash
skillpack code-scaffold readme . --update
```

### Create .env.example from .env
```bash
skillpack code-scaffold env .env > .env.example
```

**Output:**
```
DATABASE_URL=
API_KEY=
PORT=3000
NODE_ENV=
```

### Generate TypeScript types from JSON
```bash
skillpack code-scaffold types api-response.json --out src/types/api.ts
```

**Output:**
```typescript
export interface ApiResponse {
  id: number;
  name: string;
  email: string;
  active: boolean;
}
```

### Generate changelog from git log
```bash
skillpack code-scaffold changelog --since v1.2.0 --out CHANGELOG.md
```

## Supported Stacks

| Stack | Description |
|-------|-------------|
| `node express typescript` | Express API with TypeScript (default) |
| `node typescript` | Basic Node.js + TypeScript |
| `react typescript` | React app with TypeScript |

## Why this beats the old way

- **Consistent structure** — every project starts the same way
- **Test generation** — analyze source code and generate relevant test cases
- **Type safety** — generate TypeScript interfaces from actual data
- **Documentation** — READMEs that stay up to date with your code
- **Changelog automation** — no more manual release notes
