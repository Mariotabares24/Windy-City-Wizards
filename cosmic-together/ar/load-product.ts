import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import type { Product } from '@/lib/catalog';

let sharedLoader: GLTFLoader | null = null;
function gltfLoader() {
  if (sharedLoader) return sharedLoader;
  const draco = new DRACOLoader();
  draco.setDecoderPath('/draco/');
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);
  loader.setMeshoptDecoder(MeshoptDecoder);
  sharedLoader = loader;
  return loader;
}

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

// Target height in scene units for each product family. Every GLB gets
// uniformly scaled so its bounding box height matches this, then re-centered
// on the ground plane. Keeps camera framing and pose-anchor math consistent
// across models we did not author.
const TARGET_HEIGHT: Record<Product['model'], number> = {
  garment: 0.9,
  chair: 0.8,
  headphones: 0.22,
  watch: 0.08,
};

export async function loadProduct(p: Product) {
  const { scene } = await gltfLoader().loadAsync(p.glb);
  scene.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    o.castShadow = true;
    o.receiveShadow = true;
    const materials = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of materials) {
      if (!(m instanceof THREE.MeshStandardMaterial)) continue;
      if (m.map) m.map.anisotropy = 8;
      if (m.normalMap) m.normalMap.anisotropy = 8;
    }
  });

  // Normalize scale + ground the model so unrelated GLBs frame consistently.
  const bounds = new THREE.Box3().setFromObject(scene);
  const size = bounds.getSize(new THREE.Vector3());
  if (size.y > 0.0001) scene.scale.setScalar(TARGET_HEIGHT[p.model] / size.y);
  bounds.setFromObject(scene);
  const center = bounds.getCenter(new THREE.Vector3());
  scene.position.set(-center.x, -bounds.min.y, -center.z);
  const group = new THREE.Group();
  group.add(scene);
  return group;
}
