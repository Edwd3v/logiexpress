import json
from pathlib import Path

from streamlit.testing.v1 import AppTest

APP_PATH = Path(__file__).resolve().parents[1] / "app.py"


def test_dashboard_starts_without_exceptions():
    app = AppTest.from_file(APP_PATH, default_timeout=10).run()

    assert not app.exception
    assert app.title[0].value == "LogiExpress"


def test_dashboard_selectors_and_comparison_render_results():
    app = AppTest.from_file(APP_PATH, default_timeout=10).run()

    assert [item.value for item in app.selectbox] == ["A", "D", "BFS"]
    assert len(app.button) == 1

    app.checkbox[0].check().run()
    app.button[0].click().run()

    assert not app.exception
    assert len(app.dataframe) == 1
    assert app.metric[0].value == "A → D"


def test_dashboard_can_select_dijkstra_and_run_individual_analysis():
    app = AppTest.from_file(APP_PATH, default_timeout=10).run()

    app.selectbox[2].select("Dijkstra").run()
    app.button[0].click().run()

    assert not app.exception
    assert app.metric[0].value == "A → E → F → D"


def test_dashboard_can_execute_dfs_individually():
    app = AppTest.from_file(APP_PATH, default_timeout=10).run()

    app.selectbox[2].select("DFS").run()
    app.button[0].click().run()

    assert not app.exception
    assert app.metric[0].value == "A → B → C → D"
    assert app.metric[1].value == "3"
    assert app.metric[2].value == "12"


def test_dashboard_comparison_can_highlight_selected_algorithm():
    app = AppTest.from_file(APP_PATH, default_timeout=10).run()

    app.selectbox[2].select("Dijkstra").run()
    app.checkbox[0].check().run()
    app.button[0].click().run()

    assert not app.exception
    assert app.metric[0].value == "A → E → F → D"
    assert len(app.dataframe) == 1
    assert any("finalizada" in item.value for item in app.caption)


def test_changing_algorithm_after_comparison_keeps_comparison_results_current():
    app = AppTest.from_file(APP_PATH).run()
    app.checkbox[0].check().run()
    app.button[0].click().run()

    app.selectbox[2].select("Dijkstra").run()

    assert not app.exception
    assert len(app.dataframe) == 1
    assert app.subheader[1].value == "Resultado: Dijkstra"
    assert app.metric[0].value == "A → E → F → D"
    rendered = json.loads(app.get("plotly_chart")[0].proto.spec)
    selected_route = next(trace for trace in rendered["data"] if trace["name"] == "Ruta seleccionada")
    segments = set()
    for index in range(0, len(selected_route["x"]), 3):
        start = (selected_route["x"][index], selected_route["y"][index])
        end = (selected_route["x"][index + 1], selected_route["y"][index + 1])
        segments.add(frozenset((start, end)))
    assert segments == {
        frozenset(((0.0, 1.0), (1.0, 0.3))),
        frozenset(((1.0, 0.3), (2.0, 0.3))),
        frozenset(((2.0, 0.3), (3.0, 1.0))),
    }


def test_changing_endpoints_after_execution_clears_stale_results():
    app = AppTest.from_file(APP_PATH, default_timeout=10).run()
    app.button[0].click().run()

    app.selectbox[1].select("C").run()

    assert not app.exception
    assert not app.metric
    assert any("Configurá la consulta" in item.value for item in app.info)


def test_changing_origin_after_execution_clears_stale_results():
    app = AppTest.from_file(APP_PATH, default_timeout=10).run()
    app.button[0].click().run()

    app.selectbox[0].select("B").run()

    assert not app.exception
    assert not app.metric
    assert any("Configurá la consulta" in item.value for item in app.info)


def test_dashboard_accepts_equal_origin_and_destination():
    app = AppTest.from_file(APP_PATH, default_timeout=10).run()

    app.selectbox[0].select("B").run()
    app.selectbox[1].select("B").run()
    app.button[0].click().run()

    assert not app.exception
    assert app.metric[0].value == "B"
    assert app.metric[1].value == "0"
    assert app.metric[2].value == "0"
