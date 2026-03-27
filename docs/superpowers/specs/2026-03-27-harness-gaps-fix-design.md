# Harness Gaps Fix — Design Spec

Addresses 5 gaps identified in the harness evaluation. All changes are generic (no vendor-specific patterns). All generated code patterns enforce production-readiness: structured logging, typed exceptions, retry policies, and observability.

---

## 1. Verification Modes (Docker Dependency Fix)

### Problem

The evaluator assumes Docker Compose is running. Projects using serverless, managed services, or local dev servers cannot use the evaluation layer.

### Solution

Add `verification` config to `project-manifest.json` with 3 modes.

### Manifest Schema

```json
{
  "verification": {
    "mode": "docker | local | stub",
    "health_check": {
      "url": "http://localhost:3000/health",
      "retries": 5,
      "backoff_seconds": 2
    },
    "docker": {
      "compose_file": "docker-compose.yml",
      "services": ["backend", "frontend", "db"]
    },
    "local": {
      "backend_url": "http://localhost:8000",
      "frontend_url": "http://localhost:3000",
      "start_commands": ["npm run dev", "uvicorn main:app"]
    },
    "stub": {
      "schema_source": "specs/design/api-contracts.schema.json",
      "auto_generate_mock_server": true
    }
  }
}
```

### Mode Behavior

| Mode | Startup | Layer 1 (API) | Layer 2 (Playwright) | Error Context |
|------|---------|--------------|---------------------|---------------|
| `docker` | `docker compose up -d` + health-check retry | Curl against container ports | Playwright against frontend container | `docker compose logs --tail=50` |
| `local` | Run `start_commands` as background processes + health-check retry | Curl against configured URLs | Playwright against `frontend_url` | Capture stdout/stderr from start_commands |
| `stub` | Auto-generate a lightweight mock server (FastAPI or Express, generated at runtime from `api-contracts.schema.json` by the generator) that returns schema-valid example responses | Curl against stub server | Playwright against real frontend if available, skip if not | Stub mismatch reports (expected vs. actual request shape) |

### Health-Check Retry Loop

Before any Layer 1/2 check, evaluator runs:

```
for attempt in 1..retries:
    response = GET health_check.url
    if response.status == 200: break
    wait backoff_seconds * (2 ^ (attempt - 1))
else:
    FAIL with "App not reachable after {retries} attempts"
```

### Files Changed

| File | Change |
|------|--------|
| `evaluator.md` | Read `verification.mode` at start. Health-check retry before checks. Mode-aware error context (Docker logs vs. process stderr vs. stub mismatch). |
| `auto/SKILL.md` | Section 7 renamed to "App Lifecycle Management." Mode-aware startup/teardown. Health-check before evaluator handoff. |
| `project-manifest.json` (template) | Add `verification` block with `docker` as default. |

---

## 2. Design-Critic Calibration

### Problem

Scoring weights, threshold, max iterations, and pivot heuristic are hardcoded. No reference examples for consistent scoring. No per-project tuning.

### Solution

New `calibration-profile.json` with tunable parameters, presets, and plateau detection. New scoring examples reference doc.

### Calibration Profile Schema

```json
{
  "scoring": {
    "weights": {
      "design_quality": 1.5,
      "originality": 1.5,
      "craft": 0.75,
      "functionality": 0.75
    },
    "threshold": 7,
    "per_criterion_minimum": 5
  },
  "iteration": {
    "max_iterations": 10,
    "plateau_window": 3,
    "plateau_delta": 0.3,
    "pivot_after_plateau": true
  },
  "presets": {
    "internal_tool": {
      "weights": { "design_quality": 0.75, "originality": 0.5, "craft": 0.5, "functionality": 1.5 },
      "threshold": 6,
      "max_iterations": 5
    },
    "consumer_app": {
      "weights": { "design_quality": 1.5, "originality": 1.5, "craft": 1.5, "functionality": 1.0 },
      "threshold": 8,
      "max_iterations": 10
    }
  }
}
```

