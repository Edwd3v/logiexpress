# LogiExpress

Kit de **arquitectura e instrucciones para OpenCode** del proyecto académico LogiExpress (Python, Estructuras de Datos).

**Estado actual:** aplicación Python académica con grafo propio, BFS, DFS, Dijkstra, servicio de comparación y dashboard Streamlit/Plotly. La red y sus costos son ficticios; el dibujo no representa coordenadas geográficas.

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
2. Instala el proyecto y las herramientas de desarrollo: `python -m pip install -e '.[dev]'`.
3. Ejecuta la aplicación: `streamlit run app.py`.
4. Ejecuta las pruebas y el lint: `pytest -q` y `ruff check .`.

## Uso del dashboard

Elegí origen, destino y algoritmo, o activá la comparación de los tres. El grafo conserva las mismas posiciones esquemáticas en cada ejecución; los costos son abstractos y ficticios. El camino resaltado y el orden de exploración se muestran por separado.

## Convenciones del repositorio

- **Nombres de archivos, directorios, módulos, clases y funciones en inglés**.
- **Contenido de documentación y explicación académica en español**.
- `AGENTS.md` es el archivo raíz de instrucciones; los agentes especializados viven en `.opencode/agents/`.
- Los documentos son propuestas hasta que el usuario y una rúbrica disponible ratifiquen las decisiones.

No edites `uv.lock` manualmente cuando sea generado por `uv`.
