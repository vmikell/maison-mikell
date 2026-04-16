from __future__ import annotations

from pathlib import Path
from typing import Iterable, Tuple

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]

BG_TOP = (21, 16, 33)
BG_BOTTOM = (11, 12, 22)
PINK = (255, 142, 207)
VIOLET = (157, 123, 255)
LILAC = (247, 240, 255)
OUTLINE = (230, 221, 244, 90)

ANDROID_ICON_SIZES = {
    "mdpi": 48,
    "hdpi": 72,
    "xhdpi": 96,
    "xxhdpi": 144,
    "xxxhdpi": 192,
}

ANDROID_FOREGROUND_SIZES = {
    "mdpi": 108,
    "hdpi": 162,
    "xhdpi": 216,
    "xxhdpi": 324,
    "xxxhdpi": 432,
}

ANDROID_SPLASH_PATHS = [
    ROOT / "android/app/src/main/res/drawable/splash.png",
    ROOT / "android/app/src/main/res/drawable-port-mdpi/splash.png",
    ROOT / "android/app/src/main/res/drawable-port-hdpi/splash.png",
    ROOT / "android/app/src/main/res/drawable-port-xhdpi/splash.png",
    ROOT / "android/app/src/main/res/drawable-port-xxhdpi/splash.png",
    ROOT / "android/app/src/main/res/drawable-port-xxxhdpi/splash.png",
    ROOT / "android/app/src/main/res/drawable-land-mdpi/splash.png",
    ROOT / "android/app/src/main/res/drawable-land-hdpi/splash.png",
    ROOT / "android/app/src/main/res/drawable-land-xhdpi/splash.png",
    ROOT / "android/app/src/main/res/drawable-land-xxhdpi/splash.png",
    ROOT / "android/app/src/main/res/drawable-land-xxxhdpi/splash.png",
]


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def vertical_gradient(width: int, height: int, top: Tuple[int, int, int], bottom: Tuple[int, int, int]) -> Image.Image:
    image = Image.new("RGBA", (width, height))
    pixels = image.load()
    for y in range(height):
        t = y / max(1, height - 1)
        color = tuple(int(top[i] * (1 - t) + bottom[i] * t) for i in range(3)) + (255,)
        for x in range(width):
            pixels[x, y] = color
    return image


def add_radial_glow(base: Image.Image, center: Tuple[float, float], radius: float, color: Tuple[int, int, int], opacity: int) -> None:
    glow = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(glow)
    x, y = center
    draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=color + (opacity,))
    glow = glow.filter(ImageFilter.GaussianBlur(radius * 0.42))
    base.alpha_composite(glow)


def rounded_gradient_box(size: Tuple[int, int], radius: int, start: Tuple[int, int, int], end: Tuple[int, int, int], vertical: bool = False) -> Image.Image:
    width, height = size
    image = Image.new("RGBA", size, (0, 0, 0, 0))
    pixels = image.load()
    span = height - 1 if vertical else width - 1
    span = max(1, span)
    for y in range(height):
        for x in range(width):
            t = (y / span) if vertical else (x / span)
            pixels[x, y] = tuple(int(start[i] * (1 - t) + end[i] * t) for i in range(3)) + (255,)

    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, width - 1, height - 1), radius=radius, fill=255)
    out = Image.new("RGBA", size, (0, 0, 0, 0))
    out.paste(image, (0, 0), mask)
    return out


def add_piece(layer: Image.Image, piece: Image.Image, position: Tuple[float, float], angle: float = 0) -> None:
    glow = piece.copy().filter(ImageFilter.GaussianBlur(max(6, piece.size[0] * 0.08)))
    glow_alpha = glow.getchannel("A").point(lambda value: min(255, int(value * 0.45)))
    glow.putalpha(glow_alpha)
    rotated_glow = glow.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)
    rotated_piece = piece.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)

    glow_x = int(position[0] - rotated_glow.size[0] / 2)
    glow_y = int(position[1] - rotated_glow.size[1] / 2)
    piece_x = int(position[0] - rotated_piece.size[0] / 2)
    piece_y = int(position[1] - rotated_piece.size[1] / 2)
    layer.alpha_composite(rotated_glow, (glow_x, glow_y))
    layer.alpha_composite(rotated_piece, (piece_x, piece_y))


