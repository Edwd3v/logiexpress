"""Streamlit presentation for the LogiExpress route-planning dashboard."""

import json

import streamlit as st

from logiexpress.algorithms.result import AlgorithmName, RouteResult
from logiexpress.infrastructure.sample_data import build_demo_graph
from logiexpress.services.route_service import compare_routes, run_route
from logiexpress.ui.graph_view import build_graph_svg

_LABELS: dict[str, AlgorithmName] = {"BFS": "bfs", "DFS": "dfs", "Dijkstra": "dijkstra"}
_DISPLAY_NAMES = {value: key for key, value in _LABELS.items()}
_COLORS = {"bfs": "#c77734", "dfs": "#7659bc", "dijkstra": "#078b7e"}
_DESCRIPTIONS = {
    "bfs": "Menor cantidad de saltos",
    "dfs": "Exploración en profundidad",
    "dijkstra": "Menor costo acumulado",
}


def _clear_results() -> None:
    st.session_state.pop("analysis", None)


def _swap_endpoints() -> None:
    origin = st.session_state.get("origin", "A")
    destination = st.session_state.get("destination", "D")
    st.session_state.origin = destination
    st.session_state.destination = origin
    _clear_results()


def _algorithm_changed() -> None:
    analysis = st.session_state.get("analysis")
    if analysis is None or len(analysis) < len(_LABELS):
        _clear_results()


def _format_path(result: RouteResult) -> str:
    return " → ".join(result.path) if result.path is not None else "Sin ruta disponible"


def _format_cost(value: float | None) -> str:
    return f"{value:g}" if value is not None else "—"


