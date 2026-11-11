import type { AlgorithmName } from "./api";

export type AnalysisMode = "single" | "compare";

export interface DashboardState {
  origin: string;
  destination: string;
  algorithm: AlgorithmName;
  mode: AnalysisMode;
  showWeights: boolean;
  showExploration: boolean;
}

export const initialDashboardState: DashboardState = {
  origin: "A",
  destination: "D",
  algorithm: "dijkstra",
  mode: "compare",
  showWeights: true,
  showExploration: false,
};
