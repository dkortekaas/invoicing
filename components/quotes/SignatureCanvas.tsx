"use client"

/**
 * SignatureCanvas — teken-component voor digitale handtekeningen.
 *
 * Kenmerken:
 *   - Touch én muis: mousemove + touchmove (passive: false zodat pagina niet scrollt)
 *   - Bezier-smoothing: kwadratische curves via midpunten voor vloeiende lijnen
 *   - Undo per lijn (stroke-history)
 *   - Clear: reset alles
 *   - Export: transparante PNG via canvas.toDataURL()
 *   - Responsive: ResizeObserver hertekent bij containerwijziging
 *   - Retina/HiDPI: schaalt via devicePixelRatio
 *
 * Gebruik (via ref):
 *   const ref = useRef<SignatureCanvasRef>(null)
 *   ref.current?.clear()
 *   ref.current?.undo()
 *   const png = ref.current?.getDataUrl()   // transparante PNG (base64)
 *   ref.current?.isEmpty()                  // true als nog niet getekend
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Point {
  x: number
  y: number
}

export interface SignatureCanvasRef {
  /** Verwijder alle strepen en reset history. */
  clear: () => void
  /** Verwijder de laatste streep (undo). */
  undo: () => void
  /** True als er nog niets getekend is. */
  isEmpty: () => boolean
  /**
   * Exporteer de handtekening als base64 data-URL.
   * @param mimeType standaard "image/png" (transparante achtergrond)
   */
  getDataUrl: (mimeType?: string) => string
}

export interface SignatureCanvasProps {
  /** CSS-klasse voor de buitenste container. */
  className?: string
  /** Lijndikte in logische pixels (standaard 2). */
  strokeWidth?: number
  /** Lijnkleur (standaard "#1a1a1a"). */
  strokeColor?: string
  /** Disabled-modus: tekenen uitgeschakeld. */
  disabled?: boolean
  /** Wordt aangeroepen zodra de gebruiker begint met tekenen. */
  onBegin?: () => void
  /** Wordt aangeroepen na elke voltooide streep (stroke end). */
  onChange?: (isEmpty: boolean) => void
}

// ─── Hulpfuncties ─────────────────────────────────────────────────────────────

function midPoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

/**
 * Tekent één voltooide streep als een reeks kwadratische bezier-curves.
 * Door via de midpunten te tekenen ontstaan vloeiende, niet-hoekige lijnen.
 */
function drawStroke(
  ctx: CanvasRenderingContext2D,
  pts: Point[],
  strokeColor: string,
  strokeWidth: number,
) {
  if (pts.length === 0) return

  ctx.save()
  ctx.strokeStyle = strokeColor
  ctx.fillStyle = strokeColor
  ctx.lineWidth = strokeWidth
  ctx.lineCap = "round"
  ctx.lineJoin = "round"

  if (pts.length === 1) {
    // Enkelvoudig punt → teken een cirkel
    ctx.beginPath()
    ctx.arc(pts[0]!.x, pts[0]!.y, strokeWidth / 2, 0, 2 * Math.PI)
    ctx.fill()
    ctx.restore()
    return
  }

  ctx.beginPath()
  ctx.moveTo(pts[0]!.x, pts[0]!.y)

  for (let i = 1; i < pts.length - 1; i++) {
    const cp = pts[i]!
    const end = pts[i + 1]!
    const mid = midPoint(cp, end)
    ctx.quadraticCurveTo(cp.x, cp.y, mid.x, mid.y)
  }

  // Sluit af op het laatste punt
  const last = pts[pts.length - 1]!
  const secondLast = pts[pts.length - 2]!
  ctx.quadraticCurveTo(secondLast.x, secondLast.y, last.x, last.y)

  ctx.stroke()
  ctx.restore()
}

