import * as THREE from 'three';

function textile(color: string, shirt: boolean) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  // Fine per-pixel weave: a tight twill for shirting, a denser slub for wool.
  // Filled via ImageData (one pass, no per-pixel string parse).
  const image = ctx.createImageData(512, 512);
  const data = image.data;
  let seed = 127;
  let i = 0;
  const cell = shirt ? 3 : 5;
  const weaveHi = shirt ? 12 : 20;
  const range = shirt ? 40 : 70;
  for (let y = 0; y < 512; y++)
    for (let x = 0; x < 512; x++) {
      seed = (seed * 16807) % 2147483647;
      const weave =
        ((Math.floor(x / cell) % 2 < 1 ? 1 : 0) ^
        (Math.floor(y / cell) % 2 < 1 ? 1 : 0))
          ? weaveHi
          : 0;
      const v = 100 + (seed % range) + weave;
      data[i++] = v;
      data[i++] = v;
      data[i++] = v;
      data[i++] = 255;
    }
  ctx.putImageData(image, 0, 0);
  const bumpMap = new THREE.CanvasTexture(canvas);
  bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(3, 3);
  bumpMap.anisotropy = 8;
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: shirt ? 0.76 : 0.95,
    metalness: 0,
    bumpMap,
    bumpScale: shirt ? 0.0007 : 0.0018,
    sheen: shirt ? 0.14 : 0.5,
    sheenColor: new THREE.Color(color).lerp(new THREE.Color('#eee6d7'), 0.35),
    sheenRoughness: 0.8,
    side: THREE.DoubleSide,
  });
}
function add(
  group: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  group.add(m);
  return m;
}
function seam(
  group: THREE.Group,
  points: number[][],
  material: THREE.Material,
  radius = 0.0013,
) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(...(p as [number, number, number]))),
  );
  return add(
    group,
    new THREE.TubeGeometry(curve, 40, radius, 5, false),
    material,
  );
}
function panel(
  group: THREE.Group,
  outline: number[][],
  material: THREE.Material,
  z: number,
) {
  const shape = new THREE.Shape(
    outline.map((p) => new THREE.Vector2(p[0], p[1])),
  );
  return add(
    group,
    new THREE.ExtrudeGeometry(shape, {
      depth: 0.003,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelThickness: 0.0015,
      bevelSize: 0.0015,
      steps: 1,
    }),
    material,
    0,
    0,
    z,
  );
}
export function makeGarment(color: string, kind: string) {
  const group = new THREE.Group();
  const shirt = kind === 'shirt',
    coat = kind === 'coat';
  const cloth = textile(color, shirt),
    trim = textile(
      new THREE.Color(color).multiplyScalar(0.8).getStyle(),
      shirt,
    );
  const thread = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color).multiplyScalar(0.73),
    roughness: 1,
  });
  const button = new THREE.MeshPhysicalMaterial({
    color: shirt ? '#e9e6de' : '#302a24',
    roughness: 0.32,
    clearcoat: 0.3,
  });
  const bottom = coat ? -0.66 : shirt ? -0.42 : -0.4;
  // Sewn torso: shaped shoulders, narrower waist and subtle vertical fabric folds.
  const vertices: number[] = [],
    uvs: number[] = [],
    indices: number[] = [];
  const rows = 72,
    cols = 96;
  for (let j = 0; j <= rows; j++) {
    const t = j / rows,
      y = THREE.MathUtils.lerp(0.34, bottom, t);
    const width =
      t < 0.12
        ? THREE.MathUtils.lerp(0.095, 0.252, t / 0.12)
        : t < 0.54
          ? THREE.MathUtils.lerp(0.252, 0.211, (t - 0.12) / 0.42)
          : THREE.MathUtils.lerp(
              0.211,
              coat ? 0.274 : 0.244,
              (t - 0.54) / 0.46,
            );
    const depth =
      t < 0.12
        ? THREE.MathUtils.lerp(0.071, 0.105, t / 0.12)
        : 0.102 + Math.sin(t * Math.PI) * 0.012;
    for (let i = 0; i <= cols; i++) {
      const theta = (i / cols) * Math.PI * 2;
      const fold =
        (Math.sin(theta * 12 + t * 5) * 0.0024 +
          Math.sin(theta * 23 - t * 4) * 0.0011) *
        Math.sin(t * Math.PI);
      const x = Math.sin(theta) * (width + fold),
        z = Math.cos(theta) * (depth + fold);
      const hem = shirt ? Math.cos(theta * 2) * 0.012 * Math.pow(t, 12) : 0;
      vertices.push(x, y + hem, z);
      uvs.push(i / cols, t);
      if (j < rows && i < cols) {
        const a = j * (cols + 1) + i,
          b = a + cols + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  const torso = new THREE.BufferGeometry();
  torso.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  torso.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  torso.setIndex(indices);
  torso.computeVertexNormals();
  add(group, torso, cloth);
  // Inner neck binding and the shoulder seam remain visible from above.
  const neck = add(
    group,
    new THREE.TorusGeometry(0.088, 0.004, 8, 64),
    trim,
    0,
    0.342,
    0,
  );
  neck.rotation.x = Math.PI / 2;
  neck.scale.y = 0.78;
  for (const side of [-1, 1]) {
    const sleeve = new THREE.Group();
    sleeve.position.set(side * 0.242, 0.245, 0);
    sleeve.rotation.z = side * 0.2;
    group.add(sleeve);
    const length = coat ? 0.62 : 0.6;
    const geo = new THREE.CylinderGeometry(0.082, 0.056, length, 48, 44, true);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i),
        t = (length / 2 - y) / length;
      const wrinkle =
        0.0022 *
        Math.sin(t * 45 + Math.atan2(pos.getZ(i), pos.getX(i)) * 2) *
        Math.exp(-Math.pow((t - 0.6) * 5, 2));
      pos.setXYZ(
        i,
        pos.getX(i) * (1 + wrinkle * 12),
        y,
        pos.getZ(i) * 0.93 + Math.sin(t * Math.PI) * 0.018 + wrinkle,
      );
    }
    geo.computeVertexNormals();
    add(sleeve, geo, cloth, side * 0.012, -length / 2, 0);
    add(
      sleeve,
      new THREE.CylinderGeometry(
        0.057,
        0.056,
        shirt ? 0.057 : 0.025,
        48,
        1,
        true,
      ),
      trim,
      side * 0.012,
      -length + 0.025,
      0,
    );
    for (let i = 0; i < (shirt ? 1 : 4); i++) {
      const b = add(
        sleeve,
        new THREE.CylinderGeometry(0.0045, 0.0045, 0.002, 16),
        button,
        side * 0.05,
        -length + 0.022 + i * 0.015,
        0.033,
      );
      b.rotation.x = Math.PI / 2;
    }
    seam(
      group,
      [
        [side * 0.093, 0.333, 0.017],
        [side * 0.17, 0.296, 0.058],
        [side * 0.239, 0.247, 0.048],
      ],
      thread,
    );
    seam(
      group,
      [
        [side * 0.245, 0.1, 0],
        [side * 0.214, -0.16, 0],
        [side * (coat ? 0.268 : 0.24), bottom + 0.01, 0],
      ],
      thread,
    );
    if (!shirt) {
      const pts = [
        [side * 0.044, 0.335],
        [side * 0.13, 0.3],
        [side * 0.164, 0.198],
        [side * 0.131, 0.184],
        [side * 0.168, 0.16],
        [side * 0.034, -0.13],
      ];
      panel(group, pts, trim, 0.115);
      seam(
        group,
        [
          [side * 0.044, 0.335, 0.12],
          [side * 0.13, 0.3, 0.12],
          [side * 0.164, 0.198, 0.12],
          [side * 0.131, 0.184, 0.12],
          [side * 0.168, 0.16, 0.12],
          [side * 0.034, -0.13, 0.12],
        ],
        thread,
        0.0009,
      );
      panel(
        group,
        [
          [side * 0.071, -0.17],
          [side * 0.2, -0.157],
          [side * 0.204, -0.196],
          [side * 0.072, -0.206],
        ],
        cloth,
        0.115,
      );
      seam(
        group,
        [
          [side * 0.072, -0.205, 0.12],
          [side * 0.139, -0.202, 0.12],
          [side * 0.202, -0.194, 0.12],
        ],
        thread,
        0.001,
      );
    } else {
      panel(
        group,
        [
          [side * 0.018, 0.34],
          [side * 0.097, 0.318],
          [side * 0.12, 0.226],
          [side * 0.043, 0.253],
        ],
        cloth,
        0.107,
      );
    }
  }
  if (shirt) {
    panel(
      group,
      [
        [-0.011, 0.255],
        [0.012, 0.255],
        [0.012, bottom + 0.02],
        [-0.011, bottom + 0.02],
      ],
      trim,
      0.119,
    );
    panel(
      group,
      [
        [0.094, 0.14],
        [0.181, 0.14],
        [0.177, 0.034],
        [0.137, 0.02],
        [0.097, 0.034],
      ],
      cloth,
      0.111,
    );
    seam(
      group,
      [
        [0.097, 0.137, 0.118],
        [0.099, 0.034, 0.118],
        [0.137, 0.024, 0.118],
        [0.177, 0.034, 0.113],
        [0.18, 0.137, 0.113],
      ],
      thread,
      0.0009,
    );
  } else {
    const lining = textile('#dedacf', true);
    panel(
      group,
      [
        [-0.043, 0.3],
        [0.043, 0.3],
        [0.022, -0.03],
        [0, -0.12],
        [-0.022, -0.03],
      ],
      lining,
      0.117,
    );
    panel(
      group,
      [
        [0.097, 0.149],
        [0.194, 0.166],
        [0.194, 0.155],
        [0.099, 0.137],
      ],
      trim,
      0.12,
    );
  }
  const count = shirt ? 7 : coat ? 4 : 2;
  for (let i = 0; i < count; i++) {
    const y = shirt ? 0.225 - i * 0.092 : -0.135 - i * (coat ? 0.13 : 0.105),
      x = shirt ? 0 : 0.027,
      z = 0.127;
    const b = add(
      group,
      new THREE.CylinderGeometry(
        shirt ? 0.005 : 0.009,
        shirt ? 0.005 : 0.009,
        0.003,
        24,
      ),
      button,
      x,
      y,
      z,
    );
    b.rotation.x = Math.PI / 2;
    for (const dx of [-0.0016, 0.0016])
      for (const dy of [-0.0016, 0.0016])
        add(
          group,
          new THREE.SphereGeometry(0.0008, 5, 4),
          thread,
          x + dx,
          y + dy,
          z + 0.0025,
        );
  }
  seam(
    group,
    [
      [0, 0.265, -0.108],
      [0, -0.05, -0.12],
      [0, bottom + 0.016, -0.105],
    ],
    thread,
    0.001,
  );
  return group;
}
