import pytest

from logiexpress.algorithms.bfs import bfs
from logiexpress.domain.graph import Graph


def make_graph(nodes, edges):
    graph = Graph()
    for node in nodes:
        graph.add_node(node)
    for source, target, weight in edges:
        graph.add_edge(source, target, weight)
    return graph


def test_single_node_graph_with_same_origin_and_destination():
    graph = make_graph(["A"], [])

    result = bfs(graph, "A", "A")

    assert result.path == ("A",)
    assert result.visited_order == ("A",)
    assert result.hops == 0
    assert result.total_weight == 0.0
    assert result.found is True


def test_same_origin_and_destination_in_larger_graph():
    graph = make_graph(["A", "B", "C"], [("A", "B", 2)])

    result = bfs(graph, "B", "B")

    assert result.path == ("B",)
    assert result.visited_order == ("B",)
    assert result.hops == 0
    assert result.total_weight == 0.0


def test_direct_path_has_one_hop():
    graph = make_graph(["A", "B"], [("A", "B", 4)])

    result = bfs(graph, "A", "B")

    assert result.path == ("A", "B")
    assert result.visited_order == ("A", "B")
    assert result.hops == 1
    assert result.total_weight == 4.0


def test_multi_hop_path_and_exploration_order_are_distinct():
    graph = make_graph(
        ["A", "B", "C", "D"],
        [("A", "B", 1), ("A", "C", 1), ("B", "D", 1)],
    )

    result = bfs(graph, "A", "D")

    assert result.path == ("A", "B", "D")
    assert result.visited_order == ("A", "B", "C", "D")
    assert result.hops == 2
    assert result.total_weight == 2.0


def test_cycles_do_not_repeat_nodes():
    graph = make_graph(
        ["A", "B", "C", "D"],
        [("A", "B", 1), ("B", "C", 1), ("C", "A", 1), ("C", "D", 1)],
    )

    result = bfs(graph, "A", "D")

    assert result.path == ("A", "C", "D")
    assert result.visited_order == ("A", "B", "C", "D")
    assert len(result.visited_order) == len(set(result.visited_order))


def test_unreachable_destination_returns_empty_path_metrics():
    graph = make_graph(["A", "B", "C"], [("A", "B", 1)])

    result = bfs(graph, "A", "C")

    assert result.found is False
    assert result.path is None
    assert result.hops is None
    assert result.total_weight is None
    assert result.visited_order == ("A", "B")


@pytest.mark.parametrize(("origin", "destination"), [("missing", "A"), ("A", "missing")])
def test_unknown_endpoint_raises_key_error(origin, destination):
    graph = make_graph(["A"], [])

    with pytest.raises(KeyError):
        bfs(graph, origin, destination)


def test_empty_graph_reports_unknown_origin_without_crashing():
    with pytest.raises(KeyError, match="A"):
        bfs(Graph(), "A", "B")


def test_equal_length_alternatives_use_sorted_neighbor_order():
    graph = make_graph(
        ["A", "B", "C", "D"],
        [("A", "C", 1), ("A", "B", 1), ("B", "D", 1), ("C", "D", 1)],
    )

    result = bfs(graph, "A", "D")

    assert result.path == ("A", "B", "D")
    assert result.hops == 2


def test_bfs_minimizes_hops_not_weight():
    graph = make_graph(
        ["A", "B", "C", "D"],
        [("A", "D", 20), ("A", "B", 1), ("B", "C", 1), ("C", "D", 1)],
    )

    result = bfs(graph, "A", "D")

    assert result.path == ("A", "D")
    assert result.hops == 1
    assert result.total_weight == 20.0


def test_zero_weight_edges_are_supported():
    graph = make_graph(["A", "B", "C"], [("A", "B", 0), ("B", "C", 0)])

    result = bfs(graph, "A", "C")

    assert result.path == ("A", "B", "C")
    assert result.total_weight == 0.0


def test_exploration_order_is_deterministic_and_stops_at_destination():
    graph = make_graph(
        ["A", "B", "C", "D", "E"],
        [("A", "D", 1), ("A", "B", 1), ("A", "C", 1), ("B", "E", 1)],
    )

    result = bfs(graph, "A", "E")

    assert result.visited_order == ("A", "B", "C", "D", "E")


def test_bfs_does_not_modify_graph():
    graph = make_graph(["A", "B", "C"], [("A", "B", 0)])
    before = {node: graph.neighbors(node) for node in graph.node_ids()}

    bfs(graph, "A", "C")

    after = {node: graph.neighbors(node) for node in graph.node_ids()}
    assert after == before
