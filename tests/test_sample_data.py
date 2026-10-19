from logiexpress.infrastructure.sample_data import build_demo_graph
from logiexpress.services.route_service import compare_routes


def test_demo_graph_contains_expected_nodes_and_edges():
    graph = build_demo_graph()

    assert graph.node_ids() == ("A", "B", "C", "D", "E", "F")
    assert graph.weight("A", "D") == 20.0
    assert graph.weight("A", "B") == 4.0
    assert graph.weight("B", "C") == 4.0
    assert graph.weight("C", "D") == 4.0
    assert graph.weight("A", "E") == 1.0
    assert graph.weight("E", "F") == 1.0
    assert graph.weight("F", "D") == 1.0


def test_demo_service_results_match_documented_example():
    results = compare_routes(build_demo_graph(), "A", "D")

    assert results["bfs"].path == ("A", "D")
    assert (results["bfs"].hops, results["bfs"].total_weight) == (1, 20.0)
    assert results["dfs"].path == ("A", "B", "C", "D")
    assert (results["dfs"].hops, results["dfs"].total_weight) == (3, 12.0)
    assert results["dijkstra"].path == ("A", "E", "F", "D")
    assert (results["dijkstra"].hops, results["dijkstra"].total_weight) == (3, 3.0)
