# Copilot Harness Engine v1 — Agent Instructions

## Pipeline Commands

Invoke these by describing the task — Copilot matches to the appropriate skill:

| Task | Skill | Description |
|------|-------|-------------|
| Gather requirements | brd | Socratic interview → BRD |
| Break down stories | spec | BRD → stories + dependency graph |
| Design architecture | design | Architecture + schemas + mockups |
| Build end-to-end | build | Full 8-phase pipeline |
| Autonomous build | auto | Karpathy ratcheting loop |
| Implement features | implement | Code gen with agent teams |
| Verify features | evaluate | 3-layer verification |
| Code review | review | Evaluator + security review |
| Write tests | test | Test plan + Playwright E2E |
| Deploy | deploy | Docker Compose + init.sh |
| Fix a bug | fix-issue | Branch → fix → test → PR |
| Refactor | refactor | Quality-driven refactoring |
| Enhance features | improve | Story-driven enhancement |
| Check consistency | lint-drift | Pattern drift scanner |

## Agents (7)

| Agent | Role |
|-------|------|
| planner | BRD, specs, architecture, feature list |
| generator | Code + tests, invokes agent teams |
| evaluator | Runs app, verifies sprint contracts |
| design-critic | GAN scoring (4 weighted criteria) |
| security-reviewer | OWASP vulnerability scan |
| ui-designer | React+Tailwind mockups |
| test-engineer | Test plans + Playwright E2E |

## Key Directories

| Path | Purpose |
|------|---------|
| `.github/agents/` | Custom agent definitions |
| `.github/skills/` | Skill definitions (SKILL.md) |
| `.github/state/` | Persistent state (learned rules, features, logs) |
| `.github/templates/` | Sprint contract, feature, config templates |
| `.github/hooks/` | Hook JSON configs |
| `.github/hooks/scripts/` | Hook Node.js scripts |
| `.github/program.md` | Human control knobs for /auto loop |
| `.github/architecture.md` | Layered architecture rules |

## GAN Architecture

The generator MUST NEVER evaluate its own work. Write code → commit → hand off to evaluator. The evaluator independently verifies via API tests, Playwright, and design scoring.

## Karpathy Ratcheting

Every metric moves monotonically forward — never regresses. The ratchet gates (test, type, lint, architecture, API, Playwright, design) block on regression.

## Sprint Contracts

Machine-readable JSON in `sprint-contracts/`. Negotiated before coding: generator proposes, evaluator approves. Immutable after approval.
