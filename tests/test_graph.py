import math

import pytest

from logiexpress.domain.graph import Graph


def test_empty_graph_has_no_nodes():
    graph = Graph()

    assert graph.node_ids() == ()


def test_add_and_query_nodes_in_sorted_order():
    graph = Graph()
    graph.add_node("B")
    graph.add_node("A")

    assert graph.has_node("A")
    assert not graph.has_node("C")
    assert graph.node_ids() == ("A", "B")


def test_duplicate_node_is_rejected():
    graph = Graph()
    graph.add_node("A")

    with pytest.raises(ValueError):
        graph.add_node("A")


@pytest.mark.parametrize("weight", [0, 2, 2.5])
def test_valid_weights_are_stored_bidirectionally(weight):
    graph = Graph()
    graph.add_node("A")
    graph.add_node("B")

    graph.add_edge("A", "B", weight)

    assert graph.weight("A", "B") == float(weight)
    assert graph.weight("B", "A") == float(weight)
    assert graph.neighbors("A") == (("B", float(weight)),)


@pytest.mark.parametrize("weight", [-1, -0.1, math.nan, math.inf, -math.inf])
def test_negative_or_non_finite_weights_are_rejected(weight):
    graph = Graph()
    graph.add_node("A")
    graph.add_node("B")

    with pytest.raises(ValueError):
        graph.add_edge("A", "B", weight)

    assert graph.neighbors("A") == ()
    assert graph.neighbors("B") == ()


def test_boolean_weight_is_rejected():
    graph = Graph()
    graph.add_node("A")
    graph.add_node("B")

    with pytest.raises(TypeError):
        graph.add_edge("A", "B", True)


@pytest.mark.parametrize("node_id", ["", " A", "A ", "  "])
def test_invalid_node_ids_are_rejected(node_id):
    graph = Graph()

    with pytest.raises(ValueError):
        graph.add_node(node_id)


@pytest.mark.parametrize("node_id", [None, 1, True])
def test_non_string_node_ids_are_rejected(node_id):
    graph = Graph()

    with pytest.raises(TypeError):
        graph.add_node(node_id)


def test_self_loop_is_rejected():
    graph = Graph()
    graph.add_node("A")

    with pytest.raises(ValueError):
        graph.add_edge("A", "A", 1)


def test_duplicate_edge_in_either_direction_is_rejected():
    graph = Graph()
    graph.add_node("A")
    graph.add_node("B")
    graph.add_edge("A", "B", 1)

    with pytest.raises(ValueError):
        graph.add_edge("B", "A", 1)


@pytest.mark.parametrize("endpoints", [("missing", "B"), ("A", "missing")])
def test_edge_with_unknown_node_is_rejected(endpoints):
    graph = Graph()
    graph.add_node("A")
    graph.add_node("B")

    with pytest.raises(KeyError):
        graph.add_edge(*endpoints, 1)


def test_unknown_node_queries_raise_key_error():
    graph = Graph()

    with pytest.raises(KeyError):
        graph.neighbors("missing")
    with pytest.raises(KeyError):
        graph.weight("missing", "also-missing")


def test_unknown_neighbor_weight_raises_key_error():
    graph = Graph()
    graph.add_node("A")
    graph.add_node("B")

    with pytest.raises(KeyError):
        graph.weight("A", "B")


def test_isolated_nodes_and_cycles_are_supported():
    graph = Graph()
    for node in ("A", "B", "C", "isolated"):
        graph.add_node(node)
    graph.add_edge("A", "B", 1)
    graph.add_edge("B", "C", 2)
    graph.add_edge("C", "A", 3)

    assert graph.neighbors("isolated") == ()
    assert graph.neighbors("A") == (("B", 1.0), ("C", 3.0))


def test_neighbor_results_cannot_mutate_graph_state():
    graph = Graph()
    graph.add_node("A")
    graph.add_node("B")
    graph.add_edge("A", "B", 1)

    neighbors = graph.neighbors("A")
    assert isinstance(neighbors, tuple)
    with pytest.raises(TypeError):
        neighbors[0] = ("C", 9.0)
    with pytest.raises(TypeError):
        neighbors[0][1] = 9.0

    assert graph.neighbors("A") == (("B", 1.0),)


def test_has_node_rejects_non_string_identifier():
    with pytest.raises(TypeError):
        Graph().has_node(None)
