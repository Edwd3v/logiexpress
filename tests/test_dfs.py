import pytest

from logiexpress.algorithms.bfs import bfs
from logiexpress.algorithms.dfs import dfs
from logiexpress.domain.graph import Graph


def make_graph(nodes, edges):
    graph = Graph()
    for node in nodes:
        graph.add_node(node)
    for source, target, weight in edges:
        graph.add_edge(source, target, weight)
    return graph


def test_single_node_graph():
    result = dfs(make_graph(["A"], []), "A", "A")

    assert result.path == ("A",)
    assert result.visited_order == ("A",)
    assert result.hops == 0
    assert result.total_weight == 0.0
    assert result.found is True


def test_origin_equal_to_destination_in_larger_graph():
    graph = make_graph(["A", "B", "C"], [("A", "B", 2)])

    result = dfs(graph, "B", "B")

    assert result.path == ("B",)
    assert result.visited_order == ("B",)
    assert result.hops == 0
    assert result.total_weight == 0.0


def test_direct_path():
    result = dfs(make_graph(["A", "B"], [("A", "B", 3)]), "A", "B")

    assert result.path == ("A", "B")
    assert result.visited_order == ("A", "B")
    assert result.hops == 1
    assert result.total_weight == 3.0


def test_path_with_multiple_nodes_tracks_exploration_separately():
    graph = make_graph(
        ["A", "B", "C", "D", "E"],
        [("A", "B", 2), ("B", "C", 3), ("C", "D", 4), ("A", "E", 1)],
    )

    result = dfs(graph, "A", "D")

    assert result.path == ("A", "B", "C", "D")
    assert result.visited_order == ("A", "B", "C", "D")
    assert result.hops == 3
    assert result.total_weight == 9.0


def test_cycles_do_not_revisit_nodes():
    graph = make_graph(
        ["A", "B", "C", "D"],
        [("A", "B", 1), ("B", "C", 1), ("C", "A", 1), ("C", "D", 1)],
    )

    result = dfs(graph, "A", "D")

    assert result.path == ("A", "B", "C", "D")
    assert result.visited_order == ("A", "B", "C", "D")
    assert len(result.visited_order) == len(set(result.visited_order))


def test_unreachable_destination_returns_no_path_or_metrics():
    graph = make_graph(["A", "B", "C"], [("A", "B", 1)])

    result = dfs(graph, "A", "C")

    assert result.found is False
    assert result.path is None
    assert result.hops is None
    assert result.total_weight is None
    assert result.visited_order == ("A", "B")


@pytest.mark.parametrize(("origin", "destination"), [("missing", "A"), ("A", "missing")])
def test_unknown_endpoint_raises_key_error(origin, destination):
    graph = make_graph(["A"], [])

    with pytest.raises(KeyError):
        dfs(graph, origin, destination)


def test_multiple_paths_follow_depth_first_order():
    graph = make_graph(
        ["A", "B", "C", "D"],
        [("A", "B", 1), ("A", "C", 1), ("B", "D", 1), ("C", "D", 1)],
    )

    result = dfs(graph, "A", "D")

    assert result.path == ("A", "B", "D")
    assert result.visited_order == ("A", "B", "D")


def test_exploration_order_is_lexicographic_and_deterministic():
    graph = make_graph(
        ["A", "B", "C", "D"],
        [("A", "C", 1), ("A", "B", 1), ("B", "D", 1), ("C", "D", 1)],
    )

    result = dfs(graph, "A", "D")

    assert result.visited_order == ("A", "B", "D")


def test_zero_weight_edges_are_supported():
    graph = make_graph(["A", "B", "C"], [("A", "B", 0), ("B", "C", 0)])

    result = dfs(graph, "A", "C")

    assert result.path == ("A", "B", "C")
    assert result.total_weight == 0.0


def test_total_weight_is_sum_of_selected_path_edges():
    graph = make_graph(
        ["A", "B", "C", "D"],
        [("A", "B", 2), ("B", "C", 3), ("C", "D", 5), ("A", "D", 100)],
    )

    result = dfs(graph, "A", "D")

    assert result.path == ("A", "B", "C", "D")
    assert result.hops == 3
    assert result.total_weight == 10.0


def test_dfs_does_not_modify_graph():
    graph = make_graph(["A", "B", "C"], [("A", "B", 0)])
    before = {node: graph.neighbors(node) for node in graph.node_ids()}

    dfs(graph, "A", "C")

    after = {node: graph.neighbors(node) for node in graph.node_ids()}
    assert after == before


def test_dfs_can_find_a_path_with_more_hops_than_bfs():
    graph = make_graph(
        ["A", "B", "C", "D"],
        [("A", "B", 1), ("B", "C", 1), ("C", "D", 1), ("A", "D", 1)],
    )

    depth_first = dfs(graph, "A", "D")
    breadth_first = bfs(graph, "A", "D")

    assert depth_first.path == ("A", "B", "C", "D")
    assert depth_first.hops == 3
    assert breadth_first.path == ("A", "D")
    assert breadth_first.hops == 1


def test_dfs_can_find_a_more_expensive_path_than_an_alternative():
    graph = make_graph(
        ["A", "B", "C", "D"],
        [("A", "B", 5), ("B", "C", 5), ("C", "D", 5), ("A", "D", 1)],
    )

    result = dfs(graph, "A", "D")

    assert result.path == ("A", "B", "C", "D")
    assert result.total_weight == 15.0
    assert graph.weight("A", "D") == 1.0


def test_required_example_matches_recursive_depth_first_order():
    graph = make_graph(
        ["A", "B", "C", "D"],
        [("A", "B", 1), ("B", "C", 1), ("C", "D", 1), ("A", "D", 1)],
    )

    result = dfs(graph, "A", "D")

    assert result.visited_order == ("A", "B", "C", "D")
    assert result.path == ("A", "B", "C", "D")
    assert result.hops == 3