def draw_outline(layer: Image.Image, size: int, center_x: float, center_y: float, scale: float) -> None:
    draw = ImageDraw.Draw(layer)
    stroke = max(3, int(size * 0.012))
    roof_y = center_y - 0.15 * scale
    top_y = center_y - 0.05 * scale
    bottom_y = center_y + 0.29 * scale
    left_x = center_x - 0.22 * scale
    right_x = center_x + 0.22 * scale
    roof_peak = (center_x, roof_y - 0.32 * scale)
    left_top = (left_x, top_y)
    right_top = (right_x, top_y)
    left_bottom = (left_x, bottom_y)
    right_bottom = (right_x, bottom_y)
    draw.line([left_top, roof_peak, right_top], fill=OUTLINE, width=stroke, joint="curve")
    draw.line([left_top, left_bottom], fill=OUTLINE, width=stroke)
    draw.line([right_top, right_bottom], fill=OUTLINE, width=stroke)
    draw.line([left_bottom, right_bottom], fill=OUTLINE, width=stroke)


def create_house_mark(size: int, adaptive: bool = False) -> Image.Image:
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    center_x = size / 2
    center_y = size * (0.54 if adaptive else 0.53)
    scale = size * (0.7 if adaptive else 0.58)

    roof = rounded_gradient_box((int(scale * 0.28), int(scale * 0.08)), radius=max(6, int(scale * 0.04)), start=PINK, end=VIOLET)
    wall = rounded_gradient_box((int(scale * 0.15), int(scale * 0.19)), radius=max(8, int(scale * 0.04)), start=PINK, end=VIOLET, vertical=True)
    base = rounded_gradient_box((int(scale * 0.15), int(scale * 0.16)), radius=max(8, int(scale * 0.04)), start=PINK, end=VIOLET, vertical=True)

    roof_y = center_y - 0.16 * scale
    wall_y = center_y + 0.02 * scale
    base_y = center_y + 0.24 * scale
    left_x = center_x - 0.16 * scale
    right_x = center_x + 0.16 * scale

    add_piece(layer, roof, (center_x - 0.13 * scale, roof_y), angle=-35)
    add_piece(layer, roof, (center_x + 0.13 * scale, roof_y), angle=35)
    add_piece(layer, wall, (left_x, wall_y))
    add_piece(layer, wall, (right_x, wall_y))
    add_piece(layer, base, (left_x, base_y))
    add_piece(layer, base, (right_x, base_y))

    sparkle = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    sparkle_draw = ImageDraw.Draw(sparkle)
    sparkle_radius = max(4, int(size * 0.018))
    sparkle_draw.rounded_rectangle(
        (
            center_x - sparkle_radius * 1.5,
            center_y + 0.03 * scale - sparkle_radius,
            center_x + sparkle_radius * 1.5,
            center_y + 0.03 * scale + sparkle_radius,
        ),
        radius=sparkle_radius,
        fill=LILAC + (210,),
    )
    sparkle = sparkle.filter(ImageFilter.GaussianBlur(max(2, size * 0.005)))
    layer.alpha_composite(sparkle)

    outline = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw_outline(outline, size, center_x, center_y, scale)
    outline = outline.filter(ImageFilter.GaussianBlur(max(1, size * 0.0025)))
    layer.alpha_composite(outline)

    return layer


def create_icon_base(size: int) -> Image.Image:
    image = vertical_gradient(size, size, BG_TOP, BG_BOTTOM)
    add_radial_glow(image, (size * 0.34, size * 0.18), size * 0.18, PINK, 100)
    add_radial_glow(image, (size * 0.76, size * 0.78), size * 0.22, VIOLET, 110)
    add_radial_glow(image, (size * 0.5, size * 0.42), size * 0.18, VIOLET, 35)
    return image


