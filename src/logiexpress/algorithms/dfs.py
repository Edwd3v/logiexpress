"""Iterative depth-first search for one reproducible path.

Ordinary DFS traversal is O(V + E). Because ``Graph.neighbors()`` sorts each
returned neighborhood, the full traversal adds O(sum(deg(v) * log(deg(v))))
over expanded nodes (bounded by O(E log V)). Explicit frames, visited nodes,
predecessors, traversal order, and result path use O(V) storage; active frames
retain immutable neighbor snapshots from Graph, so auxiliary space is O(V + E)
in the worst case, excluding the graph itself.
"""

from collections.abc import Iterator
from itertools import pairwise

from logiexpress.algorithms.result import RouteResult
from logiexpress.domain.graph import Graph


def dfs(graph: Graph, origin: str, destination: str) -> RouteResult:
    """Return a depth-first path and node exploration order without recursion.

    Each stack frame holds one node and an iterator over its sorted neighbors.
    This preserves recursive DFS order: a neighbor is explored fully before
    its siblings are discovered. Nodes enter ``visited_order`` when their
    exploration begins. The search stops as soon as the destination is entered.
    Edge weights are only summed after path reconstruction; they never guide
    exploration and neither hop count nor total weight is guaranteed minimal.
    """
    if not graph.has_node(origin):
        raise KeyError(origin)
    if not graph.has_node(destination):
        raise KeyError(destination)

    visited = {origin}
    predecessors: dict[str, str] = {}
    visited_order = [origin]
    stack: list[tuple[str, Iterator[tuple[str, float]]]] = [
        (origin, iter(graph.neighbors(origin)))
    ]

    while stack and visited_order[-1] != destination:
        current, neighbors = stack[-1]
        try:
            neighbor, _weight = next(neighbors)
        except StopIteration:
            stack.pop()
            continue

        if neighbor in visited:
            continue

        visited.add(neighbor)
        predecessors[neighbor] = current
        visited_order.append(neighbor)
        if neighbor != destination:
            stack.append((neighbor, iter(graph.neighbors(neighbor))))

    if destination not in visited:
        return RouteResult(
            algorithm="dfs",
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
        algorithm="dfs",
        origin=origin,
        destination=destination,
        visited_order=tuple(visited_order),
        path=path,
        hops=len(path) - 1,
        total_weight=total_weight,
        found=True,
    )
