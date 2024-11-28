'use client'

import CustomCursor from "@/components/CustomCursor";
import { ColorPicker } from "@/components/ui/colorPicker";
import { useState, useRef, useEffect } from "react";

export default function Method2Page() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [color, setColor] = useState("#000000");
    const [brushSize, setBrushSize] = useState(20);
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState<'brush' | 'eraser' | 'fill'>('brush');
    const [undoStack, setUndoStack] = useState<string[]>([]);
    const [mousePosition, setMousePosition] = useState<[number, number]>([0, 0]);
    const [isCursorInCanvas, setIsCursorInCanvas] = useState<boolean>(true);
    const lastPos = useRef<{ x: number; y: number } | null>(null);

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

        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    })

    const saveState = () => {
        console.info('saveState: ' + undoStack.length);
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Use callback form to ensure we're working with the latest state
        setUndoStack(prev => {
            const currentState = canvas.toDataURL();
            // Only add if it's different from the last state
            if (prev[prev.length - 1] !== currentState) {
                return [...prev, currentState];
            }
            return prev;
        });
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
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            floodFill(x, y);
            return;
        }
        setIsDrawing(true);
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        lastPos.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        // Save initial state when starting to draw
        saveState();
    };

    const mouseLeave = () => {
        setIsCursorInCanvas(false);
        stopDrawing();
    }

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            lastPos.current = null;
            saveState();
        }
    };

    const colorMatch = (pos: number, targetR: number, targetG: number, targetB: number, targetA: number, pixels: Uint8ClampedArray) => {
        const tolerance = 30; // Adjust this value to be more or less strict
        return Math.abs(pixels[pos] - targetR) <= tolerance &&
            Math.abs(pixels[pos + 1] - targetG) <= tolerance &&
            Math.abs(pixels[pos + 2] - targetB) <= tolerance &&
            Math.abs(pixels[pos + 3] - targetA) <= tolerance;
    };

    const floodFill = (startX: number, startY: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        const expandPixels = 3;

        // Get target color from clicked pixel
        const startPos = (startY * canvas.width + startX) * 4;
        const targetR = pixels[startPos];
        const targetG = pixels[startPos + 1];
        const targetB = pixels[startPos + 2];
        const targetA = pixels[startPos + 3];

        // Convert fill color from hex to RGBA
        const fillColor = document.createElement('canvas').getContext('2d')!;
        fillColor.fillStyle = color;
        fillColor.fillRect(0, 0, 1, 1);
        const fillRGBA = fillColor.getImageData(0, 0, 1, 1).data;

        // Don't fill if clicking on same color (with tolerance)
        if (colorMatch(startPos, fillRGBA[0], fillRGBA[1], fillRGBA[2], fillRGBA[3], pixels)) return;

        const stack: [number, number][] = [[startX, startY]];
        const filledPixels = new Set<string>();
        const visited = new Set<string>();

        while (stack.length) {
            const [x, y] = stack.pop()!;
            const key = `${x},${y}`;

            if (visited.has(key)) continue;
            visited.add(key);

            const pos = (y * canvas.width + x) * 4;

            if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;
            if (!colorMatch(pos, targetR, targetG, targetB, targetA, pixels)) continue;

            // Add to filled pixels set
            filledPixels.add(key);

            // Add neighbors to stack
            stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }

        // After finding all connected pixels, fill them with expansion
        for (const key of filledPixels) {
            const [x, y] = key.split(',').map(Number);

            // Fill the expanded area around each filled pixel
            for (let dy = -expandPixels; dy <= expandPixels; dy++) {
                for (let dx = -expandPixels; dx <= expandPixels; dx++) {
                    const newX = x + dx;
                    const newY = y + dy;

                    if (newX < 0 || newX >= canvas.width || newY < 0 || newY >= canvas.height) continue;

                    const newPos = (newY * canvas.width + newX) * 4;
                    pixels[newPos] = fillRGBA[0];
                    pixels[newPos + 1] = fillRGBA[1];
                    pixels[newPos + 2] = fillRGBA[2];
                    pixels[newPos + 3] = fillRGBA[3];
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);
        saveState(); // Save state after flood fill
    };

    // methods
    function undo() {
        console.log('First: ' + undoStack.length);
        // if (undoStack.length <= 1) return;

        const canvas = canvasRef.current;
        if (canvas == null) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Remove the current state
        const newStack = [...undoStack];
        newStack.pop(); // Remove current state
        const previousState = newStack[newStack.length - 1]; // Get the previous state without removing it

        setUndoStack(newStack);
        console.log(undoStack.length);

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
                    className={`px-4 py-2 rounded bg-gray-200 ${undoStack.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={undo}
                    disabled={undoStack.length <= 1}
                >
                    Undo
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
                    onMouseLeave={mouseLeave}
                    onMouseEnter={() => setIsCursorInCanvas(true)}
                />
            </div>

            <CustomCursor
                brushSize={brushSize}
                color={tool === 'eraser' ? '#000000' : color}
                hidden={!isCursorInCanvas}
                mouseLocation={mousePosition}
            />
        </main>
    )
}