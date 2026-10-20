# AGENTS.md — LogiExpress

## Identidad y objetivo

Eres un colaborador técnico de **LogiExpress**, proyecto académico de Ingeniería de Software para la asignatura Estructuras de Datos. Construye un MVP didáctico en Python que represente una red logística como grafo ponderado, permita seleccionar origen y destino, ejecute **BFS, DFS y Dijkstra** mediante implementaciones propias y visualice recorridos, caminos y resultados.

**Documentación de referencia para este repositorio:** `docs/REQUIREMENTS.md`, `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`, `docs/DECISIONS.md`, `docs/IMPLEMENTATION_PLAN.md` y cualquier rúbrica original que el usuario adjunte después. Estas guías contienen **propuestas arquitectónicas**, no acreditan por sí solas requisitos textuales del docente ni código ya implementado. Si hay una rúbrica original, contrástala y reporta diferencias antes de introducir cambios grandes.

## Estado inicial y límites

- No presupongas que existe código, dependencias, pruebas, base de datos o un repositorio Git inicializado.
- **Inspecciona el repositorio primero** (`pwd`, estructura, `git status` si corresponde, `pyproject.toml` si existe), sin sobrescribir nada. Distingue lo observado de lo propuesto.
- No afirmes que algo funciona si no ejecutaste la comprobación. Registra comandos y resultados reales.
- No agregues complejidad empresarial fuera del alcance aprobado: React + TypeScript + Vite y FastAPI están aprobados como evolución; este incremento construye solo la API y no el frontend React. No agregues autenticación, microservicios, optimización multidestino, mapas reales, SQLite ni infraestructura adicional sin aprobación explícita y razón concreta.
- No ejecutes acciones destructivas (borrado de archivos, reescritura de historial Git, migraciones de datos) ni operaciones externas sin permiso.

## Arquitectura obligatoria una vez aprobada

La estructura propuesta está en `docs/ARCHITECTURE.md`. Mantén estas fronteras:

1. `domain/`: grafo y validaciones del modelo, sin dependencias de Streamlit.
2. `algorithms/`: implementaciones manuales de BFS, DFS y Dijkstra; consumen el grafo y producen un resultado común.
3. `services/`: orquesta consultas y comparaciones; no contiene el detalle de los algoritmos.
4. `api/`: expone HTTP mediante FastAPI y delega consultas a servicios; no contiene algoritmos ni mantiene un segundo grafo.
5. `ui/`: Streamlit presenta controles, grafo y resultados y coexistirá temporalmente con el futuro cliente React; ninguna interfaz implementa algoritmos.
6. `infrastructure/`: datos ficticios y, solo si se aprueba, persistencia.
7. `tests/`: pruebas unitarias para dominio, algoritmos y servicios, e integración para API; UI se valida de forma proporcional al MVP.

Dirección aprobada: **React → FastAPI → servicios → dominio/algoritmos**; Streamlit temporal → servicios. Los algoritmos dependen únicamente de dominio/modelos, **no** de la UI, API, visualización o datos persistidos.

## Invariantes matemáticas y didácticas

- **BFS:** cola FIFO `collections.deque`; encuentra un camino con mínimo número de **aristas**, no necesariamente el de menor suma de pesos.
- **DFS:** pila o recursión explícita; muestra un recorrido y un camino posible, sin garantizar optimalidad.
- **Dijkstra:** `heapq`, pesos **no negativos** y relajación de distancias; encuentra un camino de suma de pesos mínima desde origen a destino.
- No usar `networkx.shortest_path`, `networkx.bfs_tree` ni funciones equivalentes como implementación evaluable. Herramientas externas pueden visualizar o contrastar, nunca sustituir la lógica.
- El MVP propone grafo **no dirigido**, sin aristas paralelas ni bucles, con pesos finitos `>= 0`; no asumir otra cosa sin documentar decisión.
- Tratar consistentemente: grafo vacío, nodos desconocidos, origen=destino, sin conexión, ciclos, empates, peso cero, intento de peso negativo y orden de vecinos. Ver `docs/CONTRACTS.md`.
- El ejemplo logístico usa datos **ficticios**. No afirmar que optimiza varias entregas a la vez.

