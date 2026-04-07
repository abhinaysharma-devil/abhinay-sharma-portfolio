import React, {
  useRef,
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  RefObject,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { Hands, Results } from '@mediapipe/hands';
import { Camera as MediaPipeCamera } from '@mediapipe/camera_utils';
import {
  Undo, Redo, Trash2, Download, Moon, Sun,
  Hand, Camera, MousePointer2, AlertCircle, ArrowLeft, HelpCircle, X,
  Settings2
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Gesture = 'draw' | 'erase' | 'hover' | 'none';

interface HandData {
  x: number;
  y: number;
  gesture: Gesture;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = [
  '#000000', '#6B7280', '#EF4444', '#F97316',
  '#EAB308', '#22C55E', '#3B82F6', '#A855F7',
  '#EC4899', '#FFFFFF',
];

const STROKE_WIDTHS = [
  { label: 'S', value: 3 },
  { label: 'M', value: 8 },
  { label: 'L', value: 16 },
];

const ERASER_WIDTHS = [
  { label: 'S', value: 24 },
  { label: 'M', value: 48 },
  { label: 'L', value: 96 },
];

// ─── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

// ─── useHandTracking ──────────────────────────────────────────────────────────

function useHandTracking({
  videoRef,
  onHandData,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  onHandData: (data: HandData | null) => void;
}) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onHandDataRef = useRef(onHandData);

  useEffect(() => { onHandDataRef.current = onHandData; }, [onHandData]);

  useEffect(() => {
    if (!videoRef.current) return;

    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults((results: Results) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];

        const isIndexExtended = landmarks[8].y < landmarks[6].y;
        const isMiddleExtended = landmarks[12].y < landmarks[10].y;
        const isRingExtended = landmarks[16].y < landmarks[14].y;
        const isPinkyExtended = landmarks[20].y < landmarks[18].y;

        const dx = landmarks[8].x - landmarks[4].x;
        const dy = landmarks[8].y - landmarks[4].y;
        const pinchDistance = Math.sqrt(dx * dx + dy * dy);

        const isFist = !isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended;
        const isOpenPalm = isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended;

        let gesture: Gesture = 'hover';

        if (isFist) {
          gesture = 'none';
        } else if (isOpenPalm && pinchDistance >= 0.1) {
          gesture = 'hover';
        } else {
          gesture = pinchDistance < 0.08 ? 'draw' : 'erase';
        }

        // Midpoint between thumb tip (4) and index tip (8)
        const targetLandmark = {
          x: (landmarks[8].x + landmarks[4].x) / 2,
          y: (landmarks[8].y + landmarks[4].y) / 2,
        };

        onHandDataRef.current({ x: targetLandmark.x, y: targetLandmark.y, gesture });
      } else {
        onHandDataRef.current(null);
      }
    });

    const camera = new MediaPipeCamera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current) await hands.send({ image: videoRef.current });
      },
      width: 640,
      height: 480,
    });

    camera.start()
      .then(() => setIsReady(true))
      .catch((err) => {
        console.error('Camera error:', err);
        setError('Failed to access camera. Please ensure permissions are granted.');
      });

    return () => { camera.stop(); hands.close(); };
  }, [videoRef]);

  return { isReady, error };
}

// ─── DrawingCanvas ────────────────────────────────────────────────────────────

interface DrawingCanvasProps {
  handData: HandData | null;
  color: string;
  strokeWidth: number;
  eraserWidth: number;
  width: number;
  height: number;
  onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void;
}

interface DrawingCanvasRef {
  undo: () => void;
  redo: () => void;
  clear: () => void;
  save: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(
  ({ handData, color, strokeWidth, eraserWidth, width, height, onHistoryChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const isDrawingRef = useRef(false);
    const lastPosRef = useRef<{ x: number; y: number } | null>(null);

    const [history, setHistory] = useState<ImageData[]>([]);
    const [historyStep, setHistoryStep] = useState(-1);

    // Init canvas on size change
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      contextRef.current = ctx;
      const init = ctx.getImageData(0, 0, width, height);
      setHistory([init]);
      setHistoryStep(0);
    }, [width, height]);

    useEffect(() => {
      onHistoryChange?.(historyStep > 0, historyStep < history.length - 1);
    }, [historyStep, history.length, onHistoryChange]);

    const saveState = () => {
      const canvas = canvasRef.current;
      const ctx = contextRef.current;
      if (!canvas || !ctx) return;
      const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory(prev => {
        const next = prev.slice(0, historyStep + 1);
        next.push(snap);
        if (next.length > 20) { next.shift(); setHistoryStep(19); return next; }
        setHistoryStep(next.length - 1);
        return next;
      });
    };

    useImperativeHandle(ref, () => ({
      undo: () => {
        if (historyStep > 0) {
          const s = historyStep - 1;
          setHistoryStep(s);
          contextRef.current?.putImageData(history[s], 0, 0);
        }
      },
      redo: () => {
        if (historyStep < history.length - 1) {
          const s = historyStep + 1;
          setHistoryStep(s);
          contextRef.current?.putImageData(history[s], 0, 0);
        }
      },
      clear: () => {
        const canvas = canvasRef.current;
        const ctx = contextRef.current;
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        saveState();
      },
      save: () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const a = document.createElement('a');
        a.download = 'airdraw-masterpiece.png';
        a.href = canvas.toDataURL('image/png');
        a.click();
      },
      canUndo: historyStep > 0,
      canRedo: historyStep < history.length - 1,
    }));

