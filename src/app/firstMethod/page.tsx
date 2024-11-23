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
    const lastPosRef = useRef<{x: number, y: number} | undefined>(undefined);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, []);

    useEffect(() => {
        document.addEventListener('mouseup', mouseUp);

        return () => {
            document.removeEventListener('mouseup', mouseUp);
        };
    }, []);

    const handleMouseMove = (e: React.MouseEvent) => {
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
            lastPosRef.current = {x, y};
            
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
        setIsMouseDown(false);
        stopDrawing();
    };

    const startDrawing = (e: React.MouseEvent) => {
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
        lastPosRef.current = {x, y};

        ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
        ctx.lineWidth = brushSize;
    };

    const draw = (e: React.MouseEvent) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

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

        lastPosRef.current = {x, y};
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

        while (stack.length) {
            const [x, y] = stack.pop()!;
            const pos = (y * canvas.width + x) * 4;

            if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;
            if (!colorMatch(pos, targetR, targetG, targetB, targetA, pixels)) continue;

            // Fill pixel
            pixels[pos] = fillRGBA[0];
            pixels[pos + 1] = fillRGBA[1];
            pixels[pos + 2] = fillRGBA[2];
            pixels[pos + 3] = fillRGBA[3];

            // Check diagonals as well for better fill
            stack.push(
                [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1],
                [x + 1, y + 1], [x - 1, y - 1], [x + 1, y - 1], [x - 1, y + 1]
            );
        }

        ctx.putImageData(imageData, 0, 0);
    };

    return (
        <main className="p-5 flex h-screen justify-center gap-5 align-center flex-col">
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
                        min="1"
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
                    className="px-4 py-2 rounded bg-red-500 text-white"
                    onClick={() => {
                        const canvas = canvasRef.current;
                        const ctx = canvas?.getContext('2d');
                        if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }}
                >
                    Clear
                </button>
            </div>

            <canvas
                ref={canvasRef}
                className="border-2 border-black h-full bg-white cursor-none"
                onMouseDown={mouseDown}
                onMouseMove={handleMouseMove}
                onMouseLeave={mouseLeave}
                onMouseEnter={mouseEnter}
            />

            <CustomCursor
                brushSize={brushSize}
                color={tool === 'eraser' ? '#000000' : color}
                hidden={canvasCircleShown}
                mouseLocation={mousePos}
            />
        </main>
    )
}