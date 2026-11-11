"""FastAPI application delegating route calculations to existing services."""

from collections.abc import Sequence
from typing import Annotated

from fastapi import APIRouter, Depends, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from logiexpress.algorithms.result import AlgorithmName, RouteResult
from logiexpress.domain.graph import Graph
from logiexpress.infrastructure.sample_data import build_demo_graph
from logiexpress.services.route_service import compare_routes, run_route

from .schemas import (
    APIError,
    ErrorField,
    ErrorResponse,
    GraphEdgeResponse,
    GraphResponse,
    HealthResponse,
    RouteComputeRequest,
    RouteEndpointsRequest,
    RouteResponse,
)


def get_graph() -> Graph:
    """Provide the same fictitious graph source used by the Streamlit UI."""
    return build_demo_graph()


GraphDependency = Annotated[Graph, Depends(get_graph)]


class UnknownNodeError(Exception):
    """Raised when a route service cannot resolve one requested node."""

    def __init__(self, field: str) -> None:
        self.field = field


def _route_response(result: RouteResult) -> RouteResponse:
    return RouteResponse(
        algorithm=result.algorithm,
        origin=result.origin,
        destination=result.destination,
        visited_order=list(result.visited_order),
        path=list(result.path) if result.path is not None else None,
        hops=result.hops,
        total_weight=result.total_weight,
        found=result.found,
    )


def _unknown_node_field(error: KeyError, request: RouteEndpointsRequest) -> str:
    node_id = error.args[0] if error.args else None
    return "origin" if node_id == request.origin else "destination"


def _validation_message(error: dict[str, object]) -> str:
    error_type = error.get("type")
    location = error.get("loc", ())
    if error_type == "json_invalid":
        return "El cuerpo JSON está malformado."
    if error_type == "missing":
        return "Este campo es obligatorio."
    if error_type == "extra_forbidden":
        return "Este campo no está permitido."
    if "algorithm" in location:
        return "Algoritmo no reconocido; use bfs, dfs o dijkstra."
    return "El campo tiene un valor o tipo inválido."


def _validation_response(errors: Sequence[dict[str, object]]) -> JSONResponse:
    fields = [
        ErrorField(
            path=".".join(str(part) for part in error.get("loc", ()) if part != "body")
            or "body",
            message=_validation_message(error),
        )
        for error in errors
    ]
    payload = ErrorResponse(
        error=APIError(
            code="validation_error",
            message="La solicitud contiene campos ausentes o inválidos.",
            fields=fields,
        )
    )
    return JSONResponse(status_code=422, content=payload.model_dump(mode="json"))


def _unknown_node_response(field: str) -> JSONResponse:
    payload = ErrorResponse(
        error=APIError(
            code="unknown_node",
            message="El nodo solicitado no existe.",
            fields=[ErrorField(path=field, message="Identificador desconocido.")],
        )
    )
    return JSONResponse(status_code=404, content=payload.model_dump(mode="json"))


app = FastAPI(
    title="LogiExpress API",
    description=(
        "HTTP interface over the existing LogiExpress graph and route services. "
        "BFS, DFS, and Dijkstra remain implemented in the Python core."
    ),
    version="0.6.0",
)
router = APIRouter(prefix="/api")


@app.exception_handler(RequestValidationError)
async def handle_validation_error(
    _request: Request, error: RequestValidationError
) -> JSONResponse:
    """Return sanitized, stable validation errors instead of framework details."""
    return _validation_response(error.errors())


@app.exception_handler(UnknownNodeError)
async def handle_unknown_node(
    _request: Request, error: UnknownNodeError
) -> JSONResponse:
    """Translate a service KeyError into the public 404 contract."""
    return _unknown_node_response(error.field)


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    """Report that the HTTP process is responsive without running algorithms."""
    return HealthResponse()


@router.get("/graph", response_model=GraphResponse)
def graph_snapshot(graph: GraphDependency) -> GraphResponse:
    """Return graph nodes and unique undirected weighted edges in stable order."""
    edges = [
        GraphEdgeResponse(source=source, target=target, weight=weight)
        for source in graph.node_ids()
        for target, weight in graph.neighbors(source)
        if source < target
    ]
    return GraphResponse(nodes=list(graph.node_ids()), edges=edges)


@router.post(
    "/routes/compute",
    response_model=RouteResponse,
    responses={404: {"model": ErrorResponse}, 422: {"model": ErrorResponse}},
)
def compute_route(
    request: RouteComputeRequest, graph: GraphDependency
) -> RouteResponse:
    """Delegate one route request to the established route service."""
    try:
        result = run_route(
            graph, request.origin, request.destination, request.algorithm
        )
    except KeyError as error:
        raise UnknownNodeError(_unknown_node_field(error, request)) from None
    return _route_response(result)


@router.post(
    "/routes/compare",
    response_model=dict[AlgorithmName, RouteResponse],
    responses={404: {"model": ErrorResponse}, 422: {"model": ErrorResponse}},
)
def compare_route_results(
    request: RouteEndpointsRequest, graph: GraphDependency
) -> dict[AlgorithmName, RouteResponse]:
    """Return all three original service results without selecting a winner."""
    try:
        results = compare_routes(graph, request.origin, request.destination)
    except KeyError as error:
        raise UnknownNodeError(_unknown_node_field(error, request)) from None
    return {algorithm: _route_response(result) for algorithm, result in results.items()}


app.include_router(router)
