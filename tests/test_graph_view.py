from logiexpress.infrastructure.sample_data import build_demo_graph
from logiexpress.services.route_service import compare_routes
from logiexpress.ui.graph_view import build_graph_figure


def test_plot_contains_all_nodes_edges_weights_and_highlights_selected_path():
    graph = build_demo_graph()
    result = compare_routes(graph, "A", "D")["dijkstra"]

    figure = build_graph_figure(graph, result)

    node_trace = next(trace for trace in figure.data if trace.name == "Ubicaciones")
    regular_edges = next(trace for trace in figure.data if trace.name == "Conexiones")
    highlighted = next(trace for trace in figure.data if trace.name == "Ruta seleccionada")
    weights = next(trace for trace in figure.data if trace.name == "Costos")

    assert tuple(node_trace.text) == graph.node_ids()
    assert len(regular_edges.x) == 12
    assert len(highlighted.x) == 9
    assert regular_edges.line.color == "#64748b"
    assert highlighted.line.color == "#b45309"
    assert sorted(weights.text) == ["1", "1", "1", "20", "4", "4", "4"]
    assert weights.textfont.color == "#1f2937"
    assert node_trace.textfont.color == "#1f2937"
    assert figure.layout.legend.font.color == "#1f2937"
    assert node_trace.marker.color[graph.node_ids().index("A")] != node_trace.marker.color[
        graph.node_ids().index("D")
    ]


def test_unreachable_result_builds_figure_without_false_zero_cost():
    graph = build_demo_graph()
    graph.add_node("G")
    result = compare_routes(graph, "A", "G")["bfs"]

    figure = build_graph_figure(graph, result)

    node_trace = next(trace for trace in figure.data if trace.name == "Ubicaciones")
    assert "G" in node_trace.text
    assert next(trace for trace in figure.data if trace.name == "Ruta seleccionada").x == ()


def test_equal_endpoints_have_distinct_visual_marker_and_hover_label():
    graph = build_demo_graph()
    result = compare_routes(graph, "B", "B")["bfs"]

    figure = build_graph_figure(graph, result)
    node_trace = next(trace for trace in figure.data if trace.name == "Ubicaciones")
    node_index = graph.node_ids().index("B")

    assert node_trace.marker.symbol[node_index] == "star"
    assert node_trace.customdata[node_index] == "B (origen y destino)"


def test_building_visualization_does_not_mutate_graph():
    graph = build_demo_graph()
    before = {node: graph.neighbors(node) for node in graph.node_ids()}
    result = compare_routes(graph, "A", "D")["bfs"]

    build_graph_figure(graph, result)

    after = {node: graph.neighbors(node) for node in graph.node_ids()}
    assert after == before
