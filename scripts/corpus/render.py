#!/usr/bin/env python3
"""Render the curriculum JSON as readable Markdown.

Generated, not hand-written: the JSON is the source of truth and is validated
before it gets here, so a hand-maintained prose copy would drift within a week.
Re-run after any change to the curriculum.

Writes:
    curriculum/PROGRAMME.md   the programme, course by course
    curriculum/RESOURCES.md   the corpus, grouped by kind
    curriculum/AIE-102.md      the first course in full

Usage:
    python scripts/corpus/render.py
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
CURRICULUM = ROOT / "src" / "products" / "curriculum"

KIND_ORDER = [
    ("lecture_series", "Lecture series"),
    ("lecture", "Single lectures"),
    ("course", "Courses"),
    ("book", "Books"),
    ("paper", "Papers"),
    ("repo", "Repositories"),
    ("article", "Articles"),
    ("reference", "Reference"),
]

METHOD_LABEL = {
    "youtube-oembed": "YouTube oEmbed → title",
    "arxiv-api": "arXiv API → title",
    "openlibrary-isbn": "OpenLibrary ISBN → title",
    "github-api": "GitHub API",
    "web-substring": "page substring",
    "pdf-contenttype": "PDF served (liveness only)",
}

COST_LABEL = {"free": "Free", "paid": "Paid", "free_with_paid_cert": "Free (paid cert)"}


def load(name: str) -> Any:
    return json.loads((CURRICULUM / name).read_text("utf-8"))


def resource_url(r: dict[str, Any]) -> str | None:
    if r.get("url"):
        return r["url"]
    t, ref = r["type"], r["ref"]
    if t == "youtube":
        return f"https://www.youtube.com/watch?v={ref}"
    if t == "youtube_playlist":
        return f"https://www.youtube.com/playlist?list={ref}"
    if t == "arxiv":
        return f"https://arxiv.org/abs/{ref}"
    if t == "github":
        return f"https://github.com/{ref}"
    if t == "book":
        return f"https://openlibrary.org/isbn/{ref}"
    if t in ("web", "pdf"):
        return ref
    return None


def link(r: dict[str, Any]) -> str:
    url = resource_url(r)
    title = r["title"].replace("|", "\\|")
    return f"[{title}]({url})" if url else title


def hours(n: Any) -> str:
    if not n:
        return "—"
    return f"{n:g} h"


def render_programme(prog: dict, verified: list[dict], standing: dict) -> str:
    p = prog["programme"]
    res = {r["id"]: r for r in verified}
    skills = {s["id"]: s for s in prog["skills"]}
    courses = sorted(prog["courses"], key=lambda c: c["value_rank"])
    blocks = {b["id"]: b for b in prog["blocks"]}

    credit_by_course = {c["course"]: c for c in standing.get("course_credit", [])}
    by_id = {c["id"]: c for c in courses}

    def standing_hours(course_id: str) -> float:
        """Hours offset by advanced standing, pro-rata against that course.

        Not credits x 20. The programme averages ~20 hours a credit, but
        individual courses do not — AIE-101 is 45 hours for 3 credits — and
        using the average would overstate the offset on exactly the course
        where most of the standing was awarded.
        """
        cc = credit_by_course.get(course_id)
        if not cc or not cc["awarded"]:
            return 0.0
        return cc["awarded"] / cc["of"] * by_id[course_id]["est_hours"]

    awarded_hours = sum(standing_hours(cid) for cid in credit_by_course)

    out: list[str] = []
    a = out.append

    a(f"# {p['title']} — {p['subtitle']}")
    a("")
    a(f"*{p['framing_note']}*")
    a("")
    a(f"- **Credits** {p['total_credits']} · {p['credit_unit']}")
    a(f"- **Total work** {p['total_hours']} hours")
    a(f"- **Opened** {p['opened']}")
    a(f"- **Pacing** {p['pacing']} — {p['pacing_note']}")
    a("")
    a(f"> **Ordering.** {p['ordering_principle']}")
    a("")

    a("## Where this starts")
    a("")
    t = standing["totals"]
    a(f"Advanced standing awards **{t['credits_awarded']} of {t['credits_total']} credits** "
      f"and evidence on **{t['skills_with_evidence']} of {t['skills_total']} skills**, "
      f"from work already shipped.")
    a("")
    a(f"> {t['reading']}")
    a("")
    a("| Course | Awarded | Of | Why | Still to do |")
    a("|---|---:|---:|---|---|")
    for cc in standing["course_credit"]:
        a(f"| {cc['course']} | **{cc['awarded']}** | {cc['of']} | {cc['rationale']} "
          f"| {cc['remaining']} |")
    a("")

    b1 = sum(c["est_hours"] for c in courses if c["block"] == "block-1")
    b1_credit = sum(
        standing_hours(c["id"]) for c in courses if c["block"] == "block-1"
    )

    def span(remaining: float) -> str:
        """Elapsed time at 6-12 hours a week, in whichever unit reads honestly."""
        fast, slow = remaining / 12, remaining / 6          # weeks
        if slow <= 52:
            return f"{fast / 4.35:.0f}–{slow / 4.35:.0f} months"
        return f"{fast / 52:.1f}–{slow / 52:.1f} years"

    a("| | Hours | At 6–12 h/week |")
    a("|---|---:|---|")
    a(f"| Block I | {b1} | |")
    a(f"| less advanced standing | −{b1_credit:.0f} | |")
    a(f"| **Block I remaining** | **{b1 - b1_credit:.0f}** | **{span(b1 - b1_credit)}** |")
    a(f"| Whole programme | {p['total_hours']} | |")
    a(f"| less advanced standing | −{awarded_hours:.0f} | |")
    a(f"| **Remaining** | **{p['total_hours'] - awarded_hours:.0f}** "
      f"| **{span(p['total_hours'] - awarded_hours)}** |")
    a("")

    a("## Study order")
    a("")
    a("| # | Code | Course | Block | Credits | Hours | Prerequisites | Standing |")
    a("|---:|---|---|---|---:|---:|---|---|")
    for c in courses:
        pre = ", ".join(c["prereq_courses"]) or "—"
        std = c.get("advanced_standing", "none")
        std = "—" if std == "none" else std
        block = "I" if c["block"] == "block-1" else "II"
        a(f"| {c['value_rank']} | `{c['id']}` | **{c['title']}** | {block} | "
          f"{c['credits']} | {c['est_hours']} | {pre} | {std} |")
    a("")

    for bid in ("block-1", "block-2"):
        b = blocks[bid]
        a(f"## Block {'I' if bid == 'block-1' else 'II'} — {b['title']}")
        a("")
        a(f"*{b['purpose']}*")
        a("")
        for c in [x for x in courses if x["block"] == bid]:
            a(f"### {c['value_rank']}. {c['id']} — {c['title']}")
            a("")
            a(f"**{c['credits']} credits · {c['est_hours']} hours**"
              + (f" · prerequisites: {', '.join(c['prereq_courses'])}"
                 if c["prereq_courses"] else ""))
            a("")
            a(f"{c['why']}")
            a("")
            if c["outcomes"]:
                a("**By the end you can**")
                a("")
                for o in c["outcomes"]:
                    a(f"- {o}")
                a("")
            if c["skills_taught"]:
                names = ", ".join(skills[s]["name"] for s in c["skills_taught"])
                a(f"**Skills** {names}")
                a("")
            if c.get("resources"):
                a("| Resource | Author | Hours | Cost |")
                a("|---|---|---:|---|")
                for rid in c["resources"]:
                    r = res[rid]
                    a(f"| {link(r)} | {r.get('author', '—')} | "
                      f"{hours(r.get('est_hours'))} | {COST_LABEL.get(r['cost'], r['cost'])} |")
                a("")
            if c.get("spec"):
                a(f"> Full specification: [{Path(c['spec']).name}]({c['spec']})")
                a("")

    a("## Skill map")
    a("")
    a("Skills are a separate graph from courses — courses, items and artifacts all "
      "map onto them many-to-many. That is what makes the tree structural rather "
      "than decorative, and what makes this forkable to another domain.")
    a("")
    areas: dict[str, list[dict]] = {}
    for s in prog["skills"]:
        areas.setdefault(s["area"], []).append(s)
    for area, items in areas.items():
        a(f"**{area.replace('-', ' ').title()}**")
        a("")
        a("| Skill | Depends on |")
        a("|---|---|")
        for s in items:
            pre = ", ".join(skills[x]["name"] for x in s["prereqs"]) or "—"
            a(f"| {s['name']} | {pre} |")
        a("")

    inv = prog.get("accepted_inversions", {})
    if inv:
        a("### Accepted inversions")
        a("")
        a(f"{inv['rationale']}")
        a("")
        for x in inv["pairs"]:
            a(f"- **{skills[x['skill']]['name']}** is taught before "
              f"**{skills[x['prereq']]['name']}**")
        a("")

    a("---")
    a("")
    a("*Generated by `scripts/corpus/render.py`. Edit the JSON, not this file.*")
    return "\n".join(out) + "\n"


def render_resources(verified: list[dict], prog: dict) -> str:
    skills = {s["id"]: s for s in prog["skills"]}
    used: dict[str, list[str]] = {}
    for c in prog["courses"]:
        for rid in c.get("resources", []):
            used.setdefault(rid, []).append(c["id"])

    out: list[str] = []
    a = out.append
    a("# Resource corpus")
    a("")
    a(f"**{len(verified)} resources, all identity-verified.** Nothing enters a "
      "course that has not resolved to the thing it claims to be — a title match "
      "from the source's own API, not an HTTP 200. The check method is shown per "
      "row, because they are not equally strong.")
    a("")
    free = sum(1 for r in verified if r["cost"] == "free")
    a(f"{free} free · {len(verified) - free} paid.")
    a("")

    video_hours = sum(
        r.get("est_hours", 0) for r in verified
        if r["kind"] in ("lecture", "lecture_series")
    )
    a(f"Of that, **{video_hours:g} hours is video** across lectures and lecture "
      "series. For video the publishing channel is shown as reported by YouTube "
      "itself — a lecture re-uploaded by an engagement-farming channel is not "
      "the same resource as the original.")
    a("")

    for kind, heading in KIND_ORDER:
        rows = [r for r in verified if r["kind"] == kind]
        if not rows:
            continue
        a(f"## {heading}")
        a("")
        is_video = kind in ("lecture", "lecture_series")
        head = "| Resource | Author | Hours | Cost | Skills | Used by | Verified via |"
        if is_video:
            head = ("| Resource | Author | Channel | Hours | Cost | Skills | Used by |")
        a(head)
        a("|---|---|---:|---|---|---|---|")
        for r in sorted(rows, key=lambda x: x["title"].lower()):
            sk = ", ".join(skills[s]["name"] for s in r.get("skills", [])) or "—"
            by = ", ".join(used.get(r["id"], [])) or "*reference only*"
            v = r["verification"]
            if is_video:
                a(f"| {link(r)} | {r.get('author', '—')} | "
                  f"**{v.get('observed_author', '—')}** | {hours(r.get('est_hours'))} "
                  f"| {COST_LABEL.get(r['cost'], r['cost'])} | {sk} | {by} |")
            else:
                m = METHOD_LABEL.get(v["method"], v["method"])
                a(f"| {link(r)} | {r.get('author', '—')} | {hours(r.get('est_hours'))} "
                  f"| {COST_LABEL.get(r['cost'], r['cost'])} | {sk} | {by} | {m} |")
        a("")
        notes = [r for r in rows if r.get("note")]
        if notes:
            for r in notes:
                a(f"- **{r['title']}** — {r['note']}")
            a("")

    a("---")
    a("")
    a("*Generated by `scripts/corpus/render.py`. Edit `resources.json` and re-run "
      "`verify.py`, not this file.*")
    return "\n".join(out) + "\n"


def render_course(spec: dict, verified: list[dict], prog: dict) -> str:
    res = {r["id"]: r for r in verified}
    skills = {s["id"]: s for s in prog["skills"]}
    course = next(c for c in prog["courses"] if c["id"] == spec["course"])
    rubrics = {r["id"]: r for r in spec["rubrics"]}

    out: list[str] = []
    a = out.append
    a(f"# {spec['course']} — {spec['title']}")
    a("")
    a(f"**{spec['credits']} credits · {spec['est_hours']} hours · "
      f"{len(spec['modules'])} modules**")
    a("")
    a(f"> {spec['premise']}")
    a("")
    a(f"{course['why']}")
    a("")
    a("**By the end you can**")
    a("")
    for o in course["outcomes"]:
        a(f"- {o}")
    a("")
    a(f"**Sitting rule.** {spec['sitting_rule']}")
    a("")
    if spec.get("advanced_standing_note"):
        a(f"> **Advanced standing.** {spec['advanced_standing_note']}")
        a("")

    # How the time is actually spent. The distinction that matters is passive
    # intake versus work you are assessed on.
    mix: dict[str, int] = {}
    optional_mins = 0
    for m in spec["modules"]:
        for i in m["items"]:
            if i.get("optional"):
                optional_mins += i["est_minutes"]
                continue
            mix[i["type"]] = mix.get(i["type"], 0) + i["est_minutes"]
    total = sum(mix.values())
    a("## How the time is spent")
    a("")
    a("| | Hours | Share |")
    a("|---|---:|---:|")
    for t, mins in sorted(mix.items(), key=lambda x: -x[1]):
        a(f"| {t.title()} | {mins / 60:.1f} | {mins / total:.0%} |")
    doing = sum(v for k, v in mix.items() if k in ("assignment", "project", "defense"))
    a(f"| **Assessed work** | **{doing / 60:.1f}** | **{doing / total:.0%}** |")
    a("")
    if optional_mins:
        a(f"Plus **{optional_mins / 60:.1f} hours marked optional** — work an earlier "
          "course already required. Kept, not deleted; not counted above, and "
          "completion does not wait for it.")
        a("")

    p = spec["panel"]
    a("## The panel")
    a("")
    a(f"- **Judges** {', '.join(f'`{m}`' for m in p['models'])}")
    a(f"- **Blind** {p['blind_note']}")
    a(f"- **Disagreement** {p['disagreement']}")
    a("")
    # Courses carry different panel caveats; render whichever are present
    # rather than assuming a fixed set.
    for key, label in (
        ("conflict_of_interest", "Conflict of interest"),
        ("exemption_handling", "Exemptions"),
    ):
        if p.get(key):
            a(f"> **{label}.** {p[key]}")
            a("")

    total_items = sum(len(m["items"]) for m in spec["modules"])
    a(f"## Modules ({total_items} items)")
    a("")
    for m in spec["modules"]:
        a(f"### {m['id']} — {m['title']}")
        a("")
        a(f"*{m['est_minutes']} minutes*")
        a("")
        for i in m["items"]:
            tier = f"tier {i['tier']}"
            head = f"**{i['id']} · {i['title']}** — {i['type']}, {i['est_minutes']} min, {tier}"
            if i.get("advanced_standing_exempt"):
                head += " · **exemptable**"
            if i.get("optional"):
                head += " · **optional**"
            if i.get("resource") and i["resource"] in res:
                r = res[i["resource"]]
                chan = r["verification"].get("observed_author")
                head += f"  \n{link(r)}" + (f" — *{chan}*" if chan else "")
            a(f"- {head}")
            if i.get("locator"):
                a(f"  *Where:* {i['locator']}")
            if i.get("optional_reason"):
                a(f"  *Optional because:* {i['optional_reason']}")
            if i.get("exempt_rationale"):
                a(f"  *Already evidenced:* {i['exempt_rationale']}")
            if i.get("brief"):
                a(f"  {i['brief']}")
            if i.get("checkpoints"):
                a(f"  *Checkpoints:* {' → '.join(i['checkpoints'])}")
            if i.get("sample_question_shapes"):
                a("  *Question shapes:*")
                for q in i["sample_question_shapes"]:
                    a(f"    - {q}")
        a("")

    a("## Rubrics")
    a("")
    a("Every rubric below is registered before its submission exists, and is "
      "frozen into the submission when it arrives — a later edit cannot change "
      "a grade already given.")
    a("")
    for rid, r in rubrics.items():
        a(f"### {rid} — {r['for']}")
        a("")
        if r.get("machine_checks"):
            a("**Machine checks** (blocking)")
            a("")
            for mc in r["machine_checks"]:
                a(f"- `{mc['check']}`")
            a("")
        a("| Criterion | Weight | 0 | 1 | 2 | 3 |")
        a("|---|---:|---|---|---|---|")
        for c in r["criteria"]:
            lv = c["levels"]
            a(f"| {c['criterion']} | {c['weight']:.0%} | {lv['0']} | {lv['1']} "
              f"| {lv['2']} | {lv['3']} |")
        a("")
        if r.get("anti_gaming"):
            a(f"> **Anti-gaming.** {r['anti_gaming']}")
            a("")
        if r.get("integrity"):
            a(f"> **Integrity.** {r['integrity']}")
            a("")

    comp = spec["completion"]
    a("## Completion")
    a("")
    for k in ("required", "grade_rollup", "mastery_note"):
        a(f"- {comp[k]}")
    a("")
    a("---")
    a("")
    a("*Generated by `scripts/corpus/render.py`. Edit the JSON, not this file.*")
    return "\n".join(out) + "\n"


def main() -> int:
    prog = load("programme.json")
    verified = load("resources.verified.json")["resources"]
    standing = load("advanced-standing.json")

    pages = [
        ("PROGRAMME.md", render_programme(prog, verified, standing)),
        ("RESOURCES.md", render_resources(verified, prog)),
    ]
    # Every course that has a spec gets a page — no list to keep in sync.
    for c in sorted(prog["courses"], key=lambda x: x["value_rank"]):
        if not c.get("spec"):
            continue
        pages.append((f"{c['id']}.md", render_course(load(c["spec"]), verified, prog)))

    written = []
    for name, body in pages:
        (CURRICULUM / name).write_text(body, "utf-8")
        written.append((name, len(body.splitlines())))

    for name, lines in written:
        print(f"wrote curriculum/{name} ({lines} lines)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
