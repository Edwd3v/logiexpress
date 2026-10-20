import type { ReactNode } from "react";

export type IconName =
  | "brand"
  | "planner"
  | "compare"
  | "guide"
  | "reset"
  | "export"
  | "network"
  | "connections"
  | "algorithms"
  | "search"
  | "swap"
  | "check"
  | "info"
  | "graph"
  | "learning";

const shapes: Record<IconName, ReactNode> = {
  brand: <><circle cx="5" cy="6" r="2" /><circle cx="18" cy="5" r="2" /><circle cx="17" cy="18" r="2" /><path d="M7 6h9M18 7v9M7 7l8 9" /></>,
  planner: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  compare: <path d="M4 20V12M10 20V5M16 20v-8M22 20V9" />,
  guide: <><circle cx="12" cy="12" r="9" /><path d="M12 10v6M12 7.5h.01" /></>,
  reset: <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" />,
  export: <path d="M12 3v12m-4-4 4 4 4-4M4 17v3h16v-3" />,
  network: <><circle cx="5" cy="12" r="2" /><circle cx="19" cy="5" r="2" /><circle cx="19" cy="19" r="2" /><path d="M7 11l10-5M7 13l10 5" /></>,
  connections: <path d="m3 16 7-9 5 4 6-7M3 20h18" />,
  algorithms: <path d="M4 6h16M4 12h10M4 18h14" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></>,
  swap: <path d="M7 3v16m0 0-4-4m4 4 4-4M17 21V5m0 0-4 4m4-4 4 4" />,
  check: <path d="m4 12 5 5L20 6" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></>,
  graph: <><circle cx="5" cy="6" r="2" /><circle cx="19" cy="6" r="2" /><circle cx="12" cy="18" r="2" /><path d="m7 7 4 9m6-9-4 9M7 6h10" /></>,
  learning: <><path d="M5 5h14v14H5zM8 9h8M8 13h6" /><path d="M8 16h4" /></>,
};

interface IconProps {
  name: IconName;
  className?: string;
  size?: number;
}

export function Icon({ name, className = "mini-icon", size }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      {shapes[name]}
    </svg>
  );
}
