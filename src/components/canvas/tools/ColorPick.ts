import BaseTool from "@/components/canvas/tools/BaseTool";

class ColorPick extends BaseTool {
  constructor() {
    super("", 0); // ColorPick tool doesn't need color or brush size
  }

  draw(ctx: CanvasRenderingContext2D, x: number, y: number): string {
    const imageData = ctx.getImageData(x, y, 1, 1).data;
    return `rgba(${imageData[0]}, ${imageData[1]}, ${imageData[2]}, ${
      imageData[3] / 255
    })`;
  }
}

export default ColorPick;
