import type { CSSProperties } from "react";

import { algorithmDetails } from "../data/algorithmDetails";
import { locationLabel } from "../data/locationNames";
import { canonicalEdgeKey, getNodePosition, getRoadGeometry, simulatedMapGeometry, validateMapGeometry } from "../data/simulatedMapGeometry";
import type { GraphResponse, RouteResult } from "../types/api";
import { Icon } from "./Icon";

interface GraphPanelProps {
  graph: GraphResponse | null;
  result: RouteResult | null;
  origin: string;
  destination: string;
  algorithm: RouteResult["algorithm"];
  showWeights: boolean;
  onToggleWeights: (showWeights: boolean) => void;
  showExploration: boolean;
  onToggleExploration: (showExploration: boolean) => void;
  isLoading: boolean;
  errorMessage: string | null;
}

export function GraphPanel({
  graph,
  result,
  origin,
  destination,
  algorithm,
  showWeights,
  onToggleWeights,
  showExploration,
  onToggleExploration,
  isLoading,
  errorMessage,
}: GraphPanelProps) {
  const routeColor = algorithmDetails[algorithm].color;
  const path = result?.path ?? null;
  const pathNodes = new Set(path ?? []);
  const pathEdges = new Set<string>();
  if (path) {
    for (let index = 0; index < path.length - 1; index += 1) {
      pathEdges.add(canonicalEdgeKey(path[index], path[index + 1]));
    }
  }
  const visitedOrder = result?.visited_order ?? [];
  const visitIndex = new Map(showExploration ? visitedOrder.map((node, index) => [node, index + 1]) : []);
  const geometryIssues = graph ? validateMapGeometry(graph) : [];

  return (
    <section className="panel graph-panel" aria-label="Visualización de grafo y resultado">
      <div className="graph-heading">
        <div>
          <h2 className="panel-title">Red de distribución</h2>
          <p className="panel-subtitle" id="graphContext">
            {graph ? `${graph.nodes.length} ubicaciones · ${graph.edges.length} conexiones` : "Grafo de la API"}
          </p>
        </div>
        <div className="graph-tools">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={showWeights}
              onChange={(event) => onToggleWeights(event.target.checked)}
            />
            Mostrar pesos
          </label>
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={showExploration}
              onChange={(event) => onToggleExploration(event.target.checked)}
            />
            Mostrar exploración
          </label>
          <span className="live-pill">FastAPI</span>
        </div>
      </div>

      {graph && (
        <p className="map-scroll-hint">Desplaza horizontalmente para explorar el mapa; también puedes usar las flechas del teclado.</p>
      )}
      <div className="graph-canvas">
        <div className="canvas-top">
          <div className="canvas-tag"><Icon name="graph" size={13} />Grafo no dirigido</div>
          <div className="zoom-note">Trazados viales simulados · geometría SVG</div>
        </div>
        {graph ? (
          <div
            className="graph-stage"
            role="region"
            aria-label="Mapa desplazable de la red logística"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault();
                event.currentTarget.scrollBy({ left: event.key === "ArrowRight" ? 80 : -80 });
              }
            }}
          >
            <GraphSvg
              graph={graph}
              origin={origin}
              destination={destination}
              pathNodes={pathNodes}
              pathEdges={pathEdges}
              visitIndex={visitIndex}
              routeColor={routeColor}
              routeTextColor={algorithmDetails[algorithm].textColor}
              showWeights={showWeights}
              showExploration={showExploration}
            />
          </div>
        ) : (
          <div className="graph-empty" role={errorMessage ? "alert" : "status"}>
            {errorMessage ?? (isLoading ? "Cargando grafo desde FastAPI…" : "El grafo no está disponible.")}
          </div>
        )}
      </div>

      {geometryIssues.length > 0 && (
        <div className="api-error geometry-error" role="alert">
          No se puede representar toda la topología recibida: {geometryIssues.join(" ")}
        </div>
      )}

      {graph && (
        <div className="graph-bottom">
          <div className="legend">
            <span className="legend-item"><span className="legend-line" style={{ background: routeColor }} />Camino</span>
            <span className={`legend-item exploration-legend${showExploration ? " is-visible" : ""}`}><span className="visit-legend" />Orden de exploración</span>
            <span className="legend-item"><span className="legend-line" />Conexión</span>
            <span className="legend-item"><span className="endpoint-marker origin-marker" aria-hidden="true">O</span>Origen · {locationLabel(origin)}</span>
            <span className="legend-item"><span className="endpoint-marker destination-marker" aria-hidden="true">D</span>Destino · {locationLabel(destination)}</span>
          </div>
          {isLoading && <div className="request-status" role="status">Consultando FastAPI…</div>}
          {errorMessage && <div className="api-error" role="alert">{errorMessage}</div>}
          {result && (
            <div className="result-strip" aria-live="polite" aria-atomic="true">
              <div className="route-result-copy">
                <div className={`result-kicker result-title ${result.found ? "is-found" : "is-unreachable"}`}>
                  <Icon name={result.found ? "check" : "info"} />
                  <span className="result-algorithm">{algorithmDetails[result.algorithm].name}</span>
                  <span className="result-state">{result.found ? "Camino encontrado" : "Destino inaccesible"}</span>
                </div>
                <div className="route">
                  {result.path ? result.path.map((node, index) => (
                    <span className="route-segment" key={`${index}-${node}`}>
                      {index > 0 && <span className="route-arrow" aria-hidden="true">→</span>}
                      <span className="route-node" data-node-id={node} style={{ background: algorithmDetails[result.algorithm].pale, color: algorithmDetails[result.algorithm].textColor }}>{locationLabel(node)}</span>
                    </span>
                  )) : <span className="route-unavailable">No hay camino entre {locationLabel(result.origin)} y {locationLabel(result.destination)}.</span>}
                </div>
                <details className="visit-sequence">
                  <summary>Orden de exploración · {result.visited_order.length} ubicaciones</summary>
                  <p>{result.visited_order.length ? result.visited_order.map(locationLabel).join(" → ") : "Sin ubicaciones exploradas"}</p>
                </details>
              </div>
              <div className="result-metrics" aria-label="Indicadores del camino">
                <div className="result-number"><div className="number">{result.total_weight ?? "—"}</div><small>Costo total</small></div>
                <div className="result-number"><div className="number">{result.hops ?? "—"}</div><small>Saltos</small></div>
              </div>
            </div>
          )}
          {!result && !isLoading && !errorMessage && (
            <div className="result-prompt" role="status">Análisis pendiente. Selecciona origen y destino y ejecuta un análisis.</div>
          )}
          <div className="explanation">
            <Icon name="info" size={15} />
            <span>El orden de visita describe la exploración de Python; `path` es el camino reconstruido. No son la misma secuencia.</span>
          </div>
        </div>
      )}
    </section>
  );
}

