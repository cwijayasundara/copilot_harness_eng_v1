# Copilot Harness Engine v1

> GAN-inspired harness for autonomous long-running application development with GitHub Copilot coding agent

A scaffold for **GitHub Copilot's cloud-based coding agent** that implements best practices from [Anthropic](https://www.anthropic.com/engineering/harness-design-long-running-apps) and [OpenAI](https://openai.com/index/harness-engineering/) harness engineering research. Combines Karpathy's autoresearch ratcheting with a Generator-Evaluator architecture, custom agent teams, session chaining, and three-layer verification.

See `docs/claude-vs-copilot-scaffold.md` for a comparison deck explaining how this scaffold differs from the Claude Code local development variant.

## Architecture Diagram

```
                        COPILOT HARNESS ENGINE — SCAFFOLD ARCHITECTURE
 ================================================================================

                                YOUR GITHUB REPO
                                ================
  .github/
  +-----------------------------------------------------------------------+
  |                                                                       |
  |  copilot-instructions.md          Global instructions (code style,    |
  |                                   architecture, testing, quality)     |
  |                                                                       |
  |  architecture.md                  Layered dependency rules            |
  |  program.md                       Karpathy human-agent bridge         |
  |  mcp-config.json                  MCP server definitions (context7)   |
  |                                                                       |
  |  agents/                          7 AGENT DEFINITIONS                 |
  |  +----------------------------+                                       |
  |  | planner.agent.md           |   BRD, specs, architecture            |
  |  | generator.agent.md         |   Code + tests, spawns sub-agents    |
  |  | evaluator.agent.md         |   Runs app, verifies contracts       |
  |  | design-critic.agent.md     |   GAN scoring (4 criteria)           |
  |  | security-reviewer.agent.md |   OWASP vulnerability scan           |
  |  | ui-designer.agent.md       |   React+Tailwind mockups             |
  |  | test-engineer.agent.md     |   Test plans + Playwright E2E       |
  |  +----------------------------+                                       |
  |                                                                       |
  |  skills/                          19 SKILL DEFINITIONS                |
  |  +----------------------------+                                       |
  |  | scaffold/  brd/  spec/     |   SDLC pipeline stages               |
  |  | design/  build/  auto/     |   Autonomous ratcheting loop          |
  |  | implement/  evaluate/      |   Code gen + verification            |
  |  | review/  test/  deploy/    |   Quality gates + deployment         |
  |  | fix-issue/  refactor/      |   Maintenance workflows              |
  |  | improve/  lint-drift/      |   Enhancement + entropy control      |
  |  | code-gen/  architecture/   |   Principles + references            |
  |  | evaluation/  testing/      |   Patterns + rubrics                 |
  |  +----------------------------+                                       |
  |                                                                       |
  |  hooks/                           QUALITY GATE HOOKS                  |
  |  +----------------------------+                                       |
  |  | pipeline-gates.json        |   Pre-commit, sprint contract,       |
  |  | quality-gates.json         |   Lint, typecheck, architecture,     |
  |  | security-gates.json        |   Secrets, env, scope validation     |
  |  | scripts/                   |   12 JS hook scripts with adapters   |
  |  +----------------------------+                                       |
  |                                                                       |
  |  instructions/                    FILE-SCOPED RULES                   |
  |  +----------------------------+                                       |
  |  | backend.instructions.md    |   Python rules for backend/**/*.py   |
  |  | frontend.instructions.md   |   TS rules for frontend/**/*.{ts,tsx}|
  |  +----------------------------+                                       |
  |                                                                       |
  |  state/                           RUNTIME STATE                       |
  |  +----------------------------+                                       |
  |  | features.json              |   Feature registry + status          |
  |  | eval-scores.json           |   Evaluation scores per iteration    |
  |  | coverage-baseline.txt      |   Coverage floor (80%)               |
  |  | failures.md                |   Failure patterns + resolutions     |
  |  | iteration-log.md           |   Iteration log + self-healing       |
  |  | learned-rules.md           |   Discovered project-specific rules  |
  |  +----------------------------+                                       |
  |                                                                       |
  |  templates/                       GENERATION TEMPLATES                |
  |  +----------------------------+                                       |
  |  | docker-compose.template.yml|   Docker Compose stack               |
  |  | sprint-contract.json       |   Sprint contract schema             |
  |  | playwright.config.template |   Playwright E2E config              |
  |  | features-template.json     |   Feature definition schema          |
  |  | init-sh.template           |   Bootstrap script                   |
  |  +----------------------------+                                       |
  +-----------------------------------------------------------------------+
```

## How the Copilot Cloud Agent Works

