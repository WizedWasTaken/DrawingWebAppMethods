'use client';
import { useRef, useState, useEffect } from 'react';
import CustomCursor from "@/components/CustomCursor"
import { ColorPicker } from '@/components/ui/colorPicker';

export default function Method1Page() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(5);
    const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
    const [mousePos, setMousePos] = useState<[number, number]>([0, 0]);
    const [canvasCircleShown, setCanvasCircleShown] = useState<boolean>(false);
    const [isMouseDown, setIsMouseDown] = useState<boolean>(false);

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

    const handleMouseMove = (e: React.MouseEvent) => {
        setMousePos([e.clientX, e.clientY]);
        draw(e);
    };

    const mouseLeave = () => {
        setCanvasCircleShown(true);
        setIsDrawing(false);  // Stop drawing when leaving canvas
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
            
            ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
            ctx.lineWidth = brushSize;
        }
    };
    
    const mouseDown = (e: React.MouseEvent) => {
        setIsMouseDown(true);
        startDrawing(e);
    };
    
    const mouseUp = () => {
        setIsMouseDown(false);
        setIsDrawing(false);  // Ensure drawing is stopped
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

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
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
                onMouseUp={mouseUp}
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