import type { AlgorithmName, DemoRouteSnapshot, GraphResponse } from "../types/api";

export interface DemoNodeLayout {
  name: string;
  desktop: { x: number; y: number };
  mobile: { x: number; y: number };
}

export interface DemoEdgeLayout {
  source: string;
  target: string;
  weight: number;
  desktopLabel: { x: number; y: number };
  mobileLabel: { x: number; y: number };
}

/** Fictional graph fixture matching the prototype; it is not fetched from FastAPI. */
export const demoGraph: GraphResponse = {
  nodes: ["A", "B", "C", "D", "E", "F"],
  edges: [
    { source: "A", target: "B", weight: 4 },
    { source: "B", target: "C", weight: 4 },
    { source: "C", target: "D", weight: 4 },
    { source: "A", target: "D", weight: 20 },
    { source: "A", target: "E", weight: 1 },
    { source: "E", target: "F", weight: 1 },
    { source: "F", target: "D", weight: 1 },
  ],
  directed: false,
};

export const demoNodeLayout: Record<string, DemoNodeLayout> = {
  A: { name: "Centro A", desktop: { x: 130, y: 267 }, mobile: { x: 240, y: 112 } },
  B: { name: "Nodo B", desktop: { x: 349, y: 115 }, mobile: { x: 85, y: 285 } },
  C: { name: "Nodo C", desktop: { x: 657, y: 115 }, mobile: { x: 85, y: 490 } },
  D: { name: "Centro D", desktop: { x: 874, y: 267 }, mobile: { x: 240, y: 675 } },
  E: { name: "Nodo E", desktop: { x: 349, y: 426 }, mobile: { x: 395, y: 285 } },
  F: { name: "Nodo F", desktop: { x: 657, y: 426 }, mobile: { x: 395, y: 490 } },
};

const edgeLabelPositions: Record<string, { x: number; y: number }> = {
  "A-B": { x: 222, y: 160 },
  "B-C": { x: 503, y: 89 },
  "C-D": { x: 780, y: 160 },
  "A-D": { x: 503, y: 238 },
  "A-E": { x: 222, y: 379 },
  "E-F": { x: 503, y: 462 },
  "D-F": { x: 780, y: 379 },
};

const mobileEdgeLabelPositions: Record<string, { x: number; y: number }> = {
  "A-B": { x: 144, y: 180 },
  "B-C": { x: 87, y: 388 },
  "C-D": { x: 141, y: 578 },
  "A-D": { x: 240, y: 395 },
  "A-E": { x: 340, y: 180 },
  "E-F": { x: 395, y: 388 },
  "D-F": { x: 339, y: 578 },
};

function edgeKey(source: string, target: string): string {
  return [source, target].sort().join("-");
}

export const demoEdgeLayout: DemoEdgeLayout[] = demoGraph.edges.map((edge) => ({
  ...edge,
  desktopLabel: edgeLabelPositions[edgeKey(edge.source, edge.target)],
  mobileLabel: mobileEdgeLabelPositions[edgeKey(edge.source, edge.target)],
}));

/** Static A→D snapshots copied from the visual reference; no browser-side algorithms run. */
export const demoRouteSnapshots: Record<AlgorithmName, DemoRouteSnapshot> = {
  bfs: { path: ["A", "D"], total_weight: 20, hops: 1 },
  dfs: { path: ["A", "B", "C", "D"], total_weight: 12, hops: 3 },
  dijkstra: { path: ["A", "E", "F", "D"], total_weight: 3, hops: 3 },
};

export const demoScenario = { origin: "A", destination: "D" } as const;

export const algorithmDetails: Record<
  AlgorithmName,
  { name: string; color: string; pale: string; summary: string; description: string }
> = {
  bfs: {
    name: "BFS",
    color: "#c77734",
    pale: "#fff2e7",
    summary: "Menor cantidad de saltos",
    description:
      "BFS encuentra una ruta con el mínimo número de aristas, sin considerar el costo de los pesos.",
  },
  dfs: {
    name: "DFS",
    color: "#7659bc",
    pale: "#f1edfb",
    summary: "Exploración en profundidad",
    description:
      "DFS sigue una rama antes de retroceder; su ruta depende del orden de vecinos y no garantiza el mínimo costo ni los mínimos saltos.",
  },
  dijkstra: {
    name: "Dijkstra",
    color: "#078b7e",
    pale: "#e4f5f2",
    summary: "Menor costo acumulado",
    description:
      "Dijkstra encuentra una ruta de menor suma de pesos, siempre que todas las aristas tengan pesos no negativos.",
  },
};
