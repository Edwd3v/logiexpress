import { render, screen } from "@testing-library/react";
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
});
