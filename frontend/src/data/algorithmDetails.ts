import type { AlgorithmName } from "../types/api";

export const algorithmDetails: Record<
  AlgorithmName,
  { name: string; color: string; textColor: string; pale: string; summary: string; description: string }
> = {
  bfs: {
    name: "BFS",
    color: "#c77734",
    textColor: "#7f471d",
    pale: "#fff2e7",
    summary: "Menor cantidad de saltos",
    description: "BFS encuentra una ruta con el mínimo número de aristas, sin considerar el costo de los pesos.",
  },
  dfs: {
    name: "DFS",
    color: "#7659bc",
    textColor: "#5b438f",
    pale: "#f1edfb",
    summary: "Exploración en profundidad",
    description: "DFS sigue una rama antes de retroceder; su ruta depende del orden de vecinos y no garantiza el mínimo costo ni los mínimos saltos.",
  },
  dijkstra: {
    name: "Dijkstra",
    color: "#078b7e",
    textColor: "#00675f",
    pale: "#e4f5f2",
    summary: "Menor costo acumulado",
    description: "Dijkstra encuentra una ruta de menor suma de pesos, siempre que todas las aristas tengan pesos no negativos.",
  },
};
