import { GRID_SIZE, WALKABLE_SHARE, BRIGHTNESS_THRESHOLD } from './constants';
import type { WalkGrid } from './pathfinding';

/**
 * Build a walkability grid from the minimap pixels.
 *
 * Walls and out-of-bounds areas are near-black on the Data Dragon minimap,
 * while lanes, jungle and river are lighter. A cell is walkable when enough
 * of its pixels are brighter than BRIGHTNESS_THRESHOLD.
 */
export function gridFromImageData(image: ImageData): WalkGrid {
  const { width, height, data } = image;
  const grid: WalkGrid = [];
  for (let x = 0; x < GRID_SIZE; x++) {
    const col: boolean[] = [];
    const x0 = Math.floor((x * width) / GRID_SIZE), x1 = Math.floor(((x + 1) * width) / GRID_SIZE);
    for (let y = 0; y < GRID_SIZE; y++) {
      const y0 = Math.floor((y * height) / GRID_SIZE), y1 = Math.floor(((y + 1) * height) / GRID_SIZE);
      let bright = 0, total = 0;
      for (let px = x0; px < x1; px++) {
        for (let py = y0; py < y1; py++) {
          const i = (py * width + px) * 4;
          if ((data[i] + data[i + 1] + data[i + 2]) / 3 > BRIGHTNESS_THRESHOLD) bright++;
          total++;
        }
      }
      col.push(total > 0 && bright / total >= WALKABLE_SHARE);
    }
    grid.push(col);
  }
  return grid;
}

/** Load an image (CORS-enabled) and turn it into a walkability grid. */
export async function loadGrid(url: string): Promise<WalkGrid> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;
  await img.decode();
  const size = 800;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, size, size);
  return gridFromImageData(ctx.getImageData(0, 0, size, size));
}

/** Fallback when the map cannot be loaded: an open field. */
export function openGrid(): WalkGrid {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(true));
}
