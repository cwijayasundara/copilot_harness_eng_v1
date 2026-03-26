# Claude Harness Engine v1 — Architecture Reference

Quick reference for architecture, agents, hooks, state, and sprint contracts.
Copied into target projects by `/scaffold`.

---

## System Architecture

```
+---------------------------------------------------------------------+
|                        HUMAN INTERFACE                               |
|                                                                      |
|  program.md           CLAUDE.md            project-manifest.json    |
|  (Karpathy bridge)    (harness rules)      (stack + eval config)    |
+--------+------------------+--------------------+--------------------+
         |                  |                    |
         v                  v                    v
+---------------------------------------------------------------------+
|                      ORCHESTRATION LAYER                             |
|                                                                      |
|  /build --> /brd -> /spec -> /design -> /implement -> /evaluate     |
|                                              |              |       |
|                                              v              v       |
|                                         /auto (Karpathy ratchet)    |
|                                              |                      |
|                                  +--------+--+--------+             |
|                                  v        v           v             |
|                             Generator  Evaluator  Design-Critic     |
|                                  |        |           |             |
|                             Agent Teams  Playwright  Vision Score   |
+--------+------------------+--------------------+--------------------+
         |                  |                    |
         v                  v                    v
+---------------------------------------------------------------------+
|                     AGENT LAYER (7 agents)                          |
|  planner / generator / evaluator / design-critic /                  |
|  security-reviewer / ui-designer / test-engineer                    |
+--------+------------------+--------------------+--------------------+
         |                  |                    |
         v                  v                    v
+---------------------------------------------------------------------+
|                   ENFORCEMENT LAYER (12 hooks)                      |
|  Security: scope-directory | protect-env | detect-secrets           |
|  Quality:  lint-on-save | typecheck | check-function-length         |
|            check-file-length                                        |
|  Gates:    pre-commit-gate | sprint-contract-gate                   |
|  Teams:    teammate-idle-check                                      |
|  Info:     task-completed                                           |
+--------+------------------+--------------------+--------------------+
         |                  |                    |
         v                  v                    v
+---------------------------------------------------------------------+
|                       STATE LAYER                                   |
|  program.md | iteration-log.md | learned-rules.md | failures.md    |
|  coverage-baseline | features.json | claude-progress.txt           |
|  sprint-contracts/ | eval-scores.json                              |
+---------------------------------------------------------------------+
```

---

## Karpathy Ratchet Loop

```
Start /auto
    |
    v
Read program.md + learned-rules.md + claude-progress.txt + features.json
    |
    v
Pick next unfinished group from dependency graph
    |
    v
Negotiate sprint contract (Generator proposes → Evaluator finalises)
    |
    v
Spawn agent team (1 teammate per story, file ownership from component-map.md)
    |
    v
Ratchet Gate ──────────────────────────────────────────────────────────┐
    Gate 1: Unit tests pass (pytest / vitest)                          |
    Gate 2: Lint + types clean (ruff / mypy / tsc)                     |
    Gate 3: Coverage >= baseline                                       |
    Gate 4: Architecture alignment (files exist, schemas match)        |
    Gate 5: Evaluator verdict (API + Playwright vs running Docker)     |
    Gate 6: Design critic score >= threshold (frontend groups only)    |
    |                                                                  |
   PASS                                                              FAIL
    |                                                                  |
    v                                                      Self-heal loop (max 3)
git commit, update features.json +                                     |
claude-progress.txt + iteration-log.md                      Diagnose → Targeted fix
    |                                                       → Re-run gate
    v                                                                  |
Next group ←───────────────────────────────────────── 3rd fail: revert + learn rule
    |
    v
All groups done → docker compose down -v → DONE
```

---

## Agent Roles

| Agent | Role | Tools | Spawned By |
|-------|------|-------|------------|
| planner | BRD, specs, architecture, feature list, schemas | Read, Write, Glob, Grep, Bash | `/brd`, `/spec`, `/design`, `/build` |
| generator | Code + tests, spawns agent teams, proposes sprint contracts | Read, Write, Edit, Glob, Grep, Bash, Agent | `/implement`, `/auto` |
| evaluator | Runs app, verifies sprint contracts (API + Playwright + vision) | Read, Write, Glob, Grep, Bash, Playwright MCP | `/evaluate`, `/auto` |
| design-critic | GAN scoring of UI screenshots (4 criteria, max 5 iterations) | Read, Write, Bash, Playwright MCP | `/auto` (frontend groups) |
| security-reviewer | OWASP vulnerability scan (injection, auth, secrets, SSRF) | Read, Write, Grep, Glob, Bash | `/review`, `/auto` |
| ui-designer | React+Tailwind mockups from stories and API contracts | Read, Write, Glob, Grep, Bash | `/design` |
| test-engineer | Test plan, Playwright E2E test files, data fixtures | Read, Write, Edit, Glob, Grep, Bash | `/test` |

