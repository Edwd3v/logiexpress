import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AlgorithmComparison } from "./AlgorithmComparison";
import type { CompareRoutesResponse } from "../types/api";

const dfsPath = ["A", "B", "C", "D", "F", "E", "N", "P", "Q", "H", "R"];

const snapshots: CompareRoutesResponse = {
  bfs: {
    algorithm: "bfs", origin: "A", destination: "R", visited_order: ["A", "D", "R"],
    path: ["A", "D", "R"], hops: 2, total_weight: 23, found: true,
  },
  dfs: {
    algorithm: "dfs", origin: "A", destination: "R", visited_order: dfsPath,
    path: dfsPath, hops: 10, total_weight: 33, found: true,
  },
  dijkstra: {
    algorithm: "dijkstra", origin: "A", destination: "R", visited_order: ["A", "E", "F", "D", "R"],
    path: ["A", "E", "F", "D", "R"], hops: 4, total_weight: 6, found: true,
  },
};

describe("AlgorithmComparison", () => {
  it("summarizes long paths while keeping complete routes accessible", () => {
    render(<AlgorithmComparison selectedAlgorithm="dfs" snapshots={snapshots} onSelect={vi.fn()} />);

    const dfsCard = screen.getByRole("button", { name: /Ver resultado DFS/ });
    expect(dfsCard.getAttribute("aria-pressed")).toBe("true");
    expect(dfsCard.getAttribute("aria-label")).toContain(`Camino completo: ${dfsPath.join(" → ")}`);
    expect(dfsCard.querySelector(".compare-path-value")?.textContent).toBe("A → B → C → D → … → H → R");
    expect(dfsCard.querySelectorAll(".compare-metric-value").length).toBe(2);
    expect(dfsCard.textContent).toContain("33");
    expect(dfsCard.textContent).toContain("10");
    expect(dfsCard.textContent).not.toContain(dfsPath.join(" → "));
  });

  it("labels missing comparison data as pending, not unreachable", () => {
    render(<AlgorithmComparison selectedAlgorithm="dijkstra" snapshots={null} onSelect={vi.fn()} />);

    expect(screen.getAllByText("Aún no ejecutado")).toHaveLength(3);
    expect(screen.queryByText("Destino inaccesible")).toBeNull();
  });

  it("marks data-driven minimum hops and minimum cost on the matching cards", () => {
    render(<AlgorithmComparison selectedAlgorithm="dfs" snapshots={snapshots} onSelect={vi.fn()} />);

    expect(screen.getByRole("button", { name: /BFS/ }).textContent).toContain("Menos saltos");
    expect(screen.getByRole("button", { name: /Dijkstra/ }).textContent).toContain("Menor costo");
    expect(screen.getByRole("button", { name: /DFS/ }).textContent).not.toContain("Mínimo");
  });

  it("keeps all tied minima and explains the selected real result without nested controls", () => {
    const tied: CompareRoutesResponse = {
      bfs: { ...snapshots.bfs, hops: 4, total_weight: 6 },
      dfs: { ...snapshots.dfs, hops: 8, total_weight: 7 },
      dijkstra: { ...snapshots.dijkstra, hops: 4, total_weight: 6 },
    };
    const onSelect = vi.fn();
    render(<AlgorithmComparison selectedAlgorithm="dijkstra" snapshots={tied} onSelect={onSelect} />);

    for (const name of ["BFS", "Dijkstra"]) {
      const card = screen.getByRole("button", { name: new RegExp(name) });
      expect(card.textContent).toContain("Menos saltos");
      expect(card.textContent).toContain("Menor costo");
    }
    const selected = screen.getByRole("button", { name: /Dijkstra/ });
    fireEvent.click(selected);
    expect(onSelect).toHaveBeenCalledWith("dijkstra");
    expect(selected.getAttribute("aria-pressed")).toBe("true");
    expect(selected.querySelector("button, a, input, summary")).toBeNull();
    expect(document.querySelector(".analysis-result-summary")?.textContent).toContain("Costo 6 · 4 saltos");
    expect(screen.getByRole("button", { name: "Analizar resultado" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Analizar resultado" }));
    expect(screen.getByRole("region", { name: "Explicación de Dijkstra" }).textContent).toMatch(/BFS: costo 6, empatado y 4 saltos, empatado/i);
    expect(screen.getByRole("region", { name: "Explicación de Dijkstra" }).textContent).not.toContain("Dijkstra: Dijkstra");
    expect(selected.textContent?.match(/Ver detalle/g)).toBeNull();
    expect(screen.getByRole("button", { name: /BFS/ }).textContent?.match(/Ver detalle/g)).toHaveLength(1);
  });

  it("excludes inaccessible routes from minimum comparisons", () => {
    const disconnected: CompareRoutesResponse = {
      ...snapshots,
      bfs: { ...snapshots.bfs, found: false, path: null, hops: null, total_weight: null },
    };
    render(<AlgorithmComparison selectedAlgorithm="bfs" snapshots={disconnected} onSelect={vi.fn()} />);

    const bfsCard = screen.getByRole("button", { name: /BFS/ });
    expect(bfsCard.textContent).toContain("Destino inaccesible");
    expect(bfsCard.textContent).not.toContain("Menos saltos");
    expect(screen.getByRole("button", { name: /Dijkstra/ }).textContent).toContain("Menos saltos");
  });

  it("interprets an individual available result without inventing comparisons", () => {
    const unavailable = { ...snapshots.bfs, found: false, path: null, hops: null, total_weight: null };
    const individual: CompareRoutesResponse = { bfs: snapshots.bfs, dfs: { ...unavailable, algorithm: "dfs" }, dijkstra: { ...unavailable, algorithm: "dijkstra" } };
    render(<AlgorithmComparison selectedAlgorithm="bfs" snapshots={individual} onSelect={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Analizar resultado" }));
    const expanded = screen.getByRole("region", { name: "Explicación de BFS" });
    expect(expanded.textContent).toContain("2 saltos y costo abstracto 23");
    expect(expanded.textContent).toContain("No hay otros caminos accesibles para comparar");
    expect(expanded.textContent).not.toContain("Dijkstra:");
  });

  it("compares the live A-to-R BFS result against Dijkstra without hard-coded values", () => {
    render(<AlgorithmComparison selectedAlgorithm="bfs" snapshots={snapshots} onSelect={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Analizar resultado" }));
    const expanded = screen.getByRole("region", { name: "Explicación de BFS" });
    expect(expanded.textContent).toContain("BFS encontró un camino con la menor cantidad de saltos");
    expect(expanded.textContent).toContain("Dijkstra: costo 6, menor y 4 saltos, más");
    expect(expanded.textContent).toContain("2 saltos y costo abstracto 23");
  });
});
