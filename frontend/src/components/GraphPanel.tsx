import { useEffect, useState, type CSSProperties } from "react";

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
  const activeAlgorithm = result?.algorithm ?? algorithm;
  const routeColor = algorithmDetails[activeAlgorithm].color;
  const [selectedMode, setSelectedMode] = useState<"all" | "path" | "explore">(result ? "path" : "all");
  const [zoom, setZoom] = useState(1);
  const [selection, setSelection] = useState<{ kind: "node"; id: string } | { kind: "edge"; source: string; target: string } | null>(null);
  const activeMode = showExploration ? "explore" : selectedMode;
  useEffect(() => {
    setSelectedMode(result ? "path" : "all");
  }, [result?.origin, result?.destination, result?.algorithm, result?.found]);
  const path = result?.path ?? null;
  const pathNodes = new Set(path ?? []);
  const pathEdges = new Set<string>();
  if (path) {
    for (let index = 0; index < path.length - 1; index += 1) {
      pathEdges.add(canonicalEdgeKey(path[index], path[index + 1]));
    }
  }
  const visitedOrder = result?.visited_order ?? [];
  const visitIndex = new Map(activeMode === "explore" ? visitedOrder.map((node, index) => [node, index + 1]) : []);
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
          <div className="map-mode-switch" role="radiogroup" aria-label="Capa del mapa">
            {([ ["all", "Grafo completo"], ["path", "Camino encontrado"], ["explore", "Exploración"] ] as const).map(([mode, label]) => (
              <button
                aria-checked={activeMode === mode}
                className="map-mode-button"
                key={mode}
                tabIndex={activeMode === mode ? 0 : -1}
                onClick={() => {
                  setSelectedMode(mode);
                  onToggleExploration(mode === "explore");
                }}
                onKeyDown={(event) => {
                  if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) return;
                  event.preventDefault();
                  const radios = [...event.currentTarget.parentElement!.querySelectorAll<HTMLButtonElement>("[role=radio]")];
                  const index = radios.indexOf(event.currentTarget);
                  radios[(index + (event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : radios.length - 1)) % radios.length]?.click();
                }}
                role="radio"
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          <span className="live-pill">FastAPI</span>
        </div>
      </div>

      {graph && (
        <p className="map-scroll-hint">Desplaza horizontalmente para explorar el mapa; también puedes usar las flechas del teclado.</p>
      )}
      <div className="graph-canvas">
        <div className="canvas-top">
          <div className="canvas-tag"><Icon name="graph" size={13} />Grafo no dirigido</div>
        <div className="map-zoom-tools" aria-label="Controles de zoom">
          <button type="button" aria-label="Acercar mapa" onClick={() => setZoom((value) => Math.min(1.75, value + 0.25))}>+</button>
          <button type="button" aria-label="Alejar mapa" onClick={() => setZoom((value) => Math.max(0.75, value - 0.25))}>−</button>
          <button type="button" aria-label="Restablecer zoom" onClick={() => setZoom(1)}>↺</button>
          <span className="zoom-note">Trazados viales · 4A.2</span>
        </div>
        </div>
        {graph ? (
          <div
            className="graph-stage"
            role="region"
            aria-label="Mapa desplazable de la red logística"
            tabIndex={0}
            onKeyDown={(event) => {
              if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
                event.preventDefault();
                event.currentTarget.scrollBy({
                  left: event.key === "ArrowRight" ? 80 : event.key === "ArrowLeft" ? -80 : 0,
                  top: event.key === "ArrowDown" ? 80 : event.key === "ArrowUp" ? -80 : 0,
                });
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
              routeTextColor={algorithmDetails[activeAlgorithm].textColor}
              showWeights={showWeights}
              showExploration={activeMode === "explore"}
              mode={activeMode}
              zoom={zoom}
              hasPath={Boolean(result?.found && result.path)}
              onSelect={setSelection}
            />
          </div>
        ) : (
          <div className="graph-empty" role={errorMessage ? "alert" : "status"}>
            {errorMessage ?? (isLoading ? "Cargando grafo desde FastAPI…" : "El grafo no está disponible.")}
          </div>
        )}
      </div>

      {graph && selection && (
        <aside className="map-inspector" aria-live="polite" aria-label="Información contextual">
          <button className="map-inspector-close" type="button" aria-label="Cerrar información contextual" onClick={() => setSelection(null)}>×</button>
          {selection.kind === "node" ? (
            <>
              <strong>{locationLabel(selection.id)} · Nodo {selection.id}</strong>
              <span>Conexiones disponibles</span>
              <ul>{graph.edges.filter((edge) => edge.source === selection.id || edge.target === selection.id).map((edge) => {
                const neighbor = edge.source === selection.id ? edge.target : edge.source;
                return <li key={canonicalEdgeKey(edge.source, edge.target)}>{locationLabel(neighbor)} · {edge.weight}</li>;
              })}</ul>
            </>
          ) : (
            <strong>{locationLabel(selection.source)} ↔ {locationLabel(selection.target)} · Peso {graph.edges.find((edge) => canonicalEdgeKey(edge.source, edge.target) === canonicalEdgeKey(selection.source, selection.target))?.weight}</strong>
          )}
        </aside>
      )}

      {geometryIssues.length > 0 && (
        <div className="api-error geometry-error" role="alert">
          No se puede representar toda la topología recibida: {geometryIssues.join(" ")}
        </div>
      )}

      {graph && (
        <div className="graph-bottom">
          <div className="legend">
            <span className="legend-item"><span className="legend-line" style={{ background: routeColor }} />Camino · {algorithmDetails[activeAlgorithm].name}</span>
            <span className={`legend-item exploration-legend${activeMode === "explore" ? " is-visible" : ""}`}><span className="visit-legend" />Orden de exploración</span>
            <span className="legend-item"><span className="legend-line" />Conexión</span>
            <span className="legend-item"><span className="crossing-legend" aria-hidden="true">⌒</span>Cruce sin conexión</span>
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
            <span>El orden de visita describe la exploración de Python y no es un camino continuo; `path` contiene solo las conexiones consecutivas reconstruidas.</span>
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
  mode: "all" | "path" | "explore";
  zoom: number;
  hasPath: boolean;
  onSelect: (selection: { kind: "node"; id: string } | { kind: "edge"; source: string; target: string }) => void;
}

function GraphSvg({ graph, origin, destination, pathNodes, pathEdges, visitIndex, routeColor, routeTextColor, showWeights, showExploration, mode, zoom, hasPath, onSelect }: GraphSvgProps) {
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
      role="group"
      aria-labelledby="graphTitle graphDesc"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: `${zoom * 100}%` }}
    >
      <title id="graphTitle">Red logística ficticia recibida desde FastAPI</title>
      <desc id="graphDesc">{description} {showExploration ? "Los indicadores numerados muestran el orden de exploración, no un camino continuo." : "Los indicadores de exploración están ocultos."} Las carreteras resaltadas corresponden únicamente a pares consecutivos de path.</desc>
      <defs>
        <pattern id="mapgrid" width="34" height="34" patternUnits="userSpaceOnUse">
          <path d="M34 0H0V34" fill="none" stroke="var(--map-grid)" strokeWidth=".9" opacity=".55" />
        </pattern>
      </defs>
      <rect width={width} height={height} fill="var(--map)" />
      <rect width={width} height={height} fill="url(#mapgrid)" />
      <g id="mapContent">
      <g id="edgesLayer">
        {renderedEdges.map((edge) => {
          const road = getRoadGeometry(edge.source, edge.target);
          if (!road) return null;
          const key = canonicalEdgeKey(edge.source, edge.target);
          return (
            <g
              key={key}
              className={mode === "path" && hasPath && !pathEdges.has(key) ? "road-group is-dim" : "road-group"}
              data-edge-key={key}
              role="button"
              tabIndex={0}
              aria-label={`Conexión ${locationLabel(edge.source)} a ${locationLabel(edge.target)}, peso ${edge.weight}`}
              onClick={() => onSelect({ kind: "edge", source: edge.source, target: edge.target })}
              onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect({ kind: "edge", source: edge.source, target: edge.target }); } }}
            >
              <title>{locationLabel(edge.source)} ↔ {locationLabel(edge.target)} · Peso {edge.weight}</title>
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
          if (mode === "explore" || !pathEdges.has(key)) return null;
          const road = getRoadGeometry(edge.source, edge.target);
          if (!road) return null;
          return <path key={key} d={road.path} data-edge-key={key} className="road-highlight" style={{ "--route-ink": routeColor } as CSSProperties} />;
        })}
      </g>
      <g id="crossingLayer" aria-label="Cruces visuales sin conexión">
        {simulatedMapGeometry.crossings.map((crossing) => (
          <g
            className="bridge-crossing"
            key={`${crossing.first}:${crossing.second}`}
            role="img"
            aria-label={`Cruce sin conexión lógica entre ${crossing.first} y ${crossing.second}`}
          >
            <title>Cruce visual; no representa una conexión entre carreteras.</title>
            <circle cx={crossing.x} cy={crossing.y} r="11" />
            <path d={`M${crossing.x - 7} ${crossing.y + 3} H${crossing.x + 7}`} />
            <path d={`M${crossing.x - 7} ${crossing.y - 3} Q${crossing.x} ${crossing.y - 9} ${crossing.x + 7} ${crossing.y - 3}`} />
          </g>
        ))}
      </g>
      {(showWeights || (mode === "path" && hasPath)) && (
        <g id="weightsLayer">
          {renderedEdges.map((edge) => {
            const road = getRoadGeometry(edge.source, edge.target);
            if (!road) return null;
            const key = canonicalEdgeKey(edge.source, edge.target);
            const isPathEdge = pathEdges.has(key);
            if (mode === "path" && hasPath && !isPathEdge) return null;
            if (mode === "explore" && !showWeights) return null;
            const { x, y } = road.label;
            const labelWidth = String(edge.weight).length * 10 + 20;
            return (
              <g
                className={`edge-weight${isPathEdge ? " active" : ""}${mode === "explore" ? " is-muted" : ""}`}
                data-edge-key={key}
                key={key}
                style={pathEdges.has(key) ? { "--route-ink": routeColor, "--route-label-ink": routeTextColor } as CSSProperties : undefined}
              >
                <rect x={x - labelWidth / 2} y={y - 13} width={labelWidth} height="25" rx="9" />
                <text x={x} y={y}>{edge.weight}</text>
              </g>
            );
          })}
        </g>
      )}
      <g id="nodesLayer">
        {graph.nodes.filter((id, index) => graph.nodes.indexOf(id) === index).map((id) => {
          const position = getNodePosition(id);
          if (!position) return null;
          const isOnPath = mode !== "explore" && pathNodes.has(id);
          const isOrigin = id === origin;
          const isDestination = id === destination;
          const order = visitIndex.get(id);
          return (
            <g
              className={`svg-node${order ? " is-visited" : ""}${isOnPath ? " is-path" : ""}${isOrigin ? " is-origin" : ""}${isDestination ? " is-destination" : ""}`}
              data-node-id={id}
              key={id}
              role="button"
              tabIndex={0}
              aria-label={`${locationLabel(id)} · nodo ${id}${order ? `, orden de exploración ${order}` : ""}`}
              onClick={() => onSelect({ kind: "node", id })}
              onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect({ kind: "node", id }); } }}
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
      </g>
    </svg>
  );
}
