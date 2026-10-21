import { useEffect, useRef, useState, type FormEvent } from "react";

import { AlgorithmComparison } from "./components/AlgorithmComparison";
import { ConfigurationPanel } from "./components/ConfigurationPanel";
import { Footer, LearningGuide, MetricCards, PageHeader, Toast, TopBar } from "./components/DashboardSections";
import { GraphPanel } from "./components/GraphPanel";
import { Sidebar, type DashboardSection } from "./components/Sidebar";
import { compareRoutes, computeRoute, getGraph, HttpApiError } from "./services/api";
import type { AlgorithmName, CompareRoutesResponse, GraphResponse, RouteResult } from "./types/api";
import { initialDashboardState, type DashboardState } from "./types/dashboard";
import "./styles.css";

export default function App() {
  const [state, setState] = useState<DashboardState>(initialDashboardState);
  const [activeSection, setActiveSection] = useState<DashboardSection>("planificador");
  const [graph, setGraph] = useState<GraphResponse | null>(null);
  const [graphLoading, setGraphLoading] = useState(true);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [compareResult, setCompareResult] = useState<CompareRoutesResponse | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const requestGeneration = useRef(0);
  const activeController = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setGraphLoading(true);
    getGraph({ signal: controller.signal })
      .then((response) => {
        setGraph(response);
        setGraphError(null);
        const defaults = defaultEndpoints(response.nodes);
        setState((current) => ({
          ...current,
          origin: response.nodes.includes(current.origin) ? current.origin : defaults.origin,
          destination: response.nodes.includes(current.destination) && current.destination !== current.origin
            ? current.destination
            : defaults.destination,
        }));
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) return;
        setGraphError(formatRequestError(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) setGraphLoading(false);
      });

    return () => {
      controller.abort();
      activeController.current?.abort();
      requestGeneration.current += 1;
    };
  }, []);

  function updateState(patch: Partial<DashboardState>) {
    const endpointsChanged = (patch.origin ?? state.origin) !== state.origin
      || (patch.destination ?? state.destination) !== state.destination;
    const modeChanged = patch.mode !== undefined && patch.mode !== state.mode;
    const singleAlgorithmChanged = state.mode === "single"
      && patch.algorithm !== undefined
      && patch.algorithm !== state.algorithm;
    if (endpointsChanged || modeChanged || singleAlgorithmChanged) clearRouteResult();
    setState((current) => ({ ...current, ...patch }));
  }

  function clearRouteResult() {
    activeController.current?.abort();
    activeController.current = null;
    requestGeneration.current += 1;
    setRouteResult(null);
    setCompareResult(null);
    setRouteLoading(false);
    setRouteError(null);
  }

  function handleNavigation(section: DashboardSection) {
    setActiveSection(section);
    if (section === "comparacion" && state.mode !== "compare") updateState({ mode: "compare" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!graph || graph.nodes.length === 0) return;

    activeController.current?.abort();
    const controller = new AbortController();
    activeController.current = controller;
    const generation = ++requestGeneration.current;
    setRouteLoading(true);
    setRouteError(null);
    setRouteResult(null);
    setCompareResult(null);

    try {
      if (state.mode === "compare") {
        const response = await compareRoutes(
          { origin: state.origin, destination: state.destination },
          { signal: controller.signal },
        );
        if (generation === requestGeneration.current) setCompareResult(response);
      } else {
        const response = await computeRoute(
          { origin: state.origin, destination: state.destination, algorithm: state.algorithm },
          { signal: controller.signal },
        );
        if (generation === requestGeneration.current) setRouteResult(response);
      }
    } catch (error: unknown) {
      if (generation === requestGeneration.current && !isAbortError(error)) {
        setRouteError(formatRequestError(error));
      }
    } finally {
      if (generation === requestGeneration.current) {
        setRouteLoading(false);
        activeController.current = null;
      }
    }
  }

  function resetDashboard() {
    const endpoints = defaultEndpoints(graph?.nodes ?? []);
    setState({ ...initialDashboardState, ...endpoints });
    setActiveSection("planificador");
    clearRouteResult();
    setToastMessage("Controles restablecidos.");
  }

  function selectAlgorithm(algorithm: AlgorithmName) {
    updateState({ algorithm });
  }

  function exportCurrentData() {
    const payload = {
      source: "fastapi",
      graph,
      selectedResult: selectedResult(state, routeResult, compareResult),
      comparison: compareResult,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `logiexpress_${state.origin}_${state.destination}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setToastMessage("Datos recibidos de FastAPI exportados.");
  }

  const currentResult = selectedResult(state, routeResult, compareResult);
  const resultMessage = routeError ?? graphError;

  return (
    <div className="app">
      <Sidebar activeSection={activeSection} onNavigate={handleNavigation} />
      <main className="main" id="inicio">
        <TopBar />
        <div className="content">
          <PageHeader onReset={resetDashboard} onExport={exportCurrentData} />
          <MetricCards nodeCount={graph?.nodes.length ?? 0} edgeCount={graph?.edges.length ?? 0} />
          <section className="workspace" id="planificador" aria-label="Planificador interactivo">
            <ConfigurationPanel
              nodes={graph?.nodes ?? []}
              disabled={graphLoading || !graph}
              state={state}
              onChange={updateState}
              onSubmit={handleSubmit}
            />
            <GraphPanel
              graph={graph}
              result={currentResult}
              origin={state.origin}
              destination={state.destination}
              algorithm={state.algorithm}
              showWeights={state.showWeights}
              onToggleWeights={(showWeights) => updateState({ showWeights })}
              isLoading={graphLoading || routeLoading}
              errorMessage={resultMessage}
            />
          </section>
          {state.mode === "compare" && (
            <AlgorithmComparison
              selectedAlgorithm={state.algorithm}
              snapshots={compareResult}
              onSelect={selectAlgorithm}
            />
          )}
          <LearningGuide />
          <Footer onBackToTop={() => setActiveSection("planificador")} />
        </div>
      </main>
      <Toast message={toastMessage} />
    </div>
  );
}

function defaultEndpoints(nodes: string[]): Pick<DashboardState, "origin" | "destination"> {
  const origin = nodes.includes("A") ? "A" : (nodes[0] ?? "");
  const destination = nodes.includes("D")
    ? "D"
    : (nodes.findLast((node) => node !== origin) ?? origin);
  return { origin, destination };
}

function selectedResult(
  state: DashboardState,
  route: RouteResult | null,
  comparison: CompareRoutesResponse | null,
): RouteResult | null {
  return state.mode === "single" ? route : comparison?.[state.algorithm] ?? null;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function formatRequestError(error: unknown): string {
  if (error instanceof HttpApiError) {
    const fields = error.fields.map((field) => `${field.path}: ${field.message}`).join("; ");
    return `HTTP ${error.status}: ${error.message}${fields ? ` (${fields})` : ""}`;
  }
  if (error instanceof TypeError) return "No se pudo conectar con FastAPI. Verifica que el servicio esté activo.";
  return "Ocurrió un error al solicitar los datos a FastAPI.";
}
