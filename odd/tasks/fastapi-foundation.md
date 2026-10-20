# FastAPI Foundation
Objective: Add a tested HTTP API over the existing LogiExpress graph and route services while documenting the approved React/FastAPI direction and retaining Streamlit.
Branch: `feature/fastapi-foundation` | Delivery: `ask-on-risk`; no commit/tag/push without explicit authorization | Runner: `pytest -q`, `ruff check .`, `git diff --check`

## Specs

### S1 — Approved architecture
- User requirement: “Frontend: React + TypeScript + Vite. Backend HTTP: FastAPI. Núcleo computacional: Python existente. Interfaz Streamlit: conservada temporalmente como referencia funcional.”
- Acceptance: record the approved stack in `AGENTS.md`, `docs/DECISIONS.md`, `docs/ARCHITECTURE.md`, and README; explicitly keep Streamlit temporarily and preserve manual BFS, DFS, and Dijkstra implementations.
- Checks: document readback and architecture review.

### S2 — API endpoints and service delegation
- User requirements: `GET /api/health`, `GET /api/graph`, `POST /api/routes/compute`, `POST /api/routes/compare`.
- “Debe llamar al servicio existente `run_route()`.”
- “Debe llamar a `compare_routes()`.”
- “No implementes lógica algorítmica dentro de los endpoints.”
- Acceptance: graph nodes and unique undirected weighted edges come from `build_demo_graph()`; individual and comparison routes preserve every real `RouteResult` attribute; comparison keys are `bfs`, `dfs`, `dijkstra` without a universal winner.
- Checks: API integration tests against the existing services and real demo graph.

### S3 — Request, response, and error contracts
- User requirements: “Solicitudes con JSON inválido o campos incorrectos: 422”; “Algoritmos no reconocidos: 422”; “Identificadores de nodos inexistentes: 404”; “Nodos válidos sin ruta disponible: 200, con `found=false` y métricas `null`”; “Origen igual al destino: 200, con cero saltos y costo cero.”
- Acceptance: explicit Pydantic schemas, stable ordered graph serialization, strict node identifiers with no silent normalization, understandable consistent errors, and `None` serialized as JSON `null`.
- Checks: validation, unknown node, unreachable graph, same-node and serialization integration tests.

### S4 — Dependencies and scope
- User requirements: evaluate `fastapi`, `uvicorn`, and `httpx` for TestClient; use `pyproject.toml`; do not edit generated lock files; no Docker, database, authentication, or extra infrastructure.
- Acceptance: declare only required API runtime packages and HTTP test client in the development extra; no React implementation or new infrastructure.
- Checks: package metadata readback and actual server startup.

### S5 — Test coverage and compatibility
- User requires tests for graph serialization/no duplicate edges, all algorithms, service equivalence, comparison, same-node, unknown nodes, invalid algorithm, unreachable graph, `None` serialization, health, and existing regressions.
- Acceptance: use the same FastAPI dependency injection point to supply a small disconnected graph in tests; preserve Graph, RouteResult, algorithms, services, fake demo data, and Streamlit.
- Checks: focused API tests and full `pytest -q`.

### S6 — User documentation and validation
- User requires README instructions for installation, FastAPI startup, `/docs`, endpoint examples, continuing with Streamlit, and API/service/algorithm boundaries.
- User commands: `pytest -q`, `ruff check .`, `git diff --check`; verify actual FastAPI startup and `/docs`.
- Acceptance: commands and observed outcomes are reported honestly; propose the version increment without creating a commit, tag, or push.

## Tasks
- T1 — S1, S6; inline; complete; commit: none (not authorized). Updated architecture decision, agent guidance, architecture/implementation plan, README and Unreleased changelog. Read back; `git diff --check` passed.
- T2 — S2, S3, S4; inline; complete; commit: none (not authorized). Added Pydantic schemas, dependency-injected FastAPI endpoints and sanitized 404/422 handling; `.venv` has only requested direct dependencies plus necessary transitive packages; focused API tests: 17 passed.
- T3 — S5, S6; inline; pending review; commit: none (not authorized). Final `pytest -q`: 130 passed; `ruff check .`, targeted format check, `git diff --check`, and `pip check` passed. Live FastAPI and Streamlit health returned HTTP 200; API routes, `/docs`, and `/openapi.json` returned HTTP 200. Native assessment marked high because untracked files needed explicit selection; user selected all five, but the provider selection schema/capture operation was unavailable, so no review START was issued. Requested `@architect` delegation was denied by runtime.

Risk: item 3 (the change adds a public HTTP API contract consumed by clients).

## Log

### L1 — User request (verbatim)

“# LogiExpress — Continuar incremento FastAPI

