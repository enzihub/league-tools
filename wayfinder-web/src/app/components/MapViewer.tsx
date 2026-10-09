'use client';

import { useEffect, useRef } from 'react';
import { GRID_SIZE } from '@/lib/constants';
import type { Point, WalkGrid } from '@/lib/pathfinding';

interface MapViewerProps {
  mapUrl: string | null;
  grid: WalkGrid | null;
  showGrid: boolean;
  waypoints: Point[];
  paths: Point[][];
  segmentTimes: number[];
  onAddWaypoint: (x: number, y: number) => void;
  onRemoveWaypoint: () => void;
  status: string | null;
}

export const SEGMENT_COLORS = ['#0ac8b9', '#c8aa6e', '#e2617b', '#8c7cf0', '#6fd36f', '#f0a04b'];

export function markerColor(index: number, total: number) {
  if (index === 0) return '#0ac8b9';
  if (index === total - 1) return '#e2617b';
  return '#c8aa6e';
}

export default function MapViewer({
  mapUrl, grid, showGrid, waypoints, paths, segmentTimes, onAddWaypoint, onRemoveWaypoint, status,
}: MapViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const box = boxRef.current;
    if (!canvas || !box) return;

    const draw = () => {
      const size = box.clientWidth;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      const ctx = canvas.getContext('2d')!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      const cell = size / GRID_SIZE;
      const cx = (v: number) => (v + 0.5) * cell;

      if (showGrid && grid) {
        ctx.fillStyle = 'rgba(226, 97, 123, 0.38)';
        for (let x = 0; x < GRID_SIZE; x++)
          for (let y = 0; y < GRID_SIZE; y++)
            if (!grid[x][y]) ctx.fillRect(x * cell, y * cell, cell + 0.5, cell + 0.5);
      }

      paths.forEach((path, i) => {
        if (path.length < 2) return;
        const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        // glow
        ctx.strokeStyle = color + '55';
        ctx.lineWidth = 10;
        ctx.beginPath();
        path.forEach(([x, y], j) => (j ? ctx.lineTo(cx(x), cx(y)) : ctx.moveTo(cx(x), cx(y))));
        ctx.stroke();
        ctx.strokeStyle = color;
        ctx.lineWidth = 3.5;
        ctx.stroke();

        const t = segmentTimes[i];
        if (t !== undefined) {
          const [mx, my] = path[Math.floor(path.length / 2)];
          const label = `${t.toFixed(1)}s`;
          ctx.font = '600 12px Inter, system-ui, sans-serif';
          const w = ctx.measureText(label).width + 12;
          ctx.fillStyle = 'rgba(5, 10, 18, 0.85)';
          ctx.beginPath();
          ctx.roundRect(cx(mx) - w / 2, cx(my) - 11, w, 22, 6);
          ctx.fill();
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = '#f0e6d2';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, cx(mx), cx(my) + 0.5);
        }
      });

      waypoints.forEach(([x, y], i) => {
        ctx.beginPath();
        ctx.arc(cx(x), cx(y), 11, 0, Math.PI * 2);
        ctx.fillStyle = markerColor(i, waypoints.length);
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#050a12';
        ctx.stroke();
        ctx.fillStyle = '#050a12';
        ctx.font = '700 12px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), cx(x), cx(y) + 0.5);
      });
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(box);
    return () => ro.disconnect();
  }, [grid, showGrid, waypoints, paths, segmentTimes]);

  const toGrid = (e: React.MouseEvent) => {
    const rect = boxRef.current!.getBoundingClientRect();
    return [
      Math.floor(((e.clientX - rect.left) / rect.width) * GRID_SIZE),
      Math.floor(((e.clientY - rect.top) / rect.height) * GRID_SIZE),
    ] as const;
  };

  return (
    <div
      ref={boxRef}
      className="map-box"
      data-testid="map"
      onClick={(e) => { const [x, y] = toGrid(e); onAddWaypoint(x, y); }}
      onContextMenu={(e) => { e.preventDefault(); onRemoveWaypoint(); }}
    >
      {mapUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mapUrl} alt="Summoner's Rift minimap from Riot Data Dragon" crossOrigin="anonymous" draggable={false} />
      )}
      <canvas ref={canvasRef} />
      {status && <div className="map-status" role="status">{status}</div>}
    </div>
  );
}
