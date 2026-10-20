# LogiExpress

Kit de **arquitectura e instrucciones para OpenCode** del proyecto académico LogiExpress (Python, Estructuras de Datos).

**Estado actual:** núcleo Python con grafo propio, BFS, DFS y Dijkstra; servicios de rutas; dashboard Streamlit/Plotly; y API REST con FastAPI. La red y sus costos son ficticios; la visualización no representa coordenadas geográficas. React + TypeScript + Vite está aprobado para una etapa futura; Streamlit se conserva temporalmente.

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

1. Instala Python 3.10 o posterior.
2. Crea y activa un entorno virtual: `python -m venv .venv` y `source .venv/bin/activate`.
3. Instala el paquete y las herramientas de desarrollo dentro del entorno: `python -m pip install -e '.[dev]'`.
4. Ejecuta la aplicación Streamlit: `streamlit run app.py`.
5. Ejecuta la API en otra terminal con el entorno activado: `uvicorn logiexpress.api.main:app --reload`.
6. Abre la documentación interactiva en `http://127.0.0.1:8000/docs`.
7. Ejecuta las pruebas y el lint: `pytest -q` y `ruff check .`.

## Uso del dashboard

Elegí origen, destino y algoritmo, o activá la comparación de los tres. El grafo conserva las mismas posiciones esquemáticas en cada ejecución; los costos son abstractos y ficticios. El camino resaltado y el orden de exploración se muestran por separado.

## API HTTP

FastAPI expone el grafo ficticio compartido y delega los cálculos a `route_service`; no contiene implementaciones de BFS, DFS ni Dijkstra.

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
