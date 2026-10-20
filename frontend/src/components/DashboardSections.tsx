import { Icon } from "./Icon";

interface HeaderActionsProps {
  onReset: () => void;
  onExport: () => void;
}

export function TopBar() {
  return (
    <header className="topbar">
      <div className="breadcrumb">Workspace <span aria-hidden="true">/</span> <strong>Planificador de rutas</strong></div>
      <div className="top-actions">
        <span className="version">API local · cálculo Python</span>
        <div className="avatar" aria-label="LogiExpress">LE</div>
      </div>
    </header>
  );
}

export function PageHeader({ onReset, onExport }: HeaderActionsProps) {
  return (
    <div className="page-title">
      <div>
        <div className="eyebrow">Centro de operaciones</div>
        <h1>Planificación de rutas</h1>
        <p className="subtitle">Explora la red logística, analiza recorridos y compara las estrategias de búsqueda.</p>
      </div>
      <div className="header-actions">
        <button className="btn" type="button" onClick={onReset}><Icon name="reset" />Restablecer</button>
        <button className="btn" type="button" onClick={onExport}><Icon name="export" />Exportar JSON</button>
      </div>
    </div>
  );
}

export function MetricCards({ nodeCount, edgeCount }: { nodeCount: number; edgeCount: number }) {
  return (
    <div className="metrics" aria-label="Datos de la red de demostración">
      <div className="metric">
        <div className="metric-icon"><Icon name="network" /></div>
        <div><div className="metric-value">{String(nodeCount).padStart(2, "0")}</div><div className="metric-label">Ubicaciones en la red</div></div>
      </div>
      <div className="metric">
        <div className="metric-icon"><Icon name="connections" /></div>
        <div><div className="metric-value">{String(edgeCount).padStart(2, "0")}</div><div className="metric-label">Conexiones ponderadas</div></div>
      </div>
      <div className="metric">
        <div className="metric-icon"><Icon name="algorithms" /></div>
        <div><div className="metric-value">03</div><div className="metric-label">Algoritmos disponibles</div></div>
      </div>
    </div>
  );
}

export function LearningGuide() {
  return (
    <section className="learning" id="criterios" aria-label="Guía de interpretación">
      <div className="learning-header">
        <div className="learning-icon"><Icon name="learning" /></div>
        <div>
          <h2>¿Cómo interpretar los resultados?</h2>
          <p>
            <strong>BFS</strong> minimiza la cantidad de saltos, no necesariamente el costo. <strong>DFS</strong> recorre en profundidad y no garantiza un camino mínimo. <strong>Dijkstra</strong> minimiza la suma de pesos cuando todos son no negativos. Los pesos de esta demo representan <strong>costos ficticios</strong>, no kilómetros ni tiempos reales.
          </p>
        </div>
      </div>
    </section>
  );
}

export function Footer({ onBackToTop }: { onBackToTop: () => void }) {
  return (
    <footer className="footer">
      <span>LogiExpress · React + FastAPI · resultados del servicio Python</span>
      <a className="foot-link" href="#inicio" onClick={onBackToTop}>Volver al inicio ↑</a>
    </footer>
  );
}

export function Toast({ message }: { message: string }) {
  return message ? <div className="toast visible" role="status" aria-live="polite">{message}</div> : null;
}
