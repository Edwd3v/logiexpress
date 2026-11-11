from dataclasses import asdict

import pytest
from fastapi.testclient import TestClient

from logiexpress.algorithms.result import RouteResult
from logiexpress.api.main import app, get_graph
from logiexpress.domain.graph import Graph
from logiexpress.infrastructure.sample_data import build_demo_graph
from logiexpress.services.route_service import compare_routes, run_route


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def _route_payload(result: RouteResult) -> dict[str, object]:
    data = asdict(result)
    data["visited_order"] = list(result.visited_order)
    data["path"] = list(result.path) if result.path is not None else None
    return data


def test_health_reports_process_status_without_route_data(client: TestClient) -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_interactive_docs_and_openapi_contract_are_available(
    client: TestClient,
) -> None:
    assert client.get("/docs").status_code == 200
    schema = client.get("/openapi.json")

    assert schema.status_code == 200
    assert set(schema.json()["paths"]) >= {
        "/api/health",
        "/api/graph",
        "/api/routes/compute",
        "/api/routes/compare",
    }


def test_graph_returns_demo_nodes_and_one_stable_record_per_undirected_edge(
    client: TestClient,
) -> None:
    response = client.get("/api/graph")

    assert response.status_code == 200
    payload = response.json()
    graph = build_demo_graph()
    assert payload["directed"] is False
    assert payload["nodes"] == list(graph.node_ids())
    assert len(payload["nodes"]) == 18
    assert len(payload["edges"]) == 33
    assert payload["edges"] == [
        {"source": source, "target": target, "weight": weight}
        for source in graph.node_ids()
        for target, weight in graph.neighbors(source)
        if source < target
    ]
    edge_keys = [(edge["source"], edge["target"]) for edge in payload["edges"]]
    assert len(edge_keys) == len(set(edge_keys))
    assert all(source < target for source, target in edge_keys)


@pytest.mark.parametrize("node", ["G", "K", "M", "R"])
def test_routes_accept_nodes_from_the_expanded_graph(
    client: TestClient, node: str
) -> None:
    response = client.post(
        "/api/routes/compute",
        json={"origin": "A", "destination": node, "algorithm": "dijkstra"},
    )

    assert response.status_code == 200
    assert response.json()["origin"] == "A"
    assert response.json()["destination"] == node
    assert response.json()["found"] is True

    comparison = client.post(
        "/api/routes/compare", json={"origin": node, "destination": "A"}
    )
    assert comparison.status_code == 200
    assert set(comparison.json()) == {"bfs", "dfs", "dijkstra"}
    assert all(result["found"] for result in comparison.json().values())


@pytest.mark.parametrize("algorithm", ["bfs", "dfs", "dijkstra"])
def test_compute_returns_the_existing_service_result(
    client: TestClient, algorithm: str
) -> None:
    graph = build_demo_graph()
    expected = _route_payload(run_route(graph, "A", "D", algorithm))

    response = client.post(
        "/api/routes/compute",
        json={"origin": "A", "destination": "D", "algorithm": algorithm},
    )

    assert response.status_code == 200
    assert response.json() == expected
    assert set(response.json()) == {
        "algorithm",
        "origin",
        "destination",
        "visited_order",
        "path",
        "hops",
        "total_weight",
        "found",
    }


def test_compare_returns_all_service_results_without_selecting_a_winner(
    client: TestClient,
) -> None:
    expected = {
        name: _route_payload(result)
        for name, result in compare_routes(build_demo_graph(), "A", "D").items()
    }

    response = client.post(
        "/api/routes/compare", json={"origin": "A", "destination": "D"}
    )

    assert response.status_code == 200
    assert list(response.json()) == ["bfs", "dfs", "dijkstra"]
    assert response.json() == expected


def test_same_origin_and_destination_returns_zero_metrics(client: TestClient) -> None:
    response = client.post(
        "/api/routes/compute",
        json={"origin": "B", "destination": "B", "algorithm": "dijkstra"},
    )

    assert response.status_code == 200
    assert response.json()["path"] == ["B"]
    assert response.json()["hops"] == 0
    assert response.json()["total_weight"] == 0.0
    assert response.json()["found"] is True


@pytest.mark.parametrize("field", ["origin", "destination"])
def test_unknown_nodes_return_consistent_not_found_error(
    client: TestClient, field: str
) -> None:
    request = {"origin": "A", "destination": "D", "algorithm": "bfs"}
    request[field] = "UNKNOWN"

    response = client.post("/api/routes/compute", json=request)

    assert response.status_code == 404
    assert response.json() == {
        "error": {
            "code": "unknown_node",
            "message": "El nodo solicitado no existe.",
            "fields": [{"path": field, "message": "Identificador desconocido."}],
        }
    }


def test_compare_unknown_node_returns_consistent_not_found_error(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/routes/compare",
        json={"origin": "A", "destination": "UNKNOWN"},
    )

    assert response.status_code == 404
    assert response.json() == {
        "error": {
            "code": "unknown_node",
            "message": "El nodo solicitado no existe.",
            "fields": [
                {"path": "destination", "message": "Identificador desconocido."}
            ],
        }
    }


@pytest.mark.parametrize(
    "payload",
    [
        {"origin": "A", "destination": "D", "algorithm": "astar"},
        {"origin": "A", "destination": "D"},
        {"origin": "A", "destination": "D", "algorithm": "bfs", "extra": 1},
    ],
)
def test_invalid_algorithm_or_fields_return_422(
    client: TestClient, payload: dict[str, object]
) -> None:
    response = client.post("/api/routes/compute", json=payload)

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"
    assert response.json()["error"]["message"] == (
        "La solicitud contiene campos ausentes o inválidos."
    )
    assert response.json()["error"]["fields"]


def test_malformed_json_returns_sanitized_422(client: TestClient) -> None:
    response = client.post(
        "/api/routes/compute",
        content=b"{",
        headers={"content-type": "application/json"},
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"
    assert "traceback" not in response.text.lower()


@pytest.mark.parametrize("origin", [" A ", ""])
def test_node_identifiers_are_not_silently_normalized(
    client: TestClient, origin: str
) -> None:
    response = client.post(
        "/api/routes/compute",
        json={"origin": origin, "destination": "D", "algorithm": "bfs"},
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"


def test_unreachable_destination_returns_null_metrics_and_json_nulls(
    client: TestClient,
) -> None:
    graph = Graph()
    for node in ("A", "B", "C"):
        graph.add_node(node)
    graph.add_edge("A", "B", 2)
    app.dependency_overrides[get_graph] = lambda: graph

    response = client.post(
        "/api/routes/compute",
        json={"origin": "A", "destination": "C", "algorithm": "dijkstra"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "algorithm": "dijkstra",
        "origin": "A",
        "destination": "C",
        "visited_order": ["A", "B"],
        "path": None,
        "hops": None,
        "total_weight": None,
        "found": False,
    }
    assert response.content.count(b"null") == 3
