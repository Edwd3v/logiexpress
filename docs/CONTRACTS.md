# Contratos funcionales y casos límite — LogiExpress

**Estado:** propuesta para revisión y posterior implementación; no son contratos ya probados.

## 1. Grafo

API sugerida, ajustable en Fase 0 antes de implementar:

```python
class Graph:
    def add_node(self, node_id: str, label: str | None = None) -> None: ...
    def add_edge(self, source: str, target: str, weight: float) -> None: ...
    def has_node(self, node_id: str) -> bool: ...
    def neighbors(self, node_id: str) -> tuple[tuple[str, float], ...]: ...
    def weight(self, source: str, target: str) -> float: ...
    def node_ids(self) -> tuple[str, ...]: ...
```

Propuesta de reglas:

- IDs: `str` no vacía, sin normalizaciones silenciosas. Definir en implementación si se recortan espacios o se rechazan.
- Nodos duplicados: error explícito. Intentar conectar nodos no creados: error explícito.
- Conexión no dirigida: `u → v` y `v → u` con el mismo peso.
- Prohibidos bucles `u == v`, aristas duplicadas y pesos negativos, `NaN` o infinitos.
- Permitido peso cero. En el MVP no hay aristas paralelas.
- `neighbors()` entrega vecinos ordenados lexicográficamente por ID. `node_ids()` también.
- Grafo vacío: estado válido; calcular ruta en él debe informar nodos desconocidos, sin colapsar la interfaz.
- Errores de dominio concretos pueden usar excepciones estándar al inicio (`ValueError`/`KeyError`) o tipos dedicados si aportan claridad. Elegir y documentar antes de escribir los tests.

## 2. Resultado común

Firma orientativa:

```python
from dataclasses import dataclass
from typing import Literal

AlgorithmName = Literal["bfs", "dfs", "dijkstra"]

@dataclass(frozen=True)
class RouteResult:
    algorithm: AlgorithmName
    origin: str
    destination: str
    visited_order: tuple[str, ...]
    path: tuple[str, ...] | None
    hops: int | None
    total_weight: float | None
    found: bool
```

Invariantes del resultado:

1. `visited_order` indica el orden real en que se expande/visita cada nodo **por primera vez**; documentar en la implementación el evento usado y aplicarlo consistentemente.
2. `path` representa el camino de origen a destino con sus extremos incluidos; `None` indica inalcanzable.
3. `hops = len(path) - 1` y `total_weight = suma(pesos de sus aristas)` si hay ruta.
4. Si no hay ruta: `path=None`, `hops=None`, `total_weight=None`, `found=False`.
5. Si `origin == destination`: `path=(origin,)`, `hops=0`, `total_weight=0.0`, `found=True`, `visited_order=(origin,)`.
6. En BFS `hops` es mínimo; `total_weight` es **descriptivo**, no necesariamente mínimo.
7. En DFS no se declara óptimo ni el número de saltos ni el costo.
8. En Dijkstra `total_weight` es mínimo entre caminos existentes con pesos no negativos.

## 3. Operaciones de algoritmos

```python
def bfs(graph: Graph, origin: str, destination: str) -> RouteResult: ...
def dfs(graph: Graph, origin: str, destination: str) -> RouteResult: ...
def dijkstra(graph: Graph, origin: str, destination: str) -> RouteResult: ...
```

Convención de terminación: detener cuando se alcanza el destino, sin recorrer innecesariamente todo el grafo. En BFS/DFS, ordenar vecinos por ID. Para DFS se **propone recursión** por facilidad académica (se aceptará pila iterativa si es más clara); si se usa DFS iterativo, mantener el mismo orden efectivo y evitar reconstrucciones de padres erróneas.

Para Dijkstra: iniciar distancia `origin=0`, demás infinito; heap con pares `(distancia, node_id)`, relajar cuando hay mejora estricta y omitir entradas obsoletas. Este desempate es determinista para la ejecución; **no promete** producir el camino lexicográficamente mínimo entre todas las rutas de igual costo.

## 4. Contrato del servicio

Interfaz propuesta:

```python
def run_route(graph: Graph, origin: str, destination: str, algorithm: str) -> RouteResult: ...
def compare_routes(graph: Graph, origin: str, destination: str) -> dict[AlgorithmName, RouteResult]: ...
```

`run_route()` acepta los identificadores `bfs`, `dfs` y `dijkstra`; un nombre desconocido produce `ValueError`, mientras que los errores del dominio se propagan. `compare_routes()` devuelve un diccionario en orden de inserción BFS, DFS y Dijkstra, con los resultados originales y sin elegir un ganador universal. Cada algoritmo conserva su propia semántica de `visited_order`. El servicio delega la búsqueda a los algoritmos y no modifica el grafo.

## 5. Matriz de pruebas obligatorias

| Escenario | Expectativa |
|---|---|
| Grafo vacío | Origen inválido reportado de manera controlada |
| Nodo desconocido | Error de entrada; nunca una ruta inventada |
| `origin == destination` | Ruta de un nodo, cero saltos y costo cero |
| Grafo desconectado | `found=False`, sin ruta/costo/saltos |
| Ciclo | Termina sin repetir visitas indefinidamente |
| Dos rutas con diferente número de saltos | BFS escoge menor cantidad de saltos |
| Ruta con menos saltos pero mayor costo | Dijkstra escoge la de menor suma de pesos |
| DFS en grafo con alternativas | Camino válido, sin promesa de mínimo |
| Empates | Resultado reproducible por orden de vecinos |
| Peso `0` | Aceptado por modelo y Dijkstra |
| Peso negativo | Rechazado al crear la arista; Dijkstra no debe operar sobre grafos inválidos |
| `NaN` o `inf` | Rechazado al ingresar arista |
| Arista duplicada | Rechazo explícito, sin reemplazar silenciosamente |
| Ejemplo A → E del documento de arquitectura | BFS costo 11; DFS costo 10; Dijkstra costo 4 |

## 6. Evidencia requerida

No alcanza con comprobar el costo total: verificar también `path`, `visited_order`, `hops` y `found`, además de la independencia respecto de Streamlit. Al concluir la fase, reportar comandos y resultados **realmente ejecutados**.
