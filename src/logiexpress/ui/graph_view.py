"""Plotly conversion for the fictitious network and one route result."""

from html import escape

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


_ALGORITHM_COLORS = {"bfs": "#c77734", "dfs": "#7659bc", "dijkstra": "#078b7e"}
_DESKTOP_POSITIONS = {
    "A": (130, 267),
    "B": (349, 115),
    "C": (657, 115),
    "D": (874, 267),
    "E": (349, 426),
    "F": (657, 426),
}
_MOBILE_POSITIONS = {
    "A": (240, 112),
    "B": (85, 285),
    "C": (85, 490),
    "D": (240, 675),
    "E": (395, 285),
    "F": (395, 490),
}
_DESKTOP_WEIGHT_POSITIONS = {
    frozenset(("A", "B")): (222, 160),
    frozenset(("B", "C")): (503, 89),
    frozenset(("C", "D")): (780, 160),
    frozenset(("A", "D")): (503, 238),
    frozenset(("A", "E")): (222, 379),
    frozenset(("E", "F")): (503, 462),
    frozenset(("F", "D")): (780, 379),
}
_MOBILE_WEIGHT_POSITIONS = {
    frozenset(("A", "B")): (144, 180),
    frozenset(("B", "C")): (87, 388),
    frozenset(("C", "D")): (141, 578),
    frozenset(("A", "D")): (240, 395),
    frozenset(("A", "E")): (340, 180),
    frozenset(("E", "F")): (395, 388),
    frozenset(("F", "D")): (339, 578),
}