### Plateau Detection

Track the last `plateau_window` (default 3) weighted scores. If `max - min < plateau_delta` (default 0.3), scores have plateaued. If `pivot_after_plateau: true`, force a design pivot. Otherwise, log warning and continue.

### Per-Criterion Minimum

If any single criterion scores below `per_criterion_minimum` (default 5), the page fails regardless of weighted average. Prevents one strong score from masking a critical weakness.

### Scoring Examples

New file `.claude/skills/evaluation/references/scoring-examples.md`:

| Score | Characteristics |
|-------|----------------|
| **5 (Below threshold)** | Default framework appearance. Stock colors, no spacing refinement, generic icons. Functional but indistinguishable from starter templates. |
| **7 (Threshold pass)** | Cohesive color palette, intentional spacing hierarchy, custom component styling. Looks designed, not assembled. |
| **9 (Excellent)** | Distinctive visual identity, thoughtful micro-interactions, considered typography pairing, consistent visual language across all pages. |

Design-critic reads these before every scoring round as calibration anchors.

### Files Changed

| File | Change |
|------|--------|
| `design-critic.md` | Read `calibration-profile.json` at start (fall back to hardcoded defaults if missing). Apply per-criterion minimum. Replace fixed pivot logic with plateau detection. Read scoring-examples.md before scoring. |
| `auto/SKILL.md` | Section 9 reads `iteration.max_iterations` from calibration profile. |
| New: `calibration-profile.json` | Template created by `/scaffold`. |
| New: `.claude/skills/evaluation/references/scoring-examples.md` | Three calibration anchors. |

---

## 3. Cross-Cutting Concerns in Agent Teams

### Problem

Strict 1-teammate-per-file ownership breaks when integration features span many files across many teammates. No mechanism for coordinating shared interfaces or sequencing dependent work.

### Solution

Pre-sprint dependency handshake, micro-DAG phased execution, and integrator pattern for shared files.

### Dependency Handshake (New Phase)

After sprint contract negotiation, before teammate execution:

1. Generator reads `component-map.md` for the current group
2. Identifies **shared files** (files appearing in 2+ stories)
3. Identifies **interface boundaries** (where one teammate's output is another's input)
4. Builds a **micro-DAG** of teammate execution phases

### Micro-DAG Phased Execution

Instead of all teammates starting in parallel:

- **Phase 1:** Teammates with no upstream dependencies. They implement code AND define typed interface contracts (Pydantic model / TypeScript interface) for their output.
- **Phase 2:** Downstream teammates start once upstream interface contracts are committed. They code against the contract type, not the implementation.
- **Phase 3:** Integration wiring (if needed) — a designated teammate connects the pieces.

Within each phase, teammates still run in parallel. Only cross-phase dependencies are sequential.

### Integrator Pattern for Shared Files

For files that need multi-teammate edits (e.g., shared `types.py`, route registrations):

- Generator designates one teammate as "integrator" for each shared file
- Other teammates declare what they need (e.g., "I need a `CitationSource` type")
- Integrator writes all additions to the shared file
- No merge conflicts: one writer, many readers

### Enhanced Component Map Format

```markdown
## Story E1-S1: File Upload
| File | Owner |
|------|-------|
| backend/src/service/upload_service.py | teammate-upload |

**Produces:** UploadResult {document_id: str, status: str}

## Story E1-S2: Processing Pipeline
| File | Owner |
|------|-------|
| backend/src/service/process_service.py | teammate-process |

**Consumes:** UploadResult
**Produces:** ProcessedDocument {document_id: str, fields: list}

## Shared Files
| File | Integrator | Contributors |
|------|-----------|-------------|
| backend/src/types.py | teammate-upload | teammate-process, teammate-ui |
```

### Files Changed

