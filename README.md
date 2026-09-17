# Amazon Clone

A responsive, Amazon-style storefront built with React, TypeScript, Vite, and React Router. It includes product discovery, search/filter/sort, product variants, a persistent cart, and a local demo checkout. It is not affiliated with Amazon and does not process real orders or payments.

## Setup

Requirements: Node.js 20.19+ and npm.

```bash
npm install
npm run dev
```

Vite prints the local URL after startup. Product/catalog data is bundled with the app; cart state is stored in the browser.

## Quality checks

```bash
npm run test
npm run typecheck
npm run lint
npm run build
npx playwright install chromium  # first E2E run only
npm run test:e2e
```

Use `npm run preview` to serve the production build locally after `npm run build`.
