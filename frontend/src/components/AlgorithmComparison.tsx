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
              : "Ejecuta una comparación para solicitar los tres resultados a FastAPI."}
          </p>
        </div>
        <span className="outline-pill">{snapshots ? "Comparación de FastAPI" : "Esperando resultados"}</span>
      </div>
      <div className="comparison">
        {algorithms.map((algorithm) => {
          const details = algorithmDetails[algorithm];
          const snapshot = snapshots?.[algorithm];
          const selected = selectedAlgorithm === algorithm;
          return (
            <button
              className="compare-card"
              type="button"
              key={algorithm}
              aria-pressed={selected}
              aria-label={`Destacar ruta ${details.name}${snapshot ? `. Costo ${snapshot.total_weight ?? "no disponible"}. ${snapshot.hops ?? "no disponible"} saltos` : ". Sin resultado"}`}
              onClick={() => onSelect(algorithm)}
            >
              <span className="compare-top">
                <span className="compare-name"><span className="compare-dot" style={{ background: details.color }} />{details.name}</span>
                <span
                  className="compare-badge"
                  style={selected ? { background: details.pale, color: details.color } : undefined}
                >
                  {selected ? "Destacado" : snapshot ? "Ver resultado" : "Sin resultado"}
                </span>
              </span>
              <span className="compare-summary">{details.summary}</span>
              <span className="compare-data">
                <span className="compare-cost">
                  {snapshot?.total_weight ?? "—"}<span> costo total</span>
                </span>
                <span className="compare-hops">{snapshot?.hops ?? "—"} saltos</span>
              </span>
              <span className="compare-path">
                <span>CAMINO (`path`)</span>
                {snapshot?.path ? snapshot.path.join(" → ") : "No se encontró ruta"}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
