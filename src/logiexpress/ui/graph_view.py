"""Plotly conversion for the fictitious network and one route result."""

import plotly.graph_objects as go

from logiexpress.algorithms.result import RouteResult
from logiexpress.domain.graph import Graph

_POSITIONS: dict[str, tuple[float, float]] = {
    "A": (0.0, 1.0),
    "B": (1.0, 1.7),
    "C": (2.0, 1.7),
    "D": (3.0, 1.0),
    "E": (1.0, 0.3),
    "F": (2.0, 0.3),
}


def build_graph_figure(graph: Graph, result: RouteResult) -> go.Figure:
    """Render every edge and node, highlighting the selected route if found."""
    nodes = graph.node_ids()
    positions = {
        node: _POSITIONS.get(node, (float(index % 3), -0.8 - index // 3))
        for index, node in enumerate(nodes)
    }
    route_edges = set(zip(result.path or (), (result.path or ())[1:]))
    route_edges |= {(target, source) for source, target in route_edges}

    regular_x: list[float | None] = []
    regular_y: list[float | None] = []
    highlighted_x: list[float | None] = []
    highlighted_y: list[float | None] = []
    weight_x: list[float] = []
    weight_y: list[float] = []
    weight_labels: list[str] = []
    for source in nodes:
        for target, weight in graph.neighbors(source):
            if source >= target:
                continue
            start, end = positions[source], positions[target]
            edge_x, edge_y = (start[0], end[0], None), (start[1], end[1], None)
            if (source, target) in route_edges:
                highlighted_x.extend(edge_x)
                highlighted_y.extend(edge_y)
            else:
                regular_x.extend(edge_x)
                regular_y.extend(edge_y)
            weight_x.append((start[0] + end[0]) / 2)
            weight_y.append((start[1] + end[1]) / 2)
            weight_labels.append(f"{weight:g}")

    figure = go.Figure()
    figure.add_trace(go.Scatter(
        x=regular_x, y=regular_y, mode="lines", name="Conexiones",
        line={"color": "#64748b", "width": 2}, hoverinfo="skip",
    ))
    figure.add_trace(go.Scatter(
        x=highlighted_x, y=highlighted_y, mode="lines", name="Ruta seleccionada",
        line={"color": "#b45309", "width": 5}, hoverinfo="skip",
    ))
    figure.add_trace(go.Scatter(
        x=weight_x, y=weight_y, mode="text", text=weight_labels,
        name="Costos", textposition="middle center",
        textfont={"size": 12, "color": "#1f2937"},
        hoverinfo="skip",
    ))
    colors = [
        "#15803d" if node == result.origin else
        "#b91c1c" if node == result.destination else "#2563eb"
        for node in nodes
    ]
    symbols = [
        "star" if result.origin == result.destination == node else "circle"
        for node in nodes
    ]
    node_labels = [
        f"{node} (origen y destino)" if result.origin == result.destination == node
        else f"{node} (origen)" if node == result.origin
        else f"{node} (destino)" if node == result.destination
        else node
        for node in nodes
    ]
    figure.add_trace(go.Scatter(
        x=[positions[node][0] for node in nodes],
        y=[positions[node][1] for node in nodes],
        mode="markers+text", text=list(nodes), customdata=node_labels,
        textposition="top center", textfont={"size": 14, "color": "#1f2937"},
        name="Ubicaciones", marker={"size": 24, "color": colors, "symbol": symbols, "line": {"width": 2, "color": "white"}},
        hovertemplate="%{customdata}<extra></extra>",
    ))
    figure.update_layout(
        height=440, autosize=True, margin={"l": 10, "r": 10, "t": 15, "b": 10},
        font={"color": "#1f2937"},
        legend={"orientation": "h", "y": -0.12, "font": {"color": "#1f2937"}},
        xaxis={"visible": False, "fixedrange": True},
        yaxis={"visible": False, "fixedrange": True, "scaleanchor": "x"},
        plot_bgcolor="white", paper_bgcolor="white",
    )
    return figure
