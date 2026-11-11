# LogiExpress

Proyecto académico didáctico para representar una red logística ficticia y comparar BFS, DFS y Dijkstra. La arquitectura vigente es **React + TypeScript + Vite → FastAPI → servicios Python → dominio y algoritmos Python**. Streamlit/Plotly se conserva como interfaz anterior y reutiliza los servicios Python.

**Estado del código:** esta documentación corresponde a la rama `feature/logiexpress-visual-identity-b` (HEAD esperado `6e85f20274cd8b05b722de00840286cbcbde04f2`). Verificá la rama y el commit efectivos con `git status --short --branch` y `git rev-parse HEAD` antes de preparar una demostración. La rúbrica oficial del docente no está disponible en el repositorio, así que su cumplimiento permanece pendiente de validación.

## Requisitos

- Python 3.10 o posterior; la versión de Python usada en verificaciones anteriores fue 3.13.5.
- Node.js y npm compatibles con las dependencias fijadas en `frontend/package-lock.json`.
- Para las pruebas Python, instalar el extra de desarrollo del proyecto.

## Instalación y ejecución

Desde la raíz del repositorio, crea el entorno e instala el paquete:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -e '.[dev]'
```

Inicia FastAPI en una terminal:

```bash
python -m uvicorn logiexpress.api.main:app --reload --host 127.0.0.1 --port 8000
```

En otra terminal, instala y ejecuta React con Vite:

```bash
cd frontend
npm ci
npm run dev -- --host 127.0.0.1 --port 5173
```

Abre `http://127.0.0.1:5173/`. Vite reenvía `/api/*` a `http://127.0.0.1:8000`; `LOGIEXPRESS_API_TARGET` permite indicar otro destino local. La documentación interactiva de FastAPI está en `http://127.0.0.1:8000/docs`.

La interfaz anterior de Streamlit puede ejecutarse desde la raíz, con el mismo entorno Python:

```bash
streamlit run app.py
```

## Uso y alcance de la demostración

Selecciona origen, destino y algoritmo para calcular una ruta, o ejecuta la comparación BFS/DFS/Dijkstra. El tablero permite alternar entre la red completa, el camino devuelto y el orden de exploración; este último no es necesariamente un camino continuo.

El mapa es **esquemático**, no geográfico: sus posiciones y trazados solo sirven para visualizar el grafo. Las ubicaciones, conexiones y pesos son **datos ficticios**. Cada peso representa un **costo abstracto**, no kilómetros, tiempo ni costos operativos reales. El escenario de la API tiene 18 nodos (A–R) y 33 conexiones no dirigidas.

BFS busca el mínimo número de aristas, DFS presenta un camino posible sin garantía de optimalidad y Dijkstra minimiza el costo total con pesos no negativos. Ninguno resuelve optimización de entregas múltiples.

## API HTTP

FastAPI expone los servicios Python existentes; ni la API ni React reimplementan los algoritmos.

| Endpoint | Uso |
|---|---|
| `GET /api/health` | Comprueba que el proceso HTTP responde. |
| `GET /api/graph` | Devuelve nodos y conexiones no dirigidas, una vez cada una. |
| `POST /api/routes/compute` | Calcula una ruta; cuerpo de ejemplo: `{"origin":"A","destination":"D","algorithm":"dijkstra"}`. |
| `POST /api/routes/compare` | Devuelve los resultados separados de `bfs`, `dfs` y `dijkstra`; cuerpo: `{"origin":"A","destination":"D"}`. |

Las respuestas de ruta incluyen `algorithm`, `origin`, `destination`, `visited_order`, `path`, `hops`, `total_weight` y `found`. Si no existe ruta, `path`, `hops` y `total_weight` son `null`. Los pesos y resultados son ficticios y no describen una red logística real.

## Verificaciones

Desde la raíz del repositorio:

```bash
python -m pytest -q
ruff check .
git diff --check
```

Desde `frontend/`:

```bash
npm test
npm run build
```

La comprobación responsive integrada requiere iniciar FastAPI y Vite, y disponer de Chrome/Chromium. Consulta `docs/RESPONSIVE_VALIDATION.md` para sus instrucciones.

## Documentación del proyecto

- `docs/ARCHITECTURE.md`: módulos, dependencias y responsabilidades.
- `docs/CONTRACTS.md`: contratos y casos límite.
- `docs/REQUIREMENTS.md`: capacidades sintetizadas, no una rúbrica oficial.
- `docs/DECISIONS.md` y `docs/IMPLEMENTATION_PLAN.md`: decisiones y evolución prevista.
- `frontend/README.md`: ejecución y pruebas específicas del cliente web.

La arquitectura y el diseño aprobados delimitan el MVP. Persistencia, GPS, autenticación, despliegue complejo y optimización multidestino no forman parte de esta demostración.
