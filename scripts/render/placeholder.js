// Track A: a temporary stand-in body so the viewer works before Track B delivers real models.
// Follows the data contract: every selectable mesh is named with its organ id
// and carries userData.system. Delete usage once real GLB packs are available.
import * as THREE from 'three/webgpu';

const COLORS = { skeleton: 0xe8e1cf, muscles: 0xb5443b, organs: 0xd98b8b, vessels: 0x4a6fa5 };

function mesh(geometry, system, id, color, position, scale = [1, 1, 1]) {
  const m = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.05 }),
  );
  m.name = id;
  m.userData.system = system;
  m.position.set(...position);
  m.scale.set(...scale);
  return m;
}

export function createPlaceholderBody() {
  const body = new THREE.Group();
  body.name = 'placeholder-body';

  // skeleton
  body.add(
    mesh(
      new THREE.SphereGeometry(0.17, 24, 16),
      'skeleton',
      'skull',
      COLORS.skeleton,
      [0, 1.62, 0],
    ),
  );
  body.add(
    mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 1.0, 12),
      'skeleton',
      'spine',
      COLORS.skeleton,
      [0, 1.0, -0.08],
    ),
  );
  body.add(
    mesh(
      new THREE.TorusGeometry(0.2, 0.02, 8, 24),
      'skeleton',
      'ribcage',
      COLORS.skeleton,
      [0, 1.25, 0],
      [1, 1.2, 0.9],
    ),
  );
  body.add(
    mesh(
      new THREE.CylinderGeometry(0.045, 0.04, 0.9, 12),
      'skeleton',
      'femur_left',
      COLORS.skeleton,
      [-0.13, 0.35, 0],
    ),
  );
  body.add(
    mesh(
      new THREE.CylinderGeometry(0.045, 0.04, 0.9, 12),
      'skeleton',
      'femur_right',
      COLORS.skeleton,
      [0.13, 0.35, 0],
    ),
  );

  // muscles
  body.add(
    mesh(
      new THREE.CapsuleGeometry(0.2, 0.55, 8, 16),
      'muscles',
      'torso_muscles',
      COLORS.muscles,
      [0, 1.05, 0.02],
      [1.1, 1, 0.6],
    ),
  );
  body.add(
    mesh(
      new THREE.CapsuleGeometry(0.07, 0.6, 8, 12),
      'muscles',
      'thigh_left',
      COLORS.muscles,
      [-0.13, 0.4, 0],
    ),
  );
  body.add(
    mesh(
      new THREE.CapsuleGeometry(0.07, 0.6, 8, 12),
      'muscles',
      'thigh_right',
      COLORS.muscles,
      [0.13, 0.4, 0],
    ),
  );

  // organs
  body.add(
    mesh(
      new THREE.SphereGeometry(0.06, 20, 16),
      'organs',
      'heart',
      0xc0392b,
      [0.04, 1.28, 0.06],
      [1, 1.2, 1],
    ),
  );
  body.add(
    mesh(
      new THREE.SphereGeometry(0.09, 20, 16),
      'organs',
      'lung_left',
      0xe8a0a0,
      [0.12, 1.3, 0.02],
      [0.8, 1.5, 0.8],
    ),
  );
  body.add(
    mesh(
      new THREE.SphereGeometry(0.09, 20, 16),
      'organs',
      'lung_right',
      0xe8a0a0,
      [-0.12, 1.3, 0.02],
      [0.8, 1.5, 0.8],
    ),
  );
  body.add(
    mesh(
      new THREE.SphereGeometry(0.1, 20, 16),
      'organs',
      'liver',
      0x7b3f2a,
      [-0.1, 1.05, 0.05],
      [1.4, 0.8, 0.9],
    ),
  );
  body.add(
    mesh(
      new THREE.SphereGeometry(0.07, 20, 16),
      'organs',
      'stomach',
      0xd98b6a,
      [0.09, 1.02, 0.06],
      [1, 1.3, 0.9],
    ),
  );

  // vessels
  body.add(
    mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.8, 8),
      'vessels',
      'aorta',
      COLORS.vessels,
      [0.01, 1.1, -0.02],
    ),
  );

  return body;
}
