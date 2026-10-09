import { GRID_SIZE, GRID_TO_GAME_UNITS, CHAMPION_SPEED } from './constants';

export type Point = [number, number];

/** walkable[x][y] === true when the cell can be walked on. */
export type WalkGrid = boolean[][];

export interface PathResult {
  path: Point[];
  explored: number;
  pathDistance: number;
  travelTime: number;
}

export interface MultiPathResult {
  paths: Point[][];
  totalDistance: number;
  totalTime: number;
  segmentTimes: number[];
  explored: number;
}

/** Minimal binary heap keyed on (f, h). */
class MinHeap {
  private items: { idx: number; f: number; h: number }[] = [];
  get size() { return this.items.length; }
  push(item: { idx: number; f: number; h: number }) {
    const a = this.items;
    a.push(item);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (less(a[i], a[p])) { [a[i], a[p]] = [a[p], a[i]]; i = p; } else break;
    }
  }
  pop() {
    const a = this.items;
    const top = a[0];
    const last = a.pop()!;
    if (a.length > 0) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < a.length && less(a[l], a[m])) m = l;
        if (r < a.length && less(a[r], a[m])) m = r;
        if (m === i) break;
        [a[i], a[m]] = [a[m], a[i]];
        i = m;
      }
    }
    return top;
  }
}
function less(a: { f: number; h: number }, b: { f: number; h: number }) {
  return a.f < b.f || (a.f === b.f && a.h < b.h);
}

/** Euclidean distance heuristic, scaled to the 10/14 move costs. */
function heuristic(ax: number, ay: number, bx: number, by: number) {
  return 10 * Math.hypot(ax - bx, ay - by);
}

/**
 * A* on an 8-connected grid. Straight moves cost 10, diagonal moves 14.
 * Diagonal moves may not cut the corner of a blocked cell.
 */
export function calculatePath(
  grid: WalkGrid,
  start: Point,
  end: Point,
  championSpeed: number = CHAMPION_SPEED
): PathResult {
  const N = GRID_SIZE;
  const [sx, sy] = start;
  const [ex, ey] = end;
  const empty = { path: [], explored: 0, pathDistance: 0, travelTime: 0 };
  if (!grid[sx]?.[sy] || !grid[ex]?.[ey]) return empty;

  const g = new Float64Array(N * N).fill(Infinity);
  const parent = new Int32Array(N * N).fill(-1);
  const closed = new Uint8Array(N * N);
  const open = new MinHeap();
  const startIdx = sx * N + sy;
  const endIdx = ex * N + ey;
  g[startIdx] = 0;
  open.push({ idx: startIdx, f: heuristic(sx, sy, ex, ey), h: heuristic(sx, sy, ex, ey) });
  let explored = 0;

  while (open.size > 0) {
    const { idx } = open.pop();
    if (closed[idx]) continue;
    closed[idx] = 1;
    explored++;

    if (idx === endIdx) {
      const path: Point[] = [];
      for (let i = idx; i !== -1; i = parent[i]) path.push([Math.floor(i / N), i % N]);
      path.reverse();
      const { distance, time } = travelMetrics(path, championSpeed);
      return { path, explored, pathDistance: distance, travelTime: time };
    }

    const cx = Math.floor(idx / N), cy = idx % N;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= N || ny >= N || !grid[nx][ny]) continue;
        const diagonal = dx !== 0 && dy !== 0;
        if (diagonal && (!grid[cx + dx][cy] || !grid[cx][cy + dy])) continue;
        const nIdx = nx * N + ny;
        if (closed[nIdx]) continue;
        const tentative = g[idx] + (diagonal ? 14 : 10);
        if (tentative < g[nIdx]) {
          g[nIdx] = tentative;
          parent[nIdx] = idx;
          const h = heuristic(nx, ny, ex, ey);
          open.push({ idx: nIdx, f: tentative + h, h });
        }
      }
    }
  }
  return { ...empty, explored };
}

/** Chain A* through every waypoint in order. */
export function calculateMultiPath(
  grid: WalkGrid,
  waypoints: Point[],
  championSpeed: number = CHAMPION_SPEED
): MultiPathResult {
  const result: MultiPathResult = { paths: [], totalDistance: 0, totalTime: 0, segmentTimes: [], explored: 0 };
  for (let i = 0; i < waypoints.length - 1; i++) {
    const seg = calculatePath(grid, waypoints[i], waypoints[i + 1], championSpeed);
    result.explored += seg.explored;
    if (seg.path.length === 0) continue;
    result.paths.push(seg.path);
    result.totalDistance += seg.pathDistance;
    result.totalTime += seg.travelTime;
    result.segmentTimes.push(seg.travelTime);
  }
  result.totalDistance = Math.round(result.totalDistance);
  result.totalTime = +result.totalTime.toFixed(2);
  return result;
}

function travelMetrics(path: Point[], championSpeed: number) {
  let cells = 0;
  for (let i = 0; i < path.length - 1; i++) {
    cells += Math.hypot(path[i + 1][0] - path[i][0], path[i + 1][1] - path[i][1]);
  }
  const distance = cells * GRID_TO_GAME_UNITS;
  return { distance, time: +(distance / championSpeed).toFixed(2) };
}
