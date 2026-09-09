import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { makeProduct } from './models';
import { makeGarment } from './garment';
import { colorHex, type Product } from '@/lib/catalog';

export function disposeObject(root: THREE.Object3D) {
  const textures = new Set<THREE.Texture>(),
    materials = new Set<THREE.Material>();
  root.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    o.geometry.dispose();
    for (const material of Array.isArray(o.material)
      ? o.material
      : [o.material]) {
      materials.add(material);
      for (const value of Object.values(material))
        if (value instanceof THREE.Texture) textures.add(value);
    }
  });
  textures.forEach((t) => t.dispose());
  materials.forEach((m) => m.dispose());
}
export function controlAnchor(
  parent: THREE.Object3D,
  name: string,
  position: THREE.Vector3,
  normal: THREE.Vector3,
) {
  const anchor = new THREE.Object3D();
  anchor.name = name;
  anchor.position.copy(position);
  anchor.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    normal.normalize(),
  );
  parent.add(anchor);
  return anchor;
}
export async function loadProduct(p: Product, color: string) {
  if (p.model === 'garment')
    return makeGarment(colorHex[color] || color, p.kind);
  if (p.model !== 'chair' && p.model !== 'headphones') {
    const result = makeProduct(p, color);
    if (p.model === 'speaker') {
      controlAnchor(
        result,
        'control-0',
        new THREE.Vector3(0, 0.247, 0),
        new THREE.Vector3(0, 1, 0),
      );
      controlAnchor(
        result,
        'control-1',
        new THREE.Vector3(0.032, 0.247, 0),
        new THREE.Vector3(0, 1, 0),
      );
      controlAnchor(
        result,
        'control-2',
        new THREE.Vector3(0, 0.247, 0),
        new THREE.Vector3(0, 1, 0),
      );
    }
    return result;
  }
  const { scene } = await new GLTFLoader().loadAsync(
    '/models/' + (p.model === 'chair' ? 'chair' : 'headphones') + '.glb',
  );
  const tint = colorHex[color] || color;
  scene.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    o.castShadow = true;
    o.receiveShadow = true;
    const materials = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of materials) {
      if (!(m instanceof THREE.MeshStandardMaterial)) continue;
      if (p.model === 'chair' && /fabric/i.test(m.name)) {
        m.color.set(tint);
        m.metalness = 0;
        if (m instanceof THREE.MeshPhysicalMaterial) {
          m.sheen = 0.75;
          m.sheenColor.set(tint);
          m.sheenRoughness = 0.8;
        }
      }
      // Preserve dark cushions and metal details in the authored texture.
      if (p.model === 'headphones' && color !== p.color)
        m.color.set(tint).lerp(new THREE.Color('#fff'), 0.35);
      if (m.map) m.map.anisotropy = 8;
      if (m.normalMap) m.normalMap.anisotropy = 8;
    }
  });
  if (p.model === 'chair') {
    const bounds = new THREE.Box3().setFromObject(scene),
      size = bounds.getSize(new THREE.Vector3());
    scene.scale.setScalar(0.8 / size.y);
    bounds.setFromObject(scene);
    const center = bounds.getCenter(new THREE.Vector3());
    scene.position.set(-center.x, -bounds.min.y, -center.z);
    const group = new THREE.Group();
    group.add(scene);
    return group;
  }
  const ear = scene.getObjectByName('right-ear');
  if (ear) {
    const material = new THREE.MeshStandardMaterial({
      color: '#b4afa5',
      metalness: 0.75,
      roughness: 0.33,
    });
    // Controls are children of the cup hinge. Both the control and guide follow its fold.
    for (const [i, y, z] of [
      [0, -0.127, 0.025],
      [1, -0.091, 0.057],
    ]) {
      const control = new THREE.Mesh(
        new THREE.BoxGeometry(0.006, 0.013, i === 0 ? 0.019 : 0.027),
        material,
      );
      control.position.set(0.043, y, z);
      control.castShadow = true;
      ear.add(control);
      controlAnchor(
        ear,
        'control-' + i,
        new THREE.Vector3(0.047, y, z),
        new THREE.Vector3(1, 0, 0),
      );
    }
    controlAnchor(
      ear,
      'control-2',
      new THREE.Vector3(0.049, -0.075, 0.012),
      new THREE.Vector3(1, 0, 0),
    );
  }
  return scene;
}
