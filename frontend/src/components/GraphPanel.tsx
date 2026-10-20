import { useEffect, useState, type CSSProperties } from "react";

import { algorithmDetails } from "../data/algorithmDetails";
import type { GraphResponse, RouteResult } from "../types/api";
import { Icon } from "./Icon";

interface GraphPanelProps {
  graph: GraphResponse | null;
  result: RouteResult | null;
  algorithm: RouteResult["algorithm"];
  showWeights: boolean;
  onToggleWeights: (showWeights: boolean) => void;
  isLoading: boolean;
  errorMessage: string | null;
}

interface Point {
  x: number;
  y: number;
}

const prototypeLayout: Record<string, { desktop: Point; mobile: Point }> = {
  A: { desktop: { x: 130, y: 267 }, mobile: { x: 240, y: 112 } },
  B: { desktop: { x: 349, y: 115 }, mobile: { x: 85, y: 285 } },
  C: { desktop: { x: 657, y: 115 }, mobile: { x: 85, y: 490 } },
  D: { desktop: { x: 874, y: 267 }, mobile: { x: 240, y: 675 } },
  E: { desktop: { x: 349, y: 426 }, mobile: { x: 395, y: 285 } },
  F: { desktop: { x: 657, y: 426 }, mobile: { x: 395, y: 490 } },
};

