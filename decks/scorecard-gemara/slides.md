---
marp: true
theme: default
paginate: true
size: 16:9
style: |
  section { font-size: 26px; }
  pre { font-size: 18px; line-height: 1.2; }
---

# Scorecard × Gemara: an experimental OSPS Baseline slice

A thin, experimental slice: Scorecard evaluates **two** OSPS Baseline requirements (OSPS-AC-03.01 and
OSPS-AC-03.02) from its own probes and writes the result as a **Gemara Evaluation Log**. It's not complete
coverage. It's there to show downstream tools what Scorecard's output looks like and how it fits.

- Merged: [ossf/scorecard#5449](https://github.com/ossf/scorecard/pull/5449)
- Tracking: [ossf/scorecard#5452](https://github.com/ossf/scorecard/issues/5452)
- Docs: [docs/conformance.md](https://github.com/ossf/scorecard/blob/main/docs/conformance.md)

---

## The structure

```text
--catalog=osps-baseline[@v2026.08.28]   which requirements
--profile=maturity-1                    which applicability group
        │
        ▼
Scorecard probes (existing)             e.g. branchesAreProtected, blocksDeleteOnBranches
        │
        ▼
requirement result + probe evidence     PASS | FAIL | UNKNOWN | NOT_APPLICABLE | NEEDS_REVIEW
        │
        ▼
--format=json | gemara                  conformance JSON, or Gemara v1.6.0 Evaluation Log
```

- Conformance is an execution mode: it runs only the probes named in the requirement mappings, and no checks
  are scored.
- Mapped today: **OSPS-AC-03.01** and **OSPS-AC-03.02** (primary-branch protection), 2 of the 25
  `maturity-1` requirements.
- Requirements without a mapping are listed as not evaluated. No result is claimed for them.

---

## 1. Install

```sh
go install github.com/ossf/scorecard/v5@main
export GITHUB_AUTH_TOKEN=$(gh auth token)
```

---

## 2. Conformance JSON

```sh
scorecard --repo=github.com/ossf/scorecard \
  --catalog=osps-baseline --profile=maturity-1 --format=json
```

```json
{
  "catalog": { "id": "osps-baseline", "version": "v2026.08.28" },
  "profile": "maturity-1",
  "results": [
    { "requirement": "OSPS-AC-03.01", "result": "NEEDS_REVIEW",
      "explanation": "... requires pull requests, but administrators can bypass the rule. ..." },
    { "requirement": "OSPS-AC-03.02", "result": "PASS",
      "explanation": "The default branch \"main\" cannot be deleted." }
  ],
  "notEvaluated": ["OSPS-AC-01.01", "OSPS-AC-02.01", "..."],
  "experimental": true
}
```

NEEDS_REVIEW means evidence exists, but deciding needs judgment: here, administrators can bypass the rule.
Each result carries the probe findings it used as `evidence` (trimmed here).

---

## 3. Gemara Evaluation Log

```sh
scorecard --repo=github.com/ossf/scorecard \
  --catalog=osps-baseline --profile=maturity-1 --format=gemara -o log.json
```

```json
{
  "metadata": { "type": "EvaluationLog", "gemara-version": "1.6.0",
    "author": { "id": "scorecard", "name": "OpenSSF Scorecard", "type": "Software" },
    "mapping-references": [{ "id": "osps-baseline", "version": "v2026.08.28" }] },
  "target": { "id": "github.com/ossf/scorecard", "version": "5e04457c..." },
  "result": "Needs Review",
  "evaluations": [{
    "control": { "reference-id": "osps-baseline", "entry-id": "OSPS-AC-03" },
    "result": "Needs Review",
    "assessment-logs": [{
      "requirement": { "entry-id": "OSPS-AC-03.01" },
      "result": "Needs Review",
      "applicability": ["maturity-1"],
      "evidence": [
        { "id": "branchesAreProtected/main", "type": "ScorecardProbeFinding" }, "..." ]
    }, "..."]
  }]
}
```

---

## 4. Validate against the Gemara schema

```sh
git clone --depth 1 --branch v1.6.0 https://github.com/gemaraproj/gemara
cd gemara && cue vet -c -d '#EvaluationLog' . /path/to/log.json
```

No output means it's valid.
Scorecard's CI runs the same check against a fixture:

```sh
make validate-gemara
```

---

## 5. A repo that fails

The same command against `github.com/justaugustus/scorecard`, a fork with no branch protection or rulesets
(any such repo works):

```text
OSPS-AC-03.01  FAIL     The default branch "main" is not protected.
OSPS-AC-03.02  UNKNOWN  Could not determine whether the default branch "main" can be deleted
                        (blocksDeleteOnBranches: NotAvailable).
```

Invalid input returns an error that lists the valid values:

```text
unsupported profile "maturity-9" for osps-baseline v2026.08.28;
valid profiles: maturity-1, maturity-2, maturity-3
```

---

## Guardrails

- Runs without `--catalog` are unchanged, and native scoring is untouched.
- `--help` marks the options experimental, every run warns on standard error, and conformance JSON sets
  `"experimental": true`.
- The code lives in `internal/conformance/`, with one Go package per catalog release, and the main `go.mod`
  gains no dependencies.
- Graduate-or-remove criteria are tracked in
  [#5452](https://github.com/ossf/scorecard/issues/5452).

---

## Where I'd like feedback

- **Result semantics.** Scorecard's NEEDS_REVIEW (step 2) maps to Gemara's Needs Review, which the schema
  doesn't define. Does that match how Privateer and Gemara consumers read it?
- **Evidence shape.** Is a `ScorecardProbeFinding` with the raw probe outcome useful downstream?
- **Publishing.** [grc.store](https://grc.store/) accepts Evaluation Logs only from a published hub plugin,
  bound by signed provenance. What's the right route for a log Scorecard produces itself?
- **What's next.** Which OSPS requirements should come after AC-03?

Stephen Augustus
