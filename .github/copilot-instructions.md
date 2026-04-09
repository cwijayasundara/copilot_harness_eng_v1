# Copilot Harness Engine v1

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
