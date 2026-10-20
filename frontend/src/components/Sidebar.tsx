import { Icon } from "./Icon";

export type DashboardSection = "planificador" | "comparacion" | "criterios";

interface SidebarProps {
  activeSection: DashboardSection;
  onNavigate: (section: DashboardSection) => void;
}

const navigation: { id: DashboardSection; label: string; icon: "planner" | "compare" | "guide" }[] = [
  { id: "planificador", label: "Planificador", icon: "planner" },
  { id: "comparacion", label: "Comparar rutas", icon: "compare" },
  { id: "criterios", label: "Guía de algoritmos", icon: "guide" },
];

export function Sidebar({ activeSection, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar" aria-label="Navegación principal">
      <a className="brand" href="#inicio" aria-label="LogiExpress, volver al inicio">
        <div className="brand-mark"><Icon name="brand" size={23} /></div>
        <div><strong>LogiExpress</strong><small>Route Intelligence</small></div>
      </a>
      <div className="nav-label">Espacio de trabajo</div>
      <nav aria-label="Secciones">
        {navigation.map(({ id, label, icon }) => (
          <a
            className={`nav-link${activeSection === id ? " active" : ""}`}
            href={`#${id}`}
            key={id}
            aria-current={activeSection === id ? "location" : undefined}
            onClick={() => onNavigate(id)}
          >
            <Icon name={icon} />
            <span>{label}</span>
          </a>
        ))}
      </nav>
      <div className="sidebar-spacer" />
      <div className="sidebar-box">
        <div><span className="demo-dot" /><strong>Demo de diseño</strong></div>
        <p>Datos ficticios y rutas ilustrativas. No se conecta al backend ni calcula algoritmos.</p>
      </div>
      <div className="sidebar-foot">Interfaz conceptual · V1</div>
    </aside>
  );
}
