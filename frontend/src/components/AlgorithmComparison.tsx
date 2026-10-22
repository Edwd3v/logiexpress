import { algorithmDetails } from "../data/algorithmDetails";
import type { AlgorithmName, CompareRoutesResponse } from "../types/api";

interface AlgorithmComparisonProps {
  selectedAlgorithm: AlgorithmName;
  snapshots: CompareRoutesResponse | null;
  onSelect: (algorithm: AlgorithmName) => void;
}

const algorithms: AlgorithmName[] = ["bfs", "dfs", "dijkstra"];

export function AlgorithmComparison({
  selectedAlgorithm,
  snapshots,
  onSelect,
}: AlgorithmComparisonProps) {
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
          return (
            <button
              className={`compare-card compare-${algorithm}`}
              type="button"
              key={algorithm}
              aria-pressed={selected}
              aria-label={`Ver resultado ${details.name}${snapshot ? `. Costo total ${snapshot.total_weight ?? "no disponible"}. ${snapshot.hops ?? "no disponible"} saltos${fullPath ? `. Camino completo: ${fullPath}` : ". Destino inaccesible"}` : ". Comparación pendiente"}`}
              onClick={() => onSelect(algorithm)}
            >
              <span className="compare-top">
                <span className="compare-name"><span className="compare-dot" />{details.name}</span>
                <span
                  className="compare-badge"
                  style={selected ? { background: details.pale, color: details.color } : undefined}
                >
                  {selected ? "Destacado" : snapshot ? "Ver resultado" : "Sin resultado"}
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
            </button>
          );
        })}
      </div>
    </section>
  );
}