def create_full_icon(size: int) -> Image.Image:
    icon = create_icon_base(size)
    mark = create_house_mark(size)
    shadow = mark.filter(ImageFilter.GaussianBlur(size * 0.018))
    shadow_alpha = shadow.getchannel("A").point(lambda value: min(255, int(value * 0.4)))
    shadow.putalpha(shadow_alpha)
    icon.alpha_composite(shadow)
    icon.alpha_composite(mark)
    return icon


def create_adaptive_foreground(size: int) -> Image.Image:
    foreground = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    mark = create_house_mark(size, adaptive=True)
    foreground.alpha_composite(mark)
    return foreground


def create_splash(width: int, height: int) -> Image.Image:
    splash = vertical_gradient(width, height, BG_TOP, BG_BOTTOM)
    add_radial_glow(splash, (width * 0.28, height * 0.16), min(width, height) * 0.22, PINK, 95)
    add_radial_glow(splash, (width * 0.72, height * 0.78), min(width, height) * 0.26, VIOLET, 110)
    mark_size = int(min(width, height) * 0.34)
    mark = create_house_mark(mark_size)
    shadow = mark.filter(ImageFilter.GaussianBlur(mark_size * 0.05))
    shadow_alpha = shadow.getchannel("A").point(lambda value: min(255, int(value * 0.55)))
    shadow.putalpha(shadow_alpha)
    x = (width - mark_size) // 2
    y = int(height * 0.34)
    splash.alpha_composite(shadow, (x, y))
    splash.alpha_composite(mark, (x, y))
    return splash


def write_png(image: Image.Image, path: Path) -> None:
    ensure_parent(path)
    image.save(path, format="PNG", optimize=True)
    print(f"wrote {path.relative_to(ROOT)}")


def write_android_background_color() -> None:
    path = ROOT / "android/app/src/main/res/values/ic_launcher_background.xml"
    path.write_text(
        "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n"
        "<resources>\n"
        "    <color name=\"ic_launcher_background\">#151021</color>\n"
        "</resources>\n",
        encoding="utf-8",
    )
    print(f"wrote {path.relative_to(ROOT)}")


def write_ios_assets() -> None:
    icon = create_full_icon(1024)
    splash = create_splash(2732, 2732)
    write_png(icon, ROOT / "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png")
    for filename in ["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"]:
        write_png(splash, ROOT / f"ios/App/App/Assets.xcassets/Splash.imageset/{filename}")


def write_android_assets() -> None:
    source_icon = create_full_icon(1024)
    for density, size in ANDROID_ICON_SIZES.items():
        resized = source_icon.resize((size, size), Image.Resampling.LANCZOS)
        write_png(resized, ROOT / f"android/app/src/main/res/mipmap-{density}/ic_launcher.png")
        write_png(resized, ROOT / f"android/app/src/main/res/mipmap-{density}/ic_launcher_round.png")

    for density, size in ANDROID_FOREGROUND_SIZES.items():
        foreground = create_adaptive_foreground(size)
        write_png(foreground, ROOT / f"android/app/src/main/res/mipmap-{density}/ic_launcher_foreground.png")

    for path in ANDROID_SPLASH_PATHS:
        with Image.open(path) as existing:
            splash = create_splash(*existing.size)
        write_png(splash, path)

    write_android_background_color()


def write_source_previews() -> None:
    preview_dir = ROOT / "mobile/branding"
    write_png(create_full_icon(1024), preview_dir / "maison-app-icon-source.png")
    write_png(create_adaptive_foreground(1024), preview_dir / "maison-app-icon-foreground-source.png")
    write_png(create_splash(2732, 2732), preview_dir / "maison-splash-source.png")


def main() -> None:
    write_source_previews()
    write_ios_assets()
    write_android_assets()


if __name__ == "__main__":
    main()
