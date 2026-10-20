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

const route = {
  algorithm: "dijkstra" as const,
  origin: "M",
  destination: "Z",
  visited_order: ["M", "N", "Z"],
  path: ["M", "N", "Z"],
  hops: 2,
  total_weight: 5,
  found: true,
};

function comparison() {
  return { bfs: route, dfs: { ...route, algorithm: "dfs" as const }, dijkstra: route };
}

async function renderReady() {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(Response.json(graph))
    .mockResolvedValue(Response.json(comparison()));
  vi.stubGlobal("fetch", fetchMock);
  render(<App />);
  await waitFor(() => expect(document.querySelectorAll(".svg-node")).toHaveLength(3));
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe("LogiExpress dashboard", () => {
  it("presents the workspace using the live API graph", async () => {
    const fetchMock = await renderReady();

    expect(screen.getByRole("heading", { name: "Planificación de rutas" })).toBeTruthy();
    expect(screen.getByText("API local · cálculo Python")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith("/api/graph", expect.any(Object));
    expect(screen.queryByText(/Datos ficticios y rutas ilustrativas/)).toBeNull();
  });

  it("selects a returned comparison result for SVG highlighting", async () => {
    const fetchMock = await renderReady();
    fireEvent.click(screen.getByRole("button", { name: "Ejecutar análisis" }));
    await screen.findByText("Camino encontrado · Dijkstra");

    const bfsCard = screen.getByRole("button", { name: /Destacar ruta BFS/ });
    fireEvent.click(bfsCard);
    expect(bfsCard.getAttribute("aria-pressed")).toBe("true");
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/routes/compare");
    expect(document.querySelectorAll(".svg-active-edge")).toHaveLength(2);
  });

  it("swaps endpoints, toggles dynamic edge weights, and resets controls", async () => {
    await renderReady();
    const origin = screen.getByLabelText("Origen") as HTMLSelectElement;
    const destination = screen.getByLabelText("Destino") as HTMLSelectElement;
    expect(document.querySelectorAll(".edge-weight")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Intercambiar origen y destino" }));
    expect(origin.value).toBe("Z");
    expect(destination.value).toBe("M");

    fireEvent.click(screen.getByLabelText("Mostrar pesos"));
    expect(document.querySelectorAll(".edge-weight")).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Restablecer" }));
    expect(origin.value).toBe("M");
    expect(destination.value).toBe("Z");
    expect(document.querySelectorAll(".edge-weight")).toHaveLength(2);
  });

  it("supports comparison-section navigation", async () => {
    await renderReady();
    const navigation = screen.getByRole("link", { name: /Comparar rutas/ });
    fireEvent.click(navigation);
    expect(navigation.getAttribute("aria-current")).toBe("location");
  });
});
