# LogiExpress React dashboard

React + TypeScript + Vite dashboard integrated with the local FastAPI service. Route algorithms remain exclusively in Python.

## Run locally

Install the Python package and development tools from the repository root with `python -m pip install -e '.[dev]'`, then start FastAPI with `python -m uvicorn logiexpress.api.main:app --reload --host 127.0.0.1 --port 8000`. In a second terminal, run `npm ci` and `npm run dev` from `frontend/`. Vite forwards `/api/*` to `http://127.0.0.1:8000`; set `LOGIEXPRESS_API_TARGET` to use another local API address.

## Checks

```bash
npm test
npm run build
npm audit --registry=https://registry.npmjs.org
```

For a live responsive check, start FastAPI and Vite as above, then run `npm run test:responsive`. It uses Chrome DevTools viewport emulation at 390×844, 375×812, 768×1024, 1366×768, and 1440×900; set `CHROME_BIN` if Chromium is not on `PATH` and `LOGIEXPRESS_TEST_URL` if Vite uses another URL.

The dashboard fetches the graph and route results from FastAPI. `src/data/demoGraph.ts` is retained as fixture/demo material only; API failures never fall back silently to it. `src/data/algorithmDetails.ts` contains static explanatory labels, not route results. `src/types/api.ts` mirrors the API request/response contracts. The Python algorithms remain the only implementations; Streamlit is retained as the earlier interface.
