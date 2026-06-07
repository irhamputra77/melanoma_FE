import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Brush, Eraser, RotateCcw, Save, Undo2, X } from "lucide-react";
import { toAssetUrl } from "../../../../utils/assets";

const MAX_CANVAS_WIDTH = 840;
const MAX_CANVAS_HEIGHT = 560;

export default function GradcamAnnotationModal({
    open,
    caseDetails,
    onClose,
    onSave,
    saving = false,
}) {
    const baseCanvasRef = useRef(null);
    const drawCanvasRef = useRef(null);
    const isDrawingRef = useRef(false);
    const lastPointRef = useRef(null);

    const [canvasSize, setCanvasSize] = useState({ width: 720, height: 480 });
    const [tool, setTool] = useState("brush");
    const [brushSize, setBrushSize] = useState(18);
    const [gradcamOpacity, setGradcamOpacity] = useState(0.42);
    const [history, setHistory] = useState([]);
    const [loadError, setLoadError] = useState("");

    const imageUrl = caseDetails?.clinicalImage?.imageUrl;
    const gradcamUrl = caseDetails?.aiPrediction?.gradcamUrl;
    const annotatedImageUrl = caseDetails?.clinicalImage?.annotatedImageUrl;

    useEffect(() => {
        if (!open) return;

        let cancelled = false;
        setLoadError("");
        setHistory([]);

        async function drawBase() {
            try {
                const baseImage = await loadCanvasImage(toAssetUrl(imageUrl));
                const gradcamImage = gradcamUrl ? await loadCanvasImage(toAssetUrl(gradcamUrl)).catch(() => null) : null;
                if (cancelled) return;

                const size = getContainedSize(baseImage.naturalWidth, baseImage.naturalHeight);
                setCanvasSize(size);

                requestAnimationFrame(() => {
                    paintBaseCanvas(baseCanvasRef.current, baseImage, gradcamImage, size, gradcamOpacity);
                    clearCanvas(drawCanvasRef.current, size);
                });
            } catch {
                if (!cancelled) {
                    setLoadError("Failed to load clinical image for annotation.");
                }
            }
        }

        drawBase();

        return () => {
            cancelled = true;
            isDrawingRef.current = false;
            lastPointRef.current = null;
        };
    }, [open, imageUrl, gradcamUrl]);

    useEffect(() => {
        if (!open || !imageUrl) return;

        let cancelled = false;

        async function redrawBaseWithOpacity() {
            try {
                const baseImage = await loadCanvasImage(toAssetUrl(imageUrl));
                const gradcamImage = gradcamUrl ? await loadCanvasImage(toAssetUrl(gradcamUrl)).catch(() => null) : null;
                if (!cancelled) {
                    paintBaseCanvas(baseCanvasRef.current, baseImage, gradcamImage, canvasSize, gradcamOpacity);
                }
            } catch {
                if (!cancelled) {
                    setLoadError("Failed to refresh Grad-CAM opacity.");
                }
            }
        }

        redrawBaseWithOpacity();

        return () => {
            cancelled = true;
        };
    }, [gradcamOpacity, open]);

    const getPoint = (event) => {
        const canvas = drawCanvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const source = event.touches?.[0] || event;

        return {
            x: ((source.clientX - rect.left) / rect.width) * canvas.width,
            y: ((source.clientY - rect.top) / rect.height) * canvas.height,
        };
    };

    const pushHistory = () => {
        const canvas = drawCanvasRef.current;
        const context = canvas?.getContext("2d");
        if (!canvas || !context) return;

        setHistory((items) => [
            ...items.slice(-11),
            context.getImageData(0, 0, canvas.width, canvas.height),
        ]);
    };

    const startDrawing = (event) => {
        event.preventDefault();
        if (!drawCanvasRef.current || saving) return;

        pushHistory();
        isDrawingRef.current = true;
        lastPointRef.current = getPoint(event);
        drawDot(lastPointRef.current);
    };

    const draw = (event) => {
        if (!isDrawingRef.current || !lastPointRef.current) return;
        event.preventDefault();

        const nextPoint = getPoint(event);
        drawLine(lastPointRef.current, nextPoint);
        lastPointRef.current = nextPoint;
    };

    const stopDrawing = () => {
        isDrawingRef.current = false;
        lastPointRef.current = null;
    };

    const drawDot = (point) => {
        const canvas = drawCanvasRef.current;
        const context = canvas?.getContext("2d");
        if (!context) return;

        prepareDrawingContext(context, tool, brushSize);
        context.beginPath();
        context.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2);
        context.fill();
        context.globalCompositeOperation = "source-over";
    };

    const drawLine = (from, to) => {
        const canvas = drawCanvasRef.current;
        const context = canvas?.getContext("2d");
        if (!context) return;

        prepareDrawingContext(context, tool, brushSize);
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.stroke();
        context.globalCompositeOperation = "source-over";
    };

    const handleUndo = () => {
        const canvas = drawCanvasRef.current;
        const context = canvas?.getContext("2d");
        const previous = history[history.length - 1];
        if (!context || !previous) return;

        context.putImageData(previous, 0, 0);
        setHistory((items) => items.slice(0, -1));
    };

    const handleReset = () => {
        pushHistory();
        clearCanvas(drawCanvasRef.current, canvasSize);
    };

    const handleSave = async () => {
        const baseCanvas = baseCanvasRef.current;
        const drawCanvas = drawCanvasRef.current;
        if (!baseCanvas || !drawCanvas || saving) return;

        const output = document.createElement("canvas");
        output.width = baseCanvas.width;
        output.height = baseCanvas.height;

        const context = output.getContext("2d");
        context.drawImage(baseCanvas, 0, 0);
        context.drawImage(drawCanvas, 0, 0);

        const blob = await canvasToBlob(output);
        const file = new File([blob], `annotation-${caseDetails.caseId}.png`, { type: "image/png" });
        await onSave(file);
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 px-6 py-8 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchEnd={stopDrawing}
                >
                    <motion.div
                        className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[30px] bg-white shadow-2xl"
                        initial={{ opacity: 0, y: 18, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div className="flex items-start justify-between gap-5 border-b border-slate-100 px-7 py-6">
                            <div>
                                <p className="text-[10px] font-extrabold tracking-[0.32em] text-blue-600">
                                    GRAD-CAM ANNOTATION
                                </p>
                                <h3 className="mt-2 text-2xl font-extrabold text-slate-950">
                                    Edit Clinical Heatmap
                                </h3>
                                <p className="mt-1 text-sm font-semibold text-slate-500">
                                    Case #{caseDetails?.caseId} - {caseDetails?.patient?.name || "Patient"}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
                                aria-label="Close annotation editor"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="grid max-h-[calc(92vh-104px)] grid-cols-1 gap-0 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_280px]">
                            <div className="bg-slate-50 p-6">
                                {loadError ? (
                                    <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-red-100 bg-red-50 px-6 text-center text-sm font-semibold text-red-600">
                                        {loadError}
                                    </div>
                                ) : (
                                    <div className="mx-auto w-full max-w-[860px]">
                                        <div
                                            className="relative mx-auto overflow-hidden rounded-3xl bg-slate-950 shadow-inner"
                                            style={{
                                                width: "100%",
                                                maxWidth: `${canvasSize.width}px`,
                                                aspectRatio: `${canvasSize.width} / ${canvasSize.height}`,
                                            }}
                                        >
                                            <canvas
                                                ref={baseCanvasRef}
                                                width={canvasSize.width}
                                                height={canvasSize.height}
                                                className="absolute inset-0 h-full w-full"
                                            />
                                            <canvas
                                                ref={drawCanvasRef}
                                                width={canvasSize.width}
                                                height={canvasSize.height}
                                                className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
                                                onMouseDown={startDrawing}
                                                onMouseMove={draw}
                                                onMouseUp={stopDrawing}
                                                onTouchStart={startDrawing}
                                                onTouchMove={draw}
                                                onTouchEnd={stopDrawing}
                                            />
                                        </div>

                                        {annotatedImageUrl && (
                                            <div className="mt-4 rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-semibold text-slate-600">
                                                Existing doctor annotation is saved. Saving again will replace it with the edited image.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-5 border-l border-slate-100 bg-white p-6">
                                <ControlGroup title="Tool">
                                    <div className="grid grid-cols-2 gap-3">
                                        <ToolButton active={tool === "brush"} onClick={() => setTool("brush")}>
                                            <Brush size={18} />
                                            Brush
                                        </ToolButton>
                                        <ToolButton active={tool === "eraser"} onClick={() => setTool("eraser")}>
                                            <Eraser size={18} />
                                            Eraser
                                        </ToolButton>
                                    </div>
                                </ControlGroup>

                                <ControlGroup title="Brush Size">
                                    <input
                                        type="range"
                                        min="6"
                                        max="58"
                                        value={brushSize}
                                        onChange={(event) => setBrushSize(Number(event.target.value))}
                                        className="w-full accent-blue-600"
                                    />
                                    <p className="text-sm font-bold text-slate-700">{brushSize}px</p>
                                </ControlGroup>

                                <ControlGroup title="Grad-CAM Opacity">
                                    <input
                                        type="range"
                                        min="0"
                                        max="0.85"
                                        step="0.05"
                                        value={gradcamOpacity}
                                        onChange={(event) => setGradcamOpacity(Number(event.target.value))}
                                        className="w-full accent-blue-600"
                                        disabled={!gradcamUrl}
                                    />
                                    <p className="text-sm font-bold text-slate-700">
                                        {gradcamUrl ? `${Math.round(gradcamOpacity * 100)}%` : "No Grad-CAM"}
                                    </p>
                                </ControlGroup>

                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={handleUndo}
                                        disabled={!history.length || saving}
                                        className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-extrabold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
                                    >
                                        <Undo2 size={17} />
                                        Undo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        disabled={saving}
                                        className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-extrabold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
                                    >
                                        <RotateCcw size={17} />
                                        Reset
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={saving || Boolean(loadError)}
                                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                                >
                                    <Save size={18} />
                                    {saving ? "Saving..." : "Save Annotation"}
                                </button>

                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={saving}
                                    className="w-full rounded-2xl bg-slate-100 px-5 py-4 text-sm font-extrabold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function ControlGroup({ title, children }) {
    return (
        <div className="space-y-3">
            <p className="text-[10px] font-extrabold tracking-[0.3em] text-slate-500">{title}</p>
            {children}
        </div>
    );
}

function ToolButton({ active, onClick, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold transition ${
                active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
        >
            {children}
        </button>
    );
}

function prepareDrawingContext(context, tool, size) {
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = size;

    if (tool === "eraser") {
        context.globalCompositeOperation = "destination-out";
        context.strokeStyle = "rgba(0, 0, 0, 1)";
        context.fillStyle = "rgba(0, 0, 0, 1)";
        return;
    }

    context.globalCompositeOperation = "source-over";
    context.strokeStyle = "rgba(37, 99, 235, 0.75)";
    context.fillStyle = "rgba(37, 99, 235, 0.75)";
}

function getContainedSize(width, height) {
    const ratio = Math.min(MAX_CANVAS_WIDTH / width, MAX_CANVAS_HEIGHT / height, 1);

    return {
        width: Math.max(1, Math.round(width * ratio)),
        height: Math.max(1, Math.round(height * ratio)),
    };
}

function loadCanvasImage(src) {
    return new Promise((resolve, reject) => {
        if (!src) {
            reject(new Error("Image source is required."));
            return;
        }

        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = src;
    });
}

function paintBaseCanvas(canvas, baseImage, gradcamImage, size, opacity) {
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    canvas.width = size.width;
    canvas.height = size.height;
    context.clearRect(0, 0, size.width, size.height);
    context.drawImage(baseImage, 0, 0, size.width, size.height);

    if (gradcamImage) {
        context.save();
        context.globalAlpha = opacity;
        context.drawImage(gradcamImage, 0, 0, size.width, size.height);
        context.restore();
    }
}

function clearCanvas(canvas, size) {
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    canvas.width = size.width;
    canvas.height = size.height;
    context.clearRect(0, 0, size.width, size.height);
}

function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
        try {
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                    return;
                }

                reject(new Error("Failed to export annotation image."));
            }, "image/png");
        } catch (error) {
            reject(error);
        }
    });
}
