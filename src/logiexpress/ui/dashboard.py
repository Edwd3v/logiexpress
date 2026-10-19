"""Streamlit dashboard entry logic for LogiExpress."""

import streamlit as st

from logiexpress.algorithms.result import AlgorithmName, RouteResult
from logiexpress.infrastructure.sample_data import build_demo_graph
from logiexpress.services.route_service import compare_routes, run_route
from logiexpress.ui.graph_view import build_graph_figure

_LABELS: dict[str, AlgorithmName] = {
    "BFS": "bfs", "DFS": "dfs", "Dijkstra": "dijkstra"
}
_DISPLAY_NAMES = {value: key for key, value in _LABELS.items()}


def _clear_results() -> None:
    st.session_state.pop("analysis", None)


def _clear_single_result() -> None:
    analysis = st.session_state.get("analysis")
    if analysis is not None and len(analysis) != len(_LABELS):
        st.session_state.pop("analysis", None)


def _format_path(result: RouteResult) -> str:
    return " → ".join(result.path) if result.path is not None else "Sin ruta"


def main() -> None:
    """Render controls, execute selected service operation, and show results."""
    st.set_page_config(page_title="LogiExpress", page_icon="🚚", layout="wide")
    graph = build_demo_graph()
    nodes = graph.node_ids()

    st.title("LogiExpress")
    st.caption("Exploración de rutas en una red logística ficticia. Los costos y ubicaciones son de demostración, no geográficos.")
    st.write("Elegí origen, destino y algoritmo; después ejecutá el análisis para ver el recorrido y sus métricas.")

    controls = st.columns([1, 1, 1, 1.3])
    origin = controls[0].selectbox("Origen", nodes, index=nodes.index("A"), on_change=_clear_results)
    destination = controls[1].selectbox("Destino", nodes, index=nodes.index("D"), on_change=_clear_results)
    algorithm_label = controls[2].selectbox("Algoritmo", tuple(_LABELS), on_change=_clear_single_result)
    comparison = controls[3].checkbox("Comparar los tres algoritmos", on_change=_clear_results)
    run = st.button("Ejecutar análisis", type="primary")

    if run:
        if comparison:
            st.session_state.analysis = compare_routes(graph, origin, destination)
        else:
            algorithm = _LABELS[algorithm_label]
            st.session_state.analysis = {algorithm: run_route(graph, origin, destination, algorithm)}

    analysis: dict[AlgorithmName, RouteResult] | None = st.session_state.get("analysis")
    if analysis is None:
        st.info("Configurá la consulta y seleccioná **Ejecutar análisis**.")
        return

    selected_algorithm: AlgorithmName = _LABELS[algorithm_label]
    selected = analysis.get(selected_algorithm)
    if selected is None:
        selected = next(iter(analysis.values()))
    st.subheader("Red y ruta seleccionada")
    st.plotly_chart(
        build_graph_figure(graph, selected), width="stretch", theme=None,
        config={"displayModeBar": False},
    )

    st.subheader(f"Resultado: {_DISPLAY_NAMES[selected.algorithm]}")
    if selected.found:
        metrics = st.columns(3)
        metrics[0].metric("Camino", _format_path(selected))
        metrics[1].metric("Saltos", str(selected.hops))
        metrics[2].metric("Costo total", f"{selected.total_weight:g}")
        st.success("Destino alcanzable.")
    else:
        st.warning("No existe una ruta entre el origen y el destino seleccionados.")
        st.write("Camino: sin ruta · Saltos: no disponibles · Costo total: no disponible")
    st.write(f"**Orden de exploración** ({_DISPLAY_NAMES[selected.algorithm]}): " + " → ".join(selected.visited_order))
    st.caption("El orden de exploración no es el camino: BFS informa extracciones de cola; DFS, inicios de exploración; Dijkstra, nodos con distancia finalizada.")

    if comparison:
        st.subheader("Comparación")
        rows = [
            {
                "Algoritmo": _DISPLAY_NAMES[name],
                "Camino": _format_path(result),
                "Saltos": result.hops if result.hops is not None else "No disponible",
                "Costo total": result.total_weight if result.total_weight is not None else "No disponible",
                "Nodos explorados": len(result.visited_order),
                "Ruta encontrada": "Sí" if result.found else "No",
            }
            for name, result in analysis.items()
        ]
        st.dataframe(rows, hide_index=True, width="stretch")

    st.subheader("Qué muestra cada algoritmo")
    st.markdown(
        "- **BFS:** encuentra un camino con la menor cantidad de saltos.\n"
        "- **DFS:** explora en profundidad y devuelve un camino posible; no garantiza optimalidad.\n"
        "- **Dijkstra:** encuentra un camino de costo acumulado mínimo con pesos no negativos.\n\n"
        "No existe un ganador universal: BFS optimiza saltos, Dijkstra costo y DFS ilustra una exploración en profundidad."
    )
