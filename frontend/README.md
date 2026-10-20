# LogiExpress React dashboard

React + TypeScript + Vite dashboard integrated with the local FastAPI service. Route algorithms remain exclusively in Python.

## Run locally

Start FastAPI from the repository root with `uv run uvicorn logiexpress.api.main:app --reload --host 127.0.0.1 --port 8000`, then run `npm run dev` from `frontend/`. Vite forwards `/api/*` to `http://127.0.0.1:8000`; set `LOGIEXPRESS_API_TARGET` to use another local API address.

## Checks

```bash
npm test
npm run build
npm audit --registry=https://registry.npmjs.org
```

The dashboard fetches the graph and route results from FastAPI. `src/data/demoGraph.ts` contains fictional data only for tests or a separately explicit demonstration mode; API failures never fall back to fixtures. `src/data/algorithmDetails.ts` contains static explanatory labels, not route results. `src/types/api.ts` mirrors the API request/response contracts.
