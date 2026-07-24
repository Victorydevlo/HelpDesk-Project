# RELAY — Helpdesk Simulator

A fully responsive, single-file React app that simulates working an IT helpdesk queue —
built as a Claude.ai artifact (React + Tailwind core utilities + `lucide-react` icons +
the artifact `window.storage` persistence API).

## Features
- Responsive ticket queue — sidebar + split view on desktop, stacked/bottom-nav on mobile
- Dark/light theme, adjustable density and text size
- AI-driven customer chat per ticket (calls the Anthropic Messages API from the artifact),
  with resolution-state tracking so the simulated customer stays consistent across turns
- Diagnostics terminal (`ping`, `ipconfig`, `nslookup`, `tracert`, `systeminfo`, `netstat`, `whoami`)
- Searchable knowledge base
- Dashboard with live SLA timers and volume/status breakdowns
- Settings: theme, density, font size, agent profile, SLA warning threshold, simulation reset
- Simulated incoming phone calls from CEOs/managers — accept or decline, live AI call
  transcript, auto-logs a ticket when you hang up

## Running it
This file is written as a Claude.ai **artifact** (`src/App.jsx`), so the easiest way to run it
is to paste `src/App.jsx` into a new Claude.ai React artifact.

To run it as a standalone app instead, drop it into a Vite + React + Tailwind project with
`lucide-react` installed, and either implement a `window.storage` polyfill (e.g. backed by
`localStorage`) or replace the `window.storage.get/set` calls with your own persistence.
