import { useState, type FormEvent } from "react";

import { AlgorithmComparison } from "./components/AlgorithmComparison";
import { ConfigurationPanel } from "./components/ConfigurationPanel";
import { Footer, LearningGuide, MetricCards, PageHeader, Toast, TopBar } from "./components/DashboardSections";
import { GraphPanel } from "./components/GraphPanel";
import { Sidebar, type DashboardSection } from "./components/Sidebar";
import { demoGraph, demoRouteSnapshots, demoScenario } from "./data/demoGraph";
import type { AlgorithmName } from "./types/api";
import { initialDashboardState, type DashboardState } from "./types/dashboard";
import "./styles.css";

export default function App() {
  const [state, setState] = useState<DashboardState>(initialDashboardState);
  const [activeSection, setActiveSection] = useState<DashboardSection>("planificador");
  const [toastMessage, setToastMessage] = useState("");
  const hasStaticScenario =
    state.origin === demoScenario.origin && state.destination === demoScenario.destination;
  const snapshots = hasStaticScenario ? demoRouteSnapshots : null;
  const selectedSnapshot = snapshots?.[state.algorithm] ?? null;

  function updateState(patch: Partial<DashboardState>) {
    setState((current) => ({ ...current, ...patch }));
  }

  function handleNavigation(section: DashboardSection) {
    setActiveSection(section);
    if (section === "comparacion" && state.mode !== "compare") {
      updateState({ mode: "compare" });
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setToastMessage(
      hasStaticScenario
        ? "Mostrando ejemplos estáticos A → D; no se ejecutaron algoritmos."
        : `No hay un ejemplo estático para ${state.origin} → ${state.destination}.`,
    );
  }

  function resetDashboard() {
    setState(initialDashboardState);
    setActiveSection("planificador");
    setToastMessage("Vista restablecida al ejemplo A → D.");
  }

  function selectAlgorithm(algorithm: AlgorithmName) {
    updateState({ algorithm });
  }

  function exportDemoJson() {
    const payload = {
      demonstration: true,
      source: "static-demo-fixtures",
      backendConnected: false,
      origin: state.origin,
      destination: state.destination,
      mode: state.mode,
      highlightedAlgorithm: state.algorithm,
      graph: demoGraph,
      routeExamples: snapshots,
      note: "Static UI examples only; no browser-side route algorithm or backend calculation was run.",
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `logiexpress_demo_${state.origin}_${state.destination}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setToastMessage("Archivo de demostración exportado; no contiene resultados del backend.");
  }

  return (
    <div className="app">
      <Sidebar activeSection={activeSection} onNavigate={handleNavigation} />
      <main className="main" id="inicio">
        <TopBar />
        <div className="content">
          <PageHeader onReset={resetDashboard} onExport={exportDemoJson} />
          <MetricCards />
          <section className="workspace" id="planificador" aria-label="Planificador interactivo">
            <ConfigurationPanel state={state} onChange={updateState} onSubmit={handleSubmit} />
            <GraphPanel
              origin={state.origin}
              destination={state.destination}
              algorithm={state.algorithm}
              snapshot={selectedSnapshot}
              showWeights={state.showWeights}
              onToggleWeights={(showWeights) => updateState({ showWeights })}
            />
          </section>
          {state.mode === "compare" && (
            <AlgorithmComparison
              selectedAlgorithm={state.algorithm}
              snapshots={snapshots}
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
