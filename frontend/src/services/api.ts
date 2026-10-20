import type {
  ApiErrorResponse,
  CompareRoutesResponse,
  GraphResponse,
  RouteComputeRequest,
  RouteEndpointsRequest,
  RouteResult,
} from "../types/api";

export class HttpApiError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly fields: ApiErrorResponse["error"]["fields"];

  constructor(status: number, message: string, code: string | null, fields: ApiErrorResponse["error"]["fields"]) {
    super(message);
    this.name = "HttpApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

interface RequestOptions {
  signal?: AbortSignal;
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorResponse | null;
    throw new HttpApiError(
      response.status,
      body?.error?.message ?? `Request failed with HTTP ${response.status}.`,
      body?.error?.code ?? null,
      body?.error?.fields ?? [],
    );
  }

  return (await response.json()) as T;
}

export function getGraph(options: RequestOptions = {}): Promise<GraphResponse> {
  return requestJson<GraphResponse>("/api/graph", { method: "GET", signal: options.signal });
}

export function computeRoute(
  request: RouteComputeRequest,
  options: RequestOptions = {},
): Promise<RouteResult> {
  return requestJson<RouteResult>("/api/routes/compute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal: options.signal,
  });
}

export function compareRoutes(
  request: RouteEndpointsRequest,
  options: RequestOptions = {},
): Promise<CompareRoutesResponse> {
  return requestJson<CompareRoutesResponse>("/api/routes/compare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal: options.signal,
  });
}
