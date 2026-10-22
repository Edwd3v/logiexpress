# LogiExpress

Kit de **arquitectura e instrucciones para OpenCode** del proyecto académico LogiExpress (Python, Estructuras de Datos).

**Estado actual:** núcleo Python con grafo propio, BFS, DFS y Dijkstra; servicios de rutas; API REST FastAPI; y frontend React + TypeScript + Vite integrado mediante HTTP. Streamlit/Plotly se conserva como interfaz anterior durante la transición. La red y sus costos son ficticios; la visualización no representa coordenadas geográficas.

**Entrega:** las ramas `feature/fastapi-foundation` (`7fddb6e`), `feature/react-frontend` (`77f4050`) y `feature/react-fastapi-integration` (`2bdd815`) están publicadas. La integración es el candidato actual y todavía no se ha fusionado en `main`. Las revisiones RDD anteriores constan como incompletas, no aprobadas.

## Archivos iniciales

```text
logiexpress/
├── AGENTS.md
├── README.md
├── opencode.json
├── .opencode/
│   └── agents/
│       ├── architect.md
│       └── algorithm-reviewer.md
└── docs/
    ├── ARCHITECTURE.md
    ├── REQUIREMENTS.md
    ├── CONTRACTS.md
    ├── DECISIONS.md
    ├── IMPLEMENTATION_PLAN.md
    └── OPENCODE_GUIDE.md
```

El núcleo y la primera interfaz están implementados en `src/`, con pruebas en `tests/` y lanzador `app.py`.

## Primeros pasos

1. Instala Python 3.10 o posterior (la validación de esta integración se ejecutó con Python 3.13.5; Python 3.10 sigue pendiente).
2. Crea y activa un entorno virtual: `python -m venv .venv` y `source .venv/bin/activate`.
3. Instala el paquete y las herramientas de desarrollo dentro del entorno: `python -m pip install -e '.[dev]'`.
4. Inicia FastAPI desde la raíz del repositorio: `python -m uvicorn logiexpress.api.main:app --reload`.
5. En otra terminal, instala y ejecuta el frontend: `cd frontend && npm ci && npm run dev`. Vite reenvía `/api/*` a `http://127.0.0.1:8000`; `LOGIEXPRESS_API_TARGET` permite configurar otro destino local.
6. Abre la documentación interactiva en `http://127.0.0.1:8000/docs`. Para usar la interfaz anterior, ejecuta `streamlit run app.py`.
7. Ejecuta las verificaciones: `pytest -q`, `ruff check .` y, desde `frontend/`, `npm test` y `npm run build`.

## Uso del dashboard

Elegí origen, destino y algoritmo, o activá la comparación de los tres. El grafo conserva las mismas posiciones esquemáticas en cada ejecución; los costos son abstractos y ficticios. El camino resaltado y el orden de exploración se muestran por separado.

## API HTTP

FastAPI expone el escenario operativo ficticio de **18 nodos (A–R) y 33 conexiones no dirigidas** y delega los cálculos a `route_service`; no contiene implementaciones de BFS, DFS ni Dijkstra. Los pesos son costos abstractos ilustrativos, no distancias ni datos geográficos. El escenario se construye directamente en `src/logiexpress/infrastructure/sample_data.py`; la geometría SVG de React solo aporta posiciones y trazados visuales. `docs/prototypes/logiexpress_mapa_simulado_18_nodos.html` es la referencia aprobada para contrastar la topología, no una fuente de datos en tiempo de ejecución. La fixture académica original de seis nodos se conserva por separado mediante `build_academic_graph()`.

React obtiene nodos, conexiones y pesos desde `GET /api/graph`; resalta el camino devuelto por los servicios Python y mantiene separado su `visited_order`. BFS minimiza saltos, DFS muestra un camino posible sin garantizar optimalidad y Dijkstra minimiza el costo total con pesos no negativos. La comparación presenta los tres resultados sin declarar un ganador universal. Streamlit también consume el escenario operativo y los mismos servicios Python.

| Endpoint | Uso |
|---|---|
| `GET /api/health` | Comprueba que el proceso HTTP responde. |
| `GET /api/graph` | Devuelve los nodos y cada conexión no dirigida una sola vez. |
| `POST /api/routes/compute` | Calcula una ruta; ejemplo: `{"origin":"A","destination":"D","algorithm":"dijkstra"}`. |
| `POST /api/routes/compare` | Devuelve resultados separados para `bfs`, `dfs` y `dijkstra`; ejemplo: `{"origin":"A","destination":"D"}`. |

Las respuestas de rutas conservan `algorithm`, `origin`, `destination`, `visited_order`, `path`, `hops`, `total_weight` y `found`. Los campos métricos son `null` cuando no existe ruta. La API usa los mismos servicios y datos que la interfaz Streamlit.

Ejemplos con `curl`:

```bash
curl http://127.0.0.1:8000/api/health
curl http://127.0.0.1:8000/api/graph
curl -X POST http://127.0.0.1:8000/api/routes/compute \
  -H 'Content-Type: application/json' \
  -d '{"origin":"A","destination":"D","algorithm":"dijkstra"}'
curl -X POST http://127.0.0.1:8000/api/routes/compare \
  -H 'Content-Type: application/json' \
  -d '{"origin":"A","destination":"D"}'
```

No se habilita CORS mientras no exista el cliente React; cuando se integre en desarrollo, los orígenes exactos deberán configurarse explícitamente.

## Convenciones del repositorio

- **Nombres de archivos, directorios, módulos, clases y funciones en inglés**.
- **Contenido de documentación y explicación académica en español**.
- `AGENTS.md` es el archivo raíz de instrucciones; los agentes especializados viven en `.opencode/agents/`.
- Los documentos son propuestas hasta que el usuario y una rúbrica disponible ratifiquen las decisiones.

No edites `uv.lock` manualmente cuando sea generado por `uv`.
# logiexpress
# logiexpress
