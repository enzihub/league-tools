// Riot Data Dragon helpers.
//
// Champion data and art are NOT stored in this repo. They are fetched at
// runtime from Riot's public Data Dragon CDN, so every patch is picked up
// automatically and no Riot artwork is redistributed.

export const DDRAGON_BASE =
  process.env.NEXT_PUBLIC_DDRAGON_BASE || 'https://ddragon.leagueoflegends.com';
const PINNED_VERSION = process.env.NEXT_PUBLIC_DDRAGON_VERSION || '';
const LOCALE = process.env.NEXT_PUBLIC_DDRAGON_LOCALE || 'en_US';

// Cache Data Dragon responses for an hour on the server.
const CACHE = { next: { revalidate: 3600 } };

async function getJson(url) {
  const res = await fetch(url, CACHE);
  if (!res.ok) throw new Error(`Data Dragon request failed (${res.status}): ${url}`);
  return res.json();
}

/** Latest patch version, or the one pinned with NEXT_PUBLIC_DDRAGON_VERSION. */
export async function getVersion() {
  if (PINNED_VERSION) return PINNED_VERSION;
  const versions = await getJson(`${DDRAGON_BASE}/api/versions.json`);
  return versions[0];
}

/** All champions as a sorted array (summary data). */
export async function getAllChampions() {
  const version = await getVersion();
  const json = await getJson(`${DDRAGON_BASE}/cdn/${version}/data/${LOCALE}/champion.json`);
  const champions = Object.values(json.data).sort((a, b) => a.name.localeCompare(b.name));
  return { version, champions };
}

/** Full data for one champion (includes spells and passive), or null. */
export async function getChampion(id) {
  if (!/^[A-Za-z0-9]+$/.test(id)) return null;
  const version = await getVersion();
  const res = await fetch(
    `${DDRAGON_BASE}/cdn/${version}/data/${LOCALE}/champion/${id}.json`,
    CACHE
  );
  if (!res.ok) return null;
  const json = await res.json();
  return { version, champion: json.data[id] || null };
}

/** Unique role tags across champions. */
export function getUniqueTags(champions) {
  return Array.from(new Set(champions.flatMap((c) => c.tags))).sort();
}

export const img = {
  square: (version, file) => `${DDRAGON_BASE}/cdn/${version}/img/champion/${file}`,
  spell: (version, file) => `${DDRAGON_BASE}/cdn/${version}/img/spell/${file}`,
  passive: (version, file) => `${DDRAGON_BASE}/cdn/${version}/img/passive/${file}`,
  loading: (id, skin = 0) => `${DDRAGON_BASE}/cdn/img/champion/loading/${id}_${skin}.jpg`,
  splash: (id, skin = 0) => `${DDRAGON_BASE}/cdn/img/champion/splash/${id}_${skin}.jpg`,
};

/** Data Dragon descriptions contain light HTML markup; reduce it to text. */
export function stripTags(html = '') {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
