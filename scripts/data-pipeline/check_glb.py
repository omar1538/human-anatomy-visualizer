"""Structural checks on pipeline GLBs (no dependencies beyond numpy).

    python scripts/data-pipeline/check_glb.py data/out/*.glb

Not a replacement for the Khronos glTF-Validator (run that in CI too); this checks
the things the app relies on:
- GLB container is well formed; asset.copyright is set
- every mesh has POSITION + NORMAL + indices, finite positions, accessor min/max
  match the data, indices in range, unit normals
- every node with a mesh has a unique lower snake_case name (= organs.json id)
- extras on every structure node carry licence + attribution
Exit code 1 if any check fails.
"""
from __future__ import annotations

import json
import re
import struct
import sys
from pathlib import Path

import numpy as np

DTYPE = {5126: np.float32, 5125: np.uint32, 5123: np.uint16, 5121: np.uint8}
NCOMP = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}
ID_RE = re.compile(r"^[a-z0-9]+(_[a-z0-9]+)*$")


def read_glb(path: Path) -> tuple[dict, bytes]:
    data = path.read_bytes()
    magic, version, total = struct.unpack_from("<4sII", data, 0)
    assert magic == b"glTF" and version == 2, "not a glTF 2.0 binary"
    assert total == len(data), f"header length {total} != file size {len(data)}"
    jlen, jtype = struct.unpack_from("<II", data, 12)
    assert jtype == 0x4E4F534A, "first chunk is not JSON"
    doc = json.loads(data[20 : 20 + jlen])
    blen, btype = struct.unpack_from("<II", data, 20 + jlen)
    assert btype == 0x004E4942, "second chunk is not BIN"
    return doc, data[28 + jlen : 28 + jlen + blen]


def check(path: Path) -> list[str]:
    errors: list[str] = []
    try:
        doc, binary = read_glb(path)
    except AssertionError as e:
        return [str(e)]

    def accessor(i: int):
        a = doc["accessors"][i]
        view = doc["bufferViews"][a["bufferView"]]
        offset = view.get("byteOffset", 0) + a.get("byteOffset", 0)
        n = NCOMP[a["type"]]
        arr = np.frombuffer(binary, DTYPE[a["componentType"]], a["count"] * n, offset)
        return a, arr.reshape(a["count"], n)

    if not doc.get("asset", {}).get("copyright"):
        errors.append("asset.copyright is empty")

    for m in doc.get("meshes", []):
        name = m.get("name", "?")
        for p in m["primitives"]:
            attrs = p["attributes"]
            if "POSITION" not in attrs or "NORMAL" not in attrs or "indices" not in p:
                errors.append(f"mesh {name}: needs POSITION, NORMAL and indices")
                continue
            a, pos = accessor(attrs["POSITION"])
            _, nrm = accessor(attrs["NORMAL"])
            _, idx = accessor(p["indices"])
            if not np.isfinite(pos).all():
                errors.append(f"mesh {name}: non-finite positions")
            if not (np.allclose(pos.min(0), a["min"], atol=1e-6) and np.allclose(pos.max(0), a["max"], atol=1e-6)):
                errors.append(f"mesh {name}: POSITION min/max do not match data")
            if idx.size % 3 or idx.max() >= len(pos):
                errors.append(f"mesh {name}: bad indices")
            bad = int((np.abs(np.linalg.norm(nrm, axis=1) - 1) > 1e-3).sum())
            if bad:
                errors.append(f"mesh {name}: {bad} non-unit normals")

    names = [n.get("name") for n in doc.get("nodes", [])]
    for n in doc.get("nodes", []):
        nm = n.get("name")
        if nm is None or not ID_RE.match(nm):
            errors.append(f"node {nm!r}: name must be lower snake_case")
        elif names.count(nm) > 1:
            errors.append(f"node {nm}: duplicate name")
        if "mesh" in n:
            ex = n.get("extras") or {}
            if not ex.get("licence") or not ex.get("attribution"):
                errors.append(f"node {nm}: missing licence/attribution in extras")
    return errors


def main(paths: list[str]) -> int:
    failed = 0
    for p in paths:
        errs = check(Path(p))
        print(f"{p}: {'OK' if not errs else f'{len(errs)} problem(s)'}")
        for e in errs:
            print(f"  - {e}")
        failed += bool(errs)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
