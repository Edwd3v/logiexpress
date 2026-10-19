"""Application-level dispatch and comparison for route algorithms.

The service delegates all route logic to the algorithm modules. Comparison
results are inserted in the stable order ``bfs``, ``dfs``, ``dijkstra``; no
universal winner is selected. ``visited_order`` retains each algorithm's own
meaning: BFS dequeue order, DFS exploration-start order, and Dijkstra's
finalized-distance order.
"""

from collections.abc import Callable

from logiexpress.algorithms.bfs import bfs
from logiexpress.algorithms.dfs import dfs
from logiexpress.algorithms.dijkstra import dijkstra
from logiexpress.algorithms.result import AlgorithmName, RouteResult
from logiexpress.domain.graph import Graph

RouteAlgorithm = Callable[[Graph, str, str], RouteResult]

_ALGORITHM_ORDER: tuple[AlgorithmName, ...] = ("bfs", "dfs", "dijkstra")
_ALGORITHM_RUNNERS: dict[str, RouteAlgorithm] = {
    "bfs": bfs,
    "dfs": dfs,
    "dijkstra": dijkstra,
}


def run_route(
    graph: Graph, origin: str, destination: str, algorithm: str
) -> RouteResult:
    """Run one named route algorithm and return its original result.

    ``ValueError`` is raised for an unknown algorithm name. Domain and
    algorithm errors, including ``KeyError`` for unknown nodes, propagate.
    """
    try:
        runner = _ALGORITHM_RUNNERS[algorithm]
    except KeyError:
        raise ValueError(f"Unknown algorithm: {algorithm!r}") from None
    return runner(graph, origin, destination)


def compare_routes(
    graph: Graph, origin: str, destination: str
) -> dict[AlgorithmName, RouteResult]:
    """Run BFS, DFS, and Dijkstra on the same graph and endpoints.

    The insertion-ordered mapping uses stable algorithm identifiers. Every
    value is the algorithm's unmodified ``RouteResult``; unreachable paths
    retain their ``None`` metrics. No algorithm is selected as an overall
    winner, and the graph is only queried, never changed.
    """
    return {
        algorithm: run_route(graph, origin, destination, algorithm)
        for algorithm in _ALGORITHM_ORDER
    }
