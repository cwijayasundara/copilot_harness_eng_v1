# Claude Harness Engine v1 → GitHub Copilot Cloud Agent Migration

**Date:** 2026-04-09
**Status:** Approved
**Migration type:** Structural remap — reorganize files, adapt formats, preserve all logic

## 1. Overview

Migrate the Claude Harness Engine v1 scaffold from Claude Code plugin format to GitHub Copilot Cloud Agent compatible format. All components stay within the Copilot ecosystem — no hybrid fallback.

### Scope

- 7 agents → 7 `.agent.md` files in `.github/agents/`
- 17 skills → `.agents/skills/` (vendor-neutral)
- 11 hooks → 3 JSON configs in `.github/hooks/` + Node.js scripts in `hooks/`
- `CLAUDE.md` → `AGENTS.md` + `.github/copilot-instructions.md` + path-specific `.instructions.md`
- MCP → agent-level `mcp-servers` in frontmatter + reference `mcp-config.json`
- State → `.agents/state/` with ephemeral/durable `.gitignore` split
- Scaffold → `.agents/skills/scaffold/SKILL.md`

## 2. Target Directory Structure

```
.github/
├── agents/                          # 7 custom agents
│   ├── planner.agent.md
│   ├── generator.agent.md
│   ├── evaluator.agent.md
│   ├── design-critic.agent.md
│   ├── ui-designer.agent.md
│   ├── security-reviewer.agent.md
│   └── test-engineer.agent.md
├── hooks/                           # Hook JSON configs
│   ├── quality-gates.json
│   ├── security-gates.json
│   └── pipeline-gates.json
├── instructions/                    # Path-specific instructions
│   ├── backend.instructions.md
│   └── frontend.instructions.md
├── copilot-instructions.md          # Repo-wide instructions
└── prompts/
    └── sprint-contract.prompt.md

.agents/                             # Vendor-neutral namespace
├── skills/                          # 17 skills
│   ├── auto/SKILL.md
│   ├── brd/SKILL.md
│   ├── spec/SKILL.md
│   ├── design/SKILL.md
│   ├── build/SKILL.md
│   ├── implement/SKILL.md
│   ├── evaluate/SKILL.md
│   ├── review/SKILL.md
│   ├── test/SKILL.md
│   ├── deploy/SKILL.md
│   ├── code-gen/SKILL.md
│   │   └── references/
│   ├── evaluation/SKILL.md
│   │   └── references/
│   ├── testing/SKILL.md
│   │   └── references/
│   ├── architecture/SKILL.md
│   ├── fix-issue/SKILL.md
│   ├── refactor/SKILL.md
│   ├── improve/SKILL.md
│   ├── lint-drift/SKILL.md
│   └── scaffold/SKILL.md
├── state/                           # Persistent state
│   ├── iteration-log.md             # Durable — committed
│   ├── learned-rules.md             # Durable — committed
│   ├── features.json                # Durable — committed
│   ├── failures.md                  # Ephemeral — gitignored
│   └── eval-scores.json             # Ephemeral — gitignored
├── templates/
│   ├── sprint-contract.json
│   ├── features-template.json
│   └── playwright.config.template.ts
├── mcp-config.json                  # Reference MCP config for repo settings
├── architecture.md
└── program.md

hooks/                               # Hook scripts (Node.js)
├── protect-env.js
├── detect-secrets.js
├── scope-directory.js
├── lint-on-save.js
├── typecheck.js
├── check-architecture.js
├── check-function-length.js
├── check-file-length.js
├── pre-commit-gate.js
├── sprint-contract-gate.js
├── task-completed.js
└── teammate-idle-check.js

AGENTS.md                            # Agent-level instructions
```

## 3. Agent Format Migration

### 3.1 Frontmatter Transformation

Each agent converts from Claude Code `.md` to Copilot `.agent.md`:

```yaml
# BEFORE (.claude/agents/evaluator.md)
---
name: evaluator
description: Verifies via API/Playwright/design scoring
tools: [Read, Write, Glob, Grep, Bash, mcp__plugin_playwright_*]
model: opus
---

# AFTER (.github/agents/evaluator.agent.md)
---
name: evaluator
description: Verifies sprint contract criteria via API tests, Playwright interaction, and design scoring. Runs three-layer evaluation.
tools:
  - read
  - edit
  - search
  - execute
  - playwright/*
  - github/*
mcp-servers:
  context7:
    type: local
    command: npx
    args: ["-y", "@context7/mcp-server"]
    tools: ["*"]
---
```

### 3.2 Tool Alias Mapping