export function GraphPanel({
  graph,
  result,
  algorithm,
  showWeights,
  onToggleWeights,
  isLoading,
  errorMessage,
}: GraphPanelProps) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window.matchMedia === "function"
      ? window.matchMedia("(max-width: 600px)").matches
      : window.innerWidth <= 600,
  );

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;
    const media = window.matchMedia("(max-width: 600px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const routeColor = algorithmDetails[algorithm].color;
  const path = result?.path ?? null;
  const pathNodes = new Set(path ?? []);
  const pathEdges = new Set<string>();
  if (path) {
    for (let index = 0; index < path.length - 1; index += 1) {
      pathEdges.add(edgeKey(path[index], path[index + 1]));
    }
  }
  const visitedOrder = result?.visited_order ?? [];
  const visitIndex = new Map(visitedOrder.map((node, index) => [node, index + 1]));

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
          <span className="live-pill">FastAPI</span>
        </div>
      </div>

      <div className="graph-canvas">
        <div className="canvas-top">
          <div className="canvas-tag"><Icon name="graph" size={13} />Grafo no dirigido</div>
          <div className="zoom-note">Posiciones visuales generadas por la interfaz</div>
        </div>
        {graph ? (
          <GraphSvg
            graph={graph}
            isMobile={isMobile}
            pathNodes={pathNodes}
            pathEdges={pathEdges}
            visitIndex={visitIndex}
            routeColor={routeColor}
            showWeights={showWeights}
          />
        ) : (
          <div className="graph-empty" role={errorMessage ? "alert" : "status"}>
            {errorMessage ?? (isLoading ? "Cargando grafo desde FastAPI…" : "El grafo no está disponible.")}
          </div>
        )}
      </div>

      {graph && (
        <div className="graph-bottom">
          <div className="legend">
            <span className="legend-item"><span className="legend-line" style={{ background: routeColor }} />Camino (`path`)</span>
            <span className="legend-item"><span className="visit-legend" />Orden de visita</span>
            <span className="legend-item"><span className="legend-line" />Conexión</span>
          </div>
          {isLoading && <div className="request-status" role="status">Consultando FastAPI…</div>}
          {errorMessage && <div className="api-error" role="alert">{errorMessage}</div>}
          {result && (
            <div className="result-strip" aria-live="polite" aria-atomic="true">
              <div className="route-result-copy">
                <div className="result-kicker result-title">
                  <Icon name={result.found ? "check" : "info"} />
                  <span>{result.found ? "Camino encontrado" : "No existe una ruta"} · {algorithmDetails[result.algorithm].name}</span>
                </div>
                <div className="route">
                  {result.path ? result.path.map((node, index) => (
                    <span className="route-segment" key={`${index}-${node}`}>
                      {index > 0 && <span className="route-arrow" aria-hidden="true">→</span>}
                      <span className="route-node" style={{ background: algorithmDetails[result.algorithm].pale, color: routeColor }}>{node}</span>
                    </span>
                  )) : <span className="route-unavailable">Sin camino entre {result.origin} y {result.destination}.</span>}
                </div>
                <div className="visit-sequence">
                  <strong>Orden de visita (`visited_order`):</strong>
                  <span>{result.visited_order.length ? result.visited_order.join(" → ") : "Sin nodos visitados"}</span>
                </div>
                <div className="path-sequence">
                  <strong>Camino (`path`):</strong>
                  <span>{result.path?.join(" → ") ?? "No disponible"}</span>
                </div>
              </div>
              <div className="result-number"><div className="number">{result.total_weight ?? "—"}</div><small>Costo total</small></div>
              <div className="result-number"><div className="number">{result.hops ?? "—"}</div><small>Saltos</small></div>
            </div>
          )}
          {!result && !isLoading && !errorMessage && (
            <div className="result-prompt" role="status">Selecciona origen y destino y ejecuta un análisis.</div>
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
  isMobile: boolean;
  pathNodes: Set<string>;
  pathEdges: Set<string>;
  visitIndex: Map<string, number>;
  routeColor: string;
  showWeights: boolean;
}

function GraphSvg({ graph, isMobile, pathNodes, pathEdges, visitIndex, routeColor, showWeights }: GraphSvgProps) {
  const layout = layoutNodes(graph.nodes, isMobile);
  const width = isMobile ? 480 : 1000;
  const height = isMobile ? Math.max(790, Math.ceil(graph.nodes.length / 2) * 150 + 100) : 530;
  const points = new Map(graph.nodes.map((node) => [node, layout.get(node) ?? { x: width / 2, y: height / 2 }]));
  const description = `${graph.nodes.length} nodos y ${graph.edges.length} aristas recibidos desde FastAPI.`;
  const routeStyle = { "--route-ink": routeColor } as CSSProperties;

  return (
    <svg
      id="network"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-labelledby="graphTitle graphDesc"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title id="graphTitle">Grafo recibido desde FastAPI</title>
      <desc id="graphDesc">{description} Los indicadores numerados muestran visited_order; las líneas coloreadas muestran path.</desc>
      <defs>
        <pattern id="dotgrid" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="#dce5f0" opacity=".75" />
        </pattern>
      </defs>
      <rect width={width} height={height} fill="url(#dotgrid)" />
      <g id="edgesLayer">
        {graph.edges.map((edge) => {
          const from = points.get(edge.source);
          const to = points.get(edge.target);
          if (!from || !to) return null;
          return <line key={edgeKey(edge.source, edge.target)} x1={from.x} y1={from.y} x2={to.x} y2={to.y} className="svg-edge" />;
        })}
      </g>
      <g id="routeLayer">
        {graph.edges.map((edge) => {
          const key = edgeKey(edge.source, edge.target);
          if (!pathEdges.has(key)) return null;
          const from = points.get(edge.source);
          const to = points.get(edge.target);
          if (!from || !to) return null;
          return <line key={key} x1={from.x} y1={from.y} x2={to.x} y2={to.y} className="svg-active-edge" stroke={routeColor} />;
        })}
      </g>
      {showWeights && (
        <g id="weightsLayer">
          {graph.edges.map((edge) => {
            const from = points.get(edge.source);
            const to = points.get(edge.target);
            if (!from || !to) return null;
            const x = (from.x + to.x) / 2;
            const y = (from.y + to.y) / 2 - 8;
            const width = String(edge.weight).length * 10 + 20;
            return (
              <g className={`edge-weight${pathEdges.has(edgeKey(edge.source, edge.target)) ? " active" : ""}`} key={edgeKey(edge.source, edge.target)}>
                <rect x={x - width / 2} y={y - 12} width={width} height="24" rx="8" />
                <text x={x} y={y + 1}>{edge.weight}</text>
              </g>
            );
          })}
        </g>
      )}
      <g id="nodesLayer">
        {graph.nodes.map((id) => {
          const position = points.get(id);
          if (!position) return null;
          const isOnPath = pathNodes.has(id);
          const order = visitIndex.get(id);
          return (
            <g className={`svg-node${order ? " is-visited" : ""}${isOnPath ? " is-path" : ""}`} data-node-id={id} key={id}>
              {isOnPath && <circle cx={position.x} cy={position.y} r="36" stroke={routeColor} className="halo" />}
              <circle
                cx={position.x}
                cy={position.y}
                r="30"
                className={`circle${isOnPath ? " is-route" : ""}${order ? " is-visited" : ""}`}
                style={isOnPath ? routeStyle : undefined}
                strokeWidth={isOnPath ? 4 : 3}
              />
              {order && (
                <g className="visit-order-badge" aria-label={`Visit order ${order}`}>
                  <circle cx={position.x + 23} cy={position.y - 23} r="12" />
                  <text x={position.x + 23} y={position.y - 23}>{order}</text>
                </g>
              )}
              <text x={position.x} y={position.y + 1} className={`letter${isOnPath ? " is-route" : ""}`} style={isOnPath ? routeStyle : undefined}>{id}</text>
              <text x={position.x} y={position.y + 55} className="name">{id}</text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

function layoutNodes(nodes: string[], isMobile: boolean): Map<string, Point> {
  const prototypeNodes = Object.keys(prototypeLayout);
  const matchesPrototype = nodes.length === prototypeNodes.length && prototypeNodes.every((node) => nodes.includes(node));
  if (matchesPrototype) {
    return new Map(nodes.map((node) => [node, prototypeLayout[node][isMobile ? "mobile" : "desktop"]]));
  }

  const columns = isMobile ? 2 : Math.max(1, Math.ceil(Math.sqrt(nodes.length * 1.6)));
  const rows = Math.ceil(nodes.length / columns);
  const xStart = isMobile ? 120 : 100;
  const xEnd = isMobile ? 360 : 900;
  const yStart = isMobile ? 80 : 90;
  const yEnd = isMobile ? Math.max(80, 80 + (rows - 1) * 150) : 440;
  const points = new Map<string, Point>();

  nodes.forEach((node, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const rowCount = Math.min(columns, nodes.length - row * columns);
    const x = rowCount === 1 ? (xStart + xEnd) / 2 : xStart + (column * (xEnd - xStart)) / (rowCount - 1);
    const y = rows === 1 ? (isMobile ? 380 : 265) : yStart + (row * (yEnd - yStart)) / (rows - 1);
    points.set(node, { x, y });
  });
  return points;
}

function edgeKey(source: string, target: string): string {
  return JSON.stringify([source, target].sort());
}
