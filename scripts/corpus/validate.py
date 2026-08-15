#!/usr/bin/env python3
"""Check the programme hangs together.

verify.py answers "does this resource exist?". This answers the questions that
come after: does every id resolve, is the prerequisite graph actually a graph,
and is the value ordering consistent with the prerequisites it claims to
respect. A curriculum that references a skill it never defines, or orders a
course before its own prerequisite, is broken in a way no link checker sees.

Errors block; warnings are for a human to judge.

Usage:
    python scripts/corpus/validate.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Iterable

ROOT = Path(__file__).resolve().parents[2]
CURRICULUM = ROOT / "src" / "products" / "curriculum"

# Kinds too large to cite whole. An item pointing at one of these must say
# where in it the reader is meant to go.
LOCATOR_REQUIRED = {"book", "reference", "repo", "course", "lecture_series"}

errors: list[str] = []
warnings: list[str] = []


def err(msg: str) -> None:
    errors.append(msg)


def warn(msg: str) -> None:
    warnings.append(msg)


def find_cycle(nodes: Iterable[str], edges: dict[str, list[str]]) -> list[str] | None:
    """Return one cycle as a path, or None. Iterative DFS with a colour map."""
    WHITE, GREY, BLACK = 0, 1, 2
    colour = {n: WHITE for n in nodes}

    for start in list(colour):
        if colour[start] != WHITE:
            continue
        stack: list[tuple[str, int]] = [(start, 0)]
        path: list[str] = [start]
        colour[start] = GREY
        while stack:
            node, i = stack.pop()
            kids = edges.get(node, [])
            if i < len(kids):
                stack.append((node, i + 1))
                kid = kids[i]
                if kid not in colour:
                    continue  # missing node — reported separately
                if colour[kid] == GREY:
                    return path[path.index(kid):] + [kid]
                if colour[kid] == WHITE:
                    colour[kid] = GREY
                    path.append(kid)
                    stack.append((kid, 0))
            else:
                colour[node] = BLACK
                if path and path[-1] == node:
                    path.pop()
    return None


def main() -> int:
    verified_path = CURRICULUM / "resources.verified.json"
    programme_path = CURRICULUM / "programme.json"
    for p in (verified_path, programme_path):
        if not p.exists():
            print(f"missing {p}", file=sys.stderr)
            return 1

    verified: list[dict[str, Any]] = json.loads(
        verified_path.read_text("utf-8")
    )["resources"]
    programme: dict[str, Any] = json.loads(programme_path.read_text("utf-8"))

    standing_path = CURRICULUM / "advanced-standing.json"
    standing: dict[str, Any] = (
        json.loads(standing_path.read_text("utf-8")) if standing_path.exists() else {}
    )

    resources_by_id = {r["id"]: r for r in verified}
    resource_ids = set(resources_by_id)
    skills = {s["id"]: s for s in programme["skills"]}
    courses = {c["id"]: c for c in programme["courses"]}
    blocks = {b["id"] for b in programme["blocks"]}

    # --- resources -> skills
    for r in verified:
        for s in r.get("skills", []):
            if s not in skills:
                err(f"resource {r['id']}: unknown skill {s!r}")

    # --- skill graph
    for sid, s in skills.items():
        for p in s.get("prereqs", []):
            if p not in skills:
                err(f"skill {sid}: unknown prereq {p!r}")
    cycle = find_cycle(skills, {k: v.get("prereqs", []) for k, v in skills.items()})
    if cycle:
        err(f"skill prerequisite cycle: {' -> '.join(cycle)}")

    # --- areas: the capability claims
    # A CV has a skills section, not a credits section. The area is the unit a
    # reader acts on, so a claimable one has to say what it claims, what proves
    # it and what clearing the bar costs — and a supporting one has to say why
    # it is deliberately not a claim, rather than being quietly demoted.
    areas = {a["id"]: a for a in programme.get("areas", [])}
    if not areas:
        err("programme declares no areas — then nothing can be claimed")
    for sid, s in skills.items():
        if s["area"] not in areas:
            err(f"skill {sid}: unknown area {s['area']!r}")
    used_areas = {s["area"] for s in skills.values()}
    for aid, a in areas.items():
        if aid not in used_areas:
            warn(f"area {aid} has no skills — it claims something nothing teaches")
        if not a.get("claimable"):
            if not a.get("supporting_note"):
                err(
                    f"area {aid}: not claimable and gives no reason — say what it "
                    f"supports, or make it a claim"
                )
            continue
        for field in ("cv_line", "claim", "artifact", "bar"):
            if not a.get(field):
                err(f"area {aid}: claimable but declares no {field}")
        art = a.get("artifact") or {}
        for field in ("name", "what"):
            if field in art and not art.get(field):
                err(f"area {aid}: artifact declares no {field}")
        if "negative_result" not in art:
            err(
                f"area {aid}: artifact has no negative_result field — where a "
                f"technique stops working is required evidence, not a bonus"
            )
        bar = a.get("bar") or {}
        if bar and bar.get("min_tier") not in (1, 2, 3, 4):
            err(f"area {aid}: bar min_tier {bar.get('min_tier')!r} is not an evidence tier")

    # --- courses
    for cid, c in courses.items():
        if c["block"] not in blocks:
            err(f"course {cid}: unknown block {c['block']!r}")
        for p in c.get("prereq_courses", []):
            if p not in courses:
                err(f"course {cid}: unknown prereq course {p!r}")
        for s in c.get("skills_taught", []):
            if s not in skills:
                err(f"course {cid}: unknown skill {s!r}")
        for r in c.get("resources", []):
            if r not in resource_ids:
                err(f"course {cid}: resource {r!r} is not in the verified corpus")
        spec = c.get("spec")
        if spec and not (CURRICULUM / spec).exists():
            err(f"course {cid}: spec file missing at {spec}")

    cycle = find_cycle(
        courses, {k: v.get("prereq_courses", []) for k, v in courses.items()}
    )
    if cycle:
        err(f"course prerequisite cycle: {' -> '.join(cycle)}")

    # --- value ordering must respect prerequisites
    # The whole point of value_rank is "stop anywhere and keep the best of it".
    # That promise is void if a course is ranked ahead of something it needs.
    ranks = {cid: c.get("value_rank") for cid, c in courses.items()}
    seen_ranks: dict[int, str] = {}
    for cid, rank in ranks.items():
        if rank is None:
            err(f"course {cid}: missing value_rank")
            continue
        if rank in seen_ranks:
            err(f"duplicate value_rank {rank}: {seen_ranks[rank]} and {cid}")
        seen_ranks[rank] = cid
    for cid, c in courses.items():
        for p in c.get("prereq_courses", []):
            if p in ranks and ranks.get(cid) is not None and ranks.get(p) is not None:
                if ranks[p] > ranks[cid]:
                    err(
                        f"course {cid} (rank {ranks[cid]}) is ordered before its "
                        f"prerequisite {p} (rank {ranks[p]})"
                    )

    # --- advanced standing
    awarded_skills: set[str] = set()
    for a in standing.get("awards", []):
        if a["skill"] not in skills:
            err(f"advanced standing: unknown skill {a['skill']!r}")
        elif a.get("level", 0) >= 2:
            # Level 1 is "touched it", which is not competence and should not
            # satisfy a prerequisite.
            awarded_skills.add(a["skill"])
    artifact_ids = {x["id"] for x in standing.get("artifacts", [])}
    for a in standing.get("awards", []):
        for x in a.get("artifacts", []):
            if x not in artifact_ids:
                err(f"advanced standing: award {a['skill']} cites unknown artifact {x!r}")
    for cc in standing.get("course_credit", []):
        if cc["course"] not in courses:
            err(f"advanced standing: unknown course {cc['course']!r}")
            continue
        if cc["of"] != courses[cc["course"]]["credits"]:
            err(
                f"advanced standing: {cc['course']} credit total {cc['of']} does not "
                f"match the programme's {courses[cc['course']]['credits']}"
            )
        if cc["awarded"] > cc["of"]:
            err(f"advanced standing: {cc['course']} awards more credit than it has")
    # The label on a course and the credit actually awarded must agree. A
    # course advertising "partial" standing with no award behind it overstates
    # how far along the learner is, which is the one direction this system must
    # never drift in.
    def expected_label(awarded: int, of: int) -> str:
        if not awarded:
            return "none"
        return "partial" if awarded / of < 0.5 else "substantial"

    credit_rows = {cc["course"]: cc for cc in standing.get("course_credit", [])}
    for cid, c in courses.items():
        label = c.get("advanced_standing", "none")
        cc = credit_rows.get(cid)
        want = expected_label(cc["awarded"], cc["of"]) if cc else "none"
        if label != want:
            err(
                f"course {cid}: labelled advanced standing {label!r} but the "
                f"award implies {want!r}"
            )

    claimed = standing.get("totals", {}).get("credits_awarded")
    if claimed is not None:
        actual = sum(cc["awarded"] for cc in standing.get("course_credit", []))
        if claimed != actual:
            err(f"advanced standing: claims {claimed} credits, rows sum to {actual}")

    # --- skills taught must have their own prereqs held no later
    # Rank 0 means "already held on entry" — advanced standing satisfies a
    # prerequisite the same way passing a course does.
    taught_at: dict[str, int] = {s: 0 for s in awarded_skills}
    for cid, c in courses.items():
        for s in c.get("skills_taught", []):
            r = ranks.get(cid)
            if r is not None and (s not in taught_at or r < taught_at[s]):
                taught_at[s] = r

    inversions = {
        (p["skill"], p["prereq"])
        for p in programme.get("accepted_inversions", {}).get("pairs", [])
    }
    declared_but_fine: list[tuple[str, str]] = []
    for sid, s in skills.items():
        if sid not in taught_at:
            warn(f"skill {sid} is never taught by any course or held on entry")
            continue
        for p in s.get("prereqs", []):
            if p not in taught_at:
                warn(f"skill {sid} depends on {p}, which is never taught or held")
            elif taught_at[p] > taught_at[sid]:
                if (sid, p) not in inversions:
                    warn(
                        f"skill {sid} is taught at rank {taught_at[sid]} but its "
                        f"prereq {p} not until rank {taught_at[p]} — and this "
                        f"inversion is not declared in accepted_inversions"
                    )
            elif (sid, p) in inversions:
                declared_but_fine.append((sid, p))
    for sid, p in declared_but_fine:
        warn(
            f"accepted_inversions lists {sid} -> {p}, but the ordering is fine; "
            f"the exception is stale and should be removed"
        )

    # --- unused corpus
    used = {r for c in courses.values() for r in c.get("resources", [])}
    reference_only = {r["id"] for r in verified if r.get("reference_only")}
    for r in sorted(resource_ids - used - reference_only):
        warn(f"resource {r} is verified but not used by any course")

    # --- course specs
    tiers = set(programme["evidence_tiers"])
    # Assessed items per area, gathered as the specs are read so a bar can be
    # checked against what actually exists rather than against intent.
    area_evidence: dict[str, list[dict[str, Any]]] = {}
    for cid, c in courses.items():
        spec_rel = c.get("spec")
        if not spec_rel or not (CURRICULUM / spec_rel).exists():
            continue
        spec = json.loads((CURRICULUM / spec_rel).read_text("utf-8"))
        if spec.get("course") != cid:
            err(f"{spec_rel}: declares course {spec.get('course')!r}, filed under {cid}")
        if spec.get("credits") != c["credits"]:
            err(f"{spec_rel}: credits {spec.get('credits')} != programme's {c['credits']}")
        if spec.get("est_hours") != c["est_hours"]:
            err(
                f"{spec_rel}: est_hours {spec.get('est_hours')} != programme's "
                f"{c['est_hours']}"
            )

        # Keys the renderer indexes into directly. Without this a spec can pass
        # validation and then crash `render.py` with a KeyError, which is how
        # AIE-201 first landed: valid by every rule here, unrenderable in fact.
        # A validator that blesses a document the next tool cannot read is not
        # validating the thing that matters.
        for key in ("premise", "completion", "modules", "rubrics"):
            if key not in spec:
                err(f"{spec_rel}: has no {key!r} — render.py requires it")
        for key in ("required", "grade_rollup", "mastery_note"):
            if key not in spec.get("completion", {}):
                err(f"{spec_rel}: completion has no {key!r} — render.py requires it")

        items = {i["id"]: i for m in spec["modules"] for i in m["items"]}
        rubrics = {r["id"]: r for r in spec.get("rubrics", [])}

        for m in spec["modules"]:
            declared = m.get("est_minutes")
            actual = sum(i["est_minutes"] for i in m["items"])
            if declared != actual:
                err(f"{spec_rel}: module {m['id']} declares {declared} min, items sum to {actual}")

        for iid, i in items.items():
            if i.get("resource") and i["resource"] not in resource_ids:
                err(f"{spec_rel}: item {iid} cites unverified resource {i['resource']!r}")
            # Citing a book, a repo, a whole course or a documentation site
            # without saying where in it is not a citation — it is a gesture.
            # `atomic` marks resources whose URL already points at one thing.
            rid = i.get("resource")
            if rid and rid in resources_by_id:
                r = resources_by_id[rid]
                if (r["kind"] in LOCATOR_REQUIRED
                        and not r.get("atomic")
                        and not i.get("locator")):
                    err(
                        f"{spec_rel}: item {iid} cites {rid} ({r['kind']}) with no "
                        f"locator — say which chapter, path or section"
                    )
            # Passive items are inputs, not competence claims, so they may
            # touch skills the course does not itself teach. Assessed items
            # may not.
            passive = i["type"] in ("reading", "lecture")
            for s in i.get("skills", []):
                if s not in skills:
                    err(f"{spec_rel}: item {iid} cites unknown skill {s!r}")
                elif s not in c["skills_taught"] and not passive:
                    warn(
                        f"{spec_rel}: item {iid} assesses {s}, which {cid} does not "
                        f"list in skills_taught"
                    )
            if i.get("advanced_standing_exempt") and not i.get("exempt_rationale"):
                err(
                    f"{spec_rel}: item {iid} is exemptable but names no artifact "
                    f"— an exemption without a citation is just a skipped item"
                )
            if str(i.get("tier")) not in tiers:
                err(f"{spec_rel}: item {iid} has invalid tier {i.get('tier')!r}")
            # Anything above tier 0 is a claim about competence, so it needs a
            # rubric — except retention checks, which are scored by recall and
            # have nothing for a rubric to judge.
            if i["type"] == "retention":
                if not i.get("fsrs"):
                    err(f"{spec_rel}: retention item {iid} is not FSRS-scheduled")
            elif i.get("tier", 0) > 0 and not i.get("rubric"):
                err(f"{spec_rel}: item {iid} is tier {i['tier']} but has no rubric")
            if i.get("rubric") and i["rubric"] not in rubrics:
                err(f"{spec_rel}: item {iid} cites unknown rubric {i['rubric']!r}")
            if i["est_minutes"] > 180:
                err(f"{spec_rel}: item {iid} is {i['est_minutes']} min — over the sitting cap")
            # Checkpoints exist so a long item can be resumed after a gap.
            # Passive items already resume themselves — the video player and
            # the page both remember where you were. Active work does not.
            if i["est_minutes"] > 90 and not i.get("checkpoints") and not passive:
                warn(f"{spec_rel}: item {iid} is {i['est_minutes']} min with no checkpoints")

        # Tier 0 is self-marked and counts toward nothing, so it is not
        # evidence. The set comprehension dedupes: an item tagged with three
        # skills from one area is still one piece of evidence.
        for i in items.values():
            if i.get("tier", 0) < 1:
                continue
            for aid in {
                skills[s]["area"] for s in i.get("skills", []) if s in skills
            }:
                area_evidence.setdefault(aid, []).append(i)

        for rid, r in rubrics.items():
            if r.get("for") not in items:
                err(f"{spec_rel}: rubric {rid} targets unknown item {r.get('for')!r}")
            total_weight = round(sum(x["weight"] for x in r["criteria"]), 6)
            if total_weight != 1.0:
                err(f"{spec_rel}: rubric {rid} criteria weights sum to {total_weight}, not 1.0")
            for x in r["criteria"]:
                missing = {"0", "1", "2", "3"} - set(x.get("levels", {}))
                if missing:
                    err(f"{spec_rel}: rubric {rid} criterion {x['id']} missing levels {sorted(missing)}")
        for iid, i in items.items():
            if i.get("rubric") and rubrics.get(i["rubric"], {}).get("for") != iid:
                err(f"{spec_rel}: item {iid} and rubric {i['rubric']} do not point at each other")

        # est_hours is REQUIRED work. Optional items — usually a re-read of
        # something an earlier course already covered — are carried separately
        # so the programme's totals stay honest for someone who skips them.
        all_items = [i for m in spec["modules"] for i in m["items"]]
        required = sum(i["est_minutes"] for i in all_items if not i.get("optional"))
        optional = sum(i["est_minutes"] for i in all_items if i.get("optional"))
        if abs(required / 60 - c["est_hours"]) > 1:
            err(
                f"{spec_rel}: required work totals {required / 60:.1f}h, programme "
                f"says {c['est_hours']}h"
            )
        if round(optional / 60) != spec.get("optional_hours", 0):
            err(
                f"{spec_rel}: optional items total {optional / 60:.1f}h but "
                f"optional_hours says {spec.get('optional_hours', 0)}"
            )
        for i in all_items:
            if i.get("optional") and not i.get("optional_reason"):
                err(
                    f"{spec_rel}: item {i['id']} is optional with no reason — say "
                    f"what already covers it"
                )
            # An optional assessed item is an elective: it still carries a
            # rubric and still appears on the transcript if submitted, but
            # completion does not wait for it.
            if i.get("optional") and i["tier"] > 0 and not i.get("rubric") \
                    and i["type"] != "retention":
                err(
                    f"{spec_rel}: elective item {i['id']} is tier {i['tier']} but "
                    f"has no rubric"
                )

    # --- capability bars must be clearable
    # A bar the curriculum cannot satisfy is not a standard, it is an alibi:
    # it looks demanding while guaranteeing the claim is never tested.
    for aid, a in areas.items():
        if not a.get("claimable"):
            continue
        bar = a.get("bar") or {}
        ev = area_evidence.get(aid, [])
        if not ev:
            # Nothing specified teaches it yet. Unearnable, not misdeclared —
            # Block II is deliberately unwritten until Block I has been studied.
            continue
        min_tier = bar.get("min_tier", 1)
        qualifying = [i for i in ev if i.get("tier", 0) >= min_tier]
        if len(qualifying) < bar.get("min_items", 0):
            err(
                f"area {aid}: bar wants {bar.get('min_items')} items at tier "
                f"{min_tier}+, but the curriculum contains {len(qualifying)}"
            )
        if bar.get("defence") and not any(i.get("tier", 0) >= 4 for i in ev):
            warn(
                f"area {aid}: bar requires a defence, but no tier-4 item teaches "
                f"it — the claim cannot currently be earned"
            )
        if bar.get("cold_recall") and not any(
            i.get("type") == "retention" for i in ev
        ):
            warn(
                f"area {aid}: bar requires cold recall, but no retention item "
                f"covers it"
            )

    # --- credit comparability within a block
    # A credit has to mean roughly the same amount of work wherever it is
    # earned, or the transcript's totals are decoration. Compared against the
    # block median rather than the programme's stated 20 h/credit: blocks
    # legitimately differ in density, courses inside one should not.
    for b in programme["blocks"]:
        rows = [
            (cid, c["est_hours"] / c["credits"])
            for cid, c in courses.items()
            if c["block"] == b["id"] and c["credits"]
        ]
        if len(rows) < 3:
            continue
        ratios = sorted(r for _, r in rows)
        mid = len(ratios) // 2
        median = ratios[mid] if len(ratios) % 2 else (ratios[mid - 1] + ratios[mid]) / 2
        for cid, r in rows:
            if median and abs(r - median) / median > 0.25:
                warn(
                    f"course {cid}: {r:.1f} hours per credit against a block median "
                    f"of {median:.1f} — {'over' if r > median else 'under'}weighted by "
                    f"{abs(r - median) / median:.0%}"
                )

    # --- credits
    for b in programme["blocks"]:
        claimed = b["credits"]
        actual = sum(c["credits"] for c in courses.values() if c["block"] == b["id"])
        if claimed != actual:
            err(f"block {b['id']}: claims {claimed} credits, courses sum to {actual}")
    total_claimed = programme["programme"]["total_credits"]
    total_actual = sum(c["credits"] for c in courses.values())
    if total_claimed != total_actual:
        err(f"programme claims {total_claimed} credits, courses sum to {total_actual}")

    print(f"{len(verified)} resources · {len(skills)} skills · {len(courses)} courses")
    for w in warnings:
        print(f"  warn  {w}")
    for e in errors:
        print(f"  ERROR {e}")
    print(f"\n{len(errors)} errors · {len(warnings)} warnings")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
