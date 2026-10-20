import type { FormEvent } from "react";

import { demoGraph, demoNodeLayout, algorithmDetails } from "../data/demoGraph";
import type { AlgorithmName } from "../types/api";
import type { DashboardState } from "../types/dashboard";
import { Icon } from "./Icon";

interface ConfigurationPanelProps {
  state: DashboardState;
  onChange: (patch: Partial<DashboardState>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function ConfigurationPanel({ state, onChange, onSubmit }: ConfigurationPanelProps) {
  const algorithms: AlgorithmName[] = ["bfs", "dfs", "dijkstra"];

  function swapEndpoints() {
    onChange({ origin: state.destination, destination: state.origin });
  }

  return (
    <form className="panel controls" onSubmit={onSubmit}>
      <div className="panel-heading">
        <div>
          <h2 className="panel-title">Configurar análisis</h2>
          <p className="panel-subtitle">Selecciona los puntos y el tipo de recorrido.</p>
        </div>
        <span className="step-label">01</span>
      </div>

      <div className="mode-section">
        <span className="field-name" id="modeTitle">Modo de análisis</span>
        <div className="mode-switch" role="radiogroup" aria-labelledby="modeTitle">
          <label>
            <input
              type="radio"
              name="mode"
              value="single"
              checked={state.mode === "single"}
              onChange={() => onChange({ mode: "single" })}
            />
            <span>Ruta individual</span>
          </label>
          <label>
            <input
              type="radio"
              name="mode"
              value="compare"
              checked={state.mode === "compare"}
              onChange={() => onChange({ mode: "compare" })}
            />
            <span>Comparar los 3</span>
          </label>
        </div>
      </div>

      <div className="selector-grid">
        <div>
          <label className="field-name" htmlFor="origin">Origen</label>
          <div className="select-wrap">
            <select
              id="origin"
              name="origin"
              value={state.origin}
              onChange={(event) => onChange({ origin: event.target.value })}
            >
              {demoGraph.nodes.map((node) => (
                <option key={node} value={node}>{nodeLabel(node)}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="swap-row">
          <button
            className="swap"
            type="button"
            aria-label="Intercambiar origen y destino"
            title="Intercambiar origen y destino"
            onClick={swapEndpoints}
          >
            <Icon name="swap" size={15} />
          </button>
        </div>
        <div>
          <label className="field-name" htmlFor="destination">Destino</label>
          <div className="select-wrap">
            <select
              id="destination"
              name="destination"
              value={state.destination}
              onChange={(event) => onChange({ destination: event.target.value })}
            >
              {demoGraph.nodes.map((node) => (
                <option key={node} value={node}>{nodeLabel(node)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <hr className="control-rule" />

      <div className="algo-section">
        <span className="field-name" id="algoTitle">
          {state.mode === "compare" ? "Algoritmo destacado en el grafo" : "Algoritmo a mostrar"}
        </span>
        <div className="algo-list" role="radiogroup" aria-labelledby="algoTitle">
          {algorithms.map((algorithm) => (
            <label className="algo-option" key={algorithm}>
              <input
                type="radio"
                name="algorithm"
                value={algorithm}
                checked={state.algorithm === algorithm}
                onChange={() => onChange({ algorithm })}
              />
              <span>
                <strong>{algorithmDetails[algorithm].name}</strong>
                <small>{algorithmDetails[algorithm].summary}</small>
              </span>
              <span className={`algo-tag ${algorithm}`} aria-hidden="true" />
            </label>
          ))}
        </div>
      </div>

      <div className="control-cta">
        <button type="submit" className="btn btn-primary btn-full">
          <Icon name="search" />Mostrar ejemplo
        </button>
      </div>
      <div className="helper">
        <Icon name="info" size={14} />
        <span>No se conecta a FastAPI ni ejecuta algoritmos en el navegador. Solo muestra ejemplos estáticos de A → D.</span>
      </div>
    </form>
  );
}

function nodeLabel(node: string): string {
  if (node === "A") return "Nodo A · Centro principal";
  if (node === "D") return "Nodo D · Destino";
  return demoNodeLayout[node].name;
}
