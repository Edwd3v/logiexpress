# LogiExpress React dashboard

Standalone React + TypeScript + Vite dashboard. It is intentionally isolated from the pending FastAPI worktree.

## Run locally

```bash
npm ci
npm run dev
```

## Checks

```bash
npm test
npm run build
npm audit --registry=https://registry.npmjs.org
```

The current dashboard uses a visibly labeled local demonstration graph and fixed A → D snapshots. It does not call FastAPI or calculate BFS, DFS, or Dijkstra in the browser. `src/types/api.ts` documents the compatible FastAPI request and response contracts for a later, separately authorized integration.