| Claude Code Tool | Copilot Alias |
|---|---|
| `Read` | `read` |
| `Write`, `Edit` | `edit` |
| `Glob`, `Grep` | `search` |
| `Bash` | `execute` |
| `Agent` / `Task` | `agent` |
| `WebSearch`, `WebFetch` | `web` |
| `mcp__plugin_playwright_*` | `playwright/*` |
| `mcp__plugin_context7_*` | `context7/*` |

### 3.3 Agent Tool Restrictions

| Agent | Tools |
|---|---|
| Planner | `read`, `edit`, `search`, `execute`, `github/*` |
| Generator | `read`, `edit`, `search`, `execute`, `agent`, `github/*` |
| Evaluator | `read`, `search`, `execute`, `playwright/*`, `github/*` |
| Design Critic | `read`, `execute`, `playwright/*` |
| UI Designer | `read`, `edit`, `search`, `execute` |
| Security Reviewer | `read`, `search`, `execute` |
| Test Engineer | `read`, `edit`, `search`, `execute`, `playwright/*` |

### 3.4 Prompt Body Changes

- Replace Claude Code tool names with Copilot aliases in all prompt text
- Replace "spawn an Agent" → "invoke a custom agent"
- Replace `.claude/state/` → `.agents/state/`
- Replace `.claude/templates/` → `.agents/templates/`
- Remove model-specific language (no "use Opus for judgment")

## 4. Hooks Migration

### 4.1 JSON Config Format

Three JSON files in `.github/hooks/`, each invoking Node.js scripts:

**`.github/hooks/security-gates.json`:**
```json
{
  "version": 1,
  "hooks": [
    {
      "event": "postToolUse",
      "tools": ["edit"],
      "command": {
        "bash": "node hooks/protect-env.js",
        "timeoutSec": 10
      }
    },
    {
      "event": "postToolUse",
      "tools": ["edit"],
      "command": {
        "bash": "node hooks/detect-secrets.js",
        "timeoutSec": 10
      }
    },
    {
      "event": "postToolUse",
      "tools": ["edit"],
      "command": {
        "bash": "node hooks/scope-directory.js",
        "timeoutSec": 10
      }
    }
  ]
}
```

**`.github/hooks/quality-gates.json`:**
```json
{
  "version": 1,
  "hooks": [
    {
      "event": "postToolUse",
      "tools": ["edit"],
      "command": {
        "bash": "node hooks/lint-on-save.js",
        "timeoutSec": 30
      }
    },
    {
      "event": "postToolUse",
      "tools": ["edit"],
      "command": {
        "bash": "node hooks/typecheck.js",
        "timeoutSec": 30
      }
    },
    {
      "event": "postToolUse",
      "tools": ["edit"],
      "command": {
        "bash": "node hooks/check-architecture.js",
        "timeoutSec": 10
      }
    },
    {
      "event": "postToolUse",
      "tools": ["edit"],
      "command": {
        "bash": "node hooks/check-function-length.js",
        "timeoutSec": 5
      }
    },
    {
      "event": "postToolUse",
      "tools": ["edit"],
      "command": {
        "bash": "node hooks/check-file-length.js",
        "timeoutSec": 5
      }
    }
  ]
}
```

**`.github/hooks/pipeline-gates.json`:**
```json
{
  "version": 1,
  "hooks": [
    {
      "event": "postToolUse",
      "tools": ["execute"],
      "command": {
        "bash": "node hooks/pre-commit-gate.js",
        "timeoutSec": 60
      }
    },
    {
      "event": "postToolUse",
      "tools": ["execute"],
      "command": {
        "bash": "node hooks/sprint-contract-gate.js",
        "timeoutSec": 10
      }
    },
    {
      "event": "sessionEnd",
      "command": {
        "bash": "node hooks/task-completed.js",
        "timeoutSec": 10
      }
    }
  ]
}
```

### 4.2 Hook Script Input Adapter

Each Node.js hook gets a thin adapter at the top to normalize Copilot input:

```javascript
const raw = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8'));
const input = {
  tool_name: raw.toolName || raw.tool_name,
  tool_input: raw.toolInput || raw.tool_input || {},
  file_path: raw.toolInput?.file_path || raw.toolInput?.filePath || ''
};
```

Core logic of all 11 scripts remains unchanged.

### 4.3 Hook Disposition

| Hook | Copilot Event | Notes |
|---|---|---|
| protect-env | `postToolUse` on `edit` | Direct mapping |
| detect-secrets | `postToolUse` on `edit` | Direct mapping |
| scope-directory | `postToolUse` on `edit` | Direct mapping |
| lint-on-save | `postToolUse` on `edit` | Direct mapping |
| typecheck | `postToolUse` on `edit` | Direct mapping |
| check-architecture | `postToolUse` on `edit` | Direct mapping |
| check-function-length | `postToolUse` on `edit` | Direct mapping |
| check-file-length | `postToolUse` on `edit` | Direct mapping |
| pre-commit-gate | `postToolUse` on `execute` | Triggers on git commit commands |
| sprint-contract-gate | `postToolUse` on `execute` | Triggers on build commands |
| task-completed | `sessionEnd` | Closest equivalent |
| teammate-idle-check | **Dropped** | No agent team idle detection in Copilot |

