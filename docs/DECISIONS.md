# Registro de decisiones arquitectónicas — LogiExpress

Este documento conserva el historial de propuestas y registra por separado las decisiones aprobadas. Las filas marcadas como propuestas no se consideran requisitos ratificados; ADR-013, ADR-014 y ADR-015 son decisiones aprobadas o implementadas según su estado.

| ID | Estado | Decisión | Motivo | Consecuencia / revisión |
|---|---|---|---|---|
| ADR-001 | Propuesta | Monolito Python modular | Menos configuración, código defendible | Separar carpetas por responsabilidad sin microservicios |
| ADR-002 | Propuesta | Grafo en lista de adyacencia propia | Expone estructuras de datos evaluables | `dict[str, dict[str, float]]`; pruebas de invariantes |
| ADR-003 | Propuesta | Grafo no dirigido inicialmente | Reduce complejidad del ejemplo académico | Revisar si rúbrica exige carreteras de un solo sentido |
| ADR-004 | Propuesta | Pesos finitos no negativos, cero permitido | Permite Dijkstra correcto | No usar Dijkstra si se requieren pesos negativos |
| ADR-005 | Propuesta | Vecinos ordenados por ID | Resultados reproducibles y pruebas deterministas | Explicar el efecto del orden en DFS y desempates |
| ADR-006 | Propuesta | BFS, DFS y Dijkstra propios, con `deque` y `heapq` | Evidencia de dominio de algoritmos | Bibliotecas de grafos solo para render/contraste |
| ADR-007 | Propuesta histórica; revisada por ADR-015 | Streamlit para la interfaz inicial | Reduce tiempo en front-end | Streamlit se conserva temporalmente; el cliente aprobado será React y consumirá FastAPI |
| ADR-008 | Propuesta | Datos de ejemplo en Python sin SQLite | Persistencia no es necesaria para el núcleo | Agregar SQLite únicamente si aporta a requisito confirmado |
| ADR-009 | Propuesta | `pytest`, `ruff` y `uv` | Reproducibilidad y mantenimiento | Verificar instalación antes de declarar pruebas o arranque |
| ADR-010 | Propuesta | Servicio simple de rutas + `RouteResult` común | Comparación transparente entre algoritmos | Evitar factory compleja / interfaces artificiales |
| ADR-011 | Propuesta | `app.py` como lanzador de Streamlit | Comando de arranque sencillo | No poner lógica de negocio en archivo raíz |
| ADR-012 | Propuesta | La UI muestra orden de visita y camino por separado | Diferencia conceptos frecuentemente confundidos | Documentar cuándo se detiene cada exploración |
| ADR-013 | Aprobada (2026-10-19) | Semantic Versioning con `pyproject.toml` como fuente de versión, changelog y tags anotados por incremento aprobado | Versiones locales verificables y entregas trazables | Funcionalidad en 0.x incrementa MINOR; corrección compatible incrementa PATCH; versión sin revisión obligatoria no se confirma |
| ADR-014 | Implementada (2026-10-19) | Dashboard Streamlit con visualización Plotly y posiciones esquemáticas deterministas | Facilita una demostración interactiva sin introducir mapas reales ni lógica algorítmica en UI | La interfaz consume servicios existentes; costos y ubicaciones se identifican como ficticios |
| ADR-015 | Aprobada (2026-10-20) | Evolución a frontend React + TypeScript + Vite, backend HTTP FastAPI y núcleo computacional Python; Streamlit coexistirá temporalmente | Separar la interfaz web futura del núcleo académico reutilizable y habilitar una API probada antes de iniciar React | Este incremento incorpora solo FastAPI y conserva Streamlit, algoritmos y servicios; no autoriza autenticación, microservicios, mapas, bases de datos ni otras funcionalidades |

**Compatibilidad de pruebas API (implementación 2026-10-20):** se usa FastAPI `>=0.115,<0.120` junto con HTTPX `>=0.27,<1`. FastAPI 0.156.0 resolvió Starlette 1.9.0, cuyo `TestClient` emitió una advertencia indicando que HTTPX está deprecado en favor de `httpx2`, paquete fuera del alcance aprobado. Se seleccionó FastAPI 0.119.1/Starlette 0.48.0, compatibles con el `TestClient` basado en HTTPX; se conserva una advertencia deprecada de AnyIO en Starlette, sin fallos de pruebas. Revisar este límite al actualizar FastAPI.

## Cambios al registro

Cada decisión aprobada debe incluir fecha, responsable y evidencia cuando exista. Para modificar una decisión, agregar una línea de seguimiento con: alternativa evaluada, costo/beneficio, impacto en módulos, pruebas necesarias y estado (`propuesto`, `aprobado`, `implementado`, `probado`).

## Vacíos de información pendientes

1. **Rúbrica oficial / tutorías:** no disponibles en los archivos consultados al crear el kit; contrastar su texto si aparecen.
2. **Naturaleza del peso:** costo genérico por ahora; decidir si será kilómetros, minutos u otra unidad con datos consistentes.
3. **Visualización:** resuelto para el MVP: Plotly con posiciones esquemáticas deterministas; no representa coordenadas geográficas.
4. **Video o sustentación:** se ha mencionado una demostración final, pero no está confirmado en una fuente vigente; no asignar duración ni formato obligatorios.
5. **Persistencia y datos reales:** no aprobados; el ejemplo es ficticio.
6. **Frontend React:** aprobado como siguiente interfaz, pero no se implementa en el incremento de base FastAPI.
