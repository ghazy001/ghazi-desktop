#!/usr/bin/env python3
"""Extract static Spider artwork from the owner-selected xp-cards archive.

Requires Pillow. Reads PE resources only; never loads or executes the binaries.
Usage: python extract-xp-spider.py --source /path/to/xp-cards
"""
import argparse
import hashlib
import io
import json
import struct
from pathlib import Path
from PIL import Image

REVISION = '33a6d492ffa63f0b16b1ad982930c16d367f6bbb'
SOURCE = 'https://github.com/esc0rtd3w/xp-cards'
BINARY_SHA256 = 'd309a839843ccd8b9edef7a271a611eb7794f83a825b69a87cc259c9ede87288'

def resources(path):
    blob = path.read_bytes()
    def u16(at): return struct.unpack_from('<H', blob, at)[0]
    def u32(at): return struct.unpack_from('<I', blob, at)[0]
    assert blob[:2] == b'MZ'
    pe = u32(0x3c)
    assert blob[pe:pe+4] == b'PE\0\0'
    optional = pe + 24
    assert u16(optional) == 0x10b, 'Expected PE32'
    sections = []
    for index in range(u16(pe + 6)):
        at = optional + u16(pe + 20) + index * 40
        size, address, raw_size, offset = struct.unpack_from('<IIII', blob, at + 8)
        sections.append((address, max(size, raw_size), offset))
    def file_offset(address):
        for start, size, offset in sections:
            if start <= address < start + size:
                return offset + address - start
        raise ValueError('Resource address outside PE sections')
    root = file_offset(u32(optional + 112))
    def walk(relative, trail=()):
        at = root + relative
        for index in range(u16(at + 12) + u16(at + 14)):
            name, value = struct.unpack_from('<II', blob, at + 16 + index * 8)
            if name & 0x80000000:
                position = root + (name & 0x7fffffff)
                name = blob[position+2:position+2+u16(position)*2].decode('utf-16le')
            key = trail + (name,)
            if value & 0x80000000:
                yield from walk(value & 0x7fffffff, key)
            else:
                address, size = struct.unpack_from('<II', blob, root + value)
                offset = file_offset(address)
                assert offset + size <= len(blob)
                yield key, blob[offset:offset+size]
    return dict(walk(0))

def bitmap(dib):
    header = struct.unpack_from('<I', dib)[0]
    if header == 12:  # BITMAPCOREHEADER palettes contain RGB triples.
        bits = struct.unpack_from('<H', dib, 10)[0]
        palette = (1 << bits) * 3 if bits <= 8 else 0
    else:
        assert header >= 40
        bits = struct.unpack_from('<H', dib, 14)[0]
        colors = struct.unpack_from('<I', dib, 32)[0]
        palette = (colors or (1 << bits)) * 4 if bits <= 8 else 0
    offset = 14 + header + palette
    bmp = b'BM' + struct.pack('<IHHI', len(dib) + 14, 0, 0, offset) + dib
    return Image.open(io.BytesIO(bmp)).convert('RGBA')

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--output', type=Path, default=Path(__file__).resolve().parents[1] / 'public/game/spider')
    args = parser.parse_args()
    binary = args.source / 'spider.exe'
    assert hashlib.sha256(binary.read_bytes()).hexdigest() == BINARY_SHA256, 'Unexpected Spider binary; use the pinned xp-cards revision'
    entries = resources(binary)
    args.output.mkdir(parents=True, exist_ok=True)
    records = []
    def record(name, key, image=None):
        path = args.output / name
        if image is None: path.write_bytes(entries[key])
        else: image.save(path, optimize=True)
        records.append({'file': name, 'resource': list(key), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'bytes': path.stat().st_size})
    # Native order is clubs, diamonds, hearts, spades; each is Ace through King.
    for index in range(1, 53):
        key = (2, 'CARD' + str(index), 1033)
        image = bitmap(entries[key])
        assert image.size == (71, 96)
        record('card-' + str(index) + '.png', key, image)
    for name, resource in [('back.png', 'CARDBACK'), ('felt.png', 'FELT'), ('about.png', 106)]:
        key = (2, resource, 1033)
        record(name, key, bitmap(entries[key]))
    # Reassemble the original multi-resolution icon from its group + image resources.
    group = entries[(14, 103, 1033)]
    count = struct.unpack_from('<H', group, 4)[0]
    directory, chunks, offset = [], [], 6 + count * 16
    for index in range(count):
        at = 6 + index * 14
        width, height, colors, reserved, planes, bits, length, ident = struct.unpack_from('<BBBBHHIH', group, at)
        chunk = entries[(3, ident, 1033)]
        assert len(chunk) == length
        directory.append(struct.pack('<BBBBHHII', width, height, colors, reserved, planes, bits, length, offset))
        chunks.append(chunk); offset += length
    ico = struct.pack('<HHH', 0, 1, count) + b''.join(directory) + b''.join(chunks)
    icon = Image.open(io.BytesIO(ico))
    icon.load()
    key = (14, 103, 1033)
    record('icon.png', key, icon.convert('RGBA'))
    # Original short card effects and the completion sound are served only on demand.
    for number in [124, 125, 126, 127, 128, 129]:
        record('sound-' + str(number) + '.wav', ('WAVE', number, 1033))
    manifest = {'source': SOURCE, 'revision': REVISION, 'binary': 'spider.exe', 'binarySha256': hashlib.sha256(binary.read_bytes()).hexdigest(), 'cardSize': [71, 96], 'suitOrder': ['clubs', 'diamonds', 'hearts', 'spades'], 'records': records, 'notice': 'Original Microsoft Windows XP resources from the owner-selected archival repository. The repository supplies no open-source license. No Windows executable is served or executed by this website.'}
    (args.output / 'sources.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(f'Extracted {len(records)} assets from Spider without executing it.')

if __name__ == '__main__': main()
