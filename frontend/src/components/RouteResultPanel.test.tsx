import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RouteResultPanel } from "./RouteResultPanel";
import type { RouteResult } from "../types/api";

const dfsPath = ["A", "B", "C", "D", "F", "E", "N", "P", "Q", "H", "R"];

const result: RouteResult = {
  algorithm: "dfs",
  origin: "A",
  destination: "R",
  visited_order: ["A", "G", "B", "C", "D", "F", "E", "N", "P", "Q", "H", "R"],
  path: dfsPath,
  hops: 10,
  total_weight: 33,
  found: true,
};

describe("RouteResultPanel", () => {
  it("shows the pending state without claiming a path or showing stale metrics", () => {
    render(<RouteResultPanel algorithm="bfs" result={null} isLoading={false} errorMessage={null} />);

    expect(screen.getByRole("heading", { name: "Resultado de BFS" })).toBeTruthy();
    expect(screen.getByText("Análisis pendiente")).toBeTruthy();
    expect(screen.queryByText("Camino encontrado")).toBeNull();
    expect(screen.queryByText("Costo total")).toBeNull();
  });

  it("renders real result metrics and only the backend path as numbered vertical steps", () => {
    render(<RouteResultPanel algorithm="bfs" result={result} isLoading={false} errorMessage={null} />);

    expect(screen.getByRole("heading", { name: "Resultado de DFS" })).toBeTruthy();
    expect(document.querySelector(".route-result-state")?.textContent).toBe("Camino encontrado");
    expect(screen.getByText("Costo total").parentElement?.textContent).toContain("33");
    expect(screen.getByText("Saltos").parentElement?.textContent).toContain("10");
    const steps = screen.getByRole("list", { name: "Camino de DFS" });
    expect(within(steps).getAllByRole("listitem")).toHaveLength(dfsPath.length);
    expect(within(steps).getByText("1").parentElement?.textContent).toContain("Origen");
    expect(within(steps).getByText("11").parentElement?.textContent).toContain("Destino");
    expect(steps.textContent).not.toContain("G · Estación Noroeste");
  });

  it("shows complete exploration only when expanded and explains it is not necessarily a route", () => {
    const { rerender } = render(<RouteResultPanel algorithm="dfs" result={result} isLoading={false} errorMessage={null} />);

    const details = screen.getByText("Orden de exploración · 12 ubicaciones visitadas").closest("details");
    expect(details?.hasAttribute("open")).toBe(false);
    fireEvent.click(screen.getByText("Orden de exploración · 12 ubicaciones visitadas"));
    expect(details?.hasAttribute("open")).toBe(true);
    expect(within(details as HTMLElement).getByText(/no equivale necesariamente a una ruta transitable/i)).toBeTruthy();
    expect(within(details as HTMLElement).getAllByRole("listitem")).toHaveLength(result.visited_order.length);

    rerender(<RouteResultPanel algorithm="bfs" result={{ ...result, algorithm: "bfs" }} isLoading={false} errorMessage={null} />);
    expect(document.querySelector(".result-exploration")?.hasAttribute("open")).toBe(false);
  });

  it("distinguishes loading, API error, and an inaccessible destination without stale values", () => {
    const { rerender } = render(<RouteResultPanel algorithm="dijkstra" result={null} isLoading={true} errorMessage={null} />);
    expect(screen.getByText("Consultando FastAPI…")).toBeTruthy();

    rerender(<RouteResultPanel algorithm="dijkstra" result={null} isLoading={false} errorMessage="HTTP 500: fallo" />);
    expect(screen.getByText("Error")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain("HTTP 500: fallo");

    rerender(<RouteResultPanel algorithm="dijkstra" result={{ ...result, algorithm: "dijkstra", found: false, path: null, hops: null, total_weight: null }} isLoading={false} errorMessage={null} />);
    expect(screen.getByText("Destino inaccesible")).toBeTruthy();
    expect(screen.getByText("No hay camino entre A · Centro Occidente y R · Centro Oriente.")).toBeTruthy();
    expect(screen.getAllByText("—")).toHaveLength(2);
    expect(screen.queryByRole("list", { name: /Camino de/ })).toBeNull();
  });

  it("renders a zero-hop origin-equals-destination route without inventing extra steps", () => {
    render(<RouteResultPanel algorithm="dijkstra" result={{ ...result, algorithm: "dijkstra", destination: "A", path: ["A"], hops: 0, total_weight: 0, visited_order: ["A"] }} isLoading={false} errorMessage={null} />);

    const steps = screen.getByRole("list", { name: "Camino de Dijkstra" });
    expect(within(steps).getAllByRole("listitem")).toHaveLength(1);
    expect(steps.textContent).toContain("Origen y destino");
    expect(screen.getByText("Saltos").parentElement?.textContent).toContain("0");
  });

  it.each([
    [["A", "D", "R"], 2],
    [["A", "E", "F", "D", "R"], 4],
    [dfsPath, 10],
  ] as const)("keeps every path node visible for %i hops", (path, hops) => {
    const route: RouteResult = { ...result, path: [...path], hops, destination: path[path.length - 1] };
    render(<RouteResultPanel algorithm={route.algorithm} result={route} isLoading={false} errorMessage={null} />);

    const list = screen.getByRole("list", { name: "Camino de DFS" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(path.length);
    expect(within(list).getByText(String(path.length)).parentElement?.textContent).toContain("Destino");
  });

  it.each([
    ["bfs", "Camino con menos saltos"],
    ["dijkstra", "Camino de menor costo"],
  ] as const)("uses the algorithm-specific path heading for %s", (algorithm, title) => {
    render(<RouteResultPanel algorithm={algorithm} result={{ ...result, algorithm }} isLoading={false} errorMessage={null} />);

    expect(screen.getByRole("heading", { name: title })).toBeTruthy();
  });
});
