import { useEffect, useRef, useState } from "react";
import {
  FiMaximize,
  FiMinimize,
  FiMove,
  FiRotateCcw,
  FiZoomIn,
  FiZoomOut,
} from "react-icons/fi";
import { DEFAULT_FRAMING, MAX_ZOOM, MIN_ZOOM, framingStyle } from "../../lib/rentals";

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const round1 = (v) => Math.round(v * 10) / 10;
const ZOOM_STEP = 0.1;

/**
 * Lets the admin fit a product photo to the card's image box:
 *  - Fill card (crop to fill) or Show whole image (letterbox)
 *  - Zoom 100%–300%
 *  - Drag (or arrow keys) to choose which part of the photo is visible
 * The box uses the same 2:1 shape as the homepage card image.
 */
const ImageFramer = ({ src, framing, onChange }) => {
  const frameRef = useRef(null);
  const dragRef = useRef(null);
  const [frameSize, setFrameSize] = useState({ w: 0, h: 0 });
  const [natural, setNatural] = useState(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setFrameSize({ w: width, h: height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // How far (px) the zoomed image extends past the box on each axis.
  let overflowX = 0;
  let overflowY = 0;
  if (natural && frameSize.w && frameSize.h) {
    const scale =
      framing.fit === "cover"
        ? Math.max(frameSize.w / natural.w, frameSize.h / natural.h)
        : Math.min(frameSize.w / natural.w, frameSize.h / natural.h);
    overflowX = natural.w * scale * framing.zoom - frameSize.w;
    overflowY = natural.h * scale * framing.zoom - frameSize.h;
  }
  const canMoveX = overflowX > 1;
  const canMoveY = overflowY > 1;
  const canMove = canMoveX || canMoveY;

  const update = (patch) => onChange({ ...framing, ...patch });

  const handlePointerDown = (event) => {
    if (!canMove || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      x: framing.x,
      y: framing.y,
      overflowX,
      overflowY,
    };
    setDragging(true);
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    // Dragging the photo right reveals more of its left side → smaller x%.
    const x = drag.overflowX > 1 ? clamp(drag.x - (dx / drag.overflowX) * 100, 0, 100) : drag.x;
    const y = drag.overflowY > 1 ? clamp(drag.y - (dy / drag.overflowY) * 100, 0, 100) : drag.y;
    update({ x: round1(x), y: round1(y) });
  };

  const endDrag = () => {
    dragRef.current = null;
    setDragging(false);
  };

  const handleKeyDown = (event) => {
    const step = event.shiftKey ? 10 : 2;
    const moves = {
      ArrowLeft: canMoveX && { x: clamp(framing.x + step, 0, 100) },
      ArrowRight: canMoveX && { x: clamp(framing.x - step, 0, 100) },
      ArrowUp: canMoveY && { y: clamp(framing.y + step, 0, 100) },
      ArrowDown: canMoveY && { y: clamp(framing.y - step, 0, 100) },
      "+": { zoom: clamp(framing.zoom + ZOOM_STEP, MIN_ZOOM, MAX_ZOOM) },
      "=": { zoom: clamp(framing.zoom + ZOOM_STEP, MIN_ZOOM, MAX_ZOOM) },
      "-": { zoom: clamp(framing.zoom - ZOOM_STEP, MIN_ZOOM, MAX_ZOOM) },
    };
    if (event.key in moves) {
      event.preventDefault();
      if (moves[event.key]) update(moves[event.key]);
    }
  };

  // Changing the fit starts from a centred, un-zoomed photo.
  const setFit = (fit) => {
    if (fit !== framing.fit) onChange({ ...DEFAULT_FRAMING, fit });
  };

  const setZoom = (zoom) =>
    update({ zoom: Math.round(clamp(zoom, MIN_ZOOM, MAX_ZOOM) * 100) / 100 });

  const isDefault =
    framing.fit === DEFAULT_FRAMING.fit &&
    framing.zoom === DEFAULT_FRAMING.zoom &&
    framing.x === DEFAULT_FRAMING.x &&
    framing.y === DEFAULT_FRAMING.y;

  let hint = "Drag the photo to choose what shows in the card.";
  if (!canMove) {
    hint =
      framing.fit === "contain" && framing.zoom === 1
        ? "The whole photo is visible. Zoom in to crop and reposition."
        : "The photo already fits this shape. Zoom in to crop tighter.";
  }

  return (
    <div className="cms-framer">
      <div
        ref={frameRef}
        className={`cms-framer-box ${canMove ? "can-move" : ""} ${dragging ? "is-dragging" : ""}`}
        tabIndex={0}
        role="group"
        aria-label="Image framing. Drag, or use arrow keys to move and plus or minus to zoom."
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={handleKeyDown}
      >
        <img
          src={src}
          alt="Product photo framing"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          onLoad={(e) =>
            setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
          }
          style={framingStyle(framing)}
        />
        {canMove && !dragging && (
          <span className="cms-framer-badge" aria-hidden="true">
            <FiMove /> Drag to move
          </span>
        )}
      </div>

      <div className="cms-framer-controls">
        <div className="cms-segmented" role="radiogroup" aria-label="How the photo fits the card">
          <button
            type="button"
            role="radio"
            aria-checked={framing.fit === "cover"}
            className={framing.fit === "cover" ? "is-active" : ""}
            onClick={() => setFit("cover")}
            title="Crop the photo so it fills the whole card image area"
          >
            <FiMaximize aria-hidden="true" /> Fill card
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={framing.fit === "contain"}
            className={framing.fit === "contain" ? "is-active" : ""}
            onClick={() => setFit("contain")}
            title="Shrink the photo so none of it is cut off"
          >
            <FiMinimize aria-hidden="true" /> Show whole image
          </button>
        </div>

        <div className="cms-zoom">
          <button
            type="button"
            className="cms-icon-btn cms-icon-btn-sm"
            onClick={() => setZoom(framing.zoom - ZOOM_STEP)}
            disabled={framing.zoom <= MIN_ZOOM}
            aria-label="Zoom out"
          >
            <FiZoomOut />
          </button>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step="0.01"
            value={framing.zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            aria-label="Zoom"
            aria-valuetext={`${Math.round(framing.zoom * 100)}%`}
          />
          <button
            type="button"
            className="cms-icon-btn cms-icon-btn-sm"
            onClick={() => setZoom(framing.zoom + ZOOM_STEP)}
            disabled={framing.zoom >= MAX_ZOOM}
            aria-label="Zoom in"
          >
            <FiZoomIn />
          </button>
          <span className="cms-zoom-value">{Math.round(framing.zoom * 100)}%</span>
        </div>

        <button
          type="button"
          className="cms-btn cms-btn-ghost cms-btn-sm"
          onClick={() => onChange({ ...DEFAULT_FRAMING })}
          disabled={isDefault}
        >
          <FiRotateCcw aria-hidden="true" /> Reset
        </button>
      </div>

      <p className="cms-hint">{hint}</p>
    </div>
  );
};

export default ImageFramer;
