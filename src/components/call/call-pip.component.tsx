import { useCallback, useRef, useState } from 'react';
import iconCallEnd from '../../assets/icons/icon-call-end.svg';
import iconMaximize from '../../assets/icons/icon-maximize.svg';
import type { CallPipProps } from '../../types/incoming-call.types';

const PIP_WIDTH = 320;
const PIP_HEIGHT = 224;
const EDGE_MARGIN = 24;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const CallPip = ({ callerName, onMaximize, onEndCall }: CallPipProps) => {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null
  );
  const dragOffset = useRef<{ x: number; y: number } | null>(null);

  const handlePointerMove = useCallback((event: PointerEvent) => {
    if (!dragOffset.current) return;
    const maxX = globalThis.innerWidth - PIP_WIDTH;
    const maxY = globalThis.innerHeight - PIP_HEIGHT;
    setPosition({
      x: clamp(event.clientX - dragOffset.current.x, 0, Math.max(0, maxX)),
      y: clamp(event.clientY - dragOffset.current.y, 0, Math.max(0, maxY)),
    });
  }, []);

  const handlePointerUp = useCallback(() => {
    dragOffset.current = null;
    globalThis.removeEventListener('pointermove', handlePointerMove);
    globalThis.removeEventListener('pointerup', handlePointerUp);
  }, [handlePointerMove]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      // Ignore drags that start on a button (maximize / end call).
      if ((event.target as HTMLElement).closest('button')) return;

      const rect = event.currentTarget.getBoundingClientRect();
      dragOffset.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      globalThis.addEventListener('pointermove', handlePointerMove);
      globalThis.addEventListener('pointerup', handlePointerUp);
    },
    [handlePointerMove, handlePointerUp]
  );

  const positioned = position !== null;

  return (
    <div
      data-testid="call-pip"
      onPointerDown={handlePointerDown}
      style={
        positioned
          ? { left: position.x, top: position.y }
          : { right: EDGE_MARGIN, bottom: EDGE_MARGIN }
      }
      className="fixed z-70 h-56 w-80 cursor-move touch-none select-none overflow-hidden rounded-2xl bg-slate-950 shadow-2xl"
    >
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1400&q=80')] bg-cover bg-center opacity-85" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-transparent to-slate-950/70" />
      <div className="absolute left-0 right-0 top-0 px-3 py-2 text-white">
        <p className="truncate text-xs font-semibold">Dr. {callerName}</p>
        <p className="text-[10px] text-slate-300">In call</p>
      </div>
      <button
        type="button"
        onClick={onMaximize}
        aria-label="Maximize call"
        className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-lg transition hover:bg-white"
      >
        <img src={iconMaximize} alt="" className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onEndCall}
        aria-label="End call"
        className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:bg-red-700"
      >
        <img src={iconCallEnd} alt="" className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default CallPip;
