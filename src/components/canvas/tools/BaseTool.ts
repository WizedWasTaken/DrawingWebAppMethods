export default abstract class BaseTool {
    protected color: string;
    protected brushSize: number;
    protected lastPos: { x: number, y: number } | undefined = undefined;
  
    constructor(color: string, brushSize: number) {
      this.color = color;
      this.brushSize = brushSize;
    }
  
    abstract draw(ctx: CanvasRenderingContext2D, x: number, y: number): void;
  
    setColor(color: string) {
      this.color = color;
    }
  
    setBrushSize(size: number) {
      this.brushSize = size;
    }

    reset() {
    }
  }