```
  DEPLOYMENT FLOW — FROM REPO TO RUNNING AGENT
  =============================================

  1. PUSH              2. TRIGGER              3. PROVISION            4. EXECUTE
  --------            ---------               ----------              ---------

  Developer           GitHub Issue             GitHub Cloud             Agent runs
  pushes .github/     assigned to              spins up a               inside the
  scaffold to repo    @copilot or              Codespace-like           VM with full
                      /copilot slash           VM with the              repo access
  +--------+          command                  repo checked out
  |  Your  |                                                           +----------+
  |  Repo  |---+      +----------+             +-----------+           |  Copilot |
  | (.github/) |      | Issue:   |             | GitHub-   |           |  Agent   |
  +--------+   +----->| "Add     |------------>| hosted    |---------->|  reads   |
               push   |  auth    |  triggers   | Linux VM  | provisions| .github/ |
               to     |  system" |  agent      | (Ubuntu)  | and runs  | configs  |
               main   +----------+             +-----------+           +----------+
                      assigned to                    |                       |
                      copilot[bot]                   |                       |
                                                     v                       v
                                              +-----------+           +----------+
                                              | Node 20+  |           | Creates  |
                                              | Python 3  |           | branch,  |
                                              | Docker    |           | writes   |
                                              | Git CLI   |           | code,    |
                                              | gh CLI    |           | runs     |
                                              +-----------+           | tests,   |
                                              pre-installed           | opens PR |
                                              toolchain               +----------+


  5. AGENT EXECUTION DETAIL
  =========================

  +-------------------------------------------------------------------+
  |                    COPILOT CLOUD VM                                |
  |                                                                   |
  |  +-------------------+     reads      +------------------------+  |
  |  | copilot-           |<------------- | .github/agents/*.md    |  |
  |  | instructions.md    |               | .github/skills/*.md    |  |
  |  | (global rules)     |               | .github/hooks/*.json   |  |
  |  +-------------------+               | .github/instructions/  |  |
  |                                       | .github/mcp-config.json|  |
  |                                       +------------------------+  |
  |                                                                   |
  |  +-----------+    spawns    +-----------+    spawns               |
  |  | Planner   |------------> | Generator |----------+              |
  |  | Agent     |              | Agent     |          |              |
  |  +-----------+              +-----------+     +----+----+         |
  |       |                          |            | Custom  |         |
  |       v                          v            | Agents  |         |
  |  +----------+              +-----------+      | (sub-   |         |
  |  | BRD,     |              | Code +    |      | agents) |         |
  |  | Stories, |              | Tests     |      +---------+         |
  |  | Specs    |              +-----------+           |              |
  |  +----------+                    |                 |              |
  |                                  v                 v              |
  |                         +-------------------+                     |
  |                         | Evaluator Agent   |                     |
  |                         | (GAN adversary)   |                     |
  |                         +-------------------+                     |
  |                                  |                                |
  |                    PASS: commit + next group                      |
  |                    FAIL: self-heal (3x) or revert                 |
  |                                  |                                |
  |                                  v                                |
  |                         +-------------------+                     |
  |                         | Opens Pull        |                     |
  |                         | Request           |                     |
  |                         +-------------------+                     |
  +-------------------------------------------------------------------+
```

## Where Does the Copilot Cloud Agent Run?

The Copilot coding agent runs on **GitHub-hosted cloud infrastructure**:

| Aspect | Detail |
|--------|--------|
| **Runtime** | GitHub-managed Linux VM (Ubuntu-based, similar to Codespaces) |
| **Trigger** | Assigning an issue to `copilot[bot]`, or using Copilot slash commands |
| **Repo access** | Full clone of the repo — reads `.github/` configs at startup |
| **Tools available** | `read`, `edit`, `search`, `execute` (shell), `agent` (sub-agents), `github/*` (API) |
| **Network** | Outbound internet access (for npm/pip installs, MCP servers, Docker pulls) |
| **Lifecycle** | Runs until task is complete, then opens a PR and terminates |
| **State** | Ephemeral — VM is destroyed after the session. Persistent state is committed to the repo via `.github/state/` files |
| **Cost** | Included in GitHub Copilot Enterprise / Copilot for Business plans |

## How the Scaffold Gets to the Copilot Cloud Agent

```
  SCAFFOLD DELIVERY PATH
  =======================

  1. Clone this repo:
     git clone https://github.com/cwijayasundara/copilot_harness_eng_v1.git

  2. Copy .github/ into your target project:
     cp -r copilot_harness_eng_v1/.github/ your-project/.github/

  3. Push to GitHub:
     cd your-project && git add .github/ && git commit -m "feat: add Copilot harness scaffold"
     git push origin main

  4. Enable Copilot coding agent in repo settings:
     Settings -> Copilot -> Enable "Copilot coding agent"

  5. Assign an issue to Copilot:
     gh issue create --title "Build the auth system" --assignee "@copilot"

  That's it. The agent reads .github/ on startup and follows the harness.


  ALTERNATIVE: Use as a scaffold template
  ----------------------------------------

  From inside the target project, run the /scaffold skill to generate
  a project-specific configuration:

  1. Enable Copilot agent on your repo
  2. Create an issue: "Initialize project with Copilot harness scaffold"
  3. Assign to @copilot — the agent runs /scaffold interactively
```

## Features

