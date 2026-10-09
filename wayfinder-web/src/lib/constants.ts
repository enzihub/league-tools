// Constants for the League Wayfinder A* pathfinding tool.

/** The map is split into GRID_SIZE x GRID_SIZE cells. */
export const GRID_SIZE = 100;

/** Default champion movement speed (units per second). */
export const CHAMPION_SPEED = 345;
export const MIN_SPEED = 100;
export const MAX_SPEED = 1000;

/**
 * Summoner's Rift is about 14,870 game units across and the minimap
 * covers the whole map, so one of 100 cells is roughly 150 units.
 */
export const GRID_TO_GAME_UNITS = 148.7;

/** A cell is walkable when at least this share of its pixels are bright. */
export const WALKABLE_SHARE = 0.6;
/** Pixel brightness (0-255 average of RGB) above which a pixel counts as ground. */
export const BRIGHTNESS_THRESHOLD = 40;

const DDRAGON_BASE =
  process.env.NEXT_PUBLIC_DDRAGON_BASE || 'https://ddragon.leagueoflegends.com';

/**
 * Riot's public Data Dragon minimap for Summoner's Rift (map id 11).
 * It is fetched at runtime and is never stored in this repository.
 */
export async function getMapUrl(): Promise<string> {
  const pinned = process.env.NEXT_PUBLIC_DDRAGON_VERSION;
  let version = pinned;
  if (!version) {
    const res = await fetch(`${DDRAGON_BASE}/api/versions.json`);
    if (!res.ok) throw new Error(`Data Dragon versions request failed (${res.status})`);
    version = ((await res.json()) as string[])[0];
  }
  return `${DDRAGON_BASE}/cdn/${version}/img/map/map11.png`;
}

export const SPEED_PRESETS = [
  { label: 'Base 345', value: 345 },
  { label: 'Boots 390', value: 390 },
  { label: 'Swifties 410', value: 410 },
  { label: 'Ghost 520', value: 520 },
];
