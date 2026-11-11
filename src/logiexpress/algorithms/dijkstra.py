"""Algoritmo de camino mínimo de Dijkstra para pesos no negativos.

Con una cola ``heapq`` perezosa y E aristas, la complejidad estándar es
O((V + E) log E) (a menudo se expresa como O((V + E) log V) para grafos
simples). Cada mejora estricta de distancia puede dejar una entrada obsoleta
en la cola; por eso puede contener O(E) entradas y el algoritmo usa espacio
auxiliar O(V + E), sin contar el grafo. Graph.neighbors() también ordena la
lista de adyacencia de cada nodo visitado, lo que agrega
O(sum(deg(v) * log(deg(v)))) en los nodos procesados (acotado por O(E log V)).
"""

from heapq import heappop, heappush
from itertools import pairwise
from math import inf

from logiexpress.algorithms.result import RouteResult
from logiexpress.domain.graph import Graph


def dijkstra(graph: Graph, origin: str, destination: str) -> RouteResult:
    """Devuelve una ruta de peso total mínimo para aristas finitas no negativas.

    Las entradas de la cola son ``(distance, node_id)``, lo que determina los
    empates de forma reproducible según el identificador. La relajación es
    estricta: las alternativas de igual costo no reemplazan a los predecesores,
    por lo que no se garantiza la ruta lexicográficamente menor entre todas las
    rutas óptimas. Se ignoran las entradas obsoletas y los nodos se agregan a
    ``visited_order`` solo cuando se finalizan mediante una entrada vigente de
    distancia mínima.
    """
    if not graph.has_node(origin):
        raise KeyError(origin)
    if not graph.has_node(destination):
        raise KeyError(destination)

    distances = {origin: 0.0}
    predecessors: dict[str, str] = {}
    finalized: set[str] = set()
    priority_queue = [(0.0, origin)]
    visited_order: list[str] = []

    while priority_queue:
        current_distance, current = heappop(priority_queue)
        if current_distance != distances[current] or current in finalized:
            continue

        finalized.add(current)
        visited_order.append(current)
        if current == destination:
            break

        for neighbor, weight in graph.neighbors(current):
            candidate_distance = current_distance + weight
            if candidate_distance < distances.get(neighbor, inf):
                distances[neighbor] = candidate_distance
                predecessors[neighbor] = current
                heappush(priority_queue, (candidate_distance, neighbor))

    if destination not in finalized:
        return RouteResult(
            algorithm="dijkstra",
            origin=origin,
            destination=destination,
            visited_order=tuple(visited_order),
            path=None,
            hops=None,
            total_weight=None,
            found=False,
        )

    reverse_path = [destination]
    while reverse_path[-1] != origin:
        reverse_path.append(predecessors[reverse_path[-1]])
    path = tuple(reversed(reverse_path))
    total_weight = sum(
        graph.weight(source, target) for source, target in pairwise(path)
    )

    return RouteResult(
        algorithm="dijkstra",
        origin=origin,
        destination=destination,
        visited_order=tuple(visited_order),
        path=path,
        hops=len(path) - 1,
        total_weight=total_weight,
        found=True,
    )
