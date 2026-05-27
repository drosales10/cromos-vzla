import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./albumSticker.css";

const MODAL_TRANSITION_MS = 260;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const hashStickerSeed = (input) => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return {
    x: hash % 734,
    y: Math.floor(hash / 7) % 1280,
  };
};

const rarityClassByValue = {
  GOLD: "gold",
  SPECIAL: "special",
  COMMON: "common",
};

export default function AlbumSticker({ sticker, sectionId, quantity, rarity = "COMMON", imageCandidates = [] }) {
  const [imageIndex, setImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [overlayState, setOverlayState] = useState("closed");
  const [pointer, setPointer] = useState({ x: 50, y: 50, tiltX: 0, tiltY: 0, active: false });
  const idleFrameRef = useRef(null);
  const rootRef = useRef(null);
  const closeTimerRef = useRef(null);

  const candidatesKey = imageCandidates.join("|");
  const activeImage = imageCandidates[imageIndex] || null;
  const isOwned = quantity > 0;
  const isDouble = quantity > 1;
  const stateClass = isDouble ? "both" : isOwned ? "have" : "need";
  const stateLabel = isDouble ? `DOBLE x${quantity}` : isOwned ? "TENGO" : "FALTA";
  const rarityClass = rarityClassByValue[rarity] || "common";
  const seed = useMemo(() => hashStickerSeed(sticker.id), [sticker.id]);

  const isExpanded = overlayState !== "closed";

  useEffect(() => {
    setImageIndex(0);
    setImageLoaded(false);
  }, [sticker.id, candidatesKey]);

  useEffect(() => {
    if (overlayState !== "open") {
      if (idleFrameRef.current) cancelAnimationFrame(idleFrameRef.current);
      return undefined;
    }

    let mounted = true;
    const start = performance.now();

    const tick = (now) => {
      if (!mounted) return;
      setPointer((prev) => {
        if (prev.active) return prev;
        const elapsed = (now - start) / 1000;
        const px = 50 + Math.sin(elapsed * 1.35) * 20;
        const py = 50 + Math.cos(elapsed * 1.1) * 16;
        return {
          x: px,
          y: py,
          tiltX: clamp((50 - py) / 4.8, -10, 10),
          tiltY: clamp((px - 50) / 4.4, -10, 10),
          active: false,
        };
      });
      idleFrameRef.current = requestAnimationFrame(tick);
    };

    idleFrameRef.current = requestAnimationFrame(tick);

    return () => {
      mounted = false;
      if (idleFrameRef.current) cancelAnimationFrame(idleFrameRef.current);
    };
  }, [overlayState]);

  useEffect(() => () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
  }, []);

  useEffect(() => {
    if (!isExpanded) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        startCloseExpanded();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isExpanded]);

  const handlePointerMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
    const py = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100);
    const tiltY = clamp((px - 50) / 7, -8, 8);
    const tiltX = clamp((50 - py) / 6, -8, 8);
    setPointer({ x: px, y: py, tiltX, tiltY, active: true });
  };

  const resetPointer = () => {
    setPointer({ x: 50, y: 50, tiltX: 0, tiltY: 0, active: false });
  };

  const handleImageError = () => {
    setImageLoaded(false);
    setImageIndex((prev) => prev + 1);
  };

  const tileStyle = {
    "--pointer-x": `${pointer.x}%`,
    "--pointer-y": `${pointer.y}%`,
    "--rotate-x": `${pointer.tiltX}deg`,
    "--rotate-y": `${pointer.tiltY}deg`,
    "--pointer-active": pointer.active ? 1 : 0,
    "--cosmos-x": `${seed.x}px`,
    "--cosmos-y": `${seed.y}px`,
  };

  const closeExpanded = () => {
    setOverlayState("closed");
    resetPointer();
  };

  const fullscreenStage = typeof document !== "undefined"
    ? rootRef.current?.closest(".book-stage.fullscreen") || null
    : null;
  const portalTarget = fullscreenStage || (typeof document !== "undefined" ? document.body : null);
  const modalClassName = `album-sticker-modal ${fullscreenStage ? "album-sticker-modal--inside-stage" : ""} album-sticker-modal--${overlayState}`;

  const handleOpenExpanded = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (overlayState !== "closed") return;
    setOverlayState("opening");
    requestAnimationFrame(() => setOverlayState("open"));
  };

  const startCloseExpanded = () => {
    if (overlayState !== "open") return;
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    setOverlayState("closing");
    closeTimerRef.current = window.setTimeout(() => {
      closeExpanded();
    }, MODAL_TRANSITION_MS);
  };

  const renderSticker = (expanded = false) => (
    <div
      ref={expanded ? null : rootRef}
      className={`chip album-sticker ${stateClass} album-sticker--${rarityClass} ${expanded ? "album-sticker--expanded" : ""}`}
      onContextMenu={(event) => event.preventDefault()}
      style={{ userSelect: "none", WebkitUserSelect: "none", cursor: expanded ? "default" : "zoom-in", background: "rgba(255,255,255,.65)", borderColor: "rgba(30,40,58,.18)" }}
      title={`${sticker.id} — ${stateLabel}`}
    >
      <button
        type="button"
        className="chip-tile album-sticker__tile"
        style={tileStyle}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetPointer}
        onPointerCancel={resetPointer}
        onClick={expanded ? undefined : handleOpenExpanded}
      >
        {activeImage ? (
          <>
            <img
              src={activeImage}
              alt={sticker.id}
              className="album-sticker__image"
              onLoad={() => setImageLoaded(true)}
              onError={handleImageError}
            />
            <div className="chip-fallback album-sticker__fallback" style={{ display: imageLoaded ? "none" : "flex" }}>
              {sticker.num}
            </div>
          </>
        ) : (
          <div className="chip-fallback album-sticker__fallback">{sticker.num}</div>
        )}

        <div className="album-sticker__surface" aria-hidden="true">
          <div className="album-sticker__shine" />
          <div className="album-sticker__glare" />
          <div className="album-sticker__spark album-sticker__spark--a" />
          <div className="album-sticker__spark album-sticker__spark--b" />
        </div>

        <span className="chip-id">{sectionId}</span>
        <div className="ov">{stateLabel}</div>
      </button>
    </div>
  );

  return (
    <>
      {renderSticker(false)}
      {isExpanded && portalTarget && createPortal(
        <div className={modalClassName} onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          startCloseExpanded();
        }}>
          <div className="album-sticker-modal__stage" onClick={(event) => event.stopPropagation()}>
            {renderSticker(true)}
          </div>
        </div>,
        portalTarget,
      )}
    </>
  );
}
