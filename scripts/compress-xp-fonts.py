"""Lossless web copies: pip install fonttools brotli, then run this script.
Original TTFs and every glyph/metric are retained; no font subsetting is used.
"""
from pathlib import Path
from fontTools.ttLib import TTFont
root = Path(__file__).resolve().parents[1] / 'public/fonts'
before = after = 0
for path in root.rglob('*.ttf'):
    source = TTFont(path)
    target = path.with_suffix('.woff2')
    source.flavor = 'woff2'
    source.save(target)
    check = TTFont(target)
    assert source.getGlyphOrder() == check.getGlyphOrder(), path
    assert source.getBestCmap() == check.getBestCmap(), path
    assert source['hmtx'].metrics == check['hmtx'].metrics, path
    before += path.stat().st_size
    after += target.stat().st_size
    source.close(); check.close()
print(f'XP fonts: {before:,} → {after:,} bytes. All glyphs and advance widths verified.')
