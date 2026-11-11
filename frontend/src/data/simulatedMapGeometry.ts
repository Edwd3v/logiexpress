import type { GraphResponse } from "../types/api";

export interface MapPoint {
  x: number;
  y: number;
}

export interface RoadGeometry {
  source: string;
  target: string;
  path: string;
  label: MapPoint;
}

const nodePositions: Record<string, MapPoint> = {
  A: { x: 195, y: 265 }, B: { x: 440, y: 164 }, C: { x: 805, y: 184 }, D: { x: 855, y: 476 },
  E: { x: 345, y: 422 }, F: { x: 590, y: 510 }, G: { x: 240, y: 110 }, H: { x: 600, y: 105 },
  I: { x: 935, y: 215 }, J: { x: 1005, y: 350 }, K: { x: 970, y: 565 }, L: { x: 740, y: 580 },
  M: { x: 460, y: 570 }, N: { x: 180, y: 520 }, O: { x: 80, y: 380 }, P: { x: 390, y: 300 },
  Q: { x: 620, y: 350 }, R: { x: 780, y: 335 },
};

function createOrthogonalRoad(source: string, target: string): RoadGeometry {
  const start = nodePositions[source];
  const end = nodePositions[target];
  if (!start || !end) throw new Error(`Missing map position for road ${source}–${target}.`);

  let points: MapPoint[];
  const edgeKey = canonicalEdgeKey(source, target);
  if (edgeKey === canonicalEdgeKey("Q", "H")) {
    points = [start, { x: 585, y: start.y }, { x: 585, y: end.y }, end];
  } else if (edgeKey === canonicalEdgeKey("H", "R")) {
    points = [start, { x: 615, y: start.y }, { x: 615, y: end.y }, end];
  } else if (Math.abs(end.x - start.x) > Math.abs(end.y - start.y)) {
    const middleX = (start.x + end.x) / 2;
    points = [start, { x: middleX, y: start.y }, { x: middleX, y: end.y }, end];
  } else {
    const middleY = (start.y + end.y) / 2;
    points = [start, { x: start.x, y: middleY }, { x: end.x, y: middleY }, end];
  }

  return { source, target, path: roundedPolyline(points, 7), label: polylineMidpoint(points) };
}

function roundedPolyline(points: MapPoint[], radius: number): string {
  let path = `M${points[0].x} ${points[0].y}`;
  for (let index = 1; index < points.length - 1; index += 1) {
    const before = points[index - 1];
    const corner = points[index];
    const after = points[index + 1];
    const incomingLength = Math.hypot(corner.x - before.x, corner.y - before.y);
    const outgoingLength = Math.hypot(after.x - corner.x, after.y - corner.y);
    const inset = Math.min(radius, incomingLength / 2, outgoingLength / 2);
    const entry = {
      x: corner.x - ((corner.x - before.x) / incomingLength) * inset,
      y: corner.y - ((corner.y - before.y) / incomingLength) * inset,
    };
    const exit = {
      x: corner.x + ((after.x - corner.x) / outgoingLength) * inset,
      y: corner.y + ((after.y - corner.y) / outgoingLength) * inset,
    };
    path += ` L${entry.x} ${entry.y} Q${corner.x} ${corner.y} ${exit.x} ${exit.y}`;
  }
  const end = points.at(-1);
  if (end) path += ` L${end.x} ${end.y}`;
  return path;
}

function polylineMidpoint(points: MapPoint[]): MapPoint {
  const segments = points.slice(1).map((point, index) => ({
    start: points[index], end: point, length: Math.hypot(point.x - points[index].x, point.y - points[index].y),
  }));
  let remaining = segments.reduce((total, segment) => total + segment.length, 0) / 2;
  for (const segment of segments) {
    if (remaining <= segment.length) {
      const ratio = remaining / segment.length;
      return {
        x: segment.start.x + (segment.end.x - segment.start.x) * ratio,
        y: segment.start.y + (segment.end.y - segment.start.y) * ratio,
      };
    }
    remaining -= segment.length;
  }
  return points[0];
}

