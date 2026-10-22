import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import App from "./App";

const graph = {
  nodes: ["A", "E", "F"],
  edges: [
    { source: "A", target: "E", weight: 2 },
    { source: "E", target: "F", weight: 3 },
  ],
  directed: false as const,
};

const route = {
  algorithm: "dijkstra" as const,
  origin: "A",
  destination: "F",
  visited_order: ["A", "E", "F"],
  path: ["A", "E", "F"],
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

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

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
    await waitFor(() => expect(document.querySelector(".result-title")?.textContent).toContain("Camino encontrado"));

    const bfsCard = screen.getByRole("button", { name: /Ver resultado BFS/ });
    fireEvent.click(bfsCard);
    expect(bfsCard.getAttribute("aria-pressed")).toBe("true");
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/routes/compare");
    expect(document.querySelectorAll(".road-highlight")).toHaveLength(2);
  });

  it("swaps endpoints, toggles dynamic edge weights, and resets controls", async () => {
    await renderReady();
    const origin = screen.getByLabelText("Origen") as HTMLSelectElement;
    const destination = screen.getByLabelText("Destino") as HTMLSelectElement;
    expect(document.querySelectorAll(".edge-weight")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Intercambiar origen y destino" }));
    expect(origin.value).toBe("F");
    expect(destination.value).toBe("A");

    fireEvent.click(screen.getByLabelText("Mostrar pesos"));
    expect(document.querySelectorAll(".edge-weight")).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Restablecer" }));
    expect(origin.value).toBe("A");
    expect(destination.value).toBe("F");
    expect(document.querySelectorAll(".edge-weight")).toHaveLength(2);
  });

  it("uses the exploration layer without presenting it as a continuous route", async () => {
    await renderReady();
    fireEvent.click(screen.getByRole("button", { name: "Ejecutar análisis" }));
    await waitFor(() => expect(document.querySelector(".result-title")?.textContent).toContain("Camino encontrado"));

    const roads = document.querySelectorAll(".road-surface").length;
    expect(document.querySelectorAll(".visit-order-badge")).toHaveLength(0);

    fireEvent.click(screen.getByRole("radio", { name: "Exploración" }));
    expect(document.querySelectorAll(".visit-order-badge")).toHaveLength(route.visited_order.length);
    expect(document.querySelectorAll(".road-highlight")).toHaveLength(0);
    fireEvent.click(screen.getByLabelText("Mostrar pesos"));
    expect(document.querySelectorAll(".edge-weight")).toHaveLength(0);
    expect(document.querySelectorAll(".road-surface")).toHaveLength(roads);
    expect(screen.getByText(/no es un camino continuo/i)).toBeTruthy();
  });

  it("distinguishes an unrun comparison from an inaccessible destination", async () => {
    await renderReady();

    expect(screen.getByText("Ejecuta una comparación para consultar los tres caminos.")).toBeTruthy();
    expect(screen.queryByText("No se encontró ruta")).toBeNull();
  });

  it("dismisses reset feedback automatically without making it interactive", async () => {
    await renderReady();
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "Restablecer" }));

    const notification = screen.getByText("Controles restablecidos.");
    expect(notification.getAttribute("role")).toBe("status");
    expect(notification.getAttribute("aria-live")).toBe("polite");
    expect(notification.className).toContain("toast");
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.queryByText("Controles restablecidos.")).toBeNull();
  });

  it("supports comparison-section navigation", async () => {
    await renderReady();
    const navigation = screen.getByRole("link", { name: /Comparar rutas/ });
    fireEvent.click(navigation);
    expect(navigation.getAttribute("aria-current")).toBe("location");
  });

  it("keeps descriptive navigation names and location names in controls and results", async () => {
    await renderReady();

    expect(screen.getByRole("link", { name: "Planificador" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Comparar rutas" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Guía de algoritmos" })).toBeTruthy();
    expect(screen.getAllByRole("option", { name: "A · Centro Occidente" })).toHaveLength(2);
    expect(screen.getAllByRole("option", { name: "F · Consolidación Sur" })).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Ejecutar análisis" }));
    await waitFor(() => expect(document.querySelector(".result-title")?.textContent).toContain("Camino encontrado"));
    expect(document.querySelector(".route")?.textContent).toContain("A · Centro Occidente");
    expect(document.querySelector(".route")?.textContent).toContain("F · Consolidación Sur");
  });
});
