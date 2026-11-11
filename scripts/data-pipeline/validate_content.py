"""Checks organs.json against the GLB, and quiz.json against organs.json (standard library only).

    python scripts/data-pipeline/validate_content.py
    python scripts/data-pipeline/validate_content.py --strict      # missing content is an error too
    python scripts/data-pipeline/validate_content.py --glb public/assets/models/heart.glb \
        --organs public/assets/data/organs.json

Errors (exit code 1):
- organs.json is not an array of objects; an id is missing, malformed or duplicated
- a structure or group node of the GLB has no record, or a record has no node
- a structure node has no `licence` or `attribution` in its extras; `asset.copyright` is empty
- a record lacks `name.en`/`name.fr`, `system`, `source` or `licence`
- `system` is not the record's group in the GLB; `source`, `licence` or `fma` disagree with the GLB
- a text field (`name`, `function`, `location`, each fact) is present but not `{ "en", "fr" }` with both filled in
- quiz.json: id, type (find-it | name-it | mcq), organId, difficulty, both languages; find-it has no
  choices and its answer is an organ id; name-it has 4 organ ids and the answer is one of them; mcq has
  4 different `{ "en", "fr" }` choices and the answer is the index of the right one
Warnings (errors with --strict): `function`, `location` or `facts` not written yet; fewer than 60
questions; a structure no question is about.
See docs/DATA_CONTRACT.md for the format.
"""
from __future__ import annotations

import argparse
import json
import re
import struct
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ID_RE = re.compile(r"^[a-z0-9]+(_[a-z0-9]+)*$")
LANGS = ("en", "fr")
CONTENT_FIELDS = ("function", "location", "facts")
STATUSES = {"draft", "reviewed"}
# organs.json `source` -> prefix of the GLB extras `dataset`
SOURCES = {"HRA": "HRA", "BodyParts3D": "BodyParts3D"}


def read_glb_json(path: Path) -> dict:
    data = path.read_bytes()
    magic, version, _ = struct.unpack_from("<4sII", data, 0)
    if magic != b"glTF" or version != 2:
        raise ValueError(f"{path}: not a glTF 2.0 binary")
    length, kind = struct.unpack_from("<II", data, 12)
    if kind != 0x4E4F534A:
        raise ValueError(f"{path}: first chunk is not JSON")
    return json.loads(data[20 : 20 + length])


def glb_tree(doc: dict) -> dict[str, dict]:
    """id -> {kind, group, extras, children} for every group and structure node."""
    nodes = doc.get("nodes", [])
    out: dict[str, dict] = {}

    def walk(i: int, group: str | None) -> None:
        node = nodes[i]
        name = node.get("name", f"<node {i}>")
        kind = node.get("extras", {}).get("kind") or ("structure" if "mesh" in node else "group")
        if kind == "group":
            group = name
        if kind in ("group", "structure"):
            out[name] = {
                "kind": kind,
                "group": group,
                "extras": node.get("extras", {}),
                "children": [nodes[c].get("name") for c in node.get("children", [])],
            }
        for c in node.get("children", []):
            walk(c, group)

    for scene in doc.get("scenes", []):
        for i in scene.get("nodes", []):
            walk(i, None)
    return out


def source_of(dataset: str) -> str | None:
    return next((s for s, prefix in SOURCES.items() if dataset.startswith(prefix)), None)


def bilingual(value) -> bool:
    return isinstance(value, dict) and all(isinstance(value.get(k), str) and value[k].strip() for k in LANGS)


