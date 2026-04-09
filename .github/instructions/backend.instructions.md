---
applyTo: "backend/**/*.py"
---
Use Python 3.12+. Type-annotate all functions with return types.
Use ruff for linting and formatting. Use mypy for type checking.
Prefer Pydantic models for request/response validation.
Use pytest for tests. Target 100% meaningful coverage.
Follow the layered architecture: Types → Config → Repository → Service → API.
Never import from a higher layer.