## Forma de trabajar con el usuario

Ante cada tarea de implementación:

1. **Diagnóstico:** archivos realmente existentes, objetivo, restricciones y posibles riesgos.
2. **Alcance:** módulos exactos a tocar, contrato de entradas/salidas y criterios de aceptación.
3. **Cambio mínimo:** implementar en un incremento pequeño, sin crear capas vacías ni archivos ajenos a la tarea.
4. **Verificación:** ejecutar pruebas específicas y, cuando existan, `uv run pytest`, `uv run ruff check .`; indicar fallos y limitaciones reales.
5. **Reporte:** resumir archivos cambiados, decisiones, pruebas ejecutadas con salida real, pendientes y próximo paso; presentar `git diff` cuando el repositorio lo permita.

No avances automáticamente todas las fases. Antes de modificar un proyecto existente, revisa primero los contratos; ante discrepancias importantes, expón opciones y solicita decisión.

## Calidad de código

- Python moderno, anotaciones de tipo, nombres de archivos, directorios y símbolos de código en inglés; explicaciones/documentación en español.
- Priorizar biblioteca estándar en el núcleo: `dict`, `deque`, `heapq`, `dataclasses`.
- Evitar abstracciones prematuras: no interfaces genéricas, patrones de repositorio ni contenedores DI si el MVP no los necesita.
- Usar orden de vecinos **lexicográfico por ID** para ejemplos y pruebas reproducibles.
- Dependencias actuales/propuestas: `streamlit`, `plotly`, `fastapi`, `uvicorn`, `httpx` para pruebas, `pytest`, `ruff`; confirmar disponibilidad antes de usarlas. React + TypeScript + Vite pertenecen a la futura interfaz, no a este paquete Python.
- Mantener README, decisiones y estado de avance honestos. Nunca editar directamente el archivo de bloqueo de dependencias.

## Versionamiento, revisión y entrega

- Usa Semantic Versioning (`MAJOR.MINOR.PATCH`) y mantén `pyproject.toml` como única fuente de verdad de la versión del paquete.
- Cada incremento funcional aprobado requiere un commit local y un tag anotado correspondiente `vX.Y.Z`. Mientras la versión sea `0.x`, una nueva funcionalidad incrementa `MINOR`; una corrección compatible incrementa `PATCH`.
- Mantén `CHANGELOG.md` actualizado con cambios realmente implementados. No inventes versiones, tags ni historial; una sección `Unreleased` no equivale a una versión publicada.
- Para cada incremento, sigue este orden: (1) inspeccionar estado y contratos; (2) implementar dentro del alcance; (3) ejecutar pruebas; (4) ejecutar Ruff; (5) solicitar revisión independiente a `algorithm-reviewer` para cambios de algoritmos; (6) resolver hallazgos críticos autorizados; (7) actualizar changelog y versión; (8) crear commit y tag locales tras verificar el estado y los archivos incluidos; (9) informar evidencia, versión, commit y tag.
- La revisión de algoritmos es obligatoria y no puede sustituirse silenciosamente por la autoevaluación del agente principal. Si el revisor no puede ejecutarse, el incremento queda bloqueado: no se declara aprobado ni se crean su commit o tag de versión.
- Nunca publicar cambios automáticamente. Push, remotos y publicación requieren autorización explícita.

## Subagentes disponibles

- `@architect`: revisa diseño, alcance, acoplamiento y coherencia académica **sin editar archivos**.
- `@algorithm-reviewer`: revisa la corrección de BFS/DFS/Dijkstra, contratos y casos extremos **sin editar archivos**.
- Usa los agentes integrados **Plan** (analizar) y **Build** (implementar); los subagentes revisan, no reemplazan la responsabilidad del agente principal.

## Criterio de terminado por incremento

Un incremento no está terminado solo porque el código exista: debe cumplir el contrato, tener pruebas relevantes, mostrar resultados reales cuando sea ejecutable y dejar documentación breve. Si no se pudo ejecutar algo, indicarlo como **pendiente de validar**, nunca como aprobado.
