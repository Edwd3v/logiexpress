import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import App from "./App";

describe("LogiExpress dashboard", () => {
  it("presents the prototype workspace and labels the local demo honestly", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Planificación de rutas" })).toBeTruthy();
    expect(screen.getByText("Demo local · datos ficticios")).toBeTruthy();
    expect(
      screen.getByText(/No se conecta a FastAPI ni ejecuta algoritmos en el navegador/),
    ).toBeTruthy();
    expect(screen.getByRole("img", { name: /Grafo ficticio de LogiExpress/ })).toBeTruthy();
  });

  it("switches the highlighted route when a comparison card is selected", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Destacar ruta BFS/ }));

    expect(screen.getByText("Ruta destacada · BFS")).toBeTruthy();
    expect(screen.getByText("20", { selector: ".number" })).toBeTruthy();
    expect(document.querySelectorAll(".svg-active-edge")).toHaveLength(1);
  });

  it("does not invent route data for a pair without a static demo snapshot", () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Origen"), { target: { value: "B" } });
    fireEvent.click(screen.getByRole("button", { name: /Mostrar ejemplo/ }));

    expect(screen.getByText(/No hay una demostración fija para B → D/)).toBeTruthy();
    expect(screen.getAllByText("—", { selector: ".number" })).toHaveLength(2);
  });

  it("supports swapping endpoints, toggling edge weights, and resetting controls", () => {
    render(<App />);

    const origin = screen.getByLabelText("Origen") as HTMLSelectElement;
    const destination = screen.getByLabelText("Destino") as HTMLSelectElement;
    expect(document.querySelectorAll(".edge-weight")).toHaveLength(7);

    fireEvent.click(screen.getByRole("button", { name: "Intercambiar origen y destino" }));
    expect(origin.value).toBe("D");
    expect(destination.value).toBe("A");

    fireEvent.click(screen.getByLabelText("Mostrar pesos"));
    expect(document.querySelectorAll(".edge-weight")).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Restablecer" }));
    expect(origin.value).toBe("A");
    expect(destination.value).toBe("D");
    expect(document.querySelectorAll(".edge-weight")).toHaveLength(7);
  });

  it("switches to comparison mode when its navigation link is selected", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("link", { name: /Comparar rutas/ }));

    expect(screen.getByRole("region", { name: "Comparación de algoritmos" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Comparar rutas/ }).getAttribute("aria-current")).toBe(
      "location",
    );
  });
});
