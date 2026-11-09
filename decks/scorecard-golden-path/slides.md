---
marp: true
theme: default
paginate: true
size: 16:9
style: |
  section { font-size: 26px; }
  pre { font-size: 18px; line-height: 1.2; }
---

# Scorecard as a map: is this project actually doing it?

The talk's blockers include **awareness vs adoption** and **badge/wayfinding confusion**.
Scorecard reads a repo and reports what it *does*: signed releases, SBOMs, reviewed changes.

- Site: <https://scorecard.dev>
- Repo: [ossf/scorecard](https://github.com/ossf/scorecard)

---

## From the talk's tools to Scorecard checks

| You care about | Scorecard check | What it looks for |
| --- | --- | --- |
| Sigstore signing | `Signed-Releases` | signatures in release assets |
| SLSA Build provenance | `Signed-Releases` | `*.intoto.jsonl` provenance (full score) |
| SBOMs | `SBOM` (experimental) | an SBOM in the repo or release assets |
| SLSA Source-track-like controls | `Branch-Protection`, `Code-Review` | protected branches, reviewed changes |

Each result carries a reason and a remediation link. It's a heuristic signal, not a verdict.

---

## Live: run it

```sh
export GITHUB_AUTH_TOKEN=$(gh auth token -h github.com)
export SCORECARD_EXPERIMENTAL=1        # enables the SBOM check

scorecard --repo=github.com/sigstore/cosign \
  --checks=Signed-Releases,SBOM,Branch-Protection,Code-Review
```

Swap in `guacsec/guac` or `slsa-framework/slsa-github-generator`. Each run takes about 10 seconds.

---

## Live: no install, no token

Weekly results for projects that publish them:

```sh
curl -s https://api.scorecard.dev/projects/github.com/guacsec/guac \
  | jq '.checks[] | select(.name=="Signed-Releases" or .name=="Code-Review")
        | {name, score, reason}'
```

Or in a browser: <https://scorecard.dev/viewer/?uri=github.com/guacsec/guac>

---

## Does and doesn't

**Does:** tells you, per check, whether a project signs releases, ships provenance, has an SBOM, and reviews
changes, with evidence and a fix link.

**Doesn't:**

- Verify a signature or attestation. That's Sigstore (`cosign verify`) and SLSA verifiers.
- Judge whether an SBOM is accurate. It only finds one.
- Run air-gapped. It needs the GitHub or GitLab API.
- Replace other badges. The Scorecard badge is automated checks; the Best Practices badge is self-attested
  criteria; SLSA levels describe build and source guarantees.

Stephen Augustus