| File | Change |
|------|--------|
| `generator.md` | Add "Dependency Handshake" phase. Build micro-DAG. Execute teammates in phases. Designate integrator for shared files. |
| `auto/SKILL.md` | Section 4 becomes phase-aware. Log micro-DAG to `iteration-log.md`. |
| `code-gen/SKILL.md` | New rule: "When your story produces output consumed by another, define the typed interface contract FIRST." |

---

## 4. LLM Response Parsing Brittleness

### Problem

Two sub-problems: (a) the harness passes prose failure reports to the generator during self-healing, leading to imprecise fixes, and (b) generated application code that calls LLMs uses fragile free-text parsing.

### Sub-Problem A: Structured Failure Reports

Replace prose failure reports with structured JSON in the self-healing loop.

### Failure Report Schema

```json
{
  "failure": {
    "layer": "api | playwright | design | docker | lint | type | test | coverage",
    "gate": "evaluator | ratchet",
    "check": "POST /documents/upload -> 201",
    "actual": {
      "status": 500,
      "body": "{\"detail\": \"KeyError: 'file_extension'\"}"
    },
    "stack_trace": "upload_service.py:45 in handle_upload\n  ext = payload['file_extension']",
    "error_type": "key_error | type_error | import_error | timeout | connection_refused | validation_error | assertion_error",
    "files_likely_involved": ["backend/src/service/upload_service.py"],
    "prior_attempts": [
      {
        "attempt": 1,
        "fix_applied": "Added default value for file_extension",
        "result": "Same error - default not reached because payload is FormData, not dict"
      }
    ]
  }
}
```

`prior_attempts` accumulates across the 3-attempt self-healing loop. Attempt 3 sees what attempts 1 and 2 tried and why they failed.

### Sub-Problem B: Generated Code LLM Integration Rules

New section in `code-gen/SKILL.md` — "LLM Integration":

**Rule 1: Always use structured output.** Use `tool_use` / `function_calling` / `response_format: json_schema` when calling any LLM. Never parse free-text responses with regex or string splitting.

**Rule 2: Define a response schema.** Every LLM call must have a typed model for the expected response:

```python
class ClassificationResult(BaseModel):
    category: str
    confidence: Literal["high", "medium", "low"]
    reasoning: str
```

**Rule 3: Validate before using.** Parse LLM response through the schema. If validation fails, retry once with an explicit correction prompt. If second attempt fails, raise a typed error.

**Rule 4: No silent fallbacks.** Never `except Exception: return default_value`. Failed LLM calls raise a typed `LLMResponseError`. The caller decides how to handle it — log, retry, escalate. Silent fallbacks hide bugs that compound across the pipeline.

**Rule 5: Log raw responses.** Always log the raw LLM response at DEBUG level before parsing. When debugging, the raw response is the ground truth.

```python
logger.debug("LLM raw response", extra={
    "provider": self._provider_name,
    "model": self._model,
    "prompt_tokens": response.usage.input_tokens,
    "completion_tokens": response.usage.output_tokens,
    "raw_content": response.content,
    "latency_ms": elapsed_ms,
})
```

### Files Changed

| File | Change |
|------|--------|
| `evaluator.md` | Write structured failure JSON alongside prose report. Classify `error_type` from exception. Include `files_likely_involved` from stack trace. |
| `auto/SKILL.md` | Self-healing (section 6) passes structured JSON to generator. Accumulate `prior_attempts`. |
| `code-gen/SKILL.md` | New "LLM Integration" section with the 5 rules. Add to Gotchas: "Free-text LLM parsing" and "Silent fallback on LLM error." |
| Learned rules system | New `output_format` category. Rules include expected schema. |

---

## 5. External API Integration Pattern

### Problem

No guidance for wrapping third-party APIs. Each project reinvents retry logic, error handling, async bridging, and test mocking. Generated code lacks production-readiness (no logging, no observability, no circuit breaking).

### Solution

