interface CanvasCircleProps {
    brushSize: number;
    color: string;
    mouseLocation: [number, number];
}

export default function CanvasCircle({ brushSize, color, mouseLocation }: CanvasCircleProps) {
    return (
        <div
            style={{
                position: 'fixed',
                left: mouseLocation[0],
                top: mouseLocation[1],
                width: brushSize,
                height: brushSize,
                border: `1px solid ${color}`,
                borderRadius: '50%',
                pointerEvents: 'none',
                transform: 'translate(-50%, -50%)'
            }}
        />
    );
}