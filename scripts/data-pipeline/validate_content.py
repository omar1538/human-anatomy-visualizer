"""Checks organs.json against the GLB (standard library only, runs without the venv).

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
Warnings (errors with --strict): `function`, `location` or `facts` not written yet.
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


def validate(glb: Path, organs: Path, strict: bool) -> tuple[list[str], list[str]]:
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

    return errors, warnings


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--glb", type=Path, default=ROOT / "public/assets/models/heart.glb")
    ap.add_argument("--organs", type=Path, default=ROOT / "public/assets/data/organs.json")
    ap.add_argument("--strict", action="store_true", help="missing content is an error")
    args = ap.parse_args()

    errors, warnings = validate(args.glb, args.organs, args.strict)
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
    print(f"{len(records)} records, {done} with content, {reviewed} reviewed; "
          f"{len(errors)} error(s), {len(warnings)} warning(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