def _styles() -> None:
    st.markdown(
        """
    <style>
    :root { color-scheme:light; --lx-ink:#17243B; --lx-secondary:#475569; --lx-line:#E4EAF1; --lx-primary:#2556D8; }
    .stApp { background:#F5F7FB; color:var(--lx-ink); font-size:14px; }
    [data-testid="stHeader"] { height:0; min-height:0; background:transparent; border:0; }
    button[data-testid="stSidebarCollapsedControl"] { position:fixed; top:10px; left:10px; z-index:1000; }
    [data-testid="stToolbar"] { visibility:hidden; }
    [data-testid="stSidebar"] { background:#122139; width:224px!important; min-width:224px!important; }
    [data-testid="stSidebar"] > div:first-child { padding:22px 15px; }
    [data-testid="stSidebarUserContent"] { padding-top:0!important; position:relative; top:-76px; }
    [data-testid="stSidebar"] [data-testid="stMarkdownContainer"] { color:#C5D0E0; font-size:14px; }
    .st-key-nav-planner button,.st-key-nav-comparison button,.st-key-nav-guide button { justify-content:flex-start!important; text-align:left; padding:0 13px; color:#B0C0D3; background:transparent; border-color:transparent; gap:10px; }
    .st-key-nav-planner button:hover,.st-key-nav-comparison button:hover,.st-key-nav-guide button:hover { color:#fff; background:#20334E; border-color:transparent; }
    .st-key-nav-planner button::before,.st-key-nav-comparison button::before,.st-key-nav-guide button::before { display:inline-block; width:16px; flex:none; color:#AEBBD0; font-size:15px; text-align:center; }
    .st-key-nav-planner button::before { content:"▦"; }
    .st-key-nav-comparison button::before { content:"▥"; }
    .st-key-nav-guide button::before { content:"ⓘ"; }
    .st-key-nav-item-planner-active button,.st-key-nav-item-comparison-active button,.st-key-nav-item-guide-active button { color:#fff!important; background:#253B5A!important; border-color:transparent!important; font-weight:700; }
    .st-key-nav-item-planner-active button::before,.st-key-nav-item-comparison-active button::before,.st-key-nav-item-guide-active button::before { color:#72A7FF; }
    [data-testid="stMainBlockContainer"] { max-width:1570px; padding:0 34px 60px; }
    [data-testid="stVerticalBlock"] > [data-testid="stElementContainer"] { min-width:0; }
    [data-testid="stMain"] [data-testid="stMarkdownContainer"], [data-testid="stMain"] label { color:var(--lx-ink); }
    [data-testid="stMain"] p { color:var(--lx-secondary); font-size:13px; line-height:1.5; }
    [data-testid="stMain"] [data-testid="stCaptionContainer"] { color:var(--lx-secondary); font-size:13px; }
    [data-testid="stMain"] h2 { color:#17243B; font-size:18px; }
    [data-testid="stSelectbox"] div[data-baseweb="select"] > div { background:#fff; border:1px solid #C6D2E1; color:var(--lx-ink); min-height:42px; }
    [data-testid="stSelectbox"] div[data-baseweb="select"] input { color:var(--lx-ink); }
    [data-testid="stSelectbox"] div[data-baseweb="select"] svg { fill:#334155; }
    [data-testid="stSelectbox"] div[data-baseweb="select"] > div:focus-within { border-color:#2556D8; box-shadow:0 0 0 2px #2556D8; }
    [data-testid="stRadio"] label { color:var(--lx-ink); font-size:14px; }
    [data-testid="stRadio"] label:has(input:checked) { font-weight:700; }
    [data-testid="stSegmentedControl"] { padding:4px; border-radius:10px; background:#F0F3F8; }
    [data-testid="stSegmentedControl"] button { min-height:37px; color:#526681; font-size:12px; font-weight:650; }
    [data-testid="stSegmentedControl"] button[aria-pressed="true"] { background:#fff; color:#264264; box-shadow:0 2px 7px rgba(21,42,71,.12); }
    [data-testid="stCheckbox"] label { color:var(--lx-ink); font-size:13px; }
    .st-key-algorithm-picker [data-testid="stRadio"] label:has(input) { display:flex; min-height:50px; margin:0 0 6px; padding:7px 10px; align-items:center; gap:10px; border:1px solid #E1E7F0; border-radius:10px; background:#fff; white-space:pre-line; }
    .st-key-algorithm-picker [data-testid="stRadio"] label:has(input):hover { background:#FAFCFF; border-color:#9CB8E9; }
    .st-key-algorithm-picker [data-testid="stRadio"] label:has(input:checked) { background:#F4F7FF; border-color:#2556D8; }
    .st-key-algorithm-picker [data-testid="stRadio"] label:not(:has(input)) { display:none; }
    [data-testid="stVerticalBlockBorderWrapper"] { background:#fff; border-color:#E4EAF1!important; border-radius:17px; padding:16px 18px; box-shadow:0 8px 28px rgba(27,43,73,.045); }
    .lx-topbar { height:68px; margin:-16px -34px 29px; padding:0 35px; display:flex; align-items:center; justify-content:space-between; gap:12px; background:#fff; border-bottom:1px solid #E4EAF1; }
    .lx-breadcrumb { color:#73819A; font-size:12px; }
    .lx-breadcrumb strong { color:#33435D; font-weight:700; }
    .lx-top-actions { display:flex; align-items:center; gap:12px; }
    .lx-version { padding:7px 10px; border:1px solid #E4EAF1; border-radius:99px; background:#F3F6FA; color:#475569; font-size:11px; }
    .lx-avatar { display:grid; place-items:center; width:34px; height:34px; border-radius:50%; background:#DCE7FE; color:#2752A6; font-size:11px; font-weight:800; }
    .lx-brand { display:flex; align-items:center; gap:10px; color:#fff; padding:0 8px 31px; font-size:17px; font-weight:800; }
    .lx-brand-mark { display:grid; place-items:center; width:34px; height:34px; border-radius:10px; background:#2C64DE; }
    .lx-brand strong { display:block; color:#fff; font-size:17px; letter-spacing:-.6px; line-height:1.1; }
    .lx-brand span { display:block; color:#C5D0E0; font-size:10px; letter-spacing:1.3px; font-weight:600; margin-top:3px; }
    .lx-nav-label { color:#8296B2; padding:0 14px 8px; font-size:10px; letter-spacing:1.3px; font-weight:750; }
    .lx-sidebar-card { margin-top:max(0px,calc(100vh - 462px)); background:#1B2C46; border:1px solid #2C3E5A; border-radius:12px; padding:14px; color:#C5D0E0; font-size:12px; line-height:1.55; }
    .lx-page-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:18px; margin:0 0 24px; }
    .lx-eyebrow { color:#2556D8; font-size:10px; letter-spacing:1.4px; font-weight:800; text-transform:uppercase; }
    .lx-title { color:#17243B; font-size:29px; font-weight:800; letter-spacing:-1.2px; margin:2px 0 4px; line-height:1.16; }
    .lx-subtitle { color:#73819A; font-size:13px; margin:0; }
    .lx-metric { display:flex; align-items:center; gap:12px; background:#fff; border:1px solid #E4EAF1; border-radius:13px; padding:14px 17px; min-height:70px; margin-bottom:20px; }
    .lx-metric-icon { display:grid; place-items:center; width:36px; height:36px; border-radius:11px; flex:none; }
    .lx-metric b { display:block; color:#17243B; font-size:21px; line-height:1.1; }
    .lx-metric small { color:#73819A; font-size:11px; }
    .lx-panel-title { margin:0; color:#17243B; font-size:15px; font-weight:780; }
    .lx-panel-subtitle { margin:5px 0 15px; color:#73819A; font-size:11px; }
    .lx-field-title { color:#445875; font-size:12px; font-weight:700; margin:2px 0 8px; }
    .lx-control-rule { border:0; border-top:1px solid #E4EAF1; margin:12px 0 14px; }
    .st-key-swap-control { justify-content:center!important; margin:-7px 0!important; }
    .st-key-swap-control [data-testid="stButton"] button { width:30px; height:30px; min-height:30px; padding:0; border-radius:50%; color:#526B8D; font-size:15px; }
    .st-key-swap-control [data-testid="stButton"] button { width:34px; height:34px; min-height:34px; padding:0; border-radius:50%; color:#526B8D; font-size:16px; }
    .st-key-algorithm-picker [data-testid="stRadio"] label:has(input) div[data-testid="stMarkdownContainer"] { white-space:pre-line; }
    .st-key-algorithm-picker [data-testid="stRadio"] label:has(input) p { margin:0; color:#526B8D; font-size:11px; }
    .lx-algo { background:#fff; border:1px solid #E1E7F0; border-radius:10px; padding:12px; color:#263B57; font-size:13px; }
    .lx-algo.selected { border-color:#ADC4FA; background:#F4F7FF; box-shadow:0 0 0 1px #EAF0FF; }
    .lx-algo .cost { font-size:25px; font-weight:820; margin-top:8px; color:#111827; }
    .lx-dot { display:inline-block; height:9px; width:9px; border-radius:50%; margin-right:7px; }
    .lx-muted { color:#73819A; font-size:11px; }
    .lx-graph-tools { display:flex; align-items:center; justify-content:flex-end; gap:10px; }
    .lx-tag { border:1px solid #E4EAF1; border-radius:99px; background:#F8FAFC; padding:6px 9px; color:#475569; font-size:11px; font-weight:650; white-space:nowrap; }
    .lx-graph-canvas { position:relative; margin:0 0 9px; overflow:hidden; border:1px solid #E7EDF4; border-radius:12px; background-color:#F8FAFC; background-image:radial-gradient(#DCE5F0 0.8px,transparent .8px); background-size:20px 20px; }
    .lx-graph-topline { display:flex; justify-content:space-between; align-items:center; gap:8px; padding:9px 10px 0; color:#73819A; font-size:10px; }
    .lx-graph-tag { padding:6px 9px; border:1px solid #E4EAF1; border-radius:8px; background:#fff; color:#526B8D; font-weight:650; }
    .lx-svg { display:block; width:100%; height:auto; }
    .lx-svg-mobile { display:none; }
    .lx-legend { display:flex; flex-wrap:wrap; gap:15px; padding:2px 0 9px; color:#526B8D; font-size:10px; }
    .lx-legend span { display:inline-flex; align-items:center; gap:6px; }
    .lx-legend i { display:inline-block; width:16px; height:3px; border-radius:3px; background:#D2DDEB; }
    .lx-legend .lx-legend-route { width:16px; height:3px; }
    .lx-legend .lx-legend-node { width:9px; height:9px; border:2px solid #9EB4CF; border-radius:50%; background:#fff; }
    .lx-result-strip { display:grid; grid-template-columns:minmax(0,1fr) 82px 82px; align-items:center; gap:12px; padding:12px 15px; margin:9px 0; border:1px solid #E4EAF1; border-radius:12px; background:#FBFCFF; }
    .lx-route { color:#17243B; font-size:13px; font-weight:700; overflow-wrap:anywhere; }
    .lx-route-node { display:inline-block; padding:6px 9px; margin-right:5px; border-radius:7px; background:#E4F5F2; color:#087F77; }
    .lx-result-number { text-align:center; border-left:1px solid #E4EAF1; color:#17243B; font-size:22px; font-weight:800; }
    .lx-result-number small { display:block; color:#73819A; font-size:10px; font-weight:500; }
    .lx-note { background:#F3F6FA; color:#526B8D; border-radius:10px; padding:12px; font-size:11px; line-height:1.55; }
    .lx-result-kicker { margin-bottom:7px; color:#526B8D; font-size:11px; font-weight:700; }
    .lx-comparison-heading { display:flex; justify-content:space-between; align-items:center; gap:12px; margin:24px 0 12px; }
    .lx-comparison-heading h2 { margin:0; font-size:17px!important; }
    .lx-comparison-heading p { margin:4px 0 0; color:#73819A!important; font-size:12px!important; }
    .lx-learning { display:flex; align-items:flex-start; gap:12px; margin-top:18px; padding:16px 19px; border:1px solid #E4EAF1; border-radius:16px; background:#fff; color:#17243B; font-size:13px; }
    .lx-learning-icon { display:grid; place-items:center; width:32px; height:32px; flex:none; border-radius:9px; background:#EAF0FF; color:#2556D8; font-size:17px; }
    .lx-learning p { margin:4px 0 0; color:#526B8D!important; font-size:12px!important; line-height:1.55; }
    .st-key-comparison-card-bfs [data-testid="stButton"] button,
    .st-key-comparison-card-dfs [data-testid="stButton"] button,
    .st-key-comparison-card-dijkstra [data-testid="stButton"] button { min-height:30px; font-size:11px; }
    .st-key-comparison-card-bfs button[kind="primary"] { color:#70451F!important; background:#FFF2E7!important; border:1px solid #F2D3BB!important; }
    .st-key-comparison-card-dfs button[kind="primary"] { color:#55408C!important; background:#F1EDFB!important; border:1px solid #D6C9F0!important; }
    .st-key-comparison-card-dijkstra button[kind="primary"] { color:#08665E!important; background:#E4F5F2!important; border:1px solid #B8E2D8!important; }
    .lx-comparison-action button { width:100%; background:transparent!important; border:0!important; min-height:28px!important; padding:2px!important; color:#526B8D!important; font-size:11px!important; box-shadow:none!important; }
    .lx-comparison-action button:hover { color:#2556D8!important; text-decoration:underline; }
    [data-testid="stMain"] div.stButton > button { color:#374860; background:#fff; border:1px solid #E4EAF1; border-radius:10px; min-height:39px; font-size:12px; font-weight:690; }
    [data-testid="stMain"] div.stButton > button:hover { color:#17243B; background:#F8FAFC; border-color:#C6D2E1; }
    [data-testid="stMain"] div.stButton > button:focus-visible, [data-testid="stMain"] [data-testid="stSelectbox"]:focus-within, [data-testid="stMain"] [data-testid="stRadio"]:focus-within { outline:3px solid #2556D8; outline-offset:2px; }
    [data-testid="stMain"] div.stButton > button[kind="primary"] { color:#fff; background:#2556D8; border-color:#2556D8; min-height:44px; font-size:13px; font-weight:750; }
    [data-testid="stMain"] div.stButton > button[kind="primary"]:hover { color:#fff; background:#1D46B1; border-color:#1D46B1; }
    [data-testid="stMain"] [data-testid="stBaseButton-primary"] { color:#fff!important; }
    .st-key-execute-analysis [data-testid="stBaseButton-primary"],
    .st-key-execute-analysis [data-testid="stBaseButton-primary"] * { color:#fff!important; }
    [data-testid="stMain"] div.stButton > button:disabled { color:#475569; background:#E2E8F0; border-color:#64748B; opacity:1; }
    @media(max-width:1140px) {
      [data-testid="stSidebar"] { width:65px!important; min-width:65px!important; }
      .lx-brand span,.lx-nav-label,.lx-sidebar-card { display:none; }
      .st-key-nav-item-planner,.st-key-nav-item-planner-active,.st-key-nav-item-comparison,.st-key-nav-item-comparison-active,.st-key-nav-item-guide,.st-key-nav-item-guide-active { width:42px; margin:0 auto; }
      .st-key-nav-planner button,.st-key-nav-comparison button,.st-key-nav-guide button { width:42px; height:42px; min-height:42px; justify-content:center!important; padding:0; }
      .st-key-nav-planner button > div,.st-key-nav-comparison button > div,.st-key-nav-guide button > div { display:none; }
    }
    @media(max-width:860px) { .lx-page-heading { align-items:flex-start; } }
    @media(max-width:600px) {
      [data-testid="stSidebar"] { display:none!important; }
      button[data-testid="stSidebarCollapsedControl"] { display:none!important; }
      [data-testid="stMainBlockContainer"] { padding:0 15px 40px; }
      .lx-topbar { height:55px; margin:-16px -15px 20px; padding:0 17px; }
      .lx-version,.lx-brand span,.lx-sidebar-card { display:none; }
      .lx-page-heading { display:block; margin-bottom:17px; }
      .lx-title { font-size:26px; }
      .lx-header-actions { margin-top:12px; }
      .st-key-header-actions [data-testid="stHorizontalBlock"],
      .st-key-metrics-row [data-testid="stHorizontalBlock"] { display:flex!important; flex-direction:row!important; flex-wrap:nowrap!important; align-items:stretch!important; gap:7px!important; width:100%!important; }
      .st-key-header-actions [data-testid="stHorizontalBlock"] > div,
      .st-key-metrics-row [data-testid="stHorizontalBlock"] > div { flex:1 1 0!important; min-width:0!important; width:0!important; max-width:none!important; }
      .st-key-header-actions [data-testid="stButton"] button,
      .st-key-header-actions [data-testid="stDownloadButton"] button { min-height:39px; padding:0 5px; font-size:11px; white-space:nowrap; }
      .lx-metric { width:100%; box-sizing:border-box; padding:8px 6px; gap:5px; min-height:60px; margin-bottom:15px; }
      .lx-metric-icon { width:27px; height:27px; }
      .lx-metric b { font-size:16px; }
      .lx-metric small { display:block; font-size:8px; line-height:1.2; }
      [data-testid="stVerticalBlockBorderWrapper"] { padding:13px 12px; }
      .lx-result-strip { grid-template-columns:minmax(0,1fr) 64px 64px; padding:10px 8px; gap:5px; }
      .lx-route { font-size:11px; }
      .lx-svg-desktop { display:none; }
      .lx-svg-mobile { display:block; }
      .lx-comparison-heading { align-items:flex-start; }
      .lx-comparison-heading .lx-tag { align-self:center; }
      .st-key-section-nav { display:block; }
    }
    </style>""",
        unsafe_allow_html=True,
    )


