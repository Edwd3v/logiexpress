# Plan incremental para OpenCode — LogiExpress

**Estado:** plan propuesto, no ejecutado. No asignar fechas ni porcentajes sin datos oficiales.

## Política común por etapa

OpenCode debe revisar archivos existentes, trabajar sobre un alcance mínimo, escribir pruebas, ejecutar comprobaciones cuando el entorno lo permita y entregar resumen de cambios, `git diff` y salidas verificables. No iniciar la etapa siguiente automáticamente sin revisar los criterios de aceptación.

## Etapa 0 — Inspección y bootstrap mínimo

**Objetivo:** conocer estado real del repositorio y acordar decisiones arquitectónicas antes de introducir funcionalidad.

- Revisar estructura, Git, Python, OpenCode y herramientas disponibles.
- Contrastar documentos propuestos con cualquier rúbrica real que haya en el repositorio.
- Si el repositorio está vacío y el usuario autorizó el bootstrap, crear `pyproject.toml`, actualizar README inicial, estructura de paquete `src/` y primer test trivial de importación.
- No instalar muchas dependencias; `pytest` y `ruff` bastan en esta etapa. Streamlit puede esperar al momento de la UI.

**Aceptación:** estructura mínima coherente; imports funcionando si se ejecutó el entorno; comandos y resultados documentados; decisiones pendientes visibles.

## Etapa 1 — Modelo de grafo

**Módulos posibles:** `src/logiexpress/domain/graph.py`, errores de dominio solo si necesarios, `tests/test_graph.py`, `infrastructure/sample_data.py` si corresponde.

**Objetivo:** construir lista de adyacencia **propia** para un grafo ponderado, no dirigido y no negativo.

**Aceptación:** añadir nodos/aristas, consultar vecinos y pesos, simetría bidireccional, orden reproducible y validaciones de inválidos/duplicados/bucles; pruebas para vacío, ciclos y cero. El conjunto ficticio de `ARCHITECTURE.md` puede construirse para verificar la estructura.

**No incluir:** algoritmos, UI o persistencia en la misma entrega.

## Etapa 2 — Implementación BFS

**Módulos posibles:** `algorithms/result.py`, `algorithms/bfs.py`, `tests/test_bfs.py`.

**Objetivo:** cola FIFO `deque`, orden de visita, reconstrucción por predecesores, resultados normalizados.

**Aceptación:** mínimo de saltos, no óptimo por pesos necesariamente; casos de origen=destino, desconocidos, sin conexión, ciclos y orden de vecinos; verificar ejemplo A → E (BFS costo 11, 2 saltos).

## Etapa 3 — Implementación DFS

**Módulos posibles:** `algorithms/dfs.py`, `tests/test_dfs.py`.

**Objetivo:** demostrar exploración en profundidad, camino posible y ausencia de garantía de óptimo.

**Aceptación:** pila explícita o recursión, orden reproducible; casos de nodos inalcanzables y ciclos; en el ejemplo A → E, con DFS recursiva y orden de vecinos alfabético, costo esperado 10.

## Etapa 4 — Implementación Dijkstra

**Módulos posibles:** `algorithms/dijkstra.py`, `tests/test_dijkstra.py`.

**Objetivo:** distancias mínimas por suma de pesos no negativos, usando `heapq`.

**Aceptación:** rutas de menor costo, relajación, tratamiento de entradas obsoletas de heap, cero, empate, desconexión, validación de negativos; ejemplo A → E costo esperado 4 con camino `A → C → D → E`.

## Etapa 5 — Servicio y comparación

**Módulos posibles:** `services/route_service.py`, `tests/test_route_service.py`.

**Objetivo:** unificar consumo de algoritmos y hacer comparación académica sin duplicar lógica.

**Aceptación:** selección válida, resultados consistentes, manejo de errores y tabla comparativa con saltos, peso total y orden de visita. Añadir un argumento breve sobre por qué BFS, DFS y Dijkstra pueden discrepar.

## Etapa 6 — Interfaz y visualización

**Módulos posibles:** `app.py`, `ui/dashboard.py`, `ui/graph_view.py`, dependencias mínimas de Streamlit + una biblioteca de visualización.

**Objetivo:** interfaz funcional de una página con origen/destino, visualización y resultados.

**Aceptación:** usuario puede realizar una consulta del grafo ficticio, ver camino y orden de visita y distinguir algoritmo; errores se explican sin stack trace; el render no resuelve caminos por su cuenta.

## Etapa 7 — Evidencia y documentación

**Módulos:** README, registro de decisiones y documentación mínima.

**Aceptación:** comandos de instalación y arranque realmente comprobados, pruebas unitarias exitosas verificadas, limitaciones, complejidades, definición de 'óptimo' y ejemplo reproducible. Preparar sustentación solo cuando su formato haya sido confirmado.

## Etapa 8 — Base HTTP con FastAPI

**Estado:** aprobada; el incremento actual implementa esta etapa.

**Módulos:** `src/logiexpress/api/`, dependencias FastAPI/Uvicorn y HTTPX para pruebas, `tests/test_api.py`, contratos y README.

**Objetivo:** publicar el grafo y los servicios de rutas existentes mediante HTTP, sin duplicar el núcleo computacional ni retirar Streamlit.

**Aceptación:** endpoints de salud, consulta del grafo, cálculo individual y comparación; errores y esquemas documentados y probados. La API comparte `build_demo_graph()`, `run_route()` y `compare_routes()`.

## Etapa 9 — Frontend React

**Estado:** aprobado por ADR-015, posterior y fuera del incremento FastAPI.

**Stack previsto:** React + TypeScript + Vite, consumiendo la API FastAPI. No iniciar esta etapa hasta que el usuario la autorice como incremento.

## Comandos previstos (usar solo después de verificar herramientas y dependencias)

```bash
uv run pytest
uv run ruff check .
uv run streamlit run app.py
```

Si `uv` no existe, reportarlo y consultar antes de elegir un flujo alternativo. Ninguna instrucción de este documento significa que esos comandos ya se hayan ejecutado.

## Plantilla breve de cierre de etapa

```text
Etapa:
Archivos revisados / creados / modificados:
Criterios de aceptación alcanzados:
Pruebas ejecutadas y resultado real:
Comandos no ejecutados y motivo:
Decisiones tomadas y alternativas descartadas:
Diff o resumen verificable de cambios:
Pendientes / riesgos / siguiente etapa sugerida:
```