    // Drawing logic
    useEffect(() => {
      const ctx = contextRef.current;
      if (!ctx || !handData) {
        if (isDrawingRef.current) {
          isDrawingRef.current = false;
          lastPosRef.current = null;
          saveState();
        }
        return;
      }

      const x = (1 - handData.x) * width;
      const y = handData.y * height;

      if (handData.gesture === 'draw' || handData.gesture === 'erase') {
        if (!isDrawingRef.current) {
          isDrawingRef.current = true;
          ctx.beginPath();
          ctx.moveTo(x, y);
          lastPosRef.current = { x, y };
        } else if (lastPosRef.current) {
          ctx.beginPath();
          ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
          const mx = (lastPosRef.current.x + x) / 2;
          const my = (lastPosRef.current.y + y) / 2;
          ctx.quadraticCurveTo(lastPosRef.current.x, lastPosRef.current.y, mx, my);
          ctx.lineTo(x, y);

          if (handData.gesture === 'erase') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = eraserWidth;
          } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = color;
            ctx.lineWidth = strokeWidth;
          }
          ctx.stroke();
          lastPosRef.current = { x, y };
        }
      } else {
        if (isDrawingRef.current) {
          isDrawingRef.current = false;
          lastPosRef.current = null;
          saveState();
        }
      }
    }, [handData, color, strokeWidth, eraserWidth, width, height]);

    return (
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full touch-none pointer-events-none"
        style={{ zIndex: 10 }}
      />
    );
  }
);
DrawingCanvas.displayName = 'DrawingCanvas';

// ─── IconButton ───────────────────────────────────────────────────────────────

function IconButton({
  onClick, disabled, icon, title, className,
}: {
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  title: string;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'p-2 rounded-lg transition-colors flex items-center justify-center',
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95',
        className
      )}
    >
      {icon}
    </button>
  );
}

// ─── AirDraw ──────────────────────────────────────────────────────────────────

export interface AirDrawProps {
  /** Optional extra class on the root container */
  className?: string;
}

