# Copilot Cloud Agent Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the Claude Harness Engine v1 scaffold from `.claude/` to GitHub Copilot Cloud Agent compatible format using `.github/agents/`, `.agents/skills/`, `.github/hooks/`, and `hooks/`.

**Architecture:** Structural remap — same logic, new directory layout and frontmatter formats. All 7 agents, 18 skills, 12 hooks, templates, state, and instructions are migrated. No hybrid fallback.

**Tech Stack:** Node.js (hooks), Markdown with YAML frontmatter (agents/skills), JSON (hook configs, MCP, templates)

**Spec:** `docs/superpowers/specs/2026-04-09-copilot-cloud-agent-migration-design.md`

---

## File Structure

### New files to create:

```
.github/
  agents/planner.agent.md
  agents/generator.agent.md
  agents/evaluator.agent.md
  agents/design-critic.agent.md
  agents/ui-designer.agent.md
  agents/security-reviewer.agent.md
  agents/test-engineer.agent.md
  hooks/security-gates.json
  hooks/quality-gates.json
  hooks/pipeline-gates.json
  copilot-instructions.md
  instructions/backend.instructions.md
  instructions/frontend.instructions.md

.agents/
  skills/auto/SKILL.md
  skills/brd/SKILL.md
  skills/spec/SKILL.md
  skills/design/SKILL.md
  skills/build/SKILL.md
  skills/implement/SKILL.md
  skills/evaluate/SKILL.md
  skills/review/SKILL.md
  skills/test/SKILL.md
  skills/deploy/SKILL.md
  skills/code-gen/SKILL.md
  skills/code-gen/references/api-integration-patterns.md
  skills/evaluation/SKILL.md
  skills/evaluation/references/contract-schema.json
  skills/evaluation/references/playwright-patterns.md
  skills/evaluation/references/scoring-examples.md
  skills/evaluation/references/scoring-rubric.md
  skills/testing/SKILL.md
  skills/testing/references/playwright.md
  skills/testing/references/test-data.md
  skills/architecture/SKILL.md
  skills/fix-issue/SKILL.md
  skills/refactor/SKILL.md
  skills/improve/SKILL.md
  skills/lint-drift/SKILL.md
  skills/scaffold/SKILL.md
  state/iteration-log.md
  state/learned-rules.md
  state/features.json (empty array)
  state/failures.md
  state/eval-scores.json
  state/coverage-baseline.txt
  templates/sprint-contract.json
  templates/features-template.json
  templates/features-template.example.json
  templates/init-sh.template
  templates/docker-compose.template.yml
  templates/playwright.config.template.ts
  mcp-config.json
  architecture.md
  program.md

hooks/
  protect-env.js
  detect-secrets.js
  scope-directory.js
  lint-on-save.js
  typecheck.js
  check-architecture.js
  check-function-length.js
  check-file-length.js
  pre-commit-gate.js
  sprint-contract-gate.js
  task-completed.js
  teammate-idle-check.js

AGENTS.md
```

---

## Task 1: Create Directory Structure

**Files:**
- Create: All directories listed above

- [ ] **Step 1: Create all directories**

```bash
mkdir -p .github/agents .github/hooks .github/instructions
mkdir -p .agents/skills/auto .agents/skills/brd .agents/skills/spec .agents/skills/design .agents/skills/build .agents/skills/implement .agents/skills/evaluate .agents/skills/review .agents/skills/test .agents/skills/deploy .agents/skills/code-gen/references .agents/skills/evaluation/references .agents/skills/testing/references .agents/skills/architecture .agents/skills/fix-issue .agents/skills/refactor .agents/skills/improve .agents/skills/lint-drift .agents/skills/scaffold
mkdir -p .agents/state .agents/templates
mkdir -p hooks
```

- [ ] **Step 2: Verify directories exist**

Run: `find .github .agents hooks -type d | sort`
Expected: All directories listed above

- [ ] **Step 3: Commit**

```bash
git add .github .agents hooks
git commit -m "chore: create Copilot cloud agent directory structure"
```

---

## Task 2: Migrate 7 Agents to `.github/agents/`

