# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This is the **frontend** of Warkop Mie Bara (React 18 + Vite 8 + Tailwind v4 + Zustand + axios + React Router 7).
The full project guide — domain rules, API, database, frontend architecture, and how to run the E2E suite — is
`CLAUDE.md` in the backend repo (`github.com/zaidandhul/warkop-mie-bara-backend`, usually checked out next to this
one as `../backend/CLAUDE.md`). Read it before changing anything here.

Frontend essentials:
- UI text is Indonesian. Prices shown in the client are display-only (`src/utils/price.js`); the server recomputes them.
- `npm run dev` (Vite :5173, proxies `/api` to `VITE_PROXY_TARGET`, default `http://localhost:3000`), `npm run build`,
  `npm run lint`, `npm test` (unit, `node:test`, `test/unit`), `npm run dev:e2e` + `npm run test:e2e` (Selenium,
  needs the backend test server; see `e2e/README.md`).
- Keep `data-testid` attributes when changing UI; the E2E suite selects elements by them. After a navigation,
  wait for elements (`waitVisible`): React Router 7 renders navigations in `startTransition`.
- Never commit `.env` or `e2e/.env.e2e`. Work on a feature branch and merge through a pull request.
