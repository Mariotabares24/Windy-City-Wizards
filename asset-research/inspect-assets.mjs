import fs from 'node:fs';
import path from 'node:path';
const root = import.meta.dirname;
const bounds = vertices => {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const v of vertices) for (let axis = 0; axis < 3; axis++) {
    min[axis] = Math.min(min[axis], v[axis]); max[axis] = Math.max(max[axis], v[axis]);
  }
  return { min, max, size: max.map((n,i) => n-min[i]), center: max.map((n,i) => (n+min[i])/2) };
};
function inspectOBJ(file) {
  const text = fs.readFileSync(file, 'utf8');
  const vertices = [], faces = [], names = [];
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith('v ')) vertices.push(line.trim().split(/\s+/).slice(1).map(Number));
    if (line.startsWith('f ')) faces.push(line.trim().split(/\s+/).slice(1).map(v => Number(v.split('/')[0])-1));
    if (/^(?:o |g |usemtl |mtllib )/.test(line)) names.push(line);
  }
  const parent = vertices.map((_,i) => i);
  function find(i) { while(parent[i] !== i) {parent[i]=parent[parent[i]]; i=parent[i];} return i; }
  function union(a,b) { parent[find(a)] = find(b); }
  for (const face of faces) for (let i=1;i<face.length;i++) union(face[0],face[i]);
  // Weld exact coincident positions, because OBJ exporters can duplicate vertices at UV seams.
  const exact = new Map();
  vertices.forEach((v,i) => { const k=v.map(x=>x.toFixed(5)).join(','); if(exact.has(k)) union(i,exact.get(k)); else exact.set(k,i); });
  const groups = new Map();
  vertices.forEach((v,i) => { const k=find(i); if(!groups.has(k)) groups.set(k,{vertices:[],faces:0,faceIndices:[]}); groups.get(k).vertices.push(v); });
  faces.forEach((f,i) => { const g=groups.get(find(f[0])); g.faces++; g.faceIndices.push(i); });
  const components = [...groups.values()].map(g=>({vertexCount:g.vertices.length,faceCount:g.faces,faceIndices:g.faceIndices,...bounds(g.vertices)})).sort((a,b)=>b.faceCount-a.faceCount);
  return {file, names, vertexCount:vertices.length, faceCount:faces.length, triangles:faces.reduce((n,f)=>n+f.length-2,0), ...bounds(vertices), components};
}
function inspectGLB(file) {
  const b=fs.readFileSync(file),j=JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12)));
  return {file,bytes:b.length,nodes:j.nodes,meshes:j.meshes.map(m=>({name:m.name,primitives:m.primitives.map(p=>({material:j.materials[p.material]?.name,indices:j.accessors[p.indices]?.count,position:j.accessors[p.attributes.POSITION]}))})),materials:j.materials,images:j.images,extensionsUsed:j.extensionsUsed};
}
const result = {
  headphones:inspectOBJ(path.join(root,'headphones-source','Headphones','Headphones.obj')),
  shirt:inspectOBJ(path.join(root,'shirt-source','T-Shirt and Hanger','T-ShirtandHanger.obj')),
  chair:inspectGLB(path.join(root,'SheenChair.glb')),
  boombox:inspectGLB(path.join(root,'BoomBox.glb')),
};
const faceGroups=result.headphones.components.map(c=>({name:c.min[0]>0?'earcup_positive_x':c.max[0]<0?'earcup_negative_x':'headband',faceIndices:c.faceIndices}));
fs.writeFileSync(path.join(root,'headphones-face-groups.json'),JSON.stringify(faceGroups));
for (const item of [result.headphones,result.shirt]) for (const c of item.components) delete c.faceIndices;
fs.writeFileSync(path.join(root,'asset-metadata.json'),JSON.stringify(result,null,2));
console.log('Wrote asset-metadata.json and headphones-face-groups.json. Face indices refer to the zero-based order of f records in the original OBJ.');