**Files:**
- Source: `.claude/agents/planner.md`, `generator.md`, `evaluator.md`, `design-critic.md`, `ui-designer.md`, `security-reviewer.md`, `test-engineer.md`
- Create: `.github/agents/planner.agent.md`, `generator.agent.md`, `evaluator.agent.md`, `design-critic.agent.md`, `ui-designer.agent.md`, `security-reviewer.agent.md`, `test-engineer.agent.md`

### Migration rules applied to ALL agents:

1. **Filename:** `name.md` → `name.agent.md`
2. **Frontmatter tools:** Remap using alias table:
   - `Read` → `read`
   - `Write`, `Edit` → `edit`
   - `Glob`, `Grep` → `search`
   - `Bash` → `execute`
   - `Agent` → `agent`
   - `WebSearch`, `WebFetch` → `web`
   - Any `mcp__plugin_playwright_*` → `playwright/*`
3. **Frontmatter additions:** Add `mcp-servers` block for agents that need Context7
4. **Remove:** `model:` field (model-agnostic per design decision)
5. **Body replacements (all agents):**
   - `.claude/state/` → `.agents/state/`
   - `.claude/templates/` → `.agents/templates/`
   - `.claude/skills/` → `.agents/skills/`
   - `.claude/hooks/` → `hooks/`
   - `CLAUDE.md` → `AGENTS.md`
   - "Bash tool" → "execute tool"
   - "Read tool" → "read tool"
   - "Write tool" → "edit tool"
   - "Glob tool" → "search tool"
   - "Grep tool" → "search tool"
   - "spawn an Agent" / "Spawn Agent" → "invoke a custom agent"
   - References to `Agent({` → "invoke the [name] custom agent"
   - `superpowers:` skill references → keep as-is (skills are cross-platform)

- [ ] **Step 1: Create planner.agent.md**

Read `.claude/agents/planner.md`, apply all migration rules above. Key frontmatter change:

```yaml
---
name: planner
description: Expands user prompts into BRD, decomposes into stories with dependency graph, designs system architecture, generates feature list and machine-readable schemas.
tools:
  - read
  - edit
  - search
  - execute
  - github/*
---
```

Write the full migrated file to `.github/agents/planner.agent.md`. Body: copy from source with all `.claude/` path replacements applied.

- [ ] **Step 2: Create generator.agent.md**

Key frontmatter:

```yaml
---
name: generator
description: Implements code and tests from user stories. Spawns agent teams for parallel execution. Negotiates sprint contracts with evaluator.
tools:
  - read
  - edit
  - search
  - execute
  - agent
  - github/*
mcp-servers:
  context7:
    type: local
    command: npx
    args: ["-y", "@context7/mcp-server"]
    tools: ["*"]
---
```

Body: copy from source with path replacements + replace "Spawn Agent" language with "invoke a custom agent".

- [ ] **Step 3: Create evaluator.agent.md**

Key frontmatter:

