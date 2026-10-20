# React–FastAPI Integration
Objective: Maintain the integrated React dashboard and FastAPI graph/route endpoints without changing either algorithm implementation.
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
User requirement: “El CSS del prototipo aprobado se conservará como referencia visual.” Also validate “390 × 844”, “375 × 812”, “768 × 1024”, “1366 × 768”, and “1440 × 900” in Chromium.
Scope: Retain prototype-derived CSS and adjust only the minimum markup-specific styles needed for API states and dynamic SVG.
Acceptance: desktop/mobile layout remains responsive and recognizable at all five requested CSS viewports; confirm exact viewport dimensions, no horizontal scrolling or clipped controls/content, and a usable Python result. Check: production build and automated Chromium DevTools viewport checks with screenshots.

## Tasks
- T1 — S1,S2,S3,S4: Copy the FastAPI and React source sets into this isolated worktree with provenance recorded; direct inline; completed; integration commit `2bdd815`.
- T2 — S1,S2,S3,S4,S5,S6: Add the API client, request state, dynamic SVG rendering, and distinct traversal/path presentation; direct inline; completed; integration commit `2bdd815`.
- T3 — S1,S2,S3,S4,S5,S6: Add regression/integration tests and run authorized checks; direct inline; completed; integration commit `2bdd815`; RDD reviews remain incomplete and Python 3.10 remains unverified.
- T4 — S6: Diagnose the mobile capture discrepancy, add exact-viewport Chromium overflow/control/result checks, capture comparison evidence, and correct integration documentation; direct inline; completed after 130 Python tests, 15 React tests, TypeScript/build, Ruff check, pip dependency check, and five-size Chromium validation; corrective commit `061beb2`; RDD review remains incomplete and Python 3.10 is unverified.

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

### L2 — Owner-authorized responsive and documentation corrections (2026-10-20)

“# LogiExpress — Correcciones previas al Pull Request

**Autorizo corregir los problemas identificados durante la auditoría del incremento React + FastAPI.**

El alcance queda estrictamente limitado al diseño adaptable y a la actualización de documentación.

## 1. Corregir el diseño móvil

La captura de Chromium a 390 × 844 evidencia contenido horizontalmente recortado.

Investiga y corrige la causa real del desbordamiento.

Revisa especialmente:

- Anchos fijos y `min-width`.
- Contenedores Flexbox y CSS Grid.
- Padding y márgenes.
- Barra lateral y encabezado.
- Panel de configuración.
- Grafo SVG.
- Tarjetas de resultados y métricas.
- Textos largos y controles.

**No ocultes el problema aplicando simplemente `overflow-x: hidden` al documento.**

El contenido debe permanecer visible y accesible. Cuando corresponda, reorganiza los componentes verticalmente.

Conserva la identidad visual del HTML aprobado.

Valida en Chromium:

- 390 × 844.
- 375 × 812.
- 768 × 1024.
- 1366 × 768.
- 1440 × 900.

Incluye una comprobación automatizada de ausencia de desbordamiento horizontal y una inspección visual real. Verifica que los controles y resultados sean utilizables.

## 2. Actualizar documentación

Corrige la información desactualizada en:

- `README.md`
- `docs/ARCHITECTURE.md`
- `AGENTS.md`
- `frontend/src/types/api.ts`
- `odd/tasks/react-fastapi-integration.md`

La documentación debe reflejar correctamente:

- React + TypeScript + Vite como frontend implementado.
- FastAPI como capa HTTP implementada.
- Python como núcleo de algoritmos.
- Integración real mediante API REST.
- Streamlit como interfaz anterior conservada temporalmente.
- Ramas publicadas y versión integrada pendiente de merge a `main`.

En el registro de tareas, actualiza los estados que ya se completaron, conservando el historial y las evidencias. No declares completadas revisiones que no se ejecutaron.

Mantén documentadas las revisiones RDD incompletas y la comprobación pendiente con Python 3.10.

## 3. Restricciones

