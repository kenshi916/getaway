"""Import the selected CC0 Kenney city models from their original ZIPs.

Palette textures are sampled into linear vertex colors, preserving geometry,
normals, and the artist's shading while making the GLBs self-contained.
Usage: python checks/import-city-assets.py /path/to/downloaded-zip-directory
"""
import io
import json
import struct
import sys
from pathlib import Path
from zipfile import ZipFile
from PIL import Image

SOURCE = Path(sys.argv[1])
DEST = Path(__file__).resolve().parents[1] / 'dist/assets/models/city'
SELECTION = {
    'industrial': ['building-' + c for c in 'abfgkqrt'] + [
        'water-tower', 'shipping-container-a', 'shipping-container-b',
        'solar-panel-landscape-group', 'detail-tank'],
    'suburban': ['building-type-' + c for c in 'acfgkmoq'],
    'nature': ['tree_oak', 'tree_detailed', 'tree_palmDetailedTall',
               'plant_bushDetailed', 'flower_redA'],
}

def linear(v):
    v /= 255
    return v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4

def bake(raw, palette):
    json_size = struct.unpack_from('<I', raw, 12)[0]
    doc = json.loads(raw[20:20 + json_size])
    binary = bytearray(raw[28 + json_size:])
    for mesh in doc.get('meshes', []):
        for primitive in mesh['primitives']:
            pbr = doc['materials'][primitive.get('material', 0)].get('pbrMetallicRoughness', {})
            if not pbr.get('baseColorTexture'):
                continue
            accessor = doc['accessors'][primitive['attributes']['TEXCOORD_0']]
            assert accessor['componentType'] == 5126 and accessor['type'] == 'VEC2'
            view = doc['bufferViews'][accessor['bufferView']]
            start = view.get('byteOffset', 0) + accessor.get('byteOffset', 0)
            stride = view.get('byteStride', 8)
            colors = []
            for i in range(accessor['count']):
                u, v = struct.unpack_from('<ff', binary, start + i * stride)
                x = max(0, min(palette.width - 1, int(u * palette.width)))
                y = max(0, min(palette.height - 1, int(v * palette.height)))
                colors.extend(linear(c) for c in palette.getpixel((x, y))[:3])
            binary.extend(b'\0' * (-len(binary) % 4))
            offset = len(binary)
            binary.extend(struct.pack('<' + 'f' * len(colors), *colors))
            view_index = len(doc['bufferViews'])
            doc['bufferViews'].append({'buffer': 0, 'byteOffset': offset,
                                      'byteLength': len(colors) * 4, 'target': 34962})
            color_index = len(doc['accessors'])
            doc['accessors'].append({'bufferView': view_index, 'componentType': 5126,
                                     'count': accessor['count'], 'type': 'VEC3'})
            primitive['attributes']['COLOR_0'] = color_index
    for material in doc.get('materials', []):
        pbr = material.setdefault('pbrMetallicRoughness', {})
        pbr.pop('baseColorTexture', None)
        pbr['metallicFactor'] = 0
        pbr['roughnessFactor'] = .86
    for key in ['textures', 'images', 'samplers']:
        doc.pop(key, None)
    doc['extensionsUsed'] = [e for e in doc.get('extensionsUsed', [])
                             if e != 'KHR_texture_transform']
    doc['extensionsRequired'] = [e for e in doc.get('extensionsRequired', [])
                                 if e != 'KHR_texture_transform']
    doc['buffers'][0]['byteLength'] = len(binary)
    encoded = json.dumps(doc, separators=(',', ':')).encode()
    encoded += b' ' * (-len(encoded) % 4)
    binary.extend(b'\0' * (-len(binary) % 4))
    length = 28 + len(encoded) + len(binary)
    return (struct.pack('<III', 0x46546C67, 2, length) +
            struct.pack('<II', len(encoded), 0x4E4F534A) + encoded +
            struct.pack('<II', len(binary), 0x004E4942) + binary)

for pack, names in SELECTION.items():
    target = DEST / pack
    target.mkdir(parents=True, exist_ok=True)
    with ZipFile(SOURCE / ('city-' + pack + '.zip')) as archive:
        palette_names = [n for n in archive.namelist()
                         if n.endswith('/Textures/colormap.png') and 'GLB' in n]
        palette = Image.open(io.BytesIO(archive.read(palette_names[0]))).convert('RGB') if palette_names else None
        for name in names:
            entry = next(n for n in archive.namelist() if n.endswith('/' + name + '.glb'))
            (target / (name + '.glb')).write_bytes(bake(archive.read(entry), palette))
        (target / 'LICENSE.txt').write_bytes(archive.read('License.txt'))
    print(f'{pack}: {len(names)} self-contained models')
