"""Deterministic fictitious logistics network used by the dashboard."""

from logiexpress.domain.graph import Graph


def build_demo_graph() -> Graph:
    """Build the six-location demonstration graph with abstract costs."""
    graph = Graph()
    for node_id in ("A", "B", "C", "D", "E", "F"):
        graph.add_node(node_id)
    for source, target, weight in (
        ("A", "D", 20),
        ("A", "B", 4),
        ("B", "C", 4),
        ("C", "D", 4),
        ("A", "E", 1),
        ("E", "F", 1),
        ("F", "D", 1),
    ):
        graph.add_edge(source, target, weight)
    return graph
