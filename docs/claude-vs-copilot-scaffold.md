---
marp: true
theme: default
paginate: true
title: "Claude Code vs Copilot Cloud Agent — Harness Scaffold Comparison"
---

<!-- Slide 1 -->
# Claude Code vs Copilot Cloud Agent
## Harness Scaffold Comparison

**Two runtimes. One architecture. Same quality guarantees.**

How the same GAN-inspired harness engine runs locally on developer machines
versus autonomously in GitHub's cloud infrastructure.

---

<!-- Slide 2 -->
# The Core Idea

A **harness scaffold** is a pre-configured set of agents, skills, hooks, and
templates that turns an AI coding assistant into an autonomous software factory.

```
  Same Architecture
  =================
  Generator-Evaluator GAN loop
  Karpathy ratcheting (monotonic progress)
  Sprint contracts (negotiated "done" criteria)
  TDD mandatory (80% floor, 100% target)
  12 quality gate hooks
  7 specialized agents
  19 SDLC skills
  Self-healing with learned rules
```

The difference is **where it runs** and **how it's triggered**.

---

<!-- Slide 3 -->
# Two Deployment Models

```
  +---------------------------+          +---------------------------+
  |    CLAUDE CODE SCAFFOLD   |          | COPILOT CLOUD AGENT       |
  |                           |          |   SCAFFOLD                |
  |  Location: .claude/       |          |  Location: .github/       |
  |  Runtime:  Developer's    |          |  Runtime:  GitHub-hosted  |
  |            local machine  |          |            cloud VM       |
  |  Trigger:  CLI command    |          |  Trigger:  GitHub Issue   |
  |            (interactive)  |          |            assignment     |
  |  Session:  Terminal/IDE   |          |  Session:  Autonomous     |
  |            with human     |          |            (no human in   |
  |            in the loop    |          |            the loop)      |
  +---------------------------+          +---------------------------+
```

---

<!-- Slide 4 -->
# Claude Code Scaffold — How It Works

```
  DEVELOPER MACHINE
  =================

  Terminal / IDE
  +--------------------------------------------------+
  |                                                    |
  |  $ claude --plugin-dir ~/harness/.claude           |
  |                                                    |
  |  > /scaffold    (interactive — asks questions)     |
  |  > /brd         (socratic interview with human)    |
  |  > /spec        (human approves stories)           |
  |  > /design      (human approves architecture)      |
  |  > /auto        (autonomous loop begins)           |
  |                                                    |
  |  Human reviews each phase gate (1-3)               |
  |  then /auto runs phases 4-8 autonomously           |
  |                                                    |
  |  Edit program.md mid-flight to steer the build     |
  |                                                    |
  +--------------------------------------------------+
           |              |              |
           v              v              v
      Local files    Local Docker    Local browser
      (read/write)   (for eval)      (Playwright)
```

**Key trait:** Human is present. Can approve plans, steer mid-build, and intervene.

---

<!-- Slide 5 -->
# Copilot Cloud Agent Scaffold — How It Works

```
  GITHUB CLOUD INFRASTRUCTURE
  ============================

  GitHub Issue                    GitHub-hosted VM (Ubuntu)
  +------------------+           +----------------------------------+
  |                  |           |                                    |
  | Title: "Build    |  assign   |  1. Clones repo                   |
  |  auth system"    |  to       |  2. Reads .github/ configs        |
  |                  |---------->|  3. Reads copilot-instructions.md  |
  | Assignee:        |  triggers |  4. Loads agents, skills, hooks    |
  |  @copilot        |  agent    |  5. Runs the harness pipeline     |
  |                  |           |  6. Creates branch                 |
  +------------------+           |  7. Implements code + tests        |
                                 |  8. Runs quality gates             |
                                 |  9. Opens Pull Request             |
                                 | 10. VM destroyed                   |
                                 |                                    |
                                 +----------------------------------+
```

**Key trait:** Fully autonomous. No human in the loop during execution.
Human reviews the output PR after the agent completes.

