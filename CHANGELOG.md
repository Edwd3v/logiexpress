# Changelog

Los cambios se agrupan por versión. La versión del paquete se define en
`pyproject.toml`; los tags locales usan el prefijo `v`.

## [0.4.1] - 2026-10-19

### Fixed

- Al cambiar el algoritmo tras una comparación se conservan los resultados comparativos y se actualiza la ruta seleccionada.
- Colores de textos, pesos y leyenda del grafo fijados explícitamente para mantener contraste sobre el fondo claro de Plotly, independientemente del tema de Streamlit.
- Pruebas de ejecución individual, invalidación al cambiar extremos y no mutación del grafo durante la visualización.

## [0.4.0] - 2026-10-19

### Added

- Dashboard académico interactivo con Streamlit y visualización esquemática de la red mediante Plotly.
- Grafo ficticio reproducible, controles de origen/destino/algoritmo, ejecución individual y comparación de rutas.
- Pruebas unitarias de datos y figura, más interacciones del dashboard con Streamlit AppTest.

### Changed

- README actualizado con instalación y comandos para ejecutar la aplicación y las verificaciones.
- ADR-014 registra Plotly y las posiciones esquemáticas deterministas para el MVP.

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
