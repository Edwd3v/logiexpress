# Curated LogiExpress Visual Evidence

This index selects a small set of visual references for the approved 4A.2 geometry and the final 4B.2.1 dashboard. The prototype is a design reference; the screenshots are execution evidence. Original captures remain unchanged.

| File | Increment | Artifact | What it demonstrates | Size |
|---|---|---|---|---:|
| `docs/prototypes/incremento-4a/prototipo-dashboard.html` | 4A.2 | Interactive visual prototype; not connected to FastAPI | Approved refined orthogonal geometry (`4a2-refined` is the default). | 52,564 bytes |
| `docs/prototypes/incremento-4b.2.1/capturas/11-dashboard-completo-1440.png` | 4B.2.1 | React dashboard execution capture | Final dashboard configuration and map, plus the selected Dijkstra result, comparison cards, and expanded dynamic analysis. The capture shows 18 nodes and 33 connections. | 382,321 bytes |
| `docs/prototypes/incremento-4b.2/capturas/fastapi-real/01-result-bfs-fastapi.png` | 4B.2 | React/FastAPI execution capture | BFS A→R: path A→D→R, cost 23, 2 hops. This earlier capture is selected because the purported 4B.2.1 BFS image is mislabeled. | 42,305 bytes |
| `docs/prototypes/incremento-4b.2.1/capturas/04-resultado-dfs-1440.png` | 4B.2.1 | React/FastAPI execution capture | DFS A→R: path A→B→C→D→F→E→N→P→Q→H→R, cost 33, 10 hops. | 81,825 bytes |
| `docs/prototypes/incremento-4b.2.1/capturas/05-resultado-dijkstra-1440.png` | 4B.2.1 | React/FastAPI execution capture | Dijkstra A→R: path A→E→F→D→R, cost 6, 4 hops. | 52,664 bytes |

The `03-resultado-bfs-1440.png` file is intentionally excluded: it is byte-identical to the Dijkstra capture above and visibly shows Dijkstra, not BFS. The selected BFS evidence is from 4B.2, the newest verified correctly labeled capture available. No capture was regenerated for this selection.
