import BaseTool from "./BaseTool";
import {
  HexToRgba,
  RgbaToHex,
  ColorsMatch,
  GetColorAtPixel,
} from "@/utils/canvas/color";

class Fill extends BaseTool {
  constructor() {
    super("", 0); // Fill tool doesn't need color or brush size
  }

  draw(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    throw new Error("Method not implemented.");
  }

  fill(ctx: CanvasRenderingContext2D, x: number, y: number, fillColor: string) {
    const imageData = ctx.getImageData(
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height
    );
    const targetColorArray = GetColorAtPixel(imageData, x, y);
    if (ColorsMatch(targetColorArray, fillColor)) return;

    this.floodFill(ctx, imageData, x, y, targetColorArray, fillColor);
    ctx.putImageData(imageData, 0, 0);
  }

  private floodFill(
    ctx: CanvasRenderingContext2D,
    imageData: ImageData,
    x: number,
    y: number,
    targetColor: [number, number, number, number],
    fillColor: string
  ) {
    const stack = [[x, y]];
    const [fr, fg, fb, fa] = HexToRgba(fillColor);
    const data = imageData.data;

    while (stack.length) {
      const [cx, cy] = stack.pop()!;
      const offset = (cy * imageData.width + cx) * 4;

      if (
        ColorsMatch(
          [data[offset], data[offset + 1], data[offset + 2], data[offset + 3]],
          RgbaToHex(targetColor)
        )
      ) {
        data[offset] = fr;
        data[offset + 1] = fg;
        data[offset + 2] = fb;
        data[offset + 3] = fa;

        stack.push([cx + 1, cy]);
        stack.push([cx - 1, cy]);
        stack.push([cx, cy + 1]);
        stack.push([cx, cy - 1]);
      }
    }
  }
}

export default Fill;
