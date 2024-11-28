'use client';
import { useRef, useState, useEffect } from 'react';
import CustomCursor from "@/components/CustomCursor"
import { ColorPicker } from '@/components/ui/colorPicker';

export default function Method1Page() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(5);
    const [tool, setTool] = useState<'brush' | 'eraser' | 'fill'>('brush');
    const [mousePos, setMousePos] = useState<[number, number]>([0, 0]);
    const [canvasCircleShown, setCanvasCircleShown] = useState<boolean>(false);
    const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
    const lastPosRef = useRef<{ x: number, y: number } | undefined>(undefined);
    const [undoStack, setUndoStack] = useState<ImageData[]>([]);
    const maxUndoSteps = 50; // Limit the number of undo steps to prevent memory issues

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Initial setup
        updateCanvasSize();
        // Save initial blank state
        saveCanvasState();

        // Add resize listener
        const handleResize = () => {
            updateCanvasSize();
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const updateCanvasSize = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Create a temporary canvas to store the current drawing
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;

        // Set temp canvas to the same size as the current canvas
        // This ensures we capture ALL content, not just visible area
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        tempCtx.drawImage(canvas, 0, 0);

        // Get the desired display size
        const rect = canvas.getBoundingClientRect();
        const displayWidth = rect.width;
        const displayHeight = rect.height;

        // Calculate the maximum dimensions needed to preserve all content
        const maxWidth = Math.max(displayWidth, tempCanvas.width);
        const maxHeight = Math.max(displayHeight, tempCanvas.height);

        // Resize the main canvas to the larger of current or new dimensions
        canvas.width = maxWidth;
        canvas.height = maxHeight;

        // Draw the old content back
        ctx.drawImage(tempCanvas, 0, 0);

        // Reset context properties
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    };

    useEffect(() => {
        document.addEventListener('mouseup', mouseUp);

        return () => {
            document.removeEventListener('mouseup', mouseUp);
        };
    }, []);

    const getCanvasCoordinates = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Update mouse position relative to viewport for cursor
        setMousePos([e.clientX, e.clientY]);
        draw(e);
    };

    const mouseLeave = (e: React.MouseEvent) => {
        if (isDrawing) {
            // Draw a line to the canvas border when leaving
            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (lastPosRef.current) {
                ctx.lineTo(x, y);
                ctx.stroke();
            }
        }
        setCanvasCircleShown(true);
        stopDrawing();
    };

    const mouseEnter = (e: React.MouseEvent) => {
        setCanvasCircleShown(false);
        if (isMouseDown) {
            // Start a new path at the entry point instead of connecting to the leave point
            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            ctx.beginPath();
            ctx.moveTo(x, y);
            setIsDrawing(true);
            lastPosRef.current = { x, y };

            ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
            ctx.lineWidth = brushSize;
        }
    };

    const mouseDown = (e: React.MouseEvent) => {
        if (tool === 'fill') {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const x = Math.floor(e.clientX - rect.left);
            const y = Math.floor(e.clientY - rect.top);
            floodFill(x, y);
            return;
        }

        setIsMouseDown(true);
        startDrawing(e);
    };

    const mouseUp = () => {
        if (isDrawing) {  // Only save state if we were actually drawing
            saveCanvasState();
        }
        setIsMouseDown(false);
        stopDrawing();
    };

    const startDrawing = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { x, y } = getCanvasCoordinates(e);

        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
        lastPosRef.current = { x, y };

        ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
        ctx.lineWidth = brushSize;
    };

    const draw = (e: React.MouseEvent) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { x, y } = getCanvasCoordinates(e);

        if (lastPosRef.current) {
            // Calculate points between last position and current position
            const lastX = lastPosRef.current.x;
            const lastY = lastPosRef.current.y;
            const dx = x - lastX;
            const dy = y - lastY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const steps = Math.max(Math.floor(distance / 2), 1);

            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const interpX = lastX + dx * t;
                const interpY = lastY + dy * t;
                ctx.lineTo(interpX, interpY);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(interpX, interpY);
            }
        }

        lastPosRef.current = { x, y };
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        lastPosRef.current = undefined;
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
        saveCanvasState(); // Save state after flood fill
    };

    const saveCanvasState = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setUndoStack(prev => {
            const newStack = [...prev, imageData];
            // Keep only the last maxUndoSteps states
            return newStack.slice(-maxUndoSteps);
        });
    };

    const undo = () => {
        alert("Den skal nok annulere på et tidspunkt...");
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas || undoStack.length <= 1) return;  // Changed from length === 0

        setUndoStack(prev => {
            const newStack = [...prev];
            newStack.pop(); // Remove current state
            const lastState = newStack[newStack.length - 1]; // Get previous state
            if (lastState) {
                ctx.putImageData(lastState, 0, 0);
            }
            return newStack;
        });
    };

    useEffect(() => {
        // Lock viewport size
        const meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0';
        document.getElementsByTagName('head')[0].appendChild(meta);

        return () => {
            // Cleanup
            document.getElementsByTagName('head')[0].removeChild(meta);
        };
    }, []);

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        saveCanvasState(); // Save state before clearing
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    return (
        <main className="p-5 flex h-screen justify-center gap-5 align-center flex-col overflow-hidden">
            <h1 className="text-5xl text-bold text-center">Måde 1</h1>

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
                    className="absolute inset-0 w-full h-full border-2 border-black bg-white cursor-none"
                    onMouseDown={mouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={mouseLeave}
                    onMouseEnter={mouseEnter}
                />
            </div>

            <CustomCursor
                brushSize={brushSize}
                color={tool === 'eraser' ? '#000000' : color}
                hidden={canvasCircleShown}
                mouseLocation={mousePos}
            />
        </main>
    )
}