---

<!-- Slide 6 -->
# Runtime Environment Comparison

```
  +---------------------+----------------------------+----------------------------+
  |                     |  CLAUDE CODE               |  COPILOT CLOUD AGENT       |
  +---------------------+----------------------------+----------------------------+
  | Runtime             | Developer's macOS/Linux    | GitHub-hosted Ubuntu VM    |
  |                     | machine                    | (Codespace-like)           |
  +---------------------+----------------------------+----------------------------+
  | Trigger             | CLI: claude /build         | Issue assigned to @copilot |
  +---------------------+----------------------------+----------------------------+
  | Human presence      | In the loop (approves      | Out of the loop (reviews   |
  |                     | phases 1-3, steers /auto)  | PR after completion)       |
  +---------------------+----------------------------+----------------------------+
  | Session lifetime    | Hours (interactive,        | Minutes-hours (autonomous, |
  |                     | multi-context-window       | single session, VM dies    |
  |                     | with session chaining)     | after PR is opened)        |
  +---------------------+----------------------------+----------------------------+
  | Network             | Developer's network        | GitHub's network           |
  |                     | (full access)              | (outbound internet)        |
  +---------------------+----------------------------+----------------------------+
  | Persistence         | Local filesystem           | Git commits only           |
  |                     | (state files persist)      | (VM is ephemeral)          |
  +---------------------+----------------------------+----------------------------+
  | Cost model          | Anthropic API usage        | GitHub Copilot             |
  |                     | ($5-300 per build)         | Enterprise/Business plan   |
  +---------------------+----------------------------+----------------------------+
```

---

<!-- Slide 7 -->
# Configuration — Side by Side

```
  .claude/                              .github/
  ========                              ========

  settings.json                         copilot-instructions.md
  (permissions, hooks, plugins)         (global rules + quality overview)
                                        hooks/pipeline-gates.json
                                        hooks/quality-gates.json
                                        hooks/security-gates.json

  agents/planner.md                     agents/planner.agent.md
  agents/generator.md                   agents/generator.agent.md
  agents/evaluator.md                   agents/evaluator.agent.md
  ...                                   ...

  skills/auto/SKILL.md                  skills/auto/SKILL.md
  skills/build/SKILL.md                 skills/build/SKILL.md
  ...                                   ...

  hooks/lint-on-save.js                 hooks/scripts/lint-on-save.js
  hooks/detect-secrets.js               hooks/scripts/detect-secrets.js
  ...                                   ... (+ normalizeInput adapter)

  commands/scaffold.md                  skills/scaffold/SKILL.md

  .claude-plugin/plugin.json            (not needed — convention-based)
  (N/A)                                 instructions/backend.instructions.md
  (N/A)                                 instructions/frontend.instructions.md
  (N/A)                                 mcp-config.json
```

---

<!-- Slide 8 -->
# What's Different in Each Scaffold

## Claude Code Only (.claude/)

