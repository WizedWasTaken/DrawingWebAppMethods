'use client'

import CustomCursor from "@/components/CustomCursor";
import { ColorPicker } from "@/components/ui/colorPicker";
import { useState, useRef, useEffect } from "react";

export default function Method2Page() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [color, setColor] = useState("#000000");
    const [brushSize, setBrushSize] = useState(3);
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState<'brush' | 'eraser' | 'fill'>('brush');
    const [undoStack, setUndoStack] = useState<string[]>([]);
    const [mousePosition, setMousePosition] = useState<[number, number]>([0, 0]);
    const [isCursorInCanvas, setIsCursorInCanvas] = useState<boolean>(false);
    const lastPos = useRef<{ x: number; y: number } | null>(null);

    // On Loads
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        saveState();
    }, []);

    const saveState = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        setUndoStack(prev => [...prev, canvas.toDataURL()]);
    };

    const draw = (e: React.MouseEvent) => {
        if (!isDrawing || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.beginPath();
        ctx.lineCap = 'round';
        ctx.lineWidth = brushSize;
        ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color;

        if (lastPos.current) {
            ctx.moveTo(lastPos.current.x, lastPos.current.y);
            ctx.lineTo(x, y);
            ctx.stroke();
        }

        lastPos.current = { x, y };
    };

    const startDrawing = (e: React.MouseEvent) => {
        if (tool === 'fill') {
            floodFill(e);
            return;
        }
        setIsDrawing(true);
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        lastPos.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const stopDrawing = () => {
        setIsCursorInCanvas(false);
        if (isDrawing) {
            setIsDrawing(false);
            lastPos.current = null;
            saveState();
        }
    };

    const floodFill = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = Math.floor(e.clientX - rect.left);
        const y = Math.floor(e.clientY - rect.top);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        const startPos = (y * canvas.width + x) * 4;
        const startR = pixels[startPos];
        const startG = pixels[startPos + 1];
        const startB = pixels[startPos + 2];
        const startA = pixels[startPos + 3];

        const fillR = parseInt(color.slice(1, 3), 16);
        const fillG = parseInt(color.slice(3, 5), 16);
        const fillB = parseInt(color.slice(5, 7), 16);

        const stack = [[x, y]];
        const visited = new Set();

        while (stack.length) {
            const [x, y] = stack.pop()!;

            // Fill a 7x7 square (3 pixels in each direction from center)
            for (let dx = -3; dx <= 3; dx++) {
                for (let dy = -3; dy <= 3; dy++) {
                    const newX = x + dx;
                    const newY = y + dy;
                    const key = `${newX},${newY}`;

                    if (visited.has(key)) continue;
                    visited.add(key);

                    if (newX < 0 || newX >= canvas.width || newY < 0 || newY >= canvas.height) continue;

                    const pos = (newY * canvas.width + newX) * 4;
                    if (pixels[pos] !== startR || pixels[pos + 1] !== startG ||
                        pixels[pos + 2] !== startB || pixels[pos + 3] !== startA) continue;

                    pixels[pos] = fillR;
                    pixels[pos + 1] = fillG;
                    pixels[pos + 2] = fillB;
                    pixels[pos + 3] = 255;

                    // Only add the center pixel's neighbors to the stack
                    if (dx === 0 && dy === 0) {
                        stack.push([newX + 1, newY], [newX - 1, newY],
                            [newX, newY + 1], [newX, newY - 1]);
                    }
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);
        saveState();
    };

    // methods
    function undo() {
        if (undoStack.length === 0) return;

        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        // Remove the current state from the stack
        const newStack = [...undoStack];
        const previousState = newStack.pop();
        setUndoStack(newStack);

        // Load the previous state
        if (previousState) {
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx.drawImage(img, 0, 0);
            };
            img.src = previousState;
        }
    }

    function clearCanvas() {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        setUndoStack([]);
    }



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
                    className={`px-4 py-2 rounded ${tool === 'brush' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setTool('brush')}
                >
                    Brush
                </button>
                <button
                    className={`px-4 py-2 rounded ${tool === 'eraser' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setTool('eraser')}
                >
                    Eraser
                </button>
                <button
                    className={`px-4 py-2 rounded ${tool === 'fill' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setTool('fill')}
                >
                    Fill
                </button>
                <button
                    className={`px-4 py-2 rounded bg-gray-200 ${undoStack.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={undo}
                    disabled={undoStack.length === 0}
                >
                    IK BRUG!!!
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
                    className="absolute inset-0 w-full h-full border-2 border-black bg-white"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onMouseEnter={() => setIsCursorInCanvas(true)}
                />
            </div>

            <CustomCursor
                brushSize={brushSize}
                color={tool === 'eraser' ? '#000000' : color}
                hidden={isCursorInCanvas}
                mouseLocation={mousePosition}
            />
        </main>
    )
}