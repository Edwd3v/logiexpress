const locationNames: Record<string, string> = {
  A: "Centro Occidente",
  B: "Hub Norte",
  C: "Bodega Industrial",
  D: "Terminal Oriente",
  E: "Microhub Central",
  F: "Consolidación Sur",
  G: "Estación Noroeste",
  H: "Hub Metropolitano",
  I: "Plataforma Noreste",
  J: "Puerto Seco",
  K: "Terminal Sureste",
  L: "Centro Logístico Sur",
  M: "Bodega Suroeste",
  N: "Microhub Oeste",
  O: "Terminal Exterior",
  P: "Enlace Comercial",
  Q: "Bodega Urbana",
  R: "Centro Oriente",
};

export function locationLabel(node: string): string {
  const name = locationNames[node];
  return name ? `${node} · ${name}` : node;
}
