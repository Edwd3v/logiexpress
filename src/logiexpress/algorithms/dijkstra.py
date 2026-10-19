"""Dijkstra's shortest-path algorithm for non-negative edge weights.

With a lazy ``heapq`` and E edges, the standard bound is O((V + E) log E)
(commonly written O((V + E) log V) for simple graphs). Each strict distance
improvement can leave an obsolete heap entry, so the heap may contain O(E)
entries and the algorithm uses O(V + E) auxiliary space, excluding the graph.
Graph.neighbors() also sorts each visited node's adjacency list, adding
O(sum(deg(v) * log(deg(v)))) across processed nodes (bounded by O(E log V)).
"""

from heapq import heappop, heappush
from itertools import pairwise
from math import inf

from logiexpress.algorithms.result import RouteResult
from logiexpress.domain.graph import Graph


def dijkstra(graph: Graph, origin: str, destination: str) -> RouteResult:
    """Return a minimum-total-weight route for finite non-negative edges.

    Heap entries are ``(distance, node_id)``, providing deterministic ID-based
    tie ordering. Relaxation is strict; equal-cost alternatives do not replace
    predecessors, so this does not promise the lexicographically smallest path
    among all optimal paths. Stale heap entries are ignored, and nodes enter
    ``visited_order`` only when finalized by a current minimum-distance entry.
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