- No modificar BFS, DFS ni Dijkstra.
- No cambiar los contratos públicos de FastAPI.
- No introducir funcionalidades nuevas.
- No agregar dependencias innecesarias.
- No hacer refactorizaciones generales.
- No alterar los worktrees originales de FastAPI o React.
- No modificar archivos antiguos únicamente para resolver los avisos preexistentes de formato.

Realiza los cambios en `feature/react-fastapi-integration`.

## 4. Verificaciones

Después de corregir:

1. Ejecuta las pruebas Python y React.
2. Verifica TypeScript y el build de producción.
3. Ejecuta Ruff y las comprobaciones de dependencias.
4. Prueba la comunicación real React–FastAPI.
5. Comprueba la adaptación móvil en navegador.
6. Confirma que las rutas y métricas continúen correspondiendo a los resultados Python.
7. Revisa el diff para asegurar que únicamente incluya los cambios autorizados.

Incluye capturas comparativas de antes y después para móvil.

## 5. GitHub

Si las verificaciones pasan y no aparecen defectos bloqueantes adicionales, **autorizo crear un commit correctivo y realizar push exclusivamente a `feature/react-fastapi-integration`**.

También reitero la autorización para crear el **Draft Pull Request** hacia `main`, utilizando una sesión de GitHub autenticada por los mecanismos normales del entorno.

Antes de crear el PR, comprueba que no exista uno equivalente.

Si el entorno no dispone de autenticación o permisos, proporciona el enlace de comparación y la descripción preparada.

No ejecutes el merge, no crees tags y no publiques releases.

## 6. Entrega esperada

Proporciona:

- Causa del recorte móvil.
- Archivos modificados.
- Correcciones aplicadas.
- Evidencia visual.
- Resultados reales de las pruebas.
- Commit correctivo y estado de publicación.
- URL del Draft PR, si pudo crearse.
- Riesgos y limitaciones restantes.

**Objetivo: resolver los defectos detectados, completar la validación y dejar el Pull Request listo para nuestra revisión final.**”

### L3 — Verification evidence (2026-10-20)

- Python: `../logiexpress/.venv/bin/python -m pytest -q` — 130 passed; one upstream Starlette deprecation warning.
- React: `npm test` — 3 files, 15 tests passed. `npm run build` — TypeScript and Vite production build passed.
- Python quality/dependencies: `ruff check .` passed; `pip check` reported no broken requirements. `ruff format --check .` still reports the same five pre-existing formatting findings in `docs/CONTRACTS.md`, `tests/test_bfs.py`, `tests/test_dfs.py`, `tests/test_dijkstra.py`, and `tests/test_route_service.py`; none were modified.
- Browser/integration: `npm run test:responsive` passed in Chromium at 390×844, 375×812, 768×1024, 1366×768, and 1440×900. It checked no horizontal overflow/clipping, usable controls, live FastAPI results, matching route/cost/hops, and SVG path highlighting. Comparison screenshots are in `docs/assets/`.
- Browser command: with FastAPI at `127.0.0.1:8107` and Vite proxying to it at `127.0.0.1:5178`, `CHROME_BIN=/snap/bin/chromium LOGIEXPRESS_TEST_URL=http://127.0.0.1:5178/ RESPONSIVE_SCREENSHOT_DIR=/tmp/opencode/logiexpress-responsive-final npm run test:responsive` — all five viewport cases passed; 390×844 output image confirmed at 390×844 pixels.
- Rollback boundary: this corrective unit is limited to `frontend/scripts/check-responsive.mjs`, its package script, the two responsive evidence images and their guide, and integration-state documentation/task records. Reverting those paths does not alter Python algorithms, API behavior, or dependency manifests.
- Corrective work-unit commit: `061beb2` (`fix(responsive): validate exact browser viewport and document integration`).
- Browser diagnosis: `--window-size=390,844` produced `innerWidth=500`, `innerHeight=757`, and `clientWidth=485`; explicit CDP device metrics produced the requested CSS viewport. No CSS change was needed.
- GitHub lookup: no issues were returned by the open/closed issue query and no PR exists for this head branch. The PR template skill requires an approved issue, so PR creation is blocked until an approved issue exists; no issue was created.
- Native RDD review remains incomplete; Python 3.10 remains unvalidated. The formatter findings are unchanged and pre-existing.
