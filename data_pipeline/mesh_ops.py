"""Mesh clean-up, decimation and registration."""
from __future__ import annotations

import fast_simplification
import numpy as np
import trimesh
from scipy.spatial import cKDTree


def clean(mesh: trimesh.Trimesh, min_component_faces: int = 0) -> trimesh.Trimesh:
    """Weld duplicate vertices, drop degenerate/duplicate faces and unused vertices,
    and optionally drop small floating fragments. Run `finish` after decimation."""
    mesh = mesh.copy()
    mesh.merge_vertices(merge_tex=True, merge_norm=True)
    mesh.update_faces(mesh.nondegenerate_faces())
    mesh.update_faces(mesh.unique_faces())
    mesh.remove_unreferenced_vertices()
    if min_component_faces > 0:
        parts = mesh.split(only_watertight=False)
        keep = [p for p in parts if len(p.faces) >= min_component_faces]
        if keep and len(keep) < len(parts):
            mesh = trimesh.util.concatenate(keep)
    return mesh


def finish(mesh: trimesh.Trimesh) -> trimesh.Trimesh:
    """Final pass after decimation: consistent winding (needed for back-face culling
    and for slicing caps) and fresh smooth normals. fix_winding is slow on large
    non-manifold meshes (~36 s on the 163k-face HRA heart), so run it on the
    decimated mesh only."""
    mesh = mesh.copy()
    mesh.merge_vertices()
    closed = mesh.is_watertight
    trial = mesh.copy()
    trial.update_faces(trial.nondegenerate_faces())
    # Dropping zero-area faces can open a closed mesh; keep them in that case
    # (they are invisible, and their vertices get valid normals below).
    if trial.is_watertight or not closed:
        mesh = trial
    mesh.remove_unreferenced_vertices()
    if mesh.is_watertight:
        mesh.fix_normals()  # consistent winding and outward-facing
    else:
        trimesh.repair.fix_winding(mesh)  # consistent winding only
    # Rebuilding from vertices/faces drops any stale normals carried over from the
    # source; smooth normals are then computed from the final faces.
    out = trimesh.Trimesh(vertices=mesh.vertices, faces=mesh.faces, process=False)
    normals = np.array(out.vertex_normals)
    # Where adjacent faces cancel out (folds, opposing sheets) the averaged normal is
    # ~zero; glTF requires unit normals, so fall back to one adjacent face's normal.
    bad = np.linalg.norm(normals, axis=1) < 0.5
    if bad.any():
        first_face = np.full(len(out.vertices), -1)
        first_face[out.faces[:, ::-1].ravel()] = np.repeat(np.arange(len(out.faces)), 3)
        normals[bad] = out.face_normals[first_face[bad]]
        still = np.linalg.norm(normals, axis=1) < 0.5
        normals[still] = [0.0, 1.0, 0.0]
        out.vertex_normals = normals / np.linalg.norm(normals, axis=1, keepdims=True)
    return out


def _simplify(mesh: trimesh.Trimesh, target: int, agg: int) -> trimesh.Trimesh:
    v, f = fast_simplification.simplify(
        mesh.vertices.astype(np.float32),
        mesh.faces.astype(np.int32),
        target_reduction=1.0 - target / len(mesh.faces),
        agg=agg,
    )
    out = trimesh.Trimesh(vertices=v, faces=f, process=False)
    out.merge_vertices()
    return out


def decimate(mesh: trimesh.Trimesh, max_faces: int) -> trimesh.Trimesh:
    """Quadric decimation down to about `max_faces` triangles.

    A closed (watertight) input stays closed: slicing caps need closed meshes.
    Aggressive decimation can open or fold a closed mesh, so try the default
    aggressiveness, then a gentler one, then raise the target by 25 % until the
    result is closed (worst case: the mesh is returned undecimated).
    """
    n = len(mesh.faces)
    if max_faces <= 0 or n <= max_faces:
        return mesh
    keep_closed = mesh.is_watertight
    target = max_faces
    while target < n:
        for agg in (7, 3):
            out = _simplify(mesh, target, agg)
            if not keep_closed or out.is_watertight:
                return out
        target = int(target * 1.25)
    return mesh


def register(moving: trimesh.Trimesh, target: trimesh.Trimesh, samples: int = 4000):
    """Similarity transform (rotation, uniform scale, translation) that fits `moving`
    onto `target`: bounding-box pre-alignment, then ICP.

    Returns (matrix, mean_error_m). Pre-alignment assumes both are already in the
    app frame (same up/forward axes), so ICP only has to refine.
    """
    scale = float(np.cbrt(np.prod(target.extents) / np.prod(moving.extents)))
    init = np.eye(4)
    init[:3, :3] *= scale
    init[:3, 3] = target.bounding_box.centroid - scale * moving.bounding_box.centroid
    pts = moving.sample(samples, seed=0)
    # Dense point samples of the target: ICP then uses a KD-tree (scipy), no rtree needed.
    dense = target.sample(samples * 10, seed=1)
    matrix, moved, _ = trimesh.registration.icp(
        pts, dense, initial=init, threshold=1e-7, max_iterations=60, reflection=False, scale=True
    )
    dist, _ = cKDTree(dense).query(moved)
    return matrix, float(dist.mean())
