import pytest

from logiexpress.algorithms.bfs import bfs
from logiexpress.algorithms.dijkstra import dijkstra
from logiexpress.domain.graph import Graph


def make_graph(nodes, edges):
    graph = Graph()
    for node in nodes:
        graph.add_node(node)
    for source, target, weight in edges:
        graph.add_edge(source, target, weight)
    return graph


def test_single_node_graph():
    result = dijkstra(make_graph(["A"], []), "A", "A")

    assert result.path == ("A",)
    assert result.visited_order == ("A",)
    assert result.hops == 0
    assert result.total_weight == 0.0
    assert result.found is True


def test_origin_equal_to_destination():
    graph = make_graph(["A", "B", "C"], [("A", "B", 2)])

    result = dijkstra(graph, "B", "B")

    assert result.path == ("B",)
    assert result.visited_order == ("B",)
    assert result.hops == 0
    assert result.total_weight == 0.0


def test_direct_path():
    result = dijkstra(make_graph(["A", "B"], [("A", "B", 4)]), "A", "B")

    assert result.path == ("A", "B")
    assert result.visited_order == ("A", "B")
    assert result.hops == 1
    assert result.total_weight == 4.0


def test_multi_node_path():
    graph = make_graph(
        ["A", "B", "C", "D"],
        [("A", "B", 1), ("B", "C", 2), ("C", "D", 3)],
    )

    result = dijkstra(graph, "A", "D")

    assert result.path == ("A", "B", "C", "D")
    assert result.hops == 3
    assert result.total_weight == 6.0


def test_cycles_do_not_repeat_finalized_nodes():
    graph = make_graph(
        ["A", "B", "C", "D"],
        [("A", "B", 1), ("B", "C", 1), ("C", "A", 5), ("C", "D", 1)],
    )

    result = dijkstra(graph, "A", "D")

    assert result.path == ("A", "B", "C", "D")
    assert result.visited_order == ("A", "B", "C", "D")
    assert len(result.visited_order) == len(set(result.visited_order))


def test_unreachable_destination_returns_empty_path_metrics():
    graph = make_graph(["A", "B", "C"], [("A", "B", 1)])

    result = dijkstra(graph, "A", "C")

    assert result.found is False
    assert result.path is None
    assert result.hops is None
    assert result.total_weight is None
    assert result.visited_order == ("A", "B")


def test_empty_graph_rejects_unknown_origin():
    with pytest.raises(KeyError):
        dijkstra(Graph(), "A", "B")


@pytest.mark.parametrize(("origin", "destination"), [("missing", "A"), ("A", "missing")])
def test_unknown_endpoint_raises_key_error(origin, destination):
    graph = make_graph(["A"], [])

    with pytest.raises(KeyError):
        dijkstra(graph, origin, destination)


def test_zero_weight_edges_are_supported():
    graph = make_graph(["A", "B", "C"], [("A", "B", 0), ("B", "C", 0)])

    result = dijkstra(graph, "A", "C")

    assert result.path == ("A", "B", "C")
    assert result.total_weight == 0.0


def test_selects_lower_total_cost_over_more_expensive_alternative():
    graph = make_graph(
        ["A", "B", "C", "D"],
        [("A", "D", 9), ("A", "B", 2), ("B", "D", 2), ("A", "C", 1), ("C", "D", 8)],
    )

    result = dijkstra(graph, "A", "D")

    assert result.path == ("A", "B", "D")
    assert result.total_weight == 4.0


def test_equal_distance_nodes_are_processed_by_identifier():
    graph = make_graph(
        ["A", "B", "C", "D"],
        [("A", "C", 1), ("A", "B", 1), ("B", "D", 2), ("C", "D", 2)],
    )

    result = dijkstra(graph, "A", "D")

    assert result.visited_order == ("A", "B", "C", "D")
    assert result.path == ("A", "B", "D")


def test_heap_stale_entries_are_skipped_without_reprocessing_nodes():
    graph = make_graph(
        ["A", "B", "C", "Z"],
        [("A", "B", 10), ("A", "C", 1), ("C", "B", 1)],
    )

    result = dijkstra(graph, "A", "Z")

    assert result.found is False
    assert result.visited_order == ("A", "C", "B")
    assert result.visited_order.count("B") == 1


def test_result_reports_hops_and_weight_separately():
    graph = make_graph(
        ["A", "B", "C", "D"],
        [("A", "B", 1.25), ("B", "C", 2.5), ("C", "D", 3.25)],
    )

    result = dijkstra(graph, "A", "D")

    assert result.hops == 3
    assert result.total_weight == 7.0


def test_dijkstra_does_not_modify_graph():
    graph = make_graph(["A", "B", "C"], [("A", "B", 0)])
    before = {node: graph.neighbors(node) for node in graph.node_ids()}

    dijkstra(graph, "A", "C")

    after = {node: graph.neighbors(node) for node in graph.node_ids()}
    assert after == before


def test_bfs_can_use_fewer_hops_while_dijkstra_uses_lower_cost():
    graph = make_graph(
        ["A", "B", "C", "D", "E"],
        [("A", "B", 10), ("B", "D", 10), ("A", "C", 1), ("C", "E", 1), ("E", "D", 1)],
    )

    breadth_first = bfs(graph, "A", "D")
    least_cost = dijkstra(graph, "A", "D")

    assert breadth_first.path == ("A", "B", "D")
    assert breadth_first.found is True
    assert breadth_first.hops == 2
    assert breadth_first.total_weight == 20.0
    assert least_cost.path == ("A", "C", "E", "D")
    assert least_cost.visited_order == ("A", "C", "E", "D")
    assert least_cost.found is True
    assert least_cost.hops == 3
    assert least_cost.total_weight == 3.0


def test_zero_weight_cycle_does_not_create_predecessor_cycle():
    graph = make_graph(
        ["A", "B", "C", "D"],
        [("A", "B", 0), ("B", "C", 0), ("C", "A", 0), ("C", "D", 2)],
    )

    result = dijkstra(graph, "A", "D")

    assert result.path == ("A", "C", "D")
    assert result.total_weight == 2.0
    assert len(result.path) == len(set(result.path))


def test_graph_rejects_negative_weights_before_dijkstra_can_run():
    graph = make_graph(["A", "B"], [])

    with pytest.raises(ValueError):
        graph.add_edge("A", "B", -1)

    assert graph.neighbors("A") == ()