export const simulatedMapGeometry = {
  viewBox: { width: 1080, height: 640 },
  crossings: [
    { first: "A-D", second: "B-P", x: 390, y: 265 },
    { first: "A-D", second: "F-Q", x: 590, y: 476 },
    { first: "A-D", second: "P-Q", x: 525, y: 350 },
    { first: "A-E", second: "N-P", x: 345, y: 410 },
    { first: "B-C", second: "H-Q", x: 585, y: 164 },
    { first: "B-C", second: "H-R", x: 615, y: 164 },
    { first: "C-D", second: "I-R", x: 855, y: 335 },
  ],
  nodes: nodePositions,
  roads: [
    ["A", "D"], ["A", "B"], ["B", "C"], ["C", "D"], ["A", "E"], ["E", "F"], ["F", "D"],
    ["A", "G"], ["G", "B"], ["B", "H"], ["H", "C"], ["C", "I"], ["I", "J"], ["J", "D"],
    ["D", "K"], ["K", "L"], ["L", "F"], ["F", "M"], ["M", "E"], ["E", "N"], ["N", "O"],
    ["O", "A"], ["B", "P"], ["P", "E"], ["P", "Q"], ["Q", "F"], ["Q", "R"], ["R", "C"],
    ["R", "D"], ["H", "R"], ["Q", "H"], ["N", "P"], ["R", "I"],
  ].map(([source, target]) => createOrthogonalRoad(source, target)) satisfies RoadGeometry[],
} as const;

export function canonicalEdgeKey(source: string, target: string): string {
  return JSON.stringify([source, target].sort());
}

const roadsByKey = new Map<string, RoadGeometry[]>();
for (const road of simulatedMapGeometry.roads) {
  const key = canonicalEdgeKey(road.source, road.target);
  roadsByKey.set(key, [...(roadsByKey.get(key) ?? []), road]);
}

export function validateMapGeometry(graph: GraphResponse): string[] {
  const issues: string[] = [];
  const nodeSet = new Set(graph.nodes);
  const seenNodes = new Set<string>();

  for (const [key, roads] of roadsByKey) {
    if (roads.length > 1) issues.push(`La configuración contiene geometrías duplicadas para ${key}.`);
  }
  for (const road of simulatedMapGeometry.roads) {
    if (!hasNodePosition(road.source) || !hasNodePosition(road.target)) {
      issues.push(`La geometría vial ${road.source}–${road.target} referencia un nodo sin posición.`);
    } else if (!roadPathMatchesDeclaredEndpoints(road)) {
      issues.push(`La trayectoria SVG de ${road.source}–${road.target} no coincide con las posiciones de sus extremos.`);
    }
  }

  for (const node of graph.nodes) {
    if (seenNodes.has(node)) issues.push(`El nodo ${node} está duplicado en el grafo de FastAPI.`);
    seenNodes.add(node);
    if (!hasNodePosition(node)) issues.push(`No hay posición SVG configurada para el nodo ${node}.`);
  }

  const seenEdges = new Set<string>();
  for (const edge of graph.edges) {
    const key = canonicalEdgeKey(edge.source, edge.target);
    if (seenEdges.has(key)) {
      issues.push(`La conexión ${edge.source}–${edge.target} está duplicada o es ambigua en el grafo de FastAPI.`);
      continue;
    }
    seenEdges.add(key);

    if (!nodeSet.has(edge.source) || !nodeSet.has(edge.target)) {
      issues.push(`La conexión ${edge.source}–${edge.target} referencia un nodo ausente del grafo de FastAPI.`);
      continue;
    }
    const roads = roadsByKey.get(key) ?? [];
    if (roads.length !== 1) {
      issues.push(`La conexión ${edge.source}–${edge.target} ${roads.length ? "tiene geometría ambigua" : "no tiene geometría SVG"}.`);
      continue;
    }
  }

  return issues;
}

export function getRoadGeometry(source: string, target: string): RoadGeometry | undefined {
  const matches = roadsByKey.get(canonicalEdgeKey(source, target));
  return matches?.length === 1 ? matches[0] : undefined;
}

export function getNodePosition(node: string): MapPoint | undefined {
  return hasNodePosition(node) ? simulatedMapGeometry.nodes[node] : undefined;
}

function roadPathMatchesDeclaredEndpoints(road: RoadGeometry): boolean {
  const source = getNodePosition(road.source);
  const target = getNodePosition(road.target);
  const numbers = road.path.match(/[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g)?.map(Number);
  const moveTo = /^\s*M\s*[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?\s+[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?(?:\s|$)/i;
  if (!source || !target || !numbers || numbers.length < 4 || !moveTo.test(road.path)) return false;

  const startMatches = close(numbers[0], source.x) && close(numbers[1], source.y);
  const endMatches = close(numbers[numbers.length - 2], target.x) && close(numbers[numbers.length - 1], target.y);
  return startMatches && endMatches;
}

function close(left: number, right: number): boolean {
  return Math.abs(left - right) < 0.001;
}

function hasNodePosition(node: string): node is keyof typeof simulatedMapGeometry.nodes {
  return Object.hasOwn(simulatedMapGeometry.nodes, node);
}