## 5. Skills Migration

### 5.1 Frontmatter Changes

```yaml
# BEFORE
---
name: auto
description: Autonomous build loop with Karpathy ratcheting
argument-hint: "[--mode full|lean|solo|turbo] [--group GROUP_ID]"
context: fork
---

# AFTER
---
name: auto
description: Autonomous build loop with Karpathy ratcheting. Use when asked to build autonomously, run the full pipeline, or iterate until all features pass.
allowed-tools: shell
---
```

### 5.2 Field Changes

| Field | Action |
|---|---|
| `description` | Expanded with trigger phrases for Copilot matching |
| `context: fork` | Dropped — cloud agent always runs in ephemeral environment |
| `argument-hint` | Dropped — parameters described in skill body instead |
| `allowed-tools` | Added where skills need shell execution |

### 5.3 Enhanced Descriptions

| Skill | Enhanced Description |
|---|---|
| `brd` | Socratic interview to create a Business Requirements Document. Use when starting a new project, gathering requirements, or asked to create a BRD. |
| `spec` | Decompose BRD into epics, stories, dependency graph, and feature list. Use when asked to break down requirements, create stories, or plan sprints. |
| `design` | Generate system architecture, schemas, and UI mockups. Use when asked to design a system, create architecture, or generate mockups. |
| `build` | Full 8-phase SDLC pipeline with human gates. Use when asked to build an entire application end-to-end. |
| `auto` | Autonomous build loop with Karpathy ratcheting. Use when asked to build autonomously, run the full pipeline, or iterate until all features pass. |
| `implement` | Generate production code and tests for story groups using agent teams. Use when asked to implement features, write code for stories, or build functionality. |
| `evaluate` | Run the application and verify sprint contract criteria via API tests, Playwright interaction, and schema validation. Use when asked to evaluate, verify, or check if features pass. |
| `review` | Run evaluator and security reviewer concurrently. Use when asked to review code quality, check security, or audit implementation. |
| `test` | Generate test plans, test cases, and Playwright E2E tests. Use when asked to write tests, create test plans, or improve test coverage. |
| `deploy` | Generate Docker Compose stack, Dockerfiles, and init.sh bootstrap. Use when asked to containerize, deploy, or create deployment config. |
| `fix-issue` | Standard GitHub issue workflow: branch, reproduce, fix, test, PR. Use when asked to fix a bug, resolve an issue, or address a GitHub issue. |
| `refactor` | Quality-driven refactoring with six quality principles and ratchet gate. Use when asked to refactor, improve code quality, or reduce technical debt. |
| `improve` | Enhance existing features through story-driven development. Use when asked to improve, enhance, or extend existing functionality. |
| `lint-drift` | Scan codebase for pattern drift and generate cleanup PRs. Use when asked to check consistency, scan for drift, or enforce patterns. |
| `scaffold` | Initialize a new project with the Copilot Harness Engine scaffold. Use when asked to create a new project, set up a repo, or initialize the harness. |

### 5.4 Skill Body Changes

- Replace Claude Code tool names with Copilot aliases
- Replace `Agent({ subagent_type: "generator" })` → "invoke the generator custom agent"
- Replace `.claude/state/` → `.agents/state/`
- Replace `.claude/templates/` → `.agents/templates/`
- Replace `.claude/architecture.md` → `.agents/architecture.md`
- Replace `.claude/program.md` → `.agents/program.md`

### 5.5 Change Magnitude Per Skill

| Category | Skills |
|---|---|
| No body changes (pure reference) | `architecture`, `code-gen`, `evaluation`, `testing` |
| Light changes (path refs) | `brd`, `spec`, `design`, `test`, `fix-issue`, `refactor`, `improve`, `lint-drift` |
| Moderate changes (agent dispatch + paths) | `auto`, `build`, `implement`, `evaluate`, `review`, `deploy` |

## 6. Instructions & Configuration

### 6.1 CLAUDE.md Split

**`.github/copilot-instructions.md`** (repo-wide, every interaction):
- Project description and tech stack
- Architecture rules (6-layer dependency flow)
- Code style conventions
- Git conventions
- Testing requirements (80% coverage floor)
- Quality principles (50-line functions, 300-line files)

