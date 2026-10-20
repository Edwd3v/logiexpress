import { algorithmDetails } from "../data/demoGraph";
import type { AlgorithmName, DemoRouteSnapshot } from "../types/api";

interface AlgorithmComparisonProps {
  selectedAlgorithm: AlgorithmName;
  snapshots: Record<AlgorithmName, DemoRouteSnapshot> | null;
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
              ? "Snapshots estáticos del escenario A → D. Selecciona una tarjeta para destacar su ejemplo."
              : "No hay snapshots para este par; cambiar la selección no ejecuta algoritmos."}
          </p>
        </div>
        <span className="outline-pill">{snapshots ? "Ejemplos comparativos" : "Sin ejemplo para este par"}</span>
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
              aria-label={`Destacar ruta ${details.name}${snapshot ? `. Costo demostrativo ${snapshot.total_weight}. ${snapshot.hops} saltos` : ". Sin ejemplo disponible"}`}
              onClick={() => onSelect(algorithm)}
            >
              <span className="compare-top">
                <span className="compare-name"><span className="compare-dot" style={{ background: details.color }} />{details.name}</span>
                <span
                  className="compare-badge"
                  style={selected ? { background: details.pale, color: details.color } : undefined}
                >
                  {selected ? "Destacado" : snapshot && algorithm === "dijkstra" ? "Menor costo" : snapshot ? "Ver ejemplo" : "Sin ejemplo"}
                </span>
              </span>
              <span className="compare-summary">{details.summary}</span>
              <span className="compare-data">
                <span className="compare-cost">
                  {snapshot?.total_weight ?? "—"}<span> costo demo</span>
                </span>
                <span className="compare-hops">{snapshot?.hops ?? "—"} saltos</span>
              </span>
              <span className="compare-path">
                <span>RECORRIDO DEMOSTRATIVO</span>
                {snapshot ? snapshot.path.join(" → ") : "No disponible"}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
