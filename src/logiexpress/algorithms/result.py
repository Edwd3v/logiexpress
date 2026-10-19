"""Shared immutable result for graph route algorithms."""

from dataclasses import dataclass
from typing import Literal

AlgorithmName = Literal["bfs", "dfs", "dijkstra"]


@dataclass(frozen=True)
class RouteResult:
    """Route data kept independent of presentation frameworks."""

    algorithm: AlgorithmName
    origin: str
    destination: str
    visited_order: tuple[str, ...]
    path: tuple[str, ...] | None
    hops: int | None
    total_weight: float | None
    found: bool
