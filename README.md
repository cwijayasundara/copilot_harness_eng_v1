# Claude Harness Engine v1

> GAN-inspired harness for autonomous long-running application development with Claude Code

## Features

- Generator-Evaluator architecture (prevents self-evaluation bias)
- Karpathy autoresearch ratcheting (monotonic progress)
- Agent teams for parallel story execution
- Session chaining across context windows
- Three-layer evaluation: API + Playwright + Vision
- Flexible tech stack (Python, Node, any frontend)

## Quick Start

1. Clone this repo
2. `claude --plugin-dir /path/to/this/repo/.claude`
3. `cd your-project && /claude-harness-engine:scaffold`
4. `/brd` to start

## How It Works

### 8-Phase Pipeline

The `/build` command runs the full pipeline. Phases 1–3 are human-gated:

| Phase | Command | Description |
|-------|---------|-------------|
| 1 | `/brd` | Socratic interview → Business Requirements Document |
| 2 | `/spec` | BRD → stories + dependency graph + feature list |
| 3 | `/design` | Architecture + schemas + React/Tailwind mockups |
| 4 | `/implement` | Code generation with agent teams (parallel stories) |
| 5 | `/review` | Evaluator runs app + security reviewer scans code |
| 6 | `/test` | Playwright E2E test generation |
| 7 | `/deploy` | Docker Compose + init.sh generation |
| 8 | Commit | Final commit with passing gates |

### The /auto Ratchet Loop

`/auto` runs the Karpathy autoresearch ratchet: it reads the dependency graph, picks the next unfinished story group, negotiates a sprint contract between the Generator and Evaluator agents, spawns an agent team to implement the group in parallel, and then runs a 6-gate ratchet check. Progress is monotonic — nothing is marked done until all gates pass against the running application.

If a gate fails, `/auto` self-heals (up to 3 attempts per error category). On 3rd failure it reverts, logs a learned rule, and escalates to the human. Each session writes a recovery record to `claude-progress.txt` so the next context window picks up exactly where the last one left off.

### Generator-Evaluator Pattern

The Generator writes code. The Evaluator starts the Docker stack and verifies against the sprint contract — it never reads code, only tests behavior. This separation prevents self-evaluation bias: the Generator cannot talk itself into accepting its own incomplete implementation.

The Design Critic adds a GAN loop for frontend groups: it scores screenshots against 4 criteria (design quality, originality, craft, functionality) and sends specific critique back to the Generator until the score threshold is met or max iterations are reached.

## Architecture

```
+---------------------------------------------------------------------+
|                        HUMAN INTERFACE                               |
|  program.md  |  CLAUDE.md  |  project-manifest.json                 |
+---------------------+-----------------------+------------------------+
                       |
                       v
+---------------------------------------------------------------------+
|                      ORCHESTRATION LAYER                             |
|  /brd -> /spec -> /design -> /implement -> /evaluate -> /auto       |
+---------------------+-----------------------+------------------------+
                       |
                       v
+---------------------------------------------------------------------+
|                     AGENT LAYER (7 agents)                          |
|  planner | generator | evaluator | design-critic |                  |
|  security-reviewer | ui-designer | test-engineer                    |
+---------------------+-----------------------+------------------------+
                       |
                       v
+---------------------------------------------------------------------+
|                   ENFORCEMENT LAYER (12 hooks)                      |
|  Security: scope-directory | protect-env | detect-secrets           |
|  Quality:  lint-on-save | typecheck | check-function-length         |
|            check-file-length                                        |
|  Gates:    pre-commit-gate | sprint-contract-gate                   |
|  Teams:    teammate-idle-check | Info: task-completed               |
+---------------------+-----------------------+------------------------+
                       |
                       v
+---------------------------------------------------------------------+
|                       STATE LAYER                                   |
|  program.md | features.json | claude-progress.txt                  |
|  sprint-contracts/ | iteration-log.md | learned-rules.md            |
+---------------------------------------------------------------------+
```

## Based On

- [Harness Design for Long-Running Application Development](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- [Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [Claude Code Agent Teams](https://code.claude.com/docs/en/agent-teams)

## Requirements

- Claude Code v2.1.32+
- Node.js (for hooks)
- Docker + Docker Compose (for evaluation)

## License

MIT
