import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GraphPanel } from "./GraphPanel";
import { algorithmDetails } from "../data/algorithmDetails";
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

function renderGraph(inputGraph = graph, inputResult: RouteResult | null = result, showExploration = false, showWeights = true) {
  return render(
    <GraphPanel
      graph={inputGraph}
      result={inputResult}
      origin={inputResult?.origin ?? "A"}
      destination={inputResult?.destination ?? "D"}
      algorithm="dijkstra"
      showWeights={showWeights}
      onToggleWeights={vi.fn()}
      showExploration={showExploration}
      onToggleExploration={vi.fn()}
      isLoading={false}
    />,
  );
}

describe("GraphPanel simulated road geometry", () => {
  it("renders the approved orthogonal geometry and exposes the three map layers", () => {
    renderGraph(graph, null);

    const roads = [...document.querySelectorAll<SVGPathElement>(".road-surface")];
    expect(roads).toHaveLength(33);
    expect(roads.every((road) => !/[CS]/.test(road.getAttribute("d") ?? ""))).toBe(true);
    expect(screen.getByRole("radio", { name: "Grafo completo" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Camino encontrado" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Exploración" })).toBeTruthy();
  });

  it("renders only backend edges as orthogonal roads and uses backend weights", () => {
    renderGraph();
    fireEvent.click(screen.getByRole("radio", { name: "Grafo completo" }));

    const roads = [...document.querySelectorAll<SVGPathElement>(".road-surface")];
    expect(roads).toHaveLength(33);
    expect(roads.every((road) => !/[CS]/.test(road.getAttribute("d") ?? ""))).toBe(true);
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
    expect([...document.querySelectorAll(".edge-weight.active")].map((weight) => weight.getAttribute("data-edge-key"))).toEqual(
      highlighted.map((road) => road.dataset.edgeKey),
    );
    expect(document.querySelector('[data-node-id="A"]')?.classList.contains("is-origin")).toBe(true);
    expect(document.querySelector('[data-node-id="A"]')?.classList.contains("is-path")).toBe(true);
    expect(document.querySelector('[data-node-id="D"]')?.classList.contains("is-destination")).toBe(true);
    expect(document.querySelector('[data-node-id="D"]')?.classList.contains("is-path")).toBe(true);
    expect(document.querySelectorAll(".road-highlight")).toHaveLength(3);
  });

  it("uses each selected algorithm's route color", () => {
    for (const algorithm of ["bfs", "dfs", "dijkstra"] as const) {
      const algorithmResult = { ...result, algorithm };
      const { unmount } = renderGraph(graph, algorithmResult);
      expect(document.querySelector(".road-highlight")?.getAttribute("style")).toContain(algorithmDetails[algorithm].color);
      unmount();
    }
  });

  it("hides exploration markers by default", () => {
    renderGraph();
    expect(screen.getByRole("radio", { name: "Exploración" }).getAttribute("aria-checked")).toBe("false");
    expect(document.querySelectorAll(".visit-order-badge")).toHaveLength(0);
  });

  it("renders only the API visited order when exploration is enabled", () => {
    renderGraph(graph, result, true);
    expect(document.querySelectorAll(".visit-order-badge")).toHaveLength(result.visited_order.length);
  });

  it("switches between complete, path-only, and exploration layers without inventing edges", () => {
    renderGraph();
    fireEvent.click(screen.getByRole("radio", { name: "Camino encontrado" }));
    expect(document.querySelectorAll(".road-highlight")).toHaveLength(3);
    expect(document.querySelectorAll(".edge-weight.active")).toHaveLength(3);
    expect(document.querySelectorAll(".edge-weight")).toHaveLength(3);

    fireEvent.click(screen.getByRole("radio", { name: "Exploración" }));
    expect(document.querySelectorAll(".road-highlight")).toHaveLength(0);
    expect(document.querySelectorAll(".visit-order-badge")).toHaveLength(result.visited_order.length);
    expect(screen.getByText(/no es un camino continuo/i)).toBeTruthy();
  });

  it("supports map zoom and contextual node and edge information", () => {
    renderGraph();
    fireEvent.click(screen.getByRole("button", { name: "Acercar mapa" }));
    expect(document.querySelector("#network")?.getAttribute("style")).toContain("width: 125%");

    fireEvent.click(screen.getByRole("button", { name: /Centro Occidente · nodo A/i }));
    expect(screen.getByLabelText("Información contextual").textContent).toContain("Terminal Oriente · 20");
    fireEvent.click(screen.getByRole("button", { name: /Conexión A · Centro Occidente a D · Terminal Oriente/i }));
    expect(screen.getByLabelText("Información contextual").textContent).toContain("Peso 20");
  });

  it("exposes a keyboard-scrollable map and a non-color-only endpoint legend", () => {
    renderGraph();

    const stage = screen.getByRole("region", { name: /Mapa desplazable/ });
    expect(stage.getAttribute("tabindex")).toBe("0");
    expect(screen.getByText(/Desplaza horizontalmente para explorar el mapa/)).toBeTruthy();
    expect(document.querySelector(".legend")?.textContent).toContain("Origen · A · Centro Occidente");
    expect(document.querySelector(".legend")?.textContent).toContain("Destino · D · Terminal Oriente");
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
