# Changelog

Los cambios se agrupan por versión. La versión del paquete se define en
`pyproject.toml`; los tags locales usan el prefijo `v`.

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
