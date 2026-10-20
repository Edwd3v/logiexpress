import re
from pathlib import Path

from streamlit.testing.v1 import AppTest

APP_PATH = Path(__file__).resolve().parents[1] / "app.py"


def _run(app):
    next(
        button for button in app.button if button.key == "execute-analysis"
    ).click().run()
    assert not app.exception


def _result_values(app):
    strip = next(
        item.value for item in app.markdown if 'class="lx-result-strip"' in item.value
    )
    nodes = re.findall(r'class="lx-route-node">([^<]+)', strip)
    numbers = re.findall(r'class="lx-result-number">([^<]+)', strip)
    return nodes, numbers


def _graph_svg(app):
    return next(
        item.value
        for item in app.markdown
        if 'class="lx-svg lx-svg-desktop"' in item.value
    )


def test_dashboard_has_prototype_structure_navigation_and_real_metrics():
    app = AppTest.from_file(APP_PATH, default_timeout=15).run()

    assert not app.exception
    assert any(
        "LogiExpress" in item.value and "ROUTE INTELLIGENCE" in item.value
        for item in app.markdown
    )
    assert [item.value for item in app.selectbox] == [
        "Nodo A · Centro principal",
        "Nodo D · Destino",
    ]
    assert {button.key for button in app.button} >= {
        "nav-planner",
        "nav-comparison",
        "nav-guide",
    }
    assert app.segmented_control[0].options == ["Ruta individual", "Comparar los 3"]
    assert any("lx-topbar" in item.value for item in app.markdown)
    assert any("lx-metric-icon" in item.value for item in app.markdown)
    assert "Nodo A" in _graph_svg(app)
    assert "Peso 20" in _graph_svg(app)


def test_sidebar_navigation_buttons_switch_the_real_dashboard_section():
    app = AppTest.from_file(APP_PATH, default_timeout=15).run()
    compare_button = next(
        button for button in app.button if button.key == "nav-comparison"
    )

    compare_button.click().run()

    assert not app.exception
    assert app.session_state["section"] == "Comparar rutas"
    assert not any(
        "¿Cómo interpretar los resultados?" in item.value for item in app.markdown
    )


def test_dashboard_runs_individual_bfs_dfs_and_dijkstra():
    for label, path, cost, hops in (
        ("BFS", "A → D", "20", "1"),
        ("DFS", "A → B → C → D", "12", "3"),
        ("Dijkstra", "A → E → F → D", "3", "3"),
    ):
        app = AppTest.from_file(APP_PATH, default_timeout=15).run()
        app.segmented_control[0].set_value("Ruta individual").run()
        app.radio[0].set_value(label).run()
        _run(app)

        nodes, numbers = _result_values(app)
        assert " → ".join(nodes) == path
        assert numbers == [cost, hops]


def test_comparison_and_highlight_selection_remain_synchronized():
    app = AppTest.from_file(APP_PATH, default_timeout=15).run()
    app.radio[0].set_value("Dijkstra").run()
    _run(app)

    nodes, numbers = _result_values(app)
    assert " → ".join(nodes) == "A → E → F → D"
    assert numbers == ["3", "3"]
    assert "#078b7e" in _graph_svg(app)


def test_comparison_card_action_selects_the_matching_real_route():
    app = AppTest.from_file(APP_PATH, default_timeout=15).run()
    _run(app)
    next(button for button in app.button if button.key == "highlight-bfs").click().run()

    nodes, numbers = _result_values(app)
    assert nodes == ["A", "D"]
    assert numbers == ["20", "1"]
    assert "#c77734" in _graph_svg(app)


def test_changing_algorithm_after_single_run_shows_new_route_not_stale_data():
    app = AppTest.from_file(APP_PATH, default_timeout=15).run()
    app.segmented_control[0].set_value("Ruta individual").run()
    app.radio[0].set_value("BFS").run()
    _run(app)
    app.radio[0].set_value("Dijkstra").run()

    nodes, numbers = _result_values(app)
    assert nodes == ["A", "E", "F", "D"]
    assert numbers == ["3", "3"]


def test_endpoint_changes_update_route_context_and_no_old_analysis_is_retained():
    app = AppTest.from_file(APP_PATH, default_timeout=15).run()
    _run(app)
    app.selectbox[1].select("Nodo C").run()

    assert not app.exception
    assert app.selectbox[1].value == "Nodo C"
    nodes, _ = _result_values(app)
    assert nodes[-1] == "C"
    assert any("recorrido A → C" in item.value for item in app.markdown)


def test_same_origin_and_destination_returns_zero_cost_and_hops():
    app = AppTest.from_file(APP_PATH, default_timeout=15).run()
    app.selectbox[0].select("Nodo B").run()
    app.selectbox[1].select("Nodo B").run()

    nodes, numbers = _result_values(app)
    assert nodes == ["B"]
    assert numbers == ["0", "0"]
    assert "Origen y destino" in _graph_svg(app)


def test_weight_visibility_toggle_updates_responsive_graph_markup():
    app = AppTest.from_file(APP_PATH, default_timeout=15).run()
    assert "Peso 20" in _graph_svg(app)
    app.checkbox[0].uncheck().run()

    svg = _graph_svg(app)
    assert "Peso 20" not in svg
    assert 'class="lx-svg lx-svg-mobile"' in svg


def test_exchange_control_swaps_endpoints():
    app = AppTest.from_file(APP_PATH, default_timeout=15).run()
    next(button for button in app.button if button.key == "swap").click().run()

    assert [item.value for item in app.selectbox] == [
        "Nodo D · Destino",
        "Nodo A · Centro principal",
    ]
    nodes, _ = _result_values(app)
    assert nodes[0] == "D"