def validate(glb: Path, organs: Path, strict: bool, quiz: Path | None = None) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    doc = read_glb_json(glb)
    if not str(doc.get("asset", {}).get("copyright", "")).strip():
        errors.append(f"{glb.name}: asset.copyright is empty")
    tree = glb_tree(doc)

    # expected source/licence per node (a group takes those of its structures)
    expected: dict[str, tuple[str, str]] = {}
    for nid, info in tree.items():
        if info["kind"] != "structure":
            continue
        ex = info["extras"]
        for key in ("licence", "attribution", "dataset"):
            if not str(ex.get(key, "")).strip():
                errors.append(f"{glb.name}: node {nid}: extras.{key} is missing")
        src = source_of(str(ex.get("dataset", "")))
        if ex.get("dataset") and src is None:
            errors.append(f"{glb.name}: node {nid}: unknown dataset {ex['dataset']!r}")
        expected[nid] = (src or "?", str(ex.get("licence", "?")))
    for nid, info in tree.items():
        if info["kind"] == "group":
            kids = [expected[c] for c in info["children"] if c in expected]
            expected[nid] = (
                " + ".join(sorted({s for s, _ in kids})),
                " + ".join(sorted({lic for _, lic in kids})),
            )

    try:
        records = json.loads(organs.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as e:
        return [f"{organs.name}: cannot read: {e}"], warnings
    if not isinstance(records, list):
        return [f"{organs.name}: must be an array of records"], warnings

    seen: set[str] = set()
    for i, rec in enumerate(records):
        if not isinstance(rec, dict):
            errors.append(f"{organs.name}[{i}]: not an object")
            continue
        rid = rec.get("id")
        where = f"{organs.name}: {rid or f'[{i}]'}"
        if not isinstance(rid, str) or not ID_RE.match(rid):
            errors.append(f"{where}: id must be lower snake_case")
            continue
        if rid in seen:
            errors.append(f"{where}: duplicate id")
        seen.add(rid)

        node = tree.get(rid)
        if node is None:
            errors.append(f"{where}: no node with this name in {glb.name}")

        if not bilingual(rec.get("name")):
            errors.append(f"{where}: name needs non-empty 'en' and 'fr'")
        for key in ("system", "source", "licence"):
            if not isinstance(rec.get(key), str) or not rec[key].strip():
                errors.append(f"{where}: {key} is missing")

        if node is not None:
            if rec.get("system") and rec["system"] != node["group"]:
                errors.append(f"{where}: system {rec['system']!r} but the GLB puts it in {node['group']!r}")
            src, lic = expected[rid]
            if rec.get("source") and rec["source"] != src:
                errors.append(f"{where}: source {rec['source']!r} but the GLB says {src!r}")
            if rec.get("licence") and rec["licence"] != lic:
                errors.append(f"{where}: licence {rec['licence']!r} but the GLB says {lic!r}")
            if "fma" in rec and rec["fma"] != node["extras"].get("fma"):
                errors.append(f"{where}: fma {rec['fma']} but the GLB says {node['extras'].get('fma')}")

        for key in ("function", "location"):
            if key in rec and not bilingual(rec[key]):
                errors.append(f"{where}: {key} needs non-empty 'en' and 'fr'")
        if "facts" in rec:
            facts = rec["facts"]
            if not isinstance(facts, list) or not facts:
                errors.append(f"{where}: facts must be a non-empty array")
            else:
                for j, fact in enumerate(facts):
                    if not bilingual(fact):
                        errors.append(f"{where}: facts[{j}] needs non-empty 'en' and 'fr'")
        if "status" in rec and rec["status"] not in STATUSES:
            errors.append(f"{where}: status must be one of {sorted(STATUSES)}")

        missing = [k for k in CONTENT_FIELDS if k not in rec]
        if missing:
            (errors if strict else warnings).append(f"{where}: content not written yet ({', '.join(missing)})")

    for nid in tree:
        if nid not in seen:
            errors.append(f"{glb.name}: node {nid} has no record in {organs.name}")

    if quiz is not None:
        structures = {nid for nid, info in tree.items() if info["kind"] == "structure"}
        validate_quiz(quiz, seen, structures, strict, errors, warnings)

    return errors, warnings


QUIZ_TYPES = {"find-it", "name-it", "mcq"}
QUIZ_MIN = 60


def validate_quiz(path: Path, organ_ids: set[str], structures: set[str], strict: bool,
                  errors: list[str], warnings: list[str]) -> None:
    """quiz.json: ids, types, choices and answers, both languages, coverage of every structure."""
    try:
        questions = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as e:
        errors.append(f"{path.name}: cannot read: {e}")
        return
    if not isinstance(questions, list):
        errors.append(f"{path.name}: must be an array of questions")
        return

    seen: set[str] = set()
    covered: set[str] = set()
    for i, q in enumerate(questions):
        if not isinstance(q, dict):
            errors.append(f"{path.name}[{i}]: not an object")
            continue
        qid = q.get("id")
        where = f"{path.name}: {qid or f'[{i}]'}"
        if not isinstance(qid, str) or not ID_RE.match(qid):
            errors.append(f"{where}: id must be lower snake_case")
        elif qid in seen:
            errors.append(f"{where}: duplicate id")
        else:
            seen.add(qid)

        qtype = q.get("type")
        if qtype not in QUIZ_TYPES:
            errors.append(f"{where}: type must be one of {sorted(QUIZ_TYPES)}")
        if q.get("organId") not in organ_ids:
            errors.append(f"{where}: organId {q.get('organId')!r} is not in organs.json")
        else:
            covered.add(q["organId"])
        if q.get("difficulty") not in (1, 2, 3):
            errors.append(f"{where}: difficulty must be 1, 2 or 3")
        for key in ("prompt", "explanation"):
            if not bilingual(q.get(key)):
                errors.append(f"{where}: {key} needs non-empty 'en' and 'fr'")
        if "status" in q and q["status"] not in STATUSES:
            errors.append(f"{where}: status must be one of {sorted(STATUSES)}")

        choices, answer = q.get("choices"), q.get("answer")
        if not isinstance(choices, list):
            errors.append(f"{where}: choices must be an array")
            continue
        if qtype == "find-it":
            if choices:
                errors.append(f"{where}: find-it has no choices (use [])")
            if answer not in organ_ids:
                errors.append(f"{where}: answer {answer!r} is not in organs.json")
            else:
                covered.add(answer)
        elif qtype == "name-it":
            if len(choices) != 4 or len(set(map(str, choices))) != 4:
                errors.append(f"{where}: name-it needs 4 different choices")
            for c in choices:
                if c not in organ_ids:
                    errors.append(f"{where}: choice {c!r} is not in organs.json")
            if answer not in choices:
                errors.append(f"{where}: answer {answer!r} is not one of the choices")
            else:
                covered.add(answer)
        elif qtype == "mcq":
            if len(choices) != 4:
                errors.append(f"{where}: mcq needs 4 choices")
            if not all(bilingual(c) for c in choices):
                errors.append(f"{where}: every mcq choice needs non-empty 'en' and 'fr'")
            elif len({c["en"] for c in choices}) != len(choices) or len({c["fr"] for c in choices}) != len(choices):
                errors.append(f"{where}: mcq choices must be different")
            if not isinstance(answer, int) or isinstance(answer, bool) or not 0 <= answer < len(choices):
                errors.append(f"{where}: mcq answer must be the index of a choice (0 to {len(choices) - 1})")

    report = errors if strict else warnings
    if len(questions) < QUIZ_MIN:
        report.append(f"{path.name}: {len(questions)} questions, the bank needs at least {QUIZ_MIN}")
    for sid in sorted(structures - covered):
        report.append(f"{path.name}: no question about {sid}")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--glb", type=Path, default=ROOT / "public/assets/models/heart.glb")
    ap.add_argument("--organs", type=Path, default=ROOT / "public/assets/data/organs.json")
    ap.add_argument("--quiz", type=Path, default=ROOT / "public/assets/data/quiz.json")
    ap.add_argument("--no-quiz", action="store_true", help="do not check the quiz bank")
    ap.add_argument("--strict", action="store_true", help="missing content is an error")
    args = ap.parse_args()

    errors, warnings = validate(args.glb, args.organs, args.strict, None if args.no_quiz else args.quiz)
    for w in warnings:
        print(f"warning: {w}")
    for e in errors:
        print(f"error: {e}")

    try:
        records = [r for r in json.loads(args.organs.read_text(encoding="utf-8")) if isinstance(r, dict)]
    except (OSError, ValueError, TypeError):
        records = []
    done = sum(all(k in r for k in CONTENT_FIELDS) for r in records)
    reviewed = sum(r.get("status") == "reviewed" for r in records)
    try:
        nq = 0 if args.no_quiz else len(json.loads(args.quiz.read_text(encoding="utf-8")))
    except (OSError, ValueError, TypeError):
        nq = 0
    print(f"{len(records)} records, {done} with content, {reviewed} reviewed; {nq} questions; "
          f"{len(errors)} error(s), {len(warnings)} warning(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