Mandatory service wrapper pattern, typed error taxonomy, configurable retry, record-replay test fixtures, and production-grade observability. All patterns are generic — no vendor-specific code.

### 5.1 Service Wrapper Pattern (Mandatory)

Every external API gets a dedicated wrapper class. No direct SDK or HTTP calls from business logic.

```
Business Logic (process_service.py)
    |  calls
API Wrapper (external_client.py)    <-- only file that imports SDK / makes HTTP calls
    |  calls
External API
```

Rules:
- One wrapper per external API
- Wrapper is the only file that imports the SDK or makes HTTP calls to that service
- Wrapper exposes typed inputs/outputs using project-internal models, not SDK models
- Business logic never sees SDK types — it sees your domain types
- This is the mock boundary in tests

### 5.2 Production-Grade Wrapper Template

Every wrapper must include:

```python
import logging
import time
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)

class ExternalApiClient:
    """Wrapper for [ServiceName] API."""

    def __init__(self, config: ApiConfig):
        self._config = config
        self._client = self._build_client(config)

    async def operation(self, request: OperationRequest) -> OperationResponse:
        """Execute operation with retry, logging, and error classification."""
        start = time.monotonic()
        attempt = 0

        while attempt < self._config.retry.max_attempts:
            attempt += 1
            try:
                logger.info(
                    "API request started",
                    extra={
                        "service": self._service_name,
                        "operation": "operation",
                        "attempt": attempt,
                    },
                )

                raw = await self._execute(request)

                elapsed_ms = (time.monotonic() - start) * 1000
                logger.info(
                    "API request completed",
                    extra={
                        "service": self._service_name,
                        "operation": "operation",
                        "attempt": attempt,
                        "latency_ms": round(elapsed_ms, 2),
                        "status": "success",
                    },
                )

                return OperationResponse.from_raw(raw)

            except ApiTransientError as e:
                elapsed_ms = (time.monotonic() - start) * 1000
                logger.warning(
                    "API transient error, retrying",
                    extra={
                        "service": self._service_name,
                        "operation": "operation",
                        "attempt": attempt,
                        "error": str(e),
                        "latency_ms": round(elapsed_ms, 2),
                    },
                )
                if attempt == self._config.retry.max_attempts:
                    raise
                backoff = self._config.retry.backoff_base * (
                    self._config.retry.backoff_multiplier ** (attempt - 1)
                )
                await asyncio.sleep(backoff)

            except ApiPermanentError:
                elapsed_ms = (time.monotonic() - start) * 1000
                logger.error(
                    "API permanent error",
                    extra={
                        "service": self._service_name,
                        "operation": "operation",
                        "attempt": attempt,
                        "latency_ms": round(elapsed_ms, 2),
                    },
                )
                raise
```

### 5.3 Error Taxonomy

Every wrapper classifies errors into 3 typed categories:

```python
class ApiTransientError(Exception):
    """Retryable: 429, 502, 503, timeout, connection reset."""
    pass

class ApiPermanentError(Exception):
    """Not retryable: 400, 401, 403, 404, schema mismatch."""
    pass

class ApiRateLimitError(ApiTransientError):
    """Rate limited with backoff hint."""
    def __init__(self, message: str, retry_after: float | None = None):
        super().__init__(message)
        self.retry_after = retry_after
```

Rules:
- Business logic catches `ApiTransientError` to decide on retry/degrade, `ApiPermanentError` to fail fast
- No bare `except Exception` in any API-calling code
- `ApiRateLimitError` respects `Retry-After` header when present
- All exceptions carry the original HTTP status code and response body for debugging

### 5.4 Async Bridging for Sync SDKs

When an external SDK is synchronous but the backend is async:

```python
async def _execute(self, request: OperationRequest) -> RawResponse:
    # SDK is sync-only; bridged via asyncio.to_thread
    return await asyncio.to_thread(
        self._client.operation,
        **request.to_sdk_params(),
    )
```