def _metric(value: int, label: str, accent: str, pale: str, icon: str) -> None:
    st.markdown(
        f'<div class="lx-metric"><span class="lx-metric-icon" '
        f'style="background:{pale};color:{accent}"><svg width="19" height="19" '
        f'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" '
        f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{icon}</svg></span>'
        f"<span><b>{value:02}</b><small>{label}</small></span></div>",
        unsafe_allow_html=True,
    )


def _select_algorithm(name: str) -> None:
    st.session_state.algorithm = name
    analysis = st.session_state.get("analysis")
    if analysis is not None and len(analysis) == 1 and _LABELS[name] not in analysis:
        st.session_state.pop("analysis", None)


def _set_section(section: str) -> None:
    st.session_state.section = section


def _summary_card(name: AlgorithmName, result: RouteResult, selected: bool) -> None:
    color = _COLORS[name]
    state = " · Destacada" if selected else ""
    cost = _format_cost(result.total_weight)
    hops = str(result.hops) if result.hops is not None else "—"
    path = _format_path(result)
    st.markdown(
        f'<div class="lx-algo {"selected" if selected else ""}"><b><span class="lx-dot" style="background:{color}"></span>{_DISPLAY_NAMES[name]}</b>'
        f'<span style="float:right;color:#334155;font-size:11px;font-weight:700">{state}</span>'
        f'<p class="lx-muted">{_DESCRIPTIONS[name]}</p>'
        f'<div class="cost">{cost} <small style="font-size:11px;color:#73819a">costo</small> '
        f'<small style="font-size:12px;color:#73819a;font-weight:500">{hops} saltos</small></div>'
        f'<hr style="border:0;border-top:1px solid #E4EAF1">'
        f'<small class="lx-muted" style="font-size:10px">RECORRIDO</small><br>'
        f'<b style="font-size:11px">{path}</b></div>',
        unsafe_allow_html=True,
    )