| Feature | Why |
|---------|-----|
| `settings.json` | Claude Code's unified config format (hooks, permissions, plugins) |
| `.claude-plugin/plugin.json` | Plugin manifest for Claude Code's plugin registry |
| `commands/` directory | Claude Code's command routing mechanism |
| `settings.local.json` | Local environment overrides (gitignored) |
| Plugin references (superpowers, code-review, etc.) | Claude Code official plugin ecosystem |
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` env var | Feature flag for agent teams |

## Copilot Cloud Agent Only (.github/)

| Feature | Why |
|---------|-----|
| `copilot-instructions.md` | Copilot's global instruction file (read on every session) |
| `instructions/*.instructions.md` | File-glob-scoped rules (e.g., `backend/**/*.py`) |
| `mcp-config.json` | MCP server definitions (context7 for docs lookup) |
| `hooks/*.json` gate files | Copilot's hook configuration format (3 separate files) |
| `normalizeInput()` adapter in hooks | Handles camelCase vs snake_case input differences |
| `agents/*.agent.md` naming | Copilot's agent file naming convention |

---

<!-- Slide 9 -->
# Hook System — Key Difference

## Claude Code: Unified `settings.json`

```json
{
  "hooks": {
    "PostToolUse": [
      { "matcher": "Edit|Write",
        "hooks": [
          { "command": "node .claude/hooks/lint-on-save.js",
            "timeout": 15000 }
        ] }
    ],
    "TeammateIdle": [ ... ],
    "TaskCompleted": [ ... ]
  }
}
```

## Copilot: Separate Gate Files + Adapter

```json
// quality-gates.json
{
  "hooks": [
    { "event": "postToolUse",
      "tools": ["edit"],
      "command": { "bash": "node .github/hooks/scripts/lint-on-save.js",
                   "timeoutSec": 30 } }
  ]
}
```

Hook scripts in `.github/` include a `normalizeInput()` adapter because
Copilot may send `toolInput`/`filePath` (camelCase) instead of
`tool_input`/`file_path` (snake_case).

---

<!-- Slide 10 -->
# Agent Definitions — Key Difference

## Claude Code: `agents/planner.md`

```yaml
---
name: planner
description: Expands user prompts into BRD...
tools:
  - Read     # Claude Code tool names
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---
```

## Copilot: `agents/planner.agent.md`

```yaml
---
name: planner
description: Expands user prompts into BRD...
tools:
  - read     # Copilot tool names
  - edit
  - search
  - execute
  - agent
  - github/*
mcp-servers:
  context7:  # Inline MCP config
    command: npx
    args: ["-y", "@context7/mcp-server"]
---
```

Different tool names, different file suffix, inline MCP config.

---

<!-- Slide 11 -->
# Terminology Mapping

```
  Claude Code                        Copilot Cloud Agent
  ==========                         ===================

  Agent teams                        Custom agents
  Spawn agents                       Invoke custom agents
  Teammates                          Sub-agents
  PostToolUse hook                    postToolUse event
  TaskCompleted hook                  sessionEnd event
  TeammateIdle hook                   teammateIdle event
  Bash tool                          execute tool
  Read/Write/Edit tools              read/edit tools
  Glob/Grep tools                    search tool
  settings.json                      copilot-instructions.md + gate JSONs
  CLAUDE.md                          AGENTS.md
  /command                           Skill invocation
  Plugin                             (convention-based discovery)
```

---

<!-- Slide 12 -->
# Shared Components (Identical in Both)

These files are **platform-agnostic** and identical across both scaffolds:

| Component | Files |
|-----------|-------|
| **Templates** | `docker-compose.template.yml`, `sprint-contract.json`, `playwright.config.template.ts`, `features-template.json`, `init-sh.template` |
| **State files** | `coverage-baseline.txt`, `eval-scores.json`, `failures.md`, `iteration-log.md`, `learned-rules.md` |
| **Architecture** | `architecture.md` (layered dependency rules) |
| **Program** | `program.md` (Karpathy human-agent bridge) |
| **Skill content** | All 19 SKILL.md files (logic is identical, only path references differ) |
| **Reference docs** | `api-integration-patterns.md`, `playwright-patterns.md`, `scoring-rubric.md`, `scoring-examples.md`, `contract-schema.json`, `test-data.md` |

---

<!-- Slide 13 -->
# When to Use Which

```
  +-------------------------------------------+-------------------------------------------+
  |  USE CLAUDE CODE SCAFFOLD WHEN:           |  USE COPILOT CLOUD AGENT WHEN:            |
  +-------------------------------------------+-------------------------------------------+
  |                                           |                                           |
  |  - You want human-in-the-loop control     |  - You want fully autonomous execution    |
  |  - You need to steer the build mid-flight |  - You trigger work via GitHub Issues      |
  |  - You're prototyping or exploring        |  - You want PR-based review workflow       |
  |  - You need multi-session chaining        |  - Your team uses GitHub-centric flow      |
  |  - You prefer terminal/IDE interaction    |  - You want zero local compute cost        |
  |  - You need access to local services      |  - You want parallel issue processing      |
  |    (databases, APIs, hardware)            |    (multiple issues = multiple VMs)        |
  |  - You want the Superpowers plugin        |  - You want file-scoped instructions       |
  |    ecosystem (brainstorming, debugging)   |    (per-glob rules for backend/frontend)   |
  |                                           |                                           |
  +-------------------------------------------+-------------------------------------------+
```

---

<!-- Slide 14 -->
# Deployment Flow — Copilot Cloud Agent

```
  Step 1                Step 2                Step 3               Step 4
  ------                ------                ------               ------

  Copy .github/         Push to GitHub        Enable agent         Assign issue
  into your repo                              in repo settings     to @copilot

  cp -r harness/        git add .github/      Repo Settings        gh issue create \
   .github/ \           git commit -m "feat:    -> Copilot           --title "..." \
   your-repo/.github/     add harness"           -> Enable            --assignee
                        git push                  coding agent         @copilot


                                    THE AGENT:
                                    ==========
                              1. Clones your repo
                              2. Reads .github/ configs
                              3. Runs the harness pipeline
                              4. Creates a branch
                              5. Writes code + tests
                              6. Runs all 12 quality gates
                              7. Opens a Pull Request
                              8. VM is destroyed


                                    YOU:
                                    ====
                              1. Review the PR
                              2. Run CI checks
                              3. Merge or request changes
```

---

<!-- Slide 15 -->
# The GAN Loop — Same in Both

```
                    +------------------+
                    |  Pick next group |
                    |  from dependency |
                    |  graph           |
                    +--------+---------+
                             |
                             v
                    +------------------+
                    |  Negotiate       |
                    |  Sprint Contract |
                    |  (Generator <->  |
                    |   Evaluator)     |
                    +--------+---------+
                             |
                             v
                    +------------------+
                    |  Generator       |
                    |  spawns agent    |
                    |  team (TDD,     |
                    |  phased DAG)    |
                    +--------+---------+
                             |
                             v
                    +------------------+
                    |  Evaluator       |
                    |  scores (API +   |
              +---->|  Playwright +    |
              |     |  Vision)         |
              |     +--------+---------+
              |              |
              |       PASS --+-- FAIL
              |       |           |
              |       v           v
              |   Commit &    Self-heal
              |   next group  (max 3x)
              |                   |
              |             Still fails?
              |                   |
              |                   v
              |             Revert + learn
              +------------ + escalate
```

This loop is **identical** in both scaffolds.
The only difference is where the compute runs.

---

<!-- Slide 16 -->
# Summary

| Dimension | Claude Code | Copilot Cloud Agent |
|-----------|-------------|---------------------|
| **Config dir** | `.claude/` | `.github/` |
| **Runtime** | Local machine | GitHub cloud VM |
| **Trigger** | CLI commands | Issue assignment |
| **Human role** | In the loop | Reviews PR after |
| **Session** | Multi-window chaining | Single autonomous run |
| **State** | Local filesystem | Git commits |
| **Hooks** | `settings.json` (unified) | 3 gate JSON files |
| **Hook scripts** | Direct execution | + normalizeInput adapter |
| **Agents** | `*.md` | `*.agent.md` |
| **Tools** | Read/Write/Edit/Glob/Grep/Bash | read/edit/search/execute |
| **Plugins** | 8 official plugins | MCP servers + conventions |
| **Instructions** | Embedded in skills | File-scoped `.instructions.md` |
| **Cost** | Anthropic API tokens | GitHub Copilot plan |

**Same architecture. Same quality. Different runtime.**

---

<!-- Slide 17 -->
# Questions?

**Repository:** github.com/cwijayasundara/copilot_harness_eng_v1

**References:**
- [Anthropic: Harness Design](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- [OpenAI: Harness Engineering](https://openai.com/index/harness-engineering/)
- [GitHub Copilot Coding Agent](https://docs.github.com/en/copilot/using-github-copilot/using-the-copilot-coding-agent)
