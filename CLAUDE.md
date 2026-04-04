# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # Run ESLint

# Add a shadcn component
pnpm dlx shadcn@latest add <component-name>
```

## Stack

- **Next.js 16** — App Router, RSC enabled. Read `node_modules/next/dist/docs/` before touching routing or data fetching.
- **React 19** — use new React 19 APIs where appropriate.
- **Tailwind CSS v4** — configured via `@import "tailwindcss"` in `app/globals.css`, no `tailwind.config.*` file. All theme tokens (colors, radius, fonts) are CSS variables defined in `globals.css`.
- **shadcn/ui** — style: `radix-nova`, base color: `neutral`. Components land in `components/ui/`. Add new ones with the CLI, do not hand-write them.
- **TypeScript** — strict mode, path alias `@/*` maps to the repo root.

## Architecture

```
app/
  layout.tsx      # Root layout — fonts (Geist), global CSS
  globals.css     # Tailwind imports + all CSS variable tokens (light/dark)
  page.tsx        # Entry page
components/
  ui/             # shadcn primitives (generated, avoid manual edits)
lib/
  utils.ts        # cn() helper and shared utilities
```

CSS variables for theming live exclusively in `app/globals.css` under `:root` and `.dark`. The `@theme inline` block maps them into Tailwind utilities. Extend the design system there, not in component files.