export function AirDraw({ className }: AirDrawProps) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<DrawingCanvasRef>(null);

  const [handData, setHandData] = useState<HandData | null>(null);
  const [color, setColor] = useState(COLORS[0]);
  const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTHS[1].value);
  const [eraserWidth, setEraserWidth] = useState(ERASER_WIDTHS[1].value);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // UI Toggle States
  const [showGuide, setShowGuide] = useState(window.innerWidth > 768);
  const [showControls, setShowControls] = useState(window.innerWidth > 768);

  const { isReady, error } = useHandTracking({ videoRef, onHandData: setHandData });

  useEffect(() => {
    const onResize = () =>
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  return (
    <div className={cn('relative w-full h-screen overflow-hidden bg-black', className)}>

      {/* ── Back button ── */}
      <button
        onClick={() => navigate('/')}
        className={cn(
          'absolute top-6 left-6 z-50 flex items-center gap-2 px-3 py-2 rounded-full shadow-lg backdrop-blur-md text-sm font-medium transition-colors',
          isDarkMode
            ? 'bg-gray-900/80 text-white hover:bg-gray-700/80'
            : 'bg-white/80 text-gray-900 hover:bg-gray-100/80'
        )}
        aria-label="Go back"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* ── Status bar ── */}
      <div className="absolute top-16 left-6 z-50 flex flex-col gap-4">
        <div className={cn(
          'px-4 py-2 rounded-full shadow-lg backdrop-blur-md flex items-center gap-3',
          isDarkMode ? 'bg-gray-900/80 text-white' : 'bg-white/80 text-gray-900'
        )}>
          <h1 className="font-bold text-lg tracking-tight">AirDraw</h1>
          <div className="w-px h-5 bg-gray-300 dark:bg-gray-700" />
          <div className="flex items-center gap-2 text-sm font-medium">
            {error ? (
              <span className="text-red-500 flex items-center gap-1"><AlertCircle size={16} /> Error</span>
            ) : !isReady ? (
              <span className="text-yellow-500 animate-pulse flex items-center gap-1"><Camera size={16} /> Starting Camera...</span>
            ) : handData ? (
              <span className="text-green-500 flex items-center gap-1"><Hand size={16} /> Hand Detected</span>
            ) : (
              <span className="text-gray-500 flex items-center gap-1"><Hand size={16} /> Waiting for hand...</span>
            )}
          </div>
        </div>

        {/* Mode badge */}
        {handData && (
          <div className={cn(
            'px-4 py-2 rounded-xl shadow-lg backdrop-blur-md flex items-center gap-2 font-medium transition-all',
            handData.gesture === 'draw' ? 'bg-blue-500 text-white' :
              handData.gesture === 'erase' ? 'bg-red-500 text-white' :
                isDarkMode ? 'bg-gray-800/80 text-gray-300' : 'bg-white/80 text-gray-600'
          )}>
            {handData.gesture === 'draw' && '✏️ Drawing Mode'}
            {handData.gesture === 'erase' && '🧽 Erase Mode'}
            {handData.gesture === 'hover' && '👆 Hovering'}
            {handData.gesture === 'none' && '✊ Paused'}
          </div>
        )}
      </div>

      {/* ── Webcam ── */}
      <div className="absolute inset-0 z-0 bg-black">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
          playsInline
          muted
        />
        {!isReady && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-white/50">
            Loading camera...
          </div>
        )}
      </div>

      {/* ── Canvas ── */}
      <DrawingCanvas
        ref={canvasRef}
        handData={handData}
        color={color}
        strokeWidth={strokeWidth}
        eraserWidth={eraserWidth}
        width={dimensions.width}
        height={dimensions.height}
        onHistoryChange={(undo: boolean, redo: boolean) => {
          setCanUndo(undo);
          setCanRedo(redo);
        }}
      />

      {/* ── Visual cursor ── */}
      {handData && (
        <div
          className="absolute pointer-events-none z-40 transition-transform duration-75 ease-out"
          style={{
            left: `${(1 - handData.x) * dimensions.width}px`,
            top: `${handData.y * dimensions.height}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {handData.gesture === 'erase' ? (
            <div
              className="rounded-full border-2 border-red-500 bg-red-500/20 backdrop-blur-sm shadow-lg"
              style={{ width: eraserWidth, height: eraserWidth }}
            />
          ) : handData.gesture === 'draw' ? (
            <div
              className="rounded-full shadow-lg"
              style={{
                width: strokeWidth + 4,
                height: strokeWidth + 4,
                backgroundColor: color,
                border: '2px solid white',
              }}
            />
          ) : (
            <MousePointer2 className={cn(
              'w-6 h-6',
              isDarkMode ? 'text-white drop-shadow-md' : 'text-gray-900 drop-shadow-md'
            )} />
          )}
        </div>
      )}


      {/* Guide Toggle Button */}
      <button
        onClick={() => setShowGuide(true)}
        className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full shadow-lg backdrop-blur-md transition-all duration-300",
          isDarkMode ? "bg-gray-900/80 text-white" : "bg-white/80 text-gray-900",
          showGuide ? "opacity-0 -translate-x-8 pointer-events-none" : "opacity-100 translate-x-0"
        )}
        aria-label="Open Guide"
      >
        <HelpCircle size={24} />
      </button>

      {/* ── Gesture guide ── */}
      <div className={cn(
        "absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3 p-4 rounded-2xl backdrop-blur-md shadow-lg border transition-all duration-300",
        isDarkMode ? "bg-gray-900/80 border-gray-800 text-white" : "bg-white/80 border-gray-200 text-gray-900",
        showGuide ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-[120%] pointer-events-none"
      )}>
        <button
          onClick={() => setShowGuide(false)}
          className="absolute -top-2 -right-2 p-1.5 rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition-colors"
          aria-label="Close Guide"
        >
          <X size={14} />
        </button>

        <div className="flex items-center gap-2 border-b pb-2 border-gray-500/20">
          <Hand size={16} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
          <h3 className="font-bold text-xs uppercase tracking-wider opacity-80">Gestures</h3>
        </div>
        <ul className="flex flex-col gap-3 text-xs font-medium">
          <li className="flex items-center gap-3"><span className="text-lg">👌</span><span className="opacity-80">Pinch to Draw</span></li>
          <li className="flex items-center gap-3"><span className="text-lg">✌️</span><span className="opacity-80">Erase</span></li>
          <li className="flex items-center gap-3"><span className="text-lg">🖐️</span><span className="opacity-80">Palm to Hover</span></li>
          <li className="flex items-center gap-3"><span className="text-lg">✊</span><span className="opacity-80">Fist to Pause</span></li>
        </ul>
      </div>

      {/* ── Controls panel ── */}
      <button 
        onClick={() => setShowControls(true)}
        className={cn(
          "fixed right-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full shadow-lg backdrop-blur-md transition-all duration-300",
          isDarkMode ? "bg-gray-900/80 text-white" : "bg-white/80 text-gray-900",
          showControls ? "opacity-0 translate-x-8 pointer-events-none" : "opacity-100 translate-x-0"
        )}
        aria-label="Open Tools"
      >
        <Settings2 size={24} />
      </button>

      <div className={cn(
        "fixed right-4 md:right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 p-3 rounded-2xl shadow-xl backdrop-blur-md transition-all duration-300 z-50",
        isDarkMode ? "bg-gray-900/80 text-white" : "bg-white/80 text-gray-900",
        showControls ? "translate-x-0 opacity-100" : "translate-x-[120%] opacity-0 pointer-events-none"
      )}>

      <button 
          onClick={() => setShowControls(false)}
          className="absolute -top-2 -left-2 p-1.5 rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition-colors"
          aria-label="Close Tools"
        >
          <X size={14} />
        </button>

        {/* Color swatches */}
        <div className="grid grid-cols-2 gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={cn(
                'w-6 h-6 rounded-full border-2 transition-transform hover:scale-110',
                color === c ? 'border-gray-400 scale-125 shadow-md' : 'border-transparent',
                c === '#FFFFFF' && 'border-gray-200'
              )}
              style={{ backgroundColor: c }}
              aria-label={`Select color ${c}`}
            />
          ))}
        </div>

        <div className="w-full h-px bg-gray-300 dark:bg-gray-700" />

        {/* Pen & Eraser sizes */}
        <div className="flex flex-col gap-3 w-full">
          <div className="flex flex-col gap-1 bg-gray-200/50 dark:bg-gray-700/50 rounded-lg p-1">
            <span className="text-[10px] font-bold uppercase text-center opacity-70">Pen</span>
            <div className="flex justify-center gap-1">
              {STROKE_WIDTHS.map((sw) => (
                <button
                  key={sw.label}
                  onClick={() => setStrokeWidth(sw.value)}
                  className={cn(
                    'w-6 h-6 text-xs rounded-md transition-colors flex items-center justify-center font-medium',
                    strokeWidth === sw.value
                      ? (isDarkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-900 shadow-sm')
                      : 'hover:bg-gray-300/50 dark:hover:bg-gray-600/50'
                  )}
                >
                  {sw.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1 bg-gray-200/50 dark:bg-gray-700/50 rounded-lg p-1">
            <span className="text-[10px] font-bold uppercase text-center opacity-70">Eraser</span>
            <div className="flex justify-center gap-1">
              {ERASER_WIDTHS.map((ew) => (
                <button
                  key={ew.label}
                  onClick={() => setEraserWidth(ew.value)}
                  className={cn(
                    'w-6 h-6 text-xs rounded-md transition-colors flex items-center justify-center font-medium',
                    eraserWidth === ew.value
                      ? (isDarkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-900 shadow-sm')
                      : 'hover:bg-gray-300/50 dark:hover:bg-gray-600/50'
                  )}
                >
                  {ew.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-gray-300 dark:bg-gray-700" />

        {/* Action buttons */}
        <div className="flex flex-col items-center gap-2 w-full">
          <IconButton onClick={() => canvasRef.current?.undo()} disabled={!canUndo} icon={<Undo size={18} />} title="Undo" />
          <IconButton onClick={() => canvasRef.current?.redo()} disabled={!canRedo} icon={<Redo size={18} />} title="Redo" />
          <div className="w-full h-px bg-gray-300 dark:bg-gray-600 my-1" />
          <IconButton
            onClick={() => canvasRef.current?.clear()}
            icon={<Trash2 size={18} />}
            title="Clear Canvas"
            className="text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30"
          />
          <IconButton onClick={() => canvasRef.current?.save()} icon={<Download size={18} />} title="Save Image" />
          <div className="w-full h-px bg-gray-300 dark:bg-gray-600 my-1" />
          <IconButton
            onClick={() => setIsDarkMode(!isDarkMode)}
            icon={isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            title="Toggle Theme"
          />
        </div>
      </div>
    </div>
  );
}

export default AirDraw;