def build_graph_svg(
    graph: Graph, result: RouteResult, *, show_weights: bool = True
) -> str:
    """Build responsive SVG markup directly from the graph and route result.

    The two layouts follow the approved desktop and mobile node arrangements.
    Streamlit reruns regenerate this markup from the selected service result;
    no frontend algorithm or prototype data is embedded.
    """
    selected_edges = {
        frozenset(edge) for edge in zip(result.path or (), (result.path or ())[1:])
    }
    color = _ALGORITHM_COLORS[result.algorithm]
    svg_groups: list[str] = []
    for layout, positions, weight_positions, view_box in (
        ("desktop", _DESKTOP_POSITIONS, _DESKTOP_WEIGHT_POSITIONS, "0 0 1000 530"),
        ("mobile", _MOBILE_POSITIONS, _MOBILE_WEIGHT_POSITIONS, "0 0 480 740"),
    ):
        coordinates = {
            node: positions.get(
                node, (80 + (index % 5) * 180, 100 + (index // 5) * 120)
            )
            for index, node in enumerate(graph.node_ids())
        }
        edges_svg: list[str] = []
        weights_svg: list[str] = []
        for source in graph.node_ids():
            for target, weight in graph.neighbors(source):
                if source >= target:
                    continue
                edge_key = frozenset((source, target))
                x1, y1 = coordinates[source]
                x2, y2 = coordinates[target]
                active = edge_key in selected_edges
                edge_color = color if active else "#D2DDEB"
                edge_width = 7 if active else 4
                edges_svg.append(
                    f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" '
                    f'stroke="{edge_color}" stroke-width="{edge_width}" '
                    f'stroke-linecap="round" vector-effect="non-scaling-stroke" />'
                )
                if show_weights:
                    midpoint = weight_positions.get(edge_key)
                    if midpoint is None:
                        midpoint = ((x1 + x2) // 2, (y1 + y2) // 2 - 12)
                    wx, wy = midpoint
                    label = escape(f"{weight:g}")
                    weights_svg.append(
                        f'<g aria-label="Peso {label}"><rect x="{wx - 24}" y="{wy - 15}" '
                        f'width="48" height="30" rx="8" fill="#fff" stroke="#E4EAF1" />'
                        f'<text x="{wx}" y="{wy + 5}" text-anchor="middle" '
                        f'font-size="16" font-weight="700" fill="#526B8D">{label}</text></g>'
                    )
        nodes_svg: list[str] = []
        for node, (x, y) in coordinates.items():
            is_endpoint = node in (result.origin, result.destination)
            stroke = color if is_endpoint else "#B8C9DD"
            ring = (
                f'<circle cx="{x}" cy="{y}" r="39" fill="{color}" opacity=".10" />'
                if is_endpoint
                else ""
            )
            endpoint_label = (
                f'<text x="{x}" y="{y + 58}" text-anchor="middle" font-size="13" '
                f'font-weight="650" fill="#73819A">'
                f"{'Origen y destino' if result.origin == result.destination == node else 'Origen' if node == result.origin else 'Destino'}</text>"
                if is_endpoint
                else ""
            )
            nodes_svg.append(
                f'<g role="img" aria-label="Nodo {escape(node)}'
                f"{', origen' if node == result.origin else ''}"
                f'{", destino" if node == result.destination else ""}">'
                f'{ring}<circle cx="{x}" cy="{y}" r="31" fill="#fff" stroke="{stroke}" stroke-width="3" />'
                f'<text x="{x}" y="{y + 7}" text-anchor="middle" font-size="23" '
                f'font-weight="750" fill="#526B8D">{escape(node)}</text>{endpoint_label}</g>'
            )
        svg_groups.append(
            f'<svg class="lx-svg lx-svg-{layout}" viewBox="{view_box}" role="img" '
            f'aria-label="Grafo con ruta destacada por {result.algorithm.upper()}">'
            f'<defs><pattern id="dots-{layout}" width="24" height="24" patternUnits="userSpaceOnUse">'
            '<circle cx="2" cy="2" r="1" fill="#DCE5F0" /></pattern></defs>'
            f'<rect width="100%" height="100%" fill="url(#dots-{layout})" />'
            f'<g aria-label="Conexiones disponibles">{"".join(edges_svg)}</g>'
            f'<g aria-label="Pesos de las conexiones">{"".join(weights_svg)}</g>'
            f'<g aria-label="Ubicaciones">{"".join(nodes_svg)}</g></svg>'
        )
    return "".join(svg_groups)


def build_graph_figure(
    graph: Graph, result: RouteResult, *, show_weights: bool = True
) -> go.Figure:
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
    figure.add_trace(
        go.Scatter(
            x=regular_x,
            y=regular_y,
            mode="lines",
            name="Conexiones",
            line={"color": "#cbd7e5", "width": 2.5},
            hoverinfo="skip",
        )
    )
    figure.add_trace(
        go.Scatter(
            x=highlighted_x,
            y=highlighted_y,
            mode="lines",
            name="Ruta seleccionada",
            line={"color": _ALGORITHM_COLORS[result.algorithm], "width": 5},
            hoverinfo="skip",
        )
    )
    figure.add_trace(
        go.Scatter(
            x=weight_x,
            y=weight_y,
            mode="text" if show_weights else "none",
            text=weight_labels,
            name="Costos",
            textposition="middle center",
            textfont={"size": 14, "color": "#17243B", "family": "Arial, sans-serif"},
            marker={
                "size": 25,
                "color": "#FFFFFF",
                "symbol": "square",
                "line": {"width": 1, "color": "#64748B"},
            },
            hoverinfo="skip",
        )
    )
    outline_colors = [
        _ALGORITHM_COLORS[result.algorithm]
        if node in (result.origin, result.destination)
        else "#64748B"
        for node in nodes
    ]
    symbols = [
        "star" if result.origin == result.destination == node else "circle"
        for node in nodes
    ]
    node_labels = [
        f"{node} (origen y destino)"
        if result.origin == result.destination == node
        else f"{node} (origen)"
        if node == result.origin
        else f"{node} (destino)"
        if node == result.destination
        else node
        for node in nodes
    ]
    figure.add_trace(
        go.Scatter(
            x=[positions[node][0] for node in nodes],
            y=[positions[node][1] for node in nodes],
            mode="markers+text",
            text=list(nodes),
            customdata=node_labels,
            textposition="middle center",
            textfont={"size": 16, "color": "#17243B", "family": "Arial, sans-serif"},
            name="Ubicaciones",
            marker={
                "size": 44,
                "color": "#FFFFFF",
                "symbol": symbols,
                "line": {"width": 3, "color": outline_colors},
            },
            hovertemplate="%{customdata}<extra></extra>",
        )
    )
    figure.update_layout(
        height=500,
        autosize=True,
        margin={"l": 10, "r": 10, "t": 15, "b": 10},
        font={"color": "#17243B", "size": 14, "family": "Arial, sans-serif"},
        legend={
            "orientation": "h",
            "y": -0.12,
            "font": {"color": "#334155", "size": 13},
        },
        xaxis={"visible": False, "fixedrange": True},
        yaxis={"visible": False, "fixedrange": True, "scaleanchor": "x"},
        plot_bgcolor="#f8fafc",
        paper_bgcolor="white",
    )
    return figure
