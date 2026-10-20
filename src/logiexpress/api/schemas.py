"""Pydantic request and response models for the public HTTP API."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, StrictStr, field_validator

from logiexpress.algorithms.result import AlgorithmName


class APIModel(BaseModel):
    """Base model that rejects undeclared request and response fields."""

    model_config = ConfigDict(extra="forbid")


class RouteEndpointsRequest(APIModel):
    """Origin and destination identifiers, preserved without normalization."""

    model_config = ConfigDict(extra="forbid", strict=True)

    origin: StrictStr
    destination: StrictStr

    @field_validator("origin", "destination")
    @classmethod
    def require_trimmed_identifier(cls, value: str) -> str:
        if not value or value.strip() != value:
            raise ValueError("Node identifiers must be non-empty and trimmed")
        return value


class RouteComputeRequest(RouteEndpointsRequest):
    """Input for one route-service calculation."""

    algorithm: AlgorithmName


class GraphEdgeResponse(APIModel):
    """One undirected graph connection represented exactly once."""

    source: StrictStr
    target: StrictStr
    weight: float


class GraphResponse(APIModel):
    """Stable graph snapshot used by API clients."""

    nodes: list[StrictStr]
    edges: list[GraphEdgeResponse]
    directed: Literal[False] = False


class RouteResponse(APIModel):
    """JSON representation of every field in the existing RouteResult."""

    algorithm: AlgorithmName
    origin: StrictStr
    destination: StrictStr
    visited_order: list[StrictStr]
    path: list[StrictStr] | None
    hops: int | None
    total_weight: float | None
    found: bool


class HealthResponse(APIModel):
    """Lightweight process health response."""

    status: Literal["ok"] = "ok"


class ErrorField(APIModel):
    """Safe, user-readable validation location and message."""

    path: str
    message: str


class APIError(APIModel):
    """Consistent public error envelope without internal exception details."""

    code: str
    message: str
    fields: list[ErrorField]


class ErrorResponse(APIModel):
    """Top-level error response."""

    error: APIError
