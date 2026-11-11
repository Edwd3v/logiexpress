"""Deterministic fictitious logistics networks used by the application."""

from logiexpress.domain.graph import Graph


def build_demo_graph() -> Graph:
    """Build the eighteen-location operational graph with abstract costs."""
    graph = Graph()
    for node_id in "ABCDEFGHIJKLMNOPQR":
        graph.add_node(node_id)
    for source, target, weight in (
        ("A", "D", 20),
        ("A", "B", 4),
        ("B", "C", 4),
        ("C", "D", 4),
        ("A", "E", 1),
        ("E", "F", 1),
        ("F", "D", 1),
        ("A", "G", 3),
        ("G", "B", 4),
        ("B", "H", 3),
        ("H", "C", 3),
        ("C", "I", 2),
        ("I", "J", 3),
        ("J", "D", 4),
        ("D", "K", 3),
        ("K", "L", 2),
        ("L", "F", 2),
        ("F", "M", 2),
        ("M", "E", 3),
        ("E", "N", 3),
        ("N", "O", 2),
        ("O", "A", 3),
        ("B", "P", 3),
        ("P", "E", 2),
        ("P", "Q", 3),
        ("Q", "F", 3),
        ("Q", "R", 2),
        ("R", "C", 3),
        ("R", "D", 3),
        ("H", "R", 5),
        ("Q", "H", 4),
        ("N", "P", 4),
        ("R", "I", 3),
    ):
        graph.add_edge(source, target, weight)
    return graph


def build_academic_graph() -> Graph:
    """Build the original six-location graph for its academic examples."""
    graph = Graph()
    for node_id in "ABCDEF":
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