**`AGENTS.md`** (agent-level, when agents work on repo):
- Pipeline command reference table
- Agent roles and responsibilities
- Harness workflows (ratcheting, sprint contracts, GAN evaluation)
- Directory map (skills, state, templates)
- Hook system documentation

### 6.2 Path-Specific Instructions

Generated by scaffold based on tech stack selection:

```markdown
# .github/instructions/backend.instructions.md
---
applyTo: "backend/**/*.py"
---
Use Python 3.12+. Type-annotate all functions. Use ruff for linting.
Prefer Pydantic models for validation. Use pytest for tests.
```

```markdown
# .github/instructions/frontend.instructions.md
---
applyTo: "frontend/**/*.{ts,tsx}"
---
Use TypeScript strict mode. Prefer functional components with hooks.
Use Tailwind CSS. Use Vitest for unit tests, Playwright for E2E.
```

### 6.3 MCP Configuration

**Agent-level** (in `.agent.md` frontmatter, version-controlled):
```yaml
mcp-servers:
  context7:
    type: local
    command: npx
    args: ["-y", "@context7/mcp-server"]
    tools: ["*"]
```

**Repo-level reference** (`.agents/mcp-config.json`, manual paste into repo settings):
```json
{
  "mcpServers": {
    "context7": {
      "type": "local",
      "command": "npx",
      "args": ["-y", "@context7/mcp-server"],
      "tools": ["query-docs", "resolve-library-id"]
    }
  }
}
```

Playwright MCP is built-in to Copilot cloud agent — no config needed.

### 6.4 program.md

Stays at `.agents/program.md`, unchanged. Read by `/auto` skill at loop start.

## 7. Scaffold Command

Transforms from `.claude/commands/scaffold.md` to `.agents/skills/scaffold/SKILL.md`.

### 7.1 Output Changes

| Step | Current Output | Migrated Output |
|---|---|---|
| Copy scaffold files | `.claude/agents/`, `.claude/skills/`, `.claude/hooks/` | `.github/agents/`, `.agents/skills/`, `.github/hooks/`, `hooks/` |
| Add plugins | `settings.json` enabledPlugins | Dropped — no plugin system |
| Generate instructions | `CLAUDE.md` | `AGENTS.md` + `.github/copilot-instructions.md` + `.github/instructions/*.instructions.md` |
| Generate design doc | `design.md` | Same, updated path references |
| Init state | `.claude/state/` | `.agents/state/` + `.gitignore` for ephemeral files |

### 7.2 New Scaffold Additions

- `.agents/mcp-config.json` — Reference MCP config
- `.github/hooks/` — Three JSON config files
- `.gitignore` entries for ephemeral state
- Post-scaffold checklist printed to user

### 7.3 Post-Scaffold Checklist

```
Next steps:
1. Push to GitHub (hooks must be on default branch)
2. Go to repo Settings > Copilot > Cloud agent
3. Paste contents of .agents/mcp-config.json into MCP configuration
4. Assign an issue to Copilot to verify setup
```

### 7.4 Dropped From Scaffold

- `settings.json` generation
- `enabledPlugins` configuration
- `settings.local.json`

## 8. Features Dropped

| Feature | Reason |
|---|---|
| `settings.json` permissions | Copilot manages permissions internally |
| `settings.local.json` overrides | No local dev concept in cloud agent |
| `enabledPlugins` configuration | No plugin system; agents + skills + MCP replace this |
| `teammate-idle-check.js` hook | No agent team idle detection |
| `context: fork` on skills | Cloud agent always runs in ephemeral environment |
| `argument-hint` on skills | No slash-command invocation |

## 9. Features Approximated

| Feature | Current Mechanism | Copilot Approximation |
|---|---|---|
| Model per agent | `model:` field with Opus/Sonnet | `model:` field exists but models differ; prompts are model-agnostic |
| Agent team parallelism | Generator spawns 5 concurrent sub-agents | `/auto` skill works stories sequentially; or creates separate issues |
| Session chaining | `claude-progress.txt` at context start | `.agents/state/` committed between runs; next run reads them |
| GAN separation | Structural — different agents | Preserved — evaluator and generator are separate `.agent.md` files |
| Design scoring (vision) | Screenshots + vision model scoring | `playwright/*` screenshots + prompt-based analysis (lower fidelity) |

## 10. Migration Validation

After migration, verify by:

1. **Structure check:** All files in expected locations
2. **Agent discovery:** Custom agents appear in Copilot dropdown after push to default branch
3. **Skill discovery:** Skills load when matching prompts are used
4. **Hook execution:** Hooks fire on edit/execute events (check cloud agent session logs)
5. **MCP connectivity:** Context7 tools available (check "Start MCP Servers" in session logs)
6. **End-to-end:** Assign a test issue to Copilot; verify it uses the correct agent, follows instructions, and hooks execute