Rules:
- `asyncio.to_thread()` wrapping happens only inside the wrapper, never in business logic
- If an async SDK or HTTP client exists, prefer it over sync bridging
- Document the bridging choice in a code comment

### 5.5 Retry Configuration

Standard retry config in `config.yml`, not hardcoded:

```yaml
external_apis:
  service_name:
    base_url: "${SERVICE_URL}"
    timeout_seconds: 30
    retry:
      max_attempts: 3
      backoff_base: 1.0
      backoff_multiplier: 2.0
      retryable_status_codes: [429, 502, 503]
    rate_limit:
      requests_per_minute: 60
      respect_retry_after: true
```

Wrapper reads config at init. Business logic is unaware of retry policy.

### 5.6 Observability Requirements

Every wrapper must log:

| Event | Level | Required Fields |
|-------|-------|----------------|
| Request started | INFO | service, operation, attempt |
| Request completed | INFO | service, operation, attempt, latency_ms, status |
| Transient error | WARNING | service, operation, attempt, error, latency_ms |
| Permanent error | ERROR | service, operation, attempt, error, latency_ms, status_code, response_body |
| Rate limited | WARNING | service, operation, retry_after |
| Raw response (debug) | DEBUG | service, operation, raw_content (truncated to 1000 chars) |

Structured logging via `extra` dict (compatible with JSON log formatters). No f-string log messages with data interpolation.

### 5.7 Test Fixtures with Record-Replay

For integration testing without hitting real APIs:

- **Unit tests:** Mock the wrapper class. Never mock SDK internals.
- **Integration tests:** Wrapper supports a `replay` mode that reads from `tests/fixtures/{service_name}/{operation}.json` instead of calling the API.
- **Fixture generation:** One-time script calls the real API and saves responses to fixtures directory. Committed to repo (secrets excluded).

```python
class ExternalApiClient:
    def __init__(self, config: ApiConfig, replay: bool = False):
        self._replay = replay
        self._fixtures_dir = Path(f"tests/fixtures/{self._service_name}")

    async def _execute(self, request: OperationRequest) -> RawResponse:
        if self._replay:
            fixture_path = self._fixtures_dir / f"{request.operation_name}.json"
            logger.debug("Replaying fixture", extra={"path": str(fixture_path)})
            return json.loads(fixture_path.read_text())
        return await self._call_real_api(request)
```

### 5.8 Secrets Management

- API keys and credentials in `.env` only, loaded via config layer
- Wrapper reads from config object, never from `os.environ` directly
- `.env.example` committed with placeholder values for every required key
- `detect-secrets` hook (already exists) catches hardcoded credentials

### Files Changed

| File | Change |
|------|--------|
| `code-gen/SKILL.md` | New "External API Integration" section summarizing all rules. Points to reference doc for templates. Add to Gotchas: "Direct SDK imports outside wrapper" and "Bare except on API calls" and "Missing structured logging in API wrapper." |
| New: `.claude/skills/code-gen/references/api-integration-patterns.md` | Full reference doc with all templates above. |
| `generator.md` | When a story involves an external API, inject api-integration-patterns reference into teammate prompt. Teammate creates wrapper class first, then business logic. |
| `auto/SKILL.md` | Self-healing error classification adds `api_transient` and `api_permanent` categories. For transient: retry evaluator check. For permanent: route to generator. |

---

## 6. Production-Readiness Standards for Generated Code

Cross-cutting requirements that apply to ALL generated code, not just API wrappers. New section in `code-gen/SKILL.md`.

### 6.1 Structured Logging

All generated services must use structured logging:

```python
import logging
logger = logging.getLogger(__name__)

# Correct: structured extra fields
logger.info("Document processed", extra={
    "document_id": doc.id,
    "processing_time_ms": elapsed_ms,
    "output_size_bytes": len(result),
})

# Wrong: f-string interpolation
logger.info(f"Document {doc.id} processed in {elapsed_ms}ms")
```

