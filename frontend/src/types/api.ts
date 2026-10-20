/** Public FastAPI contracts. These types describe the API; the UI does not call it yet. */
export type AlgorithmName = "bfs" | "dfs" | "dijkstra";

export interface GraphEdgeResponse {
  source: string;
  target: string;
  weight: number;
}

export interface GraphResponse {
  nodes: string[];
  edges: GraphEdgeResponse[];
  directed: false;
}

export interface RouteComputeRequest {
  origin: string;
  destination: string;
  algorithm: AlgorithmName;
}

export interface RouteEndpointsRequest {
  origin: string;
  destination: string;
}

export interface RouteResult {
  algorithm: AlgorithmName;
  origin: string;
  destination: string;
  visited_order: string[];
  path: string[] | null;
  hops: number | null;
  total_weight: number | null;
  found: boolean;
}

export type CompareRoutesResponse = Record<AlgorithmName, RouteResult>;

/** Deliberately smaller than RouteResult: these are static UI examples, not API output. */
export interface DemoRouteSnapshot {
  path: string[];
  total_weight: number;
  hops: number;
}