```yaml
---
name: evaluator
description: Skeptical verifier that runs the application and checks sprint contract criteria via API tests, Playwright interaction, and schema validation.
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

Body: copy from source with path replacements + replace all `mcp__plugin_playwright_*` tool references with `playwright/*`.

- [ ] **Step 4: Create design-critic.agent.md**

Key frontmatter:

```yaml
---
name: design-critic
description: GAN counterpart for frontend quality. Takes screenshots and scores against 4 criteria (design quality, originality, craft, functionality).
tools:
  - read
  - edit
  - execute
  - playwright/*
---
```

- [ ] **Step 5: Create ui-designer.agent.md**

Key frontmatter:

```yaml
---
name: ui-designer
description: Creates self-contained React+Tailwind HTML mockups from stories and API contracts during the design phase.
tools:
  - read
  - edit
  - search
  - execute
---
```

- [ ] **Step 6: Create security-reviewer.agent.md**

Key frontmatter:

```yaml
---
name: security-reviewer
description: Scans for injection, auth bypass, hardcoded secrets, SSRF, path traversal, and other OWASP top 10 vulnerabilities.
tools:
  - read
  - search
  - execute
---
```

- [ ] **Step 7: Create test-engineer.agent.md**

Key frontmatter:

```yaml
---
name: test-engineer
description: Generates test plans, test cases mapped to acceptance criteria, Playwright E2E test files, and test data fixtures.
tools:
  - read
  - edit
  - search
  - execute
  - playwright/*
---
```

- [ ] **Step 8: Verify all 7 agents have valid YAML frontmatter**

Run: `for f in .github/agents/*.agent.md; do echo "=== $f ===" && head -20 "$f"; done`
Expected: Each file shows valid `---` delimited YAML with `name`, `description`, `tools`

- [ ] **Step 9: Commit**

```bash
git add .github/agents/
git commit -m "feat: migrate 7 agents to Copilot .agent.md format"
```

---

## Task 3: Create Hook JSON Configs

**Files:**
- Create: `.github/hooks/security-gates.json`, `.github/hooks/quality-gates.json`, `.github/hooks/pipeline-gates.json`

- [ ] **Step 1: Create security-gates.json**

Write to `.github/hooks/security-gates.json`:

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

- [ ] **Step 2: Create quality-gates.json**

Write to `.github/hooks/quality-gates.json`:

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

- [ ] **Step 3: Create pipeline-gates.json**

Write to `.github/hooks/pipeline-gates.json`:

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

- [ ] **Step 4: Validate JSON syntax**

Run: `for f in .github/hooks/*.json; do echo "=== $f ===" && python3 -m json.tool "$f" > /dev/null && echo "VALID"; done`
Expected: All three files print "VALID"

- [ ] **Step 5: Commit**

```bash
git add .github/hooks/
git commit -m "feat: add Copilot hook JSON configs for security, quality, and pipeline gates"
```

---

## Task 4: Migrate Hook Scripts to `hooks/`

**Files:**
- Source: `.claude/hooks/*.js` (12 files)
- Create: `hooks/*.js` (12 files)

Each hook script is copied with two changes:
1. **Input adapter** prepended after the `'use strict';` line
2. **Project dir detection** updated: replace `.claude` directory detection with `.agents` directory detection

### Input adapter (prepend to each hook after `'use strict';`):

```javascript
// Adapter: normalize Copilot cloud agent hook input to match expected shape
function normalizeInput(raw) {
  return {
    tool_name: raw.toolName || raw.tool_name,
    tool_input: raw.toolInput || raw.tool_input || {},
    file_path: (raw.toolInput && (raw.toolInput.file_path || raw.toolInput.filePath)) ||
               (raw.tool_input && (raw.tool_input.file_path || raw.tool_input.filePath)) || ''
  };
}
```

### Project dir detection update:

In hooks that use `findProjectDir()` (scope-directory, pre-commit-gate, sprint-contract-gate, task-completed, teammate-idle-check), change the detection from looking for `.claude` to looking for `.agents`:

```javascript
// BEFORE
const claudeDir = path.join(current, '.claude');
if (fs.existsSync(claudeDir)) {

// AFTER
const agentsDir = path.join(current, '.agents');
if (fs.existsSync(agentsDir)) {
```

### Sprint contract gate update:

In `sprint-contract-gate.js`, change the progress file path:

```javascript
// BEFORE
const progressFile = path.join(projectDir, 'claude-progress.txt');

// AFTER
const progressFile = path.join(projectDir, '.agents', 'state', 'claude-progress.txt');
```

- [ ] **Step 1: Copy and adapt protect-env.js**

Copy `.claude/hooks/protect-env.js` → `hooks/protect-env.js`. This hook has no `findProjectDir` — only needs the `normalizeInput` adapter. Replace the inline input parsing with `normalizeInput(raw)` usage where the hook reads stdin.

- [ ] **Step 2: Copy and adapt detect-secrets.js**

Same pattern as Step 1. No `findProjectDir`. Add `normalizeInput` adapter. Also update the directory skip check: replace `/hooks/` check to not skip the new `hooks/` location (since the scripts themselves live there now). The skip should check for `.claude/hooks/` or `.github/hooks/` specifically, or remove the hooks skip since these are JS files not being scanned for secrets in the normal flow.

- [ ] **Step 3: Copy and adapt scope-directory.js**

Has `findProjectDir` — update to detect `.agents` instead of `.claude`. Add `normalizeInput` adapter.

- [ ] **Step 4: Copy and adapt lint-on-save.js**

No `findProjectDir`. Add `normalizeInput` adapter.

- [ ] **Step 5: Copy and adapt typecheck.js**

No `findProjectDir`. Add `normalizeInput` adapter.

- [ ] **Step 6: Copy and adapt check-architecture.js**

No `findProjectDir`. Add `normalizeInput` adapter.

- [ ] **Step 7: Copy and adapt check-function-length.js**

No `findProjectDir`. Add `normalizeInput` adapter.

- [ ] **Step 8: Copy and adapt check-file-length.js**

No `findProjectDir`. Add `normalizeInput` adapter.

- [ ] **Step 9: Copy and adapt pre-commit-gate.js**

Has `findProjectDir` — update `.claude` → `.agents`. Add `normalizeInput` adapter.

- [ ] **Step 10: Copy and adapt sprint-contract-gate.js**

Has `findProjectDir` — update `.claude` → `.agents`. Update progress file path to `.agents/state/claude-progress.txt`. Add `normalizeInput` adapter.

- [ ] **Step 11: Copy and adapt task-completed.js**

Has `findProjectDir` — update `.claude` → `.agents`. Add `normalizeInput` adapter.

- [ ] **Step 12: Copy and adapt teammate-idle-check.js**

Has `findProjectDir` — update `.claude` → `.agents`. Add `normalizeInput` adapter. Note: this hook is kept for completeness but won't fire in Copilot (no `TeammateIdle` event).

- [ ] **Step 13: Verify all hooks are valid Node.js**

Run: `for f in hooks/*.js; do echo "=== $f ===" && node -c "$f" && echo "VALID"; done`
Expected: All 12 files print "VALID"

- [ ] **Step 14: Commit**

```bash
git add hooks/
git commit -m "feat: migrate 12 hook scripts with Copilot input adapter"
```

---

## Task 5: Migrate Reference Skills (No Body Changes)

**Files:**
- Source: `.claude/skills/architecture/SKILL.md`, `.claude/skills/code-gen/SKILL.md`, `.claude/skills/evaluation/SKILL.md`, `.claude/skills/testing/SKILL.md`
- Create: `.agents/skills/architecture/SKILL.md`, `.agents/skills/code-gen/SKILL.md`, `.agents/skills/evaluation/SKILL.md`, `.agents/skills/testing/SKILL.md`
- Also: All reference subdirectory files

### Frontmatter-only changes for reference skills:

- Remove `context: fork` and `argument-hint` if present
- Expand `description` with trigger phrases
- Add `allowed-tools: shell` where applicable

- [ ] **Step 1: Migrate architecture/SKILL.md**

Copy `.claude/skills/architecture/SKILL.md` → `.agents/skills/architecture/SKILL.md`. Update frontmatter description to: "Layered architecture rules — one-way imports, module boundaries, file organization. Use when checking architecture compliance, reviewing layer violations, or enforcing dependency rules."

- [ ] **Step 2: Migrate code-gen/SKILL.md and references**

Copy `.claude/skills/code-gen/SKILL.md` → `.agents/skills/code-gen/SKILL.md`. Update description to: "Code generation quality principles — TDD, typing, error handling, logging, API integration, LLM integration. Use when writing code, implementing features, or reviewing code quality."

Copy `.claude/skills/code-gen/references/api-integration-patterns.md` → `.agents/skills/code-gen/references/api-integration-patterns.md` (no changes).

- [ ] **Step 3: Migrate evaluation/SKILL.md and references**

Copy `.claude/skills/evaluation/SKILL.md` → `.agents/skills/evaluation/SKILL.md`. Update description to: "Evaluation patterns — sprint contract format, three-layer verification, scoring rubric references. Use when evaluating features, verifying contracts, or scoring design quality."

In the body, replace `.claude/skills/evaluation/references/` → `.agents/skills/evaluation/references/` and `.claude/state/` → `.agents/state/`.

Copy all 4 reference files:
- `contract-schema.json`
- `playwright-patterns.md`
- `scoring-examples.md`
- `scoring-rubric.md`

No changes to reference file content.

- [ ] **Step 4: Migrate testing/SKILL.md and references**

Copy `.claude/skills/testing/SKILL.md` → `.agents/skills/testing/SKILL.md`. Update description to: "Testing patterns — Playwright E2E, test structure, fixture management, mock boundaries. Use when writing tests, setting up test infrastructure, or reviewing test quality."

Copy reference files:
- `playwright.md`
- `test-data.md`

No changes to reference file content.

- [ ] **Step 5: Commit**

```bash
git add .agents/skills/architecture/ .agents/skills/code-gen/ .agents/skills/evaluation/ .agents/skills/testing/
git commit -m "feat: migrate 4 reference skills with reference files to .agents/"
```

---

## Task 6: Migrate Light-Change Skills (Path Refs Only)

**Files:**
- Source + Create for: `brd`, `spec`, `design`, `test`, `fix-issue`, `refactor`, `improve`, `lint-drift`

### Common changes for all light-change skills:

1. Frontmatter: expand `description`, remove `argument-hint`, remove `context: fork`
2. Body: replace `.claude/` paths with `.agents/` paths

- [ ] **Step 1: Migrate brd/SKILL.md**

Update description: "Socratic interview to create a Business Requirements Document. Use when starting a new project, gathering requirements, or asked to create a BRD."

Body path replacements: `.claude/state/` → `.agents/state/`, `.claude/skills/` → `.agents/skills/`

- [ ] **Step 2: Migrate spec/SKILL.md**

Update description: "Decompose BRD into epics, stories, dependency graph, and feature list for agent team execution. Use when asked to break down requirements, create stories, or plan sprints."

- [ ] **Step 3: Migrate design/SKILL.md**

Update description: "Generate system architecture, machine-readable schemas, and UI mockups. Spawns planner + ui-designer concurrently. Use when asked to design a system, create architecture, or generate mockups."

- [ ] **Step 4: Migrate test/SKILL.md**

Update description: "Generate test plan, test cases mapped to acceptance criteria, Playwright E2E test files, and test data fixtures. Use when asked to write tests, create test plans, or improve test coverage."

- [ ] **Step 5: Migrate fix-issue/SKILL.md**

Update description: "Standard GitHub issue workflow. Branch, reproduce, fix, test, PR. Use when asked to fix a bug, resolve an issue, or address a GitHub issue."

- [ ] **Step 6: Migrate refactor/SKILL.md**

Update description: "Refactor existing code for quality, performance, or maintainability. Enforces six quality principles with ratchet gate. Use when asked to refactor, improve code quality, or reduce technical debt."

- [ ] **Step 7: Migrate improve/SKILL.md**

Update description: "Enhance existing features through story-driven development with full verification. Use when asked to improve, enhance, or extend existing functionality."

- [ ] **Step 8: Migrate lint-drift/SKILL.md**

Update description: "Scan codebase for pattern drift and generate targeted cleanup PRs. Entropy control for agent-generated code. Use when asked to check consistency, scan for drift, or enforce patterns."

- [ ] **Step 9: Commit**

```bash
git add .agents/skills/brd/ .agents/skills/spec/ .agents/skills/design/ .agents/skills/test/ .agents/skills/fix-issue/ .agents/skills/refactor/ .agents/skills/improve/ .agents/skills/lint-drift/
git commit -m "feat: migrate 8 light-change skills to .agents/"
```

---

## Task 7: Migrate Moderate-Change Skills (Agent Dispatch + Paths)

**Files:**
- Source + Create for: `auto`, `build`, `implement`, `evaluate`, `review`, `deploy`

### Additional changes beyond path replacements:

- Replace `Agent({ subagent_type: "generator" })` style calls with "invoke the generator custom agent"
- Replace `Agent({ subagent_type: "evaluator" })` with "invoke the evaluator custom agent"
- Replace agent team spawning references with Copilot custom agent invocation patterns
- Add `allowed-tools: shell` to frontmatter for skills that execute commands

- [ ] **Step 1: Migrate auto/SKILL.md**

Update description: "Autonomous build loop with Karpathy ratcheting, GAN evaluator, and session chaining. Iterates story groups until all features pass or stopping criteria met. Use when asked to build autonomously, run the full pipeline, or iterate until all features pass."

Add `allowed-tools: shell`. Remove `argument-hint` and `context: fork`.

Body changes: all path replacements + replace agent spawning syntax + replace `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` references with "invoke custom agents".

- [ ] **Step 2: Migrate build/SKILL.md**

Update description: "Full SDLC pipeline. Runs all phases end-to-end with human gates on phases 1-3. Use when asked to build an entire application end-to-end."

Add `allowed-tools: shell`.

- [ ] **Step 3: Migrate implement/SKILL.md**

Update description: "Generate production code and tests for a story group using agent teams for parallel execution. Use when asked to implement features, write code for stories, or build functionality."

Add `allowed-tools: shell`. Replace agent team spawning with custom agent invocation.

- [ ] **Step 4: Migrate evaluate/SKILL.md**

Update description: "Run the application and verify sprint contract criteria via API tests, Playwright interaction, and schema validation. Use when asked to evaluate, verify, or check if features pass."

Add `allowed-tools: shell`.

- [ ] **Step 5: Migrate review/SKILL.md**

Update description: "Run evaluator and security reviewer concurrently for comprehensive quality gate. Use when asked to review code quality, check security, or audit implementation."

- [ ] **Step 6: Migrate deploy/SKILL.md**

Update description: "Generate Docker Compose stack, Dockerfiles, environment config, and init.sh bootstrap script. Use when asked to containerize, deploy, or create deployment config."

Add `allowed-tools: shell`.

- [ ] **Step 7: Commit**

```bash
git add .agents/skills/auto/ .agents/skills/build/ .agents/skills/implement/ .agents/skills/evaluate/ .agents/skills/review/ .agents/skills/deploy/
git commit -m "feat: migrate 6 moderate-change skills with agent dispatch updates"
```

---

## Task 8: Create Scaffold Skill

**Files:**
- Source: `.claude/commands/scaffold.md`
- Create: `.agents/skills/scaffold/SKILL.md`

- [ ] **Step 1: Create scaffold SKILL.md**

Convert the scaffold command to a skill. Key changes:

Frontmatter:
```yaml
---
name: scaffold
description: Initialize a new project with the Copilot Harness Engine scaffold. Use when asked to create a new project, set up a repo, or initialize the harness.
allowed-tools: shell
---
```

Body changes from the original scaffold command:
- Replace all `.claude/` copy targets with new directory structure
- Replace `settings.json` generation with hook JSON config generation
- Replace `CLAUDE.md` generation with `AGENTS.md` + `.github/copilot-instructions.md` + `.github/instructions/*.instructions.md`
- Replace plugin source paths: `.claude/agents/` → `.github/agents/`, `.claude/skills/` → `.agents/skills/`
- Add MCP config generation step (`.agents/mcp-config.json`)
- Add post-scaffold checklist (push to GitHub, paste MCP config)
- Remove `enabledPlugins` configuration
- Remove `settings.json` / `settings.local.json` generation
- Update state init paths to `.agents/state/`

- [ ] **Step 2: Verify SKILL.md has valid frontmatter**

Run: `head -10 .agents/skills/scaffold/SKILL.md`
Expected: Valid YAML frontmatter with `name`, `description`, `allowed-tools`

- [ ] **Step 3: Commit**

```bash
git add .agents/skills/scaffold/
git commit -m "feat: create scaffold skill for Copilot cloud agent"
```

---

## Task 9: Create Instructions Files

**Files:**
- Create: `AGENTS.md`, `.github/copilot-instructions.md`, `.github/instructions/backend.instructions.md`, `.github/instructions/frontend.instructions.md`

- [ ] **Step 1: Create .github/copilot-instructions.md**

This is the repo-wide instruction file, loaded for every Copilot interaction. Content derived from `CLAUDE.md` but focused on coding conventions:

```markdown
# Copilot Harness Engine v1

## Architecture

Strict layered architecture — dependencies flow downward only:
UI → API → Service → Repository → Config → Types

The `check-architecture` hook enforces this on every file save. See `.agents/architecture.md` for full rules.

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
```

- [ ] **Step 2: Create AGENTS.md**

Agent-level instructions, loaded when agents work on this repo:

```markdown
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
| `.agents/skills/` | Skill definitions (SKILL.md) |
| `.agents/state/` | Persistent state (learned rules, features, logs) |
| `.agents/templates/` | Sprint contract, feature, config templates |
| `.github/hooks/` | Hook JSON configs |
| `hooks/` | Hook Node.js scripts |
| `.agents/program.md` | Human control knobs for /auto loop |
| `.agents/architecture.md` | Layered architecture rules |

## GAN Architecture

The generator MUST NEVER evaluate its own work. Write code → commit → hand off to evaluator. The evaluator independently verifies via API tests, Playwright, and design scoring.

## Karpathy Ratcheting

Every metric moves monotonically forward — never regresses. The ratchet gates (test, type, lint, architecture, API, Playwright, design) block on regression.

## Sprint Contracts

Machine-readable JSON in `sprint-contracts/`. Negotiated before coding: generator proposes, evaluator approves. Immutable after approval.
```

- [ ] **Step 3: Create backend.instructions.md**

Write to `.github/instructions/backend.instructions.md`:

```markdown
---
applyTo: "backend/**/*.py"
---
Use Python 3.12+. Type-annotate all functions with return types.
Use ruff for linting and formatting. Use mypy for type checking.
Prefer Pydantic models for request/response validation.
Use pytest for tests. Target 100% meaningful coverage.
Follow the layered architecture: Types → Config → Repository → Service → API.
Never import from a higher layer.
```

- [ ] **Step 4: Create frontend.instructions.md**

Write to `.github/instructions/frontend.instructions.md`:

```markdown
---
applyTo: "frontend/**/*.{ts,tsx}"
---
Use TypeScript strict mode. Prefer functional components with hooks.
Use Tailwind CSS for styling — no inline styles.
Use Vitest for unit tests, Playwright for E2E.
Use semantic HTML elements and ARIA labels for accessibility.
Color contrast must meet WCAG AA (4.5:1 for normal text).
```

- [ ] **Step 5: Commit**

```bash
git add AGENTS.md .github/copilot-instructions.md .github/instructions/
git commit -m "feat: create AGENTS.md, copilot-instructions.md, and path-specific instructions"
```

---

## Task 10: Migrate Config Files (Architecture, Program, MCP, Templates)

**Files:**
- Source: `.claude/architecture.md`, `.claude/program.md`, `.claude/templates/*`
- Create: `.agents/architecture.md`, `.agents/program.md`, `.agents/mcp-config.json`, `.agents/templates/*`

- [ ] **Step 1: Migrate architecture.md**

Copy `.claude/architecture.md` → `.agents/architecture.md`. Update internal references:
- `.claude/hooks/check-architecture.sh` → `hooks/check-architecture.js`
- Any `.claude/` paths → `.agents/` or `hooks/`

- [ ] **Step 2: Migrate program.md**

Copy `.claude/program.md` → `.agents/program.md`. Update:
- `.claude/state/` → `.agents/state/`
- `.claude/skills/` → `.agents/skills/`
- `settings.json` references → remove or update to reference `.github/hooks/`

- [ ] **Step 3: Create mcp-config.json**

Write to `.agents/mcp-config.json`:

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

- [ ] **Step 4: Migrate all template files**

Copy each template from `.claude/templates/` to `.agents/templates/` with no content changes:
- `sprint-contract.json`
- `features-template.json`
- `features-template.example.json`
- `init-sh.template`
- `docker-compose.template.yml`
- `playwright.config.template.ts`

- [ ] **Step 5: Commit**

```bash
git add .agents/architecture.md .agents/program.md .agents/mcp-config.json .agents/templates/
git commit -m "feat: migrate architecture, program, MCP config, and templates to .agents/"
```

---

## Task 11: Migrate State Files

**Files:**
- Source: `.claude/state/*`
- Create: `.agents/state/*`

- [ ] **Step 1: Copy all state files**

Copy from `.claude/state/` to `.agents/state/`:
- `iteration-log.md` (durable)
- `learned-rules.md` (durable)
- `failures.md` (ephemeral)
- `eval-scores.json` (ephemeral)
- `coverage-baseline.txt` (durable)

Create new: `.agents/state/features.json` with content `[]`

- [ ] **Step 2: Update .gitignore for ephemeral state**

Add to the project `.gitignore`:

```
# Ephemeral state (not committed)
.agents/state/failures.md
.agents/state/eval-scores.json
```

- [ ] **Step 3: Commit**

```bash
git add .agents/state/ .gitignore
git commit -m "feat: migrate state files to .agents/state/ with ephemeral gitignore"
```

---

## Task 12: Update Root .gitignore and Clean Up

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Update .gitignore**

Add Copilot-specific entries and ensure the generated pptx / script are ignored. The `.gitignore` should include:

```
# Generated files
generate_pptx.py
*.pptx

# Python
__pycache__/
*.py[cod]
*.egg-info/
dist/
build/

# Environment
.env
.env.*
!.env.example

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Dependencies
node_modules/
venv/
.venv/

# Ephemeral agent state
.agents/state/failures.md
.agents/state/eval-scores.json
```

- [ ] **Step 2: Verify complete file inventory**

Run:
```bash
echo "=== Agents ===" && ls .github/agents/*.agent.md | wc -l
echo "=== Hooks JSON ===" && ls .github/hooks/*.json | wc -l
echo "=== Hook Scripts ===" && ls hooks/*.js | wc -l
echo "=== Skills ===" && find .agents/skills -name "SKILL.md" | wc -l
echo "=== State ===" && ls .agents/state/ | wc -l
echo "=== Templates ===" && ls .agents/templates/ | wc -l
echo "=== Instructions ===" && ls .github/instructions/*.md | wc -l
echo "=== Root files ===" && ls AGENTS.md .github/copilot-instructions.md .agents/mcp-config.json .agents/architecture.md .agents/program.md
```

Expected:
- Agents: 7
- Hooks JSON: 3
- Hook Scripts: 12
- Skills: 19 (18 original + scaffold)
- State: 6
- Templates: 6
- Instructions: 2
- Root files: all exist

- [ ] **Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: update .gitignore for Copilot migration"
```

---

## Task 13: Final Verification

- [ ] **Step 1: Validate all JSON files**

Run:
```bash
for f in $(find . -name "*.json" -not -path "*/node_modules/*" -not -path "*/.git/*"); do
  echo "=== $f ===" && python3 -m json.tool "$f" > /dev/null && echo "VALID" || echo "INVALID"
done
```

Expected: All files VALID

- [ ] **Step 2: Validate all YAML frontmatter in .agent.md files**

Run:
```bash
for f in .github/agents/*.agent.md; do
  echo "=== $f ==="
  python3 -c "
import sys
content = open('$f').read()
if content.startswith('---'):
    end = content.index('---', 3)
    print('Frontmatter OK (' + str(end) + ' chars)')
else:
    print('ERROR: No frontmatter')
    sys.exit(1)
"
done
```

Expected: All files show "Frontmatter OK"

- [ ] **Step 3: Validate all YAML frontmatter in SKILL.md files**

Run:
```bash
for f in $(find .agents/skills -name "SKILL.md"); do
  echo "=== $f ==="
  python3 -c "
import sys
content = open('$f').read()
if content.startswith('---'):
    end = content.index('---', 3)
    print('Frontmatter OK (' + str(end) + ' chars)')
else:
    print('ERROR: No frontmatter')
    sys.exit(1)
"
done
```

Expected: All files show "Frontmatter OK"

- [ ] **Step 4: Verify no stale .claude/ references in new files**

Run:
```bash
grep -r "\.claude/" .github/ .agents/ hooks/ AGENTS.md --include="*.md" --include="*.js" --include="*.json" | grep -v "\.claude/hooks/" | head -20
```

Expected: No matches (except possibly in historical context within agent prompts that reference "Claude Code" as a product name, not a path)

- [ ] **Step 5: Create final commit**

```bash
git add -A
git status
git commit -m "feat: complete Copilot cloud agent migration — all artifacts generated"
```