Rules:
- Use `logging.getLogger(__name__)` at module level
- Use `extra` dict for structured fields, not string interpolation
- INFO for business events, WARNING for recoverable issues, ERROR for failures requiring attention, DEBUG for troubleshooting data
- Never log secrets, tokens, passwords, or PII
- Log at service boundaries: incoming requests, outgoing API calls, business decisions

### 6.2 Exception Handling

```python
# Correct: typed exceptions with context
class DocumentProcessingError(Exception):
    def __init__(self, document_id: str, stage: str, cause: Exception):
        self.document_id = document_id
        self.stage = stage
        self.cause = cause
        super().__init__(f"Failed at {stage} for document {document_id}: {cause}")

# Wrong: bare except with swallowed error
try:
    result = process(doc)
except Exception:
    result = default_value  # silent failure
```

Rules:
- Define typed exception classes per domain (not per function)
- Every exception carries enough context to debug without looking at the stack trace
- Never catch `Exception` or `BaseException` unless re-raising or logging at a top-level boundary
- No silent fallbacks — if an operation fails, the caller must know
- API boundaries (routes) catch domain exceptions and map to HTTP status codes with structured error responses

### 6.3 Structured Error Responses

All API error responses follow a consistent envelope:

```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Document with ID abc123 does not exist",
    "details": {}
  }
}
```

Rules:
- `code` is a machine-readable string enum (UPPER_SNAKE_CASE)
- `message` is human-readable
- `details` is optional, carries structured context
- HTTP status codes map to error categories: 400 validation, 404 not found, 409 conflict, 422 processing error, 500 internal

### 6.4 Request/Response Validation

- All API inputs validated via Pydantic models (Python) or Zod schemas (TypeScript)
- Validation errors return 400 with specific field-level messages
- All API outputs serialized through response models — never return raw dicts or ORM objects

### 6.5 Configuration

- All configurable values in `config.yml` or environment variables
- No magic numbers or hardcoded strings in business logic
- Config loaded once at startup, injected into services via constructor
- Defaults provided for all non-secret config values

### Files Changed

| File | Change |
|------|--------|
| `code-gen/SKILL.md` | New "Production Standards" section covering logging, exceptions, error responses, validation, configuration. |

---

## Summary of All Changes

### Modified Files

| File | Sections Added/Changed |
|------|----------------------|
| `.claude/agents/evaluator.md` | Verification mode awareness, health-check retry, structured failure JSON, mode-aware error context |
| `.claude/agents/generator.md` | Dependency handshake phase, micro-DAG execution, integrator pattern, API integration prompt injection |
| `.claude/agents/design-critic.md` | Read calibration profile, plateau detection, per-criterion minimum, scoring examples |
| `.claude/skills/auto/SKILL.md` | Section 4 phase-aware, section 6 structured failures + prior_attempts, section 7 renamed to App Lifecycle Management with 3 modes, section 9 configurable iterations |
| `.claude/skills/code-gen/SKILL.md` | New sections: External API Integration, LLM Integration, Production Standards. Expanded Gotchas list. |
| `project-manifest.json` (template) | Add `verification` block |

### New Files

| File | Purpose |
|------|---------|
| `calibration-profile.json` (template) | Tunable scoring weights, threshold, presets, plateau config |
| `.claude/skills/evaluation/references/scoring-examples.md` | 3 calibration anchors for design-critic |
| `.claude/skills/code-gen/references/api-integration-patterns.md` | Full templates for wrapper, error taxonomy, retry, fixtures, logging |

### No Changes Needed

| File | Reason |
|------|--------|
| `.claude/hooks/*` | Existing hooks already cover security, architecture, file/function length |
| `.claude/agents/security-reviewer.md` | No gaps identified |
| `.claude/agents/ui-designer.md` | No gaps identified |
| `.claude/agents/test-engineer.md` | No gaps identified |
| `.claude/agents/planner.md` | No gaps identified |
