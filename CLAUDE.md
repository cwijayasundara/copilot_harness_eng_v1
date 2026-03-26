# Claude Harness Engine v1

A Claude Code plugin scaffold for autonomous long-running application development.

## What This Is

A GAN-inspired harness implementing Karpathy's autoresearch ratcheting with:
- Generator-Evaluator architecture (no self-evaluation bias)
- Agent teams for parallel story execution
- Session chaining for multi-context-window builds
- Layered evaluation (API + Playwright + Vision)

## Installation

1. Clone: `git clone <repo-url> ~/claude-harness-engine`
2. Load as plugin: `claude --plugin-dir ~/claude-harness-engine/.claude`
3. Scaffold a project: `/claude-harness-engine:scaffold`

## Available Commands

| Command | Purpose |
|---------|---------|
| `/scaffold` | Initialize project with harness |
| `/brd` | Socratic interview → BRD |
| `/spec` | BRD → stories + dependency graph + feature list |
| `/design` | Architecture + schemas + mockups |
| `/implement` | Code generation with agent teams |
| `/evaluate` | Run app, verify sprint contract |
| `/review` | Evaluator + security review |
| `/test` | Test plan + Playwright E2E |
| `/deploy` | Docker Compose + init.sh |
| `/build` | Full 8-phase pipeline |
| `/auto` | Autonomous ratcheting loop |
| `/fix-issue` | GitHub issue workflow |
| `/refactor` | Quality-driven refactoring |
| `/improve` | Feature enhancement |

## Agent Roles

| Agent | Role |
|-------|------|
| planner | BRD, specs, architecture, feature list |
| generator | Code + tests, spawns agent teams |
| evaluator | Runs app, verifies sprint contracts |
| design-critic | Frontend GAN scoring (4 criteria) |
| security-reviewer | OWASP vulnerability scan |
| ui-designer | React+Tailwind mockups |
| test-engineer | Test plans + Playwright E2E |

## Key Files

- `.claude/program.md` — Karpathy human-agent bridge (edit to steer /auto)
- `.claude/settings.json` — Hook config + permissions
- `project-manifest.json` — Stack + evaluation config (generated per project)
- `features.json` — Feature tracking for session chaining
- `claude-progress.txt` — Session recovery context

## Design Spec

See `.claude/docs/design-spec.md` and `.claude/docs/implementation-plan.md`
