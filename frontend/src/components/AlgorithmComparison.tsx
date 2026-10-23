import { useEffect, useState } from "react";

import { algorithmDetails } from "../data/algorithmDetails";
import type { AlgorithmName, CompareRoutesResponse } from "../types/api";

interface AlgorithmComparisonProps {
  selectedAlgorithm: AlgorithmName;
  snapshots: CompareRoutesResponse | null;
  onSelect: (algorithm: AlgorithmName) => void;
}

const algorithms: AlgorithmName[] = ["bfs", "dfs", "dijkstra"];

function minimums(snapshots: CompareRoutesResponse | null) {
  const reachable = algorithms.map((algorithm) => snapshots?.[algorithm]).filter(
    (result) => result?.found && Boolean(result.path?.length),
  );
  const hops = reachable.map((result) => result?.hops).filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const costs = reachable.map((result) => result?.total_weight).filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return {
    hops: hops.length ? Math.min(...hops) : null,
    cost: costs.length ? Math.min(...costs) : null,
  };
}

function compactPath(path: string[]): string {
  return (path.length > 5 ? [...path.slice(0, 3), "…", ...path.slice(-2)] : path).join(" → ");
}

function resultInterpretation(algorithm: AlgorithmName, snapshots: CompareRoutesResponse, selected: NonNullable<CompareRoutesResponse[AlgorithmName]>): string {
  const comparable = algorithms.filter((name) => name !== algorithm).map((name) => snapshots[name]).filter((result) => result?.found && result.path);
  const comparisons = comparable.map((other) => {
    const cost = other.total_weight !== null && selected.total_weight !== null
      ? other.total_weight < selected.total_weight ? `costo ${other.total_weight}, menor` : other.total_weight > selected.total_weight ? `costo ${other.total_weight}, mayor` : `costo ${other.total_weight}, empatado`
      : null;
    const hops = other.hops !== null && selected.hops !== null
      ? other.hops < selected.hops ? `${other.hops} saltos, menos` : other.hops > selected.hops ? `${other.hops} saltos, más` : `${other.hops} saltos, empatado`
      : null;
    return `${algorithmDetails[other.algorithm].name}: ${[cost, hops].filter(Boolean).join(" y ")}`;
  });
  const meaning = algorithm === "bfs"
    ? "BFS encontró un camino con la menor cantidad de saltos; eso no garantiza el menor costo."
    : algorithm === "dfs"
      ? "DFS llegó al destino siguiendo su orden de exploración en profundidad; este camino no garantiza mínimos."
      : "Dijkstra encontró el menor costo acumulado entre los resultados posibles con pesos no negativos; eso no implica menos saltos.";
  return `${meaning} El camino recibido tiene ${selected.hops ?? "—"} saltos y costo abstracto ${selected.total_weight ?? "—"}.${comparisons.length ? ` Comparación: ${comparisons.join("; ")}.` : " No hay otros caminos accesibles para comparar."}`;
}

