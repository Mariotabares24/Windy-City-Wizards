# Reusable product model research

Verified 2026-09-09. Research files only; no site files were modified.

## Ready GLB assets

### Sheen Chair

- Source and license: https://github.com/KhronosGroup/glTF-Sample-Assets/blob/main/Models/SheenChair/README.md
- Download: https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SheenChair/glTF-Binary/SheenChair.glb
- Local: `SheenChair.glb`; 4,125,648 bytes; 39,936 triangles.
- CC0 1.0 Universal. Creator: Eric Chadwick; copyright 2020 Wayfair, LLC.
- Local source license statement: `SheenChair-README.md`, Legal section.
- Four meshes: `SheenChair_fabric`, `SheenChair_wood`, `SheenChair_metal`, `SheenChair_label`.
- Y up. Overall bounds approximately [-0.4140224, -0.00006978, -0.2767251] to [0.412535578, 0.6861773, 0.293540359]. Width/height/depth: 0.826558 / 0.686247 / 0.570265.
- Six materials include Mango Velvet and Peacock Velvet alternatives. Preserve imported sheen, normal maps, UV transforms, and wood texture for realism.
- Embedded texture images: seven. Extensions: KHR_texture_transform, KHR_materials_sheen, KHR_materials_variants.

### BoomBox

- Source and license: https://github.com/KhronosGroup/glTF-Sample-Assets/blob/main/Models/BoomBox/README.md
- Download: https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/BoomBox/glTF-Binary/BoomBox.glb
- Local: `BoomBox.glb`; 10,614,184 bytes; 6,036 triangles.
- CC0 1.0 Universal. Creator: Microsoft; public domain dedication, 2017.
- Local source license statement: `BoomBox-README.md`, Legal section.
- One mesh/node `BoomBox`; material `BoomBox_Mat`; four embedded PBR texture images; no extensions required.
- Local bounds: [-0.009921154, -0.00977163, -0.0100762453] to [0.009921154, 0.00977163, 0.0100762453]. Node has quaternion [0,1,0,0] (180 degrees about Y). Normalize by bounding box; authored scale is tiny.
- The model is a compact box-like portable radio/speaker, not a smart cylindrical speaker.

## Detailed headphones: straightforward OBJ integration

- Source/license: https://opengameart.org/content/headphones
- Exact download: https://opengameart.org/sites/default/files/headphones_0.zip
- Local archive: `headphones.zip`; extracted source: `headphones-source/Headphones/`.
- CC0 1.0 Universal. Creator: nisu, published 2020-11-15. Attribution optional.
- Source license page saved as `headphones-source-license.html`; official full CC0 text saved as `CC0-1.0-legalcode.txt`.
- OBJ: 318,699 bytes, 1668 vertices, 3324 triangles. One group `Headphones`, material `Mat`.
- The OBJ has THREE disconnected components: headband (1204 triangles), +X earcup (1060), -X earcup (1060). Components remain separable by face connectivity even though group names are not split.
- Whole bounds: [-44.829475,48.563759,-16.823156] to [44.829163,126.991226,16.823156]. Center approximately [0,87.7774925,0]. X width, Y up, Z thickness, inferred from symmetric component bounds and creator preview.
- Ear centers: [36.0648775,67.894829,0] and [-36.06519,67.894829,0]. Suggested hinge anchor near [+-36,85,0] before normalization; this anchor is an inference, not an authored joint.
- The supplied MTL references absent `Mat_Color.tif`. Bind actual PBR PNG maps manually. All maps share the source directory:
  - Base color: `Mat_Base_Color.png` (3,749,238 bytes; sRGB)
  - Roughness: `Mat_Roughness.png` (4,816,957 bytes; linear)
  - Metalness: `Mat_Metallic.png` (25,188 bytes; linear)
  - Normal: `Mat_Normal_DirectX.png` (23,580,416 bytes; linear). DirectX normal convention: invert Y in Three.js using normalScale.y = -1, or flip green during offline conversion.
  - Emissive: `Mat_Emissive.png` (81,920 bytes; sRGB)
  - AO: `Mat_Mixed_AO.png` (3,823,086 bytes; linear)
  - Height: `Mat_Height.png` (5,766,085 bytes; optional; unnecessary for initial browser model)
- The normal file exceeds the target size; resize textures to 1K or 2K before bundling. Preserve normal/roughness detail rather than replacing all materials with a flat color.

## Clothing findings and limitations

### Existing CC0 shirt mesh

- Source/license: https://opengameart.org/content/t-shirt-and-hanger
- Exact download: https://opengameart.org/sites/default/files/T-Shirt%20and%20Hanger.zip
- Local archive: `shirt-and-hanger.zip`; extracted: `shirt-source/T-Shirt and Hanger/`.
- CC0 1.0 Universal. Creator: plaggy, published 2015-08-12. Attribution optional.
- Source license page saved as `shirt-source-license.html`.
- OBJ is 113,831 bytes, 719 vertices, 1024 quad faces (2048 triangulated), one connected group `MB_T_ShirtHanger_bmp001`.
- Bounds: [-4.8332,-9.8425,-21.1899] to [11.1463,9.8425,-20.4954]. Very thin garment: width 15.9795, height 19.685, depth 0.6945; center [3.15655,0,-20.84265]. OBJ appears Y-up from coordinates; DAE declares Z_UP, so evaluate actual OBJ orientation separately.
- Supplied textures: `MB_T-ShirtHangerTexture1.jpg`, `MB_TShirtTexture(shadow).png`. No full normal/roughness PBR set.
- Viewed creator preview: basic white T-shirt on hanger, lightly folded and faceted, not a realistic blazer/coat. This is only a fallback and should not be presented as a detailed fashion upgrade.

### Better clothing candidates without verified direct downloads

- Newer plaggy "CC0 - Shirt On Hanger" on Fab: https://www.fab.com/listings/a1608a3e-1838-422e-9ed2-dc290f1b319a . Creator states CC0; includes 4K PBR shirt maps and 2K hanger maps plus converted GLB. A direct unauthenticated file URL was not established.
- Open Pattern Standard Fit T-Shirt: https://openpattern.io/product/standard-fit-t-shirt/ . Creator states free under CC BY, credit Open Pattern; CLO-authored garment and GLB provided through free-price checkout. A direct public GLB URL was not established, so no file size or geometry quality verification was possible.
- Open Pattern US Tactical Smock: https://openpattern.io/product/us-tactical-smock/ . CC BY stated by creator, GLB included, same checkout limitation.
- No suitably realistic blazer/coat with both an exact accessible download URL and unambiguous permissive license was established in this bounded research.

## Excluded wall lamp

`AnisotropyBarnLamp.glb` (7,833,440 bytes) and `AnisotropyBarnLamp-README.md` are also present for research. It is a copper WALL barn lamp, not a floor lamp; do not substitute it for the floor lamp. License CC BY 4.0; attribution would be "Anisotropy Barn Lamp by Eric Chadwick, © 2023 Wayfair, LLC, CC BY 4.0".

Full inspected nodes/materials/accessor bounds and component geometry metadata: `asset-metadata.json`. Reproducible read-only inspector: `inspect-assets.mjs`.
