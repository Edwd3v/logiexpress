# React–FastAPI Integration
Objective: Integrate the pending React dashboard with the FastAPI graph and route endpoints without changing either algorithm implementation.
Branch: `feature/react-fastapi-integration` | Delivery: `ask-on-risk` | Test runners: `uv run pytest`; `npm test`; `npm run build`.

## Specs

### S1 — API remains the sole algorithm source
User requirement: “FastAPI será la única fuente de resultados algorítmicos.”
Scope: React consumes `GET /api/graph`, `POST /api/routes/compute`, and `POST /api/routes/compare`; it must not implement BFS, DFS, or Dijkstra.
Acceptance: browser requests use the documented API shapes and render responses without local route calculations. Check: frontend tests, source scan, FastAPI API tests.

### S2 — Dynamic graph and route visualization
User requirement: “El SVG representará nodos y aristas dinámicos; las posiciones visuales serán responsabilidad del frontend.”
Scope: Build SVG nodes and weighted edges from the API graph and assign display-only frontend coordinates.
Acceptance: changing the API graph changes the SVG topology; layout code does not choose paths. Check: component tests with varying node/edge fixtures.

### S3 — Distinguish traversal and path
User requirement: “visited_order y path deben distinguirse visual y conceptualmente.”
Scope: Present service-provided traversal order and the actual route path as separate visual concepts.
Acceptance: `visited_order` never masquerades as a route; `path` drives route-edge highlighting; null path is rendered as unreachable. Check: focused UI tests for different orders, found/unfound results, and a one-node path.

### S4 — Fixtures are explicit only
User requirement: “Las fixtures permanecerán exclusivamente para pruebas o demostraciones explícitas.”
Scope: Keep demo fixtures out of the normal API-backed path and identify any explicit demo mode.
Acceptance: API failure never falls back silently to fixture data. Check: failure-state test and fixture/source-boundary review.

### S5 — Resilient asynchronous API states
User requirement: “La integración incluirá manejo de cargas, errores HTTP, fallos de conexión, solicitudes concurrentes y rutas inexistentes.”
Scope: Represent loading, HTTP/validation errors, connection failures, unreachable routes, and racing/stale requests.
Acceptance: stale responses cannot overwrite newer selections; pending/error/unreachable states are accessible and do not display stale results as current. Check: deferred-response race test plus HTTP/network/unreachable UI tests.

### S6 — Preserve the visual reference
User requirement: “El CSS del prototipo aprobado se conservará como referencia visual.”
Scope: Retain prototype-derived CSS and adjust only the minimum markup-specific styles needed for API states and dynamic SVG.
Acceptance: desktop/mobile layout remains responsive and recognizable; capture both viewports after implementation. Check: production build and Chromium screenshots when available.

## Tasks
- T1 — S1,S2,S3,S4: Copy the pending FastAPI and React source sets into this isolated worktree with provenance recorded; direct inline; pending; no commit yet.
- T2 — S1,S2,S3,S4,S5,S6: Add the API client, request state, dynamic SVG rendering, and distinct traversal/path presentation; direct inline; pending; no commit yet.
- T3 — S1,S2,S3,S4,S5,S6: Add regression/integration tests and run authorized checks; direct inline; pending; no commit yet.

## Log

### L1 — Original request
“# LogiExpress — Preparación de integración experimental

El bloqueo de Gentle AI RDD ha sido identificado y coincide con incidencias públicas relacionadas con `external.select_intended_untracked`.

No seguiremos intentando resolverlo mediante argumentos inventados o reintentos repetitivos.

## Decisión

Autorizo preparar un entorno local experimental independiente para integrar React y FastAPI, siempre que las políticas efectivas de RDD permitan realizar trabajo no consolidado.

Esta autorización NO permite omitir revisiones obligatorias, declarar aprobados los incrementos ni modificar las políticas del proveedor.

## Objetivo

Conseguir que el frontend React consuma datos reales de FastAPI y que BFS, DFS y Dijkstra se ejecuten exclusivamente en Python.

## Preparación

Verifica primero el estado de los tres espacios de trabajo.

Si es compatible con las restricciones del entorno, crea:

- Worktree: `../logiexpress-integration`
- Rama: `feature/react-fastapi-integration`
- Base: `main` confirmado.

Integra copias de los archivos necesarios de ambos incrementos pendientes, incluidos los archivos nuevos sin seguimiento, preservando sus originales.

No utilices commits ficticios, merges improvisados ni operaciones destructivas.

Documenta el origen de cada conjunto de archivos y las decisiones necesarias para resolver conflictos de integración.

## Implementación

Conecta React con los endpoints reales:

- `GET /api/graph`
- `POST /api/routes/compute`
- `POST /api/routes/compare`

Utiliza fetch nativo, contratos TypeScript y el proxy de Vite.

Haz que el SVG represente el grafo recibido desde la API y los caminos calculados por Python.

Diferencia visualmente `visited_order` y `path`.

Implementa estados de carga, errores HTTP, fallos de conexión, rutas inexistentes y protección frente a respuestas de solicitudes anteriores.

No utilices fixtures como sustituto silencioso de resultados reales.

## Verificación

Prueba los algoritmos individualmente, la comparación, la representación dinámica del grafo, los errores y la interfaz en escritorio y móvil.

Ejecuta las pruebas Python y React correspondientes, comprobación de tipos y build.

## Restricciones

Mantén intactos los worktrees originales.

No hagas commit, tag, push ni merge.

No desactives RDD ni alteres sus registros.

La integración experimental permanecerá pendiente de aprobación hasta cumplir las revisiones obligatorias o contar con un procedimiento alternativo formalmente autorizado.

Si RDD impide también esta preparación, detente e identifica la restricción exacta. No intentes sortearla.

## Entrega

Presenta el resultado de la integración local, verificaciones observadas, capturas si están disponibles y bloqueos restantes.

Distingue claramente implementación funcional de aprobación formal.”
