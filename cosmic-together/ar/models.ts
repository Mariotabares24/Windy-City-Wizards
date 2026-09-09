import * as THREE from 'three';
import type { Product } from '@/lib/catalog';
import { colorHex } from '@/lib/catalog';
function mesh(
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
  return m;
}
function fabric(color: string) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const c = canvas.getContext('2d')!;
  // A finer, woven-looking weave: alternating warp/weft threads plus fine noise.
  // Written straight into an ImageData buffer to stay off the main thread hot path.
  const image = c.createImageData(512, 512);
  const data = image.data;
  let seed = 19;
  let i = 0;
  for (let y = 0; y < 512; y++)
    for (let x = 0; x < 512; x++) {
      seed = (seed * 16807) % 2147483647;
      const weave = ((x % 4 < 2 ? 1 : 0) ^ (y % 4 < 2 ? 1 : 0)) ? 26 : 0;
      const v = 96 + (seed % 40) + weave;
      data[i++] = v;
      data[i++] = v;
      data[i++] = v;
      data[i++] = 255;
    }
  c.putImageData(image, 0, 0);
  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(6, 4);
  map.anisotropy = 8;
  // Physical sheen gives cloth its soft grazing highlight under the studio HDRI.
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.9,
    metalness: 0,
    bumpMap: map,
    bumpScale: 0.0026,
    sheen: 0.6,
    sheenColor: new THREE.Color(color).lerp(new THREE.Color('#efe6d7'), 0.4),
    sheenRoughness: 0.85,
  });
}
export function makeProduct(p: Product, color: string) {
  const group = new THREE.Group();
  const surface = colorHex[color] || color;
  const cloth = fabric(surface);
  const metal = new THREE.MeshStandardMaterial({
    color: '#85818b',
    metalness: 0.86,
    roughness: 0.25,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: '#17171c',
    roughness: 0.65,
  });
  const shell = new THREE.MeshStandardMaterial({
    color: surface,
    metalness: 0.25,
    roughness: 0.34,
  });
  const highlight = new THREE.MeshStandardMaterial({
    color: '#e1d9cf',
    roughness: 0.9,
  });
  if (p.model === 'garment') {
    const torso = new THREE.CylinderGeometry(0.29, 0.255, 0.7, 44, 12);
    torso.scale(1, 1, 0.46);
    group.add(mesh(torso, cloth, 0, -0.04, 0));
    for (const side of [-1, 1]) {
      const sleeve = mesh(
        new THREE.CylinderGeometry(0.105, 0.077, 0.59, 24),
        cloth,
        side * 0.35,
        -0.03,
        0,
      );
      sleeve.rotation.z = side * 0.24;
      group.add(sleeve);
      const shape = new THREE.Shape();
      shape.moveTo(side * 0.055, 0.3);
      shape.lineTo(side * 0.2, 0.34);
      shape.lineTo(side * 0.12, 0.06);
      shape.lineTo(side * 0.02, -0.14);
      shape.closePath();
      const lapel = mesh(
        new THREE.ExtrudeGeometry(shape, {
          depth: 0.018,
          bevelEnabled: true,
          bevelSize: 0.005,
          bevelThickness: 0.005,
          bevelSegments: 2,
          steps: 1,
        }),
        new THREE.MeshStandardMaterial({ color: surface, roughness: 0.64 }),
        0,
        0,
        0.135,
      );
      group.add(lapel);
      const pocket = mesh(
        new THREE.BoxGeometry(0.14, 0.014, 0.014),
        cloth,
        side * 0.155,
        -0.2,
        0.145,
      );
      group.add(pocket);
    }
    const shirt = mesh(
      new THREE.CylinderGeometry(0.11, 0.075, 0.38, 3),
      highlight,
      0,
      0.145,
      0.125,
    );
    shirt.rotation.y = Math.PI / 2;
    shirt.scale.z = 0.25;
    group.add(shirt);
    for (let i = 0; i < 2; i++)
      group.add(
        mesh(
          new THREE.SphereGeometry(0.012, 12, 12),
          dark,
          0.035,
          -0.1 - i * 0.1,
          0.15,
        ),
      );
  } else if (p.model === 'lamp') {
    group.add(
      mesh(
        new THREE.CylinderGeometry(0.19, 0.19, 0.035, 64),
        shell,
        0,
        0.018,
        0,
      ),
    );
    group.add(
      mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 1.27, 24),
        metal,
        0,
        0.66,
        0,
      ),
    );
    const shadeMat = new THREE.MeshPhysicalMaterial({
      bumpMap: cloth.bumpMap,
      bumpScale: 0.0016,
      color: surface,
      roughness: 0.85,
      metalness: 0,
      sheen: 0.7,
      sheenColor: new THREE.Color(surface).lerp(new THREE.Color('#fff1d6'), 0.5),
      sheenRoughness: 0.8,
      side: THREE.DoubleSide,
      emissive: '#e7c489',
      emissiveIntensity: 0.22,
    });
    group.add(
      mesh(
        new THREE.CylinderGeometry(0.14, 0.19, 0.3, 64, 1, true),
        shadeMat,
        0,
        1.43,
        0,
      ),
    );
    group.add(
      mesh(
        new THREE.SphereGeometry(0.04, 16, 16),
        new THREE.MeshStandardMaterial({
          color: '#fff1c9',
          emissive: '#ffc777',
          emissiveIntensity: 1,
        }),
        0,
        1.37,
        0,
      ),
    );
    for (const y of [1.281, 1.579]) {
      const rim = mesh(
        new THREE.TorusGeometry(y < 1.4 ? 0.19 : 0.14, 0.003, 10, 96),
        cloth,
        0,
        y,
        0,
      );
      rim.rotation.x = Math.PI / 2;
      group.add(rim);
    }
    const cableCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.01, 0.03, 0),
      new THREE.Vector3(0.16, 0.014, -0.09),
      new THREE.Vector3(0.27, 0.007, -0.14),
      new THREE.Vector3(0.34, 0.007, -0.29),
    ]);
    group.add(
      mesh(new THREE.TubeGeometry(cableCurve, 40, 0.0025, 6, false), dark),
    );
    const switchButton = mesh(
      new THREE.CylinderGeometry(0.013, 0.013, 0.018, 24),
      metal,
      0.019,
      1.22,
      0,
    );
    switchButton.rotation.z = Math.PI / 2;
    group.add(switchButton);
    const light = new THREE.PointLight('#ffdc9a', 1.2, 2);
    light.position.set(0, 1.35, 0);
    group.add(light);
  } else if (p.model === 'chair') {
    const cushion = mesh(
      new THREE.BoxGeometry(0.62, 0.16, 0.64, 4, 2, 4),
      cloth,
      0,
      0.43,
      0,
    );
    group.add(cushion);
    const back = mesh(
      new THREE.BoxGeometry(0.62, 0.48, 0.13, 4, 4, 2),
      cloth,
      0,
      0.64,
      -0.28,
    );
    back.rotation.x = -0.1;
    group.add(back);
    for (const s of [-1, 1]) {
      group.add(
        mesh(
          new THREE.BoxGeometry(0.09, 0.23, 0.61),
          cloth,
          s * 0.315,
          0.55,
          0,
        ),
      );
      for (const z of [-0.24, 0.24])
        group.add(
          mesh(
            new THREE.CylinderGeometry(0.021, 0.015, 0.37, 16),
            metal,
            s * 0.26,
            0.185,
            z,
          ),
        );
    }
  } else if (p.model === 'headphones') {
    const band = mesh(
      new THREE.TorusGeometry(0.19, 0.019, 16, 64, Math.PI),
      shell,
      0,
      0.03,
      0,
    );
    group.add(band);
    const pad = mesh(
      new THREE.TorusGeometry(0.17, 0.017, 16, 64, Math.PI),
      dark,
      0,
      0.03,
      0,
    );
    group.add(pad);
    for (const s of [-1, 1]) {
      const ear = new THREE.Group();
      ear.name = s === 1 ? 'right-ear' : 'left-ear';
      ear.position.set(s * 0.175, -0.065, 0);
      const cup = mesh(
        new THREE.CylinderGeometry(0.071, 0.066, 0.06, 40),
        shell,
      );
      cup.rotation.z = Math.PI / 2;
      cup.scale.z = 1.23;
      ear.add(cup);
      const foam = mesh(
        new THREE.TorusGeometry(0.05, 0.018, 16, 40),
        dark,
        -s * 0.035,
        0,
        0,
      );
      foam.rotation.y = Math.PI / 2;
      foam.scale.y = 1.23;
      ear.add(foam);
      if (s === 1) {
        ear.add(
          mesh(
            new THREE.BoxGeometry(0.008, 0.014, 0.03),
            metal,
            0.035,
            -0.036,
            0.01,
          ),
        );
        ear.add(
          mesh(
            new THREE.BoxGeometry(0.008, 0.007, 0.023),
            metal,
            0.035,
            -0.011,
            0.028,
          ),
        );
      }
      group.add(ear);
    }
  } else {
    group.add(
      mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.23, 96), cloth, 0, 0.115, 0),
    );
    group.add(
      mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.012, 96), dark, 0, 0.235, 0),
    );
    for (const x of [-0.032, 0.032]) {
      group.add(
        mesh(
          new THREE.BoxGeometry(0.022, 0.002, 0.004),
          highlight,
          x,
          0.243,
          0,
        ),
      );
      if (x > 0)
        group.add(
          mesh(
            new THREE.BoxGeometry(0.004, 0.002, 0.022),
            highlight,
            x,
            0.243,
            0,
          ),
        );
    }
  }
  if (p.model === 'speaker') {
    const rimMat = new THREE.MeshStandardMaterial({
      color: '#343b36',
      roughness: 0.68,
    });
    for (const y of [0.009, 0.226]) {
      const rim = mesh(
        new THREE.TorusGeometry(y < 0.02 ? 0.108 : 0.1, 0.0025, 10, 96),
        rimMat,
        0,
        y,
        0,
      );
      rim.rotation.x = Math.PI / 2;
      group.add(rim);
    }
    group.add(
      mesh(
        new THREE.CylinderGeometry(0.105, 0.096, 0.011, 96),
        dark,
        0,
        0.006,
        0,
      ),
    );
    const led = mesh(
      new THREE.TorusGeometry(0.079, 0.0008, 8, 96),
      new THREE.MeshStandardMaterial({
        color: '#abd5c4',
        emissive: '#71bd9b',
        emissiveIntensity: 0.6,
      }),
      0,
      0.242,
      0,
    );
    led.rotation.x = Math.PI / 2;
    group.add(led);
    const play = new THREE.Shape();
    play.moveTo(-0.004, -0.006);
    play.lineTo(0.006, 0);
    play.lineTo(-0.004, 0.006);
    play.closePath();
    const icon = mesh(new THREE.ShapeGeometry(play), highlight, 0, 0.244, 0);
    icon.rotation.x = -Math.PI / 2;
    group.add(icon);
    const socket = mesh(
      new THREE.BoxGeometry(0.017, 0.007, 0.005),
      dark,
      0,
      0.038,
      -0.107,
    );
    group.add(socket);
    group.add(
      mesh(new THREE.BoxGeometry(0.012, 0.002, 0.005), metal, 0, 0.038, -0.11),
    );
    // Individually recessed grille perforations catch grazing studio light.
    const grille = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.001, 5, 4),
      dark,
      48 * 18,
    );
    const dummy = new THREE.Object3D();
    let idx = 0;
    for (let row = 0; row < 18; row++)
      for (let col = 0; col < 48; col++) {
        const a = ((col + (row % 2) * 0.5) / 48) * Math.PI * 2,
          y = 0.023 + row * 0.011,
          r = 0.11 - (y / 0.23) * 0.01;
        dummy.position.set(Math.sin(a) * r, y, Math.cos(a) * r);
        dummy.scale.set(1, 0.8, 1);
        dummy.updateMatrix();
        grille.setMatrixAt(idx++, dummy.matrix);
      }
    group.add(grille);
  }
  return group;
}
export function makeGhostHand() {
  const hand = new THREE.Group();
  const mat = new THREE.MeshPhysicalMaterial({
    color: '#b9e4d1',
    transparent: true,
    opacity: 0.4,
    roughness: 0.2,
    metalness: 0.1,
    depthWrite: false,
  });
  hand.add(mesh(new THREE.SphereGeometry(0.055, 24, 16), mat, 0, 0, 0));
  hand.children[0].scale.set(0.8, 1.25, 0.32);
  const joints: THREE.Group[] = [];
  const tip = new THREE.Object3D();
  tip.name = 'index-fingertip';
  for (let i = 0; i < 4; i++) {
    const finger = new THREE.Group();
    finger.position.set((i - 1.5) * 0.021, 0.052, 0);
    const first = mesh(
      new THREE.CapsuleGeometry(0.009, 0.035, 6, 12),
      mat,
      0,
      0.02,
      0,
    );
    finger.add(first);
    const distal = new THREE.Group();
    distal.position.y = 0.043;
    distal.add(
      mesh(new THREE.CapsuleGeometry(0.008, 0.027, 6, 12), mat, 0, 0.018, 0),
    );
    finger.add(distal);
    hand.add(finger);
    if (i === 0) {
      tip.position.set(0, 0.039, 0);
      distal.add(tip);
    }
    if (i === 3) finger.scale.y = 0.76;
    if (i === 1) finger.scale.y = 1.08;
    joints.push(distal);
  }
  const thumb = mesh(
    new THREE.CapsuleGeometry(0.012, 0.04, 6, 12),
    mat,
    -0.057,
    0.01,
    0,
  );
  thumb.rotation.z = -0.65;
  hand.add(thumb);
  const wrist = mesh(
    new THREE.CylinderGeometry(0.032, 0.042, 0.12, 20),
    mat,
    0,
    -0.1,
    0,
  );
  wrist.scale.z = 0.55;
  hand.add(wrist);
  return { hand, joints, tip };
}
