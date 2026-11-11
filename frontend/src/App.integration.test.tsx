import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import App from "./App";
import { simulatedMapGeometry } from "./data/simulatedMapGeometry";

const graph = {
  nodes: ["A", "E", "F"],
  edges: [
    { source: "A", target: "E", weight: 2 },
    { source: "E", target: "F", weight: 3 },
  ],
  directed: false as const,
};

function result(algorithm: "bfs" | "dfs" | "dijkstra", path: string[] | null) {
  return {
    algorithm,
    origin: "A",
    destination: "F",
    visited_order: ["A", "E", "F"],
    path,
    hops: path ? path.length - 1 : null,
    total_weight: path ? 5 : null,
    found: path !== null,
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("API-backed dashboard", () => {
  it("loads all backend locations and lets the user select an added location", async () => {
    const expandedGraph = {
      nodes: Object.keys(simulatedMapGeometry.nodes),
      edges: simulatedMapGeometry.roads.map(({ source, target }, index) => ({
        source,
        target,
        weight: index + 1,
      })),
      directed: false as const,
    };
    const route = { ...result("dijkstra", ["A", "B", "H", "R"]), destination: "R", hops: 3 };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(expandedGraph))
      .mockResolvedValueOnce(Response.json(route));
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);
    await waitFor(() => expect(document.querySelectorAll(".svg-node")).toHaveLength(18));
    expect(document.querySelectorAll(".road-surface")).toHaveLength(33);
    expect(screen.getByLabelText("Destino").querySelector('option[value="R"]')).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: /Ruta individual/ }));
    fireEvent.change(screen.getByLabelText("Destino"), { target: { value: "R" } });
    fireEvent.click(screen.getByRole("button", { name: "Ejecutar análisis" }));

    await waitFor(() => expect(document.querySelector(".result-title")?.textContent).toContain("Camino encontrado"));
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
      body: JSON.stringify({ origin: "A", destination: "R", algorithm: "dijkstra" }),
    });
  });

  it("renders the graph returned by FastAPI rather than the fixed demo graph", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(graph));
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    await waitFor(() => expect(document.querySelectorAll(".svg-node")).toHaveLength(3));
    expect(document.querySelectorAll(".road-surface")).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledWith("/api/graph", expect.any(Object));
    expect(screen.queryByText("Demo local · datos ficticios")).toBeNull();
  });

  it("uses the comparison endpoint and distinguishes traversal order from the path", async () => {
    const comparison = {
      bfs: result("bfs", ["A", "E", "F"]),
      dfs: result("dfs", ["A", "E"]),
      dijkstra: result("dijkstra", ["A", "E", "F"]),
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(graph))
      .mockResolvedValueOnce(Response.json(comparison));
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);
    await waitFor(() => expect(document.querySelectorAll(".svg-node")).toHaveLength(3));
    fireEvent.click(screen.getByRole("button", { name: /Mostrar ejemplo|Ejecutar análisis/ }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/routes/compare");
    fireEvent.click(screen.getByRole("button", { name: /Ver resultado BFS/ }));
    await waitFor(() => expect(document.querySelector(".result-title")?.textContent).toContain("Camino encontrado"));
    expect(screen.getAllByText(/Orden de exploración/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Camino encontrado/).length).toBeGreaterThan(0);
    expect(document.querySelector(".result-steps")?.textContent).toContain("A · Centro Occidente");
    expect(document.querySelector(".result-steps")?.textContent).toContain("F · Consolidación Sur");
    expect(document.querySelectorAll(".road-highlight")).toHaveLength(2);
  });

  it("requests one selected algorithm from the Python compute endpoint", async () => {
    const bfsResult = result("bfs", ["A", "E", "F"]);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(graph))
      .mockResolvedValueOnce(Response.json(bfsResult));
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);
    await waitFor(() => expect(document.querySelectorAll(".svg-node")).toHaveLength(3));
    fireEvent.click(screen.getByRole("radio", { name: /Ruta individual/ }));
    fireEvent.click(screen.getByRole("radio", { name: /BFS/ }));
    fireEvent.click(screen.getByRole("button", { name: "Ejecutar análisis" }));

    await waitFor(() => expect(document.querySelector(".result-title")?.textContent).toContain("Camino encontrado"));
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/routes/compute");
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
      body: JSON.stringify({ origin: "A", destination: "F", algorithm: "bfs" }),
    });
  });

  it("shows an unreachable route without drawing a path", async () => {
    const unreachable = result("dijkstra", null);
    unreachable.visited_order = ["A"];
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(graph))
      .mockResolvedValueOnce(Response.json(unreachable));
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);
    await waitFor(() => expect(document.querySelectorAll(".svg-node")).toHaveLength(3));
    fireEvent.click(screen.getByRole("radio", { name: /Ruta individual/ }));
    fireEvent.change(screen.getByLabelText("Destino"), { target: { value: "F" } });
    fireEvent.click(screen.getByRole("button", { name: /Mostrar ejemplo|Ejecutar análisis/ }));

    await screen.findByText("Destino inaccesible");
    expect(document.querySelectorAll(".road-highlight")).toHaveLength(0);
  });

  it("shows loading and HTTP failures without falling back to demo data", async () => {
    let rejectGraph!: (response: Response) => void;
    const graphResponse = new Promise<Response>((resolve) => { rejectGraph = resolve; });
    const fetchMock = vi.fn().mockReturnValue(graphResponse);
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);
    expect(screen.getByRole("status")).toBeTruthy();
    rejectGraph(Response.json({ error: { code: "unavailable", message: "API unavailable", fields: [] } }, { status: 503 }));

    expect(await screen.findByText(/503|API unavailable/i)).toBeTruthy();
    expect(document.querySelectorAll(".svg-node")).toHaveLength(0);
  });

  it("renders route HTTP errors and connection failures as explicit errors", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(graph))
      .mockResolvedValueOnce(Response.json(
        { error: { code: "unknown_node", message: "El nodo solicitado no existe.", fields: [{ path: "destination", message: "Identificador desconocido." }] } },
        { status: 404 },
      ));
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);
    await waitFor(() => expect(document.querySelectorAll(".svg-node")).toHaveLength(3));
    fireEvent.click(screen.getByRole("button", { name: "Ejecutar análisis" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/HTTP 404.*nodo solicitado/);

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    fireEvent.click(screen.getByRole("button", { name: "Restablecer" }));
    fireEvent.click(screen.getByRole("button", { name: "Ejecutar análisis" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/No se pudo conectar con FastAPI/);
  });

  it("does not let a stale response replace the latest requested pair", async () => {
    const firstResponse = result("dijkstra", ["A", "E", "F"]);
    const secondResponse = { ...firstResponse, destination: "E", path: ["A", "E"], hops: 1, total_weight: 2 };
    const firstComparison = { bfs: firstResponse, dfs: firstResponse, dijkstra: firstResponse };
    const secondComparison = { bfs: secondResponse, dfs: secondResponse, dijkstra: secondResponse };
    let finishFirst!: (response: Response) => void;
    const delayed = new Promise<Response>((resolve) => { finishFirst = resolve; });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(graph))
      .mockReturnValueOnce(delayed)
      .mockResolvedValueOnce(Response.json(secondComparison));
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);
    await waitFor(() => expect(document.querySelectorAll(".svg-node")).toHaveLength(3));
    fireEvent.click(screen.getByRole("button", { name: /Mostrar ejemplo|Ejecutar análisis/ }));
    fireEvent.change(screen.getByLabelText("Destino"), { target: { value: "E" } });
    fireEvent.click(screen.getByRole("button", { name: /Mostrar ejemplo|Ejecutar análisis/ }));

    await waitFor(() => expect(document.querySelectorAll(".road-highlight")).toHaveLength(1));
    finishFirst(Response.json(firstComparison));
    await waitFor(() => expect(document.querySelectorAll(".road-highlight")).toHaveLength(1));
    expect(document.querySelector(".result-steps")?.textContent).toContain("A · Centro Occidente");
    expect(document.querySelector(".result-steps")?.textContent).toContain("Microhub Central");
  });
});
