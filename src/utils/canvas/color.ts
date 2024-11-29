export function ColorsMatch(
  color1: [number, number, number, number] | string,
  color2: string
): boolean {
  if (typeof color1 === "string") {
    return color1 === color2;
  } else {
    const [r, g, b, a] = color1;
    const [fr, fg, fb, fa] = HexToRgba(color2);
    return r === fr && g === fg && b === fb && a === fa;
  }
}

export function GetColorAtPixel(
  imageData: ImageData,
  x: number,
  y: number
): [number, number, number, number] {
  const offset = (y * imageData.width + x) * 4;
  const data = imageData.data;
  return [data[offset], data[offset + 1], data[offset + 2], data[offset + 3]];
}

export function HexToRgba(hex: string): [number, number, number, number] {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 24) & 255;
  const g = (bigint >> 16) & 255;
  const b = (bigint >> 8) & 255;
  const a = bigint & 255;
  return [r, g, b, a];
}

export function RgbaToHex(rgba: [number, number, number, number]): string {
  const [r, g, b, a] = rgba;
  const toHex = (value: number) => value.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(a)}`;
}
