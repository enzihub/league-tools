'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import MapViewer, { SEGMENT_COLORS, markerColor } from './components/MapViewer';
import { CHAMPION_SPEED, GRID_SIZE, MAX_SPEED, MIN_SPEED, SPEED_PRESETS, getMapUrl } from '@/lib/constants';
import { loadGrid, openGrid } from '@/lib/grid';
import { calculateMultiPath, type Point, type WalkGrid } from '@/lib/pathfinding';

/** Find the nearest walkable cell within a small radius, so near-misses still count. */
function snapToWalkable(grid: WalkGrid, x: number, y: number, radius = 2): Point | null {
  let best: Point | null = null;
  let bestD = Infinity;
  for (let dx = -radius; dx <= radius; dx++)
    for (let dy = -radius; dy <= radius; dy++) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE || !grid[nx][ny]) continue;
      const d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = [nx, ny]; }
    }
  return best;
}

export default function WayfinderPage() {
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [grid, setGrid] = useState<WalkGrid | null>(null);
  const [waypoints, setWaypoints] = useState<Point[]>([]);
  const [speed, setSpeed] = useState(CHAMPION_SPEED);
  const [showGrid, setShowGrid] = useState(false);
  const [status, setStatus] = useState<string | null>('Loading Summoner’s Rift…');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = await getMapUrl();
        if (cancelled) return;
        setMapUrl(url);
        const g = await loadGrid(url);
        if (!cancelled) { setGrid(g); setStatus(null); }
      } catch (err) {
        console.error(err);
        if (!cancelled) { setGrid(openGrid()); setStatus('Could not load the map. Using an open grid.'); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!status || !grid) return;
    const t = setTimeout(() => setStatus(null), 2200);
    return () => clearTimeout(t);
  }, [status, grid]);

  const result = useMemo(
    () => (grid && waypoints.length >= 2 ? calculateMultiPath(grid, waypoints, speed) : null),
    [grid, waypoints, speed]
  );

  const addWaypoint = useCallback((x: number, y: number) => {
    if (!grid) return;
    const snapped = snapToWalkable(grid, x, y);
    if (!snapped) { setStatus('That spot is a wall. Click on a lane, the jungle or the river.'); return; }
    setWaypoints((prev) => [...prev, snapped]);
  }, [grid]);

  const removeWaypoint = useCallback(() => setWaypoints((prev) => prev.slice(0, -1)), []);

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <p className="eyebrow">League Tools</p>
          <h1>Wayfinder</h1>
        </div>
        <p className="tagline">A* pathfinding on Summoner’s Rift. Click to drop waypoints, right-click to undo.</p>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <section className="panel">
            <h2 className="panel-title">Champion speed</h2>
            <div className="speed-row">
              <input
                type="range" min={MIN_SPEED} max={MAX_SPEED} step={5} value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))} aria-label="Champion speed"
              />
              <input
                type="number" min={MIN_SPEED} max={MAX_SPEED} value={speed} className="speed-number"
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (v >= MIN_SPEED && v <= MAX_SPEED) setSpeed(v);
                }}
                aria-label="Champion speed value"
              />
            </div>
            <div className="presets">
              {SPEED_PRESETS.map((p) => (
                <button key={p.value} type="button" className={`chip ${speed === p.value ? 'active' : ''}`} onClick={() => setSpeed(p.value)}>
                  {p.label}
                </button>
              ))}
            </div>
          </section>

          <section className="panel" data-testid="route">
            <h2 className="panel-title">Route</h2>
            {result ? (
              <>
                <div className="totals">
                  <div><span className="big" data-testid="total-time">{result.totalTime.toFixed(1)}s</span><span className="label">travel time</span></div>
                  <div><span className="big">{result.totalDistance.toLocaleString('en-US')}</span><span className="label">game units</span></div>
                </div>
                <ol className="segments">
                  {result.segmentTimes.map((t, i) => (
                    <li key={i}>
                      <span className="swatch" style={{ background: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }} />
                      <span>Waypoint {i + 1} → {i + 2}</span>
                      <span className="seg-time">{t.toFixed(2)}s</span>
                    </li>
                  ))}
                </ol>
                <p className="explored">A* expanded {result.explored.toLocaleString('en-US')} cells.</p>
              </>
            ) : (
              <p className="hint">
                {waypoints.length === 0 ? 'Click the map to set a start point.' : 'Add a second waypoint to plot a route.'}
              </p>
            )}
            {waypoints.length > 0 && (
              <ul className="waypoints">
                {waypoints.map(([x, y], i) => (
                  <li key={i}><span className="dot" style={{ background: markerColor(i, waypoints.length) }} />{i + 1}. cell ({x}, {y})</li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel actions">
            <label className="toggle">
              <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
              Show blocked cells
            </label>
            <div className="buttons">
              <button type="button" onClick={removeWaypoint} disabled={waypoints.length === 0}>Undo</button>
              <button type="button" className="primary" onClick={() => setWaypoints([])} disabled={waypoints.length === 0}>Reset</button>
            </div>
          </section>
        </aside>

        <div className="map-wrap">
          <MapViewer
            mapUrl={mapUrl}
            grid={grid}
            showGrid={showGrid}
            waypoints={waypoints}
            paths={result?.paths ?? []}
            segmentTimes={result?.segmentTimes ?? []}
            onAddWaypoint={addWaypoint}
            onRemoveWaypoint={removeWaypoint}
            status={status}
          />
        </div>
      </div>

      <footer className="legal">
        League Tools isn’t endorsed by Riot Games and doesn’t reflect the views or opinions of Riot Games or anyone
        officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties
        are trademarks or registered trademarks of Riot Games, Inc.
      </footer>
    </div>
  );
}
