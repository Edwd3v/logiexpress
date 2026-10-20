import { useEffect, useState, type CSSProperties } from "react";

import {
  algorithmDetails,
  demoEdgeLayout,
  demoGraph,
  demoNodeLayout,
} from "../data/demoGraph";
import type { AlgorithmName, DemoRouteSnapshot } from "../types/api";
import { Icon } from "./Icon";

interface GraphPanelProps {
  origin: string;
  destination: string;
  algorithm: AlgorithmName;
  snapshot: DemoRouteSnapshot | null;
  showWeights: boolean;
  onToggleWeights: (showWeights: boolean) => void;
}

export function GraphPanel({
  origin,
  destination,
  algorithm,
  snapshot,
  showWeights,
  onToggleWeights,
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
  const activeEdges = new Set<string>();
  if (snapshot) {
    for (let index = 0; index < snapshot.path.length - 1; index += 1) {
      activeEdges.add(edgeKey(snapshot.path[index], snapshot.path[index + 1]));
    }
  }

  return (
    <section className="panel graph-panel" aria-label="Visualización de grafo y resultado">
      <div className="graph-heading">
        <div>
          <h2 className="panel-title">Red de distribución</h2>
          <p className="panel-subtitle" id="graphContext">
            {snapshot
              ? `Vista de la red · recorrido ${origin} → ${destination}`
              : `Sin ejemplo fijo para ${origin} → ${destination}`}
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
          <span className="live-pill">Simulación local</span>
        </div>
      </div>

      <div className="graph-canvas">
        <div className="canvas-top">
          <div className="canvas-tag"><Icon name="graph" size={13} />Grafo no dirigido</div>
          <div className="zoom-note">Topología conceptual · no es un mapa geográfico</div>
        </div>
        <GraphSvg
          activeEdges={activeEdges}
          origin={origin}
          destination={destination}
          isMobile={isMobile}
          routeColor={routeColor}
          showWeights={showWeights}
        />
      </div>

      <div className="graph-bottom">
        <div className="legend">
          <span className="legend-item"><span className="legend-line" style={{ background: routeColor }} />Ruta destacada</span>
          <span className="legend-item"><span className="legend-line" />Conexión disponible</span>
          <span className="legend-item"><span className="legend-dot" />Ubicación</span>
        </div>
        <div className="result-strip" aria-live="polite" aria-atomic="true">
          <div>
            <div className="result-kicker result-title">
              <Icon name="check" />
              <span>Ruta destacada · {algorithmDetails[algorithm].name}</span>
            </div>
            <div className="route">
              {snapshot ? (
                snapshot.path.map((node, index) => (
                  <span className="route-segment" key={`${node}-${index}`}>
                    {index > 0 && <span className="route-arrow" aria-hidden="true">→</span>}
                    <span className="route-node" style={{ background: algorithmDetails[algorithm].pale, color: routeColor }}>{node}</span>
                  </span>
                ))
              ) : (
                <span className="route-unavailable">No hay una demostración fija para {origin} → {destination}.</span>
              )}
            </div>
          </div>
          <div className="result-number"><div className="number">{snapshot?.total_weight ?? "—"}</div><small>Costo demostrativo</small></div>
          <div className="result-number"><div className="number">{snapshot?.hops ?? "—"}</div><small>Saltos de ejemplo</small></div>
        </div>
        <div className="explanation">
          <Icon name="info" size={15} />
          <span>
            {snapshot
              ? `${algorithmDetails[algorithm].description} Cifras estáticas de demostración; no proceden del motor Python.`
              : "No hay un resultado de demostración para este par. La interfaz no ejecuta BFS, DFS ni Dijkstra."}
          </span>
        </div>
      </div>
    </section>
  );
}

interface GraphSvgProps {
  activeEdges: Set<string>;
  origin: string;
  destination: string;
  isMobile: boolean;
  routeColor: string;
  showWeights: boolean;
}

function GraphSvg({
  activeEdges,
  origin,
  destination,
  isMobile,
  routeColor,
  showWeights,
}: GraphSvgProps) {
  const point = (node: string) => demoNodeLayout[node][isMobile ? "mobile" : "desktop"];
  const routePath = activeEdges.size ? ` Ruta destacada con ${activeEdges.size} segmentos.` : "";
  const viewBox = isMobile ? "0 0 480 790" : "0 0 1000 530";
  const routeStyle = { "--route-ink": routeColor } as CSSProperties;

  return (
    <svg
      id="network"
      viewBox={viewBox}
      role="img"
      aria-labelledby="graphTitle graphDesc"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title id="graphTitle">Grafo ficticio de LogiExpress</title>
      <desc id="graphDesc">
        Red demostrativa de seis nodos y siete conexiones con costos no negativos.
        La vista es estática y no es un resultado del backend.{routePath}
      </desc>
      <defs>
        <pattern id="dotgrid" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="#dce5f0" opacity=".75" />
        </pattern>
      </defs>
      <rect width={isMobile ? 480 : 1000} height={isMobile ? 790 : 530} fill="url(#dotgrid)" />
      <g id="edgesLayer">
        {demoEdgeLayout.map((edge) => {
          const from = point(edge.source);
          const to = point(edge.target);
          return <line key={edgeKey(edge.source, edge.target)} x1={from.x} y1={from.y} x2={to.x} y2={to.y} className="svg-edge" />;
        })}
      </g>
      <g id="routeLayer">
        {demoEdgeLayout.map((edge) => {
          if (!activeEdges.has(edgeKey(edge.source, edge.target))) return null;
          const from = point(edge.source);
          const to = point(edge.target);
          return (
            <line
              key={edgeKey(edge.source, edge.target)}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              className="svg-active-edge"
              stroke={routeColor}
            />
          );
        })}
      </g>
      <g id="weightsLayer">
        {showWeights && demoEdgeLayout.map((edge) => {
          const key = edgeKey(edge.source, edge.target);
          const label = edge[isMobile ? "mobileLabel" : "desktopLabel"];
          const highlighted = activeEdges.has(key);
          const width = String(edge.weight).length * 10 + 20;
          return (
            <g className={`edge-weight${highlighted ? " active" : ""}`} key={key}>
              <rect x={label.x - width / 2} y={label.y - 12} width={width} height="24" rx="8" />
              <text x={label.x} y={label.y + 1}>{edge.weight}</text>
            </g>
          );
        })}
      </g>
      <g id="nodesLayer">
        {demoGraph.nodes.map((id) => {
          const position = point(id);
          const onRoute = [...activeEdges].some((key) => key.split("-").includes(id));
          const isEndpoint = id === origin || id === destination;
          return (
            <g className="svg-node" key={id}>
              {onRoute && <circle cx={position.x} cy={position.y} r="36" stroke={routeColor} className="halo" />}
              <circle
                cx={position.x}
                cy={position.y}
                r="30"
                className={`circle${onRoute ? " is-route" : ""}`}
                style={onRoute ? routeStyle : undefined}
                strokeWidth={onRoute ? 4 : 3}
              />
              {isEndpoint && <circle cx={position.x + 22} cy={position.y - 22} r="7" fill={id === origin ? "#2b64df" : "#14314f"} stroke="#fff" strokeWidth="2" />}
              <text x={position.x} y={position.y + 1} className={`letter${onRoute ? " is-route" : ""}`} style={onRoute ? routeStyle : undefined}>{id}</text>
              <text x={position.x} y={position.y + 55} className="name">{demoNodeLayout[id].name}</text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

function edgeKey(source: string, target: string): string {
  return [source, target].sort().join("-");
}
