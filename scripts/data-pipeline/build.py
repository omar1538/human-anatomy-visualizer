"""Conversion pipeline: raw datasets -> one GLB per body system.

    python scripts/data-pipeline/build.py --config scripts/data-pipeline/config/heart.json

For every structure in the config: load (BodyParts3D concepts or HRA nodes),
place in the app frame, clean, decimate, finish, then group under its parent and
export one GLB per system. Writes `build-report.json` next to the GLBs with the
provenance of every node (feeds organs.json stubs and ATTRIBUTION.md).

See scripts/data-pipeline/README.md for the config format.
"""
from __future__ import annotations

import argparse
import json
import struct
import sys
import time
from pathlib import Path

import numpy as np
import trimesh

from mesh_ops import clean, decimate, finish, register
from sources import (
    BP3D_ATTRIBUTION,
    BP3D_LICENCE,
    HRA,
    HRA_ATTRIBUTION,
    HRA_LICENCE,
    BodyParts3D,
)

REPO = Path(__file__).resolve().parents[2]
ID_OK = set("abcdefghijklmnopqrstuvwxyz0123456789_")


def hex_to_rgba(h: str) -> list[float]:
    h = h.lstrip("#")
    return [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)] + [1.0]


def check_config(cfg: dict) -> None:
    systems = {s["id"] for s in cfg["systems"]}
    seen: set[str] = set(systems)
    for s in cfg["structures"]:
        sid = s["id"]
        if not set(sid) <= ID_OK:
            raise ValueError(f"id '{sid}': use lower snake_case (a-z, 0-9, _) only")
        if sid in seen:
            raise ValueError(f"duplicate id '{sid}'")
        if s["system"] not in systems:
            raise ValueError(f"'{sid}': unknown system '{s['system']}'")
        parent = s.get("parent")
        if parent and parent not in seen:
            raise ValueError(f"'{sid}': parent '{parent}' must be declared before it")
        seen.add(sid)


class Builder:
    def __init__(self, raw: Path):
        self.raw = raw
        self._bp3d: BodyParts3D | None = None
        self._hra: HRA | None = None
        self._registrations: dict[tuple, tuple[np.ndarray, float]] = {}

    @property
    def bp3d(self) -> BodyParts3D:
        if self._bp3d is None:
            self._bp3d = BodyParts3D(self.raw / "bodyparts3d")
        return self._bp3d

    @property
    def hra(self) -> HRA:
        if self._hra is None:
            self._hra = HRA(self.raw / "hra")
        return self._hra

    def hra_placement(self, file: str, target_fma: list[str]) -> tuple[np.ndarray, float]:
        """Fit the whole HRA organ (all nodes of `file`) onto the BodyParts3D concept
        so that every part of that organ gets the same transform."""
        key = (file, tuple(target_fma))
        if key not in self._registrations:
            scene = self.hra.scene(file)
            whole = decimate(clean(self.hra.load(file, list(scene.graph.nodes_geometry))), 40000)
            target = clean(self.bp3d.load(target_fma))
            self._registrations[key] = register(whole, target)
        return self._registrations[key]

    def load(self, s: dict) -> tuple[trimesh.Trimesh, dict]:
        src = s["source"]
        if src["type"] == "bp3d":
            mesh = self.bp3d.load(src["fma"], src.get("exclude_fma"))
            prov = {
                "dataset": "BodyParts3D 4.0 (PART-OF, 99%)",
                "fma": src["fma"],
                "exclude_fma": src.get("exclude_fma", []),
                "licence": BP3D_LICENCE,
                "attribution": BP3D_ATTRIBUTION,
            }
        elif src["type"] == "hra":
            mesh = self.hra.load(src["file"], src["nodes"])
            prov = {
                "dataset": f"HRA CCF 3D Reference Object Library ({src['file']})",
                "nodes": src["nodes"],
                "licence": HRA_LICENCE,
                "attribution": HRA_ATTRIBUTION,
            }
            if "register_to" in src:
                matrix, err = self.hra_placement(src["file"], src["register_to"])
                mesh.apply_transform(matrix)
                prov["registered_to_fma"] = src["register_to"]
                prov["registration_mean_error_mm"] = round(err * 1000, 2)
        else:
            raise ValueError(f"unknown source type {src['type']}")
        return mesh, prov


def clip_y(mesh: trimesh.Trimesh, y_min: float | None, y_max: float | None) -> trimesh.Trimesh:
    """Cut a mesh with horizontal planes and close the cut (keeps vessels watertight)."""
    if y_min is not None:
        mesh = mesh.slice_plane(plane_origin=[0, y_min, 0], plane_normal=[0, 1, 0], cap=True)
    if y_max is not None:
        mesh = mesh.slice_plane(plane_origin=[0, y_max, 0], plane_normal=[0, -1, 0], cap=True)
    if len(mesh.faces) == 0:
        raise ValueError(f"clip_y [{y_min}, {y_max}] removed the whole mesh")
    return mesh


