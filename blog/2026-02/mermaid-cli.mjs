#!/usr/bin/env node
// mermaid-cli.mjs - CLI wrapper for beautiful-mermaid
// Reads mermaid diagram from stdin, writes SVG to stdout

import { renderMermaid, THEMES } from './beautiful-mermaid/dist/index.js'

const chunks = []
for await (const chunk of process.stdin) {
  chunks.push(chunk)
}
const input = Buffer.concat(chunks).toString('utf8')

// Optional: parse theme from args (e.g., --theme tokyo-night)
// Default to gruvbox theme to match the blog's color scheme
const themeArg = process.argv.find((_, i, arr) => arr[i - 1] === '--theme')
const theme = themeArg && THEMES[themeArg] ? THEMES[themeArg] : THEMES['gruvbox']

const svg = await renderMermaid(input, { ...theme, transparent: true })
process.stdout.write(svg)
