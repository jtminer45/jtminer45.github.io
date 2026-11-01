# CLAUDE.md — Welcome to My World

Project rules for this portfolio site. Follow these for every file in this repo.

## Owner
Jonathan Miner — Mathematics and Computer Science graduate from Jos, Nigeria.
Hosted free on GitHub Pages at jtminer45.github.io.

## Hard rules
- Plain HTML, CSS, and JavaScript only. No frameworks, no build tools, no bundlers.
- The only outside library is Three.js, loaded from a CDN (used for the 3D globe only).
  JetBrains Mono is loaded from Google Fonts via a CSS `<link>` — that's a font, not a framework.
- No sound, no automatic GitHub syncing, no frameworks of any kind.
- The site must fully work without 3D: a plain list of repos is the fallback if Three.js
  doesn't load or a device can't handle it.

## Code style
- Comment every file for a beginner:
  - A header comment at the top of each file explaining what the file does.
  - A comment above each section and function explaining what it does.
  - `// EDIT ME` (or `<!-- EDIT ME -->` in HTML) on every line the owner is expected to
    personalize later (repo list entries, Formspree ID, social links, etc).
- Prefer simple, readable code over clever code. No cleverness for its own sake.

## Look
- Pure black background (`#000`).
- Neon blue (`#00e5ff`) text with a soft glow.
- Font: JetBrains Mono.
- Overall feel: a terminal.
- Colors are defined as CSS variables at the top of `style.css` — never hardcode a color
  elsewhere.

## Files
- `index.html` — page structure
- `style.css` — all styling, CSS variables at top
- `intro.js` — typing intro animation, skip button, plays once per visit
- `globe.js` — Three.js rotating Earth, repo orbit nodes, fallback repo list rendering
- `repos.js` — single source of truth array of repo objects, read by both the globe and
  the fallback list
- `contact.js` — Formspree contact form logic
- `README.md` — setup, editing, and publishing instructions

## Workflow
This site is built in 4 stages (structure/intro, 3D globe, repo nodes + fallback list,
bio/socials/contact + mobile polish). Each stage is previewed and approved before the next
begins.
