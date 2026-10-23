# Phase 3 — Code Analysis Engine

Static, rule-based analysis of submitted source code. **Never executes user programs.**

## Analyzer version

Current: **`3.0.0`** (`server/src/analysis/version.js`).

Cache key: `(userId, submission, sourceHash, analyzerVersion)` for `completed` / `partial` results.

## Language support

| Language | Support | Notes |
|----------|---------|--------|
| JavaScript | `partial` | Syntax via `@babel/parser`; heuristic patterns |
| TypeScript | `partial` | Same parser path |
| Python | `partial` | Structural heuristics only (no full AST) |
| C++ / C | `partial` | Brace-balance + pattern rules |
| Java | `partial` | Brace-balance + pattern rules |
| Go | `partial` | Brace-balance + pattern rules |
| Others | `unsupported` | Clear failure — no invented complexity |

## Pipeline

1. Validate / size-limit source  
2. Resolve language (hint + sniff)  
3. Syntax check (parser or brace balance)  
4. Structural scan  
5. Algorithm / DS detection (evidence + confidence)  
6. Time & **auxiliary** space estimates (assumptions recorded)  
7. Findings + optimization suggestions  
8. Persist `CodeAnalysis` (versioned)

Space convention: **auxiliary space excludes input storage** (`includesInputStorage: false`).

## API (JWT + ownership)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/submissions/:id/analyze` | Run or reuse cached analysis |
| `GET` | `/api/submissions/:id/analysis` | Latest analysis |
| `GET` | `/api/submissions/:id/analyses` | History (paginated) |
| `PUT` | `/api/submissions/:id/source` | Attach source for analysis |
| `GET` | `/api/analyses/:analysisId` | Single analysis |
| `POST` | `/api/analyses/:analysisId/retry` | Retry failed/partial |

## Security

- Auth + ownership on every route  
- Max source size (`ANALYSIS_MAX_SOURCE_BYTES`, default 200KB)  
- Rate limit on analyze / source / retry  
- No shell, no code execution, no external transmission of private source  
