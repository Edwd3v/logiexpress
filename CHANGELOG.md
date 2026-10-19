# Changelog

Los cambios se agrupan por versión. La versión del paquete se define en
`pyproject.toml`; los tags locales usan el prefijo `v`.

## [0.3.0] - 2026-10-19

### Added

- Servicio de ejecución individual y comparación estable de BFS, DFS y Dijkstra, conservando sus resultados `RouteResult`.
- Pruebas de despacho, propagación de errores, comparación, garantías de saltos/costos y preservación del grafo.

### Changed

- Contrato documentado del servicio actualizado a `run_route()` y comparación ordenada BFS, DFS y Dijkstra.

## [0.2.0] - 2026-10-19

### Added

- Dijkstra manual con `heapq`, relajación estricta, descarte de entradas obsoletas y reconstrucción de rutas de costo mínimo.
- Pruebas de rutas óptimas, empates, ciclos de peso cero, costo versus saltos y entradas obsoletas del heap.

## [0.1.0] - 2026-10-19

### Added

- Bootstrap del paquete Python con layout `src/`, configuración de pytest y Ruff.
- Modelo de grafo ponderado no dirigido con validación y pruebas unitarias.
- BFS manual con `deque`, resultado común y pruebas unitarias.
- DFS manual iterativo con pila de marcos, resultado común y pruebas unitarias.
- Políticas de versionamiento Semantic Versioning y revisión obligatoria de algoritmos.

### Changed

- Configuración del agente `algorithm-reviewer` migrada a permisos de solo lectura compatibles con OpenCode V2.
- Permiso de invocación limitado al agente `algorithm-reviewer` desde el agente primario del proyecto.
