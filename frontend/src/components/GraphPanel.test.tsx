import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GraphPanel } from "./GraphPanel";
import { simulatedMapGeometry, validateMapGeometry } from "../data/simulatedMapGeometry";
import type { GraphResponse, RouteResult } from "../types/api";

const graph: GraphResponse = {
  nodes: [..."ABCDEFGHIJKLMNOPQR"],
  edges: [
    ["A", "D", 20], ["A", "B", 4], ["B", "C", 4], ["C", "D", 4],
    ["A", "E", 1], ["E", "F", 1], ["F", "D", 1], ["A", "G", 3],
    ["G", "B", 4], ["B", "H", 3], ["H", "C", 3], ["C", "I", 2],
    ["I", "J", 3], ["J", "D", 4], ["D", "K", 3], ["K", "L", 2],
    ["L", "F", 2], ["F", "M", 2], ["M", "E", 3], ["E", "N", 3],
    ["N", "O", 2], ["O", "A", 3], ["B", "P", 3], ["P", "E", 2],
    ["P", "Q", 3], ["Q", "F", 3], ["Q", "R", 2], ["R", "C", 3],
    ["R", "D", 3], ["H", "R", 5], ["Q", "H", 4], ["N", "P", 4],
    ["R", "I", 3],
  ].map(([source, target, weight]) => ({
    source: String(source), target: String(target), weight: Number(weight),
  })),
  directed: false,
};

const result: RouteResult = {
  algorithm: "dijkstra",
  origin: "A",
  destination: "D",
  visited_order: ["A", "B", "E", "F", "D"],
  path: ["A", "E", "F", "D"],
  hops: 3,
  total_weight: 3,
  found: true,
};

function renderGraph(inputGraph = graph, inputResult: RouteResult | null = result) {
  return render(
    <GraphPanel
      graph={inputGraph}
      result={inputResult}
      origin={inputResult?.origin ?? "A"}
      destination={inputResult?.destination ?? "D"}
      algorithm="dijkstra"
      showWeights
      onToggleWeights={vi.fn()}
      isLoading={false}
      errorMessage={null}
    />,
  );
}

describe("GraphPanel simulated road geometry", () => {
  it("renders only backend edges as curved roads and uses backend weights", () => {
    renderGraph();

    const roads = [...document.querySelectorAll<SVGPathElement>(".road-surface")];
    expect(roads).toHaveLength(33);
    expect(roads.every((road) => road.getAttribute("d")?.includes("C"))).toBe(true);
    expect(document.querySelectorAll(".svg-node")).toHaveLength(18);
    expect([...document.querySelectorAll(".edge-weight text")].map((label) => label.textContent)).toEqual([
      "20", "4", "4", "4", "1", "1", "1", "3", "4", "3", "3", "2",
      "3", "4", "3", "2", "2", "2", "3", "3", "2", "3", "3", "2",
      "3", "3", "2", "3", "3", "5", "4", "4", "3",
    ]);
  });

  it("highlights the API path, regardless of edge direction, not visit order", () => {
    renderGraph();

    const highlighted = [...document.querySelectorAll<SVGPathElement>(".road-highlight")];
    expect(highlighted).toHaveLength(3);
    expect(highlighted.map((road) => road.dataset.edgeKey)).toEqual([
      '["A","E"]', '["E","F"]', '["D","F"]',
    ]);
    expect(document.querySelector('[data-node-id="A"]')?.classList.contains("is-origin")).toBe(true);
    expect(document.querySelector('[data-node-id="A"]')?.classList.contains("is-path")).toBe(true);
    expect(document.querySelector('[data-node-id="D"]')?.classList.contains("is-destination")).toBe(true);
    expect(document.querySelector('[data-node-id="D"]')?.classList.contains("is-path")).toBe(true);
    expect(screen.getByText("A → B → E → F → D")).toBeTruthy();
    expect(screen.getByText("A → E → F → D")).toBeTruthy();
  });

  it("reports missing node or road geometry instead of drawing a straight fallback", () => {
    const incomplete: GraphResponse = {
      nodes: [...graph.nodes, "Z"],
      edges: [
        ...graph.edges,
        { source: "A", target: "Z", weight: 4 },
        { source: "B", target: "F", weight: 6 },
      ],
      directed: false,
    };
    renderGraph(incomplete, null);

    expect(screen.getByRole("alert").textContent).toMatch(/Z|A–Z/);
    expect(screen.getByRole("alert").textContent).toContain("B–F");
    expect(document.querySelectorAll("line.svg-edge, line.svg-active-edge")).toHaveLength(0);
    expect(document.querySelectorAll(".road-surface")).toHaveLength(33);
    expect(document.querySelector('[data-node-id="A"]')?.classList.contains("is-origin")).toBe(true);
    expect(document.querySelector('[data-node-id="D"]')?.classList.contains("is-destination")).toBe(true);
  });

  it("keeps all eighteen future node positions and thirty-three roads internally consistent", () => {
    const completeGeometryGraph: GraphResponse = {
      nodes: Object.keys(simulatedMapGeometry.nodes),
      edges: simulatedMapGeometry.roads.map(({ source, target }, index) => ({ source, target, weight: index + 1 })),
      directed: false,
    };

    expect(completeGeometryGraph.nodes).toHaveLength(18);
    expect(completeGeometryGraph.edges).toHaveLength(33);
    expect(validateMapGeometry(completeGeometryGraph)).toEqual([]);
  });
});
