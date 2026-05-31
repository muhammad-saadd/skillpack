---
name: content-craft
version: 1.0.0
description: Proofread, translate, summarize, repurpose content, extract action items, draft replies
inputs: [md, txt, pdf, email]
outputs: [md, txt]
tools: [bash, read_file, write_file, pdftotext, jq, awk, sed]
---

## What it does
Proofreads and fixes grammar in markdown files, batch-translates documents, summarizes research papers and email threads, repurposes blog posts into social media variants, extracts action items from meeting notes, creates executive briefs from raw notes, and drafts email replies from thread context.

## Trigger phrases
- proofread this document
- fix grammar in markdown
- translate article to spanish
- summarize research paper
- convert blog to twitter thread
- extract action items from meeting notes
- create executive brief
- draft email reply
- repurpose content for linkedin
- translate to multiple languages
- clean up writing
- shorten this document
- create newsletter from blog post

## Usage
```bash
skillpack content-craft proofread docs/ --fix --lang en
skillpack content-craft translate article.md --to es,fr,ar --out ./i18n/
skillpack content-craft summarize paper.pdf --style executive --length short
skillpack content-craft repurpose blog-post.md --to "twitter,linkedin,newsletter"
skillpack content-craft actions meeting-notes.md --out actions.md
skillpack content-craft brief research-notes/ --format markdown --length 500
skillpack content-craft reply email-thread.txt --intent "agree but push deadline 2 weeks"
```

## Steps
1. Parse subcommand and input files
2. For proofread: scan text for grammar issues, typos, and style problems
3. For translate: [Requires AI CLI] delegate translation to the AI model
4. For summarize: extract key points and generate summary
5. For repurpose: adapt content format for target platform
6. For actions: parse meeting notes and extract action items
7. For brief: distill raw notes into executive summary
8. For reply: draft response based on thread context and intent

## Output
Processed text in the requested format. AI-dependent features (translate, reply) require use with Claude Code/OpenCode.
