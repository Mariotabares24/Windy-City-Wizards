import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const sharp = require('C:/Users/Mario/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = import.meta.dirname;
const source = path.join(root, 'headphones-source', 'Headphones');
const output = path.join(root, 'headphones-ready');
await fs.mkdir(output, { recursive: true });

// glTF textures use top-left image coordinates. Flip OBJ's V instead of image rows.
const vertices = [], normals = [], uvs = [], faces = [];
for (const line of (await fs.readFile(path.join(source, 'Headphones.obj'), 'utf8')).split(/\r?\n/)) {
  const values = line.trim().split(/\s+/);
  if (values[0] === 'v') vertices.push(values.slice(1).map(Number));
  if (values[0] === 'vn') normals.push(values.slice(1).map(Number));
  if (values[0] === 'vt') uvs.push(values.slice(1).map(Number));
  if (values[0] === 'f') faces.push(values.slice(1).map(v => v.split('/').map(n => Number(n)-1)));
}
const faceGroups = JSON.parse(await fs.readFile(path.join(root, 'headphones-face-groups.json'), 'utf8'));
const center = [-0.000156, 87.7774925, 0];
const scale = 0.43 / 89.658638;
const semantics = {
  headband: { name: 'headband', pivot: center },
  earcup_positive_x: { name: 'right-ear', pivot: [36.0648775, 85, 0], foldZ: -1.1 },
  earcup_negative_x: { name: 'left-ear', pivot: [-36.06519, 85, 0], foldZ: 1.1 },
};

const base = await sharp(path.join(source, 'Mat_Base_Color.png')).resize(1024,1024).removeAlpha().jpeg({quality:92,chromaSubsampling:'4:4:4'}).toBuffer();
const emissive = await sharp(path.join(source, 'Mat_Emissive.png')).resize(1024,1024).removeAlpha().png().toBuffer();
const scalar = async file => (await sharp(path.join(source,file)).resize(1024,1024).removeAlpha().raw().toBuffer({resolveWithObject:true}));
const ao = await scalar('Mat_Mixed_AO.png'), rough = await scalar('Mat_Roughness.png'), metal = await scalar('Mat_Metallic.png');
const ormRaw=Buffer.alloc(1024*1024*3);
for (let p=0;p<1024*1024;p++) {
  ormRaw[p*3]=ao.data[p*ao.info.channels];
  ormRaw[p*3+1]=rough.data[p*rough.info.channels];
  ormRaw[p*3+2]=metal.data[p*metal.info.channels];
}
const orm = await sharp(ormRaw,{raw:{width:1024,height:1024,channels:3}}).png().toBuffer();
const normalData=await sharp(path.join(source,'Mat_Normal_DirectX.png')).resize(2048,2048).removeAlpha().raw().toBuffer({resolveWithObject:true});
const normalRaw=Buffer.alloc(2048*2048*3);
for(let p=0;p<2048*2048;p++) {
  const offset=p*normalData.info.channels;
  let x=normalData.data[offset]/127.5-1, y=-(normalData.data[offset+1]/127.5-1), z=normalData.data[offset+2]/127.5-1;
  const length=Math.hypot(x,y,z)||1; x/=length;y/=length;z/=length;
  normalRaw[p*3]=Math.round((x+1)*127.5); normalRaw[p*3+1]=Math.round((y+1)*127.5); normalRaw[p*3+2]=Math.round((z+1)*127.5);
}
const normal=await sharp(normalRaw,{raw:{width:2048,height:2048,channels:3}}).png().toBuffer();

const chunks=[],bufferViews=[],accessors=[],images=[],textures=[],meshes=[],nodes=[];
let byteLength=0;
function append(buffer,target) {
  const padding=(4-byteLength%4)%4;
  if(padding) {chunks.push(Buffer.alloc(padding));byteLength+=padding;}
  const view={buffer:0,byteOffset:byteLength,byteLength:buffer.length};
  if(target)view.target=target;
  bufferViews.push(view);chunks.push(buffer);byteLength+=buffer.length;
  return bufferViews.length-1;
}
function attribute(values,type) {
  const components=type==='VEC3'?3:2, bytes=Buffer.alloc(values.length*4);
  values.forEach((v,i)=>bytes.writeFloatLE(v,i*4));
  const view=append(bytes,34962);
  const accessor={bufferView:view,componentType:5126,count:values.length/components,type};
  if(type==='VEC3') {
    accessor.min=[Infinity,Infinity,Infinity];accessor.max=[-Infinity,-Infinity,-Infinity];
    values.forEach((v,i)=>{const a=i%3;accessor.min[a]=Math.min(accessor.min[a],v);accessor.max[a]=Math.max(accessor.max[a],v);});
  }
  accessors.push(accessor);return accessors.length-1;
}
for(const group of faceGroups) {
  const semantic=semantics[group.name], positions=[], surfaceNormals=[], texcoords=[];
  for(const faceIndex of group.faceIndices) {
    const face=faces[faceIndex];
    for(let i=1;i<face.length-1;i++) for(const indices of [face[0],face[i],face[i+1]]) {
      const position=vertices[indices[0]],normal=normals[indices[2]],uv=uvs[indices[1]];
      if(!position||!normal||!uv)throw new Error(`Missing OBJ data in face ${faceIndex}`);
      positions.push(...position.map((v,j)=>(v-semantic.pivot[j])*scale));
      surfaceNormals.push(...normal);texcoords.push(uv[0],1-uv[1]);
    }
  }
  meshes.push({name:semantic.name,primitives:[{attributes:{POSITION:attribute(positions,'VEC3'),NORMAL:attribute(surfaceNormals,'VEC3'),TEXCOORD_0:attribute(texcoords,'VEC2')},material:0,mode:4}]});
  nodes.push({name:semantic.name,mesh:meshes.length-1,translation:semantic.pivot.map((v,i)=>(v-center[i])*scale),extras:{sourceComponent:group.name,...(semantic.foldZ!==undefined?{suggestedFoldRotationZ:semantic.foldZ}: {})}});
  const objLines=['# CC0 Headphones by nisu. Part geometry is local to its hinge/pivot; see metadata.json for translation.','mtllib headphones.mtl',`o ${semantic.name}`];
  for(let i=0;i<positions.length;i+=3)objLines.push(`v ${positions.slice(i,i+3).join(' ')}`);
  for(let i=0;i<texcoords.length;i+=2)objLines.push(`vt ${texcoords[i]} ${1-texcoords[i+1]}`);
  for(let i=0;i<surfaceNormals.length;i+=3)objLines.push(`vn ${surfaceNormals.slice(i,i+3).join(' ')}`);
  objLines.push('usemtl HeadphonesPBR',`g ${semantic.name}`);
  for(let v=1;v<=positions.length/3;v+=3)objLines.push(`f ${v}/${v}/${v} ${v+1}/${v+1}/${v+1} ${v+2}/${v+2}/${v+2}`);
  await fs.writeFile(path.join(output,`${semantic.name}.obj`),objLines.join('\n'));
}
for(const [name,data,mimeType] of [['headphones-basecolor.jpg',base,'image/jpeg'],['headphones-orm.png',orm,'image/png'],['headphones-normal-gl.png',normal,'image/png'],['headphones-emissive.png',emissive,'image/png']]) {
  images.push({name,mimeType,bufferView:append(data)});textures.push({source:images.length-1,sampler:0});
  await fs.writeFile(path.join(output,name),data);
}
const gltf={
  asset:{version:'2.0',generator:'Codex OBJ/PBR conversion, 2026-09-09',copyright:'Headphones by nisu (2020), CC0 1.0 Universal. Source: https://opengameart.org/content/headphones'},
  scene:0,scenes:[{name:'Cosmic Together Headphones',nodes:nodes.map((_,i)=>i)}],nodes,meshes,
  materials:[{name:'Headphones PBR',pbrMetallicRoughness:{baseColorFactor:[1,1,1,1],baseColorTexture:{index:0},roughnessFactor:1,metallicFactor:1,metallicRoughnessTexture:{index:1}},normalTexture:{index:2,scale:1},occlusionTexture:{index:1,strength:1},emissiveTexture:{index:3},emissiveFactor:[1,1,1]}],
  samplers:[{magFilter:9729,minFilter:9987,wrapS:10497,wrapT:10497}],images,textures,accessors,bufferViews,buffers:[{byteLength}],
  extras:{source:'https://opengameart.org/content/headphones',license:'CC0-1.0',widthMeters:0.43,centeredOnBounds:true,upAxis:'Y',partNames:['headband','right-ear','left-ear'],normalConvention:'OpenGL (+Y), converted from DirectX',changes:'Separated connected components; inferred earcup hinge pivots; normalized width to 0.43 m and centered bounding box; resized textures; combined ORM; inverted and normalized normal-map Y.'}
};
const json=Buffer.from(JSON.stringify(gltf)), jsonPad=(4-json.length%4)%4,bin=Buffer.concat(chunks),binPad=(4-bin.length%4)%4;
const header=Buffer.alloc(12);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(12+8+json.length+jsonPad+8+bin.length+binPad,8);
const jsonHeader=Buffer.alloc(8);jsonHeader.writeUInt32LE(json.length+jsonPad,0);jsonHeader.writeUInt32LE(0x4e4f534a,4);
const binHeader=Buffer.alloc(8);binHeader.writeUInt32LE(bin.length+binPad,0);binHeader.writeUInt32LE(0x004e4942,4);
const glb=Buffer.concat([header,jsonHeader,json,Buffer.alloc(jsonPad,0x20),binHeader,bin,Buffer.alloc(binPad)]);
await fs.writeFile(path.join(output,'headphones.glb'),glb);
await fs.writeFile(path.join(output,'headphones.mtl'),'# CC0 Headphones by nisu. For full PBR use GLB, or bind ORM/normal/emissive maps manually.\nnewmtl HeadphonesPBR\nKd 1 1 1\nKs 0.04 0.04 0.04\nNs 100\nd 1\nillum 2\nmap_Kd headphones-basecolor.jpg\n');
await fs.copyFile(path.join(root,'CC0-1.0-legalcode.txt'),path.join(output,'CC0-1.0.txt'));
await fs.writeFile(path.join(output,'metadata.json'),JSON.stringify({bytes:glb.length,scale,sourceCenter:center,worldSize:[0.43,78.427467*scale,33.646312*scale],nodes:gltf.nodes,extras:gltf.extras,textures:await Promise.all(images.map(async image=>({name:image.name,...await sharp(path.join(output,image.name)).metadata()})))},null,2));
await fs.writeFile(path.join(output,'ATTRIBUTION.md'),'# Headphones\n\nOriginal model and textures by nisu, published 2020-11-15, CC0 1.0 Universal.\n\nSource: https://opengameart.org/content/headphones\n\nOriginal download: https://opengameart.org/sites/default/files/headphones_0.zip\n\nAttribution is optional under CC0. This conversion separates the three mesh components, adds inferred earcup hinge pivots, sets width to 0.43 metres, centres the bounding box, resizes maps, packs ORM and converts DirectX normals to OpenGL.\n');
console.log(JSON.stringify({output,bytes:glb.length,triangles:faces.length,width:0.43,height:78.427467*scale,depth:33.646312*scale,nodes},null,2));
