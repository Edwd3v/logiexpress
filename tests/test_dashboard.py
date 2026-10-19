from pathlib import Path

from streamlit.testing.v1 import AppTest

APP_PATH = Path(__file__).resolve().parents[1] / "app.py"


def test_dashboard_starts_without_exceptions():
    app = AppTest.from_file(APP_PATH).run()

    assert not app.exception
    assert app.title[0].value == "LogiExpress"


def test_dashboard_selectors_and_comparison_render_results():
    app = AppTest.from_file(APP_PATH).run()

    assert [item.value for item in app.selectbox] == ["A", "D", "BFS"]
    assert len(app.button) == 1

    app.checkbox[0].check().run()
    app.button[0].click().run()

    assert not app.exception
    assert len(app.dataframe) == 1
    assert app.metric[0].value == "A → D"


def test_dashboard_can_select_dijkstra_and_run_individual_analysis():
    app = AppTest.from_file(APP_PATH).run()

    app.selectbox[2].select("Dijkstra").run()
    app.button[0].click().run()

    assert not app.exception
    assert app.metric[0].value == "A → E → F → D"


def test_dashboard_comparison_can_highlight_selected_algorithm():
    app = AppTest.from_file(APP_PATH).run()

    app.selectbox[2].select("Dijkstra").run()
    app.checkbox[0].check().run()
    app.button[0].click().run()

    assert not app.exception
    assert app.metric[0].value == "A → E → F → D"
    assert len(app.dataframe) == 1
    assert any("finalizada" in item.value for item in app.caption)


def test_dashboard_accepts_equal_origin_and_destination():
    app = AppTest.from_file(APP_PATH).run()

    app.selectbox[0].select("B").run()
    app.selectbox[1].select("B").run()
    app.button[0].click().run()

    assert not app.exception
    assert app.metric[0].value == "B"
    assert app.metric[1].value == "0"
    assert app.metric[2].value == "0"
