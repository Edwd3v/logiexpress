import pytest

from logiexpress.algorithms.result import RouteResult
from logiexpress.domain.graph import Graph
from logiexpress.services.route_service import compare_routes, run_route


def make_graph(nodes, edges):
    graph = Graph()
    for node in nodes:
        graph.add_node(node)
    for source, target, weight in edges:
        graph.add_edge(source, target, weight)
    return graph


def test_run_route_selects_bfs():
    graph = make_graph(["A", "B", "C"], [("A", "B", 1), ("B", "C", 1)])

    result = run_route(graph, "A", "C", "bfs")

    assert isinstance(result, RouteResult)
    assert result.algorithm == "bfs"
    assert result.path == ("A", "B", "C")


def test_run_route_selects_dfs():
    graph = make_graph(["A", "B", "C"], [("A", "B", 1), ("B", "C", 1)])

    result = run_route(graph, "A", "C", "dfs")

    assert isinstance(result, RouteResult)
    assert result.algorithm == "dfs"
    assert result.path == ("A", "B", "C")


def test_run_route_selects_dijkstra():
    graph = make_graph(["A", "B", "C"], [("A", "B", 1), ("B", "C", 1)])

    result = run_route(graph, "A", "C", "dijkstra")

    assert isinstance(result, RouteResult)
    assert result.algorithm == "dijkstra"
    assert result.path == ("A", "B", "C")


def test_run_route_rejects_unknown_algorithm():
    graph = make_graph(["A"], [])

    with pytest.raises(ValueError, match="Unknown algorithm"):
        run_route(graph, "A", "A", "astar")


def test_compare_routes_returns_all_algorithms_in_stable_order():
    graph = make_graph(["A", "B"], [("A", "B", 1)])

    results = compare_routes(graph, "A", "B")

    assert tuple(results) == ("bfs", "dfs", "dijkstra")
    assert all(isinstance(result, RouteResult) for result in results.values())
    assert all(result.origin == "A" and result.destination == "B" for result in results.values())


def test_compare_routes_preserves_each_result_contract():
    graph = make_graph(
        ["A", "B", "C", "D"],
        [("A", "B", 1), ("B", "D", 2), ("A", "C", 1), ("C", "D", 2)],
    )

    for algorithm, result in compare_routes(graph, "A", "D").items():
        assert result.algorithm == algorithm
        assert result.origin == "A"
        assert result.destination == "D"
        assert result.found is True
        assert result.path is not None
        assert result.hops == len(result.path) - 1
        assert result.total_weight is not None
        assert result.visited_order[0] == "A"
        assert result.visited_order[-1] == "D"


def test_origin_equal_to_destination_returns_zero_cost_results():
    graph = make_graph(["A", "B"], [("A", "B", 4)])

    results = compare_routes(graph, "A", "A")

    for result in results.values():
        assert result.found is True
        assert result.path == ("A",)
        assert result.hops == 0
        assert result.total_weight == 0.0
        assert result.visited_order == ("A",)


def test_empty_graph_propagates_domain_key_error():
    with pytest.raises(KeyError):
        compare_routes(Graph(), "A", "B")


@pytest.mark.parametrize(("origin", "destination"), [("missing", "A"), ("A", "missing")])
def test_missing_nodes_propagate_domain_key_error(origin, destination):
    graph = make_graph(["A"], [])

    with pytest.raises(KeyError):
        compare_routes(graph, origin, destination)


def test_unreachable_destination_is_not_reported_as_zero_cost():
    graph = make_graph(["A", "B", "C"], [("A", "B", 1)])

    results = compare_routes(graph, "A", "C")

    assert all(not result.found for result in results.values())
    assert all(result.path is None for result in results.values())
    assert all(result.hops is None for result in results.values())
    assert all(result.total_weight is None for result in results.values())


def test_comparison_handles_cycles():
    graph = make_graph(
        ["A", "B", "C", "D"],
        [("A", "B", 1), ("B", "C", 1), ("C", "A", 1), ("C", "D", 2)],
    )

    results = compare_routes(graph, "A", "D")

    assert all(result.found for result in results.values())
    assert all(len(result.visited_order) == len(set(result.visited_order)) for result in results.values())


def test_comparison_handles_zero_weight_edges():
    graph = make_graph(["A", "B", "C"], [("A", "B", 0), ("B", "C", 0)])

    results = compare_routes(graph, "A", "C")

    assert all(result.found for result in results.values())
    assert all(result.total_weight == 0.0 for result in results.values())


def test_algorithms_can_return_different_paths_without_selecting_a_winner():
    graph = make_graph(
        ["A", "B", "C", "D", "E"],
        [("A", "B", 10), ("B", "D", 10), ("A", "C", 1), ("C", "E", 1), ("E", "D", 1)],
    )

    results = compare_routes(graph, "A", "D")

    assert results["bfs"].path == ("A", "B", "D")
    assert results["dfs"].path == ("A", "B", "D")
    assert results["dijkstra"].path == ("A", "C", "E", "D")
    assert results["bfs"].total_weight == 20.0
    assert results["dijkstra"].total_weight == 3.0


def test_bfs_hops_and_dijkstra_cost_guarantees_hold_on_reachable_results():
    graphs = [
        make_graph(
            ["A", "B", "C", "D"],
            [("A", "B", 8), ("B", "D", 2), ("A", "C", 1), ("C", "D", 2)],
        ),
        make_graph(
            ["A", "B", "C", "D", "E"],
            [("A", "B", 4), ("B", "D", 4), ("A", "C", 1), ("C", "E", 1), ("E", "D", 1)],
        ),
    ]

    for graph in graphs:
        results = compare_routes(graph, "A", "D")
        breadth_first = results["bfs"]
        depth_first = results["dfs"]
        least_cost = results["dijkstra"]

        assert breadth_first.found and depth_first.found and least_cost.found
        assert breadth_first.hops <= depth_first.hops
        assert breadth_first.hops <= least_cost.hops
        assert least_cost.total_weight <= breadth_first.total_weight
        assert least_cost.total_weight <= depth_first.total_weight


def test_bfs_prefers_fewer_hops_even_when_a_longer_route_costs_less():
    graph = make_graph(
        ["A", "B", "C", "D", "E", "F"],
        [
            ("A", "B", 9),
            ("B", "D", 9),
            ("A", "C", 1),
            ("C", "D", 1),
            ("A", "E", 0),
            ("E", "F", 0),
            ("F", "D", 0),
        ],
    )

    results = compare_routes(graph, "A", "D")
    breadth_first = results["bfs"]
    least_cost = results["dijkstra"]

    assert breadth_first.path == ("A", "B", "D")
    assert breadth_first.hops == 2
    assert breadth_first.total_weight == 18.0
    assert least_cost.path == ("A", "E", "F", "D")
    assert least_cost.hops == 3
    assert least_cost.total_weight == 0.0


def test_comparison_does_not_modify_graph():
    graph = make_graph(["A", "B", "C"], [("A", "B", 0)])
    before = {node: graph.neighbors(node) for node in graph.node_ids()}

    compare_routes(graph, "A", "C")

    after = {node: graph.neighbors(node) for node in graph.node_ids()}
    assert after == before


def test_equal_cost_routes_do_not_require_a_unique_path():
    graph = make_graph(
        ["A", "B", "C", "D"],
        [("A", "B", 1), ("B", "D", 1), ("A", "C", 1), ("C", "D", 1)],
    )

    results = compare_routes(graph, "A", "D")

    assert all(result.found for result in results.values())
    assert all(result.hops == 2 for result in results.values())
    assert all(result.total_weight == 2.0 for result in results.values())
