import json
import re
from itertools import pairwise
from pathlib import Path

from logiexpress.infrastructure.sample_data import (
    build_academic_graph,
    build_demo_graph,
)
from logiexpress.services.route_service import compare_routes


def test_academic_graph_preserves_original_six_node_example():
    graph = build_academic_graph()

    assert graph.node_ids() == ("A", "B", "C", "D", "E", "F")
    assert graph.weight("A", "D") == 20.0
    assert graph.weight("A", "B") == 4.0
    assert graph.weight("B", "C") == 4.0
    assert graph.weight("C", "D") == 4.0
    assert graph.weight("A", "E") == 1.0
    assert graph.weight("E", "F") == 1.0
    assert graph.weight("F", "D") == 1.0


def test_academic_service_results_match_documented_example():
    results = compare_routes(build_academic_graph(), "A", "D")

    assert results["bfs"].path == ("A", "D")
    assert (results["bfs"].hops, results["bfs"].total_weight) == (1, 20.0)
    assert results["dfs"].path == ("A", "B", "C", "D")
    assert (results["dfs"].hops, results["dfs"].total_weight) == (3, 12.0)
    assert results["dijkstra"].path == ("A", "E", "F", "D")
    assert (results["dijkstra"].hops, results["dijkstra"].total_weight) == (3, 3.0)


def test_operational_graph_matches_approved_html_topology():
    graph = build_demo_graph()
    html_path = (
        Path(__file__).parents[1]
        / "docs/prototypes/logiexpress_mapa_simulado_18_nodos.html"
    )
    html = html_path.read_text(encoding="utf-8")
    match = re.search(
        r'<script id="map-data" type="application/json">(.*?)</script>', html, re.DOTALL
    )
    assert match is not None
    reference = json.loads(match.group(1))
    expected_nodes = tuple(node["id"] for node in reference["nodes"])
    expected_edges = {
        tuple(sorted((edge["from"], edge["to"]))): float(edge["weight"])
        for edge in reference["edges"]
    }

    actual_edges = {
        tuple(sorted((source, target))): weight
        for source in graph.node_ids()
        for target, weight in graph.neighbors(source)
        if source < target
    }
    assert graph.node_ids() == expected_nodes == tuple("ABCDEFGHIJKLMNOPQR")
    assert len(expected_edges) == len(reference["edges"]) == 33
    assert len(actual_edges) == 33
    assert actual_edges == expected_edges
    assert all(
        source != target
        and source in expected_nodes
        and target in expected_nodes
        and weight >= 0
        and weight < float("inf")
        for (source, target), weight in actual_edges.items()
    )


def test_expanded_graph_routes_are_valid_and_repeatable():
    graph = build_demo_graph()
    first = compare_routes(graph, "A", "D")
    second = compare_routes(graph, "A", "D")

    assert first == second
    assert first["bfs"].hops == len(first["bfs"].path) - 1
    assert first["dfs"].hops == len(first["dfs"].path) - 1
    assert first["dijkstra"].hops == len(first["dijkstra"].path) - 1
    for result in first.values():
        assert result.path is not None
        assert result.path[0] == "A" and result.path[-1] == "D"
        assert all(
            target in dict(graph.neighbors(source))
            for source, target in zip(result.path, result.path[1:])
        )
        assert result.total_weight == sum(
            graph.weight(source, target)
            for source, target in zip(result.path, result.path[1:])
        )
    assert first["dijkstra"].total_weight == 3.0
    assert first["dijkstra"].total_weight <= min(
        sum(graph.weight(source, target) for source, target in pairwise(path))
        for path in (("A", "D"), ("A", "E", "F", "D"), ("A", "O", "N", "E", "F", "D"))
    )


def test_expanded_dijkstra_cost_matches_independent_bellman_ford_oracle():
    graph = build_demo_graph()
    distances = {node: float("inf") for node in graph.node_ids()}
    distances["A"] = 0.0
    edges = [
        (source, target, weight)
        for source in graph.node_ids()
        for target, weight in graph.neighbors(source)
    ]

    for _ in range(len(distances) - 1):
        changed = False
        for source, target, weight in edges:
            candidate = distances[source] + weight
            if candidate < distances[target]:
                distances[target] = candidate
                changed = True
        if not changed:
            break

    result = compare_routes(graph, "A", "D")["dijkstra"]
    assert result.total_weight == distances["D"] == 3.0


def test_expanded_graph_same_origin_and_destination_has_zero_cost():
    results = compare_routes(build_demo_graph(), "R", "R")

    for result in results.values():
        assert result.path == ("R",)
        assert result.hops == 0
        assert result.total_weight == 0.0