def main() -> None:
    """Render the dashboard and delegate every route calculation to services."""
    st.set_page_config(
        page_title="LogiExpress · Planificación de rutas", page_icon="🚚", layout="wide"
    )
    _styles()
    graph = build_demo_graph()
    nodes = graph.node_ids()

    if "algorithm" not in st.session_state:
        st.session_state.algorithm = "Dijkstra"
    if "mode" not in st.session_state:
        st.session_state.mode = "Comparar los 3"

    with st.sidebar:
        st.markdown(
            '<div class="lx-brand"><span class="lx-brand-mark"><svg width="22" height="22" '
            'viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" '
            'stroke-linecap="round"><circle cx="5" cy="6" r="2"/><circle cx="18" cy="5" r="2"/>'
            '<circle cx="17" cy="18" r="2"/><path d="M7 6h9M18 7v9M7 7l8 9"/></svg></span>'
            "<span><strong>LogiExpress</strong><span>ROUTE INTELLIGENCE</span></span></div>"
            '<div class="lx-nav-label">ESPACIO DE TRABAJO</div>',
            unsafe_allow_html=True,
        )
        if "section" not in st.session_state:
            st.session_state.section = "Planificador"
        for section_key, section_label in (
            ("planner", "Planificador"),
            ("comparison", "Comparar rutas"),
            ("guide", "Guía de algoritmos"),
        ):
            active = st.session_state.section == section_label
            with st.container(
                key=f"nav-item-{section_key}{'-active' if active else ''}"
            ):
                st.button(
                    section_label,
                    key=f"nav-{section_key}",
                    on_click=_set_section,
                    args=(section_label,),
                    use_container_width=True,
                )
        section = st.session_state.section
        st.markdown(
            '<div class="lx-sidebar-card"><b>●&nbsp; Demo conectada</b><br>'
            "Los resultados de rutas se calculan con el motor Python del proyecto.</div>"
            '<div class="lx-nav-label" style="padding-top:14px">RED LOCAL · V1</div>',
            unsafe_allow_html=True,
        )

    with st.container():
        st.markdown(
            '<div class="lx-topbar"><div class="lx-breadcrumb">Workspace&nbsp; / &nbsp;'
            '<strong>Planificador de rutas</strong></div><div class="lx-top-actions">'
            '<span class="lx-version">Backend Python · red de demostración</span>'
            '<span class="lx-avatar">LE</span></div></div>',
            unsafe_allow_html=True,
        )
        analysis: dict[AlgorithmName, RouteResult] | None = st.session_state.get(
            "analysis"
        )
        payload = None
        if analysis is not None:
            payload = {
                "origin": next(iter(analysis.values())).origin,
                "destination": next(iter(analysis.values())).destination,
                "results": {
                    name: {
                        "path": result.path,
                        "visited_order": result.visited_order,
                        "hops": result.hops,
                        "total_weight": result.total_weight,
                        "found": result.found,
                    }
                    for name, result in analysis.items()
                },
            }
        heading, header_actions = st.columns([6, 3], vertical_alignment="bottom")
        with heading:
            st.markdown(
                '<div class="lx-page-heading"><div><div class="lx-eyebrow">CENTRO DE OPERACIONES</div>'
                '<div class="lx-title">Planificación de rutas</div>'
                '<p class="lx-subtitle">Explora la red logística, analiza recorridos y compara estrategias de búsqueda.</p>'
                "</div></div>",
                unsafe_allow_html=True,
            )
        with header_actions, st.container(key="header-actions"):
            reset_col, export_col = st.columns(2, gap="small")
            if reset_col.button("↻ Restablecer", use_container_width=True):
                for key in (
                    "analysis",
                    "analysis_error",
                    "origin",
                    "destination",
                    "algorithm",
                    "mode",
                ):
                    st.session_state.pop(key, None)
                st.rerun()
            export_col.download_button(
                "⇩ Exportar JSON",
                json.dumps(payload, ensure_ascii=False, indent=2) if payload else "{}",
                "logiexpress-analysis.json",
                "application/json",
                disabled=payload is None,
                use_container_width=True,
            )

        with st.container(key="metrics-row"):
            metrics = st.columns(3, gap="small")
            metric_data = (
                (
                    len(nodes),
                    "Ubicaciones en la red",
                    "#2556D8",
                    "#EAF0FF",
                    '<circle cx="5" cy="12" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="m7 11 10-5M7 13l10 5"/>',
                ),
                (
                    sum(len(graph.neighbors(node)) for node in nodes) // 2,
                    "Conexiones ponderadas",
                    "#078B7E",
                    "#E4F5F2",
                    '<path d="m3 16 7-9 5 4 6-7M3 20h18"/>',
                ),
                (
                    len(_LABELS),
                    "Algoritmos disponibles",
                    "#7659BC",
                    "#F1EDFB",
                    '<path d="M4 6h16M4 12h10M4 18h14"/>',
                ),
            )
            for column, (value, label, accent, pale, icon) in zip(metrics, metric_data):
                with column:
                    _metric(value, label, accent, pale, icon)

        with st.container(border=False):
            controls, visual = st.columns([1, 2.6], gap="medium")
            with controls, st.container(border=True):
                st.markdown(
                    '<div class="lx-panel-title">Configurar análisis</div>'
                    '<div class="lx-panel-subtitle">Selecciona los puntos y el tipo de recorrido.</div>',
                    unsafe_allow_html=True,
                )
                mode = st.segmented_control(
                    "Modo de análisis",
                    options=("Ruta individual", "Comparar los 3"),
                    key="mode",
                    label_visibility="visible",
                    width="stretch",
                )
                mode = mode or "Comparar los 3"
                node_labels = {
                    node: "Nodo A · Centro principal"
                    if node == "A"
                    else "Nodo D · Destino"
                    if node == "D"
                    else f"Nodo {node}"
                    for node in nodes
                }
                label_to_node = {label: node for node, label in node_labels.items()}
                origin_label = st.selectbox(
                    "Origen",
                    tuple(node_labels.values()),
                    index=0,
                    key="origin",
                    on_change=_clear_results,
                )
                origin = label_to_node[origin_label]
                with st.container(
                    key="swap-control",
                    horizontal=True,
                    horizontal_alignment="center",
                ):
                    st.button(
                        "↕",
                        help="Intercambiar origen y destino",
                        key="swap",
                        on_click=_swap_endpoints,
                    )
                destination_label = st.selectbox(
                    "Destino",
                    tuple(node_labels.values()),
                    index=nodes.index("D"),
                    key="destination",
                    on_change=_clear_results,
                )
                destination = label_to_node[destination_label]
                st.markdown('<hr class="lx-control-rule">', unsafe_allow_html=True)
                st.markdown(
                    '<div class="lx-field-title">Algoritmo destacado en el grafo</div>',
                    unsafe_allow_html=True,
                )
                with st.container(key="algorithm-picker"):
                    algorithm_label = st.radio(
                        "Algoritmo",
                        tuple(_LABELS),
                        format_func=lambda name: (
                            f"{name}\n{_DESCRIPTIONS[_LABELS[name]]}"
                        ),
                        label_visibility="collapsed",
                        key="algorithm",
                        on_change=_algorithm_changed,
                    )
                if st.button(
                    "⌕  Ejecutar análisis",
                    type="primary",
                    use_container_width=True,
                    key="execute-analysis",
                ):
                    try:
                        st.session_state.analysis = (
                            compare_routes(graph, origin, destination)
                            if mode == "Comparar los 3"
                            else {
                                _LABELS[algorithm_label]: run_route(
                                    graph, origin, destination, _LABELS[algorithm_label]
                                )
                            }
                        )
                    except (KeyError, ValueError) as error:
                        st.session_state.analysis_error = str(error)
                    else:
                        st.session_state.pop("analysis_error", None)
                    st.rerun()
                if st.session_state.get("analysis_error"):
                    st.error(st.session_state.analysis_error)

            if analysis is None:
                display: RouteResult = run_route(
                    graph, origin, destination, _LABELS[algorithm_label]
                )
                shown_results = compare_routes(graph, origin, destination)
            else:
                selected_algorithm = _LABELS[algorithm_label]
                display = analysis.get(selected_algorithm) or run_route(
                    graph, origin, destination, selected_algorithm
                )
                shown_results = (
                    analysis
                    if len(analysis) == len(_LABELS)
                    else compare_routes(graph, origin, destination)
                )
            with visual, st.container(border=True):
                graph_title, graph_actions = st.columns(
                    [1.5, 1], vertical_alignment="center"
                )
                with graph_title:
                    st.markdown(
                        '<div class="lx-panel-title">Red de distribución</div>'
                        f'<div class="lx-panel-subtitle">Vista de la red · recorrido {display.origin} → {display.destination}</div>',
                        unsafe_allow_html=True,
                    )
                with graph_actions:
                    weight_col, network_col = st.columns(
                        [1, 1.2], vertical_alignment="center"
                    )
                    with weight_col:
                        show_weights = st.checkbox(
                            "Mostrar pesos", value=True, key="show_weights"
                        )
                    with network_col:
                        st.markdown(
                            '<div class="lx-graph-tools"><span class="lx-tag">●&nbsp; Grafo no dirigido</span></div>',
                            unsafe_allow_html=True,
                        )
                st.markdown(
                    '<div class="lx-graph-canvas"><div class="lx-graph-topline">'
                    '<span class="lx-graph-tag">⌘&nbsp; Red logística</span>'
                    "<span>Topología conceptual · no es un mapa geográfico</span></div>"
                    f"{build_graph_svg(graph, display, show_weights=show_weights)}</div>",
                    unsafe_allow_html=True,
                )
                st.markdown(
                    f'<div class="lx-legend"><span><i class="lx-legend-route" style="background:{_COLORS[display.algorithm]}"></i>Ruta destacada</span>'
                    '<span><i class="lx-legend-edge"></i>Conexión disponible</span>'
                    '<span><i class="lx-legend-node"></i>Ubicación</span></div>',
                    unsafe_allow_html=True,
                )
                if display.found:
                    route_nodes = " <span aria-hidden='true'>→</span> ".join(
                        f'<span class="lx-route-node">{node}</span>'
                        for node in display.path or ()
                    )
                    st.markdown(
                        '<div class="lx-result-strip"><div><div class="lx-result-kicker">'
                        f"✓&nbsp; Ruta destacada · {_DISPLAY_NAMES[display.algorithm]}</div>"
                        f'<div class="lx-route">{route_nodes}</div></div>'
                        f'<div class="lx-result-number">{_format_cost(display.total_weight)}<small>Costo total</small></div>'
                        f'<div class="lx-result-number">{display.hops}<small>Saltos</small></div></div>',
                        unsafe_allow_html=True,
                    )
                    explanations = {
                        "bfs": "BFS minimiza el número de aristas; en una red ponderada no necesariamente minimiza el costo.",
                        "dfs": "DFS explora en profundidad y encuentra una ruta posible, sin garantizar optimalidad.",
                        "dijkstra": "Dijkstra minimiza el costo acumulado de la ruta cuando todos los pesos son no negativos.",
                    }
                    st.markdown(
                        f'<div class="lx-note">ⓘ&nbsp; {explanations[display.algorithm]} '
                        f"Orden de exploración: {' → '.join(display.visited_order)}.</div>",
                        unsafe_allow_html=True,
                    )
                else:
                    st.warning(
                        "No existe una ruta entre el origen y el destino seleccionados."
                    )

        if section != "Guía de algoritmos":
            st.markdown(
                '<div class="lx-comparison-heading"><div><h2>Comparación de algoritmos</h2>'
                "<p>Selecciona una tarjeta para destacar su ruta en el grafo.</p></div>"
                '<span class="lx-tag">Análisis comparativo</span></div>',
                unsafe_allow_html=True,
            )
            cards = st.columns(3, gap="small")
            selected_name = display.algorithm
            for column, (name, result) in zip(cards, shown_results.items()):
                with column, st.container(key=f"comparison-card-{name}"):
                    _summary_card(name, result, name == selected_name)
                    st.button(
                        f"Ver ruta · {_DISPLAY_NAMES[name]}",
                        key=f"highlight-{name}",
                        type="primary" if name == selected_name else "secondary",
                        use_container_width=True,
                        on_click=_select_algorithm,
                        args=(_DISPLAY_NAMES[name],),
                    )
        if section != "Comparar rutas":
            st.markdown(
                '<div class="lx-learning"><span class="lx-learning-icon">▤</span><div>'
                "<b>¿Cómo interpretar los resultados?</b><p><strong>BFS</strong> minimiza la cantidad de aristas, "
                "no necesariamente el costo. <strong>DFS</strong> explora en profundidad y no garantiza un camino mínimo. "
                "<strong>Dijkstra</strong> minimiza la suma de pesos no negativos. Los pesos son costos ficticios, no kilómetros ni tiempos.</p>"
                "</div></div>",
                unsafe_allow_html=True,
            )
