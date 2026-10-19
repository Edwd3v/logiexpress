# Requisitos y alcance propuesto — LogiExpress

**Estado:** síntesis inicial del contexto del proyecto, pendiente de validar contra la rúbrica original y tutorías. Este archivo **no** representa transcripciones ni requisitos oficiales verificados.

## Objetivo del MVP

Demostrar cómo se representa una red logística ficticia mediante un grafo y cómo funcionan y se comparan BFS, DFS y Dijkstra en una consulta entre origen y destino.

## Capacidades esperadas según el contexto comunicado

| ID | Capacidad | Estado de respaldo |
|---|---|---|
| REQ-01 | Representar ubicaciones como nodos y conexiones con peso | Contexto académico comunicado |
| REQ-02 | Permitir seleccionar origen y destino | Contexto académico comunicado |
| REQ-03 | Ejecutar BFS, DFS y Dijkstra con implementaciones propias | Contexto académico comunicado / decisión técnica propuesta |
| REQ-04 | Visualizar grafo, orden de visita y camino obtenido | Contexto académico comunicado |
| REQ-05 | Comparar resultados y explicar qué optimiza cada algoritmo | Contexto académico comunicado |
| REQ-06 | Incluir pruebas de estructuras de datos, algoritmos y casos límite | Propuesta de calidad técnica |
| REQ-07 | Usar Streamlit como interfaz | Propuesta arquitectónica, no requisito docente confirmado |

## Decisiones iniciales a validar

- Grafo no dirigido, sin bucles ni aristas paralelas.
- Pesos finitos y no negativos; su unidad se presenta como costo abstracto hasta definir datos.
- Orden de vecinos lexicográfico por ID para demostrar ejecuciones reproducibles.
- Datos ficticios locales; sin base de datos ni integraciones externas al inicio.

Consultar `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md` y `docs/DECISIONS.md` para detalles. Ante discrepancias con evidencia oficial, **priorizar la fuente original** y actualizar estos documentos antes de implementar.

## Fuera del alcance actual (no asumir)

Optimización global de múltiples entregas, seguimiento de paquetes, autenticación, mapas GPS, persistencia avanzada, APIs externas, flotas reales y requisitos de despliegue. Una sustentación o video debe verificarse con la rúbrica vigente antes de planificar duración o formato.