La discrepancia del historial Git ha sido resuelta.

Confirmaciones del diagnóstico anterior:

- `main` local y remoto están sincronizados en `17fb317`.
- `32ec3b8` es ancestro de `17fb317`.
- El árbol de trabajo está limpio.
- La implementación SVG y sus pruebas están presentes.
- No existe un impedimento conocido para continuar.

**Autorizo crear la rama `feature/fastapi-foundation` desde el `main` actual.**

Retoma la tarea original **«LogiExpress — Incremento: Base de FastAPI»** y continúa con las fases pendientes.

## Prioridades

1. Crear y verificar la nueva rama de trabajo.
2. Actualizar `AGENTS.md` y la documentación de arquitectura para reflejar la aprobación de React + TypeScript + Vite y FastAPI.
3. Incorporar FastAPI dentro del paquete Python existente.
4. Exponer los endpoints previstos:
   - `GET /api/health`
   - `GET /api/graph`
   - `POST /api/routes/compute`
   - `POST /api/routes/compare`
5. Reutilizar `Graph`, `RouteResult`, `run_route()` y `compare_routes()` sin duplicar algoritmos.
6. Definir contratos Pydantic y manejo consistente de errores.
7. Implementar pruebas de integración de la API.
8. Documentar cómo ejecutar FastAPI y conservar Streamlit.
9. Ejecutar las verificaciones técnicas y comprobar el funcionamiento real de los endpoints.

## Restricciones

- No modificar innecesariamente los algoritmos.
- No eliminar ni reemplazar Streamlit.
- No crear todavía el frontend React.
- No introducir dependencias ajenas al incremento.
- No ejecutar commits ni push sin autorización.
- No modificar el historial Git.

Si durante la implementación identificas una discrepancia entre los contratos propuestos y los modelos reales, adapta el diseño de la API a los contratos existentes y documenta la decisión.

## Entrega esperada

Presenta los archivos modificados, contratos de API implementados, resultados de pruebas, verificación de arranque de FastAPI, compatibilidad con Streamlit y pendientes.

Solicita la revisión arquitectónica disponible en el proyecto.

**Continúa con la implementación; no repitas el diagnóstico de Git salvo que aparezca una nueva anomalía.**”

### L2 — Verification and review status (2026-10-20)

- Full suite: `129 passed`; one Starlette deprecation warning for `anyio.abc.BlockingPortal`.
- `ruff check .`, `ruff format --check src/logiexpress/api tests/test_api.py`, `git diff --check`, and `.venv/bin/python -m pip check` passed. No lockfile is present. Removed the orphaned `opentelemetry-api 1.45.1` that entered `.venv` during the initial FastAPI 0.156 compatibility trial; `pip check` remains clean.
- Live server checks: FastAPI `/api/health`, `/api/graph`, `/api/routes/compute`, `/api/routes/compare`, `/docs`, and `/openapi.json` returned HTTP 200. The graph contains 6 nodes and 7 unique edges. Streamlit `/_stcore/health` returned HTTP 200.
- Installed versions: FastAPI 0.119.1, Starlette 0.48.0, HTTPX 0.28.1, Uvicorn 0.54.0; package metadata is prepared as LogiExpress 0.6.0, not committed/tagged/published.
- Native RDD is on by default. Assessment reported `high_risk` because untracked files were not scoped. STATUS requested intended-untracked selection; user selected all five eligible paths, but the exact provider-bound selection JSON capture was unavailable. No START/review was run. The separate requested `@architect` review was denied by runtime. Both reviews remain pending; no commit, tag, or push was made.

### L3 — Final manual audit and version preparation (2026-10-20)

- Audited all 8 tracked modified files and all 5 untracked files (including the API implementation, schemas, tests, dependency declaration, docs, and feature record). Corrected an overbroad contract-doc statement about all HTTP errors and added coverage for unknown nodes on the compare endpoint. No remaining code or documentation blocker found; manual audit is not an independent review.
- Version 0.6.0 is set in `pyproject.toml` and FastAPI OpenAPI metadata; `CHANGELOG.md` labels it as local preparation only. No commit, tag, or publication was made.
- Reverification after audit corrections: `pytest -q` — 130 passed, one Starlette AnyIO deprecation warning; Ruff, targeted format check, `git diff --check`, and `pip check` passed. Editable install metadata and OpenAPI both report 0.6.0. Live FastAPI and Streamlit health checks passed; all requested API paths and docs returned HTTP 200.
- API concerns checked: service delegation and all `RouteResult` fields are preserved; graph edges serialize once; invalid algorithms and unknown route nodes map to 422/404; same-node and unreachable cases serialize correctly. Native high-risk review and independent architecture review remain pending, so the increment is not cleared for consolidation.
