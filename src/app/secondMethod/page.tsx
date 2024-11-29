"use client";

import CustomCursor from "@/components/canvas/CustomCursor";
import { ColorPicker } from "@/components/ui/colorPicker";
import { useState, useRef, useEffect } from "react";
import Brush from "@/components/canvas/tools/Brush";
import Eraser from "@/components/canvas/tools/Eraser";
import Fill from "@/components/canvas/tools/Fill";
import ColorPick from "@/components/canvas/tools/ColorPick";

export default function Method2Page() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState("#c81fd8");
  const [brushSize, setBrushSize] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<"brush" | "eraser" | "fill" | "colorPicker">(
    "brush"
  );
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [mousePosition, setMousePosition] = useState<[number, number]>([0, 0]);
  const [isCursorInCanvas, setIsCursorInCanvas] = useState<boolean>(true);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const brush = useRef(new Brush(color, brushSize));
  const eraser = useRef(new Eraser());
  const fillTool = useRef(new Fill());
  const colorPick = useRef(new ColorPick());

  // On Loads
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }, []);

  // set mouse position on mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition([e.clientX, e.clientY]);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  });

  useEffect(() => {
    brush.current.setColor(color);
  }, [color]);

  useEffect(() => {
    brush.current.setBrushSize(brushSize);
    eraser.current.setBrushSize(brushSize);
  }, [brushSize]);

  const saveState = () => {
    console.info("saveState: " + undoStack.length);
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use callback form to ensure we're working with the latest state
    setUndoStack((prev) => {
      const currentState = canvas.toDataURL();
      // Only add if it's different from the last state
      if (prev[prev.length - 1] !== currentState) {
        return [...prev, currentState];
      }
      return prev;
    });
    setRedoStack([]);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    switch (tool) {
      case "brush":
        brush.current.draw(ctx, x, y);
        break;
      case "eraser":
        eraser.current.draw(ctx, x, y);
        break;
      case "fill":
        fillTool.current.draw(ctx, x, y);
        setIsDrawing(false);
        break;
      case "colorPicker":
        colorPick.current.draw(ctx, x, y);
      default:
        throw new Error("Invalid tool");
    }
  };

  const startDrawing = (e: React.MouseEvent) => {
    setIsDrawing(true);

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    lastPos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    saveState();
  };

  const mouseLeave = () => {
    setIsCursorInCanvas(false);
    stopDrawing();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      lastPos.current = null;
      saveState();
    }
  };

  const undo = () => {
    if (undoStack.length <= 1) return;

    const canvas = canvasRef.current;
    if (!canvas || !canvas.getContext("2d")) return;

    const newUndoStack = [...undoStack];
    const currentState = newUndoStack.pop()!; // Remove current state
    const previousState = newUndoStack[newUndoStack.length - 1]; // Get the previous state

    // Add the undone state to redo stack
    setRedoStack((prev) => [...prev, currentState]);
    setUndoStack(newUndoStack);

    // Load the previous state
    if (previousState) {
      const img = new Image();
      img.onload = () => {
        const ctx = canvas.getContext("2d")!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = previousState;
    }
  };

  const redo = () => {
    if (redoStack.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas || !canvas.getContext("2d")) return;

    const newRedoStack = [...redoStack];
    const nextState = newRedoStack.pop()!;

    setRedoStack(newRedoStack);
    setUndoStack((prev) => [...prev, nextState]);

    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = nextState;
  };

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    setRedoStack([]); // Clear redo stack when canvas is cleared
    saveState();
  };

  const colorPickTool = () => {
    setTool("colorPicker");
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const pickedColor = colorPick.current.draw(ctx, x, y);
      setColor(pickedColor);
      canvas.removeEventListener("click", handleClick);
      setTool("brush");
    };

    canvas.addEventListener("click", handleClick);
  };

  return (
    <main className="p-5 flex h-screen justify-center gap-5 align-center flex-col overflow-hidden">
      <h1 className="text-5xl text-bold text-center">Måde 2</h1>

      <div className="flex gap-4 justify-center items-center">
        <div className="flex gap-2">
          <ColorPicker
            onChange={(v) => {
              setColor(v);
            }}
            value={color}
          />
        </div>

        <div className="flex gap-2 items-center">
          <input
            type="range"
            min="3"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-32"
          />
          <span>{brushSize}px</span>
        </div>

        <button
          className={`px-4 py-2 rounded ${
            tool === "brush" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setTool("brush")}
        >
          Brush
        </button>
        <button
          className={`px-4 py-2 rounded ${
            tool === "eraser" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setTool("eraser")}
        >
          Eraser
        </button>
        <button
          className={`px-4 py-2 rounded ${
            tool === "fill" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setTool("fill")}
        >
          Fill
        </button>
        <button
          className={`px-4 py-2 rounded ${
            tool === "colorPicker" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          onClick={colorPickTool}
        >
          Color Picker
        </button>
        <button
          className={`px-4 py-2 rounded bg-gray-200 ${
            undoStack.length <= 1 ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={undo}
          disabled={undoStack.length <= 1}
        >
          Undo
        </button>
        <button
          className={`px-4 py-2 rounded bg-gray-200 ${
            redoStack.length === 0 ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={redo}
          disabled={redoStack.length === 0}
        >
          Redo
        </button>
        <button
          className="px-4 py-2 rounded bg-red-500 text-white"
          onClick={clearCanvas}
        >
          Clear
        </button>
      </div>

      <div className="relative flex-grow">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full border-2 border-black bg-white cursor-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={mouseLeave}
          onMouseEnter={() => setIsCursorInCanvas(true)}
        />
      </div>

      <CustomCursor
        brushSize={brushSize}
        color={tool === "eraser" ? "#000000" : color}
        hidden={!isCursorInCanvas}
        mouseLocation={mousePosition}
      />
    </main>
  );
}
