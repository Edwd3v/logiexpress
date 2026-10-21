import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GraphPanel } from "./GraphPanel";
import { simulatedMapGeometry, validateMapGeometry } from "../data/simulatedMapGeometry";
import type { GraphResponse, RouteResult } from "../types/api";

const graph: GraphResponse = {
  nodes: ["A", "B", "C", "D", "E", "F"],
  edges: [
    { source: "B", target: "A", weight: 2 },
    { source: "B", target: "C", weight: 5 },
    { source: "C", target: "D", weight: 1 },
    { source: "A", target: "E", weight: 1 },
    { source: "F", target: "E", weight: 1 },
    { source: "D", target: "F", weight: 1 },
    { source: "A", target: "D", weight: 20 },
  ],
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
    expect(roads).toHaveLength(7);
    expect(roads.every((road) => road.getAttribute("d")?.includes("C"))).toBe(true);
    expect(document.querySelectorAll(".svg-node")).toHaveLength(6);
    expect([...document.querySelectorAll(".edge-weight text")].map((label) => label.textContent)).toEqual([
      "2", "5", "1", "1", "1", "1", "20",
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
    expect(document.querySelectorAll(".road-surface")).toHaveLength(7);
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
