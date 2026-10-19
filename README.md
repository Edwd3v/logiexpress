# LogiExpress

Kit de **arquitectura e instrucciones para OpenCode** del proyecto académico LogiExpress (Python, Estructuras de Datos).

**Estado actual del kit:** contiene documentos de diseño y configuración de agentes; **NO** incluye la aplicación Python construida, dependencias instaladas ni pruebas ejecutadas.

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

El código Python (`src/`, `tests/`, `app.py`, `pyproject.toml`) es una **estructura futura propuesta** descrita en `docs/ARCHITECTURE.md`; OpenCode lo irá creando por etapas autorizadas.

## Primeros pasos

1. Extrae el contenido del ZIP **dentro** del directorio raíz `logiexpress/`. Mantén la carpeta oculta `.opencode/`.
2. Si ya existen archivos con estos nombres, **revisa diferencias antes de sobrescribirlos**; fusiona instrucciones cuando sea necesario.
3. Lee `docs/ARCHITECTURE.md`, `docs/REQUIREMENTS.md` y `docs/DECISIONS.md`.
4. Abre OpenCode desde `logiexpress/`, en modo de planificación o diagnóstico, y usa el primer prompt de `docs/OPENCODE_GUIDE.md`.
5. Autoriza la creación del esqueleto y cada etapa por separado; exige pruebas y resultados reales.

## Convenciones del repositorio

- **Nombres de archivos, directorios, módulos, clases y funciones en inglés**.
- **Contenido de documentación y explicación académica en español**.
- `AGENTS.md` es el archivo raíz de instrucciones; los agentes especializados viven en `.opencode/agents/`.
- Los documentos son propuestas hasta que el usuario y una rúbrica disponible ratifiquen las decisiones.

No edites `uv.lock` manualmente cuando sea generado por `uv`.