def build(cfg: dict, raw: Path, out: Path) -> dict:
    check_config(cfg)
    out.mkdir(parents=True, exist_ok=True)
    builder = Builder(raw)
    defaults = cfg.get("defaults", {})
    report: dict = {"config": cfg.get("name"), "systems": {}, "structures": []}

    # Origin: default is the whole-body centre (sources.py). "origin": {"bp3d_centre_of": [FMA...]}
    # moves the origin to the bounding-box centre of those concepts instead (e.g. the heart).
    offset = np.zeros(3)
    if "bp3d_centre_of" in cfg.get("origin", {}):
        offset = -builder.bp3d.load(cfg["origin"]["bp3d_centre_of"]).bounding_box.centroid
        report["origin_offset_m"] = np.round(offset, 5).tolist()

    scenes: dict[str, trimesh.Scene] = {}
    extras: dict[str, dict] = {}
    for sys_ in cfg["systems"]:
        scene = trimesh.Scene()
        scene.graph.update(frame_from=scene.graph.base_frame, frame_to=sys_["id"])
        scenes[sys_["id"]] = scene
        extras[sys_["id"]] = {"kind": "system"}

    for s in cfg["structures"]:
        sid, scene = s["id"], scenes[s["system"]]
        parent = s.get("parent") or s["system"]
        rec = {"id": sid, "system": s["system"], "parent": parent, "label": s.get("label", sid)}
        if "source" not in s:  # pure grouping node, e.g. "heart"
            scene.graph.update(frame_from=parent, frame_to=sid)
            extras[sid] = {"kind": "group"}
            report["structures"].append(rec | {"kind": "group"})
            continue

        t0 = time.time()
        mesh, prov = builder.load(s)
        raw_faces = len(mesh.faces)
        mesh.apply_translation(offset)
        if "clip_y" in s:
            mesh = clip_y(mesh, *s["clip_y"])
            prov["clipped_y_m"] = s["clip_y"]
        mesh = clean(mesh, s.get("min_component_faces", defaults.get("min_component_faces", 0)))
        mesh = decimate(mesh, s.get("max_faces", defaults.get("max_faces", 0)))
        mesh = finish(mesh)
        colour = s.get("color", defaults.get("color", "#cccccc"))
        mesh.visual = trimesh.visual.TextureVisuals(
            material=trimesh.visual.material.PBRMaterial(
                name=sid,
                baseColorFactor=hex_to_rgba(colour),
                metallicFactor=0.0,
                roughnessFactor=0.6,
                doubleSided=s.get("double_sided", False),
            )
        )
        scene.add_geometry(mesh, node_name=sid, geom_name=sid, parent_node_name=parent)
        extras[sid] = {"kind": "structure", **prov}
        rec |= {
            "kind": "structure",
            "faces_raw": raw_faces,
            "faces": len(mesh.faces),
            "watertight": bool(mesh.is_watertight),
            "bounds_m": np.round(mesh.bounds, 4).tolist(),
            **prov,
        }
        report["structures"].append(rec)
        print(f"  {sid:40s} {raw_faces:7d} -> {len(mesh.faces):6d} faces  {time.time() - t0:5.1f}s")

    for sys_id, scene in scenes.items():
        if not scene.geometry:
            continue
        path = out / f"{sys_id}.glb"
        scene.export(path, include_normals=True)
        annotate(path, extras)
        n = sum(len(g.faces) for g in scene.geometry.values())
        report["systems"][sys_id] = {"file": path.name, "faces": n, "bytes": path.stat().st_size}
        print(f"{path.name}: {n} faces, {path.stat().st_size / 1e6:.2f} MB")

    (out / "build-report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report


def annotate(path: Path, extras: dict[str, dict]) -> None:
    """Add provenance to node extras and the attribution lines to asset.copyright.

    Patches the GLB JSON chunk in place (pygltflib overwrites `asset` on save).
    GLB layout: 12-byte header, then chunks of [length u32, type u32, data],
    each padded to 4 bytes (JSON with spaces, BIN with zeros)."""
    data = path.read_bytes()
    magic, version, _ = struct.unpack_from("<4sII", data, 0)
    if magic != b"glTF" or version != 2:
        raise ValueError(f"{path} is not a glTF 2.0 binary")
    json_len, json_type = struct.unpack_from("<II", data, 12)
    if json_type != 0x4E4F534A:  # 'JSON'
        raise ValueError(f"{path}: first chunk is not JSON")
    doc = json.loads(data[20 : 20 + json_len])
    rest = data[20 + json_len :]  # BIN chunk, untouched

    used = set()
    for node in doc.get("nodes", []):
        if node.get("name") in extras:
            node["extras"] = extras[node["name"]]
            used.add(node["name"])
    attributions = sorted({extras[n]["attribution"] for n in used if "attribution" in extras[n]})
    doc["asset"]["generator"] = "human-anatomy-visualizer data-pipeline"
    doc["asset"]["copyright"] = " | ".join(attributions)

    blob = json.dumps(doc, separators=(",", ":")).encode("utf-8")
    blob += b" " * (-len(blob) % 4)
    total = 12 + 8 + len(blob) + len(rest)
    path.write_bytes(
        struct.pack("<4sII", b"glTF", 2, total) + struct.pack("<II", len(blob), 0x4E4F534A) + blob + rest
    )


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--config", type=Path, required=True)
    ap.add_argument("--raw", type=Path, default=REPO / "data" / "raw")
    ap.add_argument("--out", type=Path, default=REPO / "data" / "out")
    ap.add_argument("--body-centre", action="store_true", help="print the BodyParts3D body centre and exit")
    args = ap.parse_args(argv)
    if args.body_centre:
        print(BodyParts3D(args.raw / "bodyparts3d").body_centre_mm())
        return 0
    cfg = json.loads(args.config.read_text(encoding="utf-8"))
    build(cfg, args.raw, args.out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
