interface CustomCursorProps {
    brushSize: number;
    color: string;
    mouseLocation: [number, number];
    hidden: boolean; 
}

export default function CustomCursor({ brushSize, color, mouseLocation, hidden }: CustomCursorProps) {
    return (
        <div
            className={hidden ? "hidden" : "block"}
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