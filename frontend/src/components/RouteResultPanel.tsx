import type { CSSProperties } from "react";

import { algorithmDetails } from "../data/algorithmDetails";
import { locationLabel } from "../data/locationNames";
import type { AlgorithmName, RouteResult } from "../types/api";
import { Icon } from "./Icon";

interface RouteResultPanelProps {
  algorithm: AlgorithmName;
  result: RouteResult | null;
  isLoading: boolean;
  errorMessage: string | null;
}

const pathTitles: Record<AlgorithmName, string> = {
  bfs: "Camino con menos saltos",
  dfs: "Camino encontrado",
  dijkstra: "Camino de menor costo",
};

export function RouteResultPanel({ algorithm, result, isLoading, errorMessage }: RouteResultPanelProps) {
  const activeAlgorithm = result?.algorithm ?? algorithm;
  const details = algorithmDetails[activeAlgorithm];
  const state = errorMessage ? "Error"
    : isLoading ? "Consultando FastAPI…"
      : !result ? "Análisis pendiente"
        : result.found && result.path ? "Camino encontrado" : "Destino inaccesible";
  const resultReady = Boolean(result && !errorMessage && !isLoading);

  return (
    <section
      className={`panel route-result-panel${result?.found ? " is-found" : ""}`}
      style={{ "--result-color": details.color, "--result-pale": details.pale } as CSSProperties}
      aria-labelledby="route-result-heading"
      aria-live="polite"
    >
      <header className="route-result-header">
        <div className="route-result-heading">
          <span className="route-result-icon" aria-hidden="true"><Icon name="graph" /></span>
          <div>
            <h2 id="route-result-heading">Resultado de {details.name}</h2>
            <p>{details.description}</p>
          </div>
        </div>
        <span className={`route-result-state result-title${state === "Error" || state === "Destino inaccesible" ? " is-error" : ""}`} role="status">{state}</span>
      </header>

      {errorMessage && <div className="route-result-error" role="alert">{errorMessage}</div>}

      {resultReady && result?.found && result.path ? (
        <>
          <div className="route-result-metrics" aria-label="Métricas del resultado">
            <div className="route-result-metric"><span>Costo total</span><strong>{result.total_weight ?? "—"}</strong><small>costo abstracto</small></div>
            <div className="route-result-metric"><span>Saltos</span><strong>{result.hops ?? "—"}</strong><small>conexiones recorridas</small></div>
          </div>

          <div className="route-path-card">
            <h3>{pathTitles[activeAlgorithm]}</h3>
            <ol className="result-steps" aria-label={`Camino de ${details.name}`} tabIndex={0}>
              {result.path.map((node, index) => {
                const isOrigin = index === 0;
                const isDestination = index === result.path!.length - 1;
                const position = isOrigin && isDestination ? "Origen y destino"
                  : isOrigin ? "Origen"
                    : isDestination ? "Destino" : "Ubicación intermedia";
                return (
                  <li className="result-step" key={`${index}-${node}`}>
                    <span className="result-step-number" aria-hidden="true">{index + 1}</span>
                    <span className="result-step-copy"><strong>{locationLabel(node)}</strong><small>{position}</small></span>
                    {index < result.path!.length - 1 && <span className="result-step-connector" aria-hidden="true" />}
                  </li>
                );
              })}
            </ol>
          </div>
        </>
      ) : resultReady && result ? (
        <div className="route-unreachable-state">
          <div className="route-result-metrics" aria-label="Métricas del resultado">
            <div className="route-result-metric"><span>Costo total</span><strong>—</strong><small>sin ruta disponible</small></div>
            <div className="route-result-metric"><span>Saltos</span><strong>—</strong><small>sin ruta disponible</small></div>
          </div>
          <p>No hay camino entre {locationLabel(result.origin)} y {locationLabel(result.destination)}.</p>
        </div>
      ) : (
        <div className="route-result-placeholder">
          {isLoading ? "Los resultados actuales se mostrarán al terminar la consulta." : errorMessage ? "No se muestran métricas de resultados anteriores." : "Selecciona origen y destino y ejecuta un análisis para consultar un recorrido."}
        </div>
      )}

      {resultReady && result && (
        <details className="result-exploration" key={`${result.algorithm}-${result.origin}-${result.destination}`}>
          <summary>Orden de exploración · {result.visited_order.length} ubicaciones visitadas</summary>
          <div className="exploration-content">
            <ol aria-label={`Orden de exploración de ${details.name}`} tabIndex={0}>
              {result.visited_order.map((node, index) => (
                <li key={`${index}-${node}`}><span>{index + 1}</span>{locationLabel(node)}</li>
              ))}
            </ol>
            <p>El orden de exploración registra cómo se visitaron las ubicaciones; no equivale necesariamente a una ruta transitable. El camino usa solo la secuencia real de <code>path</code>.</p>
          </div>
        </details>
      )}
    </section>
  );
}
