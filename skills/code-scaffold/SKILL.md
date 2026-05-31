---
name: code-scaffold
version: 1.0.0
description: Generate unit tests, project scaffolds, READMEs, .env.example, API docs, changelogs, and TypeScript types
inputs: [js, ts, json, env, directory]
outputs: [js, ts, md, yml, env]
tools: [bash, read_file, write_file]
---

## What this skill does
Scaffolds new projects, generates unit tests for existing code, creates READMEs from repo structure, strips .env values to create .env.example, generates API docs from source, creates changelogs from git log, and builds TypeScript interfaces from JSON samples.

## Trigger phrases
- generate unit tests
- scaffold new project
- create project structure
- generate README from repo
- create .env.example
- generate API documentation
- create changelog from git
- generate TypeScript types from JSON
- add tests to file
- set up new node project
- create project boilerplate
- generate test suite
- scaffold express api
- create typescript interface

## Usage
```bash
skillpack code-scaffold --new my-api --stack "node express postgres typescript"
skillpack code-scaffold tests src/utils.ts --framework vitest
skillpack code-scaffold readme . --update
skillpack code-scaffold env .env > .env.example
skillpack code-scaffold api-docs src/ --format openapi --out docs/api.yml
skillpack code-scaffold changelog --since v1.2.0 --out CHANGELOG.md
skillpack code-scaffold types api-response.json --out src/types/api.ts
```

## Steps
1. Parse subcommand and arguments
2. For --new: create directory structure, config files, README, .gitignore based on stack
3. For tests: analyze source file, generate test file with test cases
4. For readme: scan directory structure, generate README.md
5. For env: read .env file, strip values, keep keys and comments
6. For api-docs: parse source files, generate OpenAPI spec
7. For changelog: read git log since specified version, format as changelog
8. For types: parse JSON structure, generate TypeScript interface definitions
9. Write output to --out or stdout

## Output
Generated code files, documentation, or configuration in the requested format.
