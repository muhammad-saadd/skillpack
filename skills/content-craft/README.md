# content-craft

Proofread, translate, summarize, repurpose content, extract action items, and draft replies.

## What it replaces

The old way: Open Grammarly ($12/mo) → paste text → wait for suggestions → manually fix → copy back. Or: hire a translator ($0.10/word) → wait 3 days → get mediocre translation. Or: spend 2 hours turning a blog post into 5 social media posts.

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

### Proofread and fix a document
```bash
skillpack content-craft proofread docs/article.md --fix
```

**Output:**
```
Found 3 issues:
  Line 5: Possible typo: "teh" → "the"
  Line 12: Spelling: "recieve" → "receive"
  Line 23: Extra whitespace
```

### Summarize a research paper
```bash
skillpack content-craft summarize paper.pdf --style executive --length short
```

**Output:**
```markdown
## Executive Summary

This paper presents a novel approach to container orchestration...

Key findings include a 40% reduction in deployment time...
```

### Extract action items from meeting notes
```bash
skillpack content-craft actions meeting-notes.md --out actions.md
```

**Output:**
```
1. Schedule follow-up with engineering team
2. Update deployment pipeline configuration
3. Review security audit findings
```

### Repurpose blog post for social media
```bash
skillpack content-craft repurpose blog-post.md --to "twitter,linkedin"
```

### Create executive brief from notes
```bash
skillpack content-craft brief research-notes/ --length 500
```

## AI-Enhanced Features

Some features (translate, reply) work best with an AI CLI:
```bash
# With Claude Code/OpenCode
skillpack content-craft translate article.md --to es,fr,ar
skillpack content-craft reply email-thread.txt --intent "agree but push deadline"
```

## Why this beats the old way

- **No subscription fees** — runs locally, no cloud service needed
- **Instant proofreading** — fix grammar in seconds, not minutes
- **Smart summarization** — extracts key points automatically
- **Multi-format repurposing** — one post becomes 5 platform-specific pieces
- **Action extraction** — never miss a to-do from meeting notes again
