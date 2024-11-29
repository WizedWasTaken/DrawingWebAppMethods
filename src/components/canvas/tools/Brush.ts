import BaseTool from '@/components/canvas/tools/BaseTool';

class Brush extends BaseTool {
  constructor(color: string, brushSize: number) {
    super(color, brushSize);
  }

  draw(ctx: CanvasRenderingContext2D, x: number, y: number) {
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

  setColor(color: string) {
    this.color = color;
  }

  setBrushSize(size: number) {
    this.brushSize = size;
  }
}

export default Brush;