---

## Hook Execution Order

| Hook | Trigger | Behavior |
|------|---------|----------|
| `scope-directory.js` | PostToolUse: Edit/Write | Block — writes outside project directory |
| `protect-env.js` | PostToolUse: Edit/Write | Block — .env file modifications |
| `detect-secrets.js` | PostToolUse: Edit/Write | Block — API keys, tokens, PII in code |
| `lint-on-save.js` | PostToolUse: Edit/Write | Warn/auto-fix — reads manifest for tool (ruff/eslint) |
| `typecheck.js` | PostToolUse: Edit/Write | Warn — reads manifest (mypy/tsc) |
| `check-architecture.js` | PostToolUse: Edit/Write | Block — upward layer imports |
| `check-function-length.js` | PostToolUse: Edit/Write | Warn — functions over 50 lines |
| `check-file-length.js` | PostToolUse: Edit/Write | Warn at 200 lines, Block at 300 lines |
| `pre-commit-gate.js` | PostToolUse: Bash | Block — full architecture scan before commit |
| `sprint-contract-gate.js` | PostToolUse: Bash | Block — commit if sprint contract verdict != PASS |
| `teammate-idle-check.js` | TeammateIdle | Block — teammate goes idle without tests |
| `task-completed.js` | TaskCompleted | Info — architecture scan + /review reminder |

---

## State Files

| File | Growth Pattern | Purpose |
|------|---------------|---------|
| `program.md` | Edited per session | Karpathy human-agent bridge; edit to steer `/auto` |
| `.claude/state/iteration-log.md` | Append-only | Full history of iterations, verdicts, commits |
| `.claude/state/learned-rules.md` | Monotonic (never deleted) | Defensive rules extracted from past failures |
| `.claude/state/failures.md` | Append-only | Raw failure data for pattern extraction |
| `.claude/state/coverage-baseline.txt` | Ratcheted upward only | Coverage threshold; never drops |
| `features.json` | Updated per evaluation | 200+ features with steps and pass/fail state |
| `claude-progress.txt` | Appended per session | Session chaining context for context-window recovery |
| `sprint-contracts/{group}.json` | One file per group | Negotiated done criteria; immutable after negotiation |
| `.claude/state/eval-scores.json` | Appended per design critique | Design critic scores over time |

---

## Sprint Contract Format

```json
{
  "group": "C",
  "stories": ["E3-S1", "E3-S2", "E3-S3"],
  "contract": {
    "api_checks": [
      {
        "method": "POST",
        "path": "/documents/upload",
        "setup": "upload test file as multipart",
        "expect": { "status": 201, "body_contains": ["document_id"] },
        "schema_ref": "#/paths/~1documents~1upload/post/response/201"
      }
    ],
    "playwright_checks": [
      {
        "description": "Upload a document end-to-end",
        "steps": [
          "Navigate to /upload",
          "Upload file via file input",
          "Click submit button",
          "Wait for success feedback",
          "Verify document appears in list"
        ]
      }
    ],
    "design_checks": {
      "pages": ["/upload", "/documents/{id}"],
      "min_score": 7,
      "criteria": ["design_quality", "originality", "craft", "functionality"]
    },
    "architecture_checks": {
      "files_must_exist": [
        "backend/src/api/upload_router.py",
        "backend/src/service/upload_service.py",
        "frontend/src/components/upload/UploadPage.tsx"
      ],
      "schema_validation": true
    }
  }
}
```

Negotiation: Generator proposes → Evaluator has final say → Contract is immutable.
All three check categories (api, playwright, architecture) must pass for PASS verdict.
Design checks apply to frontend groups only.

---

## Quality Principles

1. **Small modules** — One file = one responsibility. Warn at 200 lines, block at 300.
2. **Static typing** — Type-annotate everything. Zero `any` in TypeScript.
3. **Functions under 50 lines** — Decompose into named subfunctions.
4. **Explicit error handling** — Typed error classes, no bare exceptions.
5. **No dead code** — Every line traces to a story.
6. **Self-documenting** — Good names over comments, types as documentation.
