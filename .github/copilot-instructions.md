# Copilot Harness Engine v1

A GAN-inspired harness combining Karpathy ratcheting + harness engineering best practices for autonomous long-running application development.

## Architecture

Strict layered architecture — dependencies flow downward only:
UI → API → Service → Repository → Config → Types

The `check-architecture` hook enforces this on every file save. See `.github/architecture.md` for full rules.

## Code Style

- Functions: max 50 lines. Decompose into named sub-functions.
- Files: max 300 lines. Split by responsibility.
- Python: type-annotate all functions. Use ruff for linting, mypy for type checking.
- TypeScript: strict mode. Use ESLint for linting, tsc for type checking.
- No hardcoded secrets. Use environment variables.
- No console.log/print in production paths.

## Testing

- TDD mandatory: write failing test first, then implement.
- Coverage floor: 80% (ratchet gate blocks below this).
- Coverage target: 100% meaningful coverage.
- Every public function/endpoint must have a corresponding test.

## Git Conventions

- Conventional commits: feat:, fix:, chore:, docs:, refactor:, test:
- One logical change per commit.
- Never commit .env files or secrets.

## Quality Principles

1. Write code that is readable first, performant second
2. Use established patterns — do not introduce new frameworks mid-sprint
3. Prefer explicit error handling over silent failures
4. Define typed interface contracts before implementation
5. Every acceptance criterion must have at least one test case
6. Never modify tests to make them pass — fix the code under test

## Agents (7)

| Agent | Role | Model Tier |
|-------|------|------------|
| planner | BRD, specs, architecture, feature list | High |
| generator | Code + tests, spawns custom agents | Standard |
| evaluator | Runs app, verifies sprint contracts | High |
| design-critic | GAN scoring (4 weighted criteria, max 10 iter) | High |
| security-reviewer | OWASP vulnerability scan | Standard |
| ui-designer | React+Tailwind mockups | Standard |
| test-engineer | Test plans + Playwright E2E | Standard |

Agent definitions are in `.github/agents/`. Each agent has specific tools and responsibilities.

## Quality Gate Hooks

Three categories of hooks run automatically during development:

### Security Gates (`.github/hooks/security-gates.json`)
Triggered on **edit** operations:
- `scope-directory.js` — Validates edits stay within project scope
- `protect-env.js` — Prevents committing .env files
- `detect-secrets.js` — Detects hardcoded secrets and credentials

### Quality Gates (`.github/hooks/quality-gates.json`)
Triggered on **edit** operations:
- `lint-on-save.js` — Runs ruff/eslint formatting and linting
- `typecheck.js` — Runs mypy/tsc type checking
- `check-architecture.js` — Enforces layered dependency rules
- `check-function-length.js` — Blocks functions > 50 lines
- `check-file-length.js` — Blocks files > 300 lines

### Pipeline Gates (`.github/hooks/pipeline-gates.json`)
Triggered on **execute** and lifecycle events:
- `pre-commit-gate.js` — Pre-commit quality checks
- `sprint-contract-gate.js` — Sprint contract compliance verification
- `task-completed.js` — Task completion tracking (on session end)
- `teammate-idle-check.js` — Monitors idle custom agents for missing tests

All hook scripts include input normalization adapters to handle both camelCase (`toolInput`, `filePath`) and snake_case (`tool_input`, `file_path`) input formats.

## MCP Servers

Configured in `.github/mcp-config.json`:
- **context7** — Library documentation lookup (query-docs, resolve-library-id)

## File-Scoped Instructions

- `.github/instructions/backend.instructions.md` — Python-specific rules for `backend/**/*.py`
- `.github/instructions/frontend.instructions.md` — TypeScript-specific rules for `frontend/**/*.{ts,tsx}`

## Allowed Tool Operations

The following operations are pre-approved for automated execution:
- Testing: pytest, npm test, npx playwright
- Linting: ruff, npm run lint, eslint
- Type checking: mypy, npx tsc, npm run typecheck
- Containers: docker compose
- Local testing: curl localhost
- Git: status, diff, log, branch, checkout, commit, push, merge
- GitHub CLI: gh issue, gh pr
- File ops: mkdir, grep, find, wc

## State Files

Located in `.github/state/`:
- `coverage-baseline.txt` — Coverage floor (80%)
- `eval-scores.json` — Evaluation scores across iterations
- `features.json` — Feature registry with implementation status
- `failures.md` — Failure patterns and resolution tracking
- `iteration-log.md` — Iteration attempts and self-healing outcomes
- `learned-rules.md` — Discovered patterns and project-specific rules

## Key Reference Files

- `.github/program.md` — Karpathy human-agent bridge (edit to steer autonomous loop)
- `.github/architecture.md` — Full layered architecture specification
- `.github/skills/` — 19 skill definitions for SDLC pipeline stages
- `.github/templates/` — Docker, Playwright, sprint contract templates
