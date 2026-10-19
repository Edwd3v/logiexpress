"""Breadth-first search for paths with the fewest edges.

For V reachable nodes and E incident edges, ordinary BFS traversal is O(V + E).
This Graph implementation sorts every returned neighborhood, adding
O(sum(deg(v) * log(deg(v)))) across expanded nodes (bounded by O(E log V)).
The algorithm stores discovered nodes, predecessors, queue, visit order, and
result path in O(V) space, excluding the graph itself.
"""

from collections import deque
from itertools import pairwise

from logiexpress.algorithms.result import RouteResult
from logiexpress.domain.graph import Graph


def bfs(graph: Graph, origin: str, destination: str) -> RouteResult:
    """Return a shortest-by-hop route and the order nodes were expanded.

    Nodes are marked discovered when enqueued, ensuring each is queued once.
    ``visited_order`` records dequeue/expansion order, including the destination
    but excluding queued nodes that are not needed after the destination is
    reached. Neighbor weights describe the selected route only; they do not
    influence traversal order.
    """
    if not graph.has_node(origin):
        raise KeyError(origin)
    if not graph.has_node(destination):
        raise KeyError(destination)

    discovered = {origin}
    predecessors: dict[str, str] = {}
    queue = deque([origin])
    visited_order: list[str] = []

    while queue:
        current = queue.popleft()
        visited_order.append(current)
        if current == destination:
            break

        for neighbor, _weight in graph.neighbors(current):
            if neighbor not in discovered:
                discovered.add(neighbor)
                predecessors[neighbor] = current
                queue.append(neighbor)

    if destination not in discovered:
        return RouteResult(
            algorithm="bfs",
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
        algorithm="bfs",
        origin=origin,
        destination=destination,
        visited_order=tuple(visited_order),
        path=path,
        hops=len(path) - 1,
        total_weight=total_weight,
        found=True,
    )
