import { afterEach, describe, expect, it, vi } from "vitest";

import { compareRoutes, computeRoute, getGraph, HttpApiError } from "./api";

const graph = {
  nodes: ["M", "N"],
  edges: [{ source: "M", target: "N", weight: 2.5 }],
  directed: false as const,
};

const route = {
  algorithm: "dijkstra" as const,
  origin: "M",
  destination: "N",
  visited_order: ["M", "N"],
  path: ["M", "N"],
  hops: 1,
  total_weight: 2.5,
  found: true,
};

afterEach(() => vi.unstubAllGlobals());

describe("API client", () => {
  it("loads the graph from the same-origin API path", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(graph));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getGraph()).resolves.toEqual(graph);
    expect(fetchMock).toHaveBeenCalledWith("/api/graph", expect.objectContaining({ method: "GET" }));
  });

  it("posts typed single-route and comparison requests to the public endpoints", async () => {
    const results = { bfs: route, dfs: route, dijkstra: route };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(route))
      .mockResolvedValueOnce(Response.json(results));
    vi.stubGlobal("fetch", fetchMock);

    await expect(computeRoute({ origin: "M", destination: "N", algorithm: "dijkstra" })).resolves.toEqual(route);
    await expect(compareRoutes({ origin: "M", destination: "N" })).resolves.toEqual(results);

    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/routes/compute");
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({ origin: "M", destination: "N", algorithm: "dijkstra" }),
    });
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/routes/compare");
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({ origin: "M", destination: "N" }),
    });
  });

  it("preserves the structured HTTP error envelope", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json(
          { error: { code: "unknown_node", message: "El nodo solicitado no existe.", fields: [{ path: "origin", message: "Identificador desconocido." }] } },
          { status: 404 },
        ),
      ),
    );

    const request = getGraph();
    await expect(request).rejects.toBeInstanceOf(HttpApiError);
    await expect(request).rejects.toMatchObject({
      status: 404,
      code: "unknown_node",
      message: "El nodo solicitado no existe.",
    });
  });

  it("allows native fetch connection failures to propagate", async () => {
    const failure = new TypeError("Failed to fetch");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(failure));

    await expect(getGraph()).rejects.toBe(failure);
  });
});
