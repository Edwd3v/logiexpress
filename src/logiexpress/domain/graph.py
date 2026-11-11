"""Grafo ponderado no dirigido y validado, basado en diccionarios de adyacencia."""

from math import isfinite
from numbers import Real


class Graph:
    """Grafo simple no dirigido con pesos finitos y no negativos."""

    def __init__(self) -> None:
        self._adjacency: dict[str, dict[str, float]] = {}

    def add_node(self, node_id: str) -> None:
        """Agrega un nodo y rechaza identificadores inválidos o duplicados."""
        self._validate_node_id(node_id)
        if node_id in self._adjacency:
            raise ValueError(f"Node already exists: {node_id!r}")
        self._adjacency[node_id] = {}

    def has_node(self, node_id: str) -> bool:
        """Indica si el grafo contiene *node_id*."""
        self._validate_node_id(node_id)
        return node_id in self._adjacency

    def node_ids(self) -> tuple[str, ...]:
        """Devuelve los identificadores de nodos en orden lexicográfico."""
        return tuple(sorted(self._adjacency))

    def add_edge(self, source: str, target: str, weight: Real) -> None:
        """Agrega una arista no dirigida entre dos nodos existentes."""
        self._validate_node_id(source)
        self._validate_node_id(target)
        numeric_weight = self._validate_weight(weight)

        if source not in self._adjacency:
            raise KeyError(source)
        if target not in self._adjacency:
            raise KeyError(target)
        if source == target:
            raise ValueError("Self-loops are not allowed")
        if target in self._adjacency[source]:
            raise ValueError(f"Edge already exists: {source!r} — {target!r}")

        self._adjacency[source][target] = numeric_weight
        self._adjacency[target][source] = numeric_weight

    def neighbors(self, node_id: str) -> tuple[tuple[str, float], ...]:
        """Devuelve una copia inmutable y ordenada de los vecinos y sus pesos."""
        self._require_node(node_id)
        return tuple(sorted(self._adjacency[node_id].items()))

    def weight(self, source: str, target: str) -> float:
        """Devuelve el peso de la arista; lanza KeyError si falta un nodo o la arista."""
        self._require_node(source)
        self._require_node(target)
        try:
            return self._adjacency[source][target]
        except KeyError:
            raise KeyError((source, target)) from None

    def _require_node(self, node_id: str) -> None:
        self._validate_node_id(node_id)
        if node_id not in self._adjacency:
            raise KeyError(node_id)

    @staticmethod
    def _validate_node_id(node_id: str) -> None:
        if not isinstance(node_id, str):
            raise TypeError("Node identifiers must be strings")
        if not node_id or node_id.strip() != node_id:
            raise ValueError("Node identifiers must be non-empty and trimmed")

    @staticmethod
    def _validate_weight(weight: Real) -> float:
        if isinstance(weight, bool) or not isinstance(weight, Real):
            raise TypeError("Edge weights must be real numbers")
        numeric_weight = float(weight)
        if not isfinite(numeric_weight) or numeric_weight < 0:
            raise ValueError("Edge weights must be finite and non-negative")
        return numeric_weight
