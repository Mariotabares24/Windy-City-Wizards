import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { GLTFLoader } from '../cosmic-together/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { Texture, Box3, Vector3 } from '../cosmic-together/node_modules/three/build/three.module.js';
const bytes=await fs.readFile(path.join(import.meta.dirname,'headphones-ready','headphones.glb'));
assert.equal(bytes.readUInt32LE(0),0x46546c67);
assert.equal(bytes.readUInt32LE(8),bytes.length);
const json=JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12)));
const bufferStart=20+bytes.readUInt32LE(12)+8;
for(const view of json.bufferViews)assert.ok(view.byteOffset+view.byteLength<=json.buffers[0].byteLength);
for(const img of json.images) {
  const view=json.bufferViews[img.bufferView], data=bytes.subarray(bufferStart+view.byteOffset,bufferStart+view.byteOffset+view.byteLength);
  if(img.mimeType==='image/png')assert.equal(data.subarray(1,4).toString(),'PNG');
  if(img.mimeType==='image/jpeg')assert.equal(data.readUInt16BE(0),0xffd8);
}
// Decode geometry and hierarchy with actual Three GLTFLoader. Texture byte formats are
// verified above; GPU image decoding is left for the application's browser preview.
const loader=new GLTFLoader();
loader.register(()=>({name:'node-texture-stub',loadTexture:()=>Promise.resolve(new Texture())}));
const gltf=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
gltf.scene.updateMatrixWorld(true);
const box=new Box3().setFromObject(gltf.scene),size=box.getSize(new Vector3()),center=box.getCenter(new Vector3());
assert.ok(Math.abs(size.x-.43)<1e-6);assert.ok(center.length()<1e-6);
for(const name of ['headband','right-ear','left-ear'])assert.ok(gltf.scene.getObjectByName(name));
assert.equal(gltf.scene.getObjectByName('right-ear').geometry.attributes.position.count/3,1060);
assert.equal(gltf.scene.getObjectByName('left-ear').geometry.attributes.position.count/3,1060);
gltf.scene.getObjectByName('right-ear').rotation.z=-1.1;
gltf.scene.getObjectByName('left-ear').rotation.z=1.1;
gltf.scene.updateMatrixWorld(true);
const foldedBox=new Box3().setFromObject(gltf.scene);
const result={valid:true,bytes:bytes.length,dimensions:size.toArray(),center:center.toArray(),unfoldedBounds:[box.min.toArray(),box.max.toArray()],foldedBounds:[foldedBox.min.toArray(),foldedBox.max.toArray()],parts:gltf.scene.children.map(n=>n.name),browserVisualCheck:'Pending parent integration'};
await fs.writeFile(path.join(import.meta.dirname,'headphones-ready','verification.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
