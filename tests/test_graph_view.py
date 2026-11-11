from logiexpress.infrastructure.sample_data import build_demo_graph
from logiexpress.services.route_service import compare_routes
from logiexpress.ui.graph_view import build_graph_figure, build_graph_svg


def test_plot_contains_all_nodes_edges_weights_and_highlights_selected_path():
    graph = build_demo_graph()
    result = compare_routes(graph, "A", "D")["dijkstra"]

    figure = build_graph_figure(graph, result)

    node_trace = next(trace for trace in figure.data if trace.name == "Ubicaciones")
    regular_edges = next(trace for trace in figure.data if trace.name == "Conexiones")
    highlighted = next(
        trace for trace in figure.data if trace.name == "Ruta seleccionada"
    )
    weights = next(trace for trace in figure.data if trace.name == "Costos")

    assert tuple(node_trace.text) == graph.node_ids()
    assert len(regular_edges.x) == 90
    assert len(highlighted.x) == 9
    assert regular_edges.line.color == "#cbd7e5"
    assert highlighted.line.color == "#078b7e"
    assert len(weights.text) == 33
    assert weights.text.count("20") == 1
    assert weights.textfont.color == "#17243B"
    assert node_trace.textfont.color == "#17243B"
    assert figure.layout.legend.font.color == "#334155"
    assert node_trace.marker.color == "#FFFFFF"
    assert node_trace.marker.line.color[graph.node_ids().index("A")] == "#078b7e"
    assert node_trace.marker.line.color[graph.node_ids().index("D")] == "#078b7e"


def test_unreachable_result_builds_figure_without_false_zero_cost():
    graph = build_demo_graph()
    graph.add_node("Z")
    result = compare_routes(graph, "A", "Z")["bfs"]

    figure = build_graph_figure(graph, result)

    node_trace = next(trace for trace in figure.data if trace.name == "Ubicaciones")
    assert "Z" in node_trace.text
    assert (
        next(trace for trace in figure.data if trace.name == "Ruta seleccionada").x
        == ()
    )


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


def test_graph_can_hide_edge_weights_without_removing_network_data():
    graph = build_demo_graph()
    result = compare_routes(graph, "A", "D")["bfs"]

    figure = build_graph_figure(graph, result, show_weights=False)

    weights = next(trace for trace in figure.data if trace.name == "Costos")
    assert weights.mode == "none"
    assert (
        len(next(trace for trace in figure.data if trace.name == "Conexiones").x)
        + len(
            next(trace for trace in figure.data if trace.name == "Ruta seleccionada").x
        )
        == 99
    )


def test_responsive_svg_reflects_real_routes_and_both_prototype_layouts():
    graph = build_demo_graph()
    result = compare_routes(graph, "A", "D")["dijkstra"]

    svg = build_graph_svg(graph, result)

    assert 'class="lx-svg lx-svg-desktop"' in svg
    assert 'class="lx-svg lx-svg-mobile"' in svg
    assert 'x1="130" y1="267" x2="349" y2="426"' in svg
    assert 'stroke="#078b7e"' in svg
    assert "Peso 1" in svg
    assert 'aria-label="Nodo D, destino"' in svg


def test_responsive_svg_hides_only_weights_and_keeps_graph_and_nodes():
    graph = build_demo_graph()
    result = compare_routes(graph, "A", "D")["bfs"]

    svg = build_graph_svg(graph, result, show_weights=False)

    assert "Peso " not in svg
    assert 'aria-label="Conexiones disponibles"' in svg
    assert "Nodo A" in svg and "Nodo D" in svg