interface GraphSvgProps {
  graph: GraphResponse;
  origin: string;
  destination: string;
  pathNodes: Set<string>;
  pathEdges: Set<string>;
  visitIndex: Map<string, number>;
  routeColor: string;
  routeTextColor: string;
  showWeights: boolean;
  showExploration: boolean;
}

function GraphSvg({ graph, origin, destination, pathNodes, pathEdges, visitIndex, routeColor, routeTextColor, showWeights, showExploration }: GraphSvgProps) {
  const { width, height } = simulatedMapGeometry.viewBox;
  const description = `${graph.nodes.length} nodos y ${graph.edges.length} aristas recibidos desde FastAPI.`;
  const renderedEdges = graph.edges.filter((edge, index) =>
    graph.edges.findIndex((candidate) => canonicalEdgeKey(candidate.source, candidate.target)
      === canonicalEdgeKey(edge.source, edge.target)) === index
      && getRoadGeometry(edge.source, edge.target) !== undefined);

  return (
    <svg
      id="network"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-labelledby="graphTitle graphDesc"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title id="graphTitle">Red logística ficticia recibida desde FastAPI</title>
      <desc id="graphDesc">{description} {showExploration ? "Los indicadores numerados muestran el orden de exploración." : "Los indicadores de exploración están ocultos."} Las carreteras resaltadas muestran el camino reconstruido.</desc>
      <defs>
        <pattern id="mapgrid" width="34" height="34" patternUnits="userSpaceOnUse">
          <path d="M34 0H0V34" fill="none" stroke="var(--map-grid)" strokeWidth=".9" opacity=".55" />
        </pattern>
      </defs>
      <rect width={width} height={height} fill="var(--map)" />
      <rect width={width} height={height} fill="url(#mapgrid)" />
      <g id="edgesLayer">
        {renderedEdges.map((edge) => {
          const road = getRoadGeometry(edge.source, edge.target);
          if (!road) return null;
          const key = canonicalEdgeKey(edge.source, edge.target);
          return (
            <g key={key} data-edge-key={key}>
              <path d={road.path} className="road-base" />
              <path d={road.path} className="road-asphalt" />
              <path d={road.path} className="road-surface" />
              <path d={road.path} className="road-mark" />
            </g>
          );
        })}
      </g>
      <g id="routeLayer">
        {renderedEdges.map((edge) => {
          const key = canonicalEdgeKey(edge.source, edge.target);
          if (!pathEdges.has(key)) return null;
          const road = getRoadGeometry(edge.source, edge.target);
          if (!road) return null;
          return <path key={key} d={road.path} data-edge-key={key} className="road-highlight" style={{ "--route-ink": routeColor } as CSSProperties} />;
        })}
      </g>
      {showWeights && (
        <g id="weightsLayer">
          {renderedEdges.map((edge) => {
            const road = getRoadGeometry(edge.source, edge.target);
            if (!road) return null;
            const { x, y } = road.label;
            const labelWidth = String(edge.weight).length * 10 + 20;
            const key = canonicalEdgeKey(edge.source, edge.target);
            return (
              <g
                className={`edge-weight${pathEdges.has(key) ? " active" : ""}`}
                data-edge-key={key}
                key={key}
                style={pathEdges.has(key) ? { "--route-ink": routeColor, "--route-label-ink": routeTextColor } as CSSProperties : undefined}
              >
                <rect x={x - labelWidth / 2} y={y - 13} width={labelWidth} height="25" rx="9" />
                <text x={x} y={y + 4}>{edge.weight}</text>
              </g>
            );
          })}
        </g>
      )}
      <g id="nodesLayer">
        {graph.nodes.filter((id, index) => graph.nodes.indexOf(id) === index).map((id) => {
          const position = getNodePosition(id);
          if (!position) return null;
          const isOnPath = pathNodes.has(id);
          const isOrigin = id === origin;
          const isDestination = id === destination;
          const order = visitIndex.get(id);
          return (
            <g
              className={`svg-node${order ? " is-visited" : ""}${isOnPath ? " is-path" : ""}${isOrigin ? " is-origin" : ""}${isDestination ? " is-destination" : ""}`}
              data-node-id={id}
              key={id}
              style={isOnPath ? { "--route-ink": routeColor, "--route-text": routeTextColor } as CSSProperties : undefined}
            >
              <title>{locationLabel(id)} · Nodo {id}</title>
              {isOnPath && <circle cx={position.x} cy={position.y} r="29" stroke={routeColor} className="halo" />}
              <circle
                cx={position.x}
                cy={position.y}
                r="22"
                className={`circle${isOnPath ? " is-route" : ""}${order ? " is-visited" : ""}${isOrigin ? " is-origin" : ""}${isDestination ? " is-destination" : ""}`}
              />
              {order && (
                <g className="visit-order-badge" aria-label={`Visit order ${order}`}>
                  <circle cx={position.x + 19} cy={position.y - 19} r="11" />
                  <text x={position.x + 19} y={position.y - 19}>{order}</text>
                </g>
              )}
              <text x={position.x} y={position.y + 1} className={`letter${isOnPath ? " is-route" : ""}`}>{id}</text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
