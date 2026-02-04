# Inbox Flow Frontend (InboxOS)

Inbox Flow is a workflow focused inbox UI that brings email, tasks, and calendar views into one place. This repo contains the frontend app for InboxOS.

**Key features**
- Inbox list and detail view
- Draft editor and quick actions
- Workflow board (kanban style)
- Calendar view
- Dashboard shortcuts and stats
- Command palette and theming

**Tech stack**
- Vite, React, TypeScript
- Tailwind CSS and shadcn-ui
- React Router, TanStack Query
- Radix UI, dnd-kit, Framer Motion

**Getting started**
1. Install dependencies: `npm i`
2. Start the dev server: `npm run dev`

The app will be available at `http://localhost:5173` by default.

**Environment variables**
Create a `.env` file (optional) to point to your backend API:

```env
VITE_API_URL=http://localhost:3000
```

If not set, the frontend defaults to `http://localhost:3000`.

**Scripts**
- `npm run dev` Start the dev server
- `npm run build` Build for production
- `npm run preview` Preview the production build
- `npm run test` Run tests
- `npm run lint` Lint the codebase

**Project structure**
- `src/pages` Route level screens (Dashboard, Inbox, Workflows, Calendar, Settings)
- `src/components` Reusable UI and feature components
- `src/lib` Shared types, API helpers, and utilities
- `src/index.css` Global styles and design system tokens