- **Generator-Evaluator architecture** — Separate agents prevent self-evaluation bias
- **Karpathy ratcheting** — Monotonic progress; code only gets better, never worse
- **Custom agent teams** — Parallel story execution with phased micro-DAGs
- **Session chaining** — Builds span hours across multiple agent sessions
- **Three-layer evaluation** — API tests + Playwright browser interaction + Vision scoring
- **Sprint contracts** — Generator and evaluator negotiate "done" criteria before coding
- **TDD mandatory** — Tests first, 100% meaningful coverage target, 80% hard floor
- **Self-healing** — 10 error categories with targeted fixes before reverting
- **12 quality gate hooks** — Lint, typecheck, architecture, secrets, scope enforcement
- **File-scoped instructions** — Per-glob rules for backend Python and frontend TypeScript
- **MCP integration** — Context7 for real-time library documentation lookup
- **4 execution modes** — Full, Lean, Solo, Turbo (with varying gate strictness)

## Skills (Commands)

| Skill | Purpose |
|-------|---------|
| `scaffold` | Initialize project with harness |
| `brd` | Socratic interview -> BRD |
| `spec` | BRD -> stories + dependency graph + features.json |
| `design` | Architecture + schemas + mockups |
| `build` | Full 8-phase pipeline |
| `auto` | Autonomous ratcheting loop |
| `implement` | Code generation with custom agent teams |
| `evaluate` | Run app, verify sprint contract |
| `review` | Evaluator + security review |
| `test` | Test plan + Playwright E2E generation |
| `deploy` | Docker Compose + init.sh |
| `fix-issue` | GitHub issue workflow |
| `refactor` | Quality-driven refactoring |
| `improve` | Feature enhancement |
| `lint-drift` | Entropy scanner for pattern drift |

## Agents (7)

| Agent | Role | Model Tier |
|-------|------|------------|
| planner | BRD, specs, architecture, feature list | High |
| generator | Code + tests, spawns custom agent teams | Standard |
| evaluator | Runs app, verifies sprint contracts (GAN adversary) | High |
| design-critic | GAN scoring (4 weighted criteria, max 10 iterations) | High |
| security-reviewer | OWASP vulnerability scan | Standard |
| ui-designer | React+Tailwind mockups from stories | Standard |
| test-engineer | Test plans, fixtures, Playwright E2E | Standard |

## Quality Gate Hooks

Three categories of hooks run automatically during agent execution:

| Category | Trigger | Hooks |
|----------|---------|-------|
| **Security** | `edit` | scope-directory, protect-env, detect-secrets |
| **Quality** | `edit` | lint-on-save, typecheck, check-architecture, check-function-length, check-file-length |
| **Pipeline** | `execute` / lifecycle | pre-commit-gate, sprint-contract-gate, task-completed, teammate-idle-check |

All hook scripts include input normalization adapters for Copilot's tool input format.

## The GAN-Inspired Build Loop

```
  /auto RATCHETING LOOP
  =====================

  program.md  ------>  Pick next unfinished group
  (human steers)       from dependency graph
                              |
                              v
                       +-------------+
                       | Negotiate   |
                       | Sprint      |     Generator proposes,
                       | Contract    |     Evaluator accepts/rejects
                       +-------------+
                              |
                              v
                       +-------------+
                       | Generator   |     Spawns custom agent team
                       | implements  |     TDD mandatory, phased DAG
                       | stories     |     Max 5 concurrent agents
                       +-------------+
                              |
                              v
                       +-------------+
              +------->| Evaluator   |     3-layer verification:
              |        | scores      |     API + Playwright + Vision
              |        +-------------+
              |               |
              |        PASS?--+--FAIL?
              |        |           |
              |        v           v
              |   Commit &    Self-heal
              |   next group  (3 attempts)
              |                    |
              |              Still failing?
              |                    |
              |                    v
              |              Revert + extract
              |              learned rule +
              +------------- escalate to human
```

## Requirements

- GitHub Copilot Enterprise or Copilot for Business (with coding agent enabled)
- Node.js 18+ (for hook scripts in the cloud VM)
- Docker + Docker Compose (for evaluation mode)
- Python 3.12+ / Node.js 20+ (for generated projects)

## Quick Start

```bash
# 1. Copy the scaffold into your project
cp -r copilot_harness_eng_v1/.github/ your-project/.github/
cd your-project
git add .github/ && git commit -m "feat: add Copilot harness scaffold"
git push origin main

# 2. Enable Copilot coding agent in repo settings

# 3. Create and assign an issue
gh issue create \
  --title "Build a task management API with React frontend" \
  --body "Full-stack app with auth, CRUD, and real-time updates" \
  --assignee "@copilot"

# 4. The agent reads .github/, runs /scaffold, then /build
#    It creates a branch, implements, tests, and opens a PR
```

## Based On

- [Anthropic: Harness Design for Long-Running Application Development](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- [Anthropic: Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [OpenAI: Harness Engineering](https://openai.com/index/harness-engineering/)
- [Steve Krenzel: AI is Forcing Us to Write Good Code](https://bits.logic.inc/p/ai-is-forcing-us-to-write-good-code)

## License

MIT