export function AlgorithmComparison({
  selectedAlgorithm,
  snapshots,
  onSelect,
}: AlgorithmComparisonProps) {
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const minima = minimums(snapshots);
  const selectedResult = snapshots?.[selectedAlgorithm];
  const selectedDetails = algorithmDetails[selectedAlgorithm];
  useEffect(() => setAnalysisOpen(false), [selectedAlgorithm, selectedResult?.origin, selectedResult?.destination]);

  return (
    <section className="section" id="comparacion" aria-labelledby="compareHeading" role="region">
      <div className="section-heading">
        <div>
          <h2 id="compareHeading">Comparación de algoritmos</h2>
          <p id="compareDescription">
            {snapshots
              ? "Resultados recibidos de FastAPI. Selecciona un algoritmo para ver su recorrido y camino."
            : "Ejecuta una comparación para consultar los tres caminos."}
          </p>
        </div>
        <span className="outline-pill">{snapshots ? "Comparación de FastAPI" : "Esperando resultados"}</span>
      </div>
      <div className="comparison">
        {algorithms.map((algorithm) => {
          const details = algorithmDetails[algorithm];
          const snapshot = snapshots?.[algorithm];
          const selected = selectedAlgorithm === algorithm;
          const path = snapshot?.path ?? null;
          const fullPath = path?.join(" → ") ?? "";
          const compactPath = path && path.length > 6
            ? [...path.slice(0, 4), "…", ...path.slice(-2)].join(" → ")
            : fullPath;
          const resultSummary = !snapshot
            ? "Aún no ejecutado"
              : snapshot.found
                ? compactPath
                : "Destino inaccesible";
          const minHops = Boolean(snapshot?.found && snapshot.hops !== null && minima.hops === snapshot.hops);
          const minCost = Boolean(snapshot?.found && snapshot.total_weight !== null && minima.cost === snapshot.total_weight);
          return (
            <button
              className={`compare-card compare-${algorithm}`}
              type="button"
              key={algorithm}
              aria-pressed={selected}
              aria-label={`Ver resultado ${details.name}${snapshot ? `. Costo total ${snapshot.total_weight ?? "no disponible"}. ${snapshot.hops ?? "no disponible"} saltos${fullPath ? `. Camino completo: ${fullPath}` : ". Destino inaccesible"}${minHops ? ". Menor cantidad de saltos." : ""}${minCost ? ". Menor costo." : ""}` : ". Comparación pendiente"}`}
              onClick={() => onSelect(algorithm)}
            >
              <span className="compare-top">
                <span className="compare-name"><span className="compare-dot" />{details.name}</span>
                <span
                  className="compare-badge"
                  style={selected ? { background: details.pale, color: details.color } : undefined}
                >
                  {selected ? "Destacado" : snapshot ? "Ver detalle" : "Sin resultado"}
                </span>
              </span>
              <span className="compare-summary">{details.summary}</span>
              <span className="compare-data" aria-label="Indicadores del algoritmo">
                <span className="compare-metric">
                  <span className="compare-metric-value">{snapshot?.total_weight ?? "—"}</span>
                  <span className="compare-metric-label">Costo total</span>
                </span>
                <span className="compare-metric">
                  <span className="compare-metric-value">{snapshot?.hops ?? "—"}</span>
                  <span className="compare-metric-label">Saltos</span>
                </span>
              </span>
              <span className={`compare-path${snapshot?.found ? " is-found" : snapshot ? " is-unreachable" : " is-pending"}`}>
                <span className="compare-path-label">Camino</span>
                <span className="compare-path-value" title={fullPath || undefined} aria-label={fullPath ? `Camino completo: ${fullPath}` : undefined}>
                  {resultSummary}
                </span>
              </span>
              <span className="compare-minima" aria-label="Mínimos comparativos">
                {minHops && <span className="compare-minimum">Menos saltos</span>}
                {minCost && <span className="compare-minimum">Menor costo</span>}
              </span>
            </button>
          );
        })}
      </div>
      <section className={`dynamic-analysis compare-${selectedAlgorithm}`} aria-labelledby="dynamic-analysis-heading">
        <div className="dynamic-analysis-copy">
          <span className="analysis-kicker">Análisis dinámico</span>
          <h3 id="dynamic-analysis-heading">{selectedDetails.name}</h3>
          {selectedResult?.found && selectedResult.path ? (
            <>
              <p>{analysisExplanation(selectedAlgorithm)}</p>
              <p className="analysis-result-summary">Camino {compactPath(selectedResult.path)} · Costo {selectedResult.total_weight ?? "—"} · {selectedResult.hops ?? "—"} saltos</p>
            </>
          ) : (
            <p>{selectedResult ? "Este destino no es accesible para el algoritmo seleccionado." : "Ejecuta una comparación para consultar resultados actuales desde FastAPI."}</p>
          )}
          {analysisOpen && selectedResult?.found && selectedResult.path && (
            <p className="analysis-expanded" role="region" aria-label={`Explicación de ${selectedDetails.name}`}>
              {snapshots ? resultInterpretation(selectedAlgorithm, snapshots, selectedResult) : "El resultado se interpreta con los datos devueltos por FastAPI."}
            </p>
          )}
        </div>
        <button
          className="analysis-toggle"
          type="button"
          aria-expanded={analysisOpen}
          disabled={!selectedResult?.found}
          onClick={() => setAnalysisOpen((open) => !open)}
        >
          {analysisOpen ? "Ocultar análisis" : "Analizar resultado"}
        </button>
      </section>
      <p className="comparison-pedagogy">
        <strong>Lectura académica:</strong> el camino indica conexiones transitadas; el orden de exploración indica visitas del algoritmo y no necesariamente una ruta. Los pesos representan costos abstractos ficticios, no distancias ni tiempos.
      </p>
    </section>
  );
}

function analysisExplanation(algorithm: AlgorithmName): string {
  switch (algorithm) {
    case "bfs": return "Encuentra un camino con la menor cantidad de saltos.";
    case "dfs": return "Explora en profundidad y devuelve un camino posible.";
    case "dijkstra": return "Encuentra un camino de menor costo acumulado.";
  }
}
