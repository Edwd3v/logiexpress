import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import App from "./App";

const graph = {
  nodes: ["M", "N", "Z"],
  edges: [
    { source: "M", target: "N", weight: 2 },
    { source: "N", target: "Z", weight: 3 },
  ],
  directed: false as const,
};

function result(algorithm: "bfs" | "dfs" | "dijkstra", path: string[] | null) {
  return {
    algorithm,
    origin: "M",
    destination: "Z",
    visited_order: ["M", "N", "Z"],
    path,
    hops: path ? path.length - 1 : null,
    total_weight: path ? 5 : null,
    found: path !== null,
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("API-backed dashboard", () => {
  it("renders the graph returned by FastAPI rather than the fixed demo graph", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(graph));
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    await waitFor(() => expect(document.querySelectorAll(".svg-node")).toHaveLength(3));
    expect(document.querySelectorAll(".svg-edge")).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledWith("/api/graph", expect.any(Object));
    expect(screen.queryByText("Demo local · datos ficticios")).toBeNull();
  });

  it("uses the comparison endpoint and distinguishes traversal order from the path", async () => {
    const comparison = {
      bfs: result("bfs", ["M", "N", "Z"]),
      dfs: result("dfs", ["M", "N"]),
      dijkstra: result("dijkstra", ["M", "N", "Z"]),
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
    fireEvent.click(screen.getByRole("button", { name: /Destacar ruta BFS/ }));
    await screen.findByText("Camino encontrado · BFS");
    expect(screen.getAllByText(/Orden de visita/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Camino encontrado/)).toBeTruthy();
    expect(screen.getAllByText(/M → N → Z/).length).toBeGreaterThan(1);
    expect(document.querySelectorAll(".svg-active-edge")).toHaveLength(2);
  });

  it("requests one selected algorithm from the Python compute endpoint", async () => {
    const bfsResult = result("bfs", ["M", "N", "Z"]);
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

    await screen.findByText("Camino encontrado · BFS");
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/routes/compute");
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
      body: JSON.stringify({ origin: "M", destination: "Z", algorithm: "bfs" }),
    });
  });

  it("shows an unreachable route without drawing a path", async () => {
    const unreachable = result("dijkstra", null);
    unreachable.visited_order = ["M"];
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(graph))
      .mockResolvedValueOnce(Response.json(unreachable));
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);
    await waitFor(() => expect(document.querySelectorAll(".svg-node")).toHaveLength(3));
    fireEvent.click(screen.getByRole("radio", { name: /Ruta individual/ }));
    fireEvent.change(screen.getByLabelText("Destino"), { target: { value: "Z" } });
    fireEvent.click(screen.getByRole("button", { name: /Mostrar ejemplo|Ejecutar análisis/ }));

    await screen.findByText(/No existe una ruta|Ruta inexistente|No se encontró una ruta/i);
    expect(document.querySelectorAll(".svg-active-edge")).toHaveLength(0);
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
    const firstResponse = result("dijkstra", ["M", "N", "Z"]);
    const secondResponse = { ...firstResponse, path: ["M", "N"], hops: 1, total_weight: 2 };
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
    fireEvent.change(screen.getByLabelText("Destino"), { target: { value: "N" } });
    fireEvent.click(screen.getByRole("button", { name: /Mostrar ejemplo|Ejecutar análisis/ }));

    await waitFor(() => expect(document.querySelectorAll(".svg-active-edge")).toHaveLength(1));
    finishFirst(Response.json(firstComparison));
    await waitFor(() => expect(document.querySelectorAll(".svg-active-edge")).toHaveLength(1));
    expect(screen.getAllByText(/M → N/).length).toBeGreaterThan(0);
  });
});
