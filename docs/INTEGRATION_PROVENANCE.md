# Experimental integration provenance

This worktree is a copy-based integration experiment, not a merge of the pending source branches. Its base is local `main` at `17fb317`.

## Source snapshots

| Source | Branch / base | Copied working-tree paths |
|---|---|---|
| FastAPI increment | `feature/fastapi-foundation` / `17fb317` | `AGENTS.md`, `CHANGELOG.md`, `README.md`, `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`, `docs/DECISIONS.md`, `docs/IMPLEMENTATION_PLAN.md`, `pyproject.toml`, `odd/`, `src/logiexpress/api/`, `tests/test_api.py` |
| React increment | `feature/react-frontend` / `17fb317` | `.gitignore`, `frontend/` source, package manifests and lockfile, TypeScript/Vite config, tests, and README |

Both source worktrees had uncommitted changes and new untracked files. Their source contents were copied without changing either source worktree. No source-branch commit or merge was fabricated or performed. Installed dependencies, build output, browser screenshots, and caches were intentionally not copied.

## Integration decisions

- The root `.gitignore` is copied from the React worktree so the existing Python exclusions remain and frontend dependency/build artifacts are also ignored.
- There is no path collision between the React package under `frontend/` and FastAPI's root Python package. FastAPI's root README and docs are retained alongside the frontend README.
- API types and endpoints are integrated against the FastAPI source schemas; route algorithms remain Python-only.
- The frontend's existing fixed graph/snapshots are retained only as explicit demo/test material; they must not be a silent API fallback.
- The integration task document is `odd/tasks/react-fastapi-integration.md`; the FastAPI source task record copied under `odd/` remains separately attributable.

## Approval boundary

This experiment does not approve either source increment or this integration candidate. The earlier native reviews were not completed: each preflight required the `external.select_intended_untracked` capture, which was unavailable in the review runtime. The repository owner subsequently disabled RDD through the official clone-scoped command; Gentle AI 4.1.1 reports the effective mode as `off` (`clone_local`) from all three shared worktrees. This records the review limitation and owner decision; it does not claim review approval. Ordinary verification and repository delivery policies still apply.
