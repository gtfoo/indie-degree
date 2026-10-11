#!/usr/bin/env python3
"""Regenerate the rubric lock.

A rubric is a contract between the learner, the panel and every score already
recorded. Editing one silently reinterprets that evidence, so `Rubric.version`
exists -- but a version nobody is forced to bump is a version that rots.

This writes a hash of each rubric's judged content. `validate.py` recomputes it
and refuses a rubric whose content moved while its version did not. Run this
after a deliberate rubric change, having bumped the version first.

Usage:  python3 scripts/corpus/lock_rubrics.py
"""
from __future__ import annotations
import glob
import hashlib
import json
import pathlib

HERE = pathlib.Path(__file__).resolve().parents[2]
COURSES = HERE / "src/products/curriculum/courses"
LOCK = HERE / "src/products/curriculum/rubrics.lock.json"


def content_hash(rubric: dict) -> str:
    """Hash everything a score depends on, and nothing else.

    `version` is excluded or the hash would change every time it is bumped and
    could never detect anything. Keys are sorted so re-ordering a JSON file is
    not mistaken for a change of meaning.
    """
    judged = {k: v for k, v in rubric.items() if k != "version"}
    blob = json.dumps(judged, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(blob.encode("utf-8")).hexdigest()[:16]


def collect() -> dict[str, dict]:
    """Keyed by course and rubric id, never by rubric id alone.

    Rubric ids are unique only within a course -- 245 rubrics share 62 ids, and
    `R-M5.4` exists in fourteen of them -- which is what `resolve()` in the
    submission route already assumes. Keying on the bare id collapses them
    last-writer-wins and silently drops 183 rubrics from the lock.
    """
    out: dict[str, dict] = {}
    for path in sorted(glob.glob(str(COURSES / "*.json"))):
        spec = json.loads(pathlib.Path(path).read_text(encoding="utf-8"))
        course = spec["course"]
        for r in spec.get("rubrics", []):
            out[f"{course}/{r['id']}"] = {
                "version": r.get("version", 1),
                "hash": content_hash(r),
            }
    return out


def main() -> None:
    locked = collect()
    LOCK.write_text(
        json.dumps(locked, indent=2, ensure_ascii=False, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(f"locked {len(locked)} rubrics -> {LOCK.relative_to(HERE)}")


if __name__ == "__main__":
    main()
