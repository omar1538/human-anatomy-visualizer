"""Readers for the raw datasets. Every loader returns meshes in the app frame:
metres, +Y up, +Z anterior (towards the viewer), +X = the subject's left.
"""
from __future__ import annotations

import csv
from pathlib import Path

import numpy as np
import trimesh

# --- BodyParts3D -------------------------------------------------------------
# Raw frame: millimetres, +Z up (feet ~0, vertex ~1640), -Y anterior, +X subject's left.
# (x, y, z) -> (x, z, -y) is a -90 degree rotation about X (det = +1, no mirroring).
BP3D_TO_APP = np.array(
    [
        [1, 0, 0, 0],
        [0, 0, 1, 0],
        [0, -1, 0, 0],
        [0, 0, 0, 1],
    ],
    dtype=float,
)
BP3D_SCALE = 0.001  # mm -> m

# Centre of the bounding box of every PART-OF element mesh (BodyParts3D 4.0, in mm),
# so that all system GLBs share one origin. Recompute with `build.py --body-centre`.
BP3D_BODY_CENTRE_MM = np.array([-0.647, -100.768, 781.624])

BP3D_LICENCE = "CC BY 4.0"
BP3D_ATTRIBUTION = (
    "BodyParts3D, (c) The Database Center for Life Science licensed under "
    "CC Attribution 4.0 International"
)


def bp3d_transform() -> np.ndarray:
    """4x4 matrix mapping raw BodyParts3D mm coordinates to app metres."""
    centre = np.eye(4)
    centre[:3, 3] = -BP3D_BODY_CENTRE_MM
    scale = np.diag([BP3D_SCALE] * 3 + [1.0])
    return scale @ BP3D_TO_APP @ centre


class BodyParts3D:
    """PART-OF tree of BodyParts3D 4.0 (99% reduced OBJ set)."""

    def __init__(self, root: Path):
        self.root = Path(root)
        self.obj_dir = self.root / "partof_BP3D_4.0_obj_99"
        if not self.obj_dir.is_dir():
            raise FileNotFoundError(f"missing {self.obj_dir} (unzip partof_BP3D_4.0_obj_99.zip)")
        self.names: dict[str, str] = {}
        self.elements: dict[str, list[str]] = {}
        with open(self.root / "partof_element_parts.txt", encoding="utf-8") as f:
            for row in csv.DictReader(f, delimiter="\t"):
                fma, fj = row["concept id"], row["element file id"]
                self.names[fma] = row["name"]
                self.elements.setdefault(fma, []).append(fj)

    def element_ids(self, include: list[str], exclude: list[str] | None = None) -> list[str]:
        """FJ element files for FMA concepts in `include`, minus those of `exclude`."""
        out: list[str] = []
        for fma in include:
            if fma not in self.elements:
                raise KeyError(f"BodyParts3D has no PART-OF concept {fma}")
            out += self.elements[fma]
        drop: set[str] = set()
        for fma in exclude or []:
            drop |= set(self.elements.get(fma, []))
        return sorted(set(out) - drop)

    def element_name(self, fj: str) -> str:
        with open(self.obj_dir / f"{fj}.obj", encoding="utf-8") as f:
            for line in f:
                if line.startswith("# English name"):
                    return line.split(":", 1)[1].strip()
                if not line.startswith("#"):
                    break
        return fj

    def load(self, include: list[str], exclude: list[str] | None = None) -> trimesh.Trimesh:
        fjs = self.element_ids(include, exclude)
        if not fjs:
            raise ValueError(f"no elements left for {include} minus {exclude}")
        parts = [
            trimesh.load(self.obj_dir / f"{fj}.obj", force="mesh", process=False) for fj in fjs
        ]
        mesh = trimesh.util.concatenate(parts)
        mesh.apply_transform(bp3d_transform())
        return mesh

    def body_centre_mm(self) -> np.ndarray:
        """Bounding-box centre of every element, read from the OBJ headers."""
        lo = np.full(3, np.inf)
        hi = np.full(3, -np.inf)
        for p in self.obj_dir.glob("*.obj"):
            with open(p, encoding="utf-8") as f:
                for line in f:
                    if line.startswith("# Bounds"):
                        a, b = line.split(":", 1)[1].strip().split(")-(")
                        lo = np.minimum(lo, [float(v) for v in a.strip("(").split(",")])
                        hi = np.maximum(hi, [float(v) for v in b.strip(")").split(",")])
                        break
        return (lo + hi) / 2


# --- HRA (HuBMAP Human Reference Atlas, CCF 3D Reference Object Library) -------
HRA_LICENCE = "CC BY 4.0"
HRA_ATTRIBUTION = (
    "HuBMAP CCF 3D Reference Object Library (Human Reference Atlas), CC BY 4.0"
)


class HRA:
    """Ready-made GLB organs. Already metres and +Y up, but in the HRA body frame
    (Visible Human), not the BodyParts3D one; place them with `register_to`."""

    def __init__(self, root: Path):
        self.root = Path(root)
        self._cache: dict[str, trimesh.Scene] = {}

    def scene(self, file: str) -> trimesh.Scene:
        if file not in self._cache:
            self._cache[file] = trimesh.load(self.root / file, force="scene")
        return self._cache[file]

    def load(self, file: str, nodes: list[str]) -> trimesh.Trimesh:
        scene = self.scene(file)
        parts = []
        for node in nodes:
            transform, geom = scene.graph[node]
            if geom is None:
                raise KeyError(f"{file}: node {node} has no mesh")
            m = scene.geometry[geom].copy()
            m.apply_transform(transform)
            parts.append(m)
        return trimesh.util.concatenate(parts)
