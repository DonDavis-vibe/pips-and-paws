#!/usr/bin/env python3
"""Wandelt die Rohbilder (schwarze Tusche auf hellem Papier) in transparente
128-px-WebP um: aus der Helligkeit wird die Deckkraft, die Farbe ist die
Tusche-Farbe der uebrigen Bilder. Braucht Pillow."""
import pathlib, sys
from PIL import Image, ImageOps, ImageFilter

HERE = pathlib.Path(__file__).resolve().parent
RAW = HERE / 'raw'
OUT = HERE.parent.parent / 'src' / 'assets' / 'ink' / 'items'
SIZE = 128
INK = (26, 22, 19)


def convert(src, dst):
    im = Image.open(src).convert('L')
    # Papierton auf Weiss ziehen, Tusche auf Schwarz (Kontrast strecken, Raender ignorieren)
    im = ImageOps.autocontrast(im, cutoff=(1, 0))
    alpha = ImageOps.invert(im)
    # Papierrauschen unterdruecken: unter 18 % wird ganz durchsichtig
    alpha = alpha.point(lambda v: 0 if v < 46 else min(255, int((v - 46) * 255 / (255 - 46) * 1.15)))
    # auf Inhalt zuschneiden, quadratisch mit etwas Rand auffuellen
    box = alpha.point(lambda v: 255 if v > 24 else 0).getbbox()
    if box:
        alpha = alpha.crop(box)
    side = max(alpha.size)
    pad = int(side * 0.06)
    canvas = Image.new('L', (side + 2 * pad, side + 2 * pad), 0)
    canvas.paste(alpha, ((canvas.width - alpha.width) // 2, (canvas.height - alpha.height) // 2))
    canvas = canvas.resize((SIZE, SIZE), Image.LANCZOS).filter(ImageFilter.UnsharpMask(0.6, 60, 2))
    out = Image.new('RGBA', (SIZE, SIZE), INK + (0,))
    out.putalpha(canvas)
    dst.parent.mkdir(parents=True, exist_ok=True)
    out.save(dst, 'WEBP', quality=82, method=6)


def main():
    only = set(sys.argv[1:])
    n = 0
    for src in sorted(RAW.glob('*.png')):
        key = src.stem
        if only and key not in only:
            continue
        convert(src, OUT / f'{key}.webp')
        n += 1
    print(f'{n} Bilder nach {OUT} geschrieben')


if __name__ == '__main__':
    main()
