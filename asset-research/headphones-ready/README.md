# Prepared headphones

Use `headphones.glb` (4,939,324 bytes). It contains the geometry and all optimized PBR maps.

Three named mesh nodes are directly accessible after GLTFLoader:

```js
const headband = gltf.scene.getObjectByName('headband');
const rightEar = gltf.scene.getObjectByName('right-ear');
const leftEar = gltf.scene.getObjectByName('left-ear');

// Inward fold, from unfolded rotation zero. The pivots are already in the model.
rightEar.rotation.z = -1.1 * foldAmount;
leftEar.rotation.z = 1.1 * foldAmount;
```

The authored axes are X width, Y up, Z depth. Dimensions: 0.43 × 0.376135658 × 0.161366651 metres. Overall bounding box center is [0,0,0]. Cup hinge positions are inferred from geometry rather than authored manufacturer joints.

Keep the imported material for PBR detail. The normal texture has already been converted from DirectX to OpenGL and normalized; use normalScale [1,1]. The ORM image packs ambient occlusion in R, roughness in G, and metallic in B. All textures are 1024 square, except the 2048-square normal map. Base color and emissive are sRGB; ORM and normals are linear.

## OBJ fallback

Individual `headband.obj`, `right-ear.obj`, and `left-ear.obj` files use the same local geometry/pivots as the GLB. Apply these translations to the objects after OBJLoader:

| File | Translation |
| --- | --- |
| headband.obj | [0, 0, 0] |
| right-ear.obj | [0.17296676316898768, -0.013320766427435552, 0] |
| left-ear.obj | [-0.17296676556697194, -0.013320766427435552, 0] |

OBJ UVs preserve the original bottom-left convention; TextureLoader's default flipY=true is appropriate. The MTL supplies the base color path. For full PBR with OBJLoader, create one MeshStandardMaterial with the supplied basecolor, ORM, normal and emissive maps, metalness=1, roughness=1, and emissive=white. The same ORM texture can supply roughnessMap, metalnessMap and aoMap.

The original source files, archive, and license page remain intact one directory above. `ATTRIBUTION.md` gives creator/source and changes; `CC0-1.0.txt` is the full license. `metadata.json` contains node transforms and texture sizes. `verification.json` records successful Three GLTFLoader geometry/hierarchy/bounds checks; browser GPU appearance is to be verified during integration.
