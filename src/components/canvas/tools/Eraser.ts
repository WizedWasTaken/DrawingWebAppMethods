import BaseTool from "./BaseTool";

class Eraser extends BaseTool {
  constructor() {
    super("rgba(0,0,0,1)", 10); // Pass default color and brush size
  }

  draw(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.globalCompositeOperation = "destination-out"; // Set composite operation for erasing
    ctx.beginPath();
    ctx.lineCap = "round";
    ctx.lineWidth = this.brushSize;
    ctx.strokeStyle = this.color;

    if (this.lastPos) {
      ctx.moveTo(this.lastPos.x, this.lastPos.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    this.lastPos = { x, y };
  }

  setBrushSize(size: number) {
    this.brushSize = size;
  }
}

export default Eraser;