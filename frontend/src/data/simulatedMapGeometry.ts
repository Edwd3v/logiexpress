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

export const simulatedMapGeometry = {
  viewBox: { width: 1080, height: 640 },
  nodes: {
    A: { x: 195, y: 265 },
    B: { x: 440, y: 164 },
    C: { x: 805, y: 184 },
    D: { x: 855, y: 476 },
    E: { x: 345, y: 422 },
    F: { x: 590, y: 510 },
    G: { x: 240, y: 110 },
    H: { x: 600, y: 105 },
    I: { x: 935, y: 215 },
    J: { x: 1005, y: 350 },
    K: { x: 970, y: 565 },
    L: { x: 740, y: 580 },
    M: { x: 460, y: 570 },
    N: { x: 180, y: 520 },
    O: { x: 80, y: 380 },
    P: { x: 390, y: 300 },
    Q: { x: 620, y: 350 },
    R: { x: 780, y: 335 },
  } satisfies Record<string, MapPoint>,
  roads: [
    { source: "A", target: "D", path: "M195 265 C153 240 122 230 122 175 L122 125 Q122 83 175 83 L742 83 Q959 83 959 230 L959 398 Q962 452 855 476", label: { x: 638, y: 65 } },
    { source: "A", target: "B", path: "M195 265 C242 265 250 207 309 206 L380 164 Q405 155 440 164", label: { x: 307, y: 186 } },
    { source: "B", target: "C", path: "M440 164 C510 174 535 145 603 160 L710 172 Q765 172 805 184", label: { x: 615, y: 142 } },
    { source: "C", target: "D", path: "M805 184 C836 226 823 262 858 308 L878 385 C894 430 865 452 855 476", label: { x: 893, y: 322 } },
    { source: "A", target: "E", path: "M195 265 C196 320 256 335 267 373 S305 422 345 422", label: { x: 224, y: 355 } },
    { source: "E", target: "F", path: "M345 422 C420 424 413 489 490 490 S550 512 590 510", label: { x: 460, y: 462 } },
    { source: "F", target: "D", path: "M590 510 C685 521 688 469 753 472 L855 476", label: { x: 726, y: 498 } },
    { source: "A", target: "G", path: "M195 265 C184 210 203 157 240 110", label: { x: 187, y: 184 } },
    { source: "G", target: "B", path: "M240 110 C307 114 360 142 440 164", label: { x: 339, y: 118 } },
    { source: "B", target: "H", path: "M440 164 C478 132 536 108 600 105", label: { x: 524, y: 117 } },
    { source: "H", target: "C", path: "M600 105 C671 102 742 131 805 184", label: { x: 702, y: 106 } },
    { source: "C", target: "I", path: "M805 184 C850 183 896 201 935 215", label: { x: 874, y: 177 } },
    { source: "I", target: "J", path: "M935 215 C978 252 1012 292 1005 350", label: { x: 986, y: 281 } },
    { source: "J", target: "D", path: "M1005 350 C980 417 939 443 855 476", label: { x: 966, y: 411 } },
    { source: "D", target: "K", path: "M855 476 C911 497 933 534 970 565", label: { x: 924, y: 522 } },
    { source: "K", target: "L", path: "M970 565 C908 593 817 594 740 580", label: { x: 850, y: 605 } },
    { source: "L", target: "F", path: "M740 580 C678 587 633 549 590 510", label: { x: 678, y: 557 } },
    { source: "F", target: "M", path: "M590 510 C558 542 506 562 460 570", label: { x: 529, y: 552 } },
    { source: "M", target: "E", path: "M460 570 C406 545 371 489 345 422", label: { x: 386, y: 504 } },
    { source: "E", target: "N", path: "M345 422 C292 461 245 500 180 520", label: { x: 274, y: 463 } },
    { source: "N", target: "O", path: "M180 520 C129 481 96 432 80 380", label: { x: 107, y: 466 } },
    { source: "O", target: "A", path: "M80 380 C120 322 160 271 195 265", label: { x: 122, y: 302 } },
    { source: "B", target: "P", path: "M440 164 C440 210 403 263 390 300", label: { x: 444, y: 249 } },
    { source: "P", target: "E", path: "M390 300 C378 355 365 389 345 422", label: { x: 373, y: 375 } },
    { source: "P", target: "Q", path: "M390 300 C476 299 535 327 620 350", label: { x: 507, y: 288 } },
    { source: "Q", target: "F", path: "M620 350 C646 399 624 469 590 510", label: { x: 646, y: 435 } },
    { source: "Q", target: "R", path: "M620 350 C677 325 720 330 780 335", label: { x: 705, y: 312 } },
    { source: "R", target: "C", path: "M780 335 C811 290 817 238 805 184", label: { x: 833, y: 261 } },
    { source: "R", target: "D", path: "M780 335 C831 383 854 427 855 476", label: { x: 808, y: 406 } },
    { source: "H", target: "R", path: "M600 105 C645 169 726 266 780 335", label: { x: 679, y: 204 } },
    { source: "Q", target: "H", path: "M620 350 C614 273 600 178 600 105", label: { x: 578, y: 240 } },
    { source: "N", target: "P", path: "M180 520 C241 455 321 354 390 300", label: { x: 286, y: 385 } },
    { source: "R", target: "I", path: "M780 335 C833 294 880 249 935 215", label: { x: 873, y: 288 } },
  ] satisfies RoadGeometry[],
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