/** Herteken alle strepen op het canvas (bij undo/resize). */
function redrawAll(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strokes: Point[][],
  strokeColor: string,
  strokeWidth: number,
) {
  ctx.clearRect(0, 0, width, height)
  for (const stroke of strokes) {
    drawStroke(ctx, stroke, strokeColor, strokeWidth)
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

const SignatureCanvas = forwardRef<SignatureCanvasRef, SignatureCanvasProps>(
  function SignatureCanvas(
    {
      className,
      strokeWidth = 2,
      strokeColor = "#1a1a1a",
      disabled = false,
      onBegin,
      onChange,
    },
    ref,
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Mutable state via refs (geen re-renders tijdens tekenen)
    const strokesRef = useRef<Point[][]>([])
    const currentStrokeRef = useRef<Point[]>([])
    const isDrawingRef = useRef(false)
    // Dimensies na DPR-schaling (logische pixels)
    const logicalSizeRef = useRef({ w: 0, h: 0 })

    // Alleen voor knop-enabled/disabled feedback
    const [hasStrokes, setHasStrokes] = useState(false)

    // ─── Canvas setup / resize ───────────────────────────────────────────

    const setupCanvas = useCallback(() => {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return

      const dpr = window.devicePixelRatio ?? 1
      const { width, height } = container.getBoundingClientRect()

      if (width === 0 || height === 0) return

      logicalSizeRef.current = { w: width, h: height }

      // Fysieke pixels
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      // Logische grootte via CSS
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      ctx.scale(dpr, dpr)

      // Herteken bestaande strepen na resize
      redrawAll(ctx, width, height, strokesRef.current, strokeColor, strokeWidth)
    }, [strokeColor, strokeWidth])

    // ResizeObserver
    useEffect(() => {
      const container = containerRef.current
      if (!container) return

      setupCanvas()

      const observer = new ResizeObserver(() => setupCanvas())
      observer.observe(container)
      return () => observer.disconnect()
    }, [setupCanvas])

    // ─── Coördinaten uit event ────────────────────────────────────────────

    const getPoint = useCallback(
      (e: MouseEvent | Touch): Point => {
        const canvas = canvasRef.current!
        const rect = canvas.getBoundingClientRect()
        return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        }
      },
      [],
    )

    // ─── Tekenlogica ──────────────────────────────────────────────────────

    const beginStroke = useCallback(
      (pt: Point) => {
        if (disabled) return
        isDrawingRef.current = true
        currentStrokeRef.current = [pt]

        const ctx = canvasRef.current?.getContext("2d")
        if (!ctx) return

        // Teken een punt zodat een enkele tap ook zichtbaar is
        ctx.save()
        ctx.fillStyle = strokeColor
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, strokeWidth / 2, 0, 2 * Math.PI)
        ctx.fill()
        ctx.restore()

        onBegin?.()
      },
      [disabled, onBegin, strokeColor, strokeWidth],
    )

    const continueStroke = useCallback(
      (pt: Point) => {
        if (!isDrawingRef.current) return

        const pts = currentStrokeRef.current
        pts.push(pt)

        if (pts.length < 3) return

        const ctx = canvasRef.current?.getContext("2d")
        if (!ctx) return

        // Teken incrementeel: van vorig midpunt naar huidig midpunt
        const prev2 = pts[pts.length - 3]!
        const prev1 = pts[pts.length - 2]!
        const curr = pts[pts.length - 1]!

        const fromMid = midPoint(prev2, prev1)
        const toMid = midPoint(prev1, curr)

        ctx.save()
        ctx.strokeStyle = strokeColor
        ctx.lineWidth = strokeWidth
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.beginPath()
        ctx.moveTo(fromMid.x, fromMid.y)
        ctx.quadraticCurveTo(prev1.x, prev1.y, toMid.x, toMid.y)
        ctx.stroke()
        ctx.restore()
      },
      [strokeColor, strokeWidth],
    )

    const endStroke = useCallback(() => {
      if (!isDrawingRef.current) return
      isDrawingRef.current = false

      const stroke = currentStrokeRef.current
      if (stroke.length > 0) {
        strokesRef.current.push([...stroke])
        setHasStrokes(true)
        onChange?.(false)
      }
      currentStrokeRef.current = []
    }, [onChange])

    // ─── Muis events (via useEffect voor passive-control) ─────────────────

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const onMouseDown = (e: MouseEvent) => {
        if (e.button !== 0) return
        beginStroke(getPoint(e))
      }
      const onMouseMove = (e: MouseEvent) => continueStroke(getPoint(e))
      const onMouseUp = () => endStroke()
      const onMouseLeave = () => endStroke()

      canvas.addEventListener("mousedown", onMouseDown)
      canvas.addEventListener("mousemove", onMouseMove)
      canvas.addEventListener("mouseup", onMouseUp)
      canvas.addEventListener("mouseleave", onMouseLeave)

      return () => {
        canvas.removeEventListener("mousedown", onMouseDown)
        canvas.removeEventListener("mousemove", onMouseMove)
        canvas.removeEventListener("mouseup", onMouseUp)
        canvas.removeEventListener("mouseleave", onMouseLeave)
      }
    }, [beginStroke, continueStroke, endStroke, getPoint])

    // ─── Touch events (passive: false zodat scrollen geblokkeerd wordt) ───

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const onTouchStart = (e: TouchEvent) => {
        e.preventDefault()
        const touch = e.touches[0]
        if (touch) beginStroke(getPoint(touch))
      }
      const onTouchMove = (e: TouchEvent) => {
        e.preventDefault()
        const touch = e.touches[0]
        if (touch) continueStroke(getPoint(touch))
      }
      const onTouchEnd = () => endStroke()
      const onTouchCancel = () => endStroke()

      canvas.addEventListener("touchstart", onTouchStart, { passive: false })
      canvas.addEventListener("touchmove", onTouchMove, { passive: false })
      canvas.addEventListener("touchend", onTouchEnd)
      canvas.addEventListener("touchcancel", onTouchCancel)

      return () => {
        canvas.removeEventListener("touchstart", onTouchStart)
        canvas.removeEventListener("touchmove", onTouchMove)
        canvas.removeEventListener("touchend", onTouchEnd)
        canvas.removeEventListener("touchcancel", onTouchCancel)
      }
    }, [beginStroke, continueStroke, endStroke, getPoint])

    // ─── Publieke API via ref ──────────────────────────────────────────────

    const clear = useCallback(() => {
      strokesRef.current = []
      currentStrokeRef.current = []
      isDrawingRef.current = false
      setHasStrokes(false)
      onChange?.(true)

      const canvas = canvasRef.current
      const { w, h } = logicalSizeRef.current
      const ctx = canvas?.getContext("2d")
      ctx?.clearRect(0, 0, w, h)
    }, [onChange])

    const undo = useCallback(() => {
      if (strokesRef.current.length === 0) return
      strokesRef.current.pop()
      setHasStrokes(strokesRef.current.length > 0)
      onChange?.(strokesRef.current.length === 0)

      const canvas = canvasRef.current
      const { w, h } = logicalSizeRef.current
      const ctx = canvas?.getContext("2d")
      if (!ctx) return
      redrawAll(ctx, w, h, strokesRef.current, strokeColor, strokeWidth)
    }, [onChange, strokeColor, strokeWidth])

    useImperativeHandle(ref, () => ({
      clear,
      undo,
      isEmpty: () => strokesRef.current.length === 0,
      getDataUrl: (mimeType = "image/png") =>
        canvasRef.current?.toDataURL(mimeType) ?? "",
    }))

    // ─── Render ───────────────────────────────────────────────────────────

    return (
      <div
        ref={containerRef}
        className={cn(
          "relative w-full",
          disabled && "pointer-events-none opacity-60",
          className,
        )}
      >
        <canvas
          ref={canvasRef}
          className={cn(
            "block touch-none",
            !disabled && "cursor-crosshair",
          )}
          aria-label="Handtekeningveld"
        />
        {/* Richtlijn-lijn */}
        <div
          className="pointer-events-none absolute bottom-10 left-6 right-6 border-b border-dashed border-gray-300"
          aria-hidden
        />
        {/* Placeholder-tekst zolang leeg */}
        {!hasStrokes && (
          <p
            className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground select-none"
            aria-hidden
          >
            Teken hier uw handtekening
          </p>
        )}
      </div>
    )
  },
)

export default SignatureCanvas
