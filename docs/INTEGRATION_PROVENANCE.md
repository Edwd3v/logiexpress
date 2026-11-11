# Experimental integration provenance

This worktree is a copy-based integration experiment, not a merge of the pending source branches. Its base is local `main` at `17fb317`.

## Source snapshots

| Source | Branch / base | Copied working-tree paths |
|---|---|---|
| FastAPI increment | `feature/fastapi-foundation` / source commit `7fddb6e` / base `17fb317` | `AGENTS.md`, `CHANGELOG.md`, `README.md`, `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`, `docs/DECISIONS.md`, `docs/IMPLEMENTATION_PLAN.md`, `pyproject.toml`, `odd/`, `src/logiexpress/api/`, `tests/test_api.py` |
| React increment | `feature/react-frontend` / source commit `77f4050` / base `17fb317` | `.gitignore`, `frontend/` source, package manifests and lockfile, TypeScript/Vite config, tests, and README |

At integration time, both source worktrees had uncommitted changes and new untracked files. Their source contents were copied without changing either source worktree. The integration commit `2bdd815` records the combined snapshot; no source-branch merge was fabricated or performed. Installed dependencies, build output, and caches were intentionally not copied. Responsive screenshots are now deliberately recorded under `docs/assets/` as validation evidence.

## Integration decisions

- The root `.gitignore` is copied from the React worktree so the existing Python exclusions remain and frontend dependency/build artifacts are also ignored.
- There is no path collision between the React package under `frontend/` and FastAPI's root Python package. FastAPI's root README and docs are retained alongside the frontend README.
- API types and endpoints are integrated against the FastAPI source schemas; route algorithms remain Python-only.
- The frontend's existing fixed graph/snapshots are retained only as explicit demo/test material; they must not be a silent API fallback.
- The integration task document is `odd/tasks/react-fastapi-integration.md`; the FastAPI source task record copied under `odd/` remains separately attributable.

## Approval boundary

This integration is published as `feature/react-fastapi-integration` and is pending merge into `main`. It does not claim approval of the source increments or the integration candidate. Earlier native reviews were not completed: each preflight required `external.select_intended_untracked`, which was unavailable in the review runtime. The repository owner subsequently disabled RDD through the official clone-scoped command; Gentle AI 4.1.1 reports the effective mode as `off` (`clone_local`) from all three shared worktrees. This records the review limitation and owner decision; it does not claim review approval. Python 3.10 compatibility remains unverified; the available Python runtime used for tests is 3.13.